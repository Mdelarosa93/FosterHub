import type { UserRole } from '@fosterhub/types';
export { getRolePermissions, hasPermission, permissionKeys, rolePermissionMap } from './permissions';
export type { PermissionKey } from './permissions';

export const roleLabels: Record<UserRole, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  worker: 'Worker',
  resource_parent: 'Resource Parent',
  vendor: 'Vendor',
  birth_parent: 'Birth Parent',
  youth: 'Youth',
};
