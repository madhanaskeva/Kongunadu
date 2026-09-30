import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Alert, Button, Card, Col, DatePicker, Flex, Form, Modal, Row, Statistic, Table, Tag, Tooltip, Typography } from 'antd';
import {
  ACTIVITY, GPS_GAP_MIN, IDLE_SPEED_KMH, PING_MIN, fmtDuration, vehicleActivity,
} from '../../../utils/vehicleActivity';

const MAX_DAYS = 7;
const DT_FMT = 'DD MMM YYYY HH:mm';

export const ACTIVITY_TONE = {
  [ACTIVITY.RUNNING]: { color: 'var(--kr-green-600)', tag: 'success' },
  [ACTIVITY.IDLE]: { color: 'var(--kr-saffron-500)', tag: 'warning' },
  [ACTIVITY.NO_GPS]: { color: 'var(--kr-grey-300)', tag: 'default' },
};

const sameDay = (a, b) => dayjs(a).isSame(dayjs(b), 'day');
// "09:00 – 11:00", with dates only when the span or range crosses midnight.
const spanText = (s, multiDay) => {
  const a = dayjs(s.start), b = dayjs(s.end);
  if (!multiDay) return `${a.format('HH:mm')} – ${b.format('HH:mm')}`;
  return sameDay(s.start, s.end)
    ? `${a.format('DD MMM')} · ${a.format('HH:mm')} – ${b.format('HH:mm')}`
    : `${a.format('DD MMM HH:mm')} – ${b.format('DD MMM HH:mm')}`;
};

// A compact strip: one coloured block per span, sized by its share of the range.
export const ActivityBar = ({ segments, height = 10, multiDay = false }) => {
  const total = segments.reduce((a, s) => a + (s.end - s.start), 0) || 1;
  return (
    <Flex style={{ height, borderRadius: height / 2, overflow: 'hidden', background: 'var(--kr-grey-100)' }}>
      {segments.map((s, i) => (
        <Tooltip key={i} title={`${s.state} · ${spanText(s, multiDay)} · ${fmtDuration(s.minutes)}`}>
          <div
            style={{
              flex: `${(s.end - s.start) / total} 0 0`,
              background: ACTIVITY_TONE[s.state].color,
              minWidth: 1,
            }}
          />
        </Tooltip>
      ))}
    </Flex>
  );
};

const Legend = () => (
  <Flex gap={14} wrap>
    {Object.values(ACTIVITY).map(st => (
      <Flex key={st} align="center" gap={6}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: ACTIVITY_TONE[st].color }} />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{st}</Typography.Text>
      </Flex>
    ))}
  </Flex>
);

const Stat = ({ label, value, color }) => (
  <Card size="small" variant="borderless" style={{ background: 'var(--surface-muted)', height: '100%' }} styles={{ body: { padding: '10px 12px' } }}>
    <Statistic
      groupSeparator=""
      title={label}
      value={value}
      styles={{
        title: { fontSize: 11, fontWeight: 600, marginBottom: 2 },
        content: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: color || 'var(--text-heading)' },
      }}
    />
  </Card>
);

export const VehicleActivityModal = ({ vehicle: v, initialFrom, initialTo, onClose }) => {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  const tooLong = to.diff(from, 'day', true) > MAX_DAYS;
  const valid = to.isAfter(from) && !tooLong;
  const multiDay = !sameDay(from.valueOf(), Math.min(to.valueOf(), Date.now()));

  const { segments, summary } = useMemo(
    () => (valid ? vehicleActivity(v, from.valueOf(), to.valueOf()) : { segments: [], summary: null }),
    [v, from, to, valid],
  );

  const preset = (a, b) => { setFrom(a); setTo(b); };
  const now = dayjs();
  const presets = [
    ['Today', now.startOf('day'), now],
    ['Yesterday', now.subtract(1, 'day').startOf('day'), now.subtract(1, 'day').endOf('day')],
    ['Last 24 h', now.subtract(24, 'hour'), now],
    ['Last 7 days', now.subtract(7, 'day'), now],
  ];

  // Axis ticks along the bar: start, quarters, end.
  const end = Math.min(to.valueOf(), Date.now());
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => dayjs(from.valueOf() + f * (end - from.valueOf())));

  const columns = [
    { title: 'Time', key: 'time', render: (_, s) => <Typography.Text strong style={{ whiteSpace: 'nowrap' }}>{spanText(s, multiDay)}</Typography.Text> },
    {
      title: 'Vehicle status',
      key: 'state',
      render: (_, s) => (
        <Tag color={ACTIVITY_TONE[s.state].tag} style={{ fontWeight: 700, marginInlineEnd: 0 }}>{s.state}</Tag>
      ),
    },
    { title: 'Duration', key: 'dur', render: (_, s) => fmtDuration(s.minutes) },
    {
      title: 'Distance',
      key: 'km',
      align: 'right',
      render: (_, s) => (s.state === ACTIVITY.RUNNING ? `${s.km} km` : <Typography.Text type="secondary">—</Typography.Text>),
    },
  ];

  return (
    <Modal
      open
      onCancel={onClose}
      footer={null}
      width={860}
      centered
      destroyOnHidden
      className="tms-modal"
      title={
        <div>
          <div className="tms-kicker">Activity timeline</div>
          <Typography.Title level={4} style={{ margin: 0 }}>{v.number} · {v.status}</Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>{v.type} · {v.branchName} · {v.driverName}</Typography.Text>
        </div>
      }
    >
      <Flex vertical gap={16}>
        {/* Range */}
        <Form layout="vertical">
          <Flex gap={12} wrap align="flex-end">
            <Form.Item label="From" style={{ marginBottom: 0, width: 200 }}>
              <DatePicker
                showTime={{ format: 'HH:mm' }}
                format={DT_FMT}
                allowClear={false}
                value={from}
                disabledDate={d => d.isAfter(to, 'day') || d.isAfter(now, 'day')}
                onChange={d => d && setFrom(d)}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="To" style={{ marginBottom: 0, width: 200 }}>
              <DatePicker
                showTime={{ format: 'HH:mm' }}
                format={DT_FMT}
                allowClear={false}
                value={to}
                disabledDate={d => d.isBefore(from, 'day') || d.isAfter(now, 'day')}
                onChange={d => d && setTo(d)}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Flex gap={6} wrap>
              {presets.map(([label, a, b]) => (
                <Button key={label} size="small" onClick={() => preset(a, b)}>{label}</Button>
              ))}
            </Flex>
          </Flex>
        </Form>

        {!to.isAfter(from) && <Alert type="warning" showIcon title="The To time must be after the From time." />}
        {tooLong && <Alert type="warning" showIcon title={`Pick a range of ${MAX_DAYS} days or less.`} />}

        {valid && summary && (
          <>
            <Row gutter={[8, 8]}>
              <Col xs={12} sm={8} md={4}><Stat label="Running" value={fmtDuration(summary.running)} color="var(--kr-green-700)" /></Col>
              <Col xs={12} sm={8} md={4}><Stat label="Idle" value={fmtDuration(summary.idle)} color="#7A4300" /></Col>
              <Col xs={12} sm={8} md={4}><Stat label="No GPS" value={fmtDuration(summary.noGps)} /></Col>
              <Col xs={12} sm={8} md={4}><Stat label="Idle stops" value={summary.idleStops} /></Col>
              <Col xs={12} sm={8} md={4}><Stat label="Longest idle" value={summary.longestIdle ? fmtDuration(summary.longestIdle) : '—'} /></Col>
              <Col xs={12} sm={8} md={4}><Stat label="Distance" value={`${summary.km} km`} /></Col>
            </Row>

            {/* Compact strip across the whole range */}
            <Flex vertical gap={6}>
              <ActivityBar segments={segments} height={18} multiDay={multiDay} />
              <Flex justify="space-between">
                {ticks.map((t, i) => (
                  <Typography.Text key={i} type="secondary" style={{ fontSize: 11 }}>
                    {multiDay ? t.format('DD MMM HH:mm') : t.format('HH:mm')}
                  </Typography.Text>
                ))}
              </Flex>
              <Legend />
            </Flex>

            {/* Tabular timeline */}
            <Table
              size="small"
              columns={columns}
              dataSource={segments.map((s, i) => ({ ...s, _key: i }))}
              rowKey="_key"
              pagination={segments.length > 12 ? { pageSize: 12, showSizeChanger: false, size: 'small' } : false}
              scroll={{ x: 520 }}
            />

            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Built from GPS pings every {PING_MIN} min: above {IDLE_SPEED_KMH} km/h is Running, at or below is Idle, and no ping
              for more than {GPS_GAP_MIN} min is shown as No GPS. Pings are simulated until the live GPS feed is connected.
            </Typography.Text>
          </>
        )}
      </Flex>
    </Modal>
  );
};

export default VehicleActivityModal;
