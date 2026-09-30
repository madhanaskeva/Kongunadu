import React from 'react';
import { Button, Card, Flex, Result, Typography } from 'antd';

const { Text } = Typography;

export const Offline = ({ v }) => (
  <>
    <Flex vertical style={{ flex: 1, padding: "8px 8px 40px" }}>
      <Result
        status="error"
        title="Could not reach the server"
        subTitle="Your trip has been kept on this device and will be submitted when the connection returns. Nothing is lost."
      >
        <Card size="small">
          <Text type="secondary" className="sv-kicker">Waiting to sync</Text>
          <Text code strong style={{ fontSize: 15 }}>Open Trip · TN 28 BC 1180 · 09:41</Text>
        </Card>
      </Result>
      <Flex vertical gap={8} style={{ marginTop: "auto", padding: "0 16px" }}>
        <Button type="primary" size="large" block onClick={v.goHome} style={v.bigBtn}>Retry</Button>
      </Flex>
    </Flex>
  </>
);

export default Offline;
