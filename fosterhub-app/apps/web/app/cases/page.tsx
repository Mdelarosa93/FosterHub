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
  childCount: number;
  caseWorker: string;
  supervisor: string;
};

const caseMetaByLastName: Record<string, { childCount: number; caseWorker: string; supervisor: string }> = {
  Hall: { childCount: 2, caseWorker: 'Taylor Reed', supervisor: 'Monica Alvarez' },
  Johnson: { childCount: 1, caseWorker: 'Taylor Reed', supervisor: 'Monica Alvarez' },
  Carter: { childCount: 2, caseWorker: 'Jordan Kim', supervisor: 'Monica Alvarez' },
  Lewis: { childCount: 1, caseWorker: 'Jordan Kim', supervisor: 'Monica Alvarez' },
};

const caseNumberMap: Record<string, string> = {
  Hall: '123456',
  Johnson: '234567',
  Carter: '345678',
  Lewis: '456789',
};

export default function CasesPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [assignedCaseIds, setAssignedCaseIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [showAllCases, setShowAllCases] = useState(false);
  const [storedChildCounts, setStoredChildCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const countsRaw = localStorage.getItem('fosterhub.caseChildCounts');
    setStoredChildCounts(countsRaw ? JSON.parse(countsRaw) : {});

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
    return cases.map(item => {
      const caseNumber = caseNumberMap[item.child.lastName] || '000000';
      const caseLabel = `${item.child.lastName} - ${caseNumber}`;
      const meta = caseMetaByLastName[item.child.lastName] || {
        childCount: 1,
        caseWorker: 'Unassigned',
        supervisor: 'Unassigned',
      };
      const childCount = storedChildCounts[caseLabel] || meta.childCount;
      return { ...item, caseNumber, caseLabel, ...meta, childCount };
    });
  }, [cases, storedChildCounts]);

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

  const visibleCases = showAllCases ? displayCases : myCases;

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
        <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <button type="button" className="button button-primary">Add a case</button>
          <button
            type="button"
            className="button button-ghost"
            onClick={() => setShowAllCases(current => !current)}
          >
            {showAllCases ? 'My cases' : 'See all cases'}
          </button>
        </section>

        <section className="card">
          <div className="section-title">
            <div>
              <h2>{showAllCases ? 'All cases' : 'My cases'}</h2>
            </div>
          </div>

          {error ? (
            <div className="notice notice-error">
              <strong>Cases load problem</strong>
              <p style={{ marginBottom: 0 }}>{error}</p>
            </div>
          ) : null}

          {visibleCases.length === 0 ? (
            <div className="empty-state">
              <strong>{showAllCases ? 'No cases found in the system.' : 'No assigned cases yet.'}</strong>
              <p style={{ marginBottom: 0 }}>
                {showAllCases
                  ? 'Cases will appear here once they exist in FosterHub.'
                  : 'Cases assigned to this user will appear here.'}
              </p>
            </div>
          ) : (
            <div className="record-list">
              {visibleCases.map(item => (
                <Link key={item.id} href={`/cases/${item.id}`} className="record-item clickable-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <strong className="clickable-card-title">{item.caseLabel}</strong>
                      <div className="record-meta" style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                        <span>Children: {item.childCount}</span>
                        <span>Case Worker: {item.caseWorker}</span>
                        <span>Supervisor: {item.supervisor}</span>
                      </div>
                    </div>
                    <span className="status-pill">{item.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
