'use client';

export function getActiveOrganizationId() {
  if (typeof window === 'undefined') return 'global';

  const rawUser = localStorage.getItem('fosterhub.dev.user');
  if (!rawUser) return 'global';

  try {
    const parsed = JSON.parse(rawUser);
    return parsed?.organizationId || 'global';
  } catch {
    return 'global';
  }
}

export function getOrgScopedStorageKey(baseKey: string, organizationId?: string) {
  const activeOrganizationId = organizationId || getActiveOrganizationId();
  return `${baseKey}:${activeOrganizationId}`;
}
