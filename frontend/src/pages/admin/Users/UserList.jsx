import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { Pagination, usePagination } from '../../../components/common/Pagination';
import { RowActions } from '../../../components/common/RowActions';
import { ModuleAccess, MODULE_TOTAL, accessCount, userAccess } from './ModuleAccess';

export const UserList = () => {
  const { T, userTab, setUserTab, setDrawer, setForm, setFormError, setConfirm, showToast, setDeleted } = useTMSAdmin();
  const tms = T();
  const { can } = useModuleAccess();

  const users = tms.users || [];
  const usersPg = usePagination(users);
  const branchOptions = (tms.branches || []).map(b => ({ value: b.id, label: b.name }));

  const userTabs = [
    { value: 'users', label: `Users (${users.length})` },
    { value: 'roles', label: 'Module access' },
  ];

  const [shownPw, setShownPw] = useState({});

  const userFields = [
    ['name', 'Full name'],
    ['email', 'Email', null, 'name@transport.example'],
    ['password', 'Password', null, 'At least 8 characters', { type: 'password', hint: 'The user signs in with this email and password.' }],
    ['role', 'Role', ['Administrator', 'Verification Team', 'Owner (read-only)', 'Billing (read-only)']],
    ['branch', 'Branch scope', [{ value: 'all', label: 'All branches' }, ...branchOptions]],
  ];

  const validateUser = (f, selfId) => {
    const email = String(f.email || '').trim().toLowerCase();
    return {
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? 'Enter a valid email address.'
        : users.some(x => x.id !== selfId && String(x.email || '').toLowerCase() === email)
        ? 'A user with this email already exists.'
        : undefined,
      password: String(f.password || '').length < 8 ? 'Use at least 8 characters.' : undefined,
    };
  };

  const handleAddUser = () => {
    setDrawer({
      isForm: true,
      isMaster: true,
      masterKey: 'users',
      kicker: 'Add user',
      title: 'New portal user',
      saveLabel: 'Create user',
      required: ['name', 'email', 'password'],
      fields: userFields,
      validate: f => validateUser(f, null),
    });
    setForm({ role: 'Administrator', branch: 'all' });
    setFormError('');
  };

  const handleEditUser = (u) => {
    setDrawer({
      isForm: true,
      isMaster: true,
      masterKey: 'users',
      kicker: 'Edit user',
      title: u.name,
      saveLabel: 'Save changes',
      required: ['name', 'email', 'password'],
      fields: userFields,
      validate: f => validateUser(f, u.id),
    });
    const scope = (tms.branches || []).find(b => b.name === u.branch || b.id === u.branch);
    setForm({ id: u.id, name: u.name, email: u.email, password: u.password || '', role: u.role, branch: scope ? scope.id : 'all' });
    setFormError('');
  };

  const handleDeleteUser = (u) => {
    setConfirm({
      title: 'Remove ' + u.name + '?',
      body: `This user (${u.email}) will no longer be able to log in to the portal.`,
      okLabel: 'Remove user',
      danger: true,
      onOk: () => {
        setDeleted(prev => [...prev, u.id]);
        showToast('danger', 'User removed', u.name + ' has been removed.');
      },
    });
  };

  const [accessUserId, setAccessUserId] = useState(users[0] ? users[0].id : null);
  const manageAccess = u => {
    setAccessUserId(u.id);
    setUserTab('roles');
  };

  const userCols = ['Name', 'Email', 'Password', 'Role', 'Branch scope', 'Module access', 'Status', 'Last active', 'Actions'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Tabs */}
      <div style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '0 18px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {userTabs.map(t => (
            <button
              key={t.value}
              onClick={() => setUserTab(t.value)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '12px 16px',
                fontFamily: 'var(--font-display)',
                fontSize: '14px',
                fontWeight: 700,
                color: userTab === t.value ? 'var(--color-brand)' : 'var(--text-muted)',
                borderBottom: `3px solid ${userTab === t.value ? 'var(--color-brand)' : 'transparent'}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Tab View */}
      {userTab === 'users' && (
        <div style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '12px 18px', borderBottom: '1px solid var(--border-default)' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-heading)' }}>{users.length}</strong> users
            </span>
            {can('users', 'add') && (
              <button
                onClick={handleAddUser}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  padding: '0 14px',
                  height: '32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-brand)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                Add user
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '720px' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'var(--surface-muted)' }}>
                  {userCols.map((c, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '10px 14px',
                        fontFamily: 'var(--font-display)',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        textAlign: c === 'Actions' ? 'center' : 'left',
                      }}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usersPg.rows.map((u, idx) => {
                  const isActive = u.status === 'Active';
                  return (
                    <tr key={u.id || idx} style={{ borderTop: '1px solid var(--border-default)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                        {u.name}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{u.email}</td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        {u.password ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: shownPw[u.id] ? 'var(--font-mono)' : 'inherit', letterSpacing: shownPw[u.id] ? 0 : '0.15em', color: 'var(--text-heading)' }}>
                              {shownPw[u.id] ? u.password : '••••••••'}
                            </span>
                            <button
                              onClick={() => setShownPw({ ...shownPw, [u.id]: !shownPw[u.id] })}
                              aria-label={shownPw[u.id] ? `Hide password for ${u.name}` : `Show password for ${u.name}`}
                              style={{ all: 'unset', cursor: 'pointer', display: 'grid', color: 'var(--text-muted)' }}
                            >
                              {shownPw[u.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Not set</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{u.role}</td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{u.branch}</td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => manageAccess(u)}
                          style={{ all: 'unset', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--text-brand)' }}
                        >
                          {accessCount(userAccess(u))} of {MODULE_TOTAL} modules
                        </button>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            fontFamily: 'var(--font-display)',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: isActive ? 'var(--color-brand-soft)' : 'var(--color-hazard-soft)',
                            color: isActive ? 'var(--kr-green-800)' : '#7A4300',
                          }}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {u.last}
                      </td>
                      <td style={{ padding: '8px 14px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                        <RowActions
                          actions={[{ key: 'access', icon: KeyRound, label: 'Manage module access', onClick: () => manageAccess(u) }]}
                          onEdit={can('users', 'edit') ? () => handleEditUser(u) : undefined}
                          onDelete={can('users', 'delete') ? () => handleDeleteUser(u) : undefined}
                          editLabel={`Edit ${u.name}`}
                          deleteLabel={`Remove ${u.name}`}
                          buttonAriaLabel={`Actions for ${u.name}`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination {...usersPg} noun="users" />
        </div>
      )}

      {/* Module Access Tab View */}
      {userTab === 'roles' && (
        <ModuleAccess users={users} selectedId={accessUserId} onSelect={setAccessUserId} showToast={showToast} />
      )}
    </div>
  );
};

export default UserList;
