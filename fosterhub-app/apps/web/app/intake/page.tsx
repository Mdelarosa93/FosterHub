'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '../../components/AppShell';

type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  type: 'Staff' | 'Legal' | 'Vendors' | 'Foster Parents' | 'Biological Parents';
  status: 'Active' | 'Invited' | 'Suspended';
  permissions: string[];
};

const userTypeOptions: UserRecord['type'][] = ['Staff', 'Legal', 'Vendors', 'Foster Parents', 'Biological Parents'];

const initialUsers: UserRecord[] = [
  {
    id: 'u1',
    name: 'Mike De La Rosa Garcia',
    email: 'mike@fosterhub.biz',
    role: 'Admin',
    type: 'Staff',
    status: 'Active',
    permissions: ['Manage users', 'Manage roles', 'View all cases', 'Edit cases'],
  },
  {
    id: 'u2',
    name: 'Taylor Reed',
    email: 'taylor.reed@fosterhub.biz',
    role: 'Case Worker',
    type: 'Staff',
    status: 'Active',
    permissions: ['View assigned cases', 'Edit assigned cases', 'Schedule case events'],
  },
  {
    id: 'u3',
    name: 'Monica Alvarez',
    email: 'monica.alvarez@fosterhub.biz',
    role: 'Supervisor',
    type: 'Staff',
    status: 'Active',
    permissions: ['View team cases', 'Approve requests', 'Manage staff assignments'],
  },
  {
    id: 'u4',
    name: 'Sarah Hall',
    email: 'sarah.hall@example.com',
    role: 'Foster Parent',
    type: 'Foster Parents',
    status: 'Invited',
    permissions: ['View child updates', 'View calendar events'],
  },
  {
    id: 'u5',
    name: 'Attorney Maria Lopez',
    email: 'maria.lopez@example.com',
    role: 'Attorney',
    type: 'Legal',
    status: 'Active',
    permissions: ['View court documents', 'View case milestones'],
  },
  {
    id: 'u6',
    name: 'Sunrise Family Services',
    email: 'intake@sunrisefamilyservices.org',
    role: 'Vendor',
    type: 'Vendors',
    status: 'Active',
    permissions: ['View assigned service requests'],
  },
  {
    id: 'u7',
    name: 'Janelle Hall',
    email: 'janelle.hall@example.com',
    role: 'Biological Parent',
    type: 'Biological Parents',
    status: 'Invited',
    permissions: ['View approved visitation events'],
  },
];

const permissionOptions = [
  'Manage users',
  'Manage roles',
  'View all cases',
  'Edit cases',
  'View assigned cases',
  'Schedule case events',
  'Approve requests',
  'Manage staff assignments',
  'View child updates',
  'View calendar events',
  'View court documents',
  'View case milestones',
  'View assigned service requests',
  'View approved visitation events',
];

export default function IntakePage() {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<UserRecord['type']>('Staff');
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftRole, setDraftRole] = useState('Case Worker');

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter(user => {
      if (user.type !== selectedType) return false;
      if (!normalized) return true;
      return user.name.toLowerCase().includes(normalized) || user.email.toLowerCase().includes(normalized) || user.role.toLowerCase().includes(normalized);
    });
  }, [users, query, selectedType]);

  const activeUser = users.find(user => user.id === activeUserId) || null;

  function handleAddUser() {
    setUsers(current => [
      {
        id: `u-${Date.now()}`,
        name: draftName || 'New User',
        email: draftEmail,
        role: draftRole,
        type: selectedType,
        status: 'Invited',
        permissions: draftRole === 'Admin' ? ['Manage users', 'Manage roles', 'View all cases', 'Edit cases'] : ['View assigned cases'],
      },
      ...current,
    ]);
    setDraftName('');
    setDraftEmail('');
    setDraftRole('Case Worker');
    setAddUserModalOpen(false);
  }

  function togglePermission(permission: string) {
    if (!activeUserId) return;
    setUsers(current => current.map(user => {
      if (user.id !== activeUserId) return user;
      const alreadyHas = user.permissions.includes(permission);
      return {
        ...user,
        permissions: alreadyHas ? user.permissions.filter(item => item !== permission) : [...user.permissions, permission],
      };
    }));
  }

  return (
    <AppShell
      title="User management :"
      headerActions={
        <select className="select" value={selectedType} onChange={e => setSelectedType(e.target.value as UserRecord['type'])} style={{ maxWidth: 260 }}>
          {userTypeOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      }
    >
      <main className="page-stack">
        <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <button type="button" className="button button-primary" onClick={() => setAddUserModalOpen(true)}>
            Add user
          </button>
          <input
            className="input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, email, or role"
            style={{ maxWidth: 360 }}
          />
        </section>

        <section className="grid" style={{ alignItems: 'start' }}>
          <section className="card">
            <div className="section-title">
              <div>
                <div className="eyebrow">{selectedType}</div>
                <h2>{selectedType}</h2>
              </div>
            </div>

            <div className="record-list">
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  type="button"
                  className="record-item clickable-card"
                  onClick={() => setActiveUserId(user.id)}
                  style={{ textAlign: 'left', cursor: 'pointer', width: '100%' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <strong className="clickable-card-title">{user.name}</strong>
                      <div className="record-meta" style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                        <span>{user.email}</span>
                        <span>{user.role}</span>
                      </div>
                    </div>
                    <span className="status-pill">{user.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="card card-muted">
            <div className="section-title">
              <div>
                <div className="eyebrow">Permissions</div>
                <h2>{activeUser ? activeUser.name : 'Select a user'}</h2>
              </div>
            </div>

            {activeUser ? (
              <div className="stack">
                <div>
                  <strong>Role</strong>
                  <p style={{ marginBottom: 0 }}>{activeUser.role}</p>
                </div>
                <div className="record-list">
                  {permissionOptions.map(permission => {
                    const enabled = activeUser.permissions.includes(permission);
                    return (
                      <button
                        key={permission}
                        type="button"
                        className="button button-ghost"
                        style={{ justifyContent: 'space-between', opacity: enabled ? 1 : 0.65 }}
                        onClick={() => togglePermission(permission)}
                      >
                        <span>{permission}</span>
                        <span>{enabled ? 'On' : 'Off'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <strong>No user selected.</strong>
                <p style={{ marginBottom: 0 }}>Choose a user to review or edit permissions.</p>
              </div>
            )}
          </section>
        </section>

        {addUserModalOpen ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.35)',
              display: 'grid',
              placeItems: 'center',
              padding: 24,
              zIndex: 50,
            }}
            onClick={() => setAddUserModalOpen(false)}
          >
            <section
              className="card"
              style={{ width: 'min(100%, 720px)', maxHeight: '88vh', overflow: 'auto', padding: 24 }}
              onClick={event => event.stopPropagation()}
            >
              <div className="section-title">
                <div>
                  <div className="eyebrow">User management</div>
                  <h2 style={{ marginBottom: 0 }}>Add user</h2>
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label>Name</label>
                  <input className="input" value={draftName} onChange={e => setDraftName(e.target.value)} />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input className="input" type="email" value={draftEmail} onChange={e => setDraftEmail(e.target.value)} />
                </div>
                <div className="field">
                  <label>Role</label>
                  <select className="select" value={draftRole} onChange={e => setDraftRole(e.target.value)}>
                    <option>Admin</option>
                    <option>Supervisor</option>
                    <option>Case Worker</option>
                    <option>Foster Parent</option>
                    <option>Attorney</option>
                    <option>Vendor</option>
                    <option>Biological Parent</option>
                  </select>
                </div>
              </div>

              <div className="actions-row" style={{ justifyContent: 'flex-end', marginTop: 22 }}>
                <button type="button" className="button button-ghost" onClick={() => setAddUserModalOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="button button-primary" onClick={handleAddUser}>
                  Send invite
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </AppShell>
  );
}
