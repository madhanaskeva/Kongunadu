import React from 'react';
import { Alert, Button, Card, Col, Descriptions, Flex, Row, Tag, Typography } from 'antd';

const { Text } = Typography;

export const ClosedTripDetail = ({ v }) => (
  <>
    <div className="sv-screen">
      <Flex vertical gap={16} className="sv-screen-body">
        <Flex justify="space-between" align="center" gap={8}>
          <Text code strong style={{ fontSize: 18 }}>{v.hist.number}</Text>
          <Tag color={v.hist.badgeColor} className="sv-tag">
            {v.hist.badge}
          </Tag>
        </Flex>
        <Row gutter={8}>
          {[['Fixed route', v.hist.fixedKm], ['GPS', v.hist.gpsKm], ['Odometer', v.hist.odoKm]].map(([label, value]) => (
            <Col span={8} key={label}>
              <Card size="small" variant="borderless" style={{ background: "var(--surface-muted)", height: "100%" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                <div className="sv-figure" style={{ fontSize: 19, overflowWrap: "anywhere" }}>{value}</div>
              </Card>
            </Col>
          ))}
        </Row>
        {/* verify tone (grey / hazard / brand) is computed in SupervisorApp */}
        <Alert title={v.hist.verifyText} style={{ background: v.hist.verifyBg, color: v.hist.verifyFg, border: 0 }} />
        <div>
          <Text type="secondary" className="sv-kicker">
            Opened · {v.hist.openedAt}
          </Text>
          <Descriptions
            bordered
            size="small"
            column={1}
            className="sv-kv"
            items={(v.hist.openRows || []).map((r, rIdx) => ({ key: rIdx, label: r.k, children: r.v }))}
          />
        </div>
        <div>
          <Text type="secondary" className="sv-kicker">
            Closed · {v.hist.closedAt}
          </Text>
          <Descriptions
            bordered
            size="small"
            column={1}
            className="sv-kv"
            items={(v.hist.closeRows || []).map((r, rIdx) => ({ key: rIdx, label: r.k, children: r.v, styles: { content: { background: r.bg, color: r.color } } }))}
          />
        </div>
        {v.hist.flagged ? (
          <>
            <Alert
              type="warning"
              title={
                <span>
                  <strong>Sent to the admin as an exception.</strong>
                  {' '}{v.hist.flagLine}
                </span>
              }
            />
          </>
        ) : null}
      </Flex>
      <div className="sv-actionbar">
        <Button color="primary" variant="outlined" size="large" block onClick={v.back}>Back to trip history</Button>
      </div>
    </div>
  </>
);

export default ClosedTripDetail;
