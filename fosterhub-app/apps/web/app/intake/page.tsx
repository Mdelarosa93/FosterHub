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
    const token = localStorage.getItem('fosterhub.dev.token');
    if (!token) {
      setError('No token found. Please log in first.');
      return;
    }

    try {
      const result = await authedGet('/intake-records', token);
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
    <AppShell title="Intake">
      <main>
        <section className="card" style={{ margin: 24 }}>
          <h3>Create intake record</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, marginTop: 16 }}>
            <label>
              <div>Child first name</div>
              <input value={childFirstName} onChange={e => setChildFirstName(e.target.value)} required style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ccc' }} />
            </label>
            <label>
              <div>Child last name</div>
              <input value={childLastName} onChange={e => setChildLastName(e.target.value)} required style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ccc' }} />
            </label>
            <label>
              <div>Notes</div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ccc' }} />
            </label>
            <button type="submit" disabled={loading} style={{ background: '#046307', color: 'white', border: 'none', borderRadius: 10, padding: '12px 16px', fontWeight: 700 }}>
              {loading ? 'Saving...' : 'Create intake record'}
            </button>
          </form>
          {error ? <p style={{ color: '#b42318', marginTop: 16 }}>{error}</p> : null}
        </section>

        <section className="card" style={{ margin: '0 24px 24px' }}>
          <h3>Current intake queue</h3>
          {records.length === 0 ? (
            <p>No intake records yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {records.map(record => (
                <article key={record.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                  <strong>{record.childFirstName} {record.childLastName}</strong>
                  <div>Status: {record.status}</div>
                  <div>Created: {new Date(record.createdAt).toLocaleString()}</div>
                  {record.notes ? <p style={{ marginTop: 8 }}>{record.notes}</p> : null}
                  {record.status !== 'CONVERTED' ? (
                    <button onClick={() => handleConvertToCase(record.id)} style={{ marginTop: 12, background: '#10588c', color: 'white', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 700 }}>
                      Convert to case
                    </button>
                  ) : (
                    <p style={{ marginTop: 12 }}><strong>Converted to case</strong></p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
