'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { authedGet } from '../../lib/api';
import { loadOrganizations, type OrganizationNode } from '../../lib/portal-data';

type ApiOrganization = {
  id: string;
  name: string;
  type: 'STATE_AGENCY' | 'COUNTY_AGENCY';
  code?: string | null;
  parentOrganizationId?: string | null;
  childOrganizationCount: number;
  totalUsers: number;
  totalCases: number;
  fosterParentApplications: number;
  approvedVendors: number;
  travelApprovalsPending: number;
};

type OrganizationContext = {
  id: string;
  name: string;
  type: 'STATE_AGENCY' | 'COUNTY_AGENCY';
  code?: string | null;
  parentOrganization: { id: string; name: string; type: 'STATE_AGENCY' | 'COUNTY_AGENCY' } | null;
  childOrganizations: Array<{ id: string; name: string; type: 'STATE_AGENCY' | 'COUNTY_AGENCY' }>;
};

type ViewOrganization = {
  id: string;
  name: string;
  type: 'State Agency' | 'County Agency';
  code: string;
  parentId?: string;
  adminName: string;
  counties?: number;
  totalCases: number;
  totalUsers: number;
  openRequests: number;
  satisfactionScore: number;
  travelApprovalsPending: number;
  fosterParentApplications: number;
  approvedVendors: number;
};

function normalizeOrganization(apiOrg: ApiOrganization, context?: OrganizationContext | null): ViewOrganization {
  const seedFallback = loadOrganizations().find(item => item.code === apiOrg.code || item.id === apiOrg.id);
  return {
    id: apiOrg.id,
    name: apiOrg.name,
    type: apiOrg.type === 'STATE_AGENCY' ? 'State Agency' : 'County Agency',
    code: apiOrg.code ?? seedFallback?.code ?? 'ORG',
    parentId: apiOrg.parentOrganizationId ?? undefined,
    adminName: context?.id === apiOrg.id
      ? 'Current signed-in admin'
      : seedFallback?.adminName ?? (apiOrg.type === 'STATE_AGENCY' ? 'State Super Admin' : 'County Admin'),
    counties: apiOrg.childOrganizationCount,
    totalCases: apiOrg.totalCases,
    totalUsers: apiOrg.totalUsers,
    openRequests: seedFallback?.openRequests ?? 0,
    satisfactionScore: seedFallback?.satisfactionScore ?? 0,
    travelApprovalsPending: apiOrg.travelApprovalsPending,
    fosterParentApplications: apiOrg.fosterParentApplications,
    approvedVendors: apiOrg.approvedVendors,
  };
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<ViewOrganization[]>(() => loadOrganizations());
  const [selectedId, setSelectedId] = useState<string>('');
  const [context, setContext] = useState<OrganizationContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!token) {
      setSelectedId(current => current || loadOrganizations()[0]?.id || '');
      return;
    }

    async function load() {
      try {
        const [treeResult, contextResult] = await Promise.all([
          authedGet('/organizations/tree', token),
          authedGet('/organizations/context', token),
        ]);

        const nextContext = contextResult.data as OrganizationContext | null;
        setContext(nextContext);

        const nextOrganizations = (treeResult.data as ApiOrganization[]).map(item => normalizeOrganization(item, nextContext));
        setOrganizations(nextOrganizations);
        setSelectedId(nextContext?.id || nextOrganizations[0]?.id || '');
      } catch (err: any) {
        setError(err?.message || 'Unable to load organization hierarchy from the API. Showing local prototype data instead.');
        setSelectedId(current => current || loadOrganizations()[0]?.id || '');
      }
    }

    load();
  }, []);

  const selected = organizations.find(item => item.id === selectedId) ?? organizations[0];
  const childCounties = useMemo(
    () => organizations.filter(item => item.parentId === selected?.id),
    [organizations, selected?.id],
  );

  const statewideRollup = useMemo(() => {
    const counties = organizations.filter(item => item.type === 'County Agency');
    return {
      cases: counties.reduce((sum, item) => sum + item.totalCases, 0),
      users: counties.reduce((sum, item) => sum + item.totalUsers, 0),
      requests: counties.reduce((sum, item) => sum + item.openRequests, 0),
      applications: counties.reduce((sum, item) => sum + item.fosterParentApplications, 0),
      vendors: counties.reduce((sum, item) => sum + item.approvedVendors, 0),
      travel: counties.reduce((sum, item) => sum + item.travelApprovalsPending, 0),
    };
  }, [organizations]);

  return (
    <AppShell title="Organization hierarchy">
      <main className="page-stack">
        {error ? (
          <section className="notice notice-error">
            <strong>Hierarchy load problem</strong>
            <p style={{ marginBottom: 0 }}>{error}</p>
          </section>
        ) : null}

        {context ? (
          <section className="card card-muted">
            <div className="section-title">
              <div>
                <div className="eyebrow">Signed-in context</div>
                <h3 style={{ marginBottom: 0 }}>{context.name}</h3>
              </div>
              <span className="status-pill">{context.type === 'STATE_AGENCY' ? 'State Agency' : 'County Agency'}</span>
            </div>
            <p style={{ marginBottom: 0 }}>
              {context.type === 'STATE_AGENCY'
                ? 'You are currently scoped to the statewide organization and can see its county environments beneath it.'
                : `You are currently scoped to a county portal that rolls up to ${context.parentOrganization?.name ?? 'its parent state agency'}.`}
            </p>
          </section>
        ) : null}

        <section className="grid">
          <article className="card kpi">
            <span className="kpi-label">Statewide cases</span>
            <span className="kpi-value">{statewideRollup.cases}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Users across counties</span>
            <span className="kpi-value">{statewideRollup.users}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Applications in pipeline</span>
            <span className="kpi-value">{statewideRollup.applications}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Travel approvals pending</span>
            <span className="kpi-value">{statewideRollup.travel}</span>
          </article>
        </section>

        <section className="card">
          <div className="section-title">
            <div>
              <div className="eyebrow">Tenant structure</div>
              <h2 style={{ marginBottom: 0 }}>State and county environments</h2>
            </div>
          </div>

          <div className="record-list">
            {organizations.filter(item => item.type === 'State Agency').map(stateAgency => (
              <article key={stateAgency.id} className="record-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{stateAgency.name}</strong>
                    <div className="record-meta">
                      <span>{stateAgency.code}</span>
                      <span>{stateAgency.counties ?? 0} county environments</span>
                      <span>Global admin: {stateAgency.adminName}</span>
                    </div>
                  </div>
                  <button type="button" className="button button-secondary" onClick={() => setSelectedId(stateAgency.id)}>
                    View statewide portal
                  </button>
                </div>

                <div className="grid" style={{ marginTop: 18 }}>
                  {organizations.filter(item => item.parentId === stateAgency.id).map(county => (
                    <button
                      key={county.id}
                      type="button"
                      className="record-item clickable-card"
                      style={{ textAlign: 'left', width: '100%' }}
                      onClick={() => setSelectedId(county.id)}
                    >
                      <strong className="clickable-card-title">{county.name}</strong>
                      <div className="record-meta">
                        <span>{county.totalCases} cases</span>
                        <span>{county.totalUsers} users</span>
                        <span>{county.fosterParentApplications} applications</span>
                      </div>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {selected ? (
          <section className="card card-muted">
            <div className="section-title">
              <div>
                <div className="eyebrow">Selected portal</div>
                <h3 style={{ marginBottom: 0 }}>{selected.name}</h3>
              </div>
              <span className="status-pill">{selected.type}</span>
            </div>

            <div className="grid">
              <article className="card">
                <div className="eyebrow">Operations</div>
                <div className="record-list">
                  <div className="record-item">
                    <strong>{selected.totalCases}</strong>
                    <p style={{ marginBottom: 0 }}>Active cases inside this environment.</p>
                  </div>
                  <div className="record-item">
                    <strong>{selected.fosterParentApplications}</strong>
                    <p style={{ marginBottom: 0 }}>Foster parent applications assigned to this org scope.</p>
                  </div>
                  <div className="record-item">
                    <strong>{selected.travelApprovalsPending}</strong>
                    <p style={{ marginBottom: 0 }}>Travel approvals waiting on review.</p>
                  </div>
                </div>
              </article>

              <article className="card">
                <div className="eyebrow">People and ecosystem</div>
                <div className="record-list">
                  <div className="record-item">
                    <strong>{selected.totalUsers}</strong>
                    <p style={{ marginBottom: 0 }}>Users across staff, foster parents, legal, and vendors.</p>
                  </div>
                  <div className="record-item">
                    <strong>{selected.approvedVendors}</strong>
                    <p style={{ marginBottom: 0 }}>Approved vendors tied to this organizational scope.</p>
                  </div>
                  <div className="record-item">
                    <strong>{selected.satisfactionScore}%</strong>
                    <p style={{ marginBottom: 0 }}>Current foster parent satisfaction benchmark.</p>
                  </div>
                </div>
              </article>
            </div>

            {selected.type === 'State Agency' ? (
              <div className="empty-state" style={{ marginTop: 20 }}>
                <strong>State super admin view</strong>
                <p style={{ marginBottom: 0 }}>
                  This view is now backed by the organization hierarchy API so state-level users can operate from a real parent-child structure instead of a flat single-org model.
                </p>
              </div>
            ) : childCounties.length === 0 ? (
              <div className="empty-state" style={{ marginTop: 20 }}>
                <strong>County environment</strong>
                <p style={{ marginBottom: 0 }}>
                  County users stay isolated to their own portal while still rolling up to the parent state organization for reporting and oversight.
                </p>
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
