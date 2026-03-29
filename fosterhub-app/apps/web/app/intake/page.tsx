'use client';

import { FormEvent, useEffect, useState } from 'react';
import { API_BASE, authedGet } from '../../lib/api';
import { AppShell } from '../../components/AppShell';

type IntakeRecord = {
  id: string;
  childFirstName: string;
  childLastName: string;
  status: string;
  notes?: string | null;
  createdAt: string;
};

export default function IntakePage() {
  const [records, setRecords] = useState<IntakeRecord[]>([]);
  const [childFirstName, setChildFirstName] = useState('');
  const [childLastName, setChildLastName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadRecords() {
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) {
      setError('No token found. Please log in first.');
      return;
    }

    try {
      const result = await authedGet('/intake-records', authToken);
      setRecords(result.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load intake records');
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const token = localStorage.getItem('fosterhub.dev.token');
    if (!token) {
      setError('No token found. Please log in first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/intake-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ childFirstName, childLastName, notes }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body?.message || 'Failed to create intake record');

      setChildFirstName('');
      setChildLastName('');
      setNotes('');
      await loadRecords();
    } catch (err: any) {
      setError(err?.message || 'Failed to create intake record');
    } finally {
      setLoading(false);
    }
  }

  async function handleConvertToCase(intakeId: string) {
    const token = localStorage.getItem('fosterhub.dev.token');
    if (!token) {
      setError('No token found. Please log in first.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/intake-records/${intakeId}/convert-to-case`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.message || 'Failed to convert intake record');
      await loadRecords();
    } catch (err: any) {
      setError(err?.message || 'Failed to convert intake record');
    }
  }

  return (
    <AppShell title="Intake queue">
      <main className="page-stack">
        <section className="grid" style={{ alignItems: 'start' }}>
          <div className="card">
            <div className="section-title">
              <div>
                <div className="eyebrow">New intake</div>
                <h2>Create intake record</h2>
                <p>Capture an incoming child record and move it into the formal intake queue.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="form-grid">
              <div className="field">
                <label htmlFor="childFirstName">Child first name</label>
                <input id="childFirstName" className="input" value={childFirstName} onChange={e => setChildFirstName(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="childLastName">Child last name</label>
                <input id="childLastName" className="input" value={childLastName} onChange={e => setChildLastName(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="notes">Notes</label>
                <textarea id="notes" className="textarea" value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
              </div>
              <button type="submit" disabled={loading} className="button button-primary">
                {loading ? 'Saving intake record...' : 'Create intake record'}
              </button>
            </form>

            {error ? (
              <div className="notice notice-error" style={{ marginTop: 16 }}>
                <strong>Intake problem</strong>
                <p style={{ marginBottom: 0 }}>{error}</p>
              </div>
            ) : null}
          </div>

          <aside className="card card-muted">
            <div className="eyebrow">Workflow</div>
            <h3 style={{ marginBottom: 12 }}>Expected path</h3>
            <div className="stack">
              <div>
                <strong>1. Capture intake</strong>
                <p style={{ marginBottom: 0 }}>Create a clean intake record with basic child information and notes.</p>
              </div>
              <div>
                <strong>2. Review queue</strong>
                <p style={{ marginBottom: 0 }}>Confirm details and validate that the record is ready for case creation.</p>
              </div>
              <div>
                <strong>3. Convert to case</strong>
                <p style={{ marginBottom: 0 }}>Promote the record into a real case when the next workflow stage begins.</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="card">
          <div className="section-title">
            <div>
              <div className="eyebrow">Current workload</div>
              <h3>Intake queue</h3>
            </div>
          </div>

          {records.length === 0 ? (
            <div className="empty-state">
              <strong>No intake records yet.</strong>
              <p style={{ marginBottom: 0 }}>Create the first intake record to begin the workflow.</p>
            </div>
          ) : (
            <div className="record-list">
              {records.map(record => (
                <article key={record.id} className="record-item">
                  <strong>{record.childFirstName} {record.childLastName}</strong>
                  <div className="record-meta">
                    <span className="status-pill">{record.status}</span>
                    <span>Created: {new Date(record.createdAt).toLocaleString()}</span>
                  </div>
                  {record.notes ? <p style={{ marginTop: 12, marginBottom: 0 }}>{record.notes}</p> : null}
                  <div className="actions-row">
                    {record.status !== 'CONVERTED' ? (
                      <button onClick={() => handleConvertToCase(record.id)} className="button button-secondary">
                        Convert to case
                      </button>
                    ) : (
                      <span className="status-pill">Converted to case</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
