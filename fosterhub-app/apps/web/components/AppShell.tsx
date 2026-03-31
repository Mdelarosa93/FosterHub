'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    shortLabel: 'DB',
    description: 'Overview and workload',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4.5 12.5L12 5l7.5 7.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.75 10.75V19.25H17.25V10.75" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/calendar',
    label: 'Calendar',
    shortLabel: 'CL',
    description: 'Appointments and planning',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="5.5" width="16" height="14.5" rx="3" stroke="currentColor" strokeWidth="1.9" />
        <path d="M8 3.75V7.25M16 3.75V7.25M4 9.25H20" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/intake',
    label: 'Users',
    shortLabel: 'US',
    description: 'People and permissions',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 12.25A3.25 3.25 0 1 0 12 5.75A3.25 3.25 0 1 0 12 12.25Z" stroke="currentColor" strokeWidth="1.9" />
        <path d="M5.5 18.75C6.4 16.7 8.45 15.25 12 15.25C15.55 15.25 17.6 16.7 18.5 18.75" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/cases',
    label: 'Cases',
    shortLabel: 'CA',
    description: 'Active case management',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 5.25H17C18.1 5.25 19 6.15 19 7.25V18.25L15.5 16.25L12 18.25L8.5 16.25L5 18.25V7.25C5 6.15 5.9 5.25 7 5.25Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <path d="M8.5 9H15.5M8.5 12H13.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    ),
  },
];

type StoredUser = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

function HeaderIconButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      style={{
        width: 46,
        height: 46,
        borderRadius: 14,
        border: '1px solid #d9e5dd',
        background: 'white',
        color: '#123122',
        display: 'grid',
        placeItems: 'center',
        boxShadow: '0 8px 18px rgba(15, 23, 42, 0.05)',
      }}
    >
      {children}
    </button>
  );
}

export function AppShell({ title, headerActions, children, forceSidebarCollapsed = false }: { title: ReactNode; headerActions?: ReactNode; children: ReactNode; forceSidebarCollapsed?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  useEffect(() => {
    if (forceSidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  }, [forceSidebarCollapsed]);

  function handleSignOut() {
    localStorage.removeItem('fosterhub.dev.token');
    localStorage.removeItem('fosterhub.dev.user');
    router.push('/login');
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${sidebarCollapsed ? 92 : 280}px minmax(0, 1fr)`,
        minHeight: '100vh',
        transition: 'grid-template-columns 0.2s ease',
      }}
    >
      <aside
        style={{
          background: 'linear-gradient(180deg, #0f2d1c 0%, #123e28 100%)',
          color: 'white',
          padding: sidebarCollapsed ? 16 : 24,
          position: 'sticky',
          top: 0,
          height: '100vh',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          transition: 'padding 0.2s ease',
        }}
      >
        <div
          style={{
            marginBottom: 28,
            position: 'relative',
            minHeight: sidebarCollapsed ? 88 : 170,
            display: 'grid',
            placeItems: 'center',
            paddingTop: sidebarCollapsed ? 22 : 0,
          }}
        >
          <div style={{ display: 'grid', placeItems: 'center', width: '100%' }}>
            {sidebarCollapsed ? (
              <img
                src="/brand/fosterhub-bug.svg"
                alt="FosterHub logo"
                style={{ width: 48, height: 48, display: 'block', marginTop: 18 }}
              />
            ) : (
              <img
                src="/brand/fosterhub-sidebar-logo.svg"
                alt="FosterHub logo"
                style={{ width: 178, height: 'auto', display: 'block', margin: '0 auto' }}
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => setSidebarCollapsed(current => !current)}
            aria-label={sidebarCollapsed ? 'Expand navigation menu' : 'Collapse navigation menu'}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              fontWeight: 800,
              flexShrink: 0,
              position: 'absolute',
              top: 0,
              right: 0,
            }}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>
        </div>

        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
            {navItems.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    title={sidebarCollapsed ? item.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                      gap: sidebarCollapsed ? 0 : 12,
                      minHeight: 64,
                      padding: sidebarCollapsed ? '14px 10px' : '14px 14px',
                      borderRadius: 16,
                      background: active ? 'rgba(255,255,255,0.14)' : 'transparent',
                      border: active ? '1px solid rgba(255,255,255,0.16)' : '1px solid transparent',
                      boxShadow: active ? '0 8px 20px rgba(0,0,0,0.12)' : 'none',
                      textAlign: sidebarCollapsed ? 'center' : 'left',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 24,
                        height: 24,
                        display: 'grid',
                        placeItems: 'center',
                        color: active ? '#ffffff' : 'rgba(255,255,255,0.92)',
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </span>
                    {!sidebarCollapsed ? (
                      <span style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: active ? 800 : 700 }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 13, opacity: 0.78, marginTop: 4 }}>{item.description}</div>
                      </span>
                    ) : null}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 0, flex: 1 }}>
            <div style={{ margin: 0, fontSize: 32, letterSpacing: '-0.03em', flexShrink: 0, fontWeight: 800 }}>{title}</div>
            {headerActions ? <div style={{ minWidth: 0, flex: 1 }}>{headerActions}</div> : null}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <HeaderIconButton label="View messages">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 5.5C4 4.67 4.67 4 5.5 4H18.5C19.33 4 20 4.67 20 5.5V14.5C20 15.33 19.33 16 18.5 16H9L4 20V5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </HeaderIconButton>

            <div style={{ position: 'relative' }}>
              <HeaderIconButton label="View notifications">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 4.5C9.93 4.5 8.25 6.18 8.25 8.25V10.11C8.25 10.67 8.08 11.22 7.77 11.68L6.58 13.46C5.93 14.44 6.63 15.75 7.79 15.75H16.21C17.37 15.75 18.07 14.44 17.42 13.46L16.23 11.68C15.92 11.22 15.75 10.67 15.75 10.11V8.25C15.75 6.18 14.07 4.5 12 4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M10 18C10.37 19.05 11.12 19.5 12 19.5C12.88 19.5 13.63 19.05 14 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </HeaderIconButton>
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 9,
                  right: 10,
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: '#d96c3c',
                  border: '2px solid white',
                }}
              />
            </div>

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
          </div>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}
