'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authedGet, authedPost } from '../lib/api';

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
    href: '/organizations',
    label: 'Organizations',
    shortLabel: 'OR',
    description: 'State and county portals',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4.75 19.25V10.75H10.25V19.25" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <path d="M13.75 19.25V4.75H19.25V19.25" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <path d="M8.5 7.75H15.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/messages',
    label: 'Messages',
    shortLabel: 'MS',
    description: 'Team conversations and AI',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 5.5C4 4.67 4.67 4 5.5 4H18.5C19.33 4 20 4.67 20 5.5V14.5C20 15.33 19.33 16 18.5 16H9L4 20V5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
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
    href: '/applications',
    label: 'Applications',
    shortLabel: 'AP',
    description: 'Prospective foster homes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 5.25H17C18.1 5.25 19 6.15 19 7.25V18.25L15.5 16.25L12 18.25L8.5 16.25L5 18.25V7.25C5 6.15 5.9 5.25 7 5.25Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <path d="M8.5 9H15.5M8.5 12H13.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/vendors',
    label: 'Vendors',
    shortLabel: 'VE',
    description: 'Onboarding and invoices',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4.75 7.75H19.25V19.25H4.75V7.75Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <path d="M9 7.75V5.75C9 4.92 9.67 4.25 10.5 4.25H13.5C14.33 4.25 15 4.92 15 5.75V7.75" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/surveys',
    label: 'Surveys',
    shortLabel: 'SU',
    description: 'Satisfaction and outcomes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 6.25H18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        <path d="M6 11.25H14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        <path d="M6 16.25H11" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        <path d="M18.25 15.75L19.75 17.25L22.25 13.75" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
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

const navSections = [
  {
    label: 'Workspace',
    items: ['/dashboard', '/messages', '/calendar'],
  },
  {
    label: 'Operations',
    items: ['/applications', '/cases', '/vendors', '/surveys'],
  },
  {
    label: 'Administration',
    items: ['/organizations', '/intake'],
  },
] as const;

type StoredUser = {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  organizationId?: string;
  organizationName?: string;
  organizationType?: string;
  parentOrganizationId?: string | null;
};

type OrganizationContext = {
  id: string;
  name: string;
  type: 'STATE_AGENCY' | 'COUNTY_AGENCY';
  parentOrganization: { id: string; name: string; type: 'STATE_AGENCY' | 'COUNTY_AGENCY' } | null;
  childOrganizations: Array<{ id: string; name: string; type: 'STATE_AGENCY' | 'COUNTY_AGENCY' }>;
};

type OrganizationTreeItem = {
  id: string;
  name: string;
  type: 'STATE_AGENCY' | 'COUNTY_AGENCY';
  parentOrganizationId?: string | null;
};

function formatOrganizationTypeLabel(type?: 'STATE_AGENCY' | 'COUNTY_AGENCY' | string | null) {
  if (type === 'STATE_AGENCY') return 'State';
  if (type === 'COUNTY_AGENCY') return 'County';
  return 'Organization';
}

type HeaderReminder = {
  id: string;
  reminderType: string;
  message: string;
  createdAt: string;
  organizationName: string;
  recipientName: string;
  applicationId: string;
};

function HeaderIconButton({ label, children, onClick }: { label: string; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
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
  const [organizationContext, setOrganizationContext] = useState<OrganizationContext | null>(null);
  const [organizationOptions, setOrganizationOptions] = useState<Array<{ id: string; name: string; type: 'STATE_AGENCY' | 'COUNTY_AGENCY' }>>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [switchingOrganization, setSwitchingOrganization] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [headerReminders, setHeaderReminders] = useState<HeaderReminder[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dismissingReminderId, setDismissingReminderId] = useState<string | null>(null);
  const [hoveredNavHref, setHoveredNavHref] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('fosterhub.dev.user');
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      setUser(parsed);
      setSelectedOrganizationId(parsed?.organizationId ?? '');
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!token) return;

    async function loadOrganizationSwitcher() {
      try {
        const [contextResult, treeResult] = await Promise.all([
          authedGet('/organizations/context', token),
          authedGet('/organizations/tree', token),
        ]);

        const context = contextResult.data as OrganizationContext | null;
        const tree = treeResult.data as OrganizationTreeItem[];
        setOrganizationContext(context);

        const rootId = context?.type === 'COUNTY_AGENCY'
          ? context.parentOrganization?.id ?? context.id
          : context?.id;

        const root = tree.find(item => item.id === rootId);
        const counties = tree.filter(item => item.parentOrganizationId === rootId);
        const options = [root, ...counties]
          .filter(Boolean)
          .map(item => ({ id: item!.id, name: item!.name, type: item!.type }));
        setOrganizationOptions(options);
        setSelectedOrganizationId(context?.id ?? '');
      } catch {
        setOrganizationContext(null);
        setOrganizationOptions([]);
      }
    }

    loadOrganizationSwitcher();
  }, [user?.organizationId]);

  useEffect(() => {
    const token = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!token) return;

    async function loadNotificationCount() {
      try {
        try {
          await authedPost('/foster-applications/reminders/sync', token, {});
        } catch {
          // ignore if current role cannot trigger reminder sync
        }
        const reminders = await authedGet('/foster-applications/reminders', token);
        setHeaderReminders(reminders.data || []);
        setNotificationCount((reminders.data || []).length);
      } catch {
        setHeaderReminders([]);
        setNotificationCount(0);
      }
    }

    loadNotificationCount();
  }, [user?.organizationId, pathname]);

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

  async function handleOrganizationSwitch(nextOrganizationId: string) {
    if (!nextOrganizationId || nextOrganizationId === user?.organizationId) {
      setSelectedOrganizationId(nextOrganizationId);
      return;
    }

    const token = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!token) return;

    try {
      setSwitchingOrganization(true);
      const result = await authedPost('/auth/switch-organization', token, { organizationId: nextOrganizationId });
      localStorage.setItem('fosterhub.dev.token', result.data.accessToken);
      localStorage.setItem('fosterhub.dev.user', JSON.stringify(result.data.session.user));
      setUser(result.data.session.user);
      setSelectedOrganizationId(result.data.session.user.organizationId ?? nextOrganizationId);
      setMenuOpen(false);
      setNotificationsOpen(false);
      router.refresh();
      router.push(pathname || '/organizations');
    } catch {
      setSelectedOrganizationId(user?.organizationId ?? '');
    } finally {
      setSwitchingOrganization(false);
    }
  }

  async function handleDismissReminder(reminderId: string) {
    const token = localStorage.getItem('fosterhub.dev.token') ?? '';
    if (!token) return;

    try {
      setDismissingReminderId(reminderId);
      await authedPost(`/foster-applications/reminders/${reminderId}/dismiss`, token, {});
      const reminders = await authedGet('/foster-applications/reminders', token);
      setHeaderReminders(reminders.data || []);
      setNotificationCount((reminders.data || []).length);
    } finally {
      setDismissingReminderId(null);
    }
  }

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
          padding: sidebarCollapsed ? 16 : 18,
          position: 'sticky',
          top: 0,
          height: '100vh',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          transition: 'padding 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div
          style={{
            marginBottom: 18,
            position: 'relative',
            minHeight: sidebarCollapsed ? 84 : 132,
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

        <nav style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: sidebarCollapsed ? 0 : 4, paddingBottom: 12 }}>
          <div style={{ display: 'grid', gap: sidebarCollapsed ? 12 : 14 }}>
            {navSections.map(section => (
              <div key={section.label}>
                {!sidebarCollapsed ? (
                  <div
                    style={{
                      padding: '0 10px 8px',
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.52)',
                    }}
                  >
                    {section.label}
                  </div>
                ) : (
                  <div style={{ padding: '4px 10px 6px' }}>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', borderRadius: 999 }} />
                  </div>
                )}

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4 }}>
                  {section.items.map(href => {
                    const item = navItems.find(entry => entry.href === href);
                    if (!item) return null;

                    const active = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                    const hovered = hoveredNavHref === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-label={item.label}
                          title={sidebarCollapsed ? item.label : undefined}
                          onMouseEnter={() => setHoveredNavHref(item.href)}
                          onMouseLeave={() => setHoveredNavHref(current => (current === item.href ? null : current))}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                            gap: sidebarCollapsed ? 0 : 12,
                            minHeight: sidebarCollapsed ? 44 : 46,
                            padding: sidebarCollapsed ? '10px 0' : '10px 12px',
                            borderRadius: 12,
                            background: active
                              ? 'rgba(255,255,255,0.16)'
                              : hovered
                                ? 'rgba(255,255,255,0.07)'
                                : 'transparent',
                            border: active ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
                            boxShadow: active ? '0 8px 20px rgba(0,0,0,0.12)' : 'none',
                            textAlign: sidebarCollapsed ? 'center' : 'left',
                            transition: 'background 0.16s ease, border-color 0.16s ease, transform 0.16s ease',
                            transform: hovered && !active ? 'translateX(1px)' : 'none',
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              width: sidebarCollapsed ? 28 : 24,
                              height: sidebarCollapsed ? 28 : 24,
                              display: 'grid',
                              placeItems: 'center',
                              color: active ? '#ffffff' : hovered ? '#ffffff' : 'rgba(255,255,255,0.84)',
                              flexShrink: 0,
                              margin: sidebarCollapsed ? '0 auto' : 0,
                            }}
                          >
                            {item.icon}
                          </span>
                          {!sidebarCollapsed ? (
                            <span style={{ minWidth: 0, display: 'block' }}>
                              <div style={{ fontWeight: active ? 800 : 700, fontSize: 14, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: active ? '#ffffff' : hovered ? '#ffffff' : 'rgba(255,255,255,0.94)' }}>
                                {item.label}
                              </div>
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
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
            {organizationOptions.length > 0 ? (
              <div
                style={{
                  minWidth: 320,
                  padding: 12,
                  borderRadius: 18,
                  border: '1px solid #d9e5dd',
                  background: switchingOrganization ? 'linear-gradient(135deg, #f4f8f5 0%, #eef6ff 100%)' : 'white',
                  boxShadow: '0 8px 18px rgba(15, 23, 42, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#10588c' }}>
                    Portal context
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      background: switchingOrganization ? '#10588c' : '#eef6ff',
                      color: switchingOrganization ? 'white' : '#10588c',
                    }}
                  >
                    {switchingOrganization ? 'Switching…' : `${formatOrganizationTypeLabel(organizationContext?.type)} active`}
                  </span>
                </div>

                {organizationContext ? (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 800, color: '#123122', lineHeight: 1.2 }}>{organizationContext.name}</div>
                    <div style={{ fontSize: 12, color: '#567060', marginTop: 4 }}>
                      {formatOrganizationTypeLabel(organizationContext.type)} portal
                      {organizationContext.parentOrganization ? ` · Parent: ${organizationContext.parentOrganization.name}` : ''}
                    </div>
                  </div>
                ) : null}

                <select
                  className="select"
                  value={selectedOrganizationId}
                  onChange={e => handleOrganizationSwitch(e.target.value)}
                  disabled={switchingOrganization}
                  style={{ border: 'none', padding: 0, minHeight: 'auto', boxShadow: 'none', background: 'transparent', fontWeight: 700 }}
                >
                  {organizationOptions.map(option => (
                    <option key={option.id} value={option.id}>{`${formatOrganizationTypeLabel(option.type)} · ${option.name}`}</option>
                  ))}
                </select>
              </div>
            ) : null}

            <HeaderIconButton label="View messages" onClick={() => router.push('/messages')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 5.5C4 4.67 4.67 4 5.5 4H18.5C19.33 4 20 4.67 20 5.5V14.5C20 15.33 19.33 16 18.5 16H9L4 20V5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </HeaderIconButton>

            <div style={{ position: 'relative' }}>
              <HeaderIconButton label="View notifications" onClick={() => setNotificationsOpen(current => !current)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 4.5C9.93 4.5 8.25 6.18 8.25 8.25V10.11C8.25 10.67 8.08 11.22 7.77 11.68L6.58 13.46C5.93 14.44 6.63 15.75 7.79 15.75H16.21C17.37 15.75 18.07 14.44 17.42 13.46L16.23 11.68C15.92 11.22 15.75 10.67 15.75 10.11V8.25C15.75 6.18 14.07 4.5 12 4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M10 18C10.37 19.05 11.12 19.5 12 19.5C12.88 19.5 13.63 19.05 14 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </HeaderIconButton>
              {notificationCount > 0 ? (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    minWidth: 22,
                    height: 22,
                    padding: '0 6px',
                    borderRadius: 999,
                    background: '#d96c3c',
                    border: '2px solid white',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 800,
                    display: 'grid',
                    placeItems: 'center',
                    lineHeight: 1,
                  }}
                >
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              ) : null}

              {notificationsOpen ? (
                <div
                  style={{
                    position: 'absolute',
                    top: 56,
                    right: 0,
                    width: 360,
                    maxHeight: 420,
                    overflow: 'auto',
                    background: 'white',
                    border: '1px solid #d9e5dd',
                    borderRadius: 18,
                    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
                    padding: 10,
                    zIndex: 20,
                  }}
                >
                  <div style={{ padding: '8px 10px 12px', borderBottom: '1px solid #eef3ef', marginBottom: 8 }}>
                    <div style={{ fontWeight: 800, color: '#123122' }}>Notifications</div>
                    <div style={{ fontSize: 13, color: '#567060', marginTop: 4 }}>{notificationCount} open reminder{notificationCount === 1 ? '' : 's'}</div>
                  </div>

                  {headerReminders.length ? (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {headerReminders.slice(0, 6).map(reminder => (
                        <div key={reminder.id} className="record-item">
                          <strong>{reminder.message}</strong>
                          <div className="record-meta">
                            <span>{reminder.reminderType}</span>
                            <span>{reminder.organizationName}</span>
                            <span>{reminder.recipientName}</span>
                          </div>
                          <div className="actions-row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
                            <button
                              type="button"
                              className="button button-secondary"
                              onClick={() => {
                                setNotificationsOpen(false);
                                router.push(`/applications?applicationId=${reminder.applicationId}`);
                              }}
                            >
                              Open application
                            </button>
                            <button
                              type="button"
                              className="button button-ghost"
                              onClick={() => handleDismissReminder(reminder.id)}
                              disabled={dismissingReminderId === reminder.id}
                            >
                              {dismissingReminderId === reminder.id ? 'Dismissing…' : 'Dismiss'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <strong>No open notifications.</strong>
                      <p style={{ marginBottom: 0 }}>You’re caught up for now.</p>
                    </div>
                  )}

                  <div className="actions-row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
                    <button type="button" className="button button-ghost" onClick={() => setNotificationsOpen(false)}>Close</button>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => {
                        setNotificationsOpen(false);
                        router.push('/dashboard');
                      }}
                    >
                      Open dashboard feed
                    </button>
                  </div>
                </div>
              ) : null}
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
                    {user?.organizationName ? (
                      <div style={{ fontSize: 13, color: '#567060', marginTop: 4 }}>{user.organizationName}</div>
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
                    onClick={() => {
                      setMenuOpen(false);
                      router.push('/settings/knowledge-base');
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
