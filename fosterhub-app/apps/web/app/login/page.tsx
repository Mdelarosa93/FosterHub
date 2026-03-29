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
        <div className="logo-panel" style={{ marginBottom: 22 }}>
          <img
            src="/brand/fosterhub-logo.svg"
            alt="FosterHub logo"
            className="logo-image"
          />
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

          <button type="button" className="button sso-button" disabled>
            <span className="microsoft-mark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            Continue with Microsoft
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
