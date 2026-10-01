import React, { useState } from 'react';
import { Badge, Button, Card, Checkbox, Empty, Flex, Space, Typography } from 'antd';
import { CheckCheck } from 'lucide-react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { getInboxShares } from '../../../utils/notificationUtils';
import { ResendNotificationModal } from './ResendNotificationModal';
import { SelectionTitle, ShareButton } from './SelectionControls';

// Messages and requests that reached Head Office (e.g. bunk approvals from supervisors).
// Same list the header bell shows; tick any of them to forward to supervisors with one Share button.
export const HeadOfficeInbox = ({ supervisors = [], canSend, onShare }) => {
  const { adminNotifications, adminNotifRead, markAdminNotifsRead, decideBunkRequest } = useTMSAdmin();
  const list = adminNotifications || [];
  const readSet = new Set(adminNotifRead || []);
  const isUnread = n => !readSet.has(n.id);
  const unread = list.filter(isUnread).length;

  const [selectedIds, setSelectedIds] = useState([]);
  const [shareOpen, setShareOpen] = useState(false);
  // Bumped after a share so the "Shared N×" labels re-read their history.
  const [, setRev] = useState(0);
  const shares = getInboxShares();

  const selected = list.filter(n => selectedIds.includes(n.id));
  const allOn = list.length > 0 && selected.length === list.length;
  const toggle = (id, on) => setSelectedIds(ids => (on ? [...ids, id] : ids.filter(x => x !== id)));

  return (
    <Card
      title={
        <SelectionTitle
          count={list.length}
          noun="notification"
          extra={unread ? `${unread} unread` : ''}
          selected={selected.length}
          onClear={() => setSelectedIds([])}
        />
      }
      extra={
        <Space size={8} wrap>
          {unread > 0 && markAdminNotifsRead && (
            <Button icon={<CheckCheck size={16} />} onClick={markAdminNotifsRead}>Mark all as read</Button>
          )}
          {canSend && <ShareButton count={selected.length} onClick={() => setShareOpen(true)} />}
        </Space>
      }
    >
      <Flex vertical gap={12}>
        {canSend && list.length > 0 && (
          <Checkbox
            checked={allOn}
            indeterminate={selected.length > 0 && !allOn}
            onChange={e => setSelectedIds(e.target.checked ? list.map(n => n.id) : [])}
          >
            <Typography.Text strong>Select all</Typography.Text>
          </Checkbox>
        )}

        {list.map(item => {
          const itemUnread = isUnread(item);
          const on = selectedIds.includes(item.id);
          const sharedCount = (shares[item.id] || []).length;
          return (
            <Card
              key={item.id}
              size="small"
              className={`ntf-inbox-card${on ? ' is-selected' : ''}`}
              // Unread items keep their brand-coloured outline.
              style={itemUnread && !on ? { borderColor: 'var(--color-brand)' } : undefined}
            >
              <Flex gap={12} align="flex-start">
                {canSend && <Checkbox checked={on} onChange={e => toggle(item.id, e.target.checked)} aria-label={`Select ${item.title}`} style={{ marginTop: 2 }} />}
                <Flex vertical gap={6} style={{ flex: 1, minWidth: 0 }}>
                  <Flex justify="space-between" align="flex-start" gap={8}>
                    <Typography.Text strong style={{ fontSize: 15 }}>{item.title}</Typography.Text>
                    {itemUnread && <Badge status="success" title="Unread message" />}
                  </Flex>
                  <Typography.Text>{item.body}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {item.time}
                    {sharedCount > 0 && ` · Shared with supervisors ${sharedCount}×`}
                  </Typography.Text>
                  {item.kind === 'bunkApproval' && item.bunkRequestId ? (
                    <Space size={8} wrap style={{ marginTop: 4 }}>
                      <Button type="primary" size="small" onClick={() => decideBunkRequest(item.bunkRequestId, 'Approved')}>
                        Approve Bunk & Authorize
                      </Button>
                      <Button danger size="small" onClick={() => decideBunkRequest(item.bunkRequestId, 'Rejected')}>
                        Reject
                      </Button>
                    </Space>
                  ) : null}
                </Flex>
              </Flex>
            </Card>
          );
        })}

        {list.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notifications yet" />}
      </Flex>

      <ResendNotificationModal
        notification={shareOpen && selected.length ? {
          id: '__inbox',
          title: `${selected.length} ${selected.length === 1 ? 'message' : 'messages'} selected`,
          message: 'Each message is forwarded to the supervisors as its own notice.',
          priority: 'normal',
        } : null}
        heading="Share with supervisors"
        submitLabel={`Share ${selected.length} ${selected.length === 1 ? 'Message' : 'Messages'}`}
        summary={(
          <ul className="ntf-bulk-list">
            {selected.map(n => (
              <li key={n.id}>
                <span className="ntf-bulk-text"><strong>{n.title}</strong></span>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{n.time}</Typography.Text>
              </li>
            ))}
          </ul>
        )}
        markIds={[]}
        onClose={() => setShareOpen(false)}
        onResend={(_, recipients) => { onShare(selected, recipients); setSelectedIds([]); setRev(r => r + 1); }}
        supervisors={supervisors}
      />
    </Card>
  );
};

export default HeadOfficeInbox;
