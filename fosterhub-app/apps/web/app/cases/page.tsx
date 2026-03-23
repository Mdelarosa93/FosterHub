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
      <main>
        {error ? (
          <section className="card" style={{ margin: 24 }}>
            <h3>Cases load problem</h3>
            <p>{error}</p>
          </section>
        ) : null}

        <section className="card" style={{ margin: 24 }}>
          <h3>Current cases</h3>
          {cases.length === 0 ? (
            <p>No cases yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {cases.map(item => (
                <article key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                  <strong>{item.child.firstName} {item.child.lastName}</strong>
                  <div>Status: {item.status}</div>
                  <div>Created: {new Date(item.createdAt).toLocaleString()}</div>
                  <p style={{ marginTop: 12 }}>
                    <Link href={`/cases/${item.id}`}>Open case</Link>
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
