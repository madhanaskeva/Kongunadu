import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, Pencil, Trash2 } from 'lucide-react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { Button, Card, Flex, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { TabButtons } from '../../../components/common/TabButtons';
import { ModuleAccess, MODULE_TOTAL, accessCount, userAccess } from './ModuleAccess';

export const UserList = () => {
  const { T, userTab, setUserTab, setDrawer, setForm, setFormError, setConfirm, showToast, setDeleted } = useTMSAdmin();
  const tms = T();
  const { can } = useModuleAccess();

  const users = tms.users || [];
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

  const nowrap = { whiteSpace: 'nowrap' };
  const userColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name', onCell: () => ({ style: nowrap }), render: v => <Typography.Text strong>{v}</Typography.Text> },
    { title: 'Email', dataIndex: 'email', key: 'email', onCell: () => ({ style: nowrap }), render: v => <Typography.Text type="secondary">{v}</Typography.Text> },
    {
      title: 'Password',
      key: 'password',
      onCell: () => ({ style: nowrap }),
      render: (_, u) =>
        u.password ? (
          <Space size={8}>
            <span style={{ fontFamily: shownPw[u.id] ? 'var(--font-mono)' : 'inherit', letterSpacing: shownPw[u.id] ? 0 : '0.15em', color: 'var(--text-heading)' }}>
              {shownPw[u.id] ? u.password : '••••••••'}
            </span>
            <Button
              type="text"
              size="small"
              onClick={() => setShownPw({ ...shownPw, [u.id]: !shownPw[u.id] })}
              aria-label={shownPw[u.id] ? `Hide password for ${u.name}` : `Show password for ${u.name}`}
              icon={shownPw[u.id] ? <EyeOff size={16} /> : <Eye size={16} />}
            />
          </Space>
        ) : (
          <Typography.Text type="secondary">Not set</Typography.Text>
        ),
    },
    { title: 'Role', dataIndex: 'role', key: 'role', onCell: () => ({ style: nowrap }) },
    { title: 'Branch scope', dataIndex: 'branch', key: 'branch', onCell: () => ({ style: nowrap }) },
    {
      title: 'Module access',
      key: 'access',
      onCell: () => ({ style: nowrap }),
      render: (_, u) => (
        <Button type="link" size="small" style={{ padding: 0, fontWeight: 700 }} onClick={() => manageAccess(u)}>
          {accessCount(userAccess(u))} of {MODULE_TOTAL} modules
        </Button>
      ),
    },
    // Anything other than Active reads as a warning here (as it did before).
    { title: 'Status', dataIndex: 'status', key: 'status', render: v => <Tag color={v === 'Active' ? 'success' : 'warning'}>{v}</Tag> },
    { title: 'Last active', dataIndex: 'last', key: 'last', onCell: () => ({ style: nowrap }), render: v => <Typography.Text type="secondary">{v}</Typography.Text> },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, u) => (
        <Space size={8} onClick={e => e.stopPropagation()}>
          <Tooltip title="Manage module access">
            <Button type="text" size="small" className="tms-row-action tms-row-action--accent" icon={<KeyRound size={16} strokeWidth={2} />} aria-label="Manage module access" onClick={() => manageAccess(u)} />
          </Tooltip>
          {can('users', 'edit') && (
            <Tooltip title={`Edit ${u.name}`}>
              <Button type="text" size="small" className="tms-row-action" icon={<Pencil size={16} strokeWidth={2} />} aria-label={`Edit ${u.name}`} onClick={() => handleEditUser(u)} />
            </Tooltip>
          )}
          {can('users', 'delete') && (
            <Tooltip title={`Remove ${u.name}`}>
              <Button type="text" size="small" className="tms-row-action" danger icon={<Trash2 size={16} strokeWidth={2} />} aria-label={`Remove ${u.name}`} onClick={() => handleDeleteUser(u)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Flex vertical gap={20}>
      <Card styles={{ body: { padding: '12px 16px' } }}>
        <TabButtons ariaLabel="Users view" value={userTab} onChange={setUserTab} items={userTabs} />
      </Card>

      {userTab === 'users' && (
        <Card
          title={
            <Typography.Text type="secondary" style={{ fontWeight: 400 }}>
              <Typography.Text strong>{users.length}</Typography.Text> users
            </Typography.Text>
          }
          extra={
            can('users', 'add') && (
              <Button type="primary" onClick={handleAddUser}>
                Add user
              </Button>
            )
          }
          styles={{ body: { padding: 0 } }}
        >
          <Table
            columns={userColumns}
            dataSource={users}
            rowKey="id"
            tableLayout="auto"
            scroll={{ x: 720 }}
            pagination={{
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (total, [from, to]) => `Showing ${from} to ${to} of ${total} users`,
            }}
          />
        </Card>
      )}

      {userTab === 'roles' && (
        <ModuleAccess users={users} selectedId={accessUserId} onSelect={setAccessUserId} showToast={showToast} />
      )}
    </Flex>
  );
};

export default UserList;
