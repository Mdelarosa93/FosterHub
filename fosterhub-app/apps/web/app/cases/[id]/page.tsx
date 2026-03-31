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

function getLocalDateValue(date = new Date()) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

function getDaysAgoDateValue(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getLocalDateValue(date);
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
  const [activities, setActivities] = useState<any[]>([]);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityPanelOpen, setActivityPanelOpen] = useState(false);
  const [activityDraft, setActivityDraft] = useState({ title: '', type: 'Home Visit', date: getLocalDateValue(), startTime: '09:00', endTime: '10:00', location: '', notes: '', assignees: [] as string[], invitees: [] as string[], addToCalendar: true });
  const [activityStartDate, setActivityStartDate] = useState(() => getDaysAgoDateValue(30));
  const [activityEndDate, setActivityEndDate] = useState(() => getLocalDateValue());
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [childDraft, setChildDraft] = useState<any | null>(null);
  const [childDirty, setChildDirty] = useState(false);
  const [caseDirty, setCaseDirty] = useState(false);
  const [caseWorkerQuery, setCaseWorkerQuery] = useState('');
  const [fosterParentQuery, setFosterParentQuery] = useState('');
  const [guardianAdLitemQuery, setGuardianAdLitemQuery] = useState('');
  const [activePicker, setActivePicker] = useState<'caseWorker' | 'fosterParent' | 'guardianAdLitem' | null>(null);
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [photoMenuOpen, setPhotoMenuOpen] = useState<string | null>(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoMenuHover, setPhotoMenuHover] = useState<string | null>(null);
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
    if (!caseLabel) return;
    const storedActivitiesRaw = localStorage.getItem('fosterhub.caseActivities');
    const storedActivities = storedActivitiesRaw ? JSON.parse(storedActivitiesRaw) : {};
    setActivities(storedActivities[caseLabel] || []);
  }, [caseLabel]);

  useEffect(() => {
    if (!caseLabel || !childProfiles.length) return;

    try {
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
      setError(null);
    } catch {
      setError('These child changes are too large to save in browser storage right now. Try fewer or smaller photos.');
    }
  }, [caseLabel, childProfiles]);

  useEffect(() => {
    if (!activeChildId && !activityModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeChildId, activityModalOpen]);

  useEffect(() => {
    if (!photoGalleryOpen || !childDraft?.photos?.length) return;
    const activePhoto = childDraft.photos[selectedPhotoIndex];
    if (!activePhoto) return;
    const target = document.getElementById(`gallery-photo-${activePhoto.id}`);
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [photoGalleryOpen, selectedPhotoIndex, childDraft]);

  useEffect(() => {
    if (!caseLabel) return;
    const storedActivitiesRaw = localStorage.getItem('fosterhub.caseActivities');
    const storedActivities = storedActivitiesRaw ? JSON.parse(storedActivitiesRaw) : {};
    storedActivities[caseLabel] = activities;
    localStorage.setItem('fosterhub.caseActivities', JSON.stringify(storedActivities));
  }, [caseLabel, activities]);

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

  function getChildProfilePhoto(child: any) {
    return child?.photos?.find((photo: any) => photo.id === child?.profilePhotoId)?.url || child?.photos?.[0]?.url || '';
  }

  function renderChildAvatar(child: any, size = 32) {
    const photoUrl = getChildProfilePhoto(child);
    const initials = (child?.name || 'N').split(' ').map((part: string) => part[0]).slice(0, 2).join('').toUpperCase();
    return photoUrl ? (
      <img src={photoUrl} alt={child?.name || 'Child'} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    ) : (
      <div style={{ width: size, height: size, borderRadius: '50%', background: '#dff1e3', color: '#135c31', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: Math.max(12, Math.round(size * 0.32)), flexShrink: 0 }}>
        {initials}
      </div>
    );
  }

  function openChildModal(child: any) {
    setActiveChildId(child.id);
    setChildDraft({ ...child });
    setChildDirty(false);
    setCaseWorkerQuery('');
    setFosterParentQuery('');
    setGuardianAdLitemQuery('');
    setActivePicker(null);
  }

  const bioParentOptions = caseLabel ? [`Biological Parent - ${caseLabel.split(' - ')[0]} 1`, `Biological Parent - ${caseLabel.split(' - ')[0]} 2`] : ['Biological Parent 1', 'Biological Parent 2'];
  const activityAssigneeOptions = [...bioParentOptions, ...childProfiles.map((child: any) => child.name)];
  const activityInviteeOptions = Array.from(new Set([
    ...bioParentOptions,
    ...childProfiles.flatMap((child: any) => [child.caseWorker, child.guardianAdLitem, child.fosterParent]).filter(Boolean),
  ]));

  const filteredActivities = activities.filter((activity: any) => {
    if (activityStartDate && activity.date < activityStartDate) return false;
    if (activityEndDate && activity.date > activityEndDate) return false;
    return true;
  });

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
    setPhotoMenuOpen(null);
    setPhotoViewerOpen(false);
    setSelectedPhotoIndex(0);
  }

  function updateChildDraft(field: string, value: string) {
    setChildDraft((current: any) => ({ ...current, [field]: value }));
    setChildDirty(true);
  }

  function compressImage(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const maxDimension = 1200;
          const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          const context = canvas.getContext('2d');
          if (!context) {
            reject(new Error('Unable to prepare image for upload.'));
            return;
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        image.onerror = () => reject(new Error('Unable to read selected image.'));
        image.src = String(reader.result || '');
      };
      reader.onerror = () => reject(new Error('Unable to read selected image.'));
      reader.readAsDataURL(file);
    });
  }

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      const preparedPhotos = await Promise.all(files.map(async file => ({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        url: await compressImage(file),
      })));

      setChildDraft((current: any) => ({
        ...current,
        photos: [...(current?.photos || []), ...preparedPhotos],
        profilePhotoId: current?.profilePhotoId || preparedPhotos[0]?.id || '',
      }));
      setChildDirty(true);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Unable to add those photos right now.');
    }

    event.target.value = '';
  }

  function openPhotoGallery(photoId?: string) {
    if (childDraft?.photos?.length) {
      const targetPhotoId = photoId || childDraft.profilePhotoId || childDraft.photos[0]?.id;
      const photoIndex = childDraft.photos.findIndex((photo: any) => photo.id === targetPhotoId);
      setSelectedPhotoIndex(photoIndex >= 0 ? photoIndex : 0);
    } else {
      setSelectedPhotoIndex(0);
    }
    setPhotoMenuOpen(null);
    setPhotoViewerOpen(false);
    setPhotoGalleryOpen(true);
  }

  function openPhotoViewer(photoId: string) {
    if (!childDraft?.photos?.length) return;
    const photoIndex = childDraft.photos.findIndex((photo: any) => photo.id === photoId);
    setSelectedPhotoIndex(photoIndex >= 0 ? photoIndex : 0);
    setPhotoMenuOpen(null);
    setPhotoViewerOpen(true);
  }

  function downloadPhoto(photo: any) {
    if (!photo?.url) return;
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.name || 'photo.jpg';
    link.click();
    setPhotoMenuOpen(null);
  }

  function setProfilePhoto(photoId: string) {
    setChildDraft((current: any) => ({
      ...current,
      profilePhotoId: photoId,
    }));
    setChildDirty(true);
    setPhotoMenuOpen(null);
  }

  function removePhoto(photoId: string) {
    setChildDraft((current: any) => {
      const remainingPhotos = (current?.photos || []).filter((photo: any) => photo.id !== photoId);
      const nextProfilePhotoId = current?.profilePhotoId === photoId ? (remainingPhotos[0]?.id || '') : current?.profilePhotoId;
      if (!remainingPhotos.length) {
        setPhotoGalleryOpen(false);
        setPhotoViewerOpen(false);
      } else {
        setSelectedPhotoIndex(currentIndex => Math.min(currentIndex, remainingPhotos.length - 1));
      }
      return {
        ...current,
        photos: remainingPhotos,
        profilePhotoId: nextProfilePhotoId,
      };
    });
    setChildDirty(true);
    setPhotoMenuOpen(null);
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

  function handleAddActivity() {
    if (!activityDraft.title.trim() || !activityDraft.date) return;

    const nextActivity = {
      id: `${Date.now()}`,
      ...activityDraft,
    };

    setActivities(current => [nextActivity, ...current]);

    if (activityDraft.addToCalendar) {
      const storedCalendarRaw = localStorage.getItem('fosterhub.calendarEvents');
      const storedCalendarEvents = storedCalendarRaw ? JSON.parse(storedCalendarRaw) : [];
      storedCalendarEvents.push({
        id: `activity-${nextActivity.id}`,
        caseLabel,
        children: nextActivity.assignees.filter((item: string) => childProfiles.some((child: any) => child.name === item)),
        date: nextActivity.date,
        startTime: nextActivity.startTime,
        endTime: nextActivity.endTime,
        time: nextActivity.startTime,
        eventType: nextActivity.type,
        notes: nextActivity.notes,
        location: nextActivity.location,
        invitees: nextActivity.invitees,
        color: '#10588c',
      });
      localStorage.setItem('fosterhub.calendarEvents', JSON.stringify(storedCalendarEvents));
    }

    setActivityDraft({ title: '', type: 'Home Visit', date: getLocalDateValue(), startTime: '09:00', endTime: '10:00', location: '', notes: '', assignees: [], invitees: [], addToCalendar: true });
    setActivityModalOpen(false);
  }

  function downloadActivityReport() {
    const lines = [
      `Activity Report - ${caseLabel}`,
      `Date range: ${activityStartDate || 'Beginning'} to ${activityEndDate || 'Today'}`,
      '',
      ...filteredActivities.flatMap((activity: any) => [
        `${activity.date} | ${activity.type}`,
        activity.title,
        activity.notes || '',
        '',
      ]),
    ];

    const escapePdfText = (text: string) => text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    const contentStream = lines.map((line, index) => `BT /F1 12 Tf 50 ${760 - index * 18} Td (${escapePdfText(line)}) Tj ET`).join('\n');
    const objects = [
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
      '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj',
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj',
      `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj`,
      '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
    ];

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach(object => {
      offsets.push(pdf.length);
      pdf += `${object}\n`;
    });
    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    offsets.slice(1).forEach(offset => {
      pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    const blob = new Blob([pdf], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${caseLabel || 'activity-report'}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function applyActivityRange(days: number) {
    setActivityStartDate(getDaysAgoDateValue(days));
    setActivityEndDate(getLocalDateValue());
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
    <AppShell forceSidebarCollapsed={!!childDraft || activityPanelOpen} title={<Link href="/cases" className="button button-ghost" style={{ fontSize: 16, fontWeight: 800, minHeight: 44, padding: '10px 16px' }}>Back to Cases</Link>}>
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
          <div className="stack" style={{ gap: 24 }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {renderChildAvatar(child, 38)}
                        <div>
                          <strong className="clickable-card-title">{child.name} - {calculateAgeFromBirthday(child.birthday)} years old</strong>
                          <div className="record-meta" style={{ marginTop: 8 }}>
                            <span>Birthday: {new Date(child.birthday).toLocaleDateString()}</span>
                          </div>
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
                  <div className="eyebrow">Activity log</div>
                </div>
                <div className="actions-row" style={{ marginTop: 0 }}>
                  <button type="button" className="button button-ghost" onClick={() => setActivityModalOpen(true)}>
                    Add Activity
                  </button>
                  <button type="button" className="button button-ghost" onClick={() => setActivityPanelOpen(true)}>
                    View All Activities
                  </button>
                </div>
              </div>

              {activities.length ? (
                <div className="record-list">
                  {activities.slice(0, 3).map((activity: any) => (
                    <article key={activity.id} className="record-item">
                      <strong>{activity.title}</strong>
                      <div className="record-meta">
                        <span>{activity.type}</span>
                        <span>{new Date(activity.date).toLocaleDateString()}</span>
                        <span>{activity.startTime} - {activity.endTime}</span>
                      </div>
                      {activity.location ? <p style={{ marginTop: 10, marginBottom: 0 }}><strong>Location:</strong> {activity.location}</p> : null}
                      {activity.assignees?.length ? <p style={{ marginTop: 8, marginBottom: 0 }}><strong>Assigned:</strong> {activity.assignees.join(', ')}</p> : null}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <strong>No activities recorded yet.</strong>
                  <p style={{ marginBottom: 0 }}>Add case activities here to build a running activity log.</p>
                </div>
              )}
            </section>
          </div>

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
                          {staff.assignedNames.map((name: string) => {
                            const child = childProfiles.find((entry: any) => entry.name === name);
                            return (
                              <span key={name} style={{ color: '#123122', display: 'flex', alignItems: 'center', gap: 8 }}>
                                {child ? renderChildAvatar(child, 22) : null}
                                {name}
                              </span>
                            );
                          })}
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

        {activityModalOpen ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.35)',
              display: 'grid',
              placeItems: 'center',
              padding: 24,
              zIndex: 55,
              overflowY: 'auto',
            }}
            onClick={() => setActivityModalOpen(false)}
          >
            <section className="card" style={{ width: 'min(100%, 620px)', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', padding: 24 }} onClick={event => event.stopPropagation()}>
              <div className="section-title">
                <div>
                  <div className="eyebrow">Activity log</div>
                  <h3>Add activity</h3>
                </div>
                <button type="button" className="button button-ghost" onClick={() => setActivityModalOpen(false)}>
                  Close
                </button>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Activity title</label>
                  <input className="input" value={activityDraft.title} onChange={e => setActivityDraft(current => ({ ...current, title: e.target.value }))} />
                </div>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
                  <div className="field">
                    <label>Type</label>
                    <select className="select" value={activityDraft.type} onChange={e => setActivityDraft(current => ({ ...current, type: e.target.value }))}>
                      <option>Home Visit</option>
                      <option>Clothes Voucher</option>
                      <option>Court</option>
                      <option>School</option>
                      <option>Medical</option>
                      <option>Placement</option>
                      <option>ISP</option>
                      <option>Drug Test</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Date</label>
                    <input className="input" type="date" value={activityDraft.date} onChange={e => setActivityDraft(current => ({ ...current, date: e.target.value }))} />
                  </div>
                </div>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
                  <div className="field">
                    <label>Start time</label>
                    <input className="input" type="time" value={activityDraft.startTime} onChange={e => setActivityDraft(current => ({ ...current, startTime: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label>End time</label>
                    <input className="input" type="time" value={activityDraft.endTime} onChange={e => setActivityDraft(current => ({ ...current, endTime: e.target.value }))} />
                  </div>
                </div>
                <div className="field">
                  <label>Location</label>
                  <input className="input" value={activityDraft.location} onChange={e => setActivityDraft(current => ({ ...current, location: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Assign to</label>
                  <div style={{ border: '1px solid #cbd8d0', borderRadius: 16, background: 'white', padding: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {activityAssigneeOptions.map(option => {
                      const selected = activityDraft.assignees.includes(option);
                      return (
                        <button key={option} type="button" className={selected ? 'button button-primary' : 'button button-ghost'} style={{ minHeight: 32, padding: '6px 10px' }} onClick={() => setActivityDraft(current => ({ ...current, assignees: selected ? current.assignees.filter((item: string) => item !== option) : [...current.assignees, option] }))}>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="field">
                  <label>Invite others</label>
                  <div style={{ border: '1px solid #cbd8d0', borderRadius: 16, background: 'white', padding: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {activityInviteeOptions.map(option => {
                      const selected = activityDraft.invitees.includes(option);
                      return (
                        <button key={option} type="button" className={selected ? 'button button-primary' : 'button button-ghost'} style={{ minHeight: 32, padding: '6px 10px' }} onClick={() => setActivityDraft(current => ({ ...current, invitees: selected ? current.invitees.filter((item: string) => item !== option) : [...current.invitees, option] }))}>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="field">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={activityDraft.addToCalendar} onChange={e => setActivityDraft(current => ({ ...current, addToCalendar: e.target.checked }))} />
                    Add to calendar
                  </label>
                </div>
                <div className="field">
                  <label>Notes</label>
                  <textarea className="textarea" rows={4} value={activityDraft.notes} onChange={e => setActivityDraft(current => ({ ...current, notes: e.target.value }))} />
                </div>
                <div className="actions-row" style={{ justifyContent: 'flex-end' }}>
                  <button type="button" className="button button-ghost" onClick={() => setActivityModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="button" className="button button-primary" onClick={handleAddActivity}>
                    Save Activity
                  </button>
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {activityPanelOpen ? (
          <>
            <div
              style={{ position: 'fixed', top: 89, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.2)', zIndex: 40 }}
              onClick={() => setActivityPanelOpen(false)}
            />
            <section className="card" style={{ position: 'fixed', top: 89, right: 0, bottom: 0, width: 'min(100%, 44vw, 640px)', minWidth: 460, borderRadius: '24px 0 0 0', overflow: 'hidden', padding: 0, zIndex: 50, boxShadow: '-18px 0 40px rgba(15, 23, 42, 0.16)', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
              <div style={{ padding: '20px 24px 18px', borderBottom: '1px solid #eef3ef', background: 'white' }}>
                <div className="section-title" style={{ marginBottom: 0 }}>
                  <div>
                    <div className="eyebrow">Activity log</div>
                    <h2 style={{ marginBottom: 0 }}>All activities</h2>
                  </div>
                  <div className="actions-row" style={{ marginTop: 0 }}>
                    <button type="button" className="button button-primary" onClick={downloadActivityReport}>
                      Activity Report
                    </button>
                    <button type="button" className="button button-ghost" onClick={() => setActivityPanelOpen(false)}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ overflowY: 'auto', padding: 24, background: '#f7faf8' }}>
                <div className="card card-muted" style={{ padding: 18, marginBottom: 18 }}>
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
                    <div className="field">
                      <label>Start date</label>
                      <input className="input" type="date" value={activityStartDate} onChange={e => setActivityStartDate(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>End date</label>
                      <input className="input" type="date" value={activityEndDate} onChange={e => setActivityEndDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="actions-row" style={{ marginTop: 12, flexWrap: 'wrap' }}>
                    <button type="button" className="button button-ghost" style={{ minHeight: 34, padding: '6px 12px' }} onClick={() => applyActivityRange(30)}>
                      30 Days
                    </button>
                    <button type="button" className="button button-ghost" style={{ minHeight: 34, padding: '6px 12px' }} onClick={() => applyActivityRange(90)}>
                      90 Days
                    </button>
                    <button type="button" className="button button-ghost" style={{ minHeight: 34, padding: '6px 12px' }} onClick={() => applyActivityRange(182)}>
                      6 Months
                    </button>
                    <button type="button" className="button button-ghost" style={{ minHeight: 34, padding: '6px 12px' }} onClick={() => applyActivityRange(365)}>
                      12 Months
                    </button>
                  </div>
                </div>
                {filteredActivities.length ? (
                  <div className="record-list">
                    {filteredActivities.map((activity: any) => (
                      <article key={activity.id} className="record-item">
                        <strong>{activity.title}</strong>
                        <div className="record-meta">
                          <span>{activity.type}</span>
                          <span>{new Date(activity.date).toLocaleDateString()}</span>
                          <span>{activity.startTime} - {activity.endTime}</span>
                        </div>
                        {activity.location ? <p style={{ marginTop: 10, marginBottom: 0 }}><strong>Location:</strong> {activity.location}</p> : null}
                        {activity.assignees?.length ? <p style={{ marginTop: 8, marginBottom: 0 }}><strong>Assigned:</strong> {activity.assignees.join(', ')}</p> : null}
                        {activity.invitees?.length ? <p style={{ marginTop: 8, marginBottom: 0 }}><strong>Invitees:</strong> {activity.invitees.join(', ')}</p> : null}
                        {activity.notes ? <p style={{ marginTop: 8, marginBottom: 0 }}>{activity.notes}</p> : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <strong>No activities found.</strong>
                    <p style={{ marginBottom: 0 }}>Adjust the date range or add a new activity.</p>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : null}

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
                width: 'min(100%, 44vw, 640px)',
                minWidth: 460,
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
              <div style={{ padding: '20px 24px 18px', borderBottom: '1px solid #eef3ef', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
                  <div className="eyebrow" style={{ marginTop: 2 }}>{activeChildId === 'new' ? 'Add child' : 'Child details'}</div>
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

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {childDraft.photos?.find((photo: any) => photo.id === childDraft.profilePhotoId)?.url ? (
                    <button type="button" onClick={() => openPhotoGallery()} onMouseEnter={() => setProfilePhotoHovered(true)} onMouseLeave={() => setProfilePhotoHovered(false)} style={{ padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', position: 'relative', width: 64, height: 64, flexShrink: 0 }} aria-label="Choose profile picture">
                      <img src={childDraft.photos.find((photo: any) => photo.id === childDraft.profilePhotoId).url} alt={childDraft.name || 'Child profile'} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid #d7e6dd' }} />
                      <span style={{ position: 'absolute', right: 0, bottom: 0, width: 22, height: 22, borderRadius: '50%', background: 'rgba(18, 49, 34, 0.88)', color: 'white', display: 'grid', placeItems: 'center', boxShadow: '0 6px 14px rgba(15, 23, 42, 0.18)', opacity: profilePhotoHovered ? 1 : 0.72, transform: profilePhotoHovered ? 'scale(1)' : 'scale(0.92)', transition: 'opacity 140ms ease, transform 140ms ease' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M4 20H8L18.5 9.5C19.3 8.7 19.3 7.45 18.5 6.65L17.35 5.5C16.55 4.7 15.3 4.7 14.5 5.5L4 16V20Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>
                  ) : (
                    <button type="button" onClick={() => openPhotoGallery()} onMouseEnter={() => setProfilePhotoHovered(true)} onMouseLeave={() => setProfilePhotoHovered(false)} style={{ width: 64, height: 64, borderRadius: '50%', background: '#dff1e3', color: '#135c31', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 18, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }} aria-label="Choose profile picture">
                      {(childDraft.name || 'N').split(' ').map((part: string) => part[0]).slice(0, 2).join('').toUpperCase()}
                      <span style={{ position: 'absolute', right: 0, bottom: 0, width: 22, height: 22, borderRadius: '50%', background: 'rgba(18, 49, 34, 0.88)', color: 'white', display: 'grid', placeItems: 'center', boxShadow: '0 6px 14px rgba(15, 23, 42, 0.18)', opacity: profilePhotoHovered ? 1 : 0.72, transform: profilePhotoHovered ? 'scale(1)' : 'scale(0.92)', transition: 'opacity 140ms ease, transform 140ms ease' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M4 20H8L18.5 9.5C19.3 8.7 19.3 7.45 18.5 6.65L17.35 5.5C16.55 4.7 15.3 4.7 14.5 5.5L4 16V20Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>
                  )}
                  <h2 style={{ marginBottom: 0 }}>{childDraft.name || 'New child'}</h2>
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
                        <div className="eyebrow">Photos - {childDraft.photos?.length || 0}</div>
                      </div>
                    </div>
                    {childDraft.photos?.length ? (
                      <div>
                        <div className="record-list" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                          {childDraft.photos.slice(0, 8).map((photo: any) => (
                            <button key={photo.id} type="button" className="record-item" style={{ padding: 6, position: 'relative', cursor: 'pointer', border: '1px solid #dfe9e2', background: 'white', aspectRatio: '1 / 1' }} onClick={() => openPhotoGallery(photo.id)}>
                              <img src={photo.url} alt={photo.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12, display: 'block' }} />
                              {childDraft.profilePhotoId === photo.id ? (
                                <span style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: '50%', background: '#1f8f47', color: 'white', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800 }}>
                                  P
                                </span>
                              ) : null}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="empty-state" style={{ marginTop: 0 }}>
                        <strong>No pictures yet.</strong>
                        <p style={{ marginBottom: 0 }}>Case workers and foster parents can add photos here to preserve a visual history for the child.</p>
                      </div>
                    )}
                    <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-start' }}>
                      <button type="button" className="button button-ghost" style={{ minHeight: 34, padding: '6px 12px' }} onClick={() => openPhotoGallery(childDraft.photos?.[0]?.id)}>
                        Open gallery
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            </section>

            {photoGalleryOpen ? (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.55)',
                  display: 'grid',
                  placeItems: 'center',
                  padding: 24,
                  zIndex: 60,
                }}
                onClick={() => setPhotoGalleryOpen(false)}
              >
                <section className="card" style={{ width: 'min(100%, 980px)', maxHeight: '88vh', overflow: 'auto', padding: 20 }} onClick={event => event.stopPropagation()}>
                  <div className="section-title" style={{ marginBottom: 14 }}>
                    <div>
                      <div className="eyebrow">Photos - {childDraft.photos?.length || 0}</div>
                    </div>
                    <div className="actions-row" style={{ marginTop: 0 }}>
                      <input id="child-photo-upload" type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
                      <button type="button" className="button button-primary" style={{ minHeight: 34, padding: '6px 12px', fontSize: 13 }} onClick={() => document.getElementById('child-photo-upload')?.click()}>
                        Upload photo
                      </button>
                      <button type="button" className="button button-ghost" onClick={() => setPhotoGalleryOpen(false)}>
                        Close
                      </button>
                    </div>
                  </div>

                  {childDraft.photos?.length ? (
                    <div className="record-list" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                      {childDraft.photos.map((photo: any) => (
                        <button key={photo.id} id={`gallery-photo-${photo.id}`} type="button" className="record-item" style={{ padding: 8, position: 'relative', border: '1px solid #dfe9e2', background: 'white', aspectRatio: '1 / 1' }} onClick={() => openPhotoViewer(photo.id)}>
                          <img src={photo.url} alt={photo.name || 'Photo'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12, display: 'block' }} />
                          {photo.id === childDraft.profilePhotoId ? (
                            <span style={{ position: 'absolute', top: 14, right: 14, width: 22, height: 22, borderRadius: '50%', background: '#1f8f47', color: 'white', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800 }}>
                              P
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state" style={{ marginTop: 0 }}>
                      <strong>No pictures yet.</strong>
                      <p style={{ marginBottom: 0 }}>Upload a photo here to start the child gallery.</p>
                    </div>
                  )}
                </section>
              </div>
            ) : null}

            {photoViewerOpen && childDraft.photos?.[selectedPhotoIndex] ? (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.72)',
                  display: 'grid',
                  placeItems: 'center',
                  padding: 24,
                  zIndex: 70,
                }}
                onClick={() => setPhotoViewerOpen(false)}
              >
                <section className="card" style={{ width: 'min(100%, 980px)', maxHeight: '88vh', overflow: 'auto', padding: 20 }} onClick={event => event.stopPropagation()}>
                  <div className="section-title" style={{ marginBottom: 14 }}>
                    <div>
                      <div className="eyebrow">Photo</div>
                    </div>
                    <div className="actions-row" style={{ marginTop: 0, position: 'relative' }}>
                      <button type="button" className="button button-ghost" style={{ minHeight: 36, padding: '6px 12px' }} onClick={() => setPhotoMenuOpen(current => current === 'viewer' ? null : 'viewer')}>
                        ☰
                      </button>
                      {photoMenuOpen === 'viewer' ? (
                        <div className="card" style={{ position: 'absolute', top: 42, right: 48, padding: '10px 14px', minWidth: 220, zIndex: 2 }}>
                          <div className="stack" style={{ gap: 6 }}>
                            {childDraft.photos[selectedPhotoIndex].id === childDraft.profilePhotoId ? (
                              <button type="button" onMouseEnter={() => setPhotoMenuHover('remove-profile')} onMouseLeave={() => setPhotoMenuHover(null)} style={{ border: 'none', background: 'transparent', padding: '4px 0', textAlign: 'left', fontSize: 14, fontWeight: 600, color: photoMenuHover === 'remove-profile' ? '#135c31' : '#254034', cursor: 'pointer' }} onClick={() => setProfilePhoto('')}>
                                Remove profile picture
                              </button>
                            ) : (
                              <button type="button" onMouseEnter={() => setPhotoMenuHover('set-profile')} onMouseLeave={() => setPhotoMenuHover(null)} style={{ border: 'none', background: 'transparent', padding: '4px 0', textAlign: 'left', fontSize: 14, fontWeight: 600, color: photoMenuHover === 'set-profile' ? '#135c31' : '#254034', cursor: 'pointer' }} onClick={() => setProfilePhoto(childDraft.photos[selectedPhotoIndex].id)}>
                                Set as profile picture
                              </button>
                            )}
                            <button type="button" onMouseEnter={() => setPhotoMenuHover('delete')} onMouseLeave={() => setPhotoMenuHover(null)} style={{ border: 'none', background: 'transparent', padding: '4px 0', textAlign: 'left', fontSize: 14, fontWeight: 600, color: photoMenuHover === 'delete' ? '#135c31' : '#254034', cursor: 'pointer' }} onClick={() => removePhoto(childDraft.photos[selectedPhotoIndex].id)}>
                              Delete photo
                            </button>
                            <button type="button" onMouseEnter={() => setPhotoMenuHover('download')} onMouseLeave={() => setPhotoMenuHover(null)} style={{ border: 'none', background: 'transparent', padding: '4px 0', textAlign: 'left', fontSize: 14, fontWeight: 600, color: photoMenuHover === 'download' ? '#135c31' : '#254034', cursor: 'pointer' }} onClick={() => downloadPhoto(childDraft.photos[selectedPhotoIndex])}>
                              Download photo
                            </button>
                          </div>
                        </div>
                      ) : null}
                      <button type="button" className="button button-ghost" onClick={() => setPhotoViewerOpen(false)}>
                        Close
                      </button>
                    </div>
                  </div>
                  <div style={{ position: 'relative', background: '#f7faf8', borderRadius: 18, overflow: 'hidden' }}>
                    <img src={childDraft.photos[selectedPhotoIndex].url} alt={childDraft.photos[selectedPhotoIndex].name || 'Photo'} style={{ width: '100%', maxHeight: '72vh', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                    {childDraft.photos[selectedPhotoIndex].id === childDraft.profilePhotoId ? (
                      <span style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderRadius: '50%', background: '#1f8f47', color: 'white', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800 }}>
                        P
                      </span>
                    ) : null}
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
