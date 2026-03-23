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
