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

type AssignedCaseRecord = {
  caseId: string;
};

type DisplayCase = CaseRecord & {
  caseNumber: string;
  caseLabel: string;
};

export default function CasesPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [assignedCaseIds, setAssignedCaseIds] = useState<string[]>([]);
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
        const [casesResult, myCasesResult] = await Promise.all([
          authedGet('/cases', authToken),
          authedGet('/worker-dashboard/my-cases', authToken),
        ]);
        setCases(casesResult.data || []);
        setAssignedCaseIds((myCasesResult.data || []).map((item: AssignedCaseRecord) => item.caseId));
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

  const searchMatches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];

    return displayCases.filter(item => {
      const fullName = `${item.child.firstName} ${item.child.lastName}`.toLowerCase();
      return fullName.includes(normalizedQuery) || item.caseNumber.includes(normalizedQuery) || item.caseLabel.toLowerCase().includes(normalizedQuery);
    }).slice(0, 6);
  }, [displayCases, query]);

  const myCases = useMemo(() => {
    return displayCases.filter(item => assignedCaseIds.includes(item.id));
  }, [displayCases, assignedCaseIds]);

  return (
    <AppShell
      title="Cases"
      headerActions={
        <div style={{ position: 'relative', maxWidth: 360 }}>
          <input
            className="input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by case name or number"
          />

          {query.trim() && searchMatches.length ? (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #d9e5dd',
                borderRadius: 18,
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
                padding: 10,
                display: 'grid',
                gap: 8,
                zIndex: 20,
              }}
            >
              {searchMatches.map(item => (
                <Link
                  key={item.id}
                  href={`/cases/${item.id}`}
                  className="button button-ghost"
                  style={{ justifyContent: 'flex-start' }}
                >
                  <span style={{ display: 'grid', textAlign: 'left' }}>
                    <strong>{item.caseLabel}</strong>
                    <span className="muted">Child: {item.child.firstName} {item.child.lastName}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      }
    >
      <main className="page-stack">
        <section className="card">
          <div className="section-title">
            <div>
              <div className="eyebrow">Case management</div>
              <h2>My cases</h2>
              <p>These are the cases currently assigned to this user.</p>
            </div>
            <Link href="/intake" className="button button-ghost">Go to intake</Link>
          </div>

          {error ? (
            <div className="notice notice-error">
              <strong>Cases load problem</strong>
              <p style={{ marginBottom: 0 }}>{error}</p>
            </div>
          ) : null}

          {myCases.length === 0 ? (
            <div className="empty-state">
              <strong>No assigned cases yet.</strong>
              <p style={{ marginBottom: 0 }}>
                Cases assigned to this user will appear here.
              </p>
            </div>
          ) : (
            <div className="record-list">
              {myCases.map(item => (
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
