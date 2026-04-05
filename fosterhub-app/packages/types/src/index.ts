export type UserRole =
  | 'admin'
  | 'manager'
  | 'worker'
  | 'resource_parent'
  | 'vendor'
  | 'birth_parent'
  | 'youth'
  | 'state_super_admin'
  | 'county_admin'
  | 'licensing_worker';

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
  organizationType?: 'state_agency' | 'county_agency';
  parentOrganizationId?: string | null;
}

export interface AuthSession {
  user: CurrentUser;
  permissions: string[];
}

export type AskFosterHubAiStatus = 'answer' | 'partial' | 'no-results';

export interface AskFosterHubAiCitation {
  document: string;
  section: string;
  page: string;
  excerpt: string;
}

export interface AskFosterHubAiRequest {
  question: string;
  conversationId?: string;
}

export interface AskFosterHubAiResponse {
  conversationId: string;
  title: string;
  subtitle: string;
  question: string;
  answer: string;
  status: AskFosterHubAiStatus;
  scopeLabel: string;
  organizationLabel?: string;
  citations: AskFosterHubAiCitation[];
}

export type KnowledgeDocumentAccessScope = 'ORGANIZATION_ONLY' | 'INHERIT_TO_CHILDREN';
export type KnowledgeDocumentStatus = 'DRAFT' | 'READY' | 'ARCHIVED';

export interface KnowledgeDocumentSourceSummary {
  id: string;
  title: string;
  sourceType: string;
  accessScope: KnowledgeDocumentAccessScope;
  status: KnowledgeDocumentStatus;
  versionLabel?: string | null;
  effectiveDate?: string | null;
  fileName?: string | null;
  fileContentType?: string | null;
  fileSizeBytes?: number | null;
  lastExtractedAt?: string | null;
  fileUrl?: string | null;
  notes?: string | null;
  organizationId: string;
  organizationName: string;
  organizationType: 'STATE_AGENCY' | 'COUNTY_AGENCY';
  sectionCount: number;
  canManage: boolean;
  inheritedFromOrganizationName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocumentSectionRecord {
  id: string;
  knowledgeDocumentSourceId: string;
  heading: string;
  sectionKey?: string | null;
  pageNumber?: number | null;
  sortOrder: number;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocumentAuditEventRecord {
  id: string;
  knowledgeDocumentSourceId?: string | null;
  eventType: string;
  summary: string;
  snapshotTitle: string;
  snapshotVersionLabel?: string | null;
  snapshotStatus?: KnowledgeDocumentStatus | null;
  snapshotSectionCount?: number | null;
  actorName?: string | null;
  createdAt: string;
}

export interface KnowledgeDocumentSectionSnapshotRecord {
  id: string;
  versionNumber: number;
  sectionCount: number;
  addedCount: number;
  removedCount: number;
  updatedCount: number;
  changedHeadings: string[];
  createdAt: string;
}

export interface KnowledgeDocumentSectionDiffRecord {
  heading: string;
  changeType: 'added' | 'removed' | 'updated';
  beforeBody?: string | null;
  afterBody?: string | null;
  beforePageNumber?: number | null;
  afterPageNumber?: number | null;
}

export interface KnowledgeDocumentSectionSnapshotCompareResponse {
  snapshotId: string;
  snapshotVersionNumber: number;
  againstVersionNumber?: number | null;
  changes: KnowledgeDocumentSectionDiffRecord[];
}

export interface CreateKnowledgeDocumentSourceRequest {
  title: string;
  sourceType: string;
  accessScope?: KnowledgeDocumentAccessScope;
  status?: KnowledgeDocumentStatus;
  versionLabel?: string;
  effectiveDate?: string;
  fileName?: string;
  fileUrl?: string;
  notes?: string;
}

export interface UpdateKnowledgeDocumentSourceRequest {
  title?: string;
  sourceType?: string;
  accessScope?: KnowledgeDocumentAccessScope;
  status?: KnowledgeDocumentStatus;
  versionLabel?: string;
  effectiveDate?: string;
  fileName?: string;
  fileUrl?: string;
  notes?: string;
}

export interface ReplaceKnowledgeDocumentSectionsRequest {
  sections: Array<{
    heading: string;
    sectionKey?: string;
    pageNumber?: number;
    sortOrder?: number;
    body: string;
  }>;
}

export interface BulkImportKnowledgeDocumentSectionsRequest {
  rawText: string;
}

export interface KnowledgeDocumentSectionDraft {
  heading: string;
  sectionKey?: string;
  pageNumber?: number;
  sortOrder: number;
  body: string;
}

export interface KnowledgeDocumentExtractionPreview {
  fileName: string;
  extractedText: string;
  sections: KnowledgeDocumentSectionDraft[];
}
