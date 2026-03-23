import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from '@fosterhub/auth';

export const REQUIRED_PERMISSIONS = 'required_permissions';
export const RequirePermissions = (...permissions: PermissionKey[]) => SetMetadata(REQUIRED_PERMISSIONS, permissions);
