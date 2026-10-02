import React from 'react';
import { Button, Flex, Result, Typography } from 'antd';

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
      <Flex vertical gap={8} style={{ marginTop: 'auto', paddingTop: 20 }}>
        <Button type="primary" size="large" block onClick={v.goHome} style={v.bigBtn}>Back to home</Button>
      </Flex>
    </Flex>
  </>
);

export default CloseTripDone;
