'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginRequest } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('mike@fosterhub.biz');
  const [password, setPassword] = useState('FosterHub!Dev2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await loginRequest(email, password);
      localStorage.setItem('fosterhub.dev.token', result.data.accessToken);
      localStorage.setItem('fosterhub.dev.user', JSON.stringify(result.data.session.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Unable to log in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-shell">
        <div className="logo-panel" style={{ marginBottom: 10 }}>
          <img
            src="/brand/fosterhub-logo.svg"
            alt="FosterHub logo"
            className="logo-image"
          />
        </div>

        <div className="login-heading">
          <h1>Sign in to FosterHub</h1>
          <p>Secure access for agency staff, partners, and approved FosterHub users.</p>
        </div>

        <div className="card sso-card" style={{ padding: 18, marginBottom: 18 }}>
          <h3 style={{ marginBottom: 8 }}>Sign in with Microsoft</h3>
          <p style={{ marginBottom: 16 }}>
            Recommended sign-in path for organizations using Microsoft 365 and Entra ID.
          </p>

          <button type="button" className="button sso-button" disabled>
            <span className="microsoft-mark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            Continue with Microsoft
          </button>

          <p style={{ marginTop: 12, marginBottom: 0, fontSize: 14 }}>
            <strong>Coming soon:</strong> SSO will be connected once the backend identity flow is ready.
          </p>
        </div>

        <div className="login-divider" style={{ marginBottom: 18 }}>
          <span>or use development credentials</span>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="button button-primary">
            {loading ? 'Signing in...' : 'Sign in to workspace'}
          </button>
        </form>

        {error ? (
          <div className="notice notice-error" style={{ marginTop: 16 }}>
            <strong>Login problem</strong>
            <p style={{ marginBottom: 0 }}>{error}</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
