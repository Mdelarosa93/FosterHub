'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/intake', label: 'Intake' },
  { href: '/cases', label: 'Cases' },
  { href: '/login', label: 'Login' },
];

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh' }}>
      <aside style={{ background: '#0f2d1c', color: 'white', padding: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 8 }}>FosterHub</div>
        <div style={{ opacity: 0.8, marginBottom: 24 }}>Simplifying Foster Care, Empowering Families</div>

        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
            {navItems.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    style={{
                      display: 'block',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: active ? 'rgba(255,255,255,0.14)' : 'transparent',
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div>
        <header style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', background: 'white' }}>
          <h1 style={{ margin: 0, fontSize: 28 }}>{title}</h1>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}
