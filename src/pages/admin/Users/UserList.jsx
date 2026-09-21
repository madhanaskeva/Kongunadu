import React from 'react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';

export const UserList = () => {
  const { T, userTab, setUserTab, setDrawer, setForm, setFormError } = useTMSAdmin();
  const tms = T();

  const users = tms.users || [];
  const permissions = tms.permissions || [];
  const branchOptions = (tms.branches || []).map(b => ({ value: b.id, label: b.name }));

  const userTabs = [
    { value: 'users', label: `Users (${users.length})` },
    { value: 'roles', label: 'Roles & permissions' },
  ];

  const handleInviteUser = () => {
    setDrawer({
      isForm: true,
      kicker: 'Invite user',
      title: 'New portal user',
      saveLabel: 'Send invite',
      required: ['name', 'email'],
      fields: [
        ['name', 'Full name'],
        ['email', 'Email'],
        ['role', 'Role', ['Administrator', 'Owner (read-only)', 'Billing (read-only)']],
        ['branch', 'Branch scope', [{ value: 'all', label: 'All branches' }, ...branchOptions]],
      ],
    });
    setForm({});
    setFormError('');
  };

  const userCols = ['Name', 'Email', 'Role', 'Branch scope', 'Status', 'Last active'];
  const permCols = ['Module', 'Administrator', 'Owner', 'Billing'];

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
            <button
              onClick={handleInviteUser}
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
              Invite user
            </button>
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
                      }}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => {
                  const isActive = u.status === 'Active';
                  return (
                    <tr key={u.id || idx} style={{ borderTop: '1px solid var(--border-default)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                        {u.name}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{u.email}</td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{u.role}</td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{u.branch}</td>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Roles & Permissions Tab View */}
      {userTab === 'roles' && (
        <div style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-default)', fontSize: '14px', color: 'var(--text-body)' }}>
            Only the Administrator can modify master data or edit and delete trip records. Supervisors are scoped to their branch.
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '720px' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'var(--surface-muted)' }}>
                  {permCols.map((c, i) => (
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
                      }}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((p, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid var(--border-default)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-heading)' }}>
                      {p.module}
                    </td>
                    {['admin', 'owner', 'billing'].map((k, ki) => {
                      const v = p[k] || '—';
                      const isNo = v === 'No';
                      return (
                        <td
                          key={ki}
                          style={{
                            padding: '12px 14px',
                            color: isNo ? 'var(--text-muted)' : 'var(--text-heading)',
                            fontWeight: isNo ? 400 : 600,
                          }}
                        >
                          {v}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
