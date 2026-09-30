import React from 'react';
import { Button, Card, Empty, Flex, Tag, Typography } from 'antd';

export const CloseTripList = ({ v }) => (
  <>
    <Flex vertical gap={12} style={{ flex: 1, padding: 16 }}>
      <Typography.Paragraph style={{ margin: 0, fontSize: 15 }}>Select the trip whose unloading is complete.</Typography.Paragraph>
      {(v.activeTrips || []).map((t, tIdx) => (
        <React.Fragment key={tIdx}>
          <Card
            hoverable
            size="small"
            role="button"
            tabIndex={0}
            data-id={t.id}
            onClick={v.pickClose}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); v.pickClose(e); } }}
          >
            <Flex justify="space-between" align="center" gap={8}>
              <Typography.Text strong style={{ fontFamily: 'var(--font-mono)', fontSize: 15 }}>{t.number}</Typography.Text>
              <Tag color={t.badgeColor} style={{ marginInlineEnd: 0 }}>{t.badge}</Tag>
            </Flex>
            <Typography.Text strong style={{ display: 'block', marginTop: 6, fontSize: 15 }}>{t.crewLine}</Typography.Text>
            <Typography.Text type="secondary" style={{ display: 'block' }}>{t.routeLine}</Typography.Text>
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 13 }}>Opened {t.opened} · {t.hoursOpen} h open</Typography.Text>
          </Card>
        </React.Fragment>
      ))}
      {v.noActive ? (
        <>
          <Card style={{ borderStyle: 'dashed', borderWidth: 2 }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <>
                  <Typography.Title level={4} style={{ margin: 0 }}>No trips to close</Typography.Title>
                  <Typography.Paragraph type="secondary" style={{ margin: '8px 0 0' }}>Every trip for {v.branchName} is closed. Open a trip after the next loading.</Typography.Paragraph>
                </>
              }
            >
              <Button onClick={v.goOpen}>Open trip</Button>
            </Empty>
          </Card>
        </>
      ) : null}
    </Flex>
  </>
);

export default CloseTripList;
