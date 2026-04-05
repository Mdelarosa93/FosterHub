'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import type {
  BulkImportKnowledgeDocumentSectionsRequest,
  CreateKnowledgeDocumentSourceRequest,
  KnowledgeDocumentAccessScope,
  KnowledgeDocumentAuditEventRecord,
  KnowledgeDocumentSectionDiffRecord,
  KnowledgeDocumentSectionDraft,
  KnowledgeDocumentSectionRecord,
  KnowledgeDocumentSectionSnapshotCompareResponse,
  KnowledgeDocumentSectionSnapshotRecord,
  KnowledgeDocumentSourceSummary,
  KnowledgeDocumentStatus,
  ReplaceKnowledgeDocumentSectionsRequest,
  UpdateKnowledgeDocumentSourceRequest,
} from '@fosterhub/types';
import { AppShell } from '../../../components/AppShell';
import { API_BASE, authedDelete, authedGet, authedPatch, authedPost } from '../../../lib/api';

type StoredUser = {
  organizationName?: string;
  organizationType?: 'state_agency' | 'county_agency';
};

type EditableSection = {
  id: string;
  heading: string;
  sectionKey: string;
  pageNumber: string;
  sortOrder: number;
  body: string;
};

const emptyCreateForm: CreateKnowledgeDocumentSourceRequest = {
  title: '',
  sourceType: 'POLICY_MANUAL',
  accessScope: 'ORGANIZATION_ONLY',
  status: 'DRAFT',
  versionLabel: '',
  effectiveDate: '',
  fileName: '',
  fileUrl: '',
  notes: '',
};

export default function KnowledgeBaseSettingsPage() {
  const [sources, setSources] = useState<KnowledgeDocumentSourceSummary[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [sections, setSections] = useState<KnowledgeDocumentSectionRecord[]>([]);
  const [auditEvents, setAuditEvents] = useState<KnowledgeDocumentAuditEventRecord[]>([]);
  const [sectionSnapshots, setSectionSnapshots] = useState<KnowledgeDocumentSectionSnapshotRecord[]>([]);
  const [editableSections, setEditableSections] = useState<EditableSection[]>([]);
  const [storedUser, setStoredUser] = useState<StoredUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const [savingSections, setSavingSections] = useState(false);
  const [creatingSource, setCreatingSource] = useState(false);
  const [updatingSource, setUpdatingSource] = useState(false);
  const [deletingSource, setDeletingSource] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [importingPreview, setImportingPreview] = useState(false);
  const [extractingFile, setExtractingFile] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkImportPreview, setBulkImportPreview] = useState<KnowledgeDocumentSectionDraft[]>([]);
  const [snapshotCompareOpen, setSnapshotCompareOpen] = useState(false);
  const [snapshotPreviewMode, setSnapshotPreviewMode] = useState<'compare' | 'restore'>('compare');
  const [expandedDiffBodies, setExpandedDiffBodies] = useState<Record<string, boolean>>({});
  const [diffSearch, setDiffSearch] = useState('');
  const [compactDiffMode, setCompactDiffMode] = useState(false);
  const [visibleChangeTypes, setVisibleChangeTypes] = useState<Record<'added' | 'updated' | 'removed', boolean>>({
    added: true,
    updated: true,
    removed: true,
  });
  const [comparingSnapshotId, setComparingSnapshotId] = useState<string | null>(null);
  const [restoringSnapshotId, setRestoringSnapshotId] = useState<string | null>(null);
  const [snapshotComparison, setSnapshotComparison] = useState<KnowledgeDocumentSectionSnapshotCompareResponse | null>(null);
  const [createForm, setCreateForm] = useState<CreateKnowledgeDocumentSourceRequest>(emptyCreateForm);
  const [editForm, setEditForm] = useState<UpdateKnowledgeDocumentSourceRequest>({});
  const [error, setError] = useState<string | null>(null);

  const selectedSource = useMemo(
    () => sources.find(source => source.id === selectedSourceId) ?? null,
    [sources, selectedSourceId],
  );

  const canManageKnowledgeBase = permissions.includes('knowledge_sources.manage');
  const canViewKnowledgeBase = permissions.includes('knowledge_sources.view');
  const isCountyContext = storedUser?.organizationType === 'county_agency';

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('fosterhub.dev.user');
      if (rawUser) {
        setStoredUser(JSON.parse(rawUser));
      }
    } catch {
      setStoredUser(null);
    }
  }, []);

  useEffect(() => {
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) {
      setError('No token found. Please log in first.');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [sourceResult, permissionResult] = await Promise.all([
          authedGet('/knowledge-base/sources', authToken),
          authedGet('/auth/my-permissions', authToken),
        ]);

        const nextSources = (sourceResult.data || []) as KnowledgeDocumentSourceSummary[];
        setSources(nextSources);
        setPermissions(permissionResult.data || []);
        setSelectedSourceId(current => current || nextSources[0]?.id || '');
      } catch (err: any) {
        setError(err?.message || 'Failed to load knowledge base settings');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken || !selectedSourceId || !canViewKnowledgeBase) {
      setSections([]);
      setAuditEvents([]);
      setSectionSnapshots([]);
      setEditableSections([]);
      return;
    }

    async function loadSections() {
      try {
        setLoadingSections(true);
        await reloadSourceDetail(selectedSourceId);
      } catch (err: any) {
        setError(err?.message || 'Failed to load document sections');
      } finally {
        setLoadingSections(false);
      }
    }

    loadSections();
  }, [selectedSourceId, canViewKnowledgeBase]);

  async function reloadSourceDetail(sourceId: string) {
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken || !canViewKnowledgeBase) return;

    const [sectionResult, auditResult, snapshotResult] = await Promise.all([
      authedGet(`/knowledge-base/sources/${sourceId}/sections`, authToken),
      authedGet(`/knowledge-base/sources/${sourceId}/audit`, authToken),
      authedGet(`/knowledge-base/sources/${sourceId}/section-snapshots`, authToken),
    ]);
    const nextSections = (sectionResult.data || []) as KnowledgeDocumentSectionRecord[];
    setSections(nextSections);
    setAuditEvents((auditResult.data || []) as KnowledgeDocumentAuditEventRecord[]);
    setSectionSnapshots((snapshotResult.data || []) as KnowledgeDocumentSectionSnapshotRecord[]);
    setEditableSections(nextSections.map(section => ({
      id: section.id,
      heading: section.heading,
      sectionKey: section.sectionKey || '',
      pageNumber: section.pageNumber ? String(section.pageNumber) : '',
      sortOrder: section.sortOrder,
      body: section.body,
    })));
  }

  async function refreshSources(selectSourceId?: string) {
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) return;

    const result = await authedGet('/knowledge-base/sources', authToken);
    const nextSources = (result.data || []) as KnowledgeDocumentSourceSummary[];
    setSources(nextSources);
    setSelectedSourceId(selectSourceId || nextSources.find(source => source.id === selectedSourceId)?.id || nextSources[0]?.id || '');
  }

  function openEditModal() {
    if (!selectedSource) return;
    setEditForm({
      title: selectedSource.title,
      sourceType: selectedSource.sourceType,
      accessScope: selectedSource.accessScope,
      status: selectedSource.status,
      versionLabel: selectedSource.versionLabel || '',
      effectiveDate: selectedSource.effectiveDate ? selectedSource.effectiveDate.slice(0, 10) : '',
      fileName: selectedSource.fileName || '',
      fileUrl: selectedSource.fileUrl || '',
      notes: selectedSource.notes || '',
    });
    setEditModalOpen(true);
  }

  async function handleCreateSource() {
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) return;

    try {
      setCreatingSource(true);
      setError(null);
      const payload: CreateKnowledgeDocumentSourceRequest = {
        ...createForm,
        effectiveDate: createForm.effectiveDate || undefined,
        versionLabel: createForm.versionLabel || undefined,
        fileName: createForm.fileName || undefined,
        fileUrl: createForm.fileUrl || undefined,
        notes: createForm.notes || undefined,
      };
      const result = await authedPost('/knowledge-base/sources', authToken, payload as Record<string, any>);
      const created = result.data as KnowledgeDocumentSourceSummary;
      setCreateModalOpen(false);
      setCreateForm({ ...emptyCreateForm, accessScope: isCountyContext ? 'ORGANIZATION_ONLY' : 'ORGANIZATION_ONLY' });
      await refreshSources(created.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to create knowledge document source');
    } finally {
      setCreatingSource(false);
    }
  }

  async function handleDownloadSourceFile() {
    if (!selectedSource?.fileUrl) return;
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) return;

    try {
      const response = await fetch(`${API_BASE}${selectedSource.fileUrl}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || 'Failed to download source file');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = selectedSource.fileName || 'knowledge-source-file';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || 'Failed to download source file');
    }
  }

  async function handleUpdateSource() {
    if (!selectedSource) return;
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) return;

    try {
      setUpdatingSource(true);
      setError(null);
      const payload: UpdateKnowledgeDocumentSourceRequest = {
        ...editForm,
        effectiveDate: editForm.effectiveDate || '',
      };
      await authedPatch(`/knowledge-base/sources/${selectedSource.id}`, authToken, payload as Record<string, any>);
      setEditModalOpen(false);
      await refreshSources(selectedSource.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to update knowledge document source');
    } finally {
      setUpdatingSource(false);
    }
  }

  async function handleDeleteSource() {
    if (!selectedSource) return;
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) return;

    const confirmed = window.confirm(`Delete ${selectedSource.title}? This will remove its sections too.`);
    if (!confirmed) return;

    try {
      setDeletingSource(true);
      setError(null);
      await authedDelete(`/knowledge-base/sources/${selectedSource.id}`, authToken);
      setEditModalOpen(false);
      await refreshSources();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete knowledge document source');
    } finally {
      setDeletingSource(false);
    }
  }

  function getVisibleDiffChanges() {
    if (!snapshotComparison) return [] as KnowledgeDocumentSectionDiffRecord[];
    const search = diffSearch.trim().toLowerCase();
    return snapshotComparison.changes.filter(change => {
      if (!visibleChangeTypes[change.changeType]) return false;
      if (!search) return true;
      return [change.heading, change.beforeBody || '', change.afterBody || ''].join(' ').toLowerCase().includes(search);
    });
  }

  function buildDiffSummaryText() {
    if (!snapshotComparison) return '';
    const visibleChanges = getVisibleDiffChanges();
    const lines = [
      `Snapshot diff summary`,
      `Source: ${selectedSource?.title || 'Knowledge source'}`,
      `Snapshot version: ${snapshotComparison.snapshotVersionNumber}`,
      `Compared against: ${snapshotComparison.againstVersionNumber ? `Version ${snapshotComparison.againstVersionNumber}` : 'Empty baseline'}`,
      `Mode: ${snapshotPreviewMode}`,
      `Search: ${diffSearch.trim() || 'None'}`,
      `Visible groups: ${(['added', 'updated', 'removed'] as const).filter(group => visibleChangeTypes[group]).join(', ') || 'None'}`,
      `Visible changes: ${visibleChanges.length}`,
      '',
    ];

    for (const group of ['added', 'updated', 'removed'] as const) {
      const groupChanges = visibleChanges.filter(change => change.changeType === group);
      if (!groupChanges.length) continue;
      lines.push(`${group.toUpperCase()} (${groupChanges.length})`);
      for (const change of groupChanges) {
        lines.push(`- ${change.heading}`);
        if (change.beforePageNumber) lines.push(`  Before page: ${change.beforePageNumber}`);
        if (change.afterPageNumber) lines.push(`  After page: ${change.afterPageNumber}`);
        if (change.beforeBody) lines.push(`  Before: ${change.beforeBody.slice(0, 280).replace(/\s+/g, ' ').trim()}`);
        if (change.afterBody) lines.push(`  After: ${change.afterBody.slice(0, 280).replace(/\s+/g, ' ').trim()}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  async function handleCopyDiffSummary() {
    try {
      await navigator.clipboard.writeText(buildDiffSummaryText());
    } catch (err: any) {
      setError(err?.message || 'Failed to copy diff summary');
    }
  }

  function handleExportDiffSummary() {
    try {
      const blob = new Blob([buildDiffSummaryText()], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `snapshot-diff-v${snapshotComparison?.snapshotVersionNumber || 'x'}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || 'Failed to export diff summary');
    }
  }

  async function openSnapshotPreview(snapshotId: string, mode: 'compare' | 'restore') {
    if (!selectedSource) return;
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) return;

    try {
      setComparingSnapshotId(snapshotId);
      setError(null);
      const result = await authedGet(`/knowledge-base/sources/${selectedSource.id}/section-snapshots/${snapshotId}/compare`, authToken);
      setSnapshotComparison((result.data || null) as KnowledgeDocumentSectionSnapshotCompareResponse | null);
      setExpandedDiffBodies({});
      setDiffSearch('');
      setCompactDiffMode(false);
      setVisibleChangeTypes({ added: true, updated: true, removed: true });
      setSnapshotPreviewMode(mode);
      setSnapshotCompareOpen(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to compare snapshot');
    } finally {
      setComparingSnapshotId(null);
    }
  }

  async function handleRestoreSnapshot() {
    if (!selectedSource || !snapshotComparison) return;
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) return;

    try {
      setRestoringSnapshotId(snapshotComparison.snapshotId);
      setError(null);
      await authedPost(`/knowledge-base/sources/${selectedSource.id}/section-snapshots/${snapshotComparison.snapshotId}/restore`, authToken, {});
      setSnapshotCompareOpen(false);
      await refreshSources(selectedSource.id);
      await reloadSourceDetail(selectedSource.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to restore snapshot');
    } finally {
      setRestoringSnapshotId(null);
    }
  }

  function tokenizeDiffText(text: string) {
    return text.split(/(\s+)/).filter(token => token.length > 0);
  }

  function buildWordDiff(beforeText: string, afterText: string) {
    const beforeTokens = tokenizeDiffText(beforeText);
    const afterTokens = tokenizeDiffText(afterText);
    const dp = Array.from({ length: beforeTokens.length + 1 }, () => Array(afterTokens.length + 1).fill(0));

    for (let i = beforeTokens.length - 1; i >= 0; i -= 1) {
      for (let j = afterTokens.length - 1; j >= 0; j -= 1) {
        dp[i][j] = beforeTokens[i] === afterTokens[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }

    const beforeParts: Array<{ text: string; kind: 'same' | 'removed' }> = [];
    const afterParts: Array<{ text: string; kind: 'same' | 'added' }> = [];
    let i = 0;
    let j = 0;

    while (i < beforeTokens.length && j < afterTokens.length) {
      if (beforeTokens[i] === afterTokens[j]) {
        beforeParts.push({ text: beforeTokens[i], kind: 'same' });
        afterParts.push({ text: afterTokens[j], kind: 'same' });
        i += 1;
        j += 1;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        beforeParts.push({ text: beforeTokens[i], kind: 'removed' });
        i += 1;
      } else {
        afterParts.push({ text: afterTokens[j], kind: 'added' });
        j += 1;
      }
    }

    while (i < beforeTokens.length) {
      beforeParts.push({ text: beforeTokens[i], kind: 'removed' });
      i += 1;
    }

    while (j < afterTokens.length) {
      afterParts.push({ text: afterTokens[j], kind: 'added' });
      j += 1;
    }

    return { beforeParts, afterParts };
  }

  function renderHighlightedDiff(beforeText: string, afterText: string, mode: 'before' | 'after') {
    const { beforeParts, afterParts } = buildWordDiff(beforeText, afterText);
    const parts = mode === 'before' ? beforeParts : afterParts;

    return parts.map((part, index) => {
      if (part.kind === 'same') {
        return <Fragment key={`${mode}-${index}`}>{part.text}</Fragment>;
      }

      const style = mode === 'before'
        ? { background: '#ffe4e1', color: '#9f1239', borderRadius: 6, padding: '1px 2px' }
        : { background: '#dcfce7', color: '#166534', borderRadius: 6, padding: '1px 2px' };

      return (
        <span key={`${mode}-${index}`} style={style}>
          {part.text}
        </span>
      );
    });
  }

  function renderDiffBody(text: string | null | undefined, bodyKey: string, mode?: 'before' | 'after', compareText?: string | null | undefined) {
    const value = text || '—';
    const isLong = value.length > 420;
    const expanded = expandedDiffBodies[bodyKey] || false;
    const displayText = isLong && !expanded ? `${value.slice(0, 420).trim()}…` : value;
    const shouldHighlight = mode && compareText && value !== '—' && compareText !== '—';

    const showHighlighted = shouldHighlight && (!isLong || expanded);

    return (
      <>
        <p style={{ marginTop: 8, marginBottom: 0, color: 'var(--fh-text)', whiteSpace: 'pre-wrap' }}>
          {showHighlighted
            ? renderHighlightedDiff(mode === 'before' ? value : compareText, mode === 'before' ? compareText : value, mode)
            : displayText}
        </p>
        {shouldHighlight && isLong && !expanded ? (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--fh-text-muted)' }}>Expand to see inline word changes.</div>
        ) : null}
        {isLong ? (
          <div className="actions-row" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => setExpandedDiffBodies(current => ({ ...current, [bodyKey]: !expanded }))}
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          </div>
        ) : null}
      </>
    );
  }

  async function handleBulkImportPreview() {
    if (!selectedSource) return;
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) return;

    try {
      setImportingPreview(true);
      setError(null);
      const payload: BulkImportKnowledgeDocumentSectionsRequest = {
        rawText: bulkImportText,
      };
      const result = await authedPost(`/knowledge-base/sources/${selectedSource.id}/sections/import-preview`, authToken, payload as Record<string, any>);
      setBulkImportPreview((result.data || []) as KnowledgeDocumentSectionDraft[]);
    } catch (err: any) {
      setError(err?.message || 'Failed to parse imported text into sections');
    } finally {
      setImportingPreview(false);
    }
  }

  async function handleFileExtraction(file: File | null) {
    if (!file || !selectedSource) return;

    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) return;

    try {
      setExtractingFile(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/knowledge-base/sources/${selectedSource.id}/sections/extract-preview`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || 'Failed to extract sections from file');
      }

      setBulkImportText(result?.data?.extractedText || '');
      setBulkImportPreview(result?.data?.sections || []);
      await refreshSources(selectedSource.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to extract sections from file');
    } finally {
      setExtractingFile(false);
    }
  }

  function applyBulkImportPreview() {
    setEditableSections(bulkImportPreview.map((section, index) => ({
      id: `import-${Date.now()}-${index}`,
      heading: section.heading,
      sectionKey: section.sectionKey || '',
      pageNumber: section.pageNumber ? String(section.pageNumber) : '',
      sortOrder: section.sortOrder ?? index,
      body: section.body,
    })));
    setBulkImportOpen(false);
    setBulkImportPreview([]);
    setBulkImportText('');
  }

  async function handleSaveSections() {
    if (!selectedSource) return;
    const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!authToken) return;

    try {
      setSavingSections(true);
      setError(null);
      const payload: ReplaceKnowledgeDocumentSectionsRequest = {
        sections: editableSections.map((section, index) => ({
          heading: section.heading,
          sectionKey: section.sectionKey || undefined,
          pageNumber: section.pageNumber ? Number(section.pageNumber) : undefined,
          sortOrder: typeof section.sortOrder === 'number' ? section.sortOrder : index,
          body: section.body,
        })),
      };
      const result = await authedPost(`/knowledge-base/sources/${selectedSource.id}/sections/replace`, authToken, payload as Record<string, any>);
      await refreshSources(selectedSource.id);
      await reloadSourceDetail(selectedSource.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to save document sections');
    } finally {
      setSavingSections(false);
    }
  }

  function addSection() {
    setEditableSections(current => [
      ...current,
      {
        id: `draft-${Date.now()}-${current.length}`,
        heading: '',
        sectionKey: '',
        pageNumber: '',
        sortOrder: current.length,
        body: '',
      },
    ]);
  }

  function removeSection(id: string) {
    setEditableSections(current => current.filter(section => section.id !== id).map((section, index) => ({ ...section, sortOrder: index })));
  }

  function updateSection(id: string, patch: Partial<EditableSection>) {
    setEditableSections(current => current.map(section => section.id === id ? { ...section, ...patch } : section));
  }

  return (
    <AppShell
      title="Settings"
      headerActions={<div style={{ color: 'var(--fh-text-muted)', fontWeight: 600 }}>Knowledge Base</div>}
    >
      <main>
        <div className="page-stack">
          <section className="card">
            <div className="section-title">
              <div>
                <div className="eyebrow">Admin settings</div>
                <h2 style={{ marginBottom: 8 }}>Knowledge Base</h2>
                <p style={{ marginBottom: 0 }}>
                  Manage approved policy documents and section content for Ask FosterHub AI. State-level sources can be inherited by county portals. County-level sources stay local.
                </p>
              </div>
              {canManageKnowledgeBase ? (
                <button type="button" className="button button-secondary" onClick={() => setCreateModalOpen(true)}>
                  Add source
                </button>
              ) : null}
            </div>

            <div className="actions-row" style={{ marginTop: 0 }}>
              <span className="status-pill" style={{ background: '#eef6ff', color: 'var(--fh-blue)' }}>
                {storedUser?.organizationName || 'Active organization'}
              </span>
              <span className="status-pill">
                {isCountyContext ? 'County context' : 'State context'}
              </span>
              <span className="status-pill" style={{ background: '#fff5eb', color: '#9a5b07' }}>
                {sources.length} source{sources.length === 1 ? '' : 's'}
              </span>
            </div>
          </section>

          {error ? (
            <div className="notice notice-error">
              <strong>Something went wrong</strong>
              <p style={{ marginBottom: 0 }}>{error}</p>
            </div>
          ) : null}

          {!loading && !canViewKnowledgeBase ? (
            <div className="empty-state">
              <strong>You do not have access to Knowledge Base settings.</strong>
              <p style={{ marginBottom: 0 }}>An administrator with knowledge source permissions can manage approved documents here.</p>
            </div>
          ) : null}

          {canViewKnowledgeBase ? (
            <div style={{ display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
              <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: 22, borderBottom: '1px solid var(--fh-border)' }}>
                  <h3 style={{ marginBottom: 8 }}>Sources</h3>
                  <p style={{ marginBottom: 0 }}>Approved manuals, handbooks, and guidance documents available in this portal context.</p>
                </div>

                {loading ? (
                  <div style={{ padding: 22, color: 'var(--fh-text-muted)' }}>Loading sources...</div>
                ) : sources.length ? (
                  <div style={{ display: 'grid', gap: 10, padding: 14 }}>
                    {sources.map(source => {
                      const active = source.id === selectedSourceId;
                      return (
                        <button
                          key={source.id}
                          type="button"
                          onClick={() => setSelectedSourceId(source.id)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            borderRadius: 18,
                            padding: 16,
                            border: active ? '1px solid rgba(16, 88, 140, 0.22)' : '1px solid var(--fh-border)',
                            background: active ? 'linear-gradient(180deg, #f6fbff 0%, #fbfdff 100%)' : 'white',
                            boxShadow: active ? '0 12px 28px rgba(16, 88, 140, 0.08)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                            <strong style={{ color: 'var(--fh-text)' }}>{source.title}</strong>
                            <span className="badge" style={{ padding: '5px 10px', fontSize: 11 }}>{source.status}</span>
                          </div>
                          <div className="record-meta" style={{ marginTop: 0 }}>
                            <span>{source.sourceType}</span>
                            <span>{source.organizationName}</span>
                            <span>{source.sectionCount} sections</span>
                          </div>
                          <div className="record-meta">
                            <span>{source.accessScope === 'INHERIT_TO_CHILDREN' ? 'Inherited to child orgs' : 'Local to current org'}</span>
                            {!source.canManage ? <span>Read only</span> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state" style={{ margin: 14 }}>
                    <strong>No knowledge sources yet.</strong>
                    <p style={{ marginBottom: 0 }}>Add your first approved document source to begin building the policy corpus for Ask FosterHub AI.</p>
                  </div>
                )}
              </section>

              <section className="card">
                {selectedSource ? (
                  <div className="page-stack">
                    <div>
                      <div className="section-title" style={{ marginBottom: 10 }}>
                        <div>
                          <h3 style={{ marginBottom: 8 }}>{selectedSource.title}</h3>
                          <p style={{ marginBottom: 0 }}>
                            {selectedSource.canManage
                              ? 'Manage document metadata and section content for this source.'
                              : `This source is inherited from ${selectedSource.inheritedFromOrganizationName || selectedSource.organizationName} and is read only in the current portal context.`}
                          </p>
                        </div>
                        {selectedSource.canManage ? (
                          <div className="actions-row" style={{ marginTop: 0 }}>
                            <button type="button" className="button button-ghost" onClick={openEditModal}>
                              Edit source
                            </button>
                            <button type="button" className="button button-ghost" onClick={() => setBulkImportOpen(true)}>
                              Bulk import
                            </button>
                            <button type="button" className="button button-secondary" onClick={addSection}>
                              Add section
                            </button>
                          </div>
                        ) : null}
                      </div>

                      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                        <div className="record-item">
                          <div className="kpi-label">Source type</div>
                          <div style={{ fontWeight: 800, marginTop: 8 }}>{selectedSource.sourceType}</div>
                        </div>
                        <div className="record-item">
                          <div className="kpi-label">Access</div>
                          <div style={{ fontWeight: 800, marginTop: 8 }}>{selectedSource.accessScope === 'INHERIT_TO_CHILDREN' ? 'Inherited to child orgs' : 'Organization only'}</div>
                        </div>
                        <div className="record-item">
                          <div className="kpi-label">Status</div>
                          <div style={{ fontWeight: 800, marginTop: 8 }}>{selectedSource.status}</div>
                        </div>
                        <div className="record-item">
                          <div className="kpi-label">Version</div>
                          <div style={{ fontWeight: 800, marginTop: 8 }}>{selectedSource.versionLabel || 'Not set'}</div>
                        </div>
                      </div>

                      <div className="record-item" style={{ marginTop: 16 }}>
                        <div className="section-title" style={{ marginBottom: 8 }}>
                          <div>
                            <div className="kpi-label">Uploaded source file metadata</div>
                          </div>
                        </div>
                        <div className="record-meta" style={{ marginTop: 0 }}>
                          <span>{selectedSource.fileName || 'No uploaded file recorded yet'}</span>
                          {selectedSource.fileContentType ? <span>{selectedSource.fileContentType}</span> : null}
                          {selectedSource.fileSizeBytes ? <span>{Math.max(1, Math.round(selectedSource.fileSizeBytes / 1024))} KB</span> : null}
                          {selectedSource.lastExtractedAt ? <span>Last extracted {new Date(selectedSource.lastExtractedAt).toLocaleString()}</span> : null}
                        </div>
                        {selectedSource.fileUrl ? (
                          <div className="actions-row" style={{ marginTop: 12 }}>
                            <button type="button" className="button button-ghost" onClick={handleDownloadSourceFile}>Download stored file</button>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <div className="section-title" style={{ marginBottom: 10 }}>
                        <div>
                          <h3 style={{ marginBottom: 8 }}>Sections</h3>
                          <p style={{ marginBottom: 0 }}>Organize document excerpts into structured sections that the AI can cite back to users.</p>
                        </div>
                        {selectedSource.canManage ? (
                          <button type="button" className="button button-primary" disabled={savingSections} onClick={handleSaveSections}>
                            {savingSections ? 'Saving…' : 'Save sections'}
                          </button>
                        ) : null}
                      </div>

                      {loadingSections ? (
                        <div className="empty-state">
                          <strong>Loading sections...</strong>
                        </div>
                      ) : selectedSource.canManage ? (
                        editableSections.length ? (
                          <div className="stack">
                            {editableSections.map((section, index) => (
                              <div key={section.id} className="card card-muted" style={{ padding: 20 }}>
                                <div className="section-title" style={{ marginBottom: 14 }}>
                                  <div style={{ fontWeight: 800 }}>Section {index + 1}</div>
                                  <button type="button" className="button button-ghost" onClick={() => removeSection(section.id)}>
                                    Remove
                                  </button>
                                </div>
                                <div className="form-grid" style={{ gridTemplateColumns: 'minmax(0, 1.2fr) 180px 140px' }}>
                                  <label className="field">
                                    <span>Heading</span>
                                    <input className="input" value={section.heading} onChange={event => updateSection(section.id, { heading: event.target.value })} />
                                  </label>
                                  <label className="field">
                                    <span>Section key</span>
                                    <input className="input" value={section.sectionKey} onChange={event => updateSection(section.id, { sectionKey: event.target.value })} />
                                  </label>
                                  <label className="field">
                                    <span>Page</span>
                                    <input className="input" inputMode="numeric" value={section.pageNumber} onChange={event => updateSection(section.id, { pageNumber: event.target.value })} />
                                  </label>
                                </div>
                                <label className="field" style={{ marginTop: 16 }}>
                                  <span>Body</span>
                                  <textarea className="textarea" value={section.body} onChange={event => updateSection(section.id, { body: event.target.value })} style={{ minHeight: 150 }} />
                                </label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-state">
                            <strong>No sections yet.</strong>
                            <p style={{ marginBottom: 0 }}>Add your first section to start building a source that Ask FosterHub AI can search and cite.</p>
                          </div>
                        )
                      ) : sections.length ? (
                        <div className="record-list">
                          {sections.map(section => (
                            <div key={section.id} className="record-item">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                <strong>{section.heading}</strong>
                                <span className="status-pill" style={{ background: '#f3f8f5', color: 'var(--fh-blue)' }}>
                                  {section.pageNumber ? `Page ${section.pageNumber}` : 'No page'}
                                </span>
                              </div>
                              <div className="record-meta">
                                {section.sectionKey ? <span>{section.sectionKey}</span> : null}
                                <span>Order {section.sortOrder + 1}</span>
                              </div>
                              <p style={{ marginTop: 14, marginBottom: 0, color: 'var(--fh-text)' }}>{section.body}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-state">
                          <strong>No sections available.</strong>
                          <p style={{ marginBottom: 0 }}>This inherited source does not have any saved sections yet.</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="section-title" style={{ marginBottom: 10 }}>
                        <div>
                          <h3 style={{ marginBottom: 8 }}>Section versions</h3>
                          <p style={{ marginBottom: 0 }}>Saved section snapshots with diff counts between versions.</p>
                        </div>
                      </div>

                      {sectionSnapshots.length ? (
                        <div className="record-list">
                          {sectionSnapshots.map(snapshot => (
                            <div key={snapshot.id} className="record-item">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                <strong>Version {snapshot.versionNumber}</strong>
                                <span className="status-pill">{new Date(snapshot.createdAt).toLocaleString()}</span>
                              </div>
                              <div className="record-meta">
                                <span>{snapshot.sectionCount} sections</span>
                                <span>{snapshot.addedCount} added</span>
                                <span>{snapshot.updatedCount} updated</span>
                                <span>{snapshot.removedCount} removed</span>
                              </div>
                              {snapshot.changedHeadings.length ? (
                                <div className="record-meta">
                                  {snapshot.changedHeadings.map(heading => <span key={heading}>{heading}</span>)}
                                </div>
                              ) : null}
                              <div className="actions-row" style={{ marginTop: 12 }}>
                                <button type="button" className="button button-ghost" disabled={comparingSnapshotId === snapshot.id} onClick={() => openSnapshotPreview(snapshot.id, 'compare')}>
                                  {comparingSnapshotId === snapshot.id ? 'Comparing…' : 'Compare'}
                                </button>
                                {selectedSource.canManage ? (
                                  <button type="button" className="button button-ghost" disabled={comparingSnapshotId === snapshot.id || restoringSnapshotId === snapshot.id} onClick={() => openSnapshotPreview(snapshot.id, 'restore')}>
                                    {restoringSnapshotId === snapshot.id ? 'Restoring…' : 'Restore'}
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-state">
                          <strong>No section versions yet.</strong>
                          <p style={{ marginBottom: 0 }}>A version snapshot will be created each time sections are saved.</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="section-title" style={{ marginBottom: 10 }}>
                        <div>
                          <h3 style={{ marginBottom: 8 }}>Version history</h3>
                          <p style={{ marginBottom: 0 }}>Track source changes, file uploads, and section updates over time.</p>
                        </div>
                      </div>

                      {auditEvents.length ? (
                        <div className="record-list">
                          {auditEvents.map(event => (
                            <div key={event.id} className="record-item">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                <strong>{event.summary}</strong>
                                <span className="status-pill">{new Date(event.createdAt).toLocaleString()}</span>
                              </div>
                              <div className="record-meta">
                                <span>{event.eventType}</span>
                                {event.actorName ? <span>{event.actorName}</span> : null}
                                {event.snapshotVersionLabel ? <span>Version {event.snapshotVersionLabel}</span> : null}
                                {event.snapshotStatus ? <span>{event.snapshotStatus}</span> : null}
                                {typeof event.snapshotSectionCount === 'number' ? <span>{event.snapshotSectionCount} sections</span> : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-state">
                          <strong>No history yet.</strong>
                          <p style={{ marginBottom: 0 }}>Source activity will appear here as admins update metadata, upload files, and save sections.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <strong>Select a source to begin.</strong>
                    <p style={{ marginBottom: 0 }}>Choose a knowledge source from the left to review its metadata and manage document sections.</p>
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </main>

      {snapshotCompareOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.36)',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            zIndex: 50,
          }}
        >
          <div className="card" style={{ width: 'min(980px, 100%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="section-title" style={{ paddingBottom: 18, borderBottom: '1px solid var(--fh-border)' }}>
              <div>
                <div className="eyebrow">Snapshot compare</div>
                <h3 style={{ marginBottom: 8 }}>{snapshotPreviewMode === 'restore' ? 'Restore preview' : 'Compare snapshot'}</h3>
                <p style={{ marginBottom: 0 }}>
                  {snapshotComparison
                    ? snapshotPreviewMode === 'restore'
                      ? `Review the changes in version ${snapshotComparison.snapshotVersionNumber} before restoring it as the current section set.`
                      : `Version ${snapshotComparison.snapshotVersionNumber} compared against ${snapshotComparison.againstVersionNumber ? `version ${snapshotComparison.againstVersionNumber}` : 'an empty baseline'}.`
                    : 'Review section-level changes in this snapshot.'}
                </p>
              </div>
              <button type="button" className="button button-ghost" onClick={() => setSnapshotCompareOpen(false)}>
                Close
              </button>
            </div>

            <div style={{ overflow: 'auto', paddingTop: 20, paddingBottom: snapshotPreviewMode === 'restore' ? 0 : 12 }}>
              {snapshotComparison?.changes.length ? (
                <div className="page-stack">
                  <div
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      background: 'rgba(249, 252, 250, 0.94)',
                      backdropFilter: 'blur(10px)',
                      paddingBottom: 12,
                      borderBottom: '1px solid var(--fh-border)',
                    }}
                  >
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                  <div className="record-item">
                    <div className="kpi-label">Added</div>
                    <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900, color: '#0b6b34' }}>
                      {snapshotComparison.changes.filter(change => change.changeType === 'added').length}
                    </div>
                  </div>
                  <div className="record-item">
                    <div className="kpi-label">Updated</div>
                    <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900, color: '#10588c' }}>
                      {snapshotComparison.changes.filter(change => change.changeType === 'updated').length}
                    </div>
                  </div>
                  <div className="record-item">
                    <div className="kpi-label">Removed</div>
                    <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900, color: '#9a3412' }}>
                      {snapshotComparison.changes.filter(change => change.changeType === 'removed').length}
                    </div>
                  </div>
                </div>

                    <div className="actions-row" style={{ marginTop: 12, alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div className="actions-row" style={{ marginTop: 0 }}>
                        {(['added', 'updated', 'removed'] as const).map(group => {
                          const active = visibleChangeTypes[group];
                          const count = snapshotComparison.changes.filter(change => change.changeType === group).length;
                          const accent = group === 'added' ? '#0b6b34' : group === 'removed' ? '#9a3412' : '#10588c';
                          return (
                            <button
                              key={group}
                              type="button"
                              className="button button-ghost"
                              onClick={() => setVisibleChangeTypes(current => ({ ...current, [group]: !current[group] }))}
                              style={{
                                borderColor: active ? `${accent}33` : 'var(--fh-border)',
                                background: active ? `${accent}12` : 'white',
                                color: active ? accent : 'var(--fh-text)',
                              }}
                            >
                              {group.charAt(0).toUpperCase() + group.slice(1)} ({count})
                            </button>
                          );
                        })}
                      </div>

                      <div className="actions-row" style={{ marginTop: 0, alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="button button-ghost"
                          onClick={() => setCompactDiffMode(current => !current)}
                          style={{
                            borderColor: compactDiffMode ? 'rgba(16, 88, 140, 0.22)' : 'var(--fh-border)',
                            background: compactDiffMode ? 'rgba(16, 88, 140, 0.08)' : 'white',
                            color: compactDiffMode ? 'var(--fh-blue)' : 'var(--fh-text)',
                          }}
                        >
                          {compactDiffMode ? 'Compact mode on' : 'Compact mode off'}
                        </button>

                        <button type="button" className="button button-ghost" onClick={handleCopyDiffSummary}>
                          Copy summary
                        </button>

                        <button type="button" className="button button-ghost" onClick={handleExportDiffSummary}>
                          Export .txt
                        </button>

                        <label className="field" style={{ margin: 0, minWidth: 260, flex: '0 1 320px' }}>
                          <span style={{ display: 'none' }}>Search diff</span>
                          <input
                            className="input"
                            value={diffSearch}
                            onChange={event => setDiffSearch(event.target.value)}
                            placeholder="Search headings or diff text"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {(['added', 'updated', 'removed'] as const).map(group => {
                  const search = diffSearch.trim().toLowerCase();
                  const groupChanges = snapshotComparison.changes.filter(change => {
                    if (change.changeType !== group) return false;
                    if (!search) return true;
                    return [change.heading, change.beforeBody || '', change.afterBody || ''].join(' ').toLowerCase().includes(search);
                  });
                  if (!groupChanges.length || !visibleChangeTypes[group]) return null;

                  const accent = group === 'added' ? '#0b6b34' : group === 'removed' ? '#9a3412' : '#10588c';
                  const tint = group === 'added' ? '#eefbf3' : group === 'removed' ? '#fff4ec' : '#eef6ff';
                  const label = group.charAt(0).toUpperCase() + group.slice(1);

                  return (
                    <div key={group} className="page-stack" style={{ gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 999, background: accent }} />
                        <h4 style={{ margin: 0 }}>{label}</h4>
                        <span className="status-pill" style={{ background: tint, color: accent }}>{groupChanges.length}</span>
                      </div>

                      <div className="record-list">
                        {groupChanges.map((change, index) => (
                          <div key={`${group}-${change.heading}-${index}`} className="record-item" style={{ borderLeft: `4px solid ${accent}`, background: tint }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                              <strong>{change.heading}</strong>
                              <span className="status-pill" style={{ background: 'white', color: accent, border: `1px solid ${accent}22` }}>{change.changeType}</span>
                            </div>

                            <div className="record-meta">
                              {change.beforePageNumber ? <span>Before page {change.beforePageNumber}</span> : null}
                              {change.afterPageNumber ? <span>After page {change.afterPageNumber}</span> : null}
                            </div>

                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: compactDiffMode && change.changeType !== 'updated'
                                  ? 'minmax(0, 1fr)'
                                  : 'repeat(2, minmax(0, 1fr))',
                                gap: 16,
                                marginTop: 14,
                              }}
                            >
                              {!(compactDiffMode && change.changeType === 'added') ? (
                                <div style={{ borderRadius: 16, border: '1px solid var(--fh-border)', background: 'white', padding: 16 }}>
                                  <div className="kpi-label">Before</div>
                                  {renderDiffBody(change.beforeBody, `${group}-${index}-before`, change.changeType === 'updated' ? 'before' : undefined, change.afterBody)}
                                </div>
                              ) : null}
                              {!(compactDiffMode && change.changeType === 'removed') ? (
                                <div style={{ borderRadius: 16, border: '1px solid var(--fh-border)', background: 'white', padding: 16 }}>
                                  <div className="kpi-label">After</div>
                                  {renderDiffBody(change.afterBody, `${group}-${index}-after`, change.changeType === 'updated' ? 'after' : undefined, change.beforeBody)}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {!snapshotComparison.changes.some(change => {
                  if (!visibleChangeTypes[change.changeType]) return false;
                  const search = diffSearch.trim().toLowerCase();
                  if (!search) return true;
                  return [change.heading, change.beforeBody || '', change.afterBody || ''].join(' ').toLowerCase().includes(search);
                }) ? (
                  <div className="empty-state">
                    <strong>No visible changes.</strong>
                    <p style={{ marginBottom: 0 }}>
                      {diffSearch.trim()
                        ? 'No diff items match the current search and filter combination.'
                        : 'All change groups are currently hidden. Toggle one or more filters back on to review the diff.'}
                    </p>
                  </div>
                ) : null}
              </div>
              ) : (
                <div className="empty-state">
                  <strong>No section changes found.</strong>
                  <p style={{ marginBottom: 0 }}>This snapshot matches the version before it based on the current diff rules.</p>
                </div>
              )}
            </div>

            {snapshotPreviewMode === 'restore' ? (
              <div
                className="actions-row"
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'sticky',
                  bottom: 0,
                  background: 'rgba(249, 252, 250, 0.96)',
                  backdropFilter: 'blur(10px)',
                  paddingTop: 16,
                  marginTop: 0,
                  borderTop: '1px solid var(--fh-border)',
                }}
              >
                <div style={{ color: 'var(--fh-text-muted)', fontSize: 14 }}>
                  Review the diff above before restoring this snapshot as the current section set.
                </div>
                <div className="actions-row" style={{ marginTop: 0 }}>
                  <button type="button" className="button button-ghost" onClick={() => setSnapshotCompareOpen(false)}>
                    Cancel
                  </button>
                  <button type="button" className="button button-secondary" disabled={!snapshotComparison || restoringSnapshotId === snapshotComparison.snapshotId} onClick={handleRestoreSnapshot}>
                    {snapshotComparison && restoringSnapshotId === snapshotComparison.snapshotId ? 'Restoring…' : 'Confirm restore'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {editModalOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.36)',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            zIndex: 50,
          }}
        >
          <div className="card" style={{ width: 'min(760px, 100%)', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="section-title">
              <div>
                <div className="eyebrow">Knowledge source</div>
                <h3 style={{ marginBottom: 8 }}>Edit source</h3>
                <p style={{ marginBottom: 0 }}>Update source metadata and management settings.</p>
              </div>
              <button type="button" className="button button-ghost" onClick={() => setEditModalOpen(false)}>
                Close
              </button>
            </div>

            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <label className="field">
                <span>Title</span>
                <input className="input" value={editForm.title || ''} onChange={event => setEditForm(current => ({ ...current, title: event.target.value }))} />
              </label>
              <label className="field">
                <span>Source type</span>
                <input className="input" value={editForm.sourceType || ''} onChange={event => setEditForm(current => ({ ...current, sourceType: event.target.value }))} />
              </label>
              <label className="field">
                <span>Access</span>
                <select className="select" value={editForm.accessScope || 'ORGANIZATION_ONLY'} onChange={event => setEditForm(current => ({ ...current, accessScope: event.target.value as KnowledgeDocumentAccessScope }))}>
                  <option value="ORGANIZATION_ONLY">Organization only</option>
                  {!isCountyContext ? <option value="INHERIT_TO_CHILDREN">Inherit to child organizations</option> : null}
                </select>
              </label>
              <label className="field">
                <span>Status</span>
                <select className="select" value={editForm.status || 'DRAFT'} onChange={event => setEditForm(current => ({ ...current, status: event.target.value as KnowledgeDocumentStatus }))}>
                  <option value="DRAFT">Draft</option>
                  <option value="READY">Ready</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </label>
              <label className="field">
                <span>Version label</span>
                <input className="input" value={editForm.versionLabel || ''} onChange={event => setEditForm(current => ({ ...current, versionLabel: event.target.value }))} />
              </label>
              <label className="field">
                <span>Effective date</span>
                <input type="date" className="input" value={editForm.effectiveDate || ''} onChange={event => setEditForm(current => ({ ...current, effectiveDate: event.target.value }))} />
              </label>
              <label className="field">
                <span>File name</span>
                <input className="input" value={editForm.fileName || ''} onChange={event => setEditForm(current => ({ ...current, fileName: event.target.value }))} />
              </label>
              <label className="field">
                <span>File URL</span>
                <input className="input" value={editForm.fileUrl || ''} onChange={event => setEditForm(current => ({ ...current, fileUrl: event.target.value }))} />
              </label>
            </div>

            <label className="field" style={{ marginTop: 18 }}>
              <span>Notes</span>
              <textarea className="textarea" value={editForm.notes || ''} onChange={event => setEditForm(current => ({ ...current, notes: event.target.value }))} />
            </label>

            <div className="actions-row" style={{ justifyContent: 'space-between' }}>
              <button type="button" className="button button-danger" disabled={deletingSource} onClick={handleDeleteSource}>
                {deletingSource ? 'Deleting…' : 'Delete source'}
              </button>
              <div className="actions-row" style={{ marginTop: 0 }}>
                <button type="button" className="button button-ghost" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="button button-secondary" disabled={updatingSource || !editForm.title?.trim() || !editForm.sourceType?.trim()} onClick={handleUpdateSource}>
                  {updatingSource ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {bulkImportOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.36)',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            zIndex: 50,
          }}
        >
          <div className="card" style={{ width: 'min(960px, 100%)', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="section-title">
              <div>
                <div className="eyebrow">Bulk import</div>
                <h3 style={{ marginBottom: 8 }}>Paste text into sections</h3>
                <p style={{ marginBottom: 0 }}>Paste handbook or policy text. FosterHub will split it into section drafts that you can review before replacing the current editor state.</p>
              </div>
              <button
                type="button"
                className="button button-ghost"
                onClick={() => {
                  setBulkImportOpen(false);
                  setBulkImportPreview([]);
                  setBulkImportText('');
                }}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 0.9fr)', gap: 20, alignItems: 'start' }}>
              <div>
                <div className="notice" style={{ marginBottom: 16 }}>
                  <strong>Upload a file or paste text</strong>
                  <p style={{ marginBottom: 0 }}>Supported extraction types right now: PDF, TXT, Markdown, CSV, and JSON.</p>
                </div>
                <label className="field" style={{ marginBottom: 16 }}>
                  <span>Upload file</span>
                  <input
                    type="file"
                    className="input"
                    accept=".pdf,.txt,.md,.markdown,.csv,.json,text/plain,application/pdf,text/markdown,application/json,text/csv"
                    onChange={event => handleFileExtraction(event.target.files?.[0] || null)}
                  />
                </label>
                <label className="field">
                  <span>Raw text</span>
                  <textarea
                    className="textarea"
                    value={bulkImportText}
                    onChange={event => setBulkImportText(event.target.value)}
                    placeholder="Paste policy manual text, handbook text, or copied document sections here"
                    style={{ minHeight: 380 }}
                  />
                </label>
                <div className="actions-row">
                  <button
                    type="button"
                    className="button button-secondary"
                    disabled={importingPreview || bulkImportText.trim().length < 10}
                    onClick={handleBulkImportPreview}
                  >
                    {importingPreview ? 'Parsing…' : 'Parse into sections'}
                  </button>
                  {extractingFile ? <span style={{ color: 'var(--fh-text-muted)', alignSelf: 'center' }}>Extracting file text...</span> : null}
                </div>
              </div>

              <div>
                <div className="section-title" style={{ marginBottom: 12 }}>
                  <div>
                    <h3 style={{ marginBottom: 8 }}>Preview</h3>
                    <p style={{ marginBottom: 0 }}>Review the parsed sections before using them in the editor.</p>
                  </div>
                </div>

                {bulkImportPreview.length ? (
                  <div className="stack" style={{ maxHeight: 520, overflow: 'auto' }}>
                    {bulkImportPreview.map((section, index) => (
                      <div key={`${section.heading}-${index}`} className="record-item">
                        <strong>{section.heading}</strong>
                        <div className="record-meta">
                          {section.sectionKey ? <span>{section.sectionKey}</span> : null}
                          {section.pageNumber ? <span>Page {section.pageNumber}</span> : null}
                          <span>Section {index + 1}</span>
                        </div>
                        <p style={{ marginTop: 12, marginBottom: 0, color: 'var(--fh-text)' }}>{section.body}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <strong>No preview yet.</strong>
                    <p style={{ marginBottom: 0 }}>After you paste text, parse it into section drafts to preview the result here.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="actions-row" style={{ justifyContent: 'space-between' }}>
              <div style={{ color: 'var(--fh-text-muted)', fontSize: 14 }}>
                Using the preview will replace the current unsaved section editor state.
              </div>
              <div className="actions-row" style={{ marginTop: 0 }}>
                <button type="button" className="button button-ghost" onClick={() => setBulkImportPreview([])}>
                  Clear preview
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  disabled={!bulkImportPreview.length}
                  onClick={applyBulkImportPreview}
                >
                  Use parsed sections
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {createModalOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.36)',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            zIndex: 50,
          }}
        >
          <div className="card" style={{ width: 'min(760px, 100%)', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="section-title">
              <div>
                <div className="eyebrow">Knowledge source</div>
                <h3 style={{ marginBottom: 8 }}>Add approved document source</h3>
                <p style={{ marginBottom: 0 }}>Create a source that Ask FosterHub AI can search within the active organization context.</p>
              </div>
              <button type="button" className="button button-ghost" onClick={() => setCreateModalOpen(false)}>
                Close
              </button>
            </div>

            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <label className="field">
                <span>Title</span>
                <input className="input" value={createForm.title || ''} onChange={event => setCreateForm(current => ({ ...current, title: event.target.value }))} />
              </label>
              <label className="field">
                <span>Source type</span>
                <input className="input" value={createForm.sourceType || ''} onChange={event => setCreateForm(current => ({ ...current, sourceType: event.target.value }))} />
              </label>
              <label className="field">
                <span>Access</span>
                <select
                  className="select"
                  value={createForm.accessScope || 'ORGANIZATION_ONLY'}
                  onChange={event => setCreateForm(current => ({ ...current, accessScope: event.target.value as KnowledgeDocumentAccessScope }))}
                >
                  <option value="ORGANIZATION_ONLY">Organization only</option>
                  {!isCountyContext ? <option value="INHERIT_TO_CHILDREN">Inherit to child organizations</option> : null}
                </select>
              </label>
              <label className="field">
                <span>Status</span>
                <select
                  className="select"
                  value={createForm.status || 'DRAFT'}
                  onChange={event => setCreateForm(current => ({ ...current, status: event.target.value as KnowledgeDocumentStatus }))}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="READY">Ready</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </label>
              <label className="field">
                <span>Version label</span>
                <input className="input" value={createForm.versionLabel || ''} onChange={event => setCreateForm(current => ({ ...current, versionLabel: event.target.value }))} />
              </label>
              <label className="field">
                <span>Effective date</span>
                <input type="date" className="input" value={createForm.effectiveDate || ''} onChange={event => setCreateForm(current => ({ ...current, effectiveDate: event.target.value }))} />
              </label>
              <label className="field">
                <span>File name</span>
                <input className="input" value={createForm.fileName || ''} onChange={event => setCreateForm(current => ({ ...current, fileName: event.target.value }))} />
              </label>
              <label className="field">
                <span>File URL</span>
                <input className="input" value={createForm.fileUrl || ''} onChange={event => setCreateForm(current => ({ ...current, fileUrl: event.target.value }))} />
              </label>
            </div>

            <label className="field" style={{ marginTop: 18 }}>
              <span>Notes</span>
              <textarea className="textarea" value={createForm.notes || ''} onChange={event => setCreateForm(current => ({ ...current, notes: event.target.value }))} />
            </label>

            <div className="actions-row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="button button-ghost" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="button button-secondary" disabled={creatingSource || !createForm.title?.trim() || !createForm.sourceType?.trim()} onClick={handleCreateSource}>
                {creatingSource ? 'Creating…' : 'Create source'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
