import React from 'react';
import { Button, Descriptions, Divider, Empty, Flex, Modal, Timeline, Typography } from 'antd';
import { ALERT_TYPES, formatDateTime, recipientNames } from '../../../utils/notificationUtils';
import { ModalTitle } from './SendNotificationModal';
import { PriorityTag, SeverityTag, StatusBadge } from './NotificationTags';

// Resend / share history timeline, shared by both detail modals.
const ShareHistory = ({ history, label, emptyText }) => (
  <>
    <Divider titlePlacement="start" style={{ marginBottom: 12 }}>
      {label} history {history.length ? `(${history.length})` : ''}
    </Divider>
    {history.length ? (
      <Timeline
        style={{ paddingTop: 8 }}
        items={history.map((h, i) => ({
          key: h.id,
          content: (
            <Flex vertical gap={2}>
              <Typography.Text strong>{label} #{i + 1}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>Sent by: {h.sentBy}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>Sent date: {formatDateTime(h.sentAt)}</Typography.Text>
              <Typography.Text style={{ fontSize: 13 }}>Recipients: {recipientNames(h.recipients)}</Typography.Text>
            </Flex>
          ),
        }))}
      />
    ) : (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} style={{ margin: '8px 0' }} />
    )}
  </>
);

// Details of a manual notification, including its resend history.
export const NotificationDetailsModal = ({ notification: n, onClose, onResend }) => {
  const history = (n && n.resendHistory) || [];
  return (
    <Modal
      open={!!n}
      onCancel={onClose}
      width={620}
      centered
      destroyOnHidden
      title={<ModalTitle kicker={n ? n.id : ''} title="Notification details" />}
      footer={
        <>
          <Button type="text" onClick={onClose}>Close</Button>
          {onResend && <Button type="primary" onClick={() => onResend(n)}>Share / Resend</Button>}
        </>
      }
    >
      {n && (
        <>
          <Descriptions size="small" column={1} bordered items={[
            { key: 'title', label: 'Title', children: <Typography.Text strong>{n.title}</Typography.Text> },
            { key: 'msg', label: 'Message', children: <span style={{ whiteSpace: 'pre-wrap' }}>{n.message}</span> },
            { key: 'pri', label: 'Priority', children: <PriorityTag value={n.priority} /> },
            { key: 'by', label: 'Created by', children: n.createdBy },
            { key: 'date', label: 'Original sent date', children: formatDateTime(n.createdAt) },
            { key: 'to', label: 'Original recipients', children: recipientNames(n.recipients) },
          ]} />

          <ShareHistory history={history} label="Resend" emptyText="Not resent yet" />
        </>
      )}
    </Modal>
  );
};

// Details of an automatically generated alert.
export const AlertDetailsModal = ({ alert: a, onClose, onToggleRead, onShare }) => (
  <Modal
    open={!!a}
    onCancel={onClose}
    width={580}
    centered
    destroyOnHidden
    title={<ModalTitle kicker={a ? `${a.id} · ${a.source}` : ''} title={a ? ALERT_TYPES[a.alertType] : ''} />}
    footer={
      <>
        {a && <Button onClick={() => onToggleRead(a)}>{a.status === 'read' ? 'Mark as unread' : 'Mark as read'}</Button>}
        {a && onShare ? <Button type="primary" onClick={() => onShare(a)}>Share / Resend</Button> : <Button type="primary" onClick={onClose}>Close</Button>}
      </>
    }
  >
    {a && (
      <Descriptions size="small" column={1} bordered items={[
        { key: 'type', label: 'Alert type', children: ALERT_TYPES[a.alertType] },
        { key: 'src', label: 'Source', children: a.source },
        { key: 'veh', label: 'Vehicle number', children: a.vehicleNo },
        { key: 'trip', label: 'Trip ID', children: a.tripId || '—' },
        { key: 'msg', label: 'Message', children: a.message },
        { key: 'sev', label: 'Severity', children: <SeverityTag value={a.severity} /> },
        { key: 'date', label: 'Generated', children: formatDateTime(a.createdAt) },
        { key: 'st', label: 'Status', children: <StatusBadge value={a.status} /> },
      ]} />
    )}
    {a && <ShareHistory history={a.shareHistory || []} label="Share" emptyText="Not shared with supervisors yet" />}
  </Modal>
);

export default NotificationDetailsModal;
