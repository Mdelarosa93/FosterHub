'use client';

export type OrganizationNode = {
  id: string;
  name: string;
  type: 'State Agency' | 'County Agency';
  code: string;
  parentId?: string;
  adminName: string;
  counties?: number;
  totalCases: number;
  totalUsers: number;
  openRequests: number;
  satisfactionScore: number;
  travelApprovalsPending: number;
  fosterParentApplications: number;
  approvedVendors: number;
};

export type FosterApplicationRecord = {
  id: string;
  countyId: string;
  householdName: string;
  stage: 'Submitted' | 'Missing Documents' | 'Training Required' | 'Home Study' | 'Ready for Approval' | 'Approved';
  assignedTo: string;
  checklistProgress: number;
  classesScheduled: boolean;
  documentsMissing: string[];
  submittedAt: string;
};

export type SurveyCampaignRecord = {
  id: string;
  name: string;
  audience: string;
  cadence: string;
  countyScope: string;
  countyId?: string | 'all';
  status: 'Draft' | 'Scheduled' | 'Live';
  baseline: boolean;
  responseRate: number;
  averageScore: number;
};

export type VendorRecord = {
  id: string;
  countyId: string;
  name: string;
  category: string;
  city: string;
  status: 'Recommended' | 'Invited' | 'Under Review' | 'Approved';
  referredBy: string;
  documents: string[];
  invoiceCount: number;
  paymentStatus: 'None' | 'Submitted' | 'In Review' | 'Approved' | 'Paid';
};

export const organizationSeed: OrganizationNode[] = [
  {
    id: 'al-dhr',
    name: 'Alabama Department of Human Resources',
    type: 'State Agency',
    code: 'AL-DHR',
    adminName: 'State Super Admin',
    counties: 2,
    totalCases: 352,
    totalUsers: 118,
    openRequests: 29,
    satisfactionScore: 61,
    travelApprovalsPending: 7,
    fosterParentApplications: 26,
    approvedVendors: 31,
  },
  {
    id: 'mobile-dhr',
    name: 'Mobile County DHR',
    type: 'County Agency',
    code: 'MOB-DHR',
    parentId: 'al-dhr',
    adminName: 'Monica Alvarez',
    totalCases: 187,
    totalUsers: 52,
    openRequests: 14,
    satisfactionScore: 58,
    travelApprovalsPending: 4,
    fosterParentApplications: 12,
    approvedVendors: 14,
  },
  {
    id: 'baldwin-dhr',
    name: 'Baldwin County DHR',
    type: 'County Agency',
    code: 'BAL-DHR',
    parentId: 'al-dhr',
    adminName: 'Taylor Reed',
    totalCases: 165,
    totalUsers: 66,
    openRequests: 15,
    satisfactionScore: 65,
    travelApprovalsPending: 3,
    fosterParentApplications: 14,
    approvedVendors: 17,
  },
];

export const fosterApplicationSeed: FosterApplicationRecord[] = [
  {
    id: 'app-1001',
    countyId: 'mobile-dhr',
    householdName: 'Bryant Family',
    stage: 'Missing Documents',
    assignedTo: 'Keisha Thomas',
    checklistProgress: 68,
    classesScheduled: true,
    documentsMissing: ['W-9 equivalent tax form', 'Medical clearance'],
    submittedAt: '2026-04-01',
  },
  {
    id: 'app-1002',
    countyId: 'mobile-dhr',
    householdName: 'Nelson Household',
    stage: 'Training Required',
    assignedTo: 'Alyssa Hart',
    checklistProgress: 54,
    classesScheduled: false,
    documentsMissing: ['Reference letter'],
    submittedAt: '2026-03-28',
  },
  {
    id: 'app-1003',
    countyId: 'baldwin-dhr',
    householdName: 'Carter Family',
    stage: 'Ready for Approval',
    assignedTo: 'Jordan Kim',
    checklistProgress: 96,
    classesScheduled: true,
    documentsMissing: [],
    submittedAt: '2026-03-26',
  },
  {
    id: 'app-1004',
    countyId: 'baldwin-dhr',
    householdName: 'Simmons Family',
    stage: 'Approved',
    assignedTo: 'Jordan Kim',
    checklistProgress: 100,
    classesScheduled: true,
    documentsMissing: [],
    submittedAt: '2026-03-20',
  },
];

export const surveySeed: SurveyCampaignRecord[] = [
  {
    id: 'survey-1',
    name: 'New License Baseline Survey',
    audience: 'New foster homes',
    cadence: 'At licensure',
    countyScope: 'All counties',
    countyId: 'all',
    status: 'Live',
    baseline: true,
    responseRate: 74,
    averageScore: 41,
  },
  {
    id: 'survey-2',
    name: '90 Day FosterHub Follow-up',
    audience: 'Licensed foster homes',
    cadence: '90 days post launch',
    countyScope: 'Pilot counties',
    countyId: 'all',
    status: 'Scheduled',
    baseline: false,
    responseRate: 0,
    averageScore: 0,
  },
  {
    id: 'survey-3',
    name: 'Quarterly Foster Parent Pulse',
    audience: 'Active homes',
    cadence: 'Quarterly',
    countyScope: 'County managed',
    countyId: 'mobile-dhr',
    status: 'Draft',
    baseline: false,
    responseRate: 0,
    averageScore: 0,
  },
];

export const vendorSeed: VendorRecord[] = [
  {
    id: 'vendor-1',
    countyId: 'mobile-dhr',
    name: 'Sunrise Family Services',
    category: 'Counseling',
    city: 'Mobile',
    status: 'Approved',
    referredBy: 'Sarah Hall',
    documents: ['W-9', 'Insurance certificate'],
    invoiceCount: 4,
    paymentStatus: 'In Review',
  },
  {
    id: 'vendor-2',
    countyId: 'mobile-dhr',
    name: 'Harbor Respite Center',
    category: 'Respite Care',
    city: 'Mobile',
    status: 'Under Review',
    referredBy: 'County staff',
    documents: ['W-9'],
    invoiceCount: 0,
    paymentStatus: 'None',
  },
  {
    id: 'vendor-3',
    countyId: 'baldwin-dhr',
    name: 'Baldwin Therapy Group',
    category: 'Therapy',
    city: 'Fairhope',
    status: 'Approved',
    referredBy: 'Jasmine Cole',
    documents: ['W-9', 'Business license'],
    invoiceCount: 3,
    paymentStatus: 'Paid',
  },
  {
    id: 'vendor-4',
    countyId: 'baldwin-dhr',
    name: 'Coastal Family Transport',
    category: 'Transportation',
    city: 'Daphne',
    status: 'Invited',
    referredBy: 'Mike De La Rosa Garcia',
    documents: [],
    invoiceCount: 0,
    paymentStatus: 'None',
  },
];

function loadOrSeed<T>(key: string, seed: T): T {
  if (typeof window === 'undefined') return seed;

  const existing = localStorage.getItem(key);
  if (!existing) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }

  try {
    return JSON.parse(existing) as T;
  } catch {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
}

export function loadOrganizations() {
  return loadOrSeed('fosterhub.organizations', organizationSeed);
}

export function loadApplications() {
  return loadOrSeed('fosterhub.fosterApplications', fosterApplicationSeed);
}

export function loadSurveys() {
  return loadOrSeed('fosterhub.surveys', surveySeed);
}

export function loadVendors() {
  return loadOrSeed('fosterhub.vendors', vendorSeed);
}

export function getStoredSessionUser() {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem('fosterhub.dev.user');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as {
      id?: string;
      organizationId?: string;
      organizationType?: 'state_agency' | 'county_agency';
      parentOrganizationId?: string | null;
      organizationName?: string;
    };
  } catch {
    return null;
  }
}

export function getScopedCountyIds(organizations: OrganizationNode[]) {
  const sessionUser = getStoredSessionUser();
  const currentOrgId = sessionUser?.organizationId;
  const currentOrgType = sessionUser?.organizationType;
  const parentOrgId = sessionUser?.parentOrganizationId;

  if (!currentOrgId) {
    return organizations.filter(item => item.type === 'County Agency').map(item => item.id);
  }

  if (currentOrgType === 'state_agency') {
    return organizations.filter(item => item.parentId === currentOrgId).map(item => item.id);
  }

  if (currentOrgType === 'county_agency') {
    return [currentOrgId];
  }

  if (parentOrgId) {
    return organizations.filter(item => item.parentId === parentOrgId).map(item => item.id);
  }

  return organizations.filter(item => item.type === 'County Agency').map(item => item.id);
}
