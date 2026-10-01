import React, { useMemo, useState } from 'react';
import { Button, Card, Empty, Flex, Input, Select, Space, Table, Tooltip, Typography } from 'antd';
import { Eye, Plus, Search } from 'lucide-react';
import { matchesSearch } from '../../../utils/search';
import { PRIORITIES, formatDateTime, recipientNames } from '../../../utils/notificationUtils';
import { PriorityTag } from './NotificationTags';
import { NotificationDetailsModal } from './NotificationDetailsModal';
import { SendNotificationModal } from './SendNotificationModal';
import { ResendNotificationModal } from './ResendNotificationModal';
import { SelectionTitle, ShareButton } from './SelectionControls';

// Notifications the admin has sent to supervisors: send new ones, view details and resend history,
// and tick any number of them to share / resend with one Share button.
export const ManualNotifications = ({ notifications, supervisors, canSend, onSend, onResend }) => {
  const [q, setQ] = useState('');
  const [priority, setPriority] = useState('');
  const [sendOpen, setSendOpen] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [resendId, setResendId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);

  const rows = useMemo(() => notifications.filter(n =>
    (!priority || n.priority === priority) &&
    matchesSearch(q, n.title, n.message, n.createdBy, recipientNames(n.recipients))
  ), [notifications, q, priority]);

  const viewing = notifications.find(n => n.id === viewId) || null;
  const resending = notifications.find(n => n.id === resendId) || null;
  const selected = notifications.filter(n => selectedIds.includes(n.id));
  const rank = { urgent: 0, important: 1, normal: 2 };
  const topPriority = selected.reduce((best, n) => (rank[n.priority] < rank[best] ? n.priority : best), 'normal');
  const filtered = q || priority;

  const columns = [
    {
      title: 'Notification', dataIndex: 'title', width: 320,
      render: (v, n) => (
        <Flex vertical gap={2} style={{ minWidth: 0 }}>
          <Typography.Text strong>{v}</Typography.Text>
          <Typography.Paragraph type="secondary" ellipsis={{ rows: 2, tooltip: n.message }} style={{ margin: 0, fontSize: 13 }}>{n.message}</Typography.Paragraph>
        </Flex>
      ),
    },
    { title: 'Sent by', dataIndex: 'createdBy' },
    {
      title: 'Sent to', key: 'to',
      render: (_, n) => {
        const names = recipientNames(n.recipients);
        const count = (n.recipients || []).length;
        return (
          <Tooltip title={names}>
            <Flex vertical>
              <span>{count} {count === 1 ? 'supervisor' : 'supervisors'}</span>
              <Typography.Text type="secondary" ellipsis style={{ fontSize: 12, maxWidth: 200 }}>{names}</Typography.Text>
            </Flex>
          </Tooltip>
        );
      },
    },
    {
      title: 'Sent', dataIndex: 'createdAt', sorter: (a, b) => a.createdAt.localeCompare(b.createdAt), defaultSortOrder: 'descend',
      render: (v, n) => (
        <Flex vertical>
          <span style={{ whiteSpace: 'nowrap' }}>{formatDateTime(v)}</span>
          {(n.resendHistory || []).length > 0 && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Resent {n.resendHistory.length}×</Typography.Text>
          )}
        </Flex>
      ),
    },
    { title: 'Priority', dataIndex: 'priority', render: v => <PriorityTag value={v} /> },
    {
      title: 'View', key: 'act', fixed: 'right', width: 76, align: 'center',
      render: (_, n) => (
        <Tooltip title="View details">
          <Button className="tms-row-action" type="text" icon={<Eye size={17} />} onClick={() => setViewId(n.id)} aria-label={`View ${n.title}`} />
        </Tooltip>
      ),
    },
  ];

  return (
    <Card
      styles={{ body: { padding: 0 } }}
      title={
        <SelectionTitle count={rows.length} noun="sent notification" selected={selected.length} onClear={() => setSelectedIds([])} />
      }
      extra={canSend && (
        <Space size={8} wrap>
          <ShareButton label="Share / Resend" count={selected.length} onClick={() => setBulkOpen(true)} />
          <Button icon={<Plus size={16} />} onClick={() => setSendOpen(true)}>Send Notification</Button>
        </Space>
      )}
    >
      <Flex gap={10} wrap className="ntf-filters">
        <Input prefix={<Search size={16} />} placeholder="Search title, message, supervisor" value={q} onChange={e => setQ(e.target.value)} allowClear className="ntf-search" />
        <Select value={priority} onChange={setPriority} options={[{ value: '', label: 'All priorities' }, ...PRIORITIES]} popupMatchSelectWidth={false} />
        {filtered && <Button type="link" onClick={() => { setQ(''); setPriority(''); }}>Clear filters</Button>}
      </Flex>

      <Table
        rowKey="id"
        rowSelection={canSend ? {
          selectedRowKeys: selectedIds,
          onChange: keys => setSelectedIds(keys),
          preserveSelectedRowKeys: true,
          fixed: true,
          columnWidth: 48,
        } : undefined}
        columns={columns}
        dataSource={rows}
        tableLayout="auto"
        scroll={{ x: 960 }}
        locale={{
          emptyText: (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={filtered ? 'No notifications match these filters' : 'No notifications sent yet'}>
              {!filtered && canSend && <Button type="primary" onClick={() => setSendOpen(true)}>Send the first notification</Button>}
            </Empty>
          ),
        }}
        pagination={{ showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (total, [from, to]) => `Showing ${from} to ${to} of ${total} notifications` }}
      />

      <SendNotificationModal open={sendOpen} onClose={() => setSendOpen(false)} onSend={onSend} supervisors={supervisors} />
      <NotificationDetailsModal
        notification={viewing}
        onClose={() => setViewId(null)}
        onResend={canSend ? n => { setViewId(null); setResendId(n.id); } : null}
      />
      <ResendNotificationModal notification={resending} onClose={() => setResendId(null)} onResend={(id, recipients) => onResend([id], recipients)} supervisors={supervisors} />
      {/* Share / resend every ticked notification to the same supervisors. */}
      <ResendNotificationModal
        notification={bulkOpen && selected.length ? {
          id: '__bulk',
          title: `${selected.length} ${selected.length === 1 ? 'notification' : 'notifications'} selected`,
          message: 'Each one is resent as its own reminder and added to its resend history.',
          priority: topPriority,
        } : null}
        heading="Share / resend selected"
        submitLabel={`Resend ${selected.length} ${selected.length === 1 ? 'Notification' : 'Notifications'}`}
        summary={(
          <ul className="ntf-bulk-list">
            {selected.map(n => (
              <li key={n.id}>
                <PriorityTag value={n.priority} />
                <span className="ntf-bulk-text"><strong>{n.title}</strong></span>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{formatDateTime(n.createdAt)}</Typography.Text>
              </li>
            ))}
          </ul>
        )}
        markIds={[]}
        onClose={() => setBulkOpen(false)}
        onResend={(_, recipients) => { onResend(selected.map(n => n.id), recipients); setSelectedIds([]); }}
        supervisors={supervisors}
      />
    </Card>
  );
};

export default ManualNotifications;
