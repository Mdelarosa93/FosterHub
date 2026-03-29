'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { authedGet } from '../../lib/api';
import { AppShell } from '../../components/AppShell';

type DashboardState = {
  user: any;
  permissions: string[];
  summary: {
    assignedCases: number;
    assignedIntakeRecords: number;
    pendingRequests: number;
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
};

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState | null>(null);
  const [storedFirstName, setStoredFirstName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

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
        const [me, permissions, summary, myCases, pendingRequests] = await Promise.all([
          authedGet('/auth/me', authToken),
          authedGet('/auth/my-permissions', authToken),
          authedGet('/worker-dashboard/summary', authToken),
          authedGet('/worker-dashboard/my-cases', authToken),
          authedGet('/worker-dashboard/pending-requests', authToken),
        ]);

        setState({
          user: me.data,
          permissions: permissions.data,
          summary: summary.data,
          myCases: myCases.data || [],
          pendingRequests: pendingRequests.data || [],
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
                <strong>Archer Hall</strong>
                <p style={{ margin: '6px 0 0' }}>04/05/26 · 2:00PM</p>
              </div>
              <div>
                <strong>Ava Johnson</strong>
                <p style={{ margin: '6px 0 0' }}>04/06/26 · 9:00AM</p>
              </div>
            </div>
            <div className="actions-row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
              <Link href="/calendar" className="button button-ghost">Open calendar</Link>
            </div>
          </article>
        </section>

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

        <section className="card card-muted">
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
        </section>
      </main>
    </AppShell>
  );
}
