'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', description: 'Overview and workload' },
  { href: '/intake', label: 'Intake', description: 'Incoming children and requests' },
  { href: '/cases', label: 'Cases', description: 'Active case management' },
];

type StoredUser = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

export function AppShell({ title, children }: { title: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('fosterhub.dev.user');
    if (!raw) return;

    try {
      setUser(JSON.parse(raw));
    } catch {
      setUser(null);
    }
  }, []);

  const initials = useMemo(() => {
    const first = user?.firstName?.[0] ?? '';
    const last = user?.lastName?.[0] ?? '';
    const fallback = user?.email?.[0] ?? 'F';
    return `${first}${last}`.trim() || fallback.toUpperCase();
  }, [user]);

  function handleSignOut() {
    localStorage.removeItem('fosterhub.dev.token');
    localStorage.removeItem('fosterhub.dev.user');
    router.push('/login');
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '280px minmax(0, 1fr)',
        minHeight: '100vh',
      }}
    >
      <aside
        style={{
          background: 'linear-gradient(180deg, #0f2d1c 0%, #123e28 100%)',
          color: 'white',
          padding: 24,
          position: 'sticky',
          top: 0,
          height: '100vh',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontWeight: 900, fontSize: 28, letterSpacing: '-0.03em' }}>FosterHub</div>
          <div style={{ opacity: 0.78, marginTop: 8, lineHeight: 1.5 }}>
            Simplifying Foster Care, Empowering Families
          </div>
        </div>

        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
            {navItems.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    style={{
                      display: 'block',
                      padding: '14px 14px',
                      borderRadius: 16,
                      background: active ? 'rgba(255,255,255,0.14)' : 'transparent',
                      border: active ? '1px solid rgba(255,255,255,0.16)' : '1px solid transparent',
                      boxShadow: active ? '0 8px 20px rgba(0,0,0,0.12)' : 'none',
                    }}
                  >
                    <div style={{ fontWeight: active ? 800 : 700 }}>{item.label}</div>
                    <div style={{ fontSize: 13, opacity: 0.78, marginTop: 4 }}>{item.description}</div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div>
        <header
          style={{
            padding: '20px 32px',
            borderBottom: '1px solid #d9e5dd',
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 32, letterSpacing: '-0.03em' }}>{title}</h1>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setMenuOpen(current => !current)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                border: '1px solid #d9e5dd',
                background: 'linear-gradient(135deg, #10588c 0%, #046307 100%)',
                color: 'white',
                fontWeight: 800,
                fontSize: 16,
                boxShadow: '0 8px 18px rgba(16, 88, 140, 0.18)',
              }}
              aria-label="Open profile menu"
            >
              {initials}
            </button>

            {menuOpen ? (
              <div
                style={{
                  position: 'absolute',
                  top: 56,
                  right: 0,
                  width: 220,
                  background: 'white',
                  border: '1px solid #d9e5dd',
                  borderRadius: 18,
                  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
                  padding: 10,
                }}
              >
                <div style={{ padding: '8px 10px 12px', borderBottom: '1px solid #eef3ef', marginBottom: 8 }}>
                  <div style={{ fontWeight: 800, color: '#123122' }}>
                    {user?.firstName || user?.lastName
                      ? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
                      : 'FosterHub User'}
                  </div>
                  {user?.email ? (
                    <div style={{ fontSize: 13, color: '#567060', marginTop: 4 }}>{user.email}</div>
                  ) : null}
                </div>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'transparent',
                    color: '#123122',
                    fontWeight: 700,
                  }}
                >
                  Settings
                </button>
                <button
                  type="button"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'transparent',
                    color: '#123122',
                    fontWeight: 700,
                  }}
                >
                  Profile
                </button>
                <button
                  type="button"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'transparent',
                    color: '#b42318',
                    fontWeight: 700,
                  }}
                  onClick={handleSignOut}
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}
