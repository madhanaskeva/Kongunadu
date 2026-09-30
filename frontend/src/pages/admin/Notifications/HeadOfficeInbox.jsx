import React from 'react';
import { Badge, Button, Card, Empty, Flex, Space, Typography } from 'antd';
import { useTMSAdmin } from '../../../context/TMSAdminContext';

// Messages and requests that reached Head Office (e.g. bunk approvals from supervisors).
// Same list the header bell shows; kept as its own tab on the Notifications page.
export const HeadOfficeInbox = () => {
  const { adminNotifications, adminNotifRead, markAdminNotifsRead, decideBunkRequest } = useTMSAdmin();
  const list = adminNotifications || [];
  const readSet = new Set(adminNotifRead || []);
  const isUnread = n => !readSet.has(n.id);
  const unread = list.filter(isUnread).length;

  return (
    <Card
      title={
        <Typography.Text type="secondary" style={{ fontWeight: 400 }}>
          <Typography.Text strong>{list.length}</Typography.Text> {list.length === 1 ? 'notification' : 'notifications'}
          {unread ? ` · ${unread} unread` : ''}
        </Typography.Text>
      }
      extra={
        unread > 0 && markAdminNotifsRead && (
          <Button onClick={markAdminNotifsRead}>Mark all as read</Button>
        )
      }
    >
      <Flex vertical gap={12}>
        {list.map(item => {
          const itemUnread = isUnread(item);
          return (
            <Card
              key={item.id}
              size="small"
              // Unread items keep their brand-coloured outline.
              style={itemUnread ? { borderColor: 'var(--color-brand)' } : undefined}
            >
              <Flex vertical gap={6}>
                <Flex justify="space-between" align="flex-start" gap={8}>
                  <Typography.Text strong style={{ fontSize: 15 }}>{item.title}</Typography.Text>
                  {itemUnread && <Badge status="success" title="Unread message" />}
                </Flex>
                <Typography.Text>{item.body}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Typography.Text>
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
            </Card>
          );
        })}

        {list.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notifications yet" />}
      </Flex>
    </Card>
  );
};

export default HeadOfficeInbox;
