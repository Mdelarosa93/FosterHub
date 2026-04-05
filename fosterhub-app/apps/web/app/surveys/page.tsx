'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { authedGet, authedPost } from '../../lib/api';
import { getStoredSessionUser, loadSurveys, type SurveyCampaignRecord } from '../../lib/portal-data';

type ApiSurvey = {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  audience: string;
  cadence?: string;
  baseline: boolean;
  status: string;
  responseRate: number;
  averageScore: number;
};

type ApiOrganization = {
  id: string;
  name: string;
  type: 'STATE_AGENCY' | 'COUNTY_AGENCY';
};

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<ApiSurvey[]>([]);
  const [organizations, setOrganizations] = useState<ApiOrganization[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const sessionUser = getStoredSessionUser();
  const [draft, setDraft] = useState({ organizationId: '', name: '', audience: '', cadence: '', baseline: true, status: 'DRAFT' });

  useEffect(() => {
    const token = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!token) {
      const fallbackSurveys = loadSurveys().map(item => ({
        id: item.id,
        organizationId: item.countyId || 'all',
        organizationName: item.countyScope,
        name: item.name,
        audience: item.audience,
        cadence: item.cadence,
        baseline: item.baseline,
        status: item.status.toUpperCase(),
        responseRate: item.responseRate,
        averageScore: item.averageScore,
      }));
      setSurveys(fallbackSurveys);
      return;
    }

    async function load() {
      try {
        const [surveyResult, organizationResult] = await Promise.all([
          authedGet('/survey-campaigns', token),
          authedGet('/organizations/tree', token),
        ]);
        const orgs = organizationResult.data || [];
        setSurveys(surveyResult.data || []);
        setOrganizations(orgs);
        setDraft(current => ({ ...current, organizationId: sessionUser?.organizationType === 'county_agency' ? sessionUser.organizationId || '' : sessionUser?.organizationId || orgs[0]?.id || '' }));
      } catch (err: any) {
        setError(err?.message || 'Failed to load survey campaigns');
      }
    }

    load();
  }, []);

  const liveCampaigns = surveys.filter(item => item.status === 'LIVE').length;
  const scheduledCampaigns = surveys.filter(item => item.status === 'SCHEDULED').length;
  const baselineAverage = useMemo(() => {
    const baseline = surveys.filter(item => item.baseline && item.averageScore > 0);
    if (!baseline.length) return 0;
    return Math.round(baseline.reduce((sum, item) => sum + item.averageScore, 0) / baseline.length);
  }, [surveys]);

  async function handleCreateSurvey() {
    const token = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!token) {
      setError('Login is required to persist surveys to the backend.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await authedPost('/survey-campaigns', token, draft);
      const refreshed = await authedGet('/survey-campaigns', token);
      setSurveys(refreshed.data || []);
      setDraft(current => ({ ...current, name: '', audience: '', cadence: '' }));
    } catch (err: any) {
      setError(err?.message || 'Failed to create survey campaign');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Survey center">
      <main className="page-stack">
        {error ? (
          <section className="notice notice-error">
            <strong>Survey problem</strong>
            <p style={{ marginBottom: 0 }}>{error}</p>
          </section>
        ) : null}

        <section className="grid">
          <article className="card kpi">
            <span className="kpi-label">Live surveys</span>
            <span className="kpi-value">{liveCampaigns}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Scheduled campaigns</span>
            <span className="kpi-value">{scheduledCampaigns}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Baseline satisfaction score</span>
            <span className="kpi-value">{baselineAverage}%</span>
          </article>
          <article className="card">
            <div className="eyebrow">Why this matters</div>
            <p style={{ marginBottom: 0 }}>This survey module is now backed by the real survey campaign table, giving you a better path toward actual state and county analytics.</p>
          </article>
        </section>

        <section className="card card-muted">
          <div className="section-title">
            <div>
              <div className="eyebrow">Backend persistence</div>
              <h3 style={{ marginBottom: 0 }}>Create survey campaign</h3>
            </div>
          </div>
          <div className="form-grid">
            {sessionUser?.organizationType !== 'county_agency' ? (
              <div className="field">
                <label>Organization scope</label>
                <select className="select" value={draft.organizationId} onChange={e => setDraft({ ...draft, organizationId: e.target.value })}>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="field">
              <label>Name</label>
              <input className="input" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="grid">
              <div className="field">
                <label>Audience</label>
                <input className="input" value={draft.audience} onChange={e => setDraft({ ...draft, audience: e.target.value })} />
              </div>
              <div className="field">
                <label>Cadence</label>
                <input className="input" value={draft.cadence} onChange={e => setDraft({ ...draft, cadence: e.target.value })} />
              </div>
            </div>
            <div className="grid">
              <div className="field">
                <label>Status</label>
                <select className="select" value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}>
                  <option value="DRAFT">Draft</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="LIVE">Live</option>
                </select>
              </div>
              <div className="field">
                <label>Baseline survey?</label>
                <select className="select" value={draft.baseline ? 'yes' : 'no'} onChange={e => setDraft({ ...draft, baseline: e.target.value === 'yes' })}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
            <div className="actions-row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="button button-primary" onClick={handleCreateSurvey} disabled={saving}>
                {saving ? 'Saving…' : 'Create survey'}
              </button>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-title">
            <div>
              <div className="eyebrow">Campaigns</div>
              <h2 style={{ marginBottom: 0 }}>Prepared surveys</h2>
            </div>
          </div>
          <div className="record-list">
            {surveys.map(survey => (
              <article key={survey.id} className="record-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{survey.name}</strong>
                    <div className="record-meta">
                      <span>{survey.organizationName}</span>
                      <span>{survey.audience}</span>
                      <span>{survey.cadence || 'No cadence yet'}</span>
                    </div>
                  </div>
                  <span className="status-pill">{survey.status}</span>
                </div>
                <div className="grid" style={{ marginTop: 18 }}>
                  <div className="card card-muted" style={{ padding: 18 }}>
                    <div className="eyebrow">Response tracking</div>
                    <strong>{survey.responseRate}% response rate</strong>
                    <p style={{ marginBottom: 0 }}>Responses and summary metrics now have a real backend campaign record to attach to.</p>
                  </div>
                  <div className="card card-muted" style={{ padding: 18 }}>
                    <div className="eyebrow">Satisfaction score</div>
                    <strong>{survey.averageScore || 'Pending'}{survey.averageScore ? '%' : ''}</strong>
                    <p style={{ marginBottom: 0 }}>{survey.baseline ? 'This is marked as a baseline survey.' : 'This is a follow-up or ongoing survey.'}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
