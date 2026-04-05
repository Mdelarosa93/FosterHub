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

export interface BillingPortalPlanModuleRecord {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  category: 'CORE' | 'ADD_ON';
}

export interface BillingPortalPlanRecord {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  billingInterval: 'MONTHLY' | 'ANNUAL' | 'CUSTOM';
  basePriceCents: number;
  perSeatPriceCents: number;
  countyIncludedCount: number;
  additionalCountyPriceCents: number;
  active: boolean;
  includedModules: BillingPortalPlanModuleRecord[];
  optionalModules: BillingPortalPlanModuleRecord[];
}

export interface BillingPortalPaymentMethodRecord {
  brand?: string | null;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  billingName?: string | null;
  billingEmail?: string | null;
}

export interface BillingPortalInvoiceRecord {
  id: string;
  invoiceNumber: string;
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE';
  issuedAt: string;
  dueAt?: string | null;
  paidAt?: string | null;
  totalCents: number;
  currency: string;
}

export interface BillingPortalCountyAllocationRecord {
  id: string;
  countyOrganizationId: string;
  countyOrganizationName: string;
  status: 'ACTIVE' | 'PENDING' | 'REMOVED';
  seatLimit?: number | null;
  seatInUse: number;
  startsAt: string;
  endsAt?: string | null;
}

export interface BillingAuditEventRecord {
  id: string;
  eventType: 'CONTACT_UPDATED' | 'PAYMENT_METHOD_UPDATED' | 'PLAN_CHANGED' | 'COUNTY_ALLOCATION_UPDATED' | 'MODULE_UPDATED';
  summary: string;
  snapshotPlanName?: string | null;
  snapshotStatus?: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'SUSPENDED' | null;
  snapshotTotalCents?: number | null;
  actorName?: string | null;
  metadataJson?: {
    reviewSummary?: string;
    usageSnapshot?: {
      seatCountPurchased?: number;
      countyCountCovered?: number;
    };
    deltas?: {
      basePriceDeltaCents?: number;
      countyCoverageDelta?: number;
      seatPriceDeltaCents?: number;
      currentEstimatedRecurringCents?: number;
      targetEstimatedRecurringCents?: number;
      estimatedRecurringDeltaCents?: number;
      addedModules?: string[];
      retainedModules?: string[];
      removedModules?: string[];
    };
    countyOrganizationId?: string;
    countyOrganizationName?: string;
    status?: 'ACTIVE' | 'PENDING' | 'REMOVED';
    seatLimit?: number;
    notes?: string;
    previousStatus?: 'ACTIVE' | 'PENDING' | 'REMOVED';
    newStatus?: 'ACTIVE' | 'PENDING' | 'REMOVED';
    previousSeatLimit?: number | null;
    newSeatLimit?: number | null;
    previousNotes?: string | null;
    newNotes?: string | null;
    previousBillingContactName?: string | null;
    newBillingContactName?: string | null;
    previousBillingContactEmail?: string | null;
    newBillingContactEmail?: string | null;
    previousBillingContactPhone?: string | null;
    newBillingContactPhone?: string | null;
    previousPaymentBrand?: string | null;
    newPaymentBrand?: string | null;
    previousPaymentLast4?: string | null;
    newPaymentLast4?: string | null;
    previousPaymentExpMonth?: number | null;
    newPaymentExpMonth?: number | null;
    previousPaymentExpYear?: number | null;
    newPaymentExpYear?: number | null;
    previousBillingName?: string | null;
    newBillingName?: string | null;
    previousBillingEmail?: string | null;
    newBillingEmail?: string | null;
    billingModuleId?: string;
    billingModuleName?: string;
    billingModuleCode?: string;
    previousEnabled?: boolean;
    newEnabled?: boolean;
  } | null;
  createdAt: string;
}

export interface BillingPortalResponse {
  scope: 'state' | 'county';
  organizationName: string;
  managedByOrganizationName?: string | null;
  subscription: {
    id: string;
    status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'SUSPENDED';
    renewalDate?: string | null;
    seatCountPurchased: number;
    seatCountInUse: number;
    countyCountCovered: number;
    billingContactName?: string | null;
    billingContactEmail?: string | null;
    billingContactPhone?: string | null;
    currency: string;
    subtotalCents: number;
    discountCents: number;
    taxCents: number;
    totalCents: number;
    notes?: string | null;
    plan: BillingPortalPlanRecord;
    enabledModules: Array<{ id: string; name: string; description?: string | null; category: 'CORE' | 'ADD_ON'; enabled: boolean }>;
    paymentMethod?: BillingPortalPaymentMethodRecord | null;
  };
  plans: BillingPortalPlanRecord[];
  invoices: BillingPortalInvoiceRecord[];
  countyAllocations: BillingPortalCountyAllocationRecord[];
  auditEvents: BillingAuditEventRecord[];
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
