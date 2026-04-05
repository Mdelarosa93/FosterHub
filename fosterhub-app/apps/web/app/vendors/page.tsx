'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { authedGet, authedPost } from '../../lib/api';
import { getStoredSessionUser, loadOrganizations, loadVendors, type VendorRecord } from '../../lib/portal-data';

type ApiVendor = {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  category: string;
  city?: string;
  status: string;
  referredBy?: string;
  invoiceCount: number;
  paymentStatus: string;
};

type ApiOrganization = {
  id: string;
  name: string;
  type: 'STATE_AGENCY' | 'COUNTY_AGENCY';
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<ApiVendor[]>([]);
  const [organizations, setOrganizations] = useState<ApiOrganization[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('All categories');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const sessionUser = getStoredSessionUser();
  const [draft, setDraft] = useState({ organizationId: '', name: '', category: '', city: '', referredBy: '', status: 'RECOMMENDED' });

  useEffect(() => {
    const token = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!token) {
      const fallbackVendors = loadVendors().map(item => ({
        ...item,
        organizationId: item.countyId,
        organizationName: loadOrganizations().find(org => org.id === item.countyId)?.name ?? 'County',
      }));
      setVendors(fallbackVendors as any);
      return;
    }

    async function load() {
      try {
        const [vendorResult, organizationResult] = await Promise.all([
          authedGet('/vendors', token),
          authedGet('/organizations/tree', token),
        ]);
        const orgs = (organizationResult.data as ApiOrganization[]).filter(item => item.type === 'COUNTY_AGENCY');
        setVendors(vendorResult.data || []);
        setOrganizations(orgs);
        setDraft(current => ({ ...current, organizationId: sessionUser?.organizationType === 'county_agency' ? sessionUser.organizationId || '' : orgs[0]?.id || '' }));
      } catch (err: any) {
        setError(err?.message || 'Failed to load vendors');
      }
    }

    load();
  }, []);

  const categories = ['All categories', ...Array.from(new Set(vendors.map(item => item.category).filter(Boolean)))];
  const filtered = useMemo(() => vendors.filter(item => categoryFilter === 'All categories' || item.category === categoryFilter), [vendors, categoryFilter]);
  const approvedDirectory = filtered.filter(item => item.status === 'APPROVED');

  async function handleCreateVendor() {
    const token = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!token) {
      setError('Login is required to persist vendors to the backend.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await authedPost('/vendors', token, draft);
      const refreshed = await authedGet('/vendors', token);
      setVendors(refreshed.data || []);
      setDraft(current => ({ ...current, name: '', category: '', city: '', referredBy: '' }));
    } catch (err: any) {
      setError(err?.message || 'Failed to create vendor');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title="Vendor portal"
      headerActions={
        <select className="select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ maxWidth: 260 }}>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      }
    >
      <main className="page-stack">
        {error ? (
          <section className="notice notice-error">
            <strong>Vendor problem</strong>
            <p style={{ marginBottom: 0 }}>{error}</p>
          </section>
        ) : null}

        <section className="grid">
          <article className="card kpi">
            <span className="kpi-label">Approved vendors</span>
            <span className="kpi-value">{vendors.filter(item => item.status === 'APPROVED').length}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Pending onboarding</span>
            <span className="kpi-value">{vendors.filter(item => item.status !== 'APPROVED').length}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Directory results</span>
            <span className="kpi-value">{approvedDirectory.length}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Invoices in system</span>
            <span className="kpi-value">{vendors.reduce((sum, item) => sum + item.invoiceCount, 0)}</span>
          </article>
        </section>

        <section className="card card-muted">
          <div className="section-title">
            <div>
              <div className="eyebrow">Backend persistence</div>
              <h3 style={{ marginBottom: 0 }}>Add vendor onboarding record</h3>
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
            <div className="grid">
              <div className="field">
                <label>Name</label>
                <input className="input" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className="field">
                <label>Category</label>
                <input className="input" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} />
              </div>
            </div>
            <div className="grid">
              <div className="field">
                <label>City</label>
                <input className="input" value={draft.city} onChange={e => setDraft({ ...draft, city: e.target.value })} />
              </div>
              <div className="field">
                <label>Referred by</label>
                <input className="input" value={draft.referredBy} onChange={e => setDraft({ ...draft, referredBy: e.target.value })} />
              </div>
            </div>
            <div className="actions-row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="button button-primary" onClick={handleCreateVendor} disabled={saving}>
                {saving ? 'Saving…' : 'Create vendor'}
              </button>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-title">
            <div>
              <div className="eyebrow">Onboarding and payment workflow</div>
              <h2 style={{ marginBottom: 0 }}>County-facing vendor management</h2>
            </div>
          </div>
          <div className="record-list">
            {filtered.map(vendor => (
              <article key={vendor.id} className="record-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{vendor.name}</strong>
                    <div className="record-meta">
                      <span>{vendor.category}</span>
                      <span>{vendor.city || 'No city yet'}</span>
                      <span>{vendor.organizationName}</span>
                      <span>Recommended by {vendor.referredBy || 'Not captured yet'}</span>
                    </div>
                  </div>
                  <span className="status-pill">{vendor.status.replace(/_/g, ' ')}</span>
                </div>
                <div className="grid" style={{ marginTop: 18 }}>
                  <div className="card card-muted" style={{ padding: 18 }}>
                    <div className="eyebrow">Invoice portal</div>
                    <strong>{vendor.invoiceCount} invoices</strong>
                    <p style={{ marginBottom: 0 }}>Current payment state: {vendor.paymentStatus.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="card card-muted" style={{ padding: 18 }}>
                    <div className="eyebrow">Persistence</div>
                    <p style={{ marginBottom: 0 }}>This vendor row is now coming from the backend vendor table instead of local-only mock state.</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="card card-muted">
          <div className="section-title">
            <div>
              <div className="eyebrow">Foster parent experience</div>
              <h3 style={{ marginBottom: 0 }}>Approved vendor directory</h3>
            </div>
          </div>

          <div className="grid">
            {approvedDirectory.map(vendor => (
              <article key={`${vendor.id}-directory`} className="record-item">
                <strong>{vendor.name}</strong>
                <div className="record-meta">
                  <span>{vendor.category}</span>
                  <span>{vendor.city || 'No city yet'}</span>
                  <span>{vendor.organizationName}</span>
                </div>
                <p style={{ marginBottom: 0 }}>Approved vendors remain searchable for foster parents, but now the source record is backed by the real API.</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
