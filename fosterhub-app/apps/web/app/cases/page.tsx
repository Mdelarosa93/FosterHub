'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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

type DisplayCase = CaseRecord & {
  caseNumber: string;
  caseLabel: string;
};

export default function CasesPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [query, setQuery] = useState('');
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

  const displayCases = useMemo<DisplayCase[]>(() => {
    return cases.map((item, index) => {
      const caseNumber = String(123456 + index);
      const caseLabel = `${item.child.lastName} - ${caseNumber}`;
      return { ...item, caseNumber, caseLabel };
    });
  }, [cases]);

  const filteredCases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return displayCases;

    return displayCases.filter(item => {
      const fullName = `${item.child.firstName} ${item.child.lastName}`.toLowerCase();
      return fullName.includes(normalizedQuery) || item.caseNumber.includes(normalizedQuery) || item.caseLabel.toLowerCase().includes(normalizedQuery);
    });
  }, [displayCases, query]);

  return (
    <AppShell
      title="Cases"
      headerActions={
        <input
          className="input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by case name or number"
          style={{ maxWidth: 360 }}
        />
      }
    >
      <main className="page-stack">
        <section className="card">
          <div className="section-title">
            <div>
              <div className="eyebrow">Case management</div>
              <h2>Current cases</h2>
              <p>Browse all cases and quickly pull up the right case by name or case number.</p>
            </div>
            <Link href="/intake" className="button button-ghost">Go to intake</Link>
          </div>

          {error ? (
            <div className="notice notice-error">
              <strong>Cases load problem</strong>
              <p style={{ marginBottom: 0 }}>{error}</p>
            </div>
          ) : null}

          {filteredCases.length === 0 ? (
            <div className="empty-state">
              <strong>No cases match that search.</strong>
              <p style={{ marginBottom: 0 }}>
                Try a child name, family name, or case number.
              </p>
            </div>
          ) : (
            <div className="record-list">
              {filteredCases.map(item => (
                <article key={item.id} className="record-item">
                  <strong>{item.caseLabel}</strong>
                  <div className="record-meta">
                    <span className="status-pill">{item.status}</span>
                    <span>Child: {item.child.firstName} {item.child.lastName}</span>
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
