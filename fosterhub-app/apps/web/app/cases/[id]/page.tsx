'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { API_BASE, authedGet } from '../../../lib/api';
import { AppShell } from '../../../components/AppShell';

type RequestDecisionState = Record<string, string>;

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const caseId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [data, setData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workerEmail, setWorkerEmail] = useState('mikeorlando.delarosafisher@gmail.com');
  const [docTitle, setDocTitle] = useState('');
  const [docFileName, setDocFileName] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [decisionNotes, setDecisionNotes] = useState<RequestDecisionState>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load() {
    const token = localStorage.getItem('fosterhub.dev.token');
    if (!token || !caseId) {
      setError('No token or case id found. Please log in first.');
      return;
    }

    setLoading(true);

    try {
      const [caseResult, docResult] = await Promise.all([
        authedGet(`/cases/${caseId}`, token),
        authedGet(`/documents/case/${caseId}`, token),
      ]);
      setData(caseResult.data);
      setDocuments(docResult.data || []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load case detail');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (caseId) load();
  }, [caseId]);

  async function handleCreateRequest(event: FormEvent) {
    event.preventDefault();
    const token = localStorage.getItem('fosterhub.dev.token');
    if (!token || !caseId) {
      setError('No token or case id found. Please log in first.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/cases/${caseId}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.message || 'Failed to create request');
      setTitle('');
      setDescription('');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to create request');
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignWorker(event: FormEvent) {
    event.preventDefault();
    const token = localStorage.getItem('fosterhub.dev.token');
    if (!token || !caseId) {
      setError('No token or case id found. Please log in first.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_BASE}/cases/${caseId}/assign-worker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: workerEmail }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.message || 'Failed to assign worker');
      await load();
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to assign worker');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateDocument(event: FormEvent) {
    event.preventDefault();
    const token = localStorage.getItem('fosterhub.dev.token');
    if (!token || !caseId) {
      setError('No token or case id found. Please log in first.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_BASE}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          caseId,
          title: docTitle,
          fileName: docFileName,
          notes: docNotes,
          contentType: 'application/pdf',
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.message || 'Failed to create document metadata');
      setDocTitle('');
      setDocFileName('');
      setDocNotes('');
      await load();
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to create document metadata');
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestDecision(requestId: string, action: 'approve' | 'deny') {
    const token = localStorage.getItem('fosterhub.dev.token');
    if (!token) {
      setError('No token found. Please log in first.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_BASE}/cases/requests/${requestId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: decisionNotes[requestId] || '' }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.message || `Failed to ${action} request`);
      await load();
      setError(null);
    } catch (err: any) {
      setError(err?.message || `Failed to ${action} request`);
    } finally {
      setSaving(false);
    }
  }

  const childName = data ? `${data.child.firstName} ${data.child.lastName}` : 'Case detail';
  const caseNumberMap: Record<string, string> = {
    Hall: '123456',
    Johnson: '234567',
    Carter: '345678',
    Lewis: '456789',
  };
  const caseLabel = data?.child?.lastName
    ? `${data.child.lastName} - ${caseNumberMap[data.child.lastName] || '000000'}`
    : 'Case detail';
  const childCountMap: Record<string, number> = {
    Hall: 2,
    Johnson: 1,
    Carter: 2,
    Lewis: 1,
  };
  const childCount = data?.child?.lastName ? childCountMap[data.child.lastName] || 1 : 0;
  const openRequestCount = data?.requests?.filter((request: any) => request.status === 'SUBMITTED').length ?? 0;

  return (
    <AppShell title={<Link href="/cases" className="button button-ghost" style={{ fontSize: 16, fontWeight: 800, minHeight: 44, padding: '10px 16px' }}>Back to Cases</Link>}>
      <main className="page-stack">
        <section className="hero" style={{ padding: '28px 32px' }}>
          <h2 style={{ fontSize: 34, margin: 0 }}>{caseLabel}</h2>
        </section>

        {error ? (
          <section className="notice notice-error">
            <strong>Case problem</strong>
            <p style={{ marginBottom: 0 }}>{error}</p>
          </section>
        ) : null}

        <section className="grid">
          <article className="card kpi">
            <span className="kpi-label">Case status</span>
            <span className="kpi-value" style={{ fontSize: 24 }}>{data?.status ?? (loading ? 'Loading...' : 'Unknown')}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Children</span>
            <span className="kpi-value">{childCount}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Open Requests</span>
            <span className="kpi-value">{openRequestCount}</span>
          </article>
          <article className="card kpi">
            <span className="kpi-label">Opened</span>
            <span className="kpi-value" style={{ fontSize: 22 }}>
              {data?.openedAt ? new Date(data.openedAt).toLocaleDateString() : loading ? 'Loading...' : 'Unknown'}
            </span>
          </article>
        </section>

        {!data && !loading ? (
          <section className="empty-state">
            <strong>Case details are not available yet.</strong>
            <p style={{ marginBottom: 0 }}>Once the case loads successfully, assignments, documents, and requests will show here.</p>
          </section>
        ) : null}

        <section className="grid" style={{ alignItems: 'start' }}>
          <section className="card">
            <div className="section-title">
              <div>
                <div className="eyebrow">Team coverage</div>
                <h3>Assignments</h3>
              </div>
            </div>

            {data?.assignments?.length ? (
              <div className="record-list">
                {data.assignments.map((assignment: any) => (
                  <article key={assignment.id} className="record-item">
                    <strong>{assignment.user.firstName} {assignment.user.lastName}</strong>
                    <div className="record-meta">
                      <span>{assignment.user.email}</span>
                      <span className="status-pill">{assignment.roleLabel}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <strong>No assignments yet.</strong>
                <p style={{ marginBottom: 0 }}>Assign a worker to start the case team structure.</p>
              </div>
            )}

            <form onSubmit={handleAssignWorker} className="form-grid" style={{ marginTop: 18 }}>
              <div className="field">
                <label htmlFor="workerEmail">Assign worker by email</label>
                <input
                  id="workerEmail"
                  className="input"
                  value={workerEmail}
                  onChange={e => setWorkerEmail(e.target.value)}
                  type="email"
                  required
                />
              </div>
              <button type="submit" className="button button-secondary" disabled={saving}>
                {saving ? 'Saving...' : 'Assign worker'}
              </button>
            </form>
          </section>

          <section className="card card-muted">
            <div className="section-title">
              <div>
                <div className="eyebrow">Case summary</div>
                <h3>Current snapshot</h3>
              </div>
            </div>
            <div className="stack">
              <div>
                <strong>Case</strong>
                <p style={{ marginBottom: 0 }}>{caseLabel}</p>
              </div>
              <div>
                <strong>Child</strong>
                <p style={{ marginBottom: 0 }}>{childName}</p>
              </div>
              <div>
                <strong>Status</strong>
                <p style={{ marginBottom: 0 }}>{data?.status ?? 'Not loaded yet'}</p>
              </div>
              <div>
                <strong>Opened at</strong>
                <p style={{ marginBottom: 0 }}>
                  {data?.openedAt ? new Date(data.openedAt).toLocaleString() : 'Not loaded yet'}
                </p>
              </div>
            </div>
          </section>
        </section>

        <section className="grid" style={{ alignItems: 'start' }}>
          <section className="card">
            <div className="section-title">
              <div>
                <div className="eyebrow">Document tracking</div>
                <h3>Documents</h3>
                <p>Track document metadata attached to this case before full file workflows are added.</p>
              </div>
            </div>

            <form onSubmit={handleCreateDocument} className="form-grid">
              <div className="field">
                <label htmlFor="docTitle">Document title</label>
                <input id="docTitle" className="input" value={docTitle} onChange={e => setDocTitle(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="docFileName">File name</label>
                <input id="docFileName" className="input" value={docFileName} onChange={e => setDocFileName(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="docNotes">Notes</label>
                <textarea id="docNotes" className="textarea" value={docNotes} onChange={e => setDocNotes(e.target.value)} rows={3} />
              </div>
              <button type="submit" className="button button-warning" disabled={saving}>
                {saving ? 'Saving...' : 'Add document metadata'}
              </button>
            </form>

            <div style={{ marginTop: 18 }}>
              {documents.length ? (
                <div className="record-list">
                  {documents.map(doc => (
                    <article key={doc.id} className="record-item">
                      <strong>{doc.title}</strong>
                      <div className="record-meta">
                        <span>{doc.fileName}</span>
                        {doc.contentType ? <span>{doc.contentType}</span> : null}
                      </div>
                      {doc.notes ? <p style={{ marginTop: 12, marginBottom: 0 }}>{doc.notes}</p> : null}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <strong>No documents linked yet.</strong>
                  <p style={{ marginBottom: 0 }}>Add basic metadata so supporting records are visible in the case workspace.</p>
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="section-title">
              <div>
                <div className="eyebrow">Request intake</div>
                <h3>Create request</h3>
                <p>Submit a new request for placement, service, or operational action tied to this case.</p>
              </div>
            </div>

            <form onSubmit={handleCreateRequest} className="form-grid">
              <div className="field">
                <label htmlFor="requestTitle">Request title</label>
                <input id="requestTitle" className="input" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="requestDescription">Description</label>
                <textarea id="requestDescription" className="textarea" value={description} onChange={e => setDescription(e.target.value)} rows={4} />
              </div>
              <button type="submit" className="button button-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Create request'}
              </button>
            </form>
          </section>
        </section>

        <section className="card">
          <div className="section-title">
            <div>
              <div className="eyebrow">Approval workflow</div>
              <h3>Requests</h3>
            </div>
          </div>

          {data?.requests?.length ? (
            <div className="record-list">
              {data.requests.map((request: any) => (
                <article key={request.id} className="record-item">
                  <strong>{request.title}</strong>
                  <div className="record-meta">
                    <span className="status-pill">{request.status}</span>
                    {request.createdAt ? <span>Created: {new Date(request.createdAt).toLocaleString()}</span> : null}
                  </div>
                  {request.description ? <p style={{ marginTop: 12 }}>{request.description}</p> : null}

                  {request.decidedAt ? (
                    <div className="notice" style={{ marginTop: 14 }}>
                      <strong>Decision recorded</strong>
                      <p style={{ marginBottom: 0 }}>
                        {request.decidedBy ? `${request.decidedBy.firstName} ${request.decidedBy.lastName}` : 'Unknown approver'}
                        {' '}updated this request on {new Date(request.decidedAt).toLocaleString()}.
                      </p>
                      {request.decisionNote ? (
                        <p style={{ marginTop: 10, marginBottom: 0 }}><strong>Decision note:</strong> {request.decisionNote}</p>
                      ) : null}
                    </div>
                  ) : null}

                  {request.status === 'SUBMITTED' ? (
                    <div style={{ marginTop: 16 }}>
                      <div className="field">
                        <label htmlFor={`decision-note-${request.id}`}>Decision note</label>
                        <textarea
                          id={`decision-note-${request.id}`}
                          className="textarea"
                          value={decisionNotes[request.id] || ''}
                          onChange={e => setDecisionNotes(current => ({ ...current, [request.id]: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <div className="actions-row">
                        <button onClick={() => handleRequestDecision(request.id, 'approve')} className="button button-primary" disabled={saving}>
                          Approve
                        </button>
                        <button onClick={() => handleRequestDecision(request.id, 'deny')} className="button button-danger" disabled={saving}>
                          Deny
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No requests yet.</strong>
              <p style={{ marginBottom: 0 }}>Create the first request to begin the approval workflow for this case.</p>
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
