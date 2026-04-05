export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001/api/v1';

export type LoginResponse = {
  data: {
    accessToken: string;
    session: {
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        organizationId?: string;
        organizationName?: string;
        organizationType?: string;
        parentOrganizationId?: string | null;
      };
      permissions: string[];
    };
  };
};

export async function loginRequest(email: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.message || 'Login failed');
  }

  return body as LoginResponse;
}

export async function authedGet(path: string, token: string) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.message || `Request failed for ${path}`);
  }

  return body;
}

export async function authedPost(path: string, token: string, payload: Record<string, any>) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.message || `Request failed for ${path}`);
  }

  return body;
}

export async function authedPatch(path: string, token: string, payload: Record<string, any>) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.message || `Request failed for ${path}`);
  }

  return body;
}

export async function authedDelete(path: string, token: string) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.message || `Request failed for ${path}`);
  }

  return body;
}

export async function authedPut(path: string, token: string, payload: Record<string, any>) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.message || `Request failed for ${path}`);
  }

  return body;
}
