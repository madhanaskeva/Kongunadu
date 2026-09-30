import React, { useState } from 'react';
import { Lock, RotateCcw, ShieldCheck } from 'lucide-react';
import { Alert, Badge, Button, Card, Checkbox, Flex, Menu, Table, Tag, Tooltip, Typography } from 'antd';

import {
  ACTIONS,
  ALL_MODULES,
  MODULE_GROUPS,
  MODULE_TOTAL,
  accessCount,
  isAdminRole,
  readAccess,
  roleDefault,
  userAccess,
  writeAccess,
} from '../../../utils/moduleAccess';

export { MODULE_TOTAL, accessCount, userAccess };

const same = (a, b) => ALL_MODULES.every(([k]) => [...(a[k] || [])].sort().join() === [...(b[k] || [])].sort().join());

export const ModuleAccess = ({ users, selectedId, onSelect, showToast }) => {
  const [saved, setSaved] = useState(readAccess);
  const [drafts, setDrafts] = useState({});

  const user = users.find(u => u.id === selectedId) || users[0];
  if (!user) return null;

  const locked = isAdminRole(user.role);
  const savedAccess = userAccess(user, saved);
  const access = drafts[user.id] || savedAccess;
  const dirty = !locked && !same(access, savedAccess);
  const isDirty = u => !!drafts[u.id] && !same(drafts[u.id], userAccess(u, saved));

  const setAccess = next => setDrafts({ ...drafts, [user.id]: next });

  // View is required for any other action; removing View removes the rest
  const toggle = (key, act, on) => {
    const cur = new Set(access[key] || []);
    if (on) {
      cur.add(act);
      if (act !== 'view') cur.add('view');
    } else if (act === 'view') {
      cur.clear();
    } else {
      cur.delete(act);
    }
    setAccess({ ...access, [key]: [...cur] });
  };

  const toggleRow = (key, acts, on) => setAccess({ ...access, [key]: on ? [...acts] : [] });

  const colState = act => {
    const mods = ALL_MODULES.filter(([, , acts]) => acts.includes(act));
    const n = mods.filter(([k]) => (access[k] || []).includes(act)).length;
    return { all: n === mods.length, some: n > 0 && n < mods.length };
  };

  const toggleCol = (act, on) => {
    const next = { ...access };
    ALL_MODULES.forEach(([k, , acts]) => {
      if (!acts.includes(act)) return;
      const cur = new Set(next[k] || []);
      if (on) {
        cur.add(act);
        cur.add('view');
      } else if (act === 'view') {
        cur.clear();
      } else {
        cur.delete(act);
      }
      next[k] = [...cur];
    });
    setAccess(next);
  };

  const save = () => {
    const next = { ...saved, [user.id]: access };
    setSaved(next);
    writeAccess(next);
    const { [user.id]: _, ...rest } = drafts;
    setDrafts(rest);
    showToast('success', 'Access saved', `${user.name} can open ${accessCount(access)} of ${MODULE_TOTAL} modules.`);
  };

  const discard = () => {
    const { [user.id]: _, ...rest } = drafts;
    setDrafts(rest);
  };

  const resetToRole = () => setAccess(roleDefault(user.role));

  // Group headings and module rows share one table; a heading row spans every column.
  const rows = MODULE_GROUPS.flatMap(g => [
    { rowKey: `group:${g.group}`, isGroup: true, group: g.group },
    ...g.items.map(([key, label, acts]) => ({ rowKey: key, key, label, acts })),
  ]);
  const colCount = ACTIONS.length + 2;
  const hideInGroup = r => (r.isGroup ? { colSpan: 0 } : {});

  const columns = [
    {
      title: 'Module',
      key: 'module',
      onCell: r => (r.isGroup ? { colSpan: colCount } : { style: { whiteSpace: 'nowrap' } }),
      render: (_, r) =>
        r.isGroup ? (
          <Typography.Text strong type="success" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {r.group}
          </Typography.Text>
        ) : (
          <Typography.Text strong>{r.label}</Typography.Text>
        ),
    },
    ...ACTIONS.map(([act, actLabel]) => {
      const st = colState(act);
      return {
        title: (
          <Flex vertical align="center" gap={6}>
            {actLabel}
            <Checkbox
              checked={st.all}
              indeterminate={st.some}
              disabled={locked}
              onChange={e => toggleCol(act, e.target.checked)}
              aria-label={`${actLabel} for all modules`}
            />
          </Flex>
        ),
        key: act,
        align: 'center',
        onCell: hideInGroup,
        render: (_, r) => {
          if (r.isGroup) return null;
          const cur = access[r.key] || [];
          return r.acts.includes(act) ? (
            <Checkbox checked={cur.includes(act)} disabled={locked} onChange={e => toggle(r.key, act, e.target.checked)} aria-label={`${actLabel} ${r.label}`} />
          ) : (
            <Typography.Text type="secondary" aria-hidden="true">—</Typography.Text>
          );
        },
      };
    }),
    {
      title: 'Full',
      key: 'full',
      align: 'center',
      onCell: hideInGroup,
      render: (_, r) => {
        if (r.isGroup) return null;
        const cur = access[r.key] || [];
        const full = r.acts.every(a => cur.includes(a));
        const none = cur.length === 0;
        return (
          <Checkbox
            checked={full}
            indeterminate={!full && !none}
            disabled={locked}
            onChange={e => toggleRow(r.key, r.acts, e.target.checked)}
            aria-label={`Full access to ${r.label}`}
          />
        );
      },
    },
  ];

  return (
    <div className="tms-access">
      {/* User picker */}
      <Card title="Select user" size="small" styles={{ body: { padding: 0 } }}>
        <Menu
          mode="inline"
          selectedKeys={[String(user.id)]}
          onClick={({ key }) => onSelect(users.find(u => String(u.id) === key)?.id ?? key)}
          style={{ borderInlineEnd: 'none' }}
          items={users.map(u => {
            const n = accessCount(drafts[u.id] || userAccess(u, saved));
            return {
              key: String(u.id),
              style: { height: 'auto', lineHeight: 1.4, paddingBlock: 10 },
              label: (
                <Flex align="center" gap={10}>
                  <Flex vertical style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text strong ellipsis>{u.name}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }} ellipsis>{u.role}</Typography.Text>
                  </Flex>
                  {isDirty(u) && <Tooltip title="Unsaved changes"><span><Badge status="warning" /></span></Tooltip>}
                  <Tag color="success" style={{ marginInlineEnd: 0 }}>
                    {n}/{MODULE_TOTAL}
                  </Tag>
                </Flex>
              ),
            };
          })}
        />
      </Card>

      {/* Matrix */}
      <Card styles={{ body: { padding: 0 } }} style={{ minWidth: 0 }}>
        <Flex align="center" gap={12} wrap style={{ padding: '14px 18px' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <Typography.Title level={5} style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Module access · {user.name}
            </Typography.Title>
            <Typography.Text type="secondary">
              {user.role} · {user.branch} · {accessCount(access)} of {MODULE_TOTAL} modules
            </Typography.Text>
          </div>
          {!locked && (
            <Flex gap={8} wrap>
              <Tooltip title="Use the default access for this role">
                <Button onClick={resetToRole} icon={<RotateCcw size={14} />}>Role default</Button>
              </Tooltip>
              {dirty && <Button onClick={discard}>Discard</Button>}
              <Button type="primary" onClick={save} disabled={!dirty}>
                Save access
              </Button>
            </Flex>
          )}
        </Flex>

        {locked && (
          <Alert
            type="success"
            banner
            showIcon
            icon={<Lock size={14} />}
            title="Administrators always have full access to every module, so these boxes can't be changed."
          />
        )}

        <Table
          columns={columns}
          dataSource={rows}
          rowKey="rowKey"
          tableLayout="auto"
          scroll={{ x: 640 }}
          pagination={false}
          size="middle"
          onRow={r => (!r.isGroup && (access[r.key] || []).length === 0 ? { style: { opacity: 0.7 } } : {})}
        />

        <Flex align="center" gap={8} style={{ padding: '12px 18px' }}>
          <ShieldCheck size={14} />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Ticking Add, Edit, Delete or Export also gives View. Unticking View removes all access to that module.
          </Typography.Text>
        </Flex>
      </Card>
    </div>
  );
};

export default ModuleAccess;
