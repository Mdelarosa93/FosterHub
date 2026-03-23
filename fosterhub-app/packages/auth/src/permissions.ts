import type { UserRole } from '@fosterhub/types';

export const permissionKeys = [
  'users.view',
  'users.manage',
  'roles.view',
  'roles.manage',
  'permissions.view',
  'cases.view.assigned',
  'cases.view.team',
  'cases.view.all',
  'cases.edit',
  'children.view',
  'children.edit',
  'intake.create',
  'intake.assign',
  'placements.manage',
  'requests.submit',
  'requests.review',
  'requests.approve',
  'messages.send',
  'messages.read',
  'vendors.view',
  'vendors.review',
  'vendors.approve',
  'reports.view',
  'audit.view',
] as const;

export type PermissionKey = (typeof permissionKeys)[number];

export const rolePermissionMap: Record<UserRole, PermissionKey[]> = {
  admin: [...permissionKeys],
  manager: [
    'roles.view',
    'permissions.view',
    'cases.view.team',
    'cases.view.all',
    'cases.edit',
    'children.view',
    'children.edit',
    'intake.create',
    'intake.assign',
    'placements.manage',
    'requests.review',
    'requests.approve',
    'messages.send',
    'messages.read',
    'vendors.view',
    'vendors.review',
    'reports.view',
    'audit.view',
  ],
  worker: [
    'cases.view.assigned',
    'cases.edit',
    'children.view',
    'children.edit',
    'intake.create',
    'requests.submit',
    'requests.review',
    'messages.send',
    'messages.read',
    'vendors.view',
  ],
  resource_parent: [
    'children.view',
    'requests.submit',
    'messages.send',
    'messages.read',
    'vendors.view',
  ],
  vendor: [
    'messages.read',
    'messages.send',
    'vendors.view',
  ],
  birth_parent: [
    'messages.read',
    'messages.send',
    'children.view',
  ],
  youth: [
    'messages.read',
    'messages.send',
    'requests.submit',
  ],
};

export function getRolePermissions(role: UserRole): PermissionKey[] {
  return rolePermissionMap[role] ?? [];
}

export function hasPermission(role: UserRole, permission: PermissionKey): boolean {
  return getRolePermissions(role).includes(permission);
}
