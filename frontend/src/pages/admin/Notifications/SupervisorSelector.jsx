import React, { useState } from 'react';
import { Checkbox, Empty, Flex, Input, Tag, Typography } from 'antd';
import { Search } from 'lucide-react';
import { matchesSearch } from '../../../utils/search';

/**
 * SupervisorSelector — tick one, several or all supervisors.
 * Shared by the Send and the Share / Resend modals.
 *
 * supervisors: [{ id, name, branchName, disabled }]
 * value: selected supervisor ids
 * markIds: ids to label (e.g. the original recipients) — informational only
 */
export const SupervisorSelector = ({ supervisors = [], value = [], onChange, error, markIds = [], markLabel = 'Already sent' }) => {
  const [q, setQ] = useState('');
  const selectable = supervisors.filter(s => !s.disabled);
  const shown = supervisors.filter(s => matchesSearch(q, s.name, s.branchName));
  const allOn = selectable.length > 0 && selectable.every(s => value.includes(s.id));
  const someOn = value.length > 0 && !allOn;

  const toggle = (id, on) => onChange(on ? [...value, id] : value.filter(v => v !== id));
  const toggleAll = on => onChange(on ? selectable.map(s => s.id) : []);

  return (
    <Flex vertical gap={8}>
      <Flex justify="space-between" align="center" gap={12} wrap>
        <Checkbox checked={allOn} indeterminate={someOn} onChange={e => toggleAll(e.target.checked)} disabled={!selectable.length}>
          <Typography.Text strong>Select all</Typography.Text>
        </Checkbox>
        <Typography.Text type={error ? 'danger' : 'secondary'} style={{ fontSize: 13 }}>
          Selected: <Typography.Text strong type={error ? 'danger' : undefined}>{value.length}</Typography.Text> {value.length === 1 ? 'Supervisor' : 'Supervisors'}
        </Typography.Text>
      </Flex>

      {supervisors.length > 5 && (
        <Input className="tms-search" style={{ width: '100%' }} prefix={<Search size={16} />} placeholder="Search supervisors or branch" value={q} onChange={e => setQ(e.target.value)} allowClear />
      )}

      <div className="ntf-sup-list" style={{ borderColor: error ? 'var(--ant-color-error, #ff4d4f)' : undefined }}>
        {shown.map(s => (
          <label key={s.id} className={`ntf-sup-row${s.disabled ? ' is-disabled' : ''}`}>
            <Checkbox checked={value.includes(s.id)} disabled={s.disabled} onChange={e => toggle(s.id, e.target.checked)} />
            <Flex vertical style={{ minWidth: 0, flex: 1 }}>
              <Typography.Text strong ellipsis>{s.name}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }} ellipsis>{s.branchName || '—'}</Typography.Text>
            </Flex>
            {s.disabled && <Tag>Suspended</Tag>}
            {!s.disabled && markIds.includes(s.id) && <Tag color="blue">{markLabel}</Tag>}
          </label>
        ))}
        {!shown.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No supervisors found" style={{ margin: '16px 0' }} />}
      </div>
      {error && <Typography.Text type="danger" style={{ fontSize: 13 }}>{error}</Typography.Text>}
    </Flex>
  );
};

export default SupervisorSelector;
