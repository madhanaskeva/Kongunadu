import React from 'react';
import { Alert, Button, Card, Col, Descriptions, Flex, Row, Tag, Timeline, Typography } from 'antd';

const { Text } = Typography;

export const TripDetail = ({ v }) => (
  <>
    <div className="sv-screen">
      <Flex vertical gap={16} className="sv-screen-body">
        {v.resumeHere ? (
          <>
            <Alert
              role="status"
              type="warning"
              showIcon
              title={
                <span>
                  <strong>Close this trip first.</strong>
                  {' '}You go back to Open Trip for {v.resumeVehicle} as soon as it is closed.
                </span>
              }
            />
          </>
        ) : null}
        <Flex justify="space-between" align="center" gap={8}>
          <Text code strong style={{ fontSize: 18 }}>{v.sel.number}</Text>
          <Tag color={v.sel.badgeColor} className="sv-tag">
            {v.sel.badge}
          </Tag>
        </Flex>
        {v.selLongOpen ? (
          <>
            <Alert
              type="warning"
              title={
                <span>
                  <strong>Long open trip.</strong>
                  {' '}Open for {v.sel.hoursOpen} h against an expected {v.sel.expectedHours} h. Close it if unloading is done, or the admin will be alerted.
                </span>
              }
            />
          </>
        ) : null}
        <Row gutter={8}>
          {[['Fixed route', v.sel.fixedKm], ['GPS so far', v.sel.gpsKm], ['Start KM', v.sel.startKm]].map(([label, value]) => (
            <Col span={8} key={label}>
              <Card size="small" variant="borderless" style={{ background: "var(--surface-muted)", height: "100%" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                <div className="sv-figure" style={{ fontSize: 20 }}>{value}</div>
              </Card>
            </Col>
          ))}
        </Row>
        <Descriptions
          bordered
          size="small"
          column={1}
          className="sv-kv"
          items={(v.selRows || []).map((r, rIdx) => ({ key: rIdx, label: r.k, children: r.v }))}
        />
        <div>
          <Text type="secondary" className="sv-kicker">
            GPS timeline
          </Text>
          <Timeline
            items={(v.gpsLog || []).map((g, gIdx) => ({
              key: gIdx,
              color: 'green',
              content: (
                <>
                  <Text type="secondary" code>{g.t}</Text>{' '}
                  <Text strong>{g.ev}</Text>
                  <Text type="secondary" style={{ display: "block", fontSize: 12 }}>{g.km} km · {g.speed} km/h</Text>
                </>
              ),
            }))}
          />
        </div>
      </Flex>
      <div className="sv-actionbar">
        <Button type="primary" size="large" block onClick={v.closeFromDetail} style={v.bigBtn}>Close this trip</Button>
      </div>
    </div>
  </>
);

export default TripDetail;
