import React from 'react';
import { Button, Flex, Result, Typography } from 'antd';
import { ENROUTE_LABEL } from '../../../utils/tripStatus';

export const OpenTripDone = ({ v }) => (
  <>
    <Flex vertical style={{ flex: 1, padding: '16px 8px 40px' }}>
      <Result
        status="success"
        title="Trip opened"
        subTitle={
          <>
            <Typography.Text strong style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-brand)' }}>{v.newTripNumber}</Typography.Text>
            <Typography.Paragraph style={{ margin: '12px 0 0', fontSize: 15 }}>
              Status {ENROUTE_LABEL}. GPS monitoring has started for {v.newTripVehicle}. The vehicle will not appear as available until this trip is closed.
            </Typography.Paragraph>
          </>
        }
      />
      <Flex vertical gap={8} style={{ marginTop: 'auto', padding: '0 16px' }}>
        <Button type="primary" size="large" block onClick={v.goHome} style={v.bigBtn}>Back to home</Button>
        <Button size="large" block onClick={v.goUnclosed}>View unclosed trips</Button>
      </Flex>
    </Flex>
  </>
);

export default OpenTripDone;
