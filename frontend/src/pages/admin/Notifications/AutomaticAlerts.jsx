import React, { useMemo, useState } from 'react';
import { Button, Card, Empty, Flex, Input, Select, Space, Table, Tooltip, Typography } from 'antd';
import { CheckCheck, Eye, Search, Send } from 'lucide-react';
import { matchesSearch } from '../../../utils/search';
import { ALERT_SOURCES, ALERT_TYPES, SEVERITIES, alertTitle, formatDateTime, recipientNames, severityPriority } from '../../../utils/notificationUtils';
import { SeverityTag, StatusBadge } from './NotificationTags';
import { AlertDetailsModal } from './NotificationDetailsModal';
import { ResendNotificationModal } from './ResendNotificationModal';

// Alerts raised by GPS, backend logic and operational rules. They can be viewed, and shared / resent to supervisors.
export const AutomaticAlerts = ({ alerts, onSetStatus, supervisors, canSend, onShare }) => {
  const [q, setQ] = useState('');
  const [source, setSource] = useState('');
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [viewKey, setViewKey] = useState(null);
  const [shareKey, setShareKey] = useState(null);

  const rows = useMemo(() => alerts.filter(a =>
    (!source || a.source === source) &&
    (!type || a.alertType === type) &&
    (!severity || a.severity === severity) &&
    (!status || a.status === status) &&
    matchesSearch(q, a.id, a.vehicleNo, a.tripId, a.message, ALERT_TYPES[a.alertType])
  ), [alerts, q, source, type, severity, status]);

  const unreadShown = rows.filter(a => a.status === 'unread');
  const viewing = alerts.find(a => a.key === viewKey) || null;
  const sharing = alerts.find(a => a.key === shareKey) || null;
  const openShare = a => { setViewKey(null); setShareKey(a.key); };
  const filtered = q || source || type || severity || status;

  const open = a => {
    setViewKey(a.key);
    if (a.status === 'unread') onSetStatus([a.key], 'read');
  };

  const columns = [
    { title: 'Alert ID', dataIndex: 'id', render: v => <Typography.Text type="secondary" style={{ whiteSpace: 'nowrap' }}>{v}</Typography.Text> },
    {
      title: 'Alert type / Source', dataIndex: 'alertType',
      render: (v, a) => (
        <Flex vertical>
          <Typography.Text strong style={{ whiteSpace: 'nowrap' }}>{ALERT_TYPES[v]}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{a.source}</Typography.Text>
        </Flex>
      ),
    },
    { title: 'Vehicle', dataIndex: 'vehicleNo', render: v => <span style={{ whiteSpace: 'nowrap' }}>{v}</span> },
    { title: 'Trip ID', dataIndex: 'tripId', render: v => v || <Typography.Text type="secondary">—</Typography.Text> },
    { title: 'Message', dataIndex: 'message', onCell: () => ({ style: { minWidth: 240 } }), render: v => <Typography.Paragraph ellipsis={{ rows: 2, tooltip: v }} style={{ margin: 0 }}>{v}</Typography.Paragraph> },
    { title: 'Severity', dataIndex: 'severity', render: v => <SeverityTag value={v} />, sorter: (a, b) => SEVERITIES.findIndex(s => s.value === b.severity) - SEVERITIES.findIndex(s => s.value === a.severity) },
    { title: 'Generated', dataIndex: 'createdAt', render: v => {
        const [date, time] = formatDateTime(v).split(', ');
        return <Flex vertical style={{ whiteSpace: 'nowrap' }}><span>{date}</span><Typography.Text type="secondary" style={{ fontSize: 12 }}>{time}</Typography.Text></Flex>;
      }, sorter: (a, b) => a.createdAt.localeCompare(b.createdAt), defaultSortOrder: 'descend' },
    { title: 'Status', dataIndex: 'status', render: v => <span style={{ whiteSpace: 'nowrap' }}><StatusBadge value={v} /></span> },
    {
      title: 'Actions', key: 'act', fixed: 'right', width: 110, align: 'center',
      render: (_, a) => (
        <Space size={2}>
          <Tooltip title="View alert">
            <Button className="tms-row-action" type="text" icon={<Eye size={17} />} onClick={() => open(a)} aria-label={`View ${a.id}`} />
          </Tooltip>
          {canSend && (
            <Tooltip title={a.shareHistory.length ? `Share / Resend (shared ${a.shareHistory.length}×)` : 'Share / Resend'}>
              <Button className="tms-row-action" type="text" icon={<Send size={16} />} onClick={() => openShare(a)} aria-label={`Share ${a.id}`} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const opt = (all, list) => [{ value: '', label: all }, ...list];

  return (
    <Card
      styles={{ body: { padding: 0 } }}
      title={
        <Typography.Text type="secondary" style={{ fontWeight: 400 }}>
          <Typography.Text strong>{rows.length}</Typography.Text> {rows.length === 1 ? 'alert' : 'alerts'}
          {unreadShown.length ? ` · ${unreadShown.length} unread` : ''}
        </Typography.Text>
      }
      extra={
        <Button icon={<CheckCheck size={16} />} disabled={!unreadShown.length} onClick={() => onSetStatus(unreadShown.map(a => a.key), 'read')}>
          Mark all as read
        </Button>
      }
    >
      <Flex gap={10} wrap className="ntf-filters">
        <Input prefix={<Search size={16} />} placeholder="Search alert, vehicle, trip, message" value={q} onChange={e => setQ(e.target.value)} allowClear className="ntf-search" />
        <Select value={source} onChange={setSource} options={opt('All sources', ALERT_SOURCES.map(s => ({ value: s, label: s })))} popupMatchSelectWidth={false} />
        <Select value={type} onChange={setType} options={opt('All alert types', Object.entries(ALERT_TYPES).map(([value, label]) => ({ value, label })))} popupMatchSelectWidth={false} />
        <Select value={severity} onChange={setSeverity} options={opt('All severities', SEVERITIES)} popupMatchSelectWidth={false} />
        <Select value={status} onChange={setStatus} options={opt('All statuses', [{ value: 'unread', label: 'Unread' }, { value: 'read', label: 'Read' }])} popupMatchSelectWidth={false} />
        {filtered && (
          <Button type="link" onClick={() => { setQ(''); setSource(''); setType(''); setSeverity(''); setStatus(''); }}>Clear filters</Button>
        )}
      </Flex>

      <Table
        rowKey="key"
        columns={columns}
        dataSource={rows}
        tableLayout="auto"
        scroll={{ x: 1110 }}
        rowClassName={a => (a.status === 'unread' ? 'ntf-row-unread' : '')}
        onRow={a => ({ onDoubleClick: () => open(a) })}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={filtered ? 'No alerts match these filters' : 'No system alerts right now'} /> }}
        pagination={{ showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (total, [from, to]) => `Showing ${from} to ${to} of ${total} alerts` }}
      />

      <AlertDetailsModal
        alert={viewing}
        onClose={() => setViewKey(null)}
        onToggleRead={a => onSetStatus([a.key], a.status === 'read' ? 'unread' : 'read')}
        onShare={canSend ? openShare : null}
      />
      <ResendNotificationModal
        notification={sharing && { id: sharing.key, title: alertTitle(sharing), message: sharing.message, priority: severityPriority(sharing.severity) }}
        heading="Share alert"
        submitLabel="Share Alert"
        details={sharing && [
          { key: 'id', label: 'Alert', children: `${sharing.id} · ${sharing.source}` },
          { key: 'trip', label: 'Trip ID', children: sharing.tripId || '—' },
          { key: 'd', label: 'Generated', children: formatDateTime(sharing.createdAt) },
          { key: 'r', label: 'Already shared with', children: recipientNames([...new Map(sharing.shareHistory.flatMap(h => h.recipients).map(r => [r.id, r])).values()]) },
        ]}
        markIds={sharing ? sharing.shareHistory.flatMap(h => h.recipients.map(r => r.id)) : []}
        markLabel="Already shared"
        onClose={() => setShareKey(null)}
        onResend={(key, recipients) => onShare(alerts.find(a => a.key === key), recipients)}
        supervisors={supervisors}
      />
    </Card>
  );
};

export default AutomaticAlerts;
