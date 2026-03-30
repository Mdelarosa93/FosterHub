'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { API_BASE, authedGet } from '../../../lib/api';
import { AppShell } from '../../../components/AppShell';

type RequestDecisionState = Record<string, string>;

function calculateAgeFromBirthday(birthday: string) {
  if (!birthday) return 0;
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const caseId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [data, setData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docFileName, setDocFileName] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [decisionNotes, setDecisionNotes] = useState<RequestDecisionState>({});
  const [childProfiles, setChildProfiles] = useState<any[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [childDraft, setChildDraft] = useState<any | null>(null);
  const [childDirty, setChildDirty] = useState(false);
  const [caseWorkerQuery, setCaseWorkerQuery] = useState('');
  const [placementQuery, setPlacementQuery] = useState('');
  const [supervisorQuery, setSupervisorQuery] = useState('');
  const [activePicker, setActivePicker] = useState<'caseWorker' | 'placement' | 'supervisor' | null>(null);
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
  const caseNumberMap: Record<string, string> = { Hall: '123456', Johnson: '234567', Carter: '345678', Lewis: '456789' };
  const caseLabel = data?.child?.lastName ? `${data.child.lastName} - ${caseNumberMap[data.child.lastName] || '000000'}` : 'Case detail';
  const childCountMap: Record<string, number> = { Hall: 2, Johnson: 1, Carter: 2, Lewis: 1 };
  const childCount = childProfiles.length || (data?.child?.lastName ? childCountMap[data.child.lastName] || 1 : 0);
  const openRequestCount = data?.requests?.filter((request: any) => request.status === 'SUBMITTED').length ?? 0;

  const childProfileMap: Record<string, any[]> = {
    Hall: [
      { id: 'archer-hall', name: 'Archer Hall', age: 4, birthday: '2021-04-11', status: 'Placed', caseWorker: 'Taylor Reed', supervisor: 'Monica Alvarez', placement: 'Sarah Hall' },
      { id: 'mia-hall', name: 'Mia Hall', age: 7, birthday: '2018-09-02', status: 'Pending Placement', caseWorker: 'Jordan Kim', supervisor: 'Monica Alvarez', placement: '' },
    ],
    Johnson: [
      { id: 'ava-johnson', name: 'Ava Johnson', age: 9, birthday: '2017-01-14', status: 'Placed', caseWorker: 'Taylor Reed', supervisor: 'Monica Alvarez', placement: 'Ava Johnson Foster Home' },
    ],
  };

  useEffect(() => {
    if (!data?.child?.lastName) return;
    const defaultChildren = childProfileMap[data.child.lastName] || [];
    const storedCountsRaw = localStorage.getItem('fosterhub.caseChildCounts');
    const storedCounts = storedCountsRaw ? JSON.parse(storedCountsRaw) : {};
    const existingCount = storedCounts[caseLabel];
    if (existingCount && existingCount > defaultChildren.length) {
      const paddedChildren = [...defaultChildren];
      while (paddedChildren.length < existingCount) {
        paddedChildren.push({
          id: `generated-${paddedChildren.length + 1}`,
          name: `Child ${paddedChildren.length + 1}`,
          birthday: '2020-01-01',
          status: 'Pending Placement',
          caseWorker: '',
          supervisor: '',
          placement: '',
        });
      }
      setChildProfiles(paddedChildren);
    } else {
      setChildProfiles(defaultChildren);
    }
  }, [data?.child?.lastName, caseLabel]);

  useEffect(() => {
    if (!caseLabel || !childProfiles.length) return;
    const storedCountsRaw = localStorage.getItem('fosterhub.caseChildCounts');
    const storedCounts = storedCountsRaw ? JSON.parse(storedCountsRaw) : {};
    storedCounts[caseLabel] = childProfiles.length;
    localStorage.setItem('fosterhub.caseChildCounts', JSON.stringify(storedCounts));

    const storedChildrenRaw = localStorage.getItem('fosterhub.caseChildren');
    const storedChildren = storedChildrenRaw ? JSON.parse(storedChildrenRaw) : {};
    storedChildren[caseLabel] = childProfiles.map((child: any) => child.name);
    localStorage.setItem('fosterhub.caseChildren', JSON.stringify(storedChildren));
  }, [caseLabel, childProfiles]);

  useEffect(() => {
    if (!activeChildId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeChildId]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-picker-field="true"]')) {
        setActivePicker(null);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const caseWorkers = Array.from(
    new Map(
      childProfiles.map((child: any) => [
        child.caseWorker,
        {
          name: child.caseWorker,
          role: 'Case Worker',
          assignedNames: childProfiles.filter((entry: any) => entry.caseWorker === child.caseWorker).map((entry: any) => entry.name),
        },
      ]),
    ).values(),
  );

  const supervisors = Array.from(
    new Map(
      childProfiles.map((child: any) => [
        child.supervisor,
        {
          name: child.supervisor,
          role: 'Supervisor',
          assignedNames: Array.from(
            new Set(
              childProfiles
                .filter((entry: any) => entry.supervisor === child.supervisor)
                .map((entry: any) => entry.caseWorker),
            ),
          ),
        },
      ]),
    ).values(),
  );

  const assignedStaff = [...caseWorkers, ...supervisors];

  const activeChild = childProfiles.find((child: any) => child.id === activeChildId) || null;
  const systemUserOptions = ['Taylor Reed', 'Jordan Kim', 'Monica Alvarez', 'Sarah Hall', 'David Hall', 'Ava Johnson Foster Home'];

  const caseWorkerSuggestions = (caseWorkerQuery ? systemUserOptions.filter(option => option.toLowerCase().includes(caseWorkerQuery.toLowerCase())) : systemUserOptions).slice(0, 8);
  const supervisorSuggestions = (supervisorQuery ? systemUserOptions.filter(option => option.toLowerCase().includes(supervisorQuery.toLowerCase())) : systemUserOptions).slice(0, 8);
  const placementSuggestions = (placementQuery ? systemUserOptions.filter(option => option.toLowerCase().includes(placementQuery.toLowerCase())) : systemUserOptions).slice(0, 8);

  function openChildModal(child: any) {
    setActiveChildId(child.id);
    setChildDraft({ ...child });
    setChildDirty(false);
    setCaseWorkerQuery('');
    setPlacementQuery('');
    setSupervisorQuery('');
    setActivePicker(null);
  }

  function openAddChildModal() {
    setActiveChildId('new');
    setChildDraft({
      id: 'new',
      name: '',
      birthday: '',
      status: 'Pending Placement',
      caseWorker: '',
      supervisor: '',
      placement: '',
    });
    setChildDirty(true);
    setCaseWorkerQuery('');
    setPlacementQuery('');
    setSupervisorQuery('');
    setActivePicker(null);
  }

  function closeChildModal() {
    setActiveChildId(null);
    setChildDraft(null);
    setChildDirty(false);
    setCaseWorkerQuery('');
    setPlacementQuery('');
    setSupervisorQuery('');
    setActivePicker(null);
  }

  function updateChildDraft(field: string, value: string) {
    setChildDraft((current: any) => ({ ...current, [field]: value }));
    setChildDirty(true);
  }

  function saveChildChanges() {
    if (!activeChildId || !childDraft) return;
    if (activeChildId === 'new') {
      setChildProfiles(current => [...current, { ...childDraft, id: `${Date.now()}` }]);
    } else {
      setChildProfiles(current => current.map(child => (child.id === activeChildId ? { ...childDraft } : child)));
    }
    closeChildModal();
  }

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
                <div className="eyebrow">Children</div>
              </div>
              <button type="button" className="button button-ghost" onClick={openAddChildModal}>
                Add Child
              </button>
            </div>

            {childProfiles.length ? (
              <div className="record-list">
                {childProfiles.map((child: any) => (
                  <button
                    key={child.id}
                    type="button"
                    className="record-item clickable-card"
                    onClick={() => openChildModal(child)}
                    style={{ textAlign: 'left', cursor: 'pointer', width: '100%' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                      <div>
                        <strong className="clickable-card-title">{child.name} - {calculateAgeFromBirthday(child.birthday)} years old</strong>
                        <div className="record-meta" style={{ marginTop: 8 }}>
                          <span>Birthday: {new Date(child.birthday).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className="status-pill">{child.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <strong>No children loaded yet.</strong>
                <p style={{ marginBottom: 0 }}>Children attached to this case will appear here.</p>
              </div>
            )}
          </section>

          <section className="card card-muted">
            <div className="section-title">
              <div>
                <div className="eyebrow">Assigned staff</div>
              </div>
            </div>
            {assignedStaff.length ? (
              <div className="record-list">
                {assignedStaff.map((staff: any) => (
                  <article key={`${staff.role}-${staff.name}`} className="record-item">
                    <strong>{staff.name}</strong>
                    <div className="record-meta" style={{ display: 'grid', gap: 8 }}>
                      <span>{staff.role}</span>
                      {staff.assignedNames?.length ? (
                        <div style={{ paddingLeft: 14, display: 'grid', gap: 6 }}>
                          {staff.assignedNames.map((name: string) => (
                            <span key={name} style={{ color: '#123122' }}>{name}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <strong>No staff assigned yet.</strong>
                <p style={{ marginBottom: 0 }}>Assigned case workers and supervisors will appear here.</p>
              </div>
            )}
          </section>
        </section>

        {childDraft ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.35)',
              display: 'grid',
              placeItems: 'center',
              padding: 24,
              zIndex: 50,
            }}
            onClick={closeChildModal}
          >
            <section
              className="card"
              style={{ width: 'min(100%, 760px)', maxHeight: '88vh', overflow: 'auto', padding: 24 }}
              onClick={event => event.stopPropagation()}
            >
              <div className="section-title">
                <div>
                  <div className="eyebrow">{activeChildId === 'new' ? 'Add child' : 'Child details'}</div>
                </div>
                <div className="actions-row" style={{ marginTop: 0 }}>
                  {childDirty || activeChildId === 'new' ? (
                    <button type="button" className="button button-primary" onClick={saveChildChanges}>
                      Save
                    </button>
                  ) : null}
                  <button type="button" className="button button-ghost" onClick={closeChildModal}>
                    Close
                  </button>
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label>Name</label>
                  <input className="input" value={childDraft.name} onChange={e => updateChildDraft('name', e.target.value)} />
                </div>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
                  <div className="field">
                    <label>Birthday</label>
                    <input className="input" type="date" value={childDraft.birthday} onChange={e => updateChildDraft('birthday', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Status</label>
                    <select className="select" value={childDraft.status} onChange={e => updateChildDraft('status', e.target.value)}>
                      <option>Pending Placement</option>
                      <option>Placed</option>
                      <option>In Transition</option>
                    </select>
                  </div>
                </div>
                <div className="field" style={{ position: 'relative' }} data-picker-field="true">
                  <label>Case Worker</label>
                  <div style={{ border: '1px solid #cbd8d0', borderRadius: 16, background: 'white', padding: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }} onClick={() => setActivePicker('caseWorker')}>
                    {childDraft.caseWorker ? (
                      <button type="button" className="button button-ghost" style={{ minHeight: 34, padding: '8px 12px' }} onClick={() => updateChildDraft('caseWorker', '')}>
                        {childDraft.caseWorker} ×
                      </button>
                    ) : null}
                    <input
                      value={caseWorkerQuery}
                      onFocus={() => setActivePicker('caseWorker')}
                      onChange={e => setCaseWorkerQuery(e.target.value)}
                      placeholder={childDraft.caseWorker ? 'Search another case worker' : 'Search case worker'}
                      style={{ flex: '1 1 180px', minWidth: 180, border: 'none', outline: 'none', fontSize: 16, color: '#123122' }}
                    />
                  </div>
                  {activePicker === 'caseWorker' ? (
                    <div className="card" style={{ marginTop: 8, maxHeight: 180, overflowY: 'auto', padding: 10 }}>
                      <div className="stack" style={{ gap: 8 }}>
                        {caseWorkerSuggestions.map((option: string) => (
                          <button key={option} type="button" className="button button-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => { updateChildDraft('caseWorker', option); setCaseWorkerQuery(''); setActivePicker(null); }}>
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="field" style={{ position: 'relative' }} data-picker-field="true">
                  <label>Placement</label>
                  <div style={{ border: '1px solid #cbd8d0', borderRadius: 16, background: 'white', padding: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }} onClick={() => setActivePicker('placement')}>
                    {childDraft.placement ? (
                      <button type="button" className="button button-ghost" style={{ minHeight: 34, padding: '8px 12px' }} onClick={() => updateChildDraft('placement', '')}>
                        {childDraft.placement} ×
                      </button>
                    ) : null}
                    <input
                      value={placementQuery}
                      onFocus={() => setActivePicker('placement')}
                      onChange={e => setPlacementQuery(e.target.value)}
                      placeholder={childDraft.placement ? 'Search another placement' : 'Search FosterHub users for placement'}
                      style={{ flex: '1 1 180px', minWidth: 180, border: 'none', outline: 'none', fontSize: 16, color: '#123122' }}
                    />
                  </div>
                  {activePicker === 'placement' ? (
                    <div className="card" style={{ marginTop: 8, maxHeight: 180, overflowY: 'auto', padding: 10 }}>
                      <div className="stack" style={{ gap: 8 }}>
                        {placementSuggestions.map((option: string) => (
                          <button key={option} type="button" className="button button-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => { updateChildDraft('placement', option); setPlacementQuery(''); setActivePicker(null); }}>
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {placementQuery && !systemUserOptions.some(option => option.toLowerCase() === placementQuery.toLowerCase()) ? (
                    <button type="button" className="button button-secondary">
                      Invite {placementQuery} to FosterHub
                    </button>
                  ) : null}
                </div>
                <div className="field" style={{ position: 'relative' }} data-picker-field="true">
                  <label>Supervisor</label>
                  <div style={{ border: '1px solid #cbd8d0', borderRadius: 16, background: 'white', padding: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }} onClick={() => setActivePicker('supervisor')}>
                    {childDraft.supervisor ? (
                      <button type="button" className="button button-ghost" style={{ minHeight: 34, padding: '8px 12px' }} onClick={() => updateChildDraft('supervisor', '')}>
                        {childDraft.supervisor} ×
                      </button>
                    ) : null}
                    <input
                      value={supervisorQuery}
                      onFocus={() => setActivePicker('supervisor')}
                      onChange={e => setSupervisorQuery(e.target.value)}
                      placeholder={childDraft.supervisor ? 'Search another supervisor' : 'Search supervisor'}
                      style={{ flex: '1 1 180px', minWidth: 180, border: 'none', outline: 'none', fontSize: 16, color: '#123122' }}
                    />
                  </div>
                  {activePicker === 'supervisor' ? (
                    <div className="card" style={{ marginTop: 8, maxHeight: 180, overflowY: 'auto', padding: 10 }}>
                      <div className="stack" style={{ gap: 8 }}>
                        {supervisorSuggestions.map((option: string) => (
                          <button key={option} type="button" className="button button-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => { updateChildDraft('supervisor', option); setSupervisorQuery(''); setActivePicker(null); }}>
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        ) : null}

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
