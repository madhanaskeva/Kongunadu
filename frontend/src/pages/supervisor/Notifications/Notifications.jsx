import React from 'react';
import { Avatar, Badge, Button, Card, Empty, Flex, Tag, Typography } from 'antd';
import { Bell } from 'lucide-react';

const { Text, Paragraph } = Typography;

export const Notifications = ({ v }) => (
  <>
    <Flex vertical gap={12} style={{ flex: 1, padding: 16 }}>
      <Flex justify="space-between" align="center" gap={12}>
        <Text type="secondary">
          <Text strong>{v.notifUnread}</Text>
          {' '}unread · {v.notifTotal} total
        </Text>
        {v.notifHasUnread ? (
          <>
            <Button type="link" onClick={v.markAllRead} style={{ paddingInline: 0, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}>
              Mark all read
            </Button>
          </>
        ) : null}
      </Flex>
      <Flex role="tablist" aria-label="Filter notifications" gap={6} className="sv-chip-row">
        {(v.notifFilters || []).map((f, fIdx) => (
          <React.Fragment key={fIdx}>
            <Button role="tab" aria-selected={f.on} data-f={f.id} onClick={v.setNotifFilter} shape="round" type={f.on === 'true' ? 'primary' : 'default'} style={{ flex: "none" }}>
              {f.label}
            </Button>
          </React.Fragment>
        ))}
      </Flex>
      {(v.notifShown || []).map((n, nIdx) => (
        <React.Fragment key={nIdx}>
          <Card
            size="small"
            hoverable
            role="button"
            tabIndex={0}
            data-id={n.id}
            onClick={v.openNotif}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); v.openNotif(e); } }}
            className="sv-edge-card"
            style={{ borderLeftColor: n.edge, background: n.bg }}
          >
            <Flex align="flex-start" gap={12}>
              <Avatar
                shape="square"
                size={40}
                style={{ flex: "none", background: n.iconBg, color: n.iconFg }}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={n.icon} />
                  </svg>
                }
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Flex justify="space-between" align="baseline" gap={8}>
                  <Text className="sv-kicker" style={{ color: n.iconFg, margin: 0 }}>{n.kindLabel}</Text>
                  <Text type="secondary" style={{ flex: "none", fontSize: 12 }}>{n.at}</Text>
                </Flex>
                <Text style={{ display: "block", marginTop: 3, fontSize: 15, lineHeight: 1.3, fontWeight: n.weight, color: "var(--text-heading)" }}>{n.title}</Text>
                <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ margin: "3px 0 0", fontSize: 13 }}>
                  {n.body}
                </Paragraph>
                <Flex align="center" gap={8} style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{n.from}</Text>
                  {n.urgent ? (
                    <>
                      <Tag color="error" className="sv-tag">
                        Urgent
                      </Tag>
                    </>
                  ) : null}
                </Flex>
              </div>
              {n.unread ? (
                <>
                  <Badge status="error" aria-label="Unread" style={{ marginTop: 2 }} />
                </>
              ) : null}
            </Flex>
          </Card>
        </React.Fragment>
      ))}
      {v.notifShownEmpty ? (
        <>
          <Empty
            style={{ padding: "32px 20px" }}
            image={<Avatar size={56} style={{ background: "var(--surface-muted)", color: "var(--text-muted)" }} icon={<Bell size={26} strokeWidth={2.25} />} />}
            styles={{ image: { height: 56 } }}
            description={
              <>
                <Text strong style={{ display: "block", fontSize: 20 }}>{v.notifEmptyTitle}</Text>
                <Text type="secondary">{v.notifEmptyText}</Text>
              </>
            }
          />
        </>
      ) : null}
    </Flex>
  </>
);

export default Notifications;
