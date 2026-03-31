'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
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
  const [caseDirty, setCaseDirty] = useState(false);
  const [caseWorkerQuery, setCaseWorkerQuery] = useState('');
  const [fosterParentQuery, setFosterParentQuery] = useState('');
  const [guardianAdLitemQuery, setGuardianAdLitemQuery] = useState('');
  const [activePicker, setActivePicker] = useState<'caseWorker' | 'fosterParent' | 'guardianAdLitem' | null>(null);
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [profilePhotoHovered, setProfilePhotoHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load() {
    const token = localStorage.getItem('fosterhub.dev.token');
    if (!caseId) {
      setError('No case id found. Please try again.');
      return;
    }

    const createdCasesRaw = localStorage.getItem('fosterhub.createdCases');
    const createdCases = createdCasesRaw ? JSON.parse(createdCasesRaw) : [];
    const localCase = createdCases.find((item: any) => item.id === caseId);

    if (localCase) {
      setData({
        id: localCase.id,
        status: localCase.status,
        openedAt: localCase.createdAt,
        child: { firstName: '', lastName: localCase.child.lastName },
        requests: [],
        assignments: [],
        caseLabel: localCase.caseLabel,
        caseNumber: localCase.caseNumber,
        caseWorker: localCase.caseWorker,
        supervisor: localCase.supervisor,
      });
      setDocuments([]);
      setError(null);
      return;
    }

    if (!token) {
      setError('No token found. Please log in first.');
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

  const childName = data ? `${data.child.firstName} ${data.child.lastName}`.trim() : 'Case detail';
  const caseNumberMap: Record<string, string> = { Hall: '123456', Johnson: '234567', Carter: '345678', Lewis: '456789' };
  const caseLabel = data?.caseLabel || (data?.child?.lastName ? `${data.child.lastName} - ${caseNumberMap[data.child.lastName] || '000000'}` : 'Case detail');
  const childCountMap: Record<string, number> = { Hall: 2, Johnson: 1, Carter: 2, Lewis: 1 };
  const childCount = childProfiles.length > 0 ? childProfiles.length : (data?.id?.startsWith('local-') ? 0 : (data?.child?.lastName ? childCountMap[data.child.lastName] || 1 : 0));
  const openRequestCount = data?.requests?.filter((request: any) => request.status === 'SUBMITTED').length ?? 0;

  const childProfileMap: Record<string, any[]> = {
    Hall: [
      { id: 'archer-hall', name: 'Archer Hall', age: 4, birthday: '2021-04-11', status: 'Placed', caseWorker: 'Taylor Reed', guardianAdLitem: 'Attorney Maria Lopez', fosterParent: 'Sarah Hall', primaryPermanencyPlan: 'Placement with relative caregiver', secondaryPermanencyPlan: 'Return to Parent', schoolOrDaycare: 'Little Steps Academy', medications: '', medicalProviders: '', lastMonthlyHomeVisit: '2026-03-05', lastClothesVoucher: '', notes: '', photos: [], profilePhotoId: '' },
      { id: 'mia-hall', name: 'Mia Hall', age: 7, birthday: '2018-09-02', status: 'Pending Placement', caseWorker: 'Jordan Kim', guardianAdLitem: 'Attorney Maria Lopez', fosterParent: '', primaryPermanencyPlan: 'Adoption with an Identified Resource', secondaryPermanencyPlan: 'Placement with relative caregiver', schoolOrDaycare: 'Maple Elementary', medications: '', medicalProviders: '', lastMonthlyHomeVisit: '', lastClothesVoucher: '', notes: '', photos: [], profilePhotoId: '' },
    ],
    Johnson: [
      { id: 'ava-johnson', name: 'Ava Johnson', age: 9, birthday: '2017-01-14', status: 'Placed', caseWorker: 'Taylor Reed', guardianAdLitem: 'Attorney Maria Lopez', fosterParent: '', primaryPermanencyPlan: 'Adoption with no identified resource', secondaryPermanencyPlan: 'Return to Parent', schoolOrDaycare: 'Northview Elementary', medications: '', medicalProviders: '', lastMonthlyHomeVisit: '2026-03-11', lastClothesVoucher: '', notes: '', photos: [], profilePhotoId: '' },
    ],
  };

  useEffect(() => {
    if (!data?.child?.lastName) return;
    const defaultChildren = childProfileMap[data.child.lastName] || [];
    const storedProfilesRaw = localStorage.getItem('fosterhub.caseProfiles');
    const storedProfiles = storedProfilesRaw ? JSON.parse(storedProfilesRaw) : {};
    const savedProfiles: any[] = storedProfiles[caseLabel] || [];

    if (savedProfiles.length) {
      setChildProfiles(savedProfiles);
      return;
    }

    const storedChildrenRaw = localStorage.getItem('fosterhub.caseChildren');
    const storedChildren = storedChildrenRaw ? JSON.parse(storedChildrenRaw) : {};
    const savedNames: string[] = storedChildren[caseLabel] || [];

    if (savedNames.length) {
      const mergedChildren = savedNames.map((name, index) => {
        const existing = defaultChildren.find((child: any) => child.name === name);
        return existing || {
          id: `generated-${index + 1}`,
          name,
          birthday: '2020-01-01',
          status: 'Pending Placement',
          caseWorker: '',
          guardianAdLitem: '',
          fosterParent: '',
          primaryPermanencyPlan: '',
          secondaryPermanencyPlan: '',
          schoolOrDaycare: '',
          medications: '',
          medicalProviders: '',
          lastMonthlyHomeVisit: '',
          lastClothesVoucher: '',
          notes: '',
          photos: [],
          profilePhotoId: '',
        };
      });
      setChildProfiles(mergedChildren);
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

    const storedProfilesRaw = localStorage.getItem('fosterhub.caseProfiles');
    const storedProfiles = storedProfilesRaw ? JSON.parse(storedProfilesRaw) : {};
    storedProfiles[caseLabel] = childProfiles;
    localStorage.setItem('fosterhub.caseProfiles', JSON.stringify(storedProfiles));
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
      childProfiles
        .filter((child: any) => child.caseWorker)
        .map((child: any) => [
          child.caseWorker,
          {
            name: child.caseWorker,
            role: 'Case Worker',
            assignedNames: childProfiles.filter((entry: any) => entry.caseWorker === child.caseWorker).map((entry: any) => entry.name),
          },
        ]),
    ).values(),
  );

  const guardianAdLitems = Array.from(
    new Map(
      childProfiles
        .filter((child: any) => child.guardianAdLitem)
        .map((child: any) => [
          child.guardianAdLitem,
          {
            name: child.guardianAdLitem,
            role: 'Guardian Ad Litem',
            assignedNames: childProfiles.filter((entry: any) => entry.guardianAdLitem === child.guardianAdLitem).map((entry: any) => entry.name),
          },
        ]),
    ).values(),
  );

  const fosterParents = Array.from(
    new Map(
      childProfiles
        .filter((child: any) => child.fosterParent)
        .map((child: any) => [
          child.fosterParent,
          {
            name: child.fosterParent,
            role: 'Foster Parent',
            assignedNames: childProfiles.filter((entry: any) => entry.fosterParent === child.fosterParent).map((entry: any) => entry.name),
          },
        ]),
    ).values(),
  );

  const assignedStaff = [...caseWorkers, ...guardianAdLitems, ...fosterParents];

  const activeChild = childProfiles.find((child: any) => child.id === activeChildId) || null;
  const storedUsersRaw = typeof window !== 'undefined' ? localStorage.getItem('fosterhub.users') : null;
  const storedUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
  const caseWorkerOptions = storedUsers.filter((user: any) => user.type === 'Staff' && user.roles?.includes('Case Worker')).map((user: any) => user.name);
  const guardianAdLitemOptions = storedUsers.filter((user: any) => user.type === 'Legal' && user.roles?.includes('Attorney')).map((user: any) => user.name);
  const fosterParentOptions = storedUsers.filter((user: any) => user.type === 'Foster Parents').map((user: any) => user.name);

  const caseWorkerSuggestions = (caseWorkerQuery ? caseWorkerOptions.filter((option: string) => option.toLowerCase().includes(caseWorkerQuery.toLowerCase())) : caseWorkerOptions).slice(0, 8);
  const guardianAdLitemSuggestions = (guardianAdLitemQuery ? guardianAdLitemOptions.filter((option: string) => option.toLowerCase().includes(guardianAdLitemQuery.toLowerCase())) : guardianAdLitemOptions).slice(0, 8);
  const fosterParentSuggestions = (fosterParentQuery ? fosterParentOptions.filter((option: string) => option.toLowerCase().includes(fosterParentQuery.toLowerCase())) : fosterParentOptions).slice(0, 8);

  function openChildModal(child: any) {
    setActiveChildId(child.id);
    setChildDraft({ ...child });
    setChildDirty(false);
    setCaseWorkerQuery('');
    setFosterParentQuery('');
    setGuardianAdLitemQuery('');
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
      guardianAdLitem: '',
      fosterParent: '',
      primaryPermanencyPlan: '',
      secondaryPermanencyPlan: '',
      schoolOrDaycare: '',
      medications: '',
      medicalProviders: '',
      lastMonthlyHomeVisit: '',
      lastClothesVoucher: '',
      notes: '',
      photos: [],
      profilePhotoId: '',
    });
    setChildDirty(true);
    setCaseWorkerQuery('');
    setFosterParentQuery('');
    setGuardianAdLitemQuery('');
    setActivePicker(null);
  }

  function closeChildModal() {
    setActiveChildId(null);
    setChildDraft(null);
    setChildDirty(false);
    setCaseWorkerQuery('');
    setFosterParentQuery('');
    setGuardianAdLitemQuery('');
    setActivePicker(null);
    setPhotoGalleryOpen(false);
  }

  function updateChildDraft(field: string, value: string) {
    setChildDraft((current: any) => ({ ...current, [field]: value }));
    setChildDirty(true);
  }

  function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const photoId = `${Date.now()}-${Math.random()}`;
        setChildDraft((current: any) => ({
          ...current,
          photos: [...(current?.photos || []), { id: photoId, name: file.name, url: String(reader.result || '') }],
          profilePhotoId: current?.profilePhotoId || photoId,
        }));
        setChildDirty(true);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  }

  function setProfilePhoto(photoId: string) {
    setChildDraft((current: any) => ({
      ...current,
      profilePhotoId: photoId,
    }));
    setChildDirty(true);
  }

  function removePhoto(photoId: string) {
    setChildDraft((current: any) => {
      const remainingPhotos = (current?.photos || []).filter((photo: any) => photo.id !== photoId);
      const nextProfilePhotoId = current?.profilePhotoId === photoId ? (remainingPhotos[0]?.id || '') : current?.profilePhotoId;
      return {
        ...current,
        photos: remainingPhotos,
        profilePhotoId: nextProfilePhotoId,
      };
    });
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

  function updateCaseStatus(status: string) {
    setData((current: any) => ({ ...current, status }));
    setCaseDirty(true);
  }

  function updateOpenedDate(value: string) {
    setData((current: any) => ({ ...current, openedAt: `${value}T09:00:00.000Z` }));
    setCaseDirty(true);
  }

  function saveCaseMeta() {
    const createdCasesRaw = localStorage.getItem('fosterhub.createdCases');
    const createdCases = createdCasesRaw ? JSON.parse(createdCasesRaw) : [];
    const nextCreatedCases = createdCases.map((item: any) =>
      item.id === caseId
        ? { ...item, status: data?.status, createdAt: data?.openedAt }
        : item,
    );
    localStorage.setItem('fosterhub.createdCases', JSON.stringify(nextCreatedCases));

    const overrideRaw = localStorage.getItem('fosterhub.caseMetaOverrides');
    const overrides = overrideRaw ? JSON.parse(overrideRaw) : {};
    overrides[caseId || caseLabel] = {
      status: data?.status,
      openedAt: data?.openedAt,
    };
    localStorage.setItem('fosterhub.caseMetaOverrides', JSON.stringify(overrides));

    setCaseDirty(false);
  }

  return (
    <AppShell forceSidebarCollapsed={!!childDraft} title={<Link href="/cases" className="button button-ghost" style={{ fontSize: 16, fontWeight: 800, minHeight: 44, padding: '10px 16px' }}>Back to Cases</Link>}>
      <main className="page-stack">
        <section className="hero" style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <h2 style={{ fontSize: 34, margin: 0 }}>{caseLabel}</h2>
            {caseDirty ? (
              <button type="button" className="button button-primary" onClick={saveCaseMeta}>
                Save
              </button>
            ) : null}
          </div>
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
            <select className="select" value={data?.status ?? 'INTAKE'} onChange={e => updateCaseStatus(e.target.value)}>
              <option value="INTAKE">Intake</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
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
            <input
              className="input"
              type="date"
              value={data?.openedAt ? new Date(new Date(data.openedAt).getTime() - new Date(data.openedAt).getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ''}
              onChange={e => updateOpenedDate(e.target.value)}
            />
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
                <p style={{ marginBottom: 0 }}>Assigned case workers, guardians ad litem, and foster parents will appear here.</p>
              </div>
            )}
          </section>
        </section>

        {childDraft ? (
          <>
            <div
              style={{
                position: 'fixed',
                top: 89,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.2)',
                zIndex: 40,
              }}
              onClick={closeChildModal}
            />
            <section
              className="card"
              style={{
                position: 'fixed',
                top: 89,
                right: 0,
                bottom: 0,
                width: 'min(100%, 33vw, 520px)',
                minWidth: 380,
                borderRadius: '24px 0 0 0',
                overflow: 'hidden',
                padding: 0,
                zIndex: 50,
                boxShadow: '-18px 0 40px rgba(15, 23, 42, 0.16)',
                display: 'grid',
                gridTemplateRows: 'auto 1fr',
              }}
              onClick={event => event.stopPropagation()}
            >
              <div style={{ padding: '24px 24px 18px', borderBottom: '1px solid #eef3ef', background: 'white' }}>
                <div className="section-title" style={{ marginBottom: 0, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {childDraft.photos?.find((photo: any) => photo.id === childDraft.profilePhotoId)?.url ? (
                      <button type="button" onClick={() => setPhotoGalleryOpen(true)} onMouseEnter={() => setProfilePhotoHovered(true)} onMouseLeave={() => setProfilePhotoHovered(false)} style={{ padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', position: 'relative', width: 56, height: 56 }} aria-label="Choose profile picture">
                        <img src={childDraft.photos.find((photo: any) => photo.id === childDraft.profilePhotoId).url} alt={childDraft.name || 'Child profile'} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #d7e6dd' }} />
                        <span style={{ position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: '50%', background: 'rgba(18, 49, 34, 0.88)', color: 'white', display: 'grid', placeItems: 'center', boxShadow: '0 6px 14px rgba(15, 23, 42, 0.18)', opacity: profilePhotoHovered ? 1 : 0.72, transform: profilePhotoHovered ? 'scale(1)' : 'scale(0.92)', transition: 'opacity 140ms ease, transform 140ms ease' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M4 20H8L18.5 9.5C19.3 8.7 19.3 7.45 18.5 6.65L17.35 5.5C16.55 4.7 15.3 4.7 14.5 5.5L4 16V20Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </button>
                    ) : (
                      <button type="button" onClick={() => childDraft.photos?.length ? setPhotoGalleryOpen(true) : document.getElementById('child-photo-upload')?.click()} onMouseEnter={() => setProfilePhotoHovered(true)} onMouseLeave={() => setProfilePhotoHovered(false)} style={{ width: 56, height: 56, borderRadius: '50%', background: '#dff1e3', color: '#135c31', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 18, border: 'none', cursor: 'pointer', position: 'relative' }} aria-label="Choose profile picture">
                        {(childDraft.name || 'N').split(' ').map((part: string) => part[0]).slice(0, 2).join('').toUpperCase()}
                        <span style={{ position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: '50%', background: 'rgba(18, 49, 34, 0.88)', color: 'white', display: 'grid', placeItems: 'center', boxShadow: '0 6px 14px rgba(15, 23, 42, 0.18)', opacity: profilePhotoHovered ? 1 : 0.72, transform: profilePhotoHovered ? 'scale(1)' : 'scale(0.92)', transition: 'opacity 140ms ease, transform 140ms ease' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M4 20H8L18.5 9.5C19.3 8.7 19.3 7.45 18.5 6.65L17.35 5.5C16.55 4.7 15.3 4.7 14.5 5.5L4 16V20Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </button>
                    )}
                    <div>
                      <div className="eyebrow">{activeChildId === 'new' ? 'Add child' : 'Child details'}</div>
                      <h2 style={{ marginBottom: 0 }}>{childDraft.name || 'New child'}</h2>
                    </div>
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
              </div>

              <div style={{ overflowY: 'auto', padding: 24, background: '#f7faf8' }}>
                <div className="form-grid" style={{ gap: 18 }}>
                  <section className="card card-muted" style={{ padding: 18 }}>
                    <div className="section-title" style={{ marginBottom: 14 }}>
                      <div>
                        <div className="eyebrow">Overview</div>
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
                      <div className="field">
                        <label>Primary Permanency Plan</label>
                        <input className="input" value={childDraft.primaryPermanencyPlan || ''} onChange={e => updateChildDraft('primaryPermanencyPlan', e.target.value)} placeholder="Adoption with an Identified Resource" />
                      </div>
                      <div className="field">
                        <label>Secondary Permanency Plan</label>
                        <input className="input" value={childDraft.secondaryPermanencyPlan || ''} onChange={e => updateChildDraft('secondaryPermanencyPlan', e.target.value)} placeholder="Return to Parent" />
                      </div>
                    </div>
                  </section>

                  <section className="card card-muted" style={{ padding: 18 }}>
                    <div className="section-title" style={{ marginBottom: 14 }}>
                      <div>
                        <div className="eyebrow">Placement & team</div>
                      </div>
                    </div>
                    <div className="form-grid">
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
                              {caseWorkerSuggestions.length ? caseWorkerSuggestions.map((option: string) => (
                                <button key={option} type="button" className="button button-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => { updateChildDraft('caseWorker', option); setCaseWorkerQuery(''); setActivePicker(null); }}>
                                  {option}
                                </button>
                              )) : <span className="muted">No case workers found.</span>}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="field" style={{ position: 'relative' }} data-picker-field="true">
                        <label>Foster Parents</label>
                        <div style={{ border: '1px solid #cbd8d0', borderRadius: 16, background: 'white', padding: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }} onClick={() => setActivePicker('fosterParent')}>
                          {childDraft.fosterParent ? (
                            <button type="button" className="button button-ghost" style={{ minHeight: 34, padding: '8px 12px' }} onClick={() => updateChildDraft('fosterParent', '')}>
                              {childDraft.fosterParent} ×
                            </button>
                          ) : null}
                          <input
                            value={fosterParentQuery}
                            onFocus={() => setActivePicker('fosterParent')}
                            onChange={e => setFosterParentQuery(e.target.value)}
                            placeholder={childDraft.fosterParent ? 'Search another foster parent' : 'Search foster parents'}
                            style={{ flex: '1 1 180px', minWidth: 180, border: 'none', outline: 'none', fontSize: 16, color: '#123122' }}
                          />
                        </div>
                        {activePicker === 'fosterParent' ? (
                          <div className="card" style={{ marginTop: 8, maxHeight: 180, overflowY: 'auto', padding: 10 }}>
                            <div className="stack" style={{ gap: 8 }}>
                              {fosterParentSuggestions.length ? fosterParentSuggestions.map((option: string) => (
                                <button key={option} type="button" className="button button-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => { updateChildDraft('fosterParent', option); setFosterParentQuery(''); setActivePicker(null); }}>
                                  {option}
                                </button>
                              )) : <span className="muted">No foster parents found.</span>}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="field" style={{ position: 'relative' }} data-picker-field="true">
                        <label>Guardian Ad Litem</label>
                        <div style={{ border: '1px solid #cbd8d0', borderRadius: 16, background: 'white', padding: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }} onClick={() => setActivePicker('guardianAdLitem')}>
                          {childDraft.guardianAdLitem ? (
                            <button type="button" className="button button-ghost" style={{ minHeight: 34, padding: '8px 12px' }} onClick={() => updateChildDraft('guardianAdLitem', '')}>
                              {childDraft.guardianAdLitem} ×
                            </button>
                          ) : null}
                          <input
                            value={guardianAdLitemQuery}
                            onFocus={() => setActivePicker('guardianAdLitem')}
                            onChange={e => setGuardianAdLitemQuery(e.target.value)}
                            placeholder={childDraft.guardianAdLitem ? 'Search another attorney' : 'Search guardian ad litem'}
                            style={{ flex: '1 1 180px', minWidth: 180, border: 'none', outline: 'none', fontSize: 16, color: '#123122' }}
                          />
                        </div>
                        {activePicker === 'guardianAdLitem' ? (
                          <div className="card" style={{ marginTop: 8, maxHeight: 180, overflowY: 'auto', padding: 10 }}>
                            <div className="stack" style={{ gap: 8 }}>
                              {guardianAdLitemSuggestions.length ? guardianAdLitemSuggestions.map((option: string) => (
                                <button key={option} type="button" className="button button-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => { updateChildDraft('guardianAdLitem', option); setGuardianAdLitemQuery(''); setActivePicker(null); }}>
                                  {option}
                                </button>
                              )) : <span className="muted">No attorneys found.</span>}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </section>

                  <section className="card card-muted" style={{ padding: 18 }}>
                    <div className="section-title" style={{ marginBottom: 14 }}>
                      <div>
                        <div className="eyebrow">Education</div>
                      </div>
                    </div>
                    <div className="field">
                      <label>School / Daycare</label>
                      <input className="input" value={childDraft.schoolOrDaycare || ''} onChange={e => updateChildDraft('schoolOrDaycare', e.target.value)} />
                    </div>
                  </section>

                  <section className="card card-muted" style={{ padding: 18 }}>
                    <div className="section-title" style={{ marginBottom: 14 }}>
                      <div>
                        <div className="eyebrow">Health</div>
                      </div>
                    </div>
                    <div className="field" style={{ marginTop: 8 }}>
                      <label>Medications</label>
                      <textarea className="textarea" rows={3} value={childDraft.medications || ''} onChange={e => updateChildDraft('medications', e.target.value)} />
                    </div>
                    <div className="field" style={{ marginTop: 12 }}>
                      <label>Medical Providers</label>
                      <textarea className="textarea" rows={4} value={childDraft.medicalProviders || ''} onChange={e => updateChildDraft('medicalProviders', e.target.value)} placeholder="Doctors, dentists, therapists, specialists..." />
                    </div>
                  </section>

                  <section className="card card-muted" style={{ padding: 18 }}>
                    <div className="section-title" style={{ marginBottom: 14 }}>
                      <div>
                        <div className="eyebrow">Activity</div>
                      </div>
                    </div>
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
                      <div className="field">
                        <label>Last Monthly Home Visit</label>
                        <input className="input" type="date" value={childDraft.lastMonthlyHomeVisit || ''} onChange={e => updateChildDraft('lastMonthlyHomeVisit', e.target.value)} />
                      </div>
                      <div className="field">
                        <label>Last Clothes Voucher</label>
                        <input className="input" type="date" value={childDraft.lastClothesVoucher || ''} onChange={e => updateChildDraft('lastClothesVoucher', e.target.value)} />
                      </div>
                    </div>
                  </section>

                  <section className="card card-muted" style={{ padding: 18 }}>
                    <div className="section-title" style={{ marginBottom: 14 }}>
                      <div>
                        <div className="eyebrow">Notes</div>
                      </div>
                    </div>
                    <div className="field">
                      <label>Case notes</label>
                      <textarea className="textarea" rows={6} value={childDraft.notes || ''} onChange={e => updateChildDraft('notes', e.target.value)} />
                    </div>
                  </section>

                  <section className="card card-muted" style={{ padding: 18 }}>
                    <div className="section-title" style={{ marginBottom: 12 }}>
                      <div>
                        <div className="eyebrow">Photos</div>
                      </div>
                    </div>
                    {childDraft.photos?.length ? (
                      <div>
                        <div
                          className="record-list"
                          style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', cursor: childDraft.photos.length > 4 ? 'pointer' : 'default' }}
                          onClick={() => childDraft.photos.length > 4 ? setPhotoGalleryOpen(true) : undefined}
                        >
                          {childDraft.photos.slice(0, 4).map((photo: any) => (
                            <article key={photo.id} className="record-item" style={{ padding: 10 }}>
                              <img src={photo.url} alt={photo.name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 14, display: 'block', marginBottom: 8 }} />
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 12, color: '#4f6b5b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.name}</span>
                                {childDraft.profilePhotoId === photo.id ? <span className="status-pill">Profile</span> : null}
                              </div>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <button type="button" className="button button-ghost" style={{ minHeight: 28, padding: '4px 8px', fontSize: 12 }} onClick={event => { event.stopPropagation(); setProfilePhoto(photo.id); }}>
                                  Set profile
                                </button>
                                <button type="button" className="button button-ghost" style={{ minHeight: 28, padding: '4px 8px', fontSize: 12 }} onClick={event => { event.stopPropagation(); removePhoto(photo.id); }}>
                                  Remove
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                        {childDraft.photos.length > 4 ? (
                          <button type="button" className="button button-ghost" style={{ minHeight: 34, padding: '6px 12px', marginTop: 10 }} onClick={() => setPhotoGalleryOpen(true)}>
                            View all photos ({childDraft.photos.length})
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <div className="empty-state" style={{ marginTop: 0 }}>
                        <strong>No pictures yet.</strong>
                        <p style={{ marginBottom: 0 }}>Case workers and foster parents can add photos here to preserve a visual history for the child.</p>
                      </div>
                    )}
                    <div style={{ marginTop: 14 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 700, color: '#173827' }}>Upload photo</label>
                      <input id="child-photo-upload" type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
                      <button type="button" className="button button-primary" style={{ minHeight: 34, padding: '6px 12px', fontSize: 13 }} onClick={() => document.getElementById('child-photo-upload')?.click()}>
                        Upload photo
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            </section>

            {photoGalleryOpen && childDraft.photos?.length ? (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.45)',
                  display: 'grid',
                  placeItems: 'center',
                  padding: 24,
                  zIndex: 60,
                }}
                onClick={() => setPhotoGalleryOpen(false)}
              >
                <section className="card" style={{ width: 'min(100%, 960px)', maxHeight: '85vh', overflow: 'auto', padding: 20 }} onClick={event => event.stopPropagation()}>
                  <div className="section-title" style={{ marginBottom: 14 }}>
                    <div>
                      <div className="eyebrow">Photos</div>
                    </div>
                    <button type="button" className="button button-ghost" onClick={() => setPhotoGalleryOpen(false)}>
                      Close
                    </button>
                  </div>
                  <div className="record-list" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                    {childDraft.photos.map((photo: any) => (
                      <article key={photo.id} className="record-item" style={{ padding: 12 }}>
                        <img src={photo.url} alt={photo.name} style={{ width: '100%', height: 190, objectFit: 'cover', borderRadius: 14, display: 'block', marginBottom: 10 }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: '#4f6b5b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.name}</span>
                          {childDraft.profilePhotoId === photo.id ? <span className="status-pill">Profile</span> : null}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button type="button" className="button button-ghost" style={{ minHeight: 30, padding: '5px 10px', fontSize: 12 }} onClick={() => setProfilePhoto(photo.id)}>
                            Set as profile picture
                          </button>
                          <button type="button" className="button button-ghost" style={{ minHeight: 30, padding: '5px 10px', fontSize: 12 }} onClick={() => removePhoto(photo.id)}>
                            Remove
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            ) : null}
          </>
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
