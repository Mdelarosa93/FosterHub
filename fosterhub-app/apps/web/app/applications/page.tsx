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
        if (sessionUser?.organizationType === 'county_agency') {
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
    <AppShell
      title="Application management"
      headerActions={
        <div className="actions-row" style={{ flexWrap: 'wrap' }}>
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
          <select className="select" value={selectedCountyId} onChange={e => setSelectedCountyId(e.target.value)} style={{ maxWidth: 260 }}>
            <option value="all">All counties</option>
            {organizations.map(county => (
              <option key={county.id} value={county.id}>{county.name}</option>
            ))}
          </select>
        </div>
      }
    >
      <main className="page-stack">
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
              <h3 style={{ marginBottom: 0 }}>{selectedApplicationIds.length} selected</h3>
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
                {assignableUsers
                  .filter(user => selectedCountyId === 'all' || user.organizationId === selectedCountyId)
                  .map(user => (
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

        <section className="card card-muted">
          <div className="section-title">
            <div>
              <div className="eyebrow">Backend persistence</div>
              <h3 style={{ marginBottom: 0 }}>Create a new foster parent application</h3>
            </div>
          </div>
          <div className="form-grid">
            {sessionUser?.organizationType !== 'county_agency' ? (
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
                {assignableUsers
                  .filter(user => !draft.organizationId || user.organizationId === draft.organizationId)
                  .map(user => (
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

        <section className="card">
          <div className="section-title">
            <div>
              <div className="eyebrow">Applicant pipeline</div>
              <h2 style={{ marginBottom: 0 }}>Prospective foster parents</h2>
            </div>
          </div>

          <div className="record-list">
            {filtered.map(application => (
              <article key={application.id} className="record-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <input
                      type="checkbox"
                      checked={selectedApplicationIds.includes(application.id)}
                      onChange={event => setSelectedApplicationIds(current => event.target.checked ? [...current, application.id] : current.filter(id => id !== application.id))}
                      style={{ marginTop: 4 }}
                    />
                    <div>
                    <strong>{application.householdName}</strong>
                    <div className="record-meta">
                      <span>{application.organizationName}</span>
                      <span>{application.primaryApplicant}</span>
                      <span>{application.assignedToUserName ? `Owner: ${application.assignedToUserName}` : 'Owner: Unassigned'}</span>
                      {application.convertedToUserId ? <span>Onboarding: {(application.onboardingStatus || 'NOT_STARTED').replace(/_/g, ' ')}</span> : null}
                      <span>Submitted {new Date(application.submittedAt).toLocaleDateString()}</span>
                    </div>
                    </div>
                  </div>
                  <span className="status-pill">{application.stage.replace(/_/g, ' ')}</span>
                </div>
                <div className="grid" style={{ marginTop: 18 }}>
                  <div className="card card-muted" style={{ padding: 18 }}>
                    <div className="eyebrow">Checklist</div>
                    <strong>{application.checklistProgress}% complete</strong>
                    <p style={{ marginBottom: 0 }}>This record is now coming from the real backend instead of local-only prototype data.</p>
                  </div>
                  <div className="card card-muted" style={{ padding: 18 }}>
                    <div className="eyebrow">Contact</div>
                    <strong>{application.email || 'No email yet'}</strong>
                    <p style={{ marginBottom: 0 }}>{application.phone || 'No phone yet'}</p>
                  </div>
                </div>
                <div className="actions-row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
                  {application.stage === 'APPROVED' ? (
                    application.convertedToUserId ? (
                      <span className="button button-ghost" style={{ cursor: 'default' }}>Converted to foster parent portal</span>
                    ) : (
                      <button type="button" className="button button-primary" onClick={() => handleConvertToFosterParent(application.id)} disabled={saving}>
                        Convert to foster parent
                      </button>
                    )
                  ) : null}
                  <button type="button" className="button button-ghost" onClick={() => openApplicationModal(application)}>
                    Update workflow
                  </button>
                </div>
              </article>
            ))}
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
                {bulkDraft.stage ? (
                  <div className="record-item">
                    <strong>Stage update</strong>
                    <p style={{ marginBottom: 0 }}>{bulkDraft.stage.replace(/_/g, ' ')}</p>
                  </div>
                ) : null}
                {bulkDraft.assignedToUserId ? (
                  <div className="record-item">
                    <strong>Owner update</strong>
                    <p style={{ marginBottom: 0 }}>{assignableUsers.find(user => user.id === bulkDraft.assignedToUserId)?.name || 'Selected owner'}</p>
                  </div>
                ) : null}
                {bulkDraft.onboardingStatus ? (
                  <div className="record-item">
                    <strong>Onboarding update</strong>
                    <p style={{ marginBottom: 0 }}>{bulkDraft.onboardingStatus.replace(/_/g, ' ')}</p>
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
              <div className="section-title">
                <div>
                  <div className="eyebrow">Workflow editor</div>
                  <h2 style={{ marginBottom: 0 }}>{activeApplication.householdName}</h2>
                </div>
              </div>
              <div className="form-grid">
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
              <div className="actions-row" style={{ justifyContent: 'flex-end', marginTop: 22 }}>
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
