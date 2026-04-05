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
