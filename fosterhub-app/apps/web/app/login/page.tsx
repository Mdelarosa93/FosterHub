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
      <section className="hero" style={{ maxWidth: 520, margin: '0 auto' }}>
        <span className="badge">Development login</span>
        <h1>Sign in to FosterHub</h1>
        <p>This is a temporary development login flow. We will replace local token storage later with a more secure session approach.</p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          <label>
            <div>Email</div>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ccc' }} />
          </label>

          <label>
            <div>Password</div>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ccc' }} />
          </label>

          <button type="submit" disabled={loading} style={{ background: '#046307', color: 'white', border: 'none', borderRadius: 10, padding: '12px 16px', fontWeight: 700 }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {error ? <p style={{ color: '#b42318', marginTop: 16 }}>{error}</p> : null}
      </section>
    </main>
  );
}
