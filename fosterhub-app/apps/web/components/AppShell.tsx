'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', description: 'Overview and workload' },
  { href: '/intake', label: 'Intake', description: 'Incoming children and requests' },
  { href: '/cases', label: 'Cases', description: 'Active case management' },
  { href: '/login', label: 'Login', description: 'Development access' },
];

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();

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

        <div
          style={{
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.07)',
            borderRadius: 18,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.72 }}>
            Environment
          </div>
          <div style={{ fontWeight: 800, marginTop: 8 }}>Development workspace</div>
          <div style={{ marginTop: 6, opacity: 0.8, lineHeight: 1.5 }}>
            Refining the MVP before expanding into new modules.
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
            padding: '24px 32px',
            borderBottom: '1px solid #d9e5dd',
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div className="eyebrow">FosterHub operations</div>
          <h1 style={{ margin: 0, fontSize: 32, letterSpacing: '-0.03em' }}>{title}</h1>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}
