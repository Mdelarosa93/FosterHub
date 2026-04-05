'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { authedGet, authedPost } from '../../lib/api';
import { AppShell } from '../../components/AppShell';
import { loadApplications, loadOrganizations, loadSurveys, loadVendors } from '../../lib/portal-data';

type DashboardState = {
  user: any;
  permissions: string[];
  summary: {
    assignedCases: number;
    assignedIntakeRecords: number;
    pendingRequests: number;
  } | null;
  queueSummary: {
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
  } | null;
  myCases: Array<{
    assignmentId: string;
    roleLabel: string;
    caseId: string;
    caseStatus: string;
    childFirstName: string;
    childLastName: string;
  }>;
  pendingRequests: Array<{
    id: string;
    title: string;
    status: string;
    caseId: string;
    childFirstName: string;
    childLastName: string;
  }>;
  reminders: Array<{
    id: string;
    reminderType: string;
    message: string;
    createdAt: string;
    householdName: string;
    organizationName: string;
    applicationId: string;
    recipientName: string;
  }>;
  applications: Array<{
    id: string;
    organizationId: string;
    organizationName: string;
    assignedToUserId?: string | null;
    assignedToUserName?: string | null;
    stage: string;
    onboardingStatus?: string;
    submittedAt: string;
  }>;
};

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState | null>(null);
  const [storedFirstName, setStoredFirstName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [dismissingReminderId, setDismissingReminderId] = useState<string | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState('all');
  const [selectedCountyId, setSelectedCountyId] = useState('all');
  const [selectedPreset, setSelectedPreset] = useState<'all' | 'my-queue' | 'unassigned' | 'overdue'>('all');

  useEffect(() => {
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) {
      setError('No token found. Please log in first.');
      return;
    }

    try {
      const rawUser = localStorage.getItem('fosterhub.dev.user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        setStoredFirstName(parsed?.firstName?.trim() ?? '');
      }
    } catch {
      setStoredFirstName('');
    }

    async function load() {
      try {
        try {
          await authedPost('/foster-applications/reminders/sync', authToken, {});
        } catch {
          // ignore if the active role can view but not manage application reminders
        }

        const [me, permissions, summary, myCases, pendingRequests, queueSummary, reminders, applications] = await Promise.all([
          authedGet('/auth/me', authToken),
          authedGet('/auth/my-permissions', authToken),
          authedGet('/worker-dashboard/summary', authToken),
          authedGet('/worker-dashboard/my-cases', authToken),
          authedGet('/worker-dashboard/pending-requests', authToken),
          authedGet('/foster-applications/queue-summary', authToken),
          authedGet('/foster-applications/reminders', authToken),
          authedGet('/foster-applications', authToken),
        ]);

        setState({
          user: me.data,
          permissions: permissions.data,
          summary: summary.data,
          queueSummary: queueSummary.data || null,
          myCases: myCases.data || [],
          pendingRequests: pendingRequests.data || [],
          reminders: reminders.data || [],
          applications: applications.data || [],
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard');
      }
    }

    load();
  }, []);

  const title = useMemo(() => {
    const firstName = state?.user?.firstName?.trim() || storedFirstName;
    return firstName ? `Welcome back, ${firstName}!` : 'Welcome back!';
  }, [state, storedFirstName]);

  async function handleDismissReminder(reminderId: string) {
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) return;

    try {
      setDismissingReminderId(reminderId);
      await authedPost(`/foster-applications/reminders/${reminderId}/dismiss`, authToken, {});
      const reminders = await authedGet('/foster-applications/reminders', authToken);
      setState(current => current ? { ...current, reminders: reminders.data || [] } : current);
    } catch (err: any) {
      setError(err?.message || 'Failed to dismiss reminder');
    } finally {
      setDismissingReminderId(null);
    }
  }

  const filteredQueueSummary = useMemo(() => {
    if (!state?.applications?.length) return state?.queueSummary ?? null;

    const ageInDays = (submittedAt: string) => Math.max(0, Math.floor((Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24)));

    const applications = state.applications.filter(item => {
      const ownerMatches = selectedOwnerId === 'all' || (item.assignedToUserId || 'unassigned') === selectedOwnerId;
      const countyMatches = selectedCountyId === 'all' || item.organizationId === selectedCountyId;
      const presetMatches = selectedPreset === 'all'
        || (selectedPreset === 'my-queue' && (item.assignedToUserId || 'unassigned') === (state.user?.id || ''))
        || (selectedPreset === 'unassigned' && !item.assignedToUserId)
        || (selectedPreset === 'overdue' && ageInDays(item.submittedAt) > 14);
      return ownerMatches && countyMatches && presetMatches;
    });
    const byCountyMap = new Map<string, any>();
    const byOwnerMap = new Map<string, any>();

    for (const application of applications) {
      const daysOpen = ageInDays(application.submittedAt);
      const overdue = daysOpen > 14;
      const county = byCountyMap.get(application.organizationId) ?? {
        organizationId: application.organizationId,
        organizationName: application.organizationName,
        total: 0,
        approvalReady: 0,
        approved: 0,
        unassigned: 0,
        overdue: 0,
        averageAgeDays: 0,
        totalAgeDays: 0,
        invited: 0,
        activated: 0,
        profileCompleted: 0,
      };
      county.total += 1;
      county.totalAgeDays += daysOpen;
      if (application.stage === 'READY_FOR_APPROVAL') county.approvalReady += 1;
      if (application.stage === 'APPROVED') county.approved += 1;
      if (!application.assignedToUserId) county.unassigned += 1;
      if (overdue) county.overdue += 1;
      if (application.onboardingStatus === 'INVITED') county.invited += 1;
      if (application.onboardingStatus === 'ACCOUNT_ACTIVATED') county.activated += 1;
      if (application.onboardingStatus === 'PROFILE_COMPLETED') county.profileCompleted += 1;
      byCountyMap.set(application.organizationId, county);

      const ownerKey = application.assignedToUserId || 'unassigned';
      const owner = byOwnerMap.get(ownerKey) ?? {
        ownerId: application.assignedToUserId || null,
        ownerName: application.assignedToUserName || 'Unassigned',
        total: 0,
        approvalReady: 0,
        approved: 0,
        countyCount: 0,
        overdue: 0,
        averageAgeDays: 0,
        totalAgeDays: 0,
        invited: 0,
        activated: 0,
        profileCompleted: 0,
      };
      owner.total += 1;
      owner.totalAgeDays += daysOpen;
      if (application.stage === 'READY_FOR_APPROVAL') owner.approvalReady += 1;
      if (application.stage === 'APPROVED') owner.approved += 1;
      if (overdue) owner.overdue += 1;
      if (application.onboardingStatus === 'INVITED') owner.invited += 1;
      if (application.onboardingStatus === 'ACCOUNT_ACTIVATED') owner.activated += 1;
      if (application.onboardingStatus === 'PROFILE_COMPLETED') owner.profileCompleted += 1;
      byOwnerMap.set(ownerKey, owner);
    }

    const byCounty = Array.from(byCountyMap.values()).map(item => ({ ...item, averageAgeDays: item.total ? Math.round(item.totalAgeDays / item.total) : 0 }));
    const byOwner = Array.from(byOwnerMap.values()).map(item => ({ ...item, averageAgeDays: item.total ? Math.round(item.totalAgeDays / item.total) : 0 }));

    return {
      totals: {
        total: applications.length,
        approvalReady: applications.filter(item => item.stage === 'READY_FOR_APPROVAL').length,
        approved: applications.filter(item => item.stage === 'APPROVED').length,
        unassigned: applications.filter(item => !item.assignedToUserId).length,
        overdue: applications.filter(item => ageInDays(item.submittedAt) > 14).length,
        watch: applications.filter(item => { const age = ageInDays(item.submittedAt); return age >= 7 && age <= 14; }).length,
        averageAgeDays: applications.length ? Math.round(applications.reduce((sum, item) => sum + ageInDays(item.submittedAt), 0) / applications.length) : 0,
        invited: applications.filter(item => item.onboardingStatus === 'INVITED').length,
        activated: applications.filter(item => item.onboardingStatus === 'ACCOUNT_ACTIVATED').length,
        profileCompleted: applications.filter(item => item.onboardingStatus === 'PROFILE_COMPLETED').length,
      },
      byCounty,
      byOwner,
    };
  }, [state?.applications, state?.queueSummary, state?.user?.id, selectedOwnerId, selectedCountyId, selectedPreset]);

  const dashboardFilterStorageKey = useMemo(() => {
    const userId = state?.user?.id || 'anonymous';
    const organizationId = state?.user?.organizationId || 'global';
    return `fosterhub.dashboard.filters:${userId}:${organizationId}`;
  }, [state?.user?.id, state?.user?.organizationId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !state?.user) return;
    const raw = localStorage.getItem(dashboardFilterStorageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      setSelectedOwnerId(parsed?.selectedOwnerId || 'all');
      setSelectedCountyId(parsed?.selectedCountyId || 'all');
      setSelectedPreset(parsed?.selectedPreset || 'all');
    } catch {
      setSelectedOwnerId('all');
      setSelectedCountyId('all');
      setSelectedPreset('all');
    }
  }, [dashboardFilterStorageKey, state?.user]);

  useEffect(() => {
    if (typeof window === 'undefined' || !state?.user) return;
    localStorage.setItem(dashboardFilterStorageKey, JSON.stringify({
      selectedOwnerId,
      selectedCountyId,
    }));
  }, [dashboardFilterStorageKey, selectedOwnerId, selectedCountyId, state?.user]);

  useEffect(() => {
    if (!state?.queueSummary) return;
    const ownerStillExists = selectedOwnerId === 'all' || state.queueSummary.byOwner.some(owner => (owner.ownerId || 'unassigned') === selectedOwnerId);
    const countyStillExists = selectedCountyId === 'all' || state.queueSummary.byCounty.some(county => county.organizationId === selectedCountyId);
    if (!ownerStillExists) setSelectedOwnerId('all');
    if (!countyStillExists) setSelectedCountyId('all');
  }, [state?.queueSummary, selectedOwnerId, selectedCountyId]);

  const portalOverview = useMemo(() => {
    const organizations = loadOrganizations();
    const applications = loadApplications();
    const surveys = loadSurveys();
    const vendors = loadVendors();

    const counties = organizations.filter(item => item.type === 'County Agency');
    return {
      counties: counties.length,
      statewideCases: counties.reduce((sum, item) => sum + item.totalCases, 0),
      statewideUsers: counties.reduce((sum, item) => sum + item.totalUsers, 0),
      travelApprovals: counties.reduce((sum, item) => sum + item.travelApprovalsPending, 0),
      applications: applications.length,
      vendors: vendors.filter(item => item.status === 'Approved').length,
      liveSurveys: surveys.filter(item => item.status === 'Live').length,
    };
  }, []);

  return (
    <AppShell title={title}>
      <main className="page-stack">
        {error ? (
          <section className="notice notice-error">
            <strong>Dashboard problem</strong>
            <p style={{ marginBottom: 0 }}>{error}</p>
          </section>
        ) : null}

        <section className="grid">
          <article className="card kpi">
            <span className="kpi-label">Assigned cases</span>
            <span className="kpi-value">{state?.summary?.assignedCases ?? 0}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Assigned intake records</span>
            <span className="kpi-value">{state?.summary?.assignedIntakeRecords ?? 0}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Pending requests</span>
            <span className="kpi-value">{state?.summary?.pendingRequests ?? 0}</span>
          </article>
          <article className="card">
            <div className="eyebrow">Up next</div>
            <div className="stack" style={{ gap: 12 }}>
              <div
                style={{
                  paddingBottom: 12,
                  borderBottom: '1px solid #e8efea',
                }}
              >
                <strong>Hall - 123456</strong>
                <p style={{ margin: '6px 0 0' }}>04/05/26 · 2:00PM</p>
              </div>
              <div>
                <strong>Johnson - 234567</strong>
                <p style={{ margin: '6px 0 0' }}>04/06/26 · 9:00AM</p>
              </div>
            </div>
            <div className="actions-row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
              <Link href="/calendar" className="button button-ghost">Open calendar</Link>
            </div>
          </article>
        </section>

        <section className="grid">
          <article className="card kpi">
            <span className="kpi-label">County environments</span>
            <span className="kpi-value">{portalOverview.counties}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Statewide cases</span>
            <span className="kpi-value">{portalOverview.statewideCases}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Travel approvals pending</span>
            <span className="kpi-value">{portalOverview.travelApprovals}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Applications in pipeline</span>
            <span className="kpi-value">{filteredQueueSummary?.totals.total ?? portalOverview.applications}</span>
          </article>
        </section>

        {filteredQueueSummary ? (
          <section className="page-stack">
            <section className="grid">
              <article className="card kpi">
                <span className="kpi-label">Application avg age</span>
                <span className="kpi-value">{filteredQueueSummary.totals.averageAgeDays}d</span>
              </article>
              <article className="card kpi">
                <span className="kpi-label">Watch list (7-14d)</span>
                <span className="kpi-value">{filteredQueueSummary.totals.watch}</span>
              </article>
              <article className="card kpi">
                <span className="kpi-label">Overdue (&gt;14d)</span>
                <span className="kpi-value">{filteredQueueSummary.totals.overdue}</span>
              </article>
              <article className="card">
                <div className="eyebrow">SLA rule</div>
                <p style={{ marginBottom: 0 }}>Under 7 days is on track, 7 to 14 days is watch, and over 14 days is overdue.</p>
              </article>
            </section>

            <section className="grid">
              <article className="card kpi">
                <span className="kpi-label">Onboarding invited</span>
                <span className="kpi-value">{filteredQueueSummary.totals.invited}</span>
              </article>
              <article className="card kpi">
                <span className="kpi-label">Accounts activated</span>
                <span className="kpi-value">{filteredQueueSummary.totals.activated}</span>
              </article>
              <article className="card kpi">
                <span className="kpi-label">Profiles completed</span>
                <span className="kpi-value">{filteredQueueSummary.totals.profileCompleted}</span>
              </article>
              <article className="card">
                <div className="eyebrow">Onboarding lens</div>
                <p style={{ marginBottom: 0 }}>These counts track converted foster parents moving from invitation into activation and completed profile setup.</p>
              </article>
            </section>

            <section className="grid">
              <article className="card">
                <div className="section-title">
                  <div>
                    <div className="eyebrow">State application rollup</div>
                    <h3>Queue by county</h3>
                  </div>
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
                    <select className="select" value={selectedCountyId} onChange={event => setSelectedCountyId(event.target.value)} style={{ maxWidth: 260 }}>
                      <option value="all">All counties</option>
                      {(state?.queueSummary?.byCounty || []).map(county => (
                        <option key={county.organizationId} value={county.organizationId}>{county.organizationName}</option>
                      ))}
                    </select>
                    <select className="select" value={selectedOwnerId} onChange={event => setSelectedOwnerId(event.target.value)} style={{ maxWidth: 260 }}>
                      <option value="all">All owners</option>
                      {(state?.queueSummary?.byOwner || []).map(owner => (
                        <option key={owner.ownerId || 'unassigned'} value={owner.ownerId || 'unassigned'}>{owner.ownerName}</option>
                      ))}
                    </select>
                    <Link href="/applications" className="button button-ghost">Open application queue</Link>
                  </div>
                </div>
                <div className="record-list">
                  {filteredQueueSummary.byCounty.map(county => (
                    <article key={county.organizationId} className="record-item">
                      <strong>{county.organizationName}</strong>
                      <div className="record-meta">
                        <span>{county.total} total</span>
                        <span>{county.approvalReady} ready</span>
                        <span>{county.approved} approved</span>
                        <span>{county.unassigned} unassigned</span>
                        <span>{county.overdue} overdue</span>
                        <span>{county.averageAgeDays}d avg age</span>
                        <span>{county.invited} invited</span>
                        <span>{county.activated} activated</span>
                        <span>{county.profileCompleted} completed</span>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              <article className="card card-muted">
                <div className="section-title">
                  <div>
                    <div className="eyebrow">Owner performance</div>
                    <h3>Queue by owner</h3>
                  </div>
                </div>
                <div className="record-list">
                  {filteredQueueSummary.byOwner.map(owner => (
                    <article key={owner.ownerId || 'unassigned'} className="record-item">
                      <strong>{owner.ownerName}</strong>
                      <div className="record-meta">
                        <span>{owner.total} total</span>
                        <span>{owner.approvalReady} ready</span>
                        <span>{owner.approved} approved</span>
                        <span>{owner.overdue} overdue</span>
                        <span>{owner.averageAgeDays}d avg age</span>
                        <span>{owner.invited} invited</span>
                        <span>{owner.activated} activated</span>
                        <span>{owner.profileCompleted} completed</span>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </section>
          </section>
        ) : null}

        {state?.reminders?.length ? (
          <section className="card">
            <div className="section-title">
              <div>
                <div className="eyebrow">Aging reminders</div>
                <h3>Application notifications</h3>
              </div>
              <Link href="/applications" className="button button-ghost">Open queue</Link>
            </div>
            <div className="record-list">
              {state.reminders.map(reminder => (
                <article key={reminder.id} className="record-item">
                  <strong>{reminder.message}</strong>
                  <div className="record-meta">
                    <span className="status-pill">{reminder.reminderType}</span>
                    <span>{reminder.organizationName}</span>
                    <span>{reminder.recipientName}</span>
                  </div>
                  <div className="actions-row" style={{ justifyContent: 'flex-end' }}>
                    <Link href={`/applications?applicationId=${reminder.applicationId}`} className="button button-secondary">Open application</Link>
                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={() => handleDismissReminder(reminder.id)}
                      disabled={dismissingReminderId === reminder.id}
                    >
                      {dismissingReminderId === reminder.id ? 'Dismissing…' : 'Dismiss'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="card">
          <div className="section-title">
            <div>
              <div className="eyebrow">Assigned work</div>
              <h3>My cases</h3>
            </div>
            <Link href="/cases" className="button button-ghost">Open cases</Link>
          </div>

          {state?.myCases?.length ? (
            <div className="record-list">
              {state.myCases.map(item => (
                <article key={item.assignmentId} className="record-item">
                  <strong>{item.childFirstName} {item.childLastName}</strong>
                  <div className="record-meta">
                    <span className="status-pill">{item.caseStatus}</span>
                    <span>Role: {item.roleLabel}</span>
                  </div>
                  <div className="actions-row">
                    <Link href={`/cases/${item.caseId}`} className="button button-secondary">Open case</Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No assigned cases yet.</strong>
              <p style={{ marginBottom: 0 }}>Once case assignments exist, they will show up here for quick access.</p>
            </div>
          )}
        </section>

        <section className="card">
          <div className="section-title">
            <div>
              <div className="eyebrow">Decision queue</div>
              <h3>Pending requests</h3>
            </div>
          </div>

          {state?.pendingRequests?.length ? (
            <div className="record-list">
              {state.pendingRequests.map(request => (
                <article key={request.id} className="record-item">
                  <strong>{request.title}</strong>
                  <div className="record-meta">
                    <span className="status-pill">{request.status}</span>
                    <span>Child: {request.childFirstName} {request.childLastName}</span>
                  </div>
                  <div className="actions-row">
                    <Link href={`/cases/${request.caseId}`} className="button button-secondary">Review request</Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No pending requests right now.</strong>
              <p style={{ marginBottom: 0 }}>When approvals need attention, they will appear here.</p>
            </div>
          )}
        </section>

        <section className="grid">
          <article className="card">
            <div className="section-title">
              <div>
                <div className="eyebrow">Expansion pillars</div>
                <h3>Next product surfaces</h3>
              </div>
              <Link href="/organizations" className="button button-ghost">Open org map</Link>
            </div>
            <div className="record-list">
              <article className="record-item">
                <strong>State and county hierarchy</strong>
                <div className="record-meta">
                  <span>{portalOverview.counties} county environments</span>
                  <span>{portalOverview.statewideUsers} users across portal stack</span>
                </div>
              </article>
              <article className="record-item">
                <strong>Vendor directory and invoice portal</strong>
                <div className="record-meta">
                  <span>{portalOverview.vendors} approved vendors</span>
                  <span>Foster parent searchable directory enabled</span>
                </div>
              </article>
              <article className="record-item">
                <strong>Survey and outcome measurement</strong>
                <div className="record-meta">
                  <span>{portalOverview.liveSurveys} live campaign</span>
                  <span>Baseline to post-launch comparison ready</span>
                </div>
              </article>
            </div>
          </article>

          <article className="card card-muted">
            <div className="section-title">
              <div>
                <div className="eyebrow">Access model</div>
                <h3>Permissions</h3>
              </div>
            </div>

            {state?.permissions?.length ? (
              <ul>
                {state.permissions.map(permission => (
                  <li key={permission}>{permission}</li>
                ))}
              </ul>
            ) : (
              <p style={{ marginBottom: 0 }}>Permissions will display here after successful load.</p>
            )}
          </article>
        </section>
      </main>
    </AppShell>
  );
}
