'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authedGet } from '../../lib/api';
import { AppShell } from '../../components/AppShell';

type CaseRecord = {
  id: string;
  status: string;
  child: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
};

export default function CasesPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) {
      setError('No token found. Please log in first.');
      return;
    }

    async function load() {
      try {
        const result = await authedGet('/cases', authToken);
        setCases(result.data || []);
      } catch (err: any) {
        setError(err?.message || 'Failed to load cases');
      }
    }

    load();
  }, []);

  return (
    <AppShell title="Cases">
      <main className="page-stack">
        <section className="card">
          <div className="section-title">
            <div>
              <div className="eyebrow">Case management</div>
              <h2>Current cases</h2>
              <p>Browse active case records and move into detailed workflow actions from here.</p>
            </div>
            <Link href="/intake" className="button button-ghost">Go to intake</Link>
          </div>

          {error ? (
            <div className="notice notice-error">
              <strong>Cases load problem</strong>
              <p style={{ marginBottom: 0 }}>{error}</p>
            </div>
          ) : null}

          {cases.length === 0 ? (
            <div className="empty-state">
              <strong>No cases yet.</strong>
              <p style={{ marginBottom: 0 }}>
                Once intake records are converted into active cases, they will appear here.
              </p>
            </div>
          ) : (
            <div className="record-list">
              {cases.map(item => (
                <article key={item.id} className="record-item">
                  <strong>{item.child.firstName} {item.child.lastName}</strong>
                  <div className="record-meta">
                    <span className="status-pill">{item.status}</span>
                    <span>Created: {new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="actions-row">
                    <Link href={`/cases/${item.id}`} className="button button-secondary">Open case detail</Link>
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
