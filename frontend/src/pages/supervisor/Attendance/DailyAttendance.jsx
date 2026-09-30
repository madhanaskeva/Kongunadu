import React from 'react';
import { Button, Card, Flex, Progress, Radio, Typography } from 'antd';

export const DailyAttendance = ({ v }) => (
  <>
    <Flex vertical style={{ flex: 1 }}>
      <Flex vertical gap={18} style={{ padding: 16 }}>
        <Flex justify="space-between" align="center">
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>{v.todayDM}</Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>{v.attendanceMarked} of {v.attendanceTotal} drivers marked</Typography.Text>
          </div>
          {v.showAttMonth ? (
            <>
              <Button type="link" onClick={v.goAttMonth}>
                Month view →
              </Button>
            </>
          ) : null}
        </Flex>
        <Progress percent={parseFloat(v.attendancePct) || 0} showInfo={false} size="small" strokeColor="var(--color-brand)" railColor="var(--kr-grey-100)" />
        <div>
          <Typography.Text type="secondary" strong style={{ display: 'block', marginBottom: 8, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Drivers
          </Typography.Text>
          <Flex vertical gap={8}>
            {(v.attDrivers || []).map((d, dIdx) => (
              <React.Fragment key={dIdx}>
                <Card size="small">
                  <Flex align="center" gap={10}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Typography.Text strong style={{ display: 'block', fontSize: 15 }}>{d.name}</Typography.Text>
                      <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{d.sub}</Typography.Text>
                    </div>
                    <Radio.Group
                      optionType="button"
                      buttonStyle="solid"
                      size="large"
                      aria-label={`Attendance for ${d.name}`}
                      value={d.pBg === 'var(--color-brand)' ? 'P' : d.aBg === 'var(--kr-red-600)' ? 'A' : undefined}
                      onChange={e => v.markDriver({ currentTarget: { dataset: { id: d.id, v: e.target.value } } })}
                      options={[
                        { value: 'P', label: 'P' },
                        { value: 'A', label: 'A' },
                      ]}
                    />
                  </Flex>
                </Card>
              </React.Fragment>
            ))}
          </Flex>
        </div>
        <div>
          <Typography.Text type="secondary" strong style={{ display: 'block', marginBottom: 8, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Vehicle status
          </Typography.Text>
          <Card
            hoverable
            size="small"
            role="button"
            tabIndex={0}
            onClick={v.goIdle}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); v.goIdle(e); } }}
          >
            <Flex align="center" gap={12}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Typography.Text strong style={{ display: 'block', fontSize: 15 }}>{v.idleSummary}</Typography.Text>
                <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Idle vehicles and reasons are recorded in Vehicle idle status.</Typography.Text>
              </div>
              <Typography.Link strong style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Record →
              </Typography.Link>
            </Flex>
          </Card>
        </div>
      </Flex>
      <div style={{ position: 'sticky', bottom: 0, marginTop: 'auto', padding: '12px 16px 40px', background: '#fff', borderTop: '1px solid var(--border-default)' }}>
        <Button type="primary" size="large" block onClick={v.saveAttendance} style={v.bigBtn}>Save attendance</Button>
      </div>
    </Flex>
  </>
);

export default DailyAttendance;
