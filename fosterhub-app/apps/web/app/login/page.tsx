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
    <main>
      <section className="hero split-hero" style={{ maxWidth: 1080 }}>
        <div>
          <span className="badge">Development login</span>
          <h1 style={{ fontSize: 42, marginTop: 18 }}>Sign in to FosterHub</h1>
          <p style={{ fontSize: 17, maxWidth: 640 }}>
            This is still a temporary development access flow. The current priority is making the
            product experience stronger while keeping security architecture in mind for the real
            production-ready authentication model.
          </p>

          <div className="info-panel" style={{ marginTop: 24 }}>
            <div className="info-list">
              <div>
                <strong>Current state</strong>
                <span>JWT-based backend auth is live and the web app is connected to the real API.</span>
              </div>
              <div>
                <strong>What this unlocks</strong>
                <span>Dashboard, intake, cases, and case detail flows can now be refined against live data.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="section-title">
            <div>
              <div className="eyebrow">Portal access</div>
              <h2 style={{ marginBottom: 8 }}>Enter development credentials</h2>
              <p>Use the current seeded admin credentials to access the worker-side MVP screens.</p>
            </div>
          </div>

          <div className="logo-panel" style={{ marginBottom: 20 }}>
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
          </form>

          {error ? (
            <div className="notice notice-error" style={{ marginTop: 16 }}>
              <strong>Login problem</strong>
              <p style={{ marginBottom: 0 }}>{error}</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
