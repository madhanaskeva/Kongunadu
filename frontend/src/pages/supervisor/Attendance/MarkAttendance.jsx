import React from 'react';
import { Alert, Button, Collapse, Divider, Empty, Flex, Form, Radio, Select, Table, Tabs, Tag, Typography } from 'antd';
import { Minus, Users } from 'lucide-react';

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
            {/* The crew Head Office set for this branch: how many drivers and helpers one vehicle takes */}
            <Alert
              type="info"
              showIcon
              icon={<Users size={16} />}
              title={<span><strong>{v.crewLabel}</strong> per vehicle</span>}
              description={v.crewText}
            />
            {(v.crewIssues || []).length ? (
              <Alert type="error" showIcon title="Fix the crew before saving" description={v.crewIssues.join(' ')} />
            ) : null}
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
              <Form.Item
                label="Driver availability"
                validateStatus={v.amShowErr && !v.am.driverAvailability ? 'error' : undefined}
                help={v.amShowErr && !v.am.driverAvailability ? 'Select driver availability.' : undefined}
              >
                <Radio.Group
                  size="large"
                  disabled={!v.am.vehicle}
                  value={v.am.driverAvailability || undefined}
                  onChange={e => v.setAmDriverAvailability(asEvent(e?.target?.value || e))}
                  className="sv-avail-radio-group"
                >
                  <Radio
                    value="Available"
                    className={`sv-avail-radio ${v.am.driverAvailability === 'Available' ? 'is-available-selected' : ''}`}
                  >
                    Available
                  </Radio>
                  <Radio
                    value="Not available"
                    className={`sv-avail-radio ${v.am.driverAvailability === 'Not available' ? 'is-not-available-selected' : ''}`}
                  >
                    Not available
                  </Radio>
                </Radio.Group>
              </Form.Item>
              {v.am.driverAvailability === 'Available' ? (
                <>
                  {/* One field per seat in the branch's crew (Branch Master); each field holds one person. */}
                  <Typography.Text type="secondary" style={{ display: 'block', margin: '-8px 0 12px', fontSize: 13 }}>{v.amCrewHint}</Typography.Text>
                  {(v.amSeats || []).map(seat => {
                    const missing = v.amShowErr && !seat.value;
                    return (
                      <Form.Item
                        key={seat.key}
                        label={seat.label}
                        validateStatus={missing ? 'error' : undefined}
                        help={missing ? (seat.absent ? `Pick a replacement for ${seat.absent.name.replace(/\.$/, '')}.` : `Select a ${seat.helper ? 'helper' : 'driver'}.`) : undefined}
                      >
                        {seat.absent ? (
                          <Flex align="center" justify="space-between" gap={8} style={{ marginBottom: 8, padding: '8px 12px', background: 'var(--kr-red-100)', borderRadius: 8 }}>
                            <Flex align="center" gap={8} style={{ minWidth: 0 }}>
                              <Typography.Text strong delete style={{ color: 'var(--kr-red-800)' }}>{seat.absent.name}</Typography.Text>
                              <Tag color="error" style={{ marginInlineEnd: 0 }}>Absent</Tag>
                            </Flex>
                            <Button type="link" size="small" onClick={() => v.undoSeatAbsent(seat)}>Undo</Button>
                          </Flex>
                        ) : null}
                        {seat.absent ? (
                          <Typography.Text type="secondary" strong style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>Replacement {seat.helper ? 'helper' : 'driver'}</Typography.Text>
                        ) : null}
                        <Flex gap={8} align="center">
                          <Select
                            size="large"
                            showSearch
                            optionFilterProp="label"
                            style={{ flex: 1, minWidth: 0 }}
                            placeholder={seat.placeholder}
                            disabled={v.amSeatsDisabled}
                            options={seat.options}
                            value={seat.value || undefined}
                            onChange={val => v.setSeat(seat, val)}
                            notFoundContent={<Typography.Text type="secondary">No free {seat.helper ? 'helper' : 'driver'} today</Typography.Text>}
                            popupRender={menu => (
                              <>
                                {menu}
                                <Divider style={{ margin: '4px 0' }} />
                                <Button type="text" block onMouseDown={e => e.preventDefault()} onClick={() => v.requestSeat(seat)} style={{ justifyContent: 'flex-start', fontWeight: 700, color: 'var(--color-brand)' }}>
                                  + Request new {seat.helper ? 'helper' : 'driver'}
                                </Button>
                              </>
                            )}
                          />
                          {seat.canAbsent ? (
                            <Button danger size="large" onClick={() => v.markSeatAbsent(seat)} style={{ flex: 'none' }}>Mark absent</Button>
                          ) : null}
                        </Flex>
                      </Form.Item>
                    );
                  })}
                </>
              ) : null}
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
                  {(v.amErrors || []).length ? (
                    <Alert type="error" showIcon style={{ marginBottom: 10 }} title="Complete the crew" description={v.amErrors.join(' ')} />
                  ) : null}
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
                locale={{ emptyText: 'No crew marked yet. Pick a vehicle, fill each crew field and the vehicle status above.' }}
                columns={[
                  { title: 'S.No', dataIndex: 'sno', key: 'sno', render: sno => <Typography.Text type="secondary" strong>{sno}</Typography.Text> },
                  { title: 'Vehicle number', dataIndex: 'vehicle', key: 'vehicle', render: vehicle => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, whiteSpace: 'nowrap' }}>{vehicle}</span> },
                  {
                    title: 'Name',
                    dataIndex: 'name',
                    key: 'name',
                    render: (name, r) => (
                      <span>
                        <Typography.Text strong delete={r.badge === 'Absent'}>{name}</Typography.Text>
                        {r.badge === 'Absent' ? <Tag color="error" style={{ marginInlineStart: 6, marginInlineEnd: 0 }}>Absent</Tag> : null}
                        {r.note ? <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{r.note}</Typography.Text> : null}
                      </span>
                    ),
                  },
                  { title: 'Role', dataIndex: 'role', key: 'role', render: role => <Tag color={role === 'Helper' ? 'cyan' : 'blue'} style={{ marginInlineEnd: 0 }}>{role}</Tag> },
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
