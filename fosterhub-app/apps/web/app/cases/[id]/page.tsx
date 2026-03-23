'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { API_BASE, authedGet } from '../../../lib/api';
import { AppShell } from '../../../components/AppShell';

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workerEmail, setWorkerEmail] = useState('mikeorlando.delarosafisher@gmail.com');
  const [docTitle, setDocTitle] = useState('');
  const [docFileName, setDocFileName] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const token = localStorage.getItem('fosterhub.dev.token');
    if (!token) {
      setError('No token found. Please log in first.');
      return;
    }

    try {
      const [caseResult, docResult] = await Promise.all([
        authedGet(`/cases/${params.id}`, token),
        authedGet(`/documents/case/${params.id}`, token),
      ]);
      setData(caseResult.data);
      setDocuments(docResult.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load case detail');
    }
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function handleCreateRequest(event: FormEvent) {
    event.preventDefault();
    const token = localStorage.getItem('fosterhub.dev.token');
    if (!token) {
      setError('No token found. Please log in first.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/cases/${params.id}/requests`, {
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
    if (!token) {
      setError('No token found. Please log in first.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/cases/${params.id}/assign-worker`, {
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
    } catch (err: any) {
      setError(err?.message || 'Failed to assign worker');
    }
  }

  async function handleCreateDocument(event: FormEvent) {
    event.preventDefault();
    const token = localStorage.getItem('fosterhub.dev.token');
    if (!token) {
      setError('No token found. Please log in first.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          caseId: params.id,
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
    } catch (err: any) {
      setError(err?.message || 'Failed to create document metadata');
    }
  }

  async function handleRequestDecision(requestId: string, action: 'approve' | 'deny') {
    const token = localStorage.getItem('fosterhub.dev.token');
    if (!token) {
      setError('No token found. Please log in first.');
      return;
    }

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
    } catch (err: any) {
      setError(err?.message || `Failed to ${action} request`);
    }
  }

  return (
    <AppShell title="Case detail">
      <main>
        <section className="grid" style={{ padding: 24 }}>
          {data ? (
            <>
              <article className="card">
                <h3>Child</h3>
                <p>{data.child.firstName} {data.child.lastName}</p>
              </article>
              <article className="card">
                <h3>Status</h3>
                <p>{data.status}</p>
              </article>
              <article className="card">
                <h3>Opened</h3>
                <p>{new Date(data.openedAt).toLocaleString()}</p>
              </article>
            </>
          ) : null}
        </section>

        {error ? (
          <section className="card" style={{ margin: '0 24px 24px' }}>
            <h3>Case problem</h3>
            <p>{error}</p>
          </section>
        ) : null}

        {data ? (
          <section className="card" style={{ margin: '0 24px 24px' }}>
            <h3>Assignments</h3>
            {data.assignments?.length ? (
              <ul>
                {data.assignments.map((assignment: any) => (
                  <li key={assignment.id}>
                    {assignment.user.firstName} {assignment.user.lastName} · {assignment.roleLabel}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No assignments yet.</p>
            )}

            <form onSubmit={handleAssignWorker} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              <label>
                <div>Assign worker by email</div>
                <input value={workerEmail} onChange={e => setWorkerEmail(e.target.value)} type="email" required style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ccc' }} />
              </label>
              <button type="submit" style={{ background: '#10588c', color: 'white', border: 'none', borderRadius: 10, padding: '12px 16px', fontWeight: 700 }}>
                Assign worker
              </button>
            </form>
          </section>
        ) : null}

        <section className="card" style={{ margin: '0 24px 24px' }}>
          <h3>Documents</h3>
          <form onSubmit={handleCreateDocument} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            <label>
              <div>Document title</div>
              <input value={docTitle} onChange={e => setDocTitle(e.target.value)} required style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ccc' }} />
            </label>
            <label>
              <div>File name</div>
              <input value={docFileName} onChange={e => setDocFileName(e.target.value)} required style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ccc' }} />
            </label>
            <label>
              <div>Notes</div>
              <textarea value={docNotes} onChange={e => setDocNotes(e.target.value)} rows={3} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ccc' }} />
            </label>
            <button type="submit" style={{ background: '#7a4f01', color: 'white', border: 'none', borderRadius: 10, padding: '12px 16px', fontWeight: 700 }}>
              Add document metadata
            </button>
          </form>

          {documents.length ? (
            <ul style={{ marginTop: 16 }}>
              {documents.map(doc => (
                <li key={doc.id}>
                  {doc.title} · {doc.fileName}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ marginTop: 16 }}>No documents linked yet.</p>
          )}
        </section>

        <section className="card" style={{ margin: '0 24px 24px' }}>
          <h3>Create request</h3>
          <form onSubmit={handleCreateRequest} style={{ display: 'grid', gap: 16, marginTop: 16 }}>
            <label>
              <div>Request title</div>
              <input value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ccc' }} />
            </label>
            <label>
              <div>Description</div>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ccc' }} />
            </label>
            <button type="submit" disabled={saving} style={{ background: '#046307', color: 'white', border: 'none', borderRadius: 10, padding: '12px 16px', fontWeight: 700 }}>
              {saving ? 'Saving...' : 'Create request'}
            </button>
          </form>
        </section>

        <section className="card" style={{ margin: '0 24px 24px' }}>
          <h3>Requests</h3>
          {data?.requests?.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {data.requests.map((request: any) => (
                <article key={request.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                  <strong>{request.title}</strong>
                  <div>Status: {request.status}</div>
                  {request.description ? <p style={{ marginTop: 8 }}>{request.description}</p> : null}
                  {request.decidedAt ? (
                    <div style={{ marginTop: 8 }}>
                      <div>Decision time: {new Date(request.decidedAt).toLocaleString()}</div>
                      <div>Decided by: {request.decidedBy ? `${request.decidedBy.firstName} ${request.decidedBy.lastName}` : 'Unknown'}</div>
                    </div>
                  ) : null}
                  {request.decisionNote ? (
                    <p style={{ marginTop: 8 }}><strong>Decision note:</strong> {request.decisionNote}</p>
                  ) : null}
                  {request.status === 'SUBMITTED' ? (
                    <div style={{ marginTop: 12 }}>
                      <label>
                        <div>Decision note</div>
                        <textarea
                          value={decisionNotes[request.id] || ''}
                          onChange={e => setDecisionNotes(current => ({ ...current, [request.id]: e.target.value }))}
                          rows={3}
                          style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ccc', marginTop: 8 }}
                        />
                      </label>
                      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                        <button onClick={() => handleRequestDecision(request.id, 'approve')} style={{ background: '#046307', color: 'white', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 700 }}>
                          Approve
                        </button>
                        <button onClick={() => handleRequestDecision(request.id, 'deny')} style={{ background: '#b42318', color: 'white', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 700 }}>
                          Deny
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p>No requests yet.</p>
          )}
        </section>
      </main>
    </AppShell>
  );
}
