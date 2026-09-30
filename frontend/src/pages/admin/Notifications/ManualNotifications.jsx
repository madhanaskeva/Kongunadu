import React, { useMemo, useState } from 'react';
import { Button, Card, Empty, Flex, Input, Select, Space, Table, Tooltip, Typography } from 'antd';
import { Eye, Plus, Search, Send } from 'lucide-react';
import { matchesSearch } from '../../../utils/search';
import { PRIORITIES, formatDateTime, recipientNames } from '../../../utils/notificationUtils';
import { PriorityTag } from './NotificationTags';
import { NotificationDetailsModal } from './NotificationDetailsModal';
import { SendNotificationModal } from './SendNotificationModal';
import { ResendNotificationModal } from './ResendNotificationModal';

// Notifications the admin has sent to supervisors: send new ones, view details and resend history, share / resend.
export const ManualNotifications = ({ notifications, supervisors, canSend, onSend, onResend }) => {
  const [q, setQ] = useState('');
  const [priority, setPriority] = useState('');
  const [sendOpen, setSendOpen] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [resendId, setResendId] = useState(null);

  const rows = useMemo(() => notifications.filter(n =>
    (!priority || n.priority === priority) &&
    matchesSearch(q, n.title, n.message, n.createdBy, recipientNames(n.recipients))
  ), [notifications, q, priority]);

  const viewing = notifications.find(n => n.id === viewId) || null;
  const resending = notifications.find(n => n.id === resendId) || null;
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
      title: 'Actions', key: 'act', fixed: 'right', width: 110, align: 'center',
      render: (_, n) => (
        <Space size={2}>
          <Tooltip title="View details">
            <Button className="tms-row-action" type="text" icon={<Eye size={17} />} onClick={() => setViewId(n.id)} aria-label={`View ${n.title}`} />
          </Tooltip>
          {canSend && (
            <Tooltip title="Share / Resend">
              <Button className="tms-row-action" type="text" icon={<Send size={16} />} onClick={() => setResendId(n.id)} aria-label={`Resend ${n.title}`} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      styles={{ body: { padding: 0 } }}
      title={
        <Typography.Text type="secondary" style={{ fontWeight: 400 }}>
          <Typography.Text strong>{rows.length}</Typography.Text> sent {rows.length === 1 ? 'notification' : 'notifications'}
        </Typography.Text>
      }
      extra={canSend && (
        <Button type="primary" icon={<Plus size={16} />} onClick={() => setSendOpen(true)}>Send Notification</Button>
      )}
    >
      <Flex gap={10} wrap className="ntf-filters">
        <Input prefix={<Search size={16} />} placeholder="Search title, message, supervisor" value={q} onChange={e => setQ(e.target.value)} allowClear className="ntf-search" />
        <Select value={priority} onChange={setPriority} options={[{ value: '', label: 'All priorities' }, ...PRIORITIES]} popupMatchSelectWidth={false} />
        {filtered && <Button type="link" onClick={() => { setQ(''); setPriority(''); }}>Clear filters</Button>}
      </Flex>

      <Table
        rowKey="id"
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
      <ResendNotificationModal notification={resending} onClose={() => setResendId(null)} onResend={onResend} supervisors={supervisors} />
    </Card>
  );
};

export default ManualNotifications;
