'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) {
      setError('No token found. Please log in first.');
      return;
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

  return (
    <AppShell title="Dashboard">
      <main>
        {state ? (
          <section style={{ padding: 24, paddingBottom: 0 }}>
            <div className="badge">Signed in as {state.user.email}</div>
          </section>
        ) : null}

        <section className="grid" style={{ padding: 24 }}>
          <article className="card">
            <h3>Quick actions</h3>
            <ul>
              <li><Link href="/intake">Open intake queue</Link></li>
              <li><Link href="/cases">View cases</Link></li>
            </ul>
          </article>

          {state ? (
            <>
              <article className="card">
                <h3>User</h3>
                <p>{state.user.email}</p>
                <p>Role: {state.user.role}</p>
              </article>
              <article className="card">
                <h3>Assigned cases</h3>
                <p>{state.summary?.assignedCases ?? 0}</p>
              </article>
              <article className="card">
                <h3>Assigned intake records</h3>
                <p>{state.summary?.assignedIntakeRecords ?? 0}</p>
              </article>
              <article className="card">
                <h3>Pending requests</h3>
                <p>{state.summary?.pendingRequests ?? 0}</p>
              </article>
            </>
          ) : null}
        </section>

        {state ? (
          <section className="card" style={{ margin: '0 24px 24px' }}>
            <h3>My assigned cases</h3>
            {state.myCases.length ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {state.myCases.map(item => (
                  <article key={item.assignmentId} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                    <strong>{item.childFirstName} {item.childLastName}</strong>
                    <div>Status: {item.caseStatus}</div>
                    <div>Role: {item.roleLabel}</div>
                    <p style={{ marginTop: 12 }}>
                      <Link href={`/cases/${item.caseId}`}>Open case</Link>
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p>No assigned cases yet.</p>
            )}
          </section>
        ) : null}

        {state ? (
          <section className="card" style={{ margin: '0 24px 24px' }}>
            <h3>Pending request queue</h3>
            {state.pendingRequests.length ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {state.pendingRequests.map(request => (
                  <article key={request.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                    <strong>{request.title}</strong>
                    <div>Child: {request.childFirstName} {request.childLastName}</div>
                    <div>Status: {request.status}</div>
                    <p style={{ marginTop: 12 }}>
                      <Link href={`/cases/${request.caseId}`}>Review request</Link>
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p>No pending requests right now.</p>
            )}
          </section>
        ) : null}

        {error ? (
          <section className="card" style={{ margin: '0 24px 24px' }}>
            <h3>Login state problem</h3>
            <p>{error}</p>
          </section>
        ) : null}

        {state ? (
          <section className="card" style={{ margin: '0 24px 24px' }}>
            <h3>Permissions</h3>
            <ul>
              {state.permissions.map(permission => (
                <li key={permission}>{permission}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
