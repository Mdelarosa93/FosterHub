export type UserRole = 'admin' | 'manager' | 'worker' | 'resource_parent' | 'vendor' | 'birth_parent' | 'youth';

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface AuthSession {
  user: CurrentUser;
  permissions: string[];
}
