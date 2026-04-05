'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/AppShell';
import { authedGet, authedPatch, authedPost } from '../../lib/api';
import { getStoredSessionUser, loadApplications, loadOrganizations, type FosterApplicationRecord, type OrganizationNode } from '../../lib/portal-data';

type ApiApplication = {
  id: string;
  organizationId: string;
  organizationName: string;
  householdName: string;
  primaryApplicant: string;
  email?: string;
  phone?: string;
  assignedToUserId?: string | null;
  assignedToUserName?: string | null;
  stage: string;
  checklistProgress: number;
  checklistItems?: Array<{ id: string; label: string; requiresDocument?: boolean; requiredDocumentLabel?: string | null; completed: boolean; sortOrder: number; documents?: Array<{ id: string; title: string; fileName: string; notes?: string | null; createdAt: string }> }>;
  convertedToUserId?: string | null;
  convertedAt?: string | null;
  onboardingStatus?: string;
  onboardingStatusUpdatedAt?: string | null;
  timelineEvents?: Array<{ id: string; eventType: string; message: string; createdAt: string; createdByName?: string | null }>;
  submittedAt: string;
};

type ApiOrganization = {
  id: string;
  name: string;
  type: 'STATE_AGENCY' | 'COUNTY_AGENCY';
  parentOrganizationId?: string | null;
};

type AssignableUser = {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  roles: string[];
};

type QueueSummary = {
  totals: {
    total: number;
    approvalReady: number;
    approved: number;
    unassigned: number;
    overdue: number;
    watch: number;
    averageAgeDays: number;
    invited: number;
    activated: number;
    profileCompleted: number;
  };
  byCounty: Array<{ organizationId: string; organizationName: string; total: number; approvalReady: number; approved: number; unassigned: number; overdue: number; averageAgeDays: number; invited: number; activated: number; profileCompleted: number }>;
  byOwner: Array<{ ownerId: string | null; ownerName: string; total: number; approvalReady: number; approved: number; countyCount: number; overdue: number; averageAgeDays: number; invited: number; activated: number; profileCompleted: number }>;
};

function formatStageLabel(value: string) {
  return value.replace(/_/g, ' ');
}

function formatOnboardingLabel(value?: string | null) {
  return (value || 'NOT_STARTED').replace(/_/g, ' ');
}

function getStageBadgeStyle(stage: string) {
  switch (stage) {
    case 'APPROVED':
      return { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
    case 'READY_FOR_APPROVAL':
      return { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' };
    case 'MISSING_DOCUMENTS':
      return { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
    case 'HOME_STUDY':
    case 'TRAINING_REQUIRED':
      return { background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' };
    default:
      return { background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' };
  }
}

function getOnboardingBadgeStyle(status?: string | null) {
  switch (status) {
    case 'PROFILE_COMPLETED':
      return { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
    case 'ACCOUNT_ACTIVATED':
      return { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' };
    case 'INVITED':
      return { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
    default:
      return { background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb' };
  }
}

function getQueueAgeInDays(submittedAt: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24)));
}

function getSlaBadge(daysOpen: number) {
  if (daysOpen > 14) {
    return {
      label: `Overdue · ${daysOpen}d`,
      style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' },
    };
  }
  if (daysOpen >= 7) {
    return {
      label: `Watch · ${daysOpen}d`,
      style: { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' },
    };
  }
  return {
    label: `On track · ${daysOpen}d`,
    style: { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
  };
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [organizations, setOrganizations] = useState<ApiOrganization[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [queueSummary, setQueueSummary] = useState<QueueSummary | null>(null);
  const [selectedCountyId, setSelectedCountyId] = useState('all');
  const [selectedPreset, setSelectedPreset] = useState<'all' | 'my-queue' | 'unassigned' | 'overdue'>('all');
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeApplication, setActiveApplication] = useState<ApiApplication | null>(null);
  const [workflowDraft, setWorkflowDraft] = useState({
    stage: 'SUBMITTED',
    checklistProgress: 0,
    householdName: '',
    primaryApplicant: '',
    email: '',
    phone: '',
    assignedToUserId: '',
    onboardingStatus: 'NOT_STARTED',
    checklistItems: [] as Array<{ id: string; label: string; requiresDocument?: boolean; requiredDocumentLabel?: string | null; completed: boolean; sortOrder: number; documents?: Array<{ id: string; title: string; fileName: string; notes?: string | null; createdAt: string }> }>,
  });
  const [documentDrafts, setDocumentDrafts] = useState<Record<string, { title: string; fileName: string; notes: string }>>({});
  const sessionUser = getStoredSessionUser();
  const isCountyScopedUser = sessionUser?.organizationType?.toLowerCase() === 'county_agency';
  const [draft, setDraft] = useState({
    organizationId: '',
    assignedToUserId: '',
    householdName: '',
    primaryApplicant: '',
    email: '',
    phone: '',
    stage: 'SUBMITTED',
  });
  const [bulkDraft, setBulkDraft] = useState({ stage: '', assignedToUserId: '', onboardingStatus: '' });

  const applicationsFilterStorageKey = useMemo(() => {
    const userId = sessionUser?.id || 'anonymous';
    const organizationId = sessionUser?.organizationId || 'global';
    return `fosterhub.applications.filters:${userId}:${organizationId}`;
  }, [sessionUser?.id, sessionUser?.organizationId]);

  useEffect(() => {
    const token = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!token) {
      const fallbackApps = loadApplications().map(item => ({
        id: item.id,
        organizationId: item.countyId,
        organizationName: loadOrganizations().find(org => org.id === item.countyId)?.name ?? 'County',
        householdName: item.householdName,
        primaryApplicant: item.assignedTo,
        email: '',
        phone: '',
        stage: item.stage.toUpperCase().replace(/\s+/g, '_'),
        checklistProgress: item.checklistProgress,
        submittedAt: item.submittedAt,
      }));
      setApplications(fallbackApps);
      return;
    }

    async function load() {
      try {
        const [applicationResult, organizationResult, ownerResult, summaryResult] = await Promise.all([
          authedGet('/foster-applications', token),
          authedGet('/organizations/tree', token),
          authedGet('/foster-applications/assignable-users', token),
          authedGet('/foster-applications/queue-summary', token),
        ]);
        const orgs = (organizationResult.data as ApiOrganization[]).filter(item => item.type === 'COUNTY_AGENCY');
        setApplications(applicationResult.data || []);
        setOrganizations(orgs);
        setAssignableUsers(ownerResult.data || []);
        setQueueSummary(summaryResult.data || null);
        if (isCountyScopedUser) {
          setSelectedCountyId(sessionUser.organizationId || 'all');
          setDraft(current => ({ ...current, organizationId: sessionUser.organizationId || '' }));
        } else {
          setDraft(current => ({ ...current, organizationId: orgs[0]?.id || '' }));
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load applications');
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(applicationsFilterStorageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      setSelectedCountyId(parsed?.selectedCountyId || 'all');
      setSelectedPreset(parsed?.selectedPreset || 'all');
    } catch {
      setSelectedCountyId('all');
      setSelectedPreset('all');
    }
  }, [applicationsFilterStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(applicationsFilterStorageKey, JSON.stringify({
      selectedCountyId,
      selectedPreset,
    }));
  }, [applicationsFilterStorageKey, selectedCountyId, selectedPreset]);

  useEffect(() => {
    const countyStillExists = selectedCountyId === 'all' || organizations.some(county => county.id === selectedCountyId);
    if (!countyStillExists) setSelectedCountyId('all');
  }, [organizations, selectedCountyId]);

  const filtered = useMemo(() => {
    const ageInDays = (submittedAt: string) => Math.max(0, Math.floor((Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24)));
    return applications.filter(item => {
      const countyMatches = selectedCountyId === 'all' || item.organizationId === selectedCountyId;
      const presetMatches = selectedPreset === 'all'
        || (selectedPreset === 'my-queue' && (item.assignedToUserId || 'unassigned') === (sessionUser?.id || ''))
        || (selectedPreset === 'unassigned' && !item.assignedToUserId)
        || (selectedPreset === 'overdue' && ageInDays(item.submittedAt) > 14);
      return countyMatches && presetMatches;
    });
  }, [applications, selectedCountyId, selectedPreset, sessionUser?.id]);

  const totals = useMemo(() => ({
    total: filtered.length,
    approvalReady: filtered.filter(item => item.stage === 'READY_FOR_APPROVAL').length,
    approved: filtered.filter(item => item.stage === 'APPROVED').length,
    missingDocs: filtered.filter(item => item.stage === 'MISSING_DOCUMENTS').length,
  }), [filtered]);

  const selectedCountyName = useMemo(() => {
    if (selectedCountyId === 'all') return 'All counties';
    return organizations.find(county => county.id === selectedCountyId)?.name || 'Selected county';
  }, [organizations, selectedCountyId]);

  const scopeSummary = useMemo(() => {
    const presetLabel = selectedPreset === 'all'
      ? 'All applications'
      : selectedPreset === 'my-queue'
        ? 'My queue'
        : selectedPreset === 'unassigned'
          ? 'Unassigned'
          : 'Overdue';
    return `${presetLabel} · ${selectedCountyName}`;
  }, [selectedCountyName, selectedPreset]);

  const scopedAssignableUsers = useMemo(() => {
    const activeOrganizationId = selectedCountyId === 'all' ? sessionUser?.organizationId : selectedCountyId;
    if (!activeOrganizationId) return assignableUsers;
    return assignableUsers.filter(user => user.organizationId === activeOrganizationId);
  }, [assignableUsers, selectedCountyId, sessionUser?.organizationId]);

  const filteredQueueSummary = useMemo(() => {
    const ageInDays = (submittedAt: string) => Math.max(0, Math.floor((Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24)));
    const byCountyMap = new Map<string, any>();
    const byOwnerMap = new Map<string, any>();

    for (const application of filtered) {
      const daysOpen = ageInDays(application.submittedAt);
      const county = byCountyMap.get(application.organizationId) ?? { organizationId: application.organizationId, organizationName: application.organizationName, total: 0, approvalReady: 0, approved: 0, unassigned: 0, overdue: 0, averageAgeDays: 0, invited: 0, activated: 0, profileCompleted: 0, totalAgeDays: 0 };
      county.total += 1;
      county.totalAgeDays += daysOpen;
      if (application.stage === 'READY_FOR_APPROVAL') county.approvalReady += 1;
      if (application.stage === 'APPROVED') county.approved += 1;
      if (!application.assignedToUserId) county.unassigned += 1;
      if (daysOpen > 14) county.overdue += 1;
      if (application.onboardingStatus === 'INVITED') county.invited += 1;
      if (application.onboardingStatus === 'ACCOUNT_ACTIVATED') county.activated += 1;
      if (application.onboardingStatus === 'PROFILE_COMPLETED') county.profileCompleted += 1;
      byCountyMap.set(application.organizationId, county);

      const ownerKey = application.assignedToUserId || 'unassigned';
      const owner = byOwnerMap.get(ownerKey) ?? { ownerId: application.assignedToUserId || null, ownerName: application.assignedToUserName || 'Unassigned', total: 0, approvalReady: 0, approved: 0, countyCount: 0, overdue: 0, averageAgeDays: 0, invited: 0, activated: 0, profileCompleted: 0, totalAgeDays: 0 };
      owner.total += 1;
      owner.totalAgeDays += daysOpen;
      if (application.stage === 'READY_FOR_APPROVAL') owner.approvalReady += 1;
      if (application.stage === 'APPROVED') owner.approved += 1;
      if (daysOpen > 14) owner.overdue += 1;
      if (application.onboardingStatus === 'INVITED') owner.invited += 1;
      if (application.onboardingStatus === 'ACCOUNT_ACTIVATED') owner.activated += 1;
      if (application.onboardingStatus === 'PROFILE_COMPLETED') owner.profileCompleted += 1;
      byOwnerMap.set(ownerKey, owner);
    }

    return {
      byCounty: Array.from(byCountyMap.values()).map(item => ({ ...item, averageAgeDays: item.total ? Math.round(item.totalAgeDays / item.total) : 0 })),
      byOwner: Array.from(byOwnerMap.values()).map(item => ({ ...item, averageAgeDays: item.total ? Math.round(item.totalAgeDays / item.total) : 0 })),
    };
  }, [filtered]);

  useEffect(() => {
    if (!activeApplication) return;
    setWorkflowDraft({
      stage: activeApplication.stage,
      checklistProgress: activeApplication.checklistProgress,
      householdName: activeApplication.householdName,
      primaryApplicant: activeApplication.primaryApplicant,
      email: activeApplication.email || '',
      phone: activeApplication.phone || '',
      assignedToUserId: activeApplication.assignedToUserId || '',
      onboardingStatus: activeApplication.onboardingStatus || 'NOT_STARTED',
      checklistItems: activeApplication.checklistItems || [],
    });
  }, [activeApplication]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const targetApplicationId = new URLSearchParams(window.location.search).get('applicationId');
    if (!targetApplicationId || !applications.length) return;
    const target = applications.find(item => item.id === targetApplicationId);
    if (target) {
      setActiveApplication(target);
    }
  }, [applications]);

  async function refreshApplicationsData(token: string) {
    const [refreshed, summary] = await Promise.all([
      authedGet('/foster-applications', token),
      authedGet('/foster-applications/queue-summary', token),
    ]);
    setApplications(refreshed.data || []);
    setQueueSummary(summary.data || null);
  }

  async function handleCreateApplication() {
    const token = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!token) {
      setError('Login is required to persist applications to the backend.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await authedPost('/foster-applications', token, draft);
      await refreshApplicationsData(token);
      setDraft(current => ({ ...current, householdName: '', primaryApplicant: '', email: '', phone: '' }));
    } catch (err: any) {
      setError(err?.message || 'Failed to create application');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateWorkflow() {
    const token = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!token || !activeApplication) {
      setError('Login and a selected application are required to update workflow state.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const derivedProgress = workflowDraft.checklistItems.length
        ? Math.round((workflowDraft.checklistItems.filter(item => item.completed).length / workflowDraft.checklistItems.length) * 100)
        : workflowDraft.checklistProgress;
      await authedPatch(`/foster-applications/${activeApplication.id}`, token, {
        ...workflowDraft,
        checklistProgress: derivedProgress,
      });
      await refreshApplicationsData(token);
      closeApplicationModal();
    } catch (err: any) {
      setError(err?.message || 'Failed to update workflow');
    } finally {
      setSaving(false);
    }
  }

  function openApplicationModal(application: ApiApplication) {
    setActiveApplication(application);
    router.push(`/applications?applicationId=${application.id}`);
  }

  function closeApplicationModal() {
    setActiveApplication(null);
    router.push('/applications');
  }

  async function handleConvertToFosterParent(applicationId: string) {
    const token = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!token) {
      setError('Login is required to convert the application into a foster parent portal user.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await authedPost(`/foster-applications/${applicationId}/convert-to-foster-parent`, token, {});
      await refreshApplicationsData(token);
    } catch (err: any) {
      setError(err?.message || 'Failed to convert application to foster parent');
    } finally {
      setSaving(false);
    }
  }

  async function handleAttachChecklistDocument(checklistItemId: string) {
    const token = localStorage.getItem('fosterhub.dev.token') ?? '';
    const draft = documentDrafts[checklistItemId];
    if (!token || !activeApplication || !draft?.title || !draft?.fileName) {
      setError('A title and file name are required to attach a checklist document.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await authedPost(`/foster-applications/checklist-items/${checklistItemId}/documents`, token, {
        title: draft.title,
        fileName: draft.fileName,
        notes: draft.notes,
        contentType: 'application/pdf',
      });
      const refreshed = await authedGet('/foster-applications', token);
      setApplications(refreshed.data || []);
      const updated = (refreshed.data || []).find((item: ApiApplication) => item.id === activeApplication.id) || null;
      setActiveApplication(updated);
      setDocumentDrafts(current => ({ ...current, [checklistItemId]: { title: '', fileName: '', notes: '' } }));
    } catch (err: any) {
      setError(err?.message || 'Failed to attach checklist document');
    } finally {
      setSaving(false);
    }
  }

  function handleBulkUpdate() {
    if (!selectedApplicationIds.length) {
      setError('Select at least one application before using bulk actions.');
      return;
    }

    if (!bulkDraft.stage && !bulkDraft.assignedToUserId && !bulkDraft.onboardingStatus) {
      setError('Choose a stage, owner, or onboarding change before applying a bulk update.');
      return;
    }

    setError(null);
    setBulkConfirmOpen(true);
  }

  async function confirmBulkUpdate() {
    const token = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!token || !selectedApplicationIds.length) {
      setError('Select at least one application before using bulk actions.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await authedPost('/foster-applications/bulk-update', token, {
        ids: selectedApplicationIds,
        stage: bulkDraft.stage || undefined,
        assignedToUserId: bulkDraft.assignedToUserId || undefined,
        onboardingStatus: bulkDraft.onboardingStatus || undefined,
      });
      await refreshApplicationsData(token);
      setSelectedApplicationIds([]);
      setBulkDraft({ stage: '', assignedToUserId: '', onboardingStatus: '' });
      setBulkConfirmOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to apply bulk update');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Application management">
      <main className="page-stack">
        <section
          style={{
            padding: '4px 0 2px',
            borderBottom: '1px solid #e6eeea',
            marginBottom: 4,
          }}
        >
          <div className="actions-row" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'my-queue', label: 'My Queue' },
              { key: 'unassigned', label: 'Unassigned' },
              { key: 'overdue', label: 'Overdue' },
            ].map(preset => (
              <button
                key={preset.key}
                type="button"
                className={selectedPreset === preset.key ? 'button button-primary' : 'button button-ghost'}
                onClick={() => setSelectedPreset(preset.key as 'all' | 'my-queue' | 'unassigned' | 'overdue')}
              >
                {preset.label}
              </button>
            ))}
            {!isCountyScopedUser ? (
              <select className="select" value={selectedCountyId} onChange={e => setSelectedCountyId(e.target.value)} style={{ minWidth: 220, maxWidth: 280 }}>
                <option value="all">All counties</option>
                {organizations.map(county => (
                  <option key={county.id} value={county.id}>{county.name}</option>
                ))}
              </select>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 14px', borderRadius: 12, border: '1px solid #d9e5dd', background: '#f8fbf9', color: '#123122', fontWeight: 700 }}>
                {selectedCountyName}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: 999, background: '#eef6ff', color: '#10588c', fontSize: 12, fontWeight: 800 }}>
              {scopeSummary}
            </span>
            <span style={{ color: '#567060', fontSize: 13 }}>
              {filtered.length} visible application{filtered.length === 1 ? '' : 's'}
            </span>
          </div>
        </section>

        {error ? (
          <section className="notice notice-error">
            <strong>Application problem</strong>
            <p style={{ marginBottom: 0 }}>{error}</p>
          </section>
        ) : null}

        <section className="card card-muted">
          <div className="section-title">
            <div>
              <div className="eyebrow">Bulk actions</div>
              <h3 style={{ marginBottom: 0 }}>Update multiple applications at once</h3>
            </div>
            <div className="actions-row">
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setSelectedApplicationIds(selectedApplicationIds.length === filtered.length ? [] : filtered.map(item => item.id))}
              >
                {selectedApplicationIds.length === filtered.length && filtered.length ? 'Clear selection' : 'Select visible'}
              </button>
            </div>
          </div>
          <p style={{ marginTop: 0, color: '#567060' }}>
            Pick the records you want below, then apply a stage, owner, or onboarding update in one pass.
          </p>

          {selectedApplicationIds.length ? (
            <>
              <div style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: 999, background: '#123122', color: 'white', fontSize: 12, fontWeight: 800, marginBottom: 16 }}>
                {selectedApplicationIds.length} selected
              </div>
              <div className="grid">
                <div className="field">
                  <label>Bulk stage update</label>
                  <select className="select" value={bulkDraft.stage} onChange={e => setBulkDraft({ ...bulkDraft, stage: e.target.value })}>
                    <option value="">No stage change</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="MISSING_DOCUMENTS">Missing Documents</option>
                    <option value="TRAINING_REQUIRED">Training Required</option>
                    <option value="HOME_STUDY">Home Study</option>
                    <option value="READY_FOR_APPROVAL">Ready for Approval</option>
                    <option value="APPROVED">Approved</option>
                  </select>
                </div>
                <div className="field">
                  <label>Bulk owner update</label>
                  <select className="select" value={bulkDraft.assignedToUserId} onChange={e => setBulkDraft({ ...bulkDraft, assignedToUserId: e.target.value })}>
                    <option value="">No owner change</option>
                    {scopedAssignableUsers.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Bulk onboarding update</label>
                <select className="select" value={bulkDraft.onboardingStatus} onChange={e => setBulkDraft({ ...bulkDraft, onboardingStatus: e.target.value })}>
                  <option value="">No onboarding change</option>
                  <option value="INVITED">Invited</option>
                  <option value="ACCOUNT_ACTIVATED">Account Activated</option>
                  <option value="PROFILE_COMPLETED">Profile Completed</option>
                </select>
              </div>
              <div className="actions-row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="button button-primary" onClick={handleBulkUpdate} disabled={saving || !selectedApplicationIds.length}>
                  Review bulk update
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ marginTop: 12 }}>
              <strong>No applications selected yet.</strong>
              <p style={{ marginBottom: 0 }}>Use the checkboxes in the pipeline below to start a bulk update.</p>
            </div>
          )}
        </section>

        <section className="grid">
          <article className="card kpi">
            <span className="kpi-label">Applications in pipeline</span>
            <span className="kpi-value">{queueSummary?.totals.total ?? totals.total}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Ready for approval</span>
            <span className="kpi-value">{queueSummary?.totals.approvalReady ?? totals.approvalReady}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Approved and ready to convert</span>
            <span className="kpi-value">{queueSummary?.totals.approved ?? totals.approved}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Unassigned applications</span>
            <span className="kpi-value">{queueSummary?.totals.unassigned ?? 0}</span>
          </article>
        </section>

        {queueSummary ? (
          <section className="grid">
            <article className="card kpi">
              <span className="kpi-label">Average age</span>
              <span className="kpi-value">{queueSummary.totals.averageAgeDays}d</span>
            </article>
            <article className="card kpi">
              <span className="kpi-label">Watch list (7-14d)</span>
              <span className="kpi-value">{queueSummary.totals.watch}</span>
            </article>
            <article className="card kpi">
              <span className="kpi-label">Overdue (&gt;14d)</span>
              <span className="kpi-value">{queueSummary.totals.overdue}</span>
            </article>
            <article className="card">
              <div className="eyebrow">SLA lens</div>
              <p style={{ marginBottom: 0 }}>On track is under 7 days, watch is 7 to 14 days, and overdue is more than 14 days in queue.</p>
            </article>
          </section>
        ) : null}

        {queueSummary ? (
          <section className="grid">
            <article className="card">
              <div className="section-title">
                <div>
                  <div className="eyebrow">Queue by county</div>
                  <h3 style={{ marginBottom: 0 }}>County workload</h3>
                </div>
              </div>
              <div className="record-list">
                {filteredQueueSummary.byCounty.map(county => (
                  <div key={county.organizationId} className="record-item">
                    <strong>{county.organizationName}</strong>
                    <div className="record-meta">
                      <span>{county.total} total</span>
                      <span>{county.approvalReady} ready</span>
                      <span>{county.approved} approved</span>
                      <span>{county.unassigned} unassigned</span>
                      <span>{county.overdue} overdue</span>
                      <span>{county.averageAgeDays}d avg age</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="card card-muted">
              <div className="section-title">
                <div>
                  <div className="eyebrow">Queue by owner</div>
                  <h3 style={{ marginBottom: 0 }}>Owner workload</h3>
                </div>
              </div>
              <div className="record-list">
                {filteredQueueSummary.byOwner.map(owner => (
                  <div key={owner.ownerId || 'unassigned'} className="record-item">
                    <strong>{owner.ownerName}</strong>
                    <div className="record-meta">
                      <span>{owner.total} total</span>
                      <span>{owner.approvalReady} ready</span>
                      <span>{owner.approved} approved</span>
                      <span>{owner.overdue} overdue</span>
                      <span>{owner.averageAgeDays}d avg age</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        ) : null}

        <section className="card card-muted" style={{ padding: 24 }}>
          <div className="section-title">
            <div>
              <div className="eyebrow">Backend persistence</div>
              <h3 style={{ marginBottom: 0 }}>Create a new foster parent application</h3>
            </div>
          </div>
          <div className="form-grid">
            {!isCountyScopedUser ? (
              <div className="field">
                <label>County</label>
                <select className="select" value={draft.organizationId} onChange={e => setDraft({ ...draft, organizationId: e.target.value })}>
                  {organizations.map(county => (
                    <option key={county.id} value={county.id}>{county.name}</option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="field">
              <label>Household</label>
              <input className="input" value={draft.householdName} onChange={e => setDraft({ ...draft, householdName: e.target.value })} />
            </div>
            <div className="field">
              <label>Primary applicant</label>
              <input className="input" value={draft.primaryApplicant} onChange={e => setDraft({ ...draft, primaryApplicant: e.target.value })} />
            </div>
            <div className="grid">
              <div className="field">
                <label>Email</label>
                <input className="input" value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} />
              </div>
              <div className="field">
                <label>Phone</label>
                <input className="input" value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Owner</label>
              <select className="select" value={draft.assignedToUserId} onChange={e => setDraft({ ...draft, assignedToUserId: e.target.value })}>
                <option value="">Unassigned</option>
                {(draft.organizationId
                  ? assignableUsers.filter(user => user.organizationId === draft.organizationId)
                  : scopedAssignableUsers
                ).map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            <div className="actions-row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="button button-primary" onClick={handleCreateApplication} disabled={saving}>
                {saving ? 'Saving…' : 'Create application'}
              </button>
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: 24 }}>
          <div className="section-title">
            <div>
              <div className="eyebrow">Applicant pipeline</div>
              <h2 style={{ marginBottom: 0 }}>Prospective foster parents</h2>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: 999, background: '#f3f4f6', color: '#374151', fontSize: 12, fontWeight: 800 }}>
              {filtered.length} in view
            </span>
          </div>

          <div className="record-list">
            {!filtered.length ? (
              <div className="empty-state">
                <strong>No applications match this view.</strong>
                <p style={{ marginBottom: 0 }}>Try a different queue preset or county context to widen the results.</p>
              </div>
            ) : null}
            {filtered.map(application => {
              const stageBadgeStyle = getStageBadgeStyle(application.stage);
              const onboardingBadgeStyle = getOnboardingBadgeStyle(application.onboardingStatus);
              const daysOpen = getQueueAgeInDays(application.submittedAt);
              const slaBadge = getSlaBadge(daysOpen);
              return (
                <article key={application.id} className="record-item" style={{ borderRadius: 20, border: '1px solid #d9e5dd', padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={selectedApplicationIds.includes(application.id)}
                        onChange={event => setSelectedApplicationIds(current => event.target.checked ? [...current, application.id] : current.filter(id => id !== application.id))}
                        style={{ marginTop: 14 }}
                      />
                      <button
                        type="button"
                        onClick={() => openApplicationModal(application)}
                        style={{ minWidth: 0, flex: 1, textAlign: 'left', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 18, color: '#123122' }}>{application.householdName}</strong>
                          <span style={{ ...stageBadgeStyle, display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
                            {formatStageLabel(application.stage)}
                          </span>
                          <span style={{ ...slaBadge.style, display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
                            {slaBadge.label}
                          </span>
                          {application.convertedToUserId ? (
                            <span style={{ ...onboardingBadgeStyle, display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
                              Onboarding: {formatOnboardingLabel(application.onboardingStatus)}
                            </span>
                          ) : null}
                        </div>
                        <div className="record-meta" style={{ marginTop: 8 }}>
                          <span>{application.organizationName}</span>
                          <span>{application.primaryApplicant}</span>
                          <span>{application.assignedToUserName ? `Owner: ${application.assignedToUserName}` : 'Owner: Unassigned'}</span>
                          <span>Submitted {new Date(application.submittedAt).toLocaleDateString()}</span>
                          <span style={{ color: '#10588c', fontWeight: 700 }}>Open application details</span>
                        </div>
                      </button>
                    </div>
                    <button type="button" className="button button-ghost" onClick={() => openApplicationModal(application)}>
                      Open application
                    </button>
                  </div>
                  <div className="grid" style={{ marginTop: 18 }}>
                    <div className="card card-muted" style={{ padding: 18 }}>
                      <div className="eyebrow">Checklist progress</div>
                      <strong>{application.checklistProgress}% complete</strong>
                      <p style={{ marginBottom: 0 }}>
                        {application.stage === 'READY_FOR_APPROVAL'
                          ? 'This record looks close to approval. Review final requirements and ownership before moving it forward.'
                          : application.stage === 'MISSING_DOCUMENTS'
                            ? 'Missing requirements still need attention before this application can move forward.'
                            : 'Use workflow updates to keep stage movement aligned with actual requirement completion.'}
                      </p>
                    </div>
                    <div className="card card-muted" style={{ padding: 18 }}>
                      <div className="eyebrow">Contact</div>
                      <strong>{application.email || 'No email yet'}</strong>
                      <p style={{ marginBottom: 0 }}>{application.phone || 'No phone yet'}</p>
                    </div>
                  </div>
                  <div className="actions-row" style={{ justifyContent: 'space-between', marginTop: 18, alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ color: '#567060', fontSize: 13 }}>
                      {application.convertedToUserId ? 'Application has been converted into a foster parent portal account.' : 'Not yet converted to foster parent portal.'}
                    </div>
                    <div className="actions-row" style={{ justifyContent: 'flex-end' }}>
                      {application.stage === 'APPROVED' ? (
                        application.convertedToUserId ? (
                          <span className="button button-ghost" style={{ cursor: 'default' }}>Converted to foster parent portal</span>
                        ) : (
                          <button type="button" className="button button-primary" onClick={() => handleConvertToFosterParent(application.id)} disabled={saving}>
                            Convert to foster parent
                          </button>
                        )
                      ) : null}
                      <button type="button" className="button button-secondary" onClick={() => openApplicationModal(application)}>
                        Update workflow
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {bulkConfirmOpen ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.35)',
              display: 'grid',
              placeItems: 'center',
              padding: 24,
              zIndex: 60,
            }}
            onClick={() => setBulkConfirmOpen(false)}
          >
            <section className="card" style={{ width: 'min(100%, 640px)', padding: 24 }} onClick={event => event.stopPropagation()}>
              <div className="section-title">
                <div>
                  <div className="eyebrow">Confirm bulk update</div>
                  <h2 style={{ marginBottom: 0 }}>{selectedApplicationIds.length} applications selected</h2>
                </div>
              </div>
              <div className="record-list">
                <div className="record-item" style={{ background: '#f8fbf9' }}>
                  <strong>Impact summary</strong>
                  <div className="record-meta">
                    <span>{selectedApplicationIds.length} applications selected</span>
                    <span>{filtered.filter(item => selectedApplicationIds.includes(item.id)).length} visible in current filtered view</span>
                    <span>{scopeSummary}</span>
                  </div>
                </div>
                {bulkDraft.stage ? (
                  <div className="record-item">
                    <strong>Stage update</strong>
                    <p style={{ marginBottom: 0 }}>Set all selected records to <strong>{formatStageLabel(bulkDraft.stage)}</strong>.</p>
                  </div>
                ) : null}
                {bulkDraft.assignedToUserId ? (
                  <div className="record-item">
                    <strong>Owner update</strong>
                    <p style={{ marginBottom: 0 }}>Assign selected records to <strong>{assignableUsers.find(user => user.id === bulkDraft.assignedToUserId)?.name || 'Selected owner'}</strong>.</p>
                  </div>
                ) : null}
                {bulkDraft.onboardingStatus ? (
                  <div className="record-item">
                    <strong>Onboarding update</strong>
                    <p style={{ marginBottom: 0 }}>Set foster parent onboarding to <strong>{formatOnboardingLabel(bulkDraft.onboardingStatus)}</strong>.</p>
                  </div>
                ) : null}
              </div>
              <div className="actions-row" style={{ justifyContent: 'flex-end', marginTop: 22 }}>
                <button type="button" className="button button-ghost" onClick={() => setBulkConfirmOpen(false)}>Cancel</button>
                <button type="button" className="button button-primary" onClick={confirmBulkUpdate} disabled={saving}>
                  {saving ? 'Applying…' : 'Confirm bulk update'}
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {activeApplication ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.35)',
              display: 'grid',
              placeItems: 'center',
              padding: 24,
              zIndex: 60,
            }}
            onClick={closeApplicationModal}
          >
            <section className="card" style={{ width: 'min(100%, 760px)', maxHeight: '88vh', overflow: 'auto', padding: 24 }} onClick={event => event.stopPropagation()}>
              <div className="section-title" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div className="eyebrow">Workflow editor</div>
                  <h2 style={{ marginBottom: 0 }}>{activeApplication.householdName}</h2>
                </div>
                <button type="button" className="button button-ghost" onClick={closeApplicationModal}>Close</button>
              </div>
              <div className="form-grid">
                <section className="card" style={{ padding: 18, border: '1px solid #d9e5dd', background: '#fcfdfc' }}>
                  <div className="section-title">
                    <div>
                      <div className="eyebrow">Application summary</div>
                      <h3 style={{ marginBottom: 0 }}>Current record snapshot</h3>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                    <span style={{ ...getStageBadgeStyle(activeApplication.stage), display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
                      {formatStageLabel(activeApplication.stage)}
                    </span>
                    {activeApplication.convertedToUserId ? (
                      <span style={{ ...getOnboardingBadgeStyle(activeApplication.onboardingStatus), display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
                        Onboarding: {formatOnboardingLabel(activeApplication.onboardingStatus)}
                      </span>
                    ) : null}
                  </div>
                  <div className="record-meta" style={{ display: 'grid', gap: 8 }}>
                    <span><strong>County:</strong> {activeApplication.organizationName}</span>
                    <span><strong>Primary applicant:</strong> {activeApplication.primaryApplicant}</span>
                    <span><strong>Owner:</strong> {activeApplication.assignedToUserName || 'Unassigned'}</span>
                    <span><strong>Submitted:</strong> {new Date(activeApplication.submittedAt).toLocaleString()}</span>
                  </div>
                </section>

                <section className="card card-muted" style={{ padding: 18 }}>
                  <div className="section-title">
                    <div>
                      <div className="eyebrow">Workflow status</div>
                      <h3 style={{ marginBottom: 0 }}>Stage, ownership, and onboarding</h3>
                    </div>
                  </div>
                  <div className="grid">
                    <div className="field">
                      <label>Stage</label>
                      <select className="select" value={workflowDraft.stage} onChange={e => setWorkflowDraft({ ...workflowDraft, stage: e.target.value })}>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="MISSING_DOCUMENTS">Missing Documents</option>
                        <option value="TRAINING_REQUIRED">Training Required</option>
                        <option value="HOME_STUDY">Home Study</option>
                        <option value="READY_FOR_APPROVAL">Ready for Approval</option>
                        <option value="APPROVED">Approved</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Checklist progress</label>
                      <div className="input">
                        {workflowDraft.checklistItems.length
                          ? `${Math.round((workflowDraft.checklistItems.filter(item => item.completed).length / workflowDraft.checklistItems.length) * 100)}% complete`
                          : `${workflowDraft.checklistProgress}% complete`}
                      </div>
                    </div>
                  </div>
                  <div className="field">
                    <label>Owner</label>
                    <select className="select" value={workflowDraft.assignedToUserId} onChange={e => setWorkflowDraft({ ...workflowDraft, assignedToUserId: e.target.value })}>
                      <option value="">Unassigned</option>
                      {assignableUsers
                        .filter(user => !activeApplication || user.organizationId === activeApplication.organizationId)
                        .map(user => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                  </div>

                  {activeApplication.convertedToUserId ? (
                    <div className="field">
                      <label>Foster parent onboarding status</label>
                      <select className="select" value={workflowDraft.onboardingStatus} onChange={e => setWorkflowDraft({ ...workflowDraft, onboardingStatus: e.target.value })}>
                        <option value="INVITED">Invited</option>
                        <option value="ACCOUNT_ACTIVATED">Account Activated</option>
                        <option value="PROFILE_COMPLETED">Profile Completed</option>
                      </select>
                    </div>
                  ) : null}
                </section>

                <section className="card card-muted" style={{ padding: 18 }}>
                  <div className="section-title">
                    <div>
                      <div className="eyebrow">Applicant details</div>
                      <h3 style={{ marginBottom: 0 }}>Household and contact information</h3>
                    </div>
                  </div>
                  <div className="grid">
                    <div className="field">
                      <label>Household</label>
                      <input className="input" value={workflowDraft.householdName} onChange={e => setWorkflowDraft({ ...workflowDraft, householdName: e.target.value })} />
                    </div>
                    <div className="field">
                      <label>Primary applicant</label>
                      <input className="input" value={workflowDraft.primaryApplicant} onChange={e => setWorkflowDraft({ ...workflowDraft, primaryApplicant: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid">
                    <div className="field">
                      <label>Email</label>
                      <input className="input" value={workflowDraft.email} onChange={e => setWorkflowDraft({ ...workflowDraft, email: e.target.value })} />
                    </div>
                    <div className="field">
                      <label>Phone</label>
                      <input className="input" value={workflowDraft.phone} onChange={e => setWorkflowDraft({ ...workflowDraft, phone: e.target.value })} />
                    </div>
                  </div>
                </section>

                <section className="card card-muted" style={{ padding: 18 }}>
                  <div className="section-title">
                    <div>
                      <div className="eyebrow">Checklist items</div>
                      <h3 style={{ marginBottom: 0 }}>Requirement tracking</h3>
                    </div>
                  </div>
                  <div className="record-list">
                    {workflowDraft.checklistItems.map((item, index) => (
                      <div key={item.id || index} className="record-item">
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
                          <span>{item.label}</span>
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={e => setWorkflowDraft({
                              ...workflowDraft,
                              checklistItems: workflowDraft.checklistItems.map((entry, entryIndex) => entryIndex === index ? { ...entry, completed: e.target.checked } : entry),
                            })}
                          />
                        </label>

                        <div className="record-meta" style={{ marginTop: 10, display: 'grid', gap: 6 }}>
                          {item.requiresDocument ? (
                            <span>Required document: {item.requiredDocumentLabel || 'Document required before completion'}</span>
                          ) : (
                            <span>No required document rule for this checklist item.</span>
                          )}
                          {(item.documents || []).length ? (
                            (item.documents || []).map(document => (
                              <span key={document.id}>Attached: {document.title} · {document.fileName}</span>
                            ))
                          ) : (
                            <span>No checklist documents attached yet.</span>
                          )}
                        </div>

                        <div className="grid" style={{ marginTop: 12 }}>
                          <input
                            className="input"
                            placeholder="Document title"
                            value={documentDrafts[item.id]?.title || ''}
                            onChange={e => setDocumentDrafts(current => ({ ...current, [item.id]: { ...current[item.id], title: e.target.value, fileName: current[item.id]?.fileName || '', notes: current[item.id]?.notes || '' } }))}
                          />
                          <input
                            className="input"
                            placeholder="File name"
                            value={documentDrafts[item.id]?.fileName || ''}
                            onChange={e => setDocumentDrafts(current => ({ ...current, [item.id]: { ...current[item.id], title: current[item.id]?.title || '', fileName: e.target.value, notes: current[item.id]?.notes || '' } }))}
                          />
                        </div>
                        <textarea
                          className="input"
                          placeholder="Notes about this checklist document"
                          value={documentDrafts[item.id]?.notes || ''}
                          onChange={e => setDocumentDrafts(current => ({ ...current, [item.id]: { ...current[item.id], title: current[item.id]?.title || '', fileName: current[item.id]?.fileName || '', notes: e.target.value } }))}
                          style={{ marginTop: 12, minHeight: 90 }}
                        />
                        <div className="actions-row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
                          <button type="button" className="button button-ghost" onClick={() => handleAttachChecklistDocument(item.id)} disabled={saving}>
                            Attach document
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="card card-muted" style={{ padding: 18 }}>
                  <div className="section-title">
                    <div>
                      <div className="eyebrow">Timeline</div>
                      <h3 style={{ marginBottom: 0 }}>Application history</h3>
                    </div>
                  </div>
                  <div className="record-list">
                    {(activeApplication.timelineEvents || []).length ? (
                      activeApplication.timelineEvents?.map(event => (
                        <div key={event.id} className="record-item">
                          <strong>{event.message}</strong>
                          <div className="record-meta">
                            <span>{event.eventType.replace(/_/g, ' ')}</span>
                            <span>{new Date(event.createdAt).toLocaleString()}</span>
                            <span>{event.createdByName || 'System'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <strong>No timeline events yet.</strong>
                        <p style={{ marginBottom: 0 }}>New workflow actions will appear here.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
              <div className="actions-row" style={{ justifyContent: 'flex-end', marginTop: 22, position: 'sticky', bottom: -24, background: 'rgba(255,255,255,0.96)', paddingTop: 16, borderTop: '1px solid #eef3ef' }}>
                <button type="button" className="button button-ghost" onClick={closeApplicationModal}>Cancel</button>
                <button type="button" className="button button-primary" onClick={handleUpdateWorkflow} disabled={saving}>
                  {saving ? 'Saving…' : 'Save workflow'}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </AppShell>
  );
}
