'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/AppShell';

type UserType = 'Staff' | 'Legal' | 'Vendors' | 'Foster Parents' | 'Biological Parents';

type UserRecord = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  supervisor?: string;
  type: UserType;
  status: 'Active' | 'Invited' | 'Suspended';
  permissions: string[];
};

const userTypeOptions: UserType[] = ['Staff', 'Legal', 'Vendors', 'Foster Parents', 'Biological Parents'];
const staffRoleOptions = ['Admin', 'Case Worker', 'Supervisor'];
const userTypeRoleMap: Record<Exclude<UserType, 'Staff' | 'Legal'>, string> = {
  Vendors: 'Vendor',
  'Foster Parents': 'Foster Parent',
  'Biological Parents': 'Biological Parent',
};
const legalRoleOptions = ['Attorney'];
const supervisorOptions = ['Monica Alvarez', 'Jordan Kim', 'Taylor Reed'];

const initialUsers: UserRecord[] = [
  {
    id: 'u1',
    name: 'Mike De La Rosa Garcia',
    email: 'mike@fosterhub.biz',
    roles: ['Admin'],
    supervisor: 'Monica Alvarez',
    type: 'Staff',
    status: 'Active',
    permissions: ['Manage users', 'Manage roles', 'View all cases', 'Edit cases'],
  },
  {
    id: 'u2',
    name: 'Taylor Reed',
    email: 'taylor.reed@fosterhub.biz',
    roles: ['Case Worker'],
    supervisor: 'Monica Alvarez',
    type: 'Staff',
    status: 'Active',
    permissions: ['View assigned cases', 'Edit assigned cases', 'Schedule case events'],
  },
  {
    id: 'u3',
    name: 'Monica Alvarez',
    email: 'monica.alvarez@fosterhub.biz',
    roles: ['Supervisor'],
    supervisor: '',
    type: 'Staff',
    status: 'Active',
    permissions: ['View team cases', 'Approve requests', 'Manage staff assignments'],
  },
  {
    id: 'u4',
    name: 'Sarah Hall',
    email: 'sarah.hall@example.com',
    roles: ['Foster Parent'],
    type: 'Foster Parents',
    status: 'Invited',
    permissions: ['View child updates', 'View calendar events'],
  },
  {
    id: 'u5',
    name: 'Attorney Maria Lopez',
    email: 'maria.lopez@example.com',
    roles: ['Attorney'],
    type: 'Legal',
    status: 'Active',
    permissions: ['View court documents', 'View case milestones'],
  },
  {
    id: 'u6',
    name: 'Sunrise Family Services',
    email: 'intake@sunrisefamilyservices.org',
    roles: ['Vendor'],
    type: 'Vendors',
    status: 'Active',
    permissions: ['View assigned service requests'],
  },
  {
    id: 'u7',
    name: 'Janelle Hall',
    email: 'janelle.hall@example.com',
    roles: ['Biological Parent'],
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
  const [selectedType, setSelectedType] = useState<UserType>('Staff');
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftRole, setDraftRole] = useState('Case Worker');
  const [draftUser, setDraftUser] = useState<UserRecord | null>(null);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter(user => {
      if (user.type !== selectedType) return false;
      if (!normalized) return true;
      return user.name.toLowerCase().includes(normalized) || user.email.toLowerCase().includes(normalized) || user.roles.join(' ').toLowerCase().includes(normalized);
    });
  }, [users, query, selectedType]);

  const activeUser = users.find(user => user.id === activeUserId) || null;

  useEffect(() => {
    if (!activeUser) {
      setDraftUser(null);
      setEditMode(false);
      return;
    }
    setDraftUser({ ...activeUser });
    setEditMode(false);
  }, [activeUserId]);

  function handleAddUser() {
    setUsers(current => [
      {
        id: `u-${Date.now()}`,
        name: draftName || 'New User',
        email: draftEmail,
        roles:
          selectedType === 'Staff'
            ? [draftRole]
            : selectedType === 'Legal'
              ? ['Attorney']
              : [userTypeRoleMap[selectedType as Exclude<UserType, 'Staff' | 'Legal'>]],
        supervisor: selectedType === 'Staff' ? 'Monica Alvarez' : '',
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
    if (!draftUser) return;
    const alreadyHas = draftUser.permissions.includes(permission);
    setDraftUser({
      ...draftUser,
      permissions: alreadyHas ? draftUser.permissions.filter(item => item !== permission) : [...draftUser.permissions, permission],
    });
  }

  function toggleRole(role: string) {
    if (!draftUser) return;
    const alreadyHas = draftUser.roles.includes(role);
    setDraftUser({
      ...draftUser,
      roles: alreadyHas ? draftUser.roles.filter(item => item !== role) : [...draftUser.roles, role],
    });
  }

  function saveUserChanges() {
    if (!draftUser) return;
    setUsers(current => current.map(user => (user.id === draftUser.id ? draftUser : user)));
    setEditMode(false);
  }

  const leftTitle = selectedType;

  return (
    <AppShell
      title="User management:"
      headerActions={
        <select className="select" value={selectedType} onChange={e => setSelectedType(e.target.value as UserType)} style={{ maxWidth: 260 }}>
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
                <div className="eyebrow">People</div>
                <h2>{leftTitle}</h2>
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
                        <span>{user.roles.join(', ')}</span>
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
                <div className="eyebrow">People</div>
                <h2>{draftUser ? draftUser.name : 'Select a user'}</h2>
              </div>
              {draftUser ? (
                <div className="actions-row" style={{ marginTop: 0 }}>
                  {editMode ? (
                    <button type="button" className="button button-primary" onClick={saveUserChanges}>Save</button>
                  ) : (
                    <button type="button" className="button button-ghost" onClick={() => setEditMode(true)}>Edit</button>
                  )}
                </div>
              ) : null}
            </div>

            {draftUser ? (
              <div className="form-grid">
                <div className="field">
                  <label>Name</label>
                  <input className="input" value={draftUser.name} onChange={e => setDraftUser({ ...draftUser, name: e.target.value })} disabled={!editMode} />
                </div>

                <div className="field">
                  <label>Email</label>
                  <input className="input" value={draftUser.email} onChange={e => setDraftUser({ ...draftUser, email: e.target.value })} disabled={!editMode} />
                </div>

                <div className="field">
                  <label>Role</label>
                  {selectedType === 'Staff' ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {staffRoleOptions.map(role => {
                        const selected = draftUser.roles.includes(role);
                        return (
                          <button
                            key={role}
                            type="button"
                            className="button button-ghost"
                            style={{ minHeight: 36, opacity: selected ? 1 : 0.65 }}
                            onClick={() => editMode && toggleRole(role)}
                            disabled={!editMode}
                          >
                            {role}
                          </button>
                        );
                      })}
                    </div>
                  ) : selectedType === 'Legal' ? (
                    <div className="input">Attorney</div>
                  ) : (
                    <div className="input">{userTypeRoleMap[selectedType as Exclude<UserType, 'Staff' | 'Legal'>]}</div>
                  )}
                </div>

                {selectedType === 'Staff' ? (
                  <div className="field">
                    <label>Supervisor</label>
                    <select
                      className="select"
                      value={draftUser.supervisor || ''}
                      onChange={e => setDraftUser({ ...draftUser, supervisor: e.target.value })}
                      disabled={!editMode}
                    >
                      <option value="">Select supervisor</option>
                      {supervisorOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="field">
                  <label>Permissions</label>
                  <div className="record-list">
                    {permissionOptions.map(permission => {
                      const enabled = draftUser.permissions.includes(permission);
                      return (
                        <button
                          key={permission}
                          type="button"
                          className="button button-ghost"
                          style={{ justifyContent: 'space-between', opacity: enabled ? 1 : 0.65 }}
                          onClick={() => editMode && togglePermission(permission)}
                          disabled={!editMode}
                        >
                          <span>{permission}</span>
                          <span>{enabled ? 'On' : 'Off'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <strong>No user selected.</strong>
                <p style={{ marginBottom: 0 }}>Choose a user to review or edit details and permissions.</p>
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
                    <option>Attorney</option>
                    <option>Vendor</option>
                    <option>Foster Parent</option>
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
