import React from 'react';
import { Avatar, Button, Flex, Result, Typography } from 'antd';
import { MapPin } from 'lucide-react';
import { ENROUTE_LABEL_LOWER } from '../../../utils/tripStatus';

const { Paragraph } = Typography;

export const GpsPermission = ({ v }) => (
  <>
    <Flex vertical style={{ flex: 1, padding: "8px 8px 40px" }}>
      <Result
        icon={<Avatar shape="square" size={72} style={{ background: "var(--color-brand-tint)", color: "var(--color-brand)" }} icon={<MapPin size={34} strokeWidth={2.25} />} />}
        title="Location access is required"
        subTitle="Trips cannot be opened without GPS. The app needs location access, including in the background, to validate routes, detect idle time and monitor the 100 m safe radius."
      >
        <Paragraph style={{ margin: 0 }}>
          <ul style={{ fontSize: 15 }}>
            <li>Geolocation permission</li>
            <li>Background location access</li>
            <li>Continuous capture while a trip is {ENROUTE_LABEL_LOWER}</li>
          </ul>
        </Paragraph>
      </Result>
      <Flex vertical gap={8} style={{ marginTop: "auto", padding: "0 16px" }}>
        <Button type="primary" size="large" block onClick={v.grantGps} style={v.bigBtn}>Allow location</Button>
        <Button type="text" size="large" block onClick={v.goHome}>Not now</Button>
      </Flex>
    </Flex>
  </>
);

export default GpsPermission;
