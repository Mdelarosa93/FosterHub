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
              <h2 style={{ marginBottom: 8 }}>Sign in to your workspace</h2>
              <p>Use single sign-on for production-style access, or development credentials while the identity layer is still being built.</p>
            </div>
          </div>

          <div className="logo-panel" style={{ marginBottom: 10 }}>
            <img
              src="/brand/fosterhub-logo.svg"
              alt="FosterHub logo"
              className="logo-image"
            />
          </div>

          <div className="card sso-card" style={{ padding: 18, marginBottom: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Organization sign-in</div>
            <h3 style={{ marginBottom: 8 }}>Sign in with Microsoft</h3>
            <p style={{ marginBottom: 16 }}>
              Recommended long-term path for agency and enterprise users. This will map cleanly to
              Microsoft 365, Entra ID, MFA, and future conditional access policies.
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
              <strong>Coming soon:</strong> SSO UI is in place now so we can plug in Entra ID when the backend auth flow is ready.
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
        </div>
      </section>
    </main>
  );
}
