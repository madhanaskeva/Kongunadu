import React from 'react';
import { Badge, Card, Flex, Typography } from 'antd';

/**
 * NotificationCard — one notification row (antd Card).
 *
 * Props:
 *   title: Title string (e.g. "Driver Request", "Maintenance Alert", "Trip Update", "System Notice")
 *   body: Message body text
 *   time: Timestamp string (e.g. "Just now", "2 hrs ago", "4 hrs ago", "1 day ago")
 *   unread: boolean, indicates unread state
 *   actions: optional node rendered under the body (clicks don't reach onClick)
 *   onClick: optional click handler
 *   style: optional inline style overrides
 */
export const NotificationCard = ({
  title,
  body,
  time,
  unread = false,
  actions,
  onClick,
  style = {},
}) => {
  return (
    <Card
      size="small"
      hoverable={!!onClick}
      onClick={onClick}
      // Unread cards get the brand border, as before.
      style={{ borderColor: unread ? 'var(--color-brand)' : undefined, cursor: onClick ? 'pointer' : 'default', ...style }}
    >
      <Flex vertical gap={4}>
        <Flex justify="space-between" align="flex-start" gap={8}>
          <Typography.Text strong style={{ fontSize: 15, color: 'var(--text-heading)' }}>
            {title}
          </Typography.Text>
          {unread && <Badge status="processing" title="Unread message" />}
        </Flex>
        <Typography.Paragraph style={{ margin: 0 }}>{body}</Typography.Paragraph>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {time}
        </Typography.Text>
        {actions && (
          <div style={{ marginTop: 6 }} onClick={e => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </Flex>
    </Card>
  );
};

export default NotificationCard;
