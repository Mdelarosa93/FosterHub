'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { BillingPortalResponse } from '@fosterhub/types';
import { AppShell } from '../../components/AppShell';
import { authedGet, authedPatch, authedPut } from '../../lib/api';

function formatMoney(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

function getChangedFieldStyle(changed: boolean, tone: 'neutral' | 'positive' | 'warning' = 'neutral') {
  if (!changed) return { background: '#f8fafc' };
  if (tone === 'warning') return { background: '#fff5f5', borderColor: '#f5c2c7' };
  if (tone === 'positive') return { background: '#eefbf3', borderColor: '#ccebd7' };
  return { background: '#eef6ff', borderColor: 'rgba(16, 88, 140, 0.18)' };
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const minutes = Math.round(diffMs / (1000 * 60));
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
  return formatter.format(days, 'day');
}

export default function BillingPage() {
  const [portal, setPortal] = useState<BillingPortalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planChangeTargetId, setPlanChangeTargetId] = useState<string | null>(null);
  const [expandedAuditEventIds, setExpandedAuditEventIds] = useState<Record<string, boolean>>({});
  const [highlightedAuditEventId, setHighlightedAuditEventId] = useState<string | null>(null);
  const [auditSuccessNotice, setAuditSuccessNotice] = useState<string | null>(null);
  const auditEventRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [contactForm, setContactForm] = useState({ billingContactName: '', billingContactEmail: '', billingContactPhone: '' });
  const [paymentForm, setPaymentForm] = useState({ brand: '', last4: '', expMonth: '', expYear: '', billingName: '', billingEmail: '' });
  const [allocationForm, setAllocationForm] = useState<Record<string, { status: string; seatLimit: string }>>({});

  async function loadPortal() {
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) {
      setError('No token found. Please log in first.');
      setLoading(false);
      return;
    }

    const result = await authedGet('/billing/portal', authToken);
    const nextPortal = (result.data || null) as BillingPortalResponse | null;
    setPortal(nextPortal);
    if (nextPortal) {
      setContactForm({
        billingContactName: nextPortal.subscription.billingContactName || '',
        billingContactEmail: nextPortal.subscription.billingContactEmail || '',
        billingContactPhone: nextPortal.subscription.billingContactPhone || '',
      });
      setPaymentForm({
        brand: nextPortal.subscription.paymentMethod?.brand || '',
        last4: nextPortal.subscription.paymentMethod?.last4 || '',
        expMonth: nextPortal.subscription.paymentMethod?.expMonth ? String(nextPortal.subscription.paymentMethod.expMonth) : '',
        expYear: nextPortal.subscription.paymentMethod?.expYear ? String(nextPortal.subscription.paymentMethod.expYear) : '',
        billingName: nextPortal.subscription.paymentMethod?.billingName || '',
        billingEmail: nextPortal.subscription.paymentMethod?.billingEmail || '',
      });
      setAllocationForm(Object.fromEntries(nextPortal.countyAllocations.map(allocation => [allocation.countyOrganizationId, { status: allocation.status, seatLimit: allocation.seatLimit ? String(allocation.seatLimit) : '' }])));
    }
  }

  useEffect(() => {
    async function boot() {
      try {
        await loadPortal();
      } catch (err: any) {
        setError(err?.message || 'Failed to load billing portal');
      } finally {
        setLoading(false);
      }
    }

    boot();
  }, []);

  useEffect(() => {
    if (!highlightedAuditEventId) return;
    const target = auditEventRefs.current[highlightedAuditEventId];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const timeout = window.setTimeout(() => {
      setHighlightedAuditEventId(current => (current === highlightedAuditEventId ? null : current));
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [highlightedAuditEventId, portal]);

  useEffect(() => {
    if (!auditSuccessNotice) return;
    const timeout = window.setTimeout(() => {
      setAuditSuccessNotice(null);
    }, 4000);
    return () => window.clearTimeout(timeout);
  }, [auditSuccessNotice]);

  const headerPill = useMemo(() => {
    if (!portal) return null;
    return (
      <span className="status-pill" style={{ background: '#eef6ff', color: 'var(--fh-blue)' }}>
        {portal.scope === 'county' ? 'County read-only billing view' : 'State-managed billing portal'}
      </span>
    );
  }, [portal]);

  const canManage = portal?.scope === 'state';

  async function saveContact() {
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) return;
    try {
      setSaving('contact');
      setError(null);
      const result = await authedPatch('/billing/contact', authToken, contactForm as Record<string, any>);
      const nextPortal = (result.data || null) as BillingPortalResponse | null;
      setPortal(nextPortal);
      const newestAuditEvent = nextPortal?.auditEvents?.[0];
      if (newestAuditEvent?.eventType === 'CONTACT_UPDATED') {
        setExpandedAuditEventIds({ [newestAuditEvent.id]: true });
        setHighlightedAuditEventId(newestAuditEvent.id);
        setAuditSuccessNotice('Billing contact saved and logged to audit history.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update billing contact');
    } finally {
      setSaving(null);
    }
  }

  async function savePaymentMethod() {
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) return;
    try {
      setSaving('payment');
      setError(null);
      const result = await authedPatch('/billing/payment-method', authToken, {
        provider: 'STRIPE',
        brand: paymentForm.brand,
        last4: paymentForm.last4,
        expMonth: paymentForm.expMonth ? Number(paymentForm.expMonth) : undefined,
        expYear: paymentForm.expYear ? Number(paymentForm.expYear) : undefined,
        billingName: paymentForm.billingName,
        billingEmail: paymentForm.billingEmail,
        isDefault: true,
      });
      const nextPortal = (result.data || null) as BillingPortalResponse | null;
      setPortal(nextPortal);
      const newestAuditEvent = nextPortal?.auditEvents?.[0];
      if (newestAuditEvent?.eventType === 'PAYMENT_METHOD_UPDATED') {
        setExpandedAuditEventIds({ [newestAuditEvent.id]: true });
        setHighlightedAuditEventId(newestAuditEvent.id);
        setAuditSuccessNotice('Payment method saved and logged to audit history.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update payment method');
    } finally {
      setSaving(null);
    }
  }

  function openPlanChangePreview(billingPlanId: string) {
    setPlanChangeTargetId(billingPlanId);
  }

  async function changePlan(billingPlanId: string) {
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) return;
    try {
      setSaving(`plan-${billingPlanId}`);
      setError(null);
      const result = await authedPatch('/billing/plan', authToken, { billingPlanId });
      const nextPortal = (result.data || null) as BillingPortalResponse | null;
      setPortal(nextPortal);
      setPlanChangeTargetId(null);

      const newestAuditEvent = nextPortal?.auditEvents?.[0];
      if (newestAuditEvent?.eventType === 'PLAN_CHANGED') {
        setExpandedAuditEventIds({ [newestAuditEvent.id]: true });
        setHighlightedAuditEventId(newestAuditEvent.id);
        setAuditSuccessNotice('Plan change saved and logged to audit history.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to change plan');
    } finally {
      setSaving(null);
    }
  }

  async function saveAllocation(countyOrganizationId: string) {
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken || !portal) return;
    const currentAllocation = portal.countyAllocations.find(item => item.countyOrganizationId === countyOrganizationId);
    const allocation = allocationForm[countyOrganizationId];
    if (!currentAllocation || !allocation) return;

    const seatLimitNext = allocation.seatLimit ? Number(allocation.seatLimit) : undefined;
    const reducingSeats = typeof currentAllocation.seatLimit === 'number' && typeof seatLimitNext === 'number' && seatLimitNext < currentAllocation.seatLimit;
    const removingCounty = allocation.status === 'REMOVED' && currentAllocation.status !== 'REMOVED';

    if ((reducingSeats || removingCounty) && !window.confirm('This change reduces county coverage. Do you want to continue?')) {
      return;
    }

    try {
      setSaving(`allocation-${countyOrganizationId}`);
      setError(null);
      const result = await authedPut(`/billing/allocations/${countyOrganizationId}`, authToken, {
        status: allocation.status,
        seatLimit: seatLimitNext,
      });
      const nextPortal = (result.data || null) as BillingPortalResponse | null;
      setPortal(nextPortal);
      const newestAuditEvent = nextPortal?.auditEvents?.[0];
      if (newestAuditEvent?.eventType === 'COUNTY_ALLOCATION_UPDATED') {
        setExpandedAuditEventIds({ [newestAuditEvent.id]: true });
        setHighlightedAuditEventId(newestAuditEvent.id);
        setAuditSuccessNotice('County allocation saved and logged to audit history.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update county allocation');
    } finally {
      setSaving(null);
    }
  }

  async function toggleModule(billingModuleId: string, enabled: boolean) {
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) return;
    try {
      setSaving(`module-${billingModuleId}`);
      setError(null);
      const result = await authedPatch(`/billing/modules/${billingModuleId}`, authToken, { enabled: !enabled });
      const nextPortal = (result.data || null) as BillingPortalResponse | null;
      setPortal(nextPortal);
      const newestAuditEvent = nextPortal?.auditEvents?.[0];
      if (newestAuditEvent?.eventType === 'MODULE_UPDATED') {
        setExpandedAuditEventIds({ [newestAuditEvent.id]: true });
        setHighlightedAuditEventId(newestAuditEvent.id);
        setAuditSuccessNotice('Module update saved and logged to audit history.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update module');
    } finally {
      setSaving(null);
    }
  }

  return (
    <AppShell title={portal?.scope === 'county' ? 'Billing & Licensing' : 'State Billing & Licensing'} headerActions={headerPill}>
      <main>
        <div className="page-stack">
          {loading ? <section className="card"><p style={{ marginBottom: 0 }}>Loading billing portal...</p></section> : null}
          {error ? <div className="notice notice-error"><strong>Something went wrong</strong><p style={{ marginBottom: 0 }}>{error}</p></div> : null}

          {portal ? (
            <>
              <section className="card">
                <div className="section-title">
                  <div>
                    <div className="eyebrow">Billing & licensing</div>
                    <h2 style={{ marginBottom: 8 }}>{portal.organizationName}</h2>
                    <p style={{ marginBottom: 0 }}>
                      {portal.scope === 'county'
                        ? `This county view is read only for now. Billing and licensing are managed by ${portal.managedByOrganizationName || 'the parent organization'}.`
                        : 'Manage plan tier, licensing, payment details, county coverage, and enabled modules from one place.'}
                    </p>
                  </div>
                </div>
              </section>

              <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                <div className="card card-muted"><div className="kpi-label">Active tier</div><div style={{ marginTop: 8, fontSize: 28, fontWeight: 900, color: 'var(--fh-blue)' }}>{portal.subscription.plan.name}</div><p style={{ marginTop: 10, marginBottom: 0 }}>{portal.subscription.plan.description || 'Current plan for this organization context.'}</p></div>
                <div className="card card-muted"><div className="kpi-label">Total recurring cost</div><div style={{ marginTop: 8, fontSize: 28, fontWeight: 900, color: '#0b6b34' }}>{formatMoney(portal.subscription.totalCents, portal.subscription.currency)}</div><p style={{ marginTop: 10, marginBottom: 0 }}>{portal.subscription.plan.billingInterval.toLowerCase()} billing with renewal visibility built in.</p></div>
                <div className="card card-muted"><div className="kpi-label">Covered portals</div><div style={{ marginTop: 8, fontSize: 28, fontWeight: 900, color: '#123122' }}>{portal.subscription.countyCountCovered}</div><p style={{ marginTop: 10, marginBottom: 0 }}>County organizations currently attached to the active subscription.</p></div>
                <div className="card card-muted"><div className="kpi-label">Payment method</div><div style={{ marginTop: 8, fontSize: 28, fontWeight: 900, color: '#123122' }}>{portal.subscription.paymentMethod?.brand ? `${portal.subscription.paymentMethod.brand} •••• ${portal.subscription.paymentMethod.last4}` : 'No method'}</div><p style={{ marginTop: 10, marginBottom: 0 }}>Primary payment method on file for the active subscription.</p></div>
              </div>

              <section className="card">
                <div className="section-title"><div><h3 style={{ marginBottom: 8 }}>License tiers</h3><p style={{ marginBottom: 0 }}>Compare what each plan includes by default and what would still be optional add-on licensing.</p></div></div>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                  {portal.plans.map(plan => {
                    const active = plan.id === portal.subscription.plan.id;
                    return (
                      <div key={plan.id} className="card card-muted" style={{ border: active ? '1px solid rgba(16, 88, 140, 0.24)' : undefined, boxShadow: active ? '0 14px 32px rgba(16, 88, 140, 0.08)' : undefined }}>
                        <div className="section-title" style={{ marginBottom: 12 }}><div><h3 style={{ marginBottom: 6 }}>{plan.name}</h3><div style={{ fontSize: 24, fontWeight: 900, color: active ? 'var(--fh-blue)' : '#123122' }}>{plan.basePriceCents ? formatMoney(plan.basePriceCents) : 'Custom'}</div></div>{active ? <span className="badge">Active</span> : null}</div>
                        <p>{plan.description || 'Billing and licensing plan.'}</p>

                        <div className="page-stack" style={{ gap: 12 }}>
                          <div className="record-item" style={{ background: '#eefbf3' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                              <strong>Included by default</strong>
                              <span className="status-pill" style={{ background: '#dff5e7', color: '#0b6b34' }}>{plan.includedModules.length}</span>
                            </div>
                            <ul style={{ margin: '12px 0 0', paddingLeft: 18, color: 'var(--fh-text)' }}>
                              {plan.includedModules.map(item => <li key={item.id} style={{ marginTop: 6 }}>{item.name}</li>)}
                            </ul>
                          </div>

                          <div className="record-item" style={{ background: '#fff8f1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                              <strong>Optional modules</strong>
                              <span className="status-pill" style={{ background: '#ffe9d5', color: '#9a3412' }}>{plan.optionalModules.length}</span>
                            </div>
                            {plan.optionalModules.length ? (
                              <ul style={{ margin: '12px 0 0', paddingLeft: 18, color: 'var(--fh-text)' }}>
                                {plan.optionalModules.map(item => <li key={item.id} style={{ marginTop: 6 }}>{item.name}</li>)}
                              </ul>
                            ) : <p style={{ marginTop: 12, marginBottom: 0 }}>Everything is already included in this plan.</p>}
                          </div>
                        </div>

                        <div className="actions-row"><button type="button" className="button button-secondary" disabled={!canManage || active || saving === `plan-${plan.id}`} onClick={() => openPlanChangePreview(plan.id)}>{saving === `plan-${plan.id}` ? 'Switching…' : active ? 'Current plan' : 'Review plan change'}</button></div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="grid" style={{ gridTemplateColumns: '1.1fr 0.9fr', alignItems: 'start' }}>
                <section className="card">
                  <div className="section-title"><div><h3 style={{ marginBottom: 8 }}>County coverage & licensing</h3><p style={{ marginBottom: 0 }}>Manage county allocations under the state-owned subscription.</p></div></div>
                  <div className="record-list">
                    {portal.countyAllocations.map(county => (
                      <div key={county.id} className="record-item">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><strong>{county.countyOrganizationName}</strong><span className="status-pill">{county.status}</span></div>
                        <div className="form-grid" style={{ gridTemplateColumns: '180px 160px auto', marginTop: 14 }}>
                          <label className="field"><span>Status</span><select className="select" disabled={!canManage} value={allocationForm[county.countyOrganizationId]?.status || county.status} onChange={event => setAllocationForm(current => ({ ...current, [county.countyOrganizationId]: { ...(current[county.countyOrganizationId] || { seatLimit: '' }), status: event.target.value } }))}><option value="ACTIVE">Active</option><option value="PENDING">Pending</option><option value="REMOVED">Removed</option></select></label>
                          <label className="field"><span>Seat limit</span><input className="input" disabled={!canManage} inputMode="numeric" value={allocationForm[county.countyOrganizationId]?.seatLimit || ''} onChange={event => setAllocationForm(current => ({ ...current, [county.countyOrganizationId]: { ...(current[county.countyOrganizationId] || { status: county.status }), seatLimit: event.target.value } }))} /></label>
                          <div className="actions-row" style={{ alignSelf: 'end' }}><button type="button" className="button button-ghost" disabled={!canManage || saving === `allocation-${county.countyOrganizationId}`} onClick={() => saveAllocation(county.countyOrganizationId)}>{saving === `allocation-${county.countyOrganizationId}` ? 'Saving…' : 'Save allocation'}</button></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="page-stack">
                  <div className="card">
                    <div className="section-title"><div><h3 style={{ marginBottom: 8 }}>Billing contact</h3><p style={{ marginBottom: 0 }}>Primary contact for invoices and renewal communication.</p></div></div>
                    <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                      <label className="field"><span>Name</span><input className="input" disabled={!canManage} value={contactForm.billingContactName} onChange={event => setContactForm(current => ({ ...current, billingContactName: event.target.value }))} /></label>
                      <label className="field"><span>Email</span><input className="input" disabled={!canManage} value={contactForm.billingContactEmail} onChange={event => setContactForm(current => ({ ...current, billingContactEmail: event.target.value }))} /></label>
                      <label className="field"><span>Phone</span><input className="input" disabled={!canManage} value={contactForm.billingContactPhone} onChange={event => setContactForm(current => ({ ...current, billingContactPhone: event.target.value }))} /></label>
                    </div>
                    <div className="actions-row"><button type="button" className="button button-secondary" disabled={!canManage || saving === 'contact'} onClick={saveContact}>{saving === 'contact' ? 'Saving…' : 'Save billing contact'}</button></div>
                  </div>

                  <div className="card">
                    <div className="section-title"><div><h3 style={{ marginBottom: 8 }}>Payment method</h3><p style={{ marginBottom: 0 }}>State-level payment details for the active subscription.</p></div></div>
                    <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                      <label className="field"><span>Brand</span><input className="input" disabled={!canManage} value={paymentForm.brand} onChange={event => setPaymentForm(current => ({ ...current, brand: event.target.value }))} /></label>
                      <label className="field"><span>Last 4</span><input className="input" disabled={!canManage} value={paymentForm.last4} onChange={event => setPaymentForm(current => ({ ...current, last4: event.target.value }))} /></label>
                      <label className="field"><span>Exp month</span><input className="input" disabled={!canManage} value={paymentForm.expMonth} onChange={event => setPaymentForm(current => ({ ...current, expMonth: event.target.value }))} /></label>
                      <label className="field"><span>Exp year</span><input className="input" disabled={!canManage} value={paymentForm.expYear} onChange={event => setPaymentForm(current => ({ ...current, expYear: event.target.value }))} /></label>
                      <label className="field"><span>Billing name</span><input className="input" disabled={!canManage} value={paymentForm.billingName} onChange={event => setPaymentForm(current => ({ ...current, billingName: event.target.value }))} /></label>
                      <label className="field"><span>Billing email</span><input className="input" disabled={!canManage} value={paymentForm.billingEmail} onChange={event => setPaymentForm(current => ({ ...current, billingEmail: event.target.value }))} /></label>
                    </div>
                    <div className="actions-row"><button type="button" className="button button-secondary" disabled={!canManage || saving === 'payment'} onClick={savePaymentMethod}>{saving === 'payment' ? 'Saving…' : 'Save payment method'}</button></div>
                  </div>
                </section>
              </div>

              <section className="card">
                <div className="section-title"><div><h3 style={{ marginBottom: 8 }}>Licensed modules</h3><p style={{ marginBottom: 0 }}>Split core platform capabilities from add-on upsell modules so billing management is easier to understand.</p></div></div>
                <div className="page-stack">
                  {(['CORE', 'ADD_ON'] as const).map(category => {
                    const modules = portal.subscription.enabledModules.filter(moduleRecord => moduleRecord.category === category);
                    if (!modules.length) return null;
                    return (
                      <div key={category} className="page-stack" style={{ gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <h3 style={{ margin: 0 }}>{category === 'CORE' ? 'Core modules' : 'Add-on modules'}</h3>
                          <span className="status-pill" style={{ background: category === 'CORE' ? '#eef6ff' : '#fff4ec', color: category === 'CORE' ? 'var(--fh-blue)' : '#9a3412' }}>{modules.length}</span>
                        </div>
                        <div className="record-list">
                          {modules.map(moduleRecord => (
                            <div key={moduleRecord.id} className="record-item">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                <div>
                                  <strong>{moduleRecord.name}</strong>
                                  {moduleRecord.description ? <p style={{ marginTop: 8, marginBottom: 0 }}>{moduleRecord.description}</p> : null}
                                </div>
                                <div className="actions-row" style={{ marginTop: 0 }}>
                                  <span className="status-pill" style={{ background: moduleRecord.enabled ? '#eefbf3' : '#f4f4f5', color: moduleRecord.enabled ? '#0b6b34' : '#5b6470' }}>{moduleRecord.enabled ? 'Enabled' : 'Disabled'}</span>
                                  <button type="button" className="button button-ghost" disabled={!canManage || saving === `module-${moduleRecord.id}`} onClick={() => toggleModule(moduleRecord.id, moduleRecord.enabled)}>{saving === `module-${moduleRecord.id}` ? 'Saving…' : moduleRecord.enabled ? 'Disable' : 'Enable'}</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="card">
                <div className="section-title"><div><h3 style={{ marginBottom: 8 }}>Invoices</h3><p style={{ marginBottom: 0 }}>Invoice history for the active subscription.</p></div></div>
                <div className="record-list">
                  {portal.invoices.map(invoice => (
                    <div key={invoice.id} className="record-item">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><strong>{invoice.invoiceNumber}</strong><span className="status-pill">{invoice.status}</span></div>
                      <div className="record-meta"><span>{new Date(invoice.issuedAt).toLocaleDateString()}</span><span>{formatMoney(invoice.totalCents, invoice.currency)}</span></div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card">
                <div className="section-title"><div><h3 style={{ marginBottom: 8 }}>Billing audit log</h3><p style={{ marginBottom: 0 }}>Recent billing and licensing changes for this subscription.</p></div></div>
                {auditSuccessNotice ? (
                  <div
                    className="notice"
                    style={{
                      marginBottom: 16,
                      background: '#eefbf3',
                      border: '1px solid rgba(11, 107, 52, 0.18)',
                      color: '#123122',
                      boxShadow: '0 12px 24px rgba(11, 107, 52, 0.06)',
                    }}
                  >
                    <strong style={{ color: '#0b6b34' }}>Saved and logged</strong>
                    <p style={{ marginBottom: 0 }}>{auditSuccessNotice}</p>
                  </div>
                ) : null}
                <div className="record-list">
                  {portal.auditEvents.map(event => {
                    const reviewSummary = event.metadataJson?.reviewSummary;
                    const deltas = event.metadataJson?.deltas;
                    const usageSnapshot = event.metadataJson?.usageSnapshot;
                    const hasPlanReviewMetadata = event.eventType === 'PLAN_CHANGED' && !!reviewSummary;
                    const hasCountyAllocationMetadata = event.eventType === 'COUNTY_ALLOCATION_UPDATED';
                    const hasContactMetadata = event.eventType === 'CONTACT_UPDATED';
                    const hasPaymentMetadata = event.eventType === 'PAYMENT_METHOD_UPDATED';
                    const hasModuleMetadata = event.eventType === 'MODULE_UPDATED';
                    const estimatedDelta = deltas?.estimatedRecurringDeltaCents;
                    const hasRisk = (deltas?.countyCoverageDelta ?? 0) < 0 || (deltas?.seatPriceDeltaCents ?? 0) > 0 || (estimatedDelta ?? 0) > 0 || (deltas?.removedModules?.length ?? 0) > 0 || event.metadataJson?.status === 'REMOVED';
                    const isExpanded = !!expandedAuditEventIds[event.id];
                    const isHighlighted = highlightedAuditEventId === event.id;
                    const contactNameChanged = event.metadataJson?.previousBillingContactName !== event.metadataJson?.newBillingContactName;
                    const contactEmailChanged = event.metadataJson?.previousBillingContactEmail !== event.metadataJson?.newBillingContactEmail;
                    const contactPhoneChanged = event.metadataJson?.previousBillingContactPhone !== event.metadataJson?.newBillingContactPhone;
                    const paymentBrandChanged = event.metadataJson?.previousPaymentBrand !== event.metadataJson?.newPaymentBrand;
                    const paymentLast4Changed = event.metadataJson?.previousPaymentLast4 !== event.metadataJson?.newPaymentLast4;
                    const paymentExpirationChanged = event.metadataJson?.previousPaymentExpMonth !== event.metadataJson?.newPaymentExpMonth || event.metadataJson?.previousPaymentExpYear !== event.metadataJson?.newPaymentExpYear;
                    const paymentBillingNameChanged = event.metadataJson?.previousBillingName !== event.metadataJson?.newBillingName;
                    const paymentBillingEmailChanged = event.metadataJson?.previousBillingEmail !== event.metadataJson?.newBillingEmail;
                    const countyStatusChanged = event.metadataJson?.previousStatus !== event.metadataJson?.newStatus;
                    const countySeatLimitChanged = event.metadataJson?.previousSeatLimit !== event.metadataJson?.newSeatLimit;
                    const countyNotesChanged = event.metadataJson?.previousNotes !== event.metadataJson?.newNotes;
                    const moduleEnabledChanged = event.metadataJson?.previousEnabled !== event.metadataJson?.newEnabled;

                    return (
                      <div
                        ref={node => { auditEventRefs.current[event.id] = node; }}
                        key={event.id}
                        className="record-item"
                        style={{
                          background: isHighlighted ? '#fff7ed' : hasPlanReviewMetadata && hasRisk ? '#fffaf8' : undefined,
                          borderColor: isHighlighted ? '#fdba74' : hasPlanReviewMetadata && hasRisk ? '#f5d0b5' : undefined,
                          boxShadow: isHighlighted ? '0 0 0 1px rgba(249, 115, 22, 0.18)' : undefined,
                          transition: 'background-color 320ms ease, border-color 320ms ease, box-shadow 320ms ease, transform 320ms ease',
                          transform: isHighlighted ? 'translateY(-1px)' : 'translateY(0)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <strong>{event.summary}</strong>
                          <div className="actions-row" style={{ marginTop: 0 }}>
                            {hasPlanReviewMetadata || hasCountyAllocationMetadata || hasContactMetadata || hasPaymentMetadata || hasModuleMetadata ? <button type="button" className="button button-ghost" onClick={() => setExpandedAuditEventIds(current => ({ ...current, [event.id]: !current[event.id] }))}>{isExpanded ? 'Hide details' : 'View details'}</button> : null}
                            <span className="status-pill" title={new Date(event.createdAt).toLocaleString()}>{formatRelativeTime(event.createdAt)}</span>
                          </div>
                        </div>
                        <div className="record-meta">
                          <span>{event.eventType}</span>
                          {event.actorName ? <span>{event.actorName}</span> : null}
                          {event.snapshotPlanName ? <span>{event.snapshotPlanName}</span> : null}
                          {typeof event.snapshotTotalCents === 'number' ? <span>{formatMoney(event.snapshotTotalCents, portal.subscription.currency)}</span> : null}
                        </div>

                        {hasPlanReviewMetadata && isExpanded ? (
                          <div className="page-stack" style={{ gap: 12, marginTop: 14 }}>
                            <div className="record-item" style={{ background: hasRisk ? '#fff5f5' : '#f8fafc', borderColor: hasRisk ? '#f5c2c7' : undefined }}>
                              <div className="kpi-label" style={{ color: hasRisk ? '#b42318' : undefined }}>Stored review summary</div>
                              <p style={{ marginTop: 10, marginBottom: 0 }}>{reviewSummary}</p>
                            </div>

                            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                              <div className="record-item" style={{ background: '#f8fafc' }}>
                                <div className="kpi-label">Usage snapshot</div>
                                <p style={{ marginTop: 10, marginBottom: 0 }}>{usageSnapshot?.seatCountPurchased ?? 0} seats purchased</p>
                                <p style={{ marginTop: 8, marginBottom: 0 }}>{usageSnapshot?.countyCountCovered ?? 0} counties covered</p>
                              </div>
                              <div className="record-item" style={{ background: (estimatedDelta ?? 0) > 0 ? '#fff5f5' : '#ecfdf3', borderColor: (estimatedDelta ?? 0) > 0 ? '#f5c2c7' : undefined }}>
                                <div className="kpi-label" style={{ color: (estimatedDelta ?? 0) > 0 ? '#b42318' : undefined }}>Estimated recurring delta</div>
                                <p style={{ marginTop: 10, marginBottom: 0, fontWeight: 800 }}>{typeof estimatedDelta === 'number' ? `${estimatedDelta > 0 ? '+' : estimatedDelta < 0 ? '-' : ''}${formatMoney(Math.abs(estimatedDelta), portal.subscription.currency)}` : 'N/A'}</p>
                              </div>
                              <div className="record-item" style={{ background: (deltas?.countyCoverageDelta ?? 0) < 0 ? '#fff5f5' : '#f5f8ff', borderColor: (deltas?.countyCoverageDelta ?? 0) < 0 ? '#f5c2c7' : undefined }}>
                                <div className="kpi-label" style={{ color: (deltas?.countyCoverageDelta ?? 0) < 0 ? '#b42318' : undefined }}>County coverage delta</div>
                                <p style={{ marginTop: 10, marginBottom: 0 }}>{typeof deltas?.countyCoverageDelta === 'number' ? `${deltas.countyCoverageDelta > 0 ? '+' : ''}${deltas.countyCoverageDelta}` : 'N/A'}</p>
                              </div>
                            </div>

                            <div className="grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                              <div className="record-item" style={{ background: '#eefbf3' }}>
                                <div className="kpi-label">Added modules</div>
                                <p style={{ marginTop: 10, marginBottom: 0 }}>{deltas?.addedModules?.length ? deltas.addedModules.join(', ') : 'None'}</p>
                              </div>
                              <div className="record-item" style={{ background: (deltas?.removedModules?.length ?? 0) > 0 ? '#fff5f5' : '#f8fafc', borderColor: (deltas?.removedModules?.length ?? 0) > 0 ? '#f5c2c7' : undefined }}>
                                <div className="kpi-label" style={{ color: (deltas?.removedModules?.length ?? 0) > 0 ? '#b42318' : undefined }}>Removed modules</div>
                                <p style={{ marginTop: 10, marginBottom: 0 }}>{deltas?.removedModules?.length ? deltas.removedModules.join(', ') : 'None'}</p>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {hasCountyAllocationMetadata && isExpanded ? (
                          <div className="page-stack" style={{ gap: 12, marginTop: 14 }}>
                            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                              <div className="record-item" style={{ background: '#f8fafc' }}>
                                <div className="kpi-label">County</div>
                                <p style={{ marginTop: 10, marginBottom: 0 }}>{event.metadataJson?.countyOrganizationName || event.metadataJson?.countyOrganizationId || 'N/A'}</p>
                              </div>
                              <div className="record-item" style={getChangedFieldStyle(countyStatusChanged, event.metadataJson?.newStatus === 'REMOVED' ? 'warning' : 'neutral')}>
                                <div className="kpi-label" style={{ color: event.metadataJson?.newStatus === 'REMOVED' ? '#b42318' : undefined }}>Status change</div>
                                <p style={{ marginTop: 10, marginBottom: 0 }}>{event.metadataJson?.previousStatus || 'Not set'} → {event.metadataJson?.newStatus || event.metadataJson?.status || 'N/A'}</p>
                              </div>
                              <div className="record-item" style={getChangedFieldStyle(countySeatLimitChanged, (typeof event.metadataJson?.previousSeatLimit === 'number' && typeof event.metadataJson?.newSeatLimit === 'number' && event.metadataJson.newSeatLimit < event.metadataJson.previousSeatLimit) ? 'warning' : 'neutral')}>
                                <div className="kpi-label">Seat limit change</div>
                                <p style={{ marginTop: 10, marginBottom: 0 }}>{typeof event.metadataJson?.previousSeatLimit === 'number' ? event.metadataJson.previousSeatLimit : 'Not set'} → {typeof event.metadataJson?.newSeatLimit === 'number' ? event.metadataJson.newSeatLimit : 'Not set'}</p>
                              </div>
                            </div>
                            <div className="grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                              <div className="record-item" style={getChangedFieldStyle(countyNotesChanged)}>
                                <div className="kpi-label">Previous notes</div>
                                <p style={{ marginTop: 10, marginBottom: 0 }}>{event.metadataJson?.previousNotes || 'None'}</p>
                              </div>
                              <div className="record-item" style={getChangedFieldStyle(countyNotesChanged)}>
                                <div className="kpi-label">New notes</div>
                                <p style={{ marginTop: 10, marginBottom: 0 }}>{event.metadataJson?.newNotes || event.metadataJson?.notes || 'None'}</p>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {hasContactMetadata && isExpanded ? (
                          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 14 }}>
                            <div className="record-item" style={getChangedFieldStyle(contactNameChanged)}>
                              <div className="kpi-label">Contact name</div>
                              <p style={{ marginTop: 10, marginBottom: 0 }}>{event.metadataJson?.previousBillingContactName || 'Not set'} → {event.metadataJson?.newBillingContactName || 'Not set'}</p>
                            </div>
                            <div className="record-item" style={getChangedFieldStyle(contactEmailChanged)}>
                              <div className="kpi-label">Contact email</div>
                              <p style={{ marginTop: 10, marginBottom: 0 }}>{event.metadataJson?.previousBillingContactEmail || 'Not set'} → {event.metadataJson?.newBillingContactEmail || 'Not set'}</p>
                            </div>
                            <div className="record-item" style={getChangedFieldStyle(contactPhoneChanged)}>
                              <div className="kpi-label">Contact phone</div>
                              <p style={{ marginTop: 10, marginBottom: 0 }}>{event.metadataJson?.previousBillingContactPhone || 'Not set'} → {event.metadataJson?.newBillingContactPhone || 'Not set'}</p>
                            </div>
                          </div>
                        ) : null}

                        {hasPaymentMetadata && isExpanded ? (
                          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 14 }}>
                            <div className="record-item" style={getChangedFieldStyle(paymentBrandChanged)}>
                              <div className="kpi-label">Card brand</div>
                              <p style={{ marginTop: 10, marginBottom: 0 }}>{event.metadataJson?.previousPaymentBrand || 'Not set'} → {event.metadataJson?.newPaymentBrand || 'Not set'}</p>
                            </div>
                            <div className="record-item" style={getChangedFieldStyle(paymentLast4Changed)}>
                              <div className="kpi-label">Last 4</div>
                              <p style={{ marginTop: 10, marginBottom: 0 }}>{event.metadataJson?.previousPaymentLast4 || 'Not set'} → {event.metadataJson?.newPaymentLast4 || 'Not set'}</p>
                            </div>
                            <div className="record-item" style={getChangedFieldStyle(paymentExpirationChanged)}>
                              <div className="kpi-label">Expiration</div>
                              <p style={{ marginTop: 10, marginBottom: 0 }}>{event.metadataJson?.previousPaymentExpMonth || 'Not set'}/{event.metadataJson?.previousPaymentExpYear || 'Not set'} → {event.metadataJson?.newPaymentExpMonth || 'Not set'}/{event.metadataJson?.newPaymentExpYear || 'Not set'}</p>
                            </div>
                            <div className="record-item" style={getChangedFieldStyle(paymentBillingNameChanged)}>
                              <div className="kpi-label">Billing name</div>
                              <p style={{ marginTop: 10, marginBottom: 0 }}>{event.metadataJson?.previousBillingName || 'Not set'} → {event.metadataJson?.newBillingName || 'Not set'}</p>
                            </div>
                            <div className="record-item" style={getChangedFieldStyle(paymentBillingEmailChanged)}>
                              <div className="kpi-label">Billing email</div>
                              <p style={{ marginTop: 10, marginBottom: 0 }}>{event.metadataJson?.previousBillingEmail || 'Not set'} → {event.metadataJson?.newBillingEmail || 'Not set'}</p>
                            </div>
                          </div>
                        ) : null}

                        {hasModuleMetadata && isExpanded ? (
                          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 14 }}>
                            <div className="record-item" style={{ background: '#f8fafc' }}>
                              <div className="kpi-label">Module</div>
                              <p style={{ marginTop: 10, marginBottom: 0 }}>{event.metadataJson?.billingModuleName || 'Unknown module'}</p>
                              <p style={{ marginTop: 8, marginBottom: 0, color: '#5b6470' }}>{event.metadataJson?.billingModuleCode || event.metadataJson?.billingModuleId || 'No code'}</p>
                            </div>
                            <div className="record-item" style={getChangedFieldStyle(moduleEnabledChanged, event.metadataJson?.newEnabled === false ? 'warning' : 'positive')}>
                              <div className="kpi-label" style={{ color: event.metadataJson?.newEnabled === false ? '#b42318' : undefined }}>Enabled state</div>
                              <p style={{ marginTop: 10, marginBottom: 0 }}>{typeof event.metadataJson?.previousEnabled === 'boolean' ? (event.metadataJson.previousEnabled ? 'Enabled' : 'Disabled') : 'Not set'} → {typeof event.metadataJson?.newEnabled === 'boolean' ? (event.metadataJson.newEnabled ? 'Enabled' : 'Disabled') : 'Not set'}</p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </main>

      {portal && planChangeTargetId ? (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.36)', display: 'grid', placeItems: 'center', padding: 24, zIndex: 50 }}>
          <div className="card" style={{ width: 'min(760px, 100%)', maxHeight: '90vh', overflow: 'auto' }}>
            {(() => {
              const targetPlan = portal.plans.find(plan => plan.id === planChangeTargetId);
              if (!targetPlan) return null;
              const currentPlan = portal.subscription.plan;
              const delta = targetPlan.basePriceCents - currentPlan.basePriceCents;
              const countyCoverageDelta = targetPlan.countyIncludedCount - currentPlan.countyIncludedCount;
              const seatPriceDelta = targetPlan.perSeatPriceCents - currentPlan.perSeatPriceCents;
              const currentCoveredCounties = portal.subscription.countyCountCovered;
              const currentPurchasedSeats = portal.subscription.seatCountPurchased;
              const currentCountyOverage = Math.max(0, currentCoveredCounties - currentPlan.countyIncludedCount);
              const targetCountyOverage = Math.max(0, currentCoveredCounties - targetPlan.countyIncludedCount);
              const currentEstimatedRecurringCents = currentPlan.basePriceCents + (currentPurchasedSeats * currentPlan.perSeatPriceCents) + (currentCountyOverage * currentPlan.additionalCountyPriceCents);
              const targetEstimatedRecurringCents = targetPlan.basePriceCents + (currentPurchasedSeats * targetPlan.perSeatPriceCents) + (targetCountyOverage * targetPlan.additionalCountyPriceCents);
              const estimatedRecurringDelta = targetEstimatedRecurringCents - currentEstimatedRecurringCents;
              const hasNegativeCostImpact = estimatedRecurringDelta > 0 || delta > 0;
              const hasNegativeCoverageImpact = countyCoverageDelta < 0;
              const hasNegativeSeatImpact = seatPriceDelta > 0;
              const currentIncludedIds = new Set(currentPlan.includedModules.map(item => item.id));
              const targetIncludedIds = new Set(targetPlan.includedModules.map(item => item.id));
              const addedModules = targetPlan.includedModules.filter(item => !currentIncludedIds.has(item.id));
              const removedModules = currentPlan.includedModules.filter(item => !targetIncludedIds.has(item.id));
              const retainedModules = targetPlan.includedModules.filter(item => currentIncludedIds.has(item.id));
              const isRiskyPlanChange = hasNegativeCostImpact || hasNegativeCoverageImpact || hasNegativeSeatImpact || removedModules.length > 0;
              const moduleChangeSummary = addedModules.length
                ? `adds ${addedModules.map(item => item.name).join(', ')}`
                : removedModules.length
                  ? `removes ${removedModules.map(item => item.name).join(', ')}`
                  : 'keeps the same included module set';
              const countyChangeSummary = countyCoverageDelta === 0
                ? 'keeps county coverage the same'
                : countyCoverageDelta > 0
                  ? `adds ${countyCoverageDelta} included ${countyCoverageDelta === 1 ? 'county' : 'counties'}`
                  : `reduces included county coverage by ${Math.abs(countyCoverageDelta)}`;
              const seatChangeSummary = seatPriceDelta === 0
                ? 'keeps seat pricing the same'
                : seatPriceDelta > 0
                  ? `raises seat pricing by ${formatMoney(seatPriceDelta)}`
                  : `lowers seat pricing by ${formatMoney(Math.abs(seatPriceDelta))}`;
              const estimateSummary = estimatedRecurringDelta === 0
                ? 'with no estimated recurring cost change at your current usage.'
                : `${estimatedRecurringDelta > 0 ? 'and increases' : 'and lowers'} estimated recurring cost by ${formatMoney(Math.abs(estimatedRecurringDelta))} at your current usage.`;
              const plainLanguageSummary = `Switching to ${targetPlan.name} ${moduleChangeSummary}, ${countyChangeSummary}, ${seatChangeSummary}, ${estimateSummary}`;
              return (
                <>
                  <div className="section-title">
                    <div>
                      <div className="eyebrow">Plan change review</div>
                      <h3 style={{ marginBottom: 8 }}>Review billing plan change</h3>
                      <p style={{ marginBottom: 0 }}>Confirm the plan switch before applying it to the active state subscription.</p>
                    </div>
                    <button type="button" className="button button-ghost" onClick={() => setPlanChangeTargetId(null)}>Close</button>
                  </div>

                  <div className="grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                    <div className="card card-muted">
                      <div className="kpi-label">Current plan</div>
                      <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900 }}>{portal.subscription.plan.name}</div>
                      <p style={{ marginTop: 10, marginBottom: 0 }}>{formatMoney(portal.subscription.plan.basePriceCents)}</p>
                    </div>
                    <div className="card card-muted" style={{ border: '1px solid rgba(16, 88, 140, 0.18)' }}>
                      <div className="kpi-label">New plan</div>
                      <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900, color: 'var(--fh-blue)' }}>{targetPlan.name}</div>
                      <p style={{ marginTop: 10, marginBottom: 0 }}>{targetPlan.basePriceCents ? formatMoney(targetPlan.basePriceCents) : 'Custom'}</p>
                    </div>
                  </div>

                  <div className="record-item" style={{ marginTop: 16, background: hasNegativeCostImpact || hasNegativeCoverageImpact || hasNegativeSeatImpact || removedModules.length ? '#fff5f5' : '#f8fafc', borderColor: hasNegativeCostImpact || hasNegativeCoverageImpact || hasNegativeSeatImpact || removedModules.length ? '#f5c2c7' : undefined }}>
                    <div className="kpi-label" style={{ color: hasNegativeCostImpact || hasNegativeCoverageImpact || hasNegativeSeatImpact || removedModules.length ? '#b42318' : undefined }}>Review summary</div>
                    <div style={{ marginTop: 8, fontWeight: 800, color: delta > 0 ? '#9a3412' : delta < 0 ? '#0b6b34' : 'var(--fh-text)' }}>
                      {delta === 0 ? 'No recurring price change' : `${delta > 0 ? '+' : '-'}${formatMoney(Math.abs(delta))} per billing interval`}
                    </div>
                    <p style={{ marginTop: 10, marginBottom: 0 }}>{plainLanguageSummary}</p>
                    {hasNegativeCostImpact || hasNegativeCoverageImpact || hasNegativeSeatImpact || removedModules.length ? <p style={{ marginTop: 10, marginBottom: 0, color: '#b42318', fontWeight: 700 }}>Review the highlighted items below before confirming this plan change.</p> : null}
                  </div>

                  <div className="grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 16 }}>
                    <div className="record-item" style={{ background: hasNegativeCostImpact ? '#fff5f5' : '#ecfdf3', borderColor: hasNegativeCostImpact ? '#f5c2c7' : undefined }}>
                      <div className="kpi-label">Estimated recurring impact at current usage</div>
                      <div style={{ marginTop: 8, fontWeight: 800, color: estimatedRecurringDelta > 0 ? '#9a3412' : estimatedRecurringDelta < 0 ? '#0b6b34' : 'var(--fh-text)' }}>
                        {estimatedRecurringDelta === 0 ? 'No estimated recurring change' : `${estimatedRecurringDelta > 0 ? '+' : '-'}${formatMoney(Math.abs(estimatedRecurringDelta))} based on current usage`}
                      </div>
                      <p style={{ marginTop: 10, marginBottom: 0 }}>
                        Estimated target recurring total: {targetPlan.basePriceCents || targetPlan.perSeatPriceCents || targetPlan.additionalCountyPriceCents ? formatMoney(targetEstimatedRecurringCents) : 'Custom'} using {currentPurchasedSeats} seats and {currentCoveredCounties} covered counties.
                      </p>
                    </div>

                    <div className="record-item" style={{ background: '#f8fafc' }}>
                      <div className="kpi-label">Estimate breakdown</div>
                      <p style={{ marginTop: 10, marginBottom: 0 }}>Current estimate: {currentPlan.basePriceCents || currentPlan.perSeatPriceCents || currentPlan.additionalCountyPriceCents ? formatMoney(currentEstimatedRecurringCents) : 'Custom'}</p>
                      <p style={{ marginTop: 8, marginBottom: 0 }}>Target estimate: {targetPlan.basePriceCents || targetPlan.perSeatPriceCents || targetPlan.additionalCountyPriceCents ? formatMoney(targetEstimatedRecurringCents) : 'Custom'}</p>
                    </div>
                  </div>

                  <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 16 }}>
                    <div className="record-item" style={{ background: hasNegativeCoverageImpact ? '#fff5f5' : '#f5f8ff', borderColor: hasNegativeCoverageImpact ? '#f5c2c7' : undefined }}>
                      <div className="kpi-label" style={{ color: hasNegativeCoverageImpact ? '#b42318' : undefined }}>County coverage</div>
                      <div style={{ marginTop: 8, fontWeight: 800, color: countyCoverageDelta > 0 ? '#0b6b34' : countyCoverageDelta < 0 ? '#b42318' : 'var(--fh-text)' }}>
                        {countyCoverageDelta === 0 ? 'No included county change' : `${countyCoverageDelta > 0 ? '+' : ''}${countyCoverageDelta} included counties`}
                      </div>
                      <p style={{ marginTop: 10, marginBottom: 0 }}>
                        {targetPlan.countyIncludedCount} counties included before additional county pricing applies.
                      </p>
                    </div>

                    <div className="record-item" style={{ background: hasNegativeSeatImpact ? '#fff5f5' : '#fff8f1', borderColor: hasNegativeSeatImpact ? '#f5c2c7' : undefined }}>
                      <div className="kpi-label" style={{ color: hasNegativeSeatImpact ? '#b42318' : undefined }}>Per-seat pricing</div>
                      <div style={{ marginTop: 8, fontWeight: 800, color: seatPriceDelta > 0 ? '#9a3412' : seatPriceDelta < 0 ? '#0b6b34' : 'var(--fh-text)' }}>
                        {seatPriceDelta === 0 ? 'No seat price change' : `${seatPriceDelta > 0 ? '+' : '-'}${formatMoney(Math.abs(seatPriceDelta))} per seat`}
                      </div>
                      <p style={{ marginTop: 10, marginBottom: 0 }}>
                        New seat rate: {targetPlan.perSeatPriceCents ? formatMoney(targetPlan.perSeatPriceCents) : 'Custom'}.
                      </p>
                    </div>

                    <div className="record-item" style={{ background: '#f9fafb' }}>
                      <div className="kpi-label">Additional county pricing</div>
                      <div style={{ marginTop: 8, fontWeight: 800 }}>
                        {targetPlan.additionalCountyPriceCents ? formatMoney(targetPlan.additionalCountyPriceCents) : 'Included or custom'}
                      </div>
                      <p style={{ marginTop: 10, marginBottom: 0 }}>
                        Applies once usage exceeds the included county threshold for this plan.
                      </p>
                    </div>
                  </div>

                  <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 16 }}>
                    <div className="record-item" style={{ background: '#eefbf3' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <strong>Newly included</strong>
                        <span className="status-pill" style={{ background: '#dff5e7', color: '#0b6b34' }}>{addedModules.length}</span>
                      </div>
                      {addedModules.length ? (
                        <ul style={{ margin: '12px 0 0', paddingLeft: 18 }}>
                          {addedModules.map(item => <li key={item.id} style={{ marginTop: 6 }}>{item.name}</li>)}
                        </ul>
                      ) : <p style={{ marginTop: 12, marginBottom: 0 }}>No additional included modules.</p>}
                    </div>

                    <div className="record-item" style={{ background: '#f5f8ff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <strong>Still included</strong>
                        <span className="status-pill" style={{ background: '#e6eeff', color: 'var(--fh-blue)' }}>{retainedModules.length}</span>
                      </div>
                      {retainedModules.length ? (
                        <ul style={{ margin: '12px 0 0', paddingLeft: 18 }}>
                          {retainedModules.map(item => <li key={item.id} style={{ marginTop: 6 }}>{item.name}</li>)}
                        </ul>
                      ) : <p style={{ marginTop: 12, marginBottom: 0 }}>No modules carry over unchanged.</p>}
                    </div>

                    <div className="record-item" style={{ background: removedModules.length ? '#fff5f5' : '#f9fafb', borderColor: removedModules.length ? '#f5c2c7' : undefined }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <strong style={{ color: removedModules.length ? '#b42318' : undefined }}>No longer included</strong>
                        <span className="status-pill" style={{ background: '#ffe1e1', color: '#b42318' }}>{removedModules.length}</span>
                      </div>
                      {removedModules.length ? (
                        <ul style={{ margin: '12px 0 0', paddingLeft: 18 }}>
                          {removedModules.map(item => <li key={item.id} style={{ marginTop: 6 }}>{item.name}</li>)}
                        </ul>
                      ) : <p style={{ marginTop: 12, marginBottom: 0 }}>Nothing is lost in the included module bundle.</p>}
                    </div>
                  </div>

                  <div className="grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 16 }}>
                    <div className="record-item" style={{ background: '#eefbf3' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <strong>Included with {targetPlan.name}</strong>
                        <span className="status-pill" style={{ background: '#dff5e7', color: '#0b6b34' }}>{targetPlan.includedModules.length}</span>
                      </div>
                      <ul style={{ margin: '12px 0 0', paddingLeft: 18 }}>
                        {targetPlan.includedModules.map(item => <li key={item.id} style={{ marginTop: 6 }}>{item.name}</li>)}
                      </ul>
                    </div>
                    <div className="record-item" style={{ background: '#fff8f1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <strong>Still optional</strong>
                        <span className="status-pill" style={{ background: '#ffe9d5', color: '#9a3412' }}>{targetPlan.optionalModules.length}</span>
                      </div>
                      {targetPlan.optionalModules.length ? (
                        <ul style={{ margin: '12px 0 0', paddingLeft: 18 }}>
                          {targetPlan.optionalModules.map(item => <li key={item.id} style={{ marginTop: 6 }}>{item.name}</li>)}
                        </ul>
                      ) : <p style={{ marginTop: 12, marginBottom: 0 }}>This plan includes the full module catalog.</p>}
                    </div>
                  </div>

                  <div className="actions-row" style={{ justifyContent: 'flex-end' }}>
                    <button type="button" className="button button-ghost" onClick={() => setPlanChangeTargetId(null)}>Cancel</button>
                    <button
                      type="button"
                      className="button button-secondary"
                      style={isRiskyPlanChange ? { background: '#b42318', borderColor: '#b42318', color: '#fff' } : undefined}
                      disabled={saving === `plan-${targetPlan.id}`}
                      onClick={() => changePlan(targetPlan.id)}
                    >{saving === `plan-${targetPlan.id}` ? 'Switching…' : isRiskyPlanChange ? 'Confirm risky plan change' : 'Confirm plan change'}</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
