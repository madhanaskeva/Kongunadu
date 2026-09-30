import React from 'react';
import { Alert, Button, Card, Flex, Result, Statistic, Typography } from 'antd';

export const CloseTripDone = ({ v }) => (
  <>
    <Flex vertical style={{ flex: 1, padding: '8px 20px 40px' }}>
      <Result
        status="success"
        title="Trip closed"
        style={{ padding: '16px 0' }}
        subTitle={
          <>
            <Typography.Text strong style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--text-brand)' }}>{v.sel.number}</Typography.Text>
            <Typography.Paragraph style={{ margin: '8px 0 0', fontSize: 15 }}>{v.sel.vehicleNumber} is now available for the next assignment.</Typography.Paragraph>
          </>
        }
      />
      <Card
        size="small"
        title={<Typography.Text type="secondary" strong style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Triple distance verification</Typography.Text>}
        styles={{ body: { padding: 0 } }}
        style={{ overflow: 'hidden' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', textAlign: 'center' }}>
          <Statistic title="Fixed route" value={v.verify.fixed} style={{ padding: '14px 8px', borderRight: '1px solid var(--border-default)' }} />
          <Statistic title="GPS" value={v.verify.gps} style={{ padding: '14px 8px', borderRight: '1px solid var(--border-default)' }} />
          <Statistic title="Odometer" value={v.verify.odo} style={{ padding: '14px 8px' }} />
        </div>
        <Alert
          banner
          showIcon={false}
          type={v.verify.bg === 'var(--color-hazard-soft)' ? 'warning' : 'success'}
          title={
            <Flex justify="space-between" align="center" gap={8}>
              <span>Variance {v.verify.pct} against fixed route</span>
              <strong style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{v.verify.label}</strong>
            </Flex>
          }
        />
      </Card>
      <Flex vertical gap={8} style={{ marginTop: 'auto', paddingTop: 20 }}>
        <Button type="primary" size="large" block onClick={v.goHome} style={v.bigBtn}>Back to home</Button>
      </Flex>
    </Flex>
  </>
);

export default CloseTripDone;
