import React from 'react';
import { Alert, Button, Card, Col, Empty, Flex, Form, Input, Row, Select, Tag, Typography } from 'antd';

const { Text, Title } = Typography;

export const VehicleIdleStatus = ({ v }) => (
  <>
    <div className="sv-screen">
      <Flex vertical gap={16} className="sv-screen-body">
        <div>
          <Title level={4} style={{ margin: 0 }}>{v.todayDM} · {v.nowHM}</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Mark each {v.branchName} vehicle that is standing idle and say why. Vehicles on a trip are running and cannot be marked.</Text>
        </div>
        <Row gutter={8}>
          <Col span={8}>
            <Card size="small" variant="borderless" style={{ background: "var(--color-hazard-soft)", color: "#7A4300" }}>
              <div style={{ fontSize: 12 }}>Idle</div>
              <div className="sv-figure" style={{ fontSize: 22, color: "inherit" }}>{v.idleStats.idle}</div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" variant="borderless" style={{ background: "var(--st-enroute-bg)", color: "var(--st-enroute-fg)" }}>
              <div style={{ fontSize: 12 }}>On trip</div>
              <div className="sv-figure" style={{ fontSize: 22, color: "inherit" }}>{v.idleStats.running}</div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" variant="borderless" style={{ background: "var(--surface-muted)" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Ready</Text>
              <div className="sv-figure" style={{ fontSize: 22 }}>{v.idleStats.ready}</div>
            </Card>
          </Col>
        </Row>
        {v.idleHasErrors ? (
          <>
            <Alert type="error" showIcon title={v.idleErrorText} />
          </>
        ) : null}
        <Flex gap={8} wrap>
          {(v.idleFilters || []).map((f, fIdx) => (
            <React.Fragment key={fIdx}>
              <Button data-f={f.id} onClick={v.setIdleFilter} shape="round" type={f.on ? 'primary' : 'default'}>
                {f.label}
              </Button>
            </React.Fragment>
          ))}
        </Flex>
        <Flex vertical gap={10}>
          {(v.idleVehicles || []).map((row, vIdx) => (
            <React.Fragment key={vIdx}>
              <Card size="small" className="sv-edge-card" style={{ borderLeftColor: row.edge, background: row.bg }}>
                <Flex align="center" gap={12}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ display: "block", fontSize: 15 }}>{row.number}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{row.sub}</Text>
                  </div>
                  {row.running ? (
                    <>
                      <Tag color="processing" className="sv-tag">
                        On trip
                      </Tag>
                    </>
                  ) : null}
                  {row.canMark ? (
                    <>
                      <Button data-id={row.id} onClick={v.toggleIdle} aria-pressed={row.on} color={row.on ? 'orange' : 'default'} variant={row.on ? 'solid' : 'outlined'} style={{ minWidth: 84 }}>
                        {row.tLabel}
                      </Button>
                    </>
                  ) : null}
                </Flex>
                {row.on ? (
                  <>
                    <Form layout="vertical" component={false}>
                      <Form.Item
                        label="Idle reason"
                        validateStatus={row.reasonErr ? 'error' : undefined}
                        help={row.reasonErr ? 'Select why this vehicle is idle.' : undefined}
                        style={{ margin: "10px 0 8px" }}
                      >
                        {/* Row values come from `row`; toggleIdle and idleReasonOptions live on the screen view model `v` */}
                        <Select
                          size="large"
                          placeholder={(v.idleReasonOptions || []).length ? 'Select reason' : 'None available'}
                          options={v.idleReasonOptions || []}
                          disabled={!(v.idleReasonOptions || []).length}
                          value={row.reason || undefined}
                          onChange={(val) => row.setReason && row.setReason({ target: { value: val == null ? '' : String(val) } })}
                        />
                      </Form.Item>
                      {row.isOther ? (
                        <>
                          <Form.Item
                            label="Describe the reason"
                            validateStatus={row.noteErr ? 'error' : undefined}
                            help={row.noteErr}
                            style={{ marginBottom: 8 }}
                          >
                            <Input size="large" placeholder="e.g. Waiting for FC renewal at RTO" value={row.note ?? ''} onChange={row.setNote} readOnly={!row.setNote} />
                          </Form.Item>
                        </>
                      ) : null}
                    </Form>
                    <Text strong style={{ fontSize: 13, color: row.sinceColor }}>{row.sinceText}</Text>
                  </>
                ) : null}
              </Card>
            </React.Fragment>
          ))}
          {v.idleListEmpty ? (
            <>
              <Card style={{ borderStyle: "dashed", borderWidth: 2 }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <>
                      <Text strong style={{ display: "block", fontSize: 18 }}>{v.idleEmptyTitle}</Text>
                      <Text type="secondary">{v.idleEmptyText}</Text>
                    </>
                  }
                />
              </Card>
            </>
          ) : null}
        </Flex>
      </Flex>
      <div className="sv-actionbar">
        <Button type="primary" size="large" block onClick={v.saveIdle} style={v.bigBtn}>Save idle status</Button>
      </div>
    </div>
  </>
);

export default VehicleIdleStatus;
