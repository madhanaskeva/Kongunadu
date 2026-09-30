import React from 'react';
import { Alert, Button, Descriptions, Flex, Typography } from 'antd';

export const OpenTripReview = ({ v }) => (
  <>
    <Flex vertical style={{ flex: 1 }}>
      <Flex vertical gap={16} style={{ padding: 16 }}>
        <Typography.Paragraph style={{ margin: 0, fontSize: 15 }}>Check the details. The trip number is generated when you confirm, and GPS monitoring starts immediately.</Typography.Paragraph>
        <Descriptions
          bordered
          column={1}
          size="small"
          items={(v.reviewRows || []).map((r, rIdx) => ({ key: rIdx, label: r.k, children: <Typography.Text strong>{r.v}</Typography.Text> }))}
        />
        <Alert
          type="success"
          title={
            <span>
              <strong>Validation passed.</strong>
              {' '}{v.reviewNote}
            </span>
          }
        />
      </Flex>
      <Flex vertical gap={8} style={{ position: 'sticky', bottom: 0, marginTop: 'auto', padding: '12px 16px 40px', background: '#fff', borderTop: '1px solid var(--border-default)' }}>
        {v.saving ? (
          <>
            <Button type="primary" size="large" block loading style={v.bigBtn}>
              Saving trip
            </Button>
          </>
        ) : null}
        {v.notSaving ? (
          <>
            <Button type="primary" size="large" block onClick={v.confirmOpen} style={v.bigBtn}>Confirm and open trip</Button>
          </>
        ) : null}
        <Button type="text" size="large" block onClick={v.back}>Edit details</Button>
      </Flex>
    </Flex>
  </>
);

export default OpenTripReview;
