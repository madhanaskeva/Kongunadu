import React from 'react';
import { Alert, Button, Checkbox, Collapse, Empty, Flex, Form, Select, Table, Tabs, Tag, Typography } from 'antd';
import { Minus } from 'lucide-react';

// The screen handlers read e.target.value (a string, as the old select gave);
// antd Select hands over the bare value, so it is passed on in that shape.
const asEvent = value => ({ target: { value: value == null ? '' : String(value) } });
// A value that is not one of the options shows the placeholder, as before.
const pick = (options, value) => ((options || []).some(o => String(o.value) === String(value)) ? value : undefined);
// Present / Absent / Not marked as antd Tag presets.
const ATT_TAG = { Present: 'success', Absent: 'error', 'Not marked': 'default' };

export const MarkAttendance = ({ v }) => (
  <>
    <Flex vertical style={{ flex: 1 }}>
      <Tabs
        aria-label="Attendance"
        centered
        activeKey={((v.attTabs || []).find(tb => tb.selected === 'true') || {}).id}
        onChange={key => v.setAttTab({ currentTarget: { dataset: { tab: key } } })}
        items={(v.attTabs || []).map(tb => ({ key: tb.id, label: tb.label }))}
        tabBarStyle={{ margin: 0, padding: '0 8px', background: '#fff' }}
      />
      {v.attTabMark ? (
        <>
          <Flex vertical gap={18} style={{ padding: 16 }}>
            <Form layout="vertical" requiredMark={false} component="div">
              <Form.Item label="Vehicle number" extra={v.amVehicleHint}>
                <Select
                  size="large"
                  placeholder={(v.amVehicleOptions || []).length ? 'Select vehicle' : 'None available'}
                  disabled={!(v.amVehicleOptions || []).length}
                  options={v.amVehicleOptions}
                  value={pick(v.amVehicleOptions, v.am.vehicle)}
                  onChange={val => v.setAmVehicle(asEvent(val))}
                />
              </Form.Item>
              <Form.Item label="Driver name" extra={v.amDriverHint}>
                <Select
                  mode="multiple"
                  size="large"
                  placeholder={(v.amDriverOptions || []).length ? 'Select driver' : 'None available'}
                  disabled={!(v.amDriverOptions || []).length}
                  options={v.amDriverOptions}
                  value={v.amSelectedDrivers || []}
                  onChange={v.setAmDrivers}
                  maxTagCount="responsive"
                  optionRender={option => {
                    const isSelected = (v.amSelectedDrivers || []).includes(option.value);
                    return (
                      <Flex align="center" gap={10} style={{ width: '100%', padding: '2px 0' }}>
                        <Checkbox checked={isSelected} style={{ pointerEvents: 'none' }} />
                        <span>{option.label}</span>
                      </Flex>
                    );
                  }}
                />
              </Form.Item>
              <Form.Item label="Vehicle status" extra={v.amStatusHint} style={{ marginBottom: 0 }}>
                <Select
                  size="large"
                  placeholder={(v.amStatusOptions || []).length ? 'Select status' : 'None available'}
                  disabled={!(v.amStatusOptions || []).length}
                  options={v.amStatusOptions}
                  value={pick(v.amStatusOptions, v.am.status)}
                  onChange={val => v.setAmStatus(asEvent(val))}
                />
              </Form.Item>
              {v.canAssignAm ? (
                <div style={{ marginTop: 12 }}>
                  <Button type="primary" ghost block onClick={v.assignAmDrivers}>
                    {v.assignAmLabel}
                  </Button>
                </div>
              ) : null}
            </Form>
            <div>
              <Flex justify="space-between" align="baseline" style={{ marginBottom: 8 }}>
                <Typography.Text type="secondary" strong style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Present today · {v.amRowCount}
                </Typography.Text>
                {v.showAttMonth ? (
                  <>
                    <Button type="link" size="small" onClick={v.goAttMonth}>
                      Month view →
                    </Button>
                  </>
                ) : null}
              </Flex>
              <Table
                size="small"
                bordered
                rowKey="id"
                pagination={false}
                scroll={{ x: 'max-content' }}
                dataSource={v.amRows || []}
                onRow={r => ({ style: { background: r.bg } })}
                locale={{ emptyText: 'No drivers marked yet. Pick a vehicle, driver and vehicle status above.' }}
                columns={[
                  { title: 'S.No', dataIndex: 'sno', key: 'sno', render: sno => <Typography.Text type="secondary" strong>{sno}</Typography.Text> },
                  { title: 'Vehicle number', dataIndex: 'vehicle', key: 'vehicle', render: vehicle => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, whiteSpace: 'nowrap' }}>{vehicle}</span> },
                  { title: 'Driver name', dataIndex: 'name', key: 'name', render: name => <Typography.Text strong>{name}</Typography.Text> },
                  {
                    title: 'Vehicle status',
                    key: 'vehStatus',
                    render: (_, r) => (
                      <Tag variant="filled" style={{ marginInlineEnd: 0, background: r.vsBg, color: r.vsFg }}>
                        {r.vehStatus}
                      </Tag>
                    ),
                  },
                  {
                    title: <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Remove</span>,
                    key: 'remove',
                    align: 'right',
                    render: (_, r) => (
                      <Button danger size="small" icon={<Minus size={16} strokeWidth={3} />} data-id={r.id} onClick={v.removeAm} aria-label={r.removeLabel} title="Remove" />
                    ),
                  },
                ]}
              />
            </div>
          </Flex>
          <div style={{ position: 'sticky', bottom: 0, marginTop: 'auto', padding: '12px 16px 40px', background: '#fff', borderTop: '1px solid var(--border-default)' }}>
            <Button type="primary" size="large" block onClick={v.saveAmEntry} style={v.bigBtn}>Save attendance</Button>
          </div>
        </>
      ) : null}
      {v.attTabMarked ? (
        <>
          <Flex vertical gap={12} style={{ padding: '16px 16px 40px' }}>
            {v.attUnsaved ? (
              <>
                <Alert
                  type="warning"
                  role="status"
                  title={v.attUnsavedText}
                  action={
                    <Button type="link" size="small" data-tab="mark" onClick={v.setAttTab}>
                      Save now →
                    </Button>
                  }
                />
              </>
            ) : null}
            <Flex justify="space-between" align="baseline">
              <Typography.Text type="secondary" strong style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Saved attendance · {v.savedDayCount} days
              </Typography.Text>
              {v.showAttMonth ? (
                <>
                  <Button type="link" size="small" onClick={v.goAttMonth}>
                    Month view →
                  </Button>
                </>
              ) : null}
            </Flex>
            {(v.savedDays || []).map((sd, sdIdx) => (
              <React.Fragment key={sdIdx}>
                <Collapse
                  expandIconPosition="end"
                  activeKey={sd.open ? [sd.day] : []}
                  onChange={() => v.toggleAttDay({ currentTarget: { dataset: { day: sd.day } } })}
                  style={{ background: '#fff', borderLeft: `4px solid ${sd.edge}` }}
                  items={[
                    {
                      key: sd.day,
                      styles: { body: { padding: 0 } },
                      label: (
                        <div style={{ minWidth: 0 }}>
                          <Flex align="center" gap={8}>
                            <Typography.Text strong style={{ fontSize: 15 }}>{sd.label}</Typography.Text>
                            {sd.isToday ? (
                              <>
                                <Tag color="green" variant="solid">Today</Tag>
                              </>
                            ) : null}
                          </Flex>
                          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 3, fontSize: 13 }}>{sd.savedLine}</Typography.Text>
                          <Flex wrap gap={6} style={{ marginTop: 8 }}>
                            <Tag color="success" style={{ marginInlineEnd: 0 }}>{sd.present} present</Tag>
                            <Tag color="error" style={{ marginInlineEnd: 0 }}>{sd.absent} absent</Tag>
                            {sd.unmarked ? (
                              <>
                                <Tag style={{ marginInlineEnd: 0 }}>{sd.unmarked} not marked</Tag>
                              </>
                            ) : null}
                          </Flex>
                        </div>
                      ),
                      children: (
                        <div>
                          {(sd.rows || []).map((r, rIdx) => (
                            <React.Fragment key={rIdx}>
                              <Flex align="center" gap={10} style={{ padding: '11px 14px', borderBottom: '1px solid var(--border-default)' }}>
                                <span style={{ flex: 1, minWidth: 0 }}>
                                  <Typography.Text strong style={{ display: 'block', fontSize: 15 }}>{r.name}</Typography.Text>
                                  <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{r.vehicle}</Typography.Text>
                                </span>
                                <Tag color={ATT_TAG[r.badge] || 'default'} style={{ marginInlineEnd: 0 }}>
                                  {r.badge}
                                </Tag>
                              </Flex>
                            </React.Fragment>
                          ))}
                        </div>
                      ),
                    },
                  ]}
                />
              </React.Fragment>
            ))}
            {v.savedDaysEmpty ? (
              <>
                <Empty
                  style={{ padding: '40px 20px' }}
                  description={
                    <>
                      <Typography.Title level={4} style={{ margin: 0 }}>No saved attendance yet</Typography.Title>
                      <Typography.Paragraph type="secondary" style={{ margin: '8px 0 0' }}>Mark drivers in Mark new attendance and tap Save attendance.</Typography.Paragraph>
                    </>
                  }
                />
              </>
            ) : null}
          </Flex>
        </>
      ) : null}
    </Flex>
  </>
);

export default MarkAttendance;
