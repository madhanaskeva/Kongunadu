import React from 'react';
import { Button, Card, Flex, Result, Tag, Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

// Request status label → antd Tag preset.
const REQ_TAG = { 'Pending approval': 'warning', Approved: 'success', Rejected: 'error' };

export const RequestSent = ({ v }) => (
  <>
    <Flex vertical style={{ flex: 1, padding: '16px 24px 40px' }}>
      <Result
        status="warning"
        icon={<ClockCircleOutlined />}
        title="Sent for approval"
        style={{ padding: '16px 0 0' }}
        subTitle={<Typography.Paragraph style={{ margin: '8px 0 0', fontSize: 15 }}>{v.rf.name} will appear in the driver list once Head Office approves the request. You will also get a notification.</Typography.Paragraph>}
      />
      <Card size="small" role="status" aria-live="polite" style={{ marginTop: 20 }}>
        <Flex justify="space-between" align="center" gap={12}>
          <Typography.Text type="secondary" strong style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Request status
          </Typography.Text>
          <Tag color={REQ_TAG[v.reqSent.label] || 'default'} style={{ marginInlineEnd: 0 }}>
            {v.reqSent.label}
          </Tag>
        </Flex>
        <Typography.Paragraph style={{ margin: '8px 0 0', lineHeight: 1.5 }}>{v.reqSent.note}</Typography.Paragraph>
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>{v.reqSent.when}</Typography.Text>
      </Card>
      <div style={{ marginTop: 'auto', paddingTop: 20 }}><Button type="primary" size="large" block onClick={v.goHome} style={v.bigBtn}>Back to home</Button></div>
    </Flex>
  </>
);

export default RequestSent;
