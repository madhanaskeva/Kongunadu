import React from 'react';
import { Alert, Avatar, Button, Card, Descriptions, Flex, Tag, Typography } from 'antd';

const { Text, Title } = Typography;

export const NotificationDetail = ({ v }) => (
  <>
    <div className="sv-screen">
      <Flex vertical gap={16} className="sv-screen-body">
        <Flex align="center" gap={12}>
          <Avatar
            shape="square"
            size={48}
            style={{ flex: "none", background: v.nd.iconBg, color: v.nd.iconFg }}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={v.nd.icon} />
              </svg>
            }
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text className="sv-kicker" style={{ color: v.nd.iconFg, margin: 0 }}>{v.nd.kindLabel}</Text>
            <Text type="secondary" style={{ fontSize: 13 }}>{v.nd.from} · {v.nd.atLong}</Text>
          </div>
          {v.nd.urgent ? (
            <>
              <Tag color="error" className="sv-tag">
                Urgent
              </Tag>
            </>
          ) : null}
        </Flex>
        <Title level={3} style={{ margin: 0, lineHeight: 1.2 }}>
          {v.nd.title}
        </Title>
        <Card size="small" variant="borderless" style={{ background: "var(--surface-muted)", fontSize: 15, lineHeight: 1.55, whiteSpace: "pre-line" }}>
          {v.nd.body}
        </Card>
        {v.nd.hasNote ? (
          <>
            <Alert
              type="warning"
              title={
                <span>
                  <strong>What to do.</strong>
                  {' '}{v.nd.note}
                </span>
              }
            />
          </>
        ) : null}
        {v.nd.hasRows ? (
          <>
            <div>
              <Text type="secondary" className="sv-kicker">
                Details
              </Text>
              <Descriptions
                bordered
                size="small"
                column={1}
                className="sv-kv"
                items={(v.nd.rowList || []).map((r, rIdx) => ({ key: rIdx, label: r.k, children: r.v }))}
              />
            </div>
          </>
        ) : null}
      </Flex>
      <Flex vertical gap={8} className="sv-actionbar">
        {v.nd.hasLink ? (
          <>
            <Button type="primary" size="large" block onClick={v.openNotifLink} style={v.bigBtn}>{v.nd.linkLabel}</Button>
          </>
        ) : null}
        {v.nd.canUnread ? (
          <>
            <Button type="text" size="large" block onClick={v.markNotifUnread}>Mark as unread</Button>
          </>
        ) : null}
      </Flex>
    </div>
  </>
);

export default NotificationDetail;
