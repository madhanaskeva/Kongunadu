import React, { useMemo, useState } from 'react';
import { Fuel, MapPin, ParkingSquare, Power, Warehouse, Wrench } from 'lucide-react';
import dayjs from 'dayjs';
import { Alert, Button, Card, Col, DatePicker, Flex, Form, Modal, Row, Statistic, Table, Tag, Tooltip, Typography } from 'antd';
import {
  ACTIVITY, GPS_GAP_MIN, IDLE_PLACE_KIND, IDLE_SPEED_KMH, PING_MIN, fmtDuration, vehicleActivity, withIdlePlaces,
} from '../../../utils/vehicleActivity';

const MAX_DAYS = 7;
const DT_FMT = 'DD MMM YYYY HH:mm';

export const ACTIVITY_TONE = {
  [ACTIVITY.RUNNING]: { color: 'var(--color-brand)', tag: 'processing' },
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
// Where an idle span happened: an icon for the kind of place, then its name.
const PLACE_ICON = { bunk: Fuel, loading: Warehouse, yard: ParkingSquare, service: Wrench, stop: MapPin };
export const IdlePlace = ({ place, compact = false }) => {
  const Icon = PLACE_ICON[place.kind] || MapPin;
  return (
    <Flex align="center" gap={6} style={{ marginTop: compact ? 0 : 3, paddingLeft: compact ? 0 : 16, minWidth: 0 }}>
      <Icon size={13} style={{ color: '#7A4300', flex: 'none' }} aria-hidden />
      <Typography.Text ellipsis={{ tooltip: `${IDLE_PLACE_KIND[place.kind]} · ${place.name}` }} style={{ fontSize: 12, color: 'var(--text-heading)' }}>
        <span style={{ color: 'var(--text-muted)' }}>{IDLE_PLACE_KIND[place.kind]} · </span>{place.name}
      </Typography.Text>
    </Flex>
  );
};

// Why it was idle, as the tracker reports it: the reason, then ignition and speed.
export const IdleReason = ({ reason, compact = false }) => (
  <Flex align="center" gap={6} wrap style={{ marginTop: compact ? 0 : 4, paddingLeft: compact ? 0 : 16 }}>
    <Tag color={reason.tone} style={{ marginInlineEnd: 0, fontSize: 11, lineHeight: '18px', fontWeight: 600 }}>{reason.label}</Tag>
    <Flex align="center" gap={4}>
      <Power size={11} style={{ color: reason.ignition ? 'var(--kr-green-700)' : 'var(--text-muted)' }} aria-hidden />
      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
        Ignition {reason.ignition ? 'on' : 'off'} · 0 km/h
      </Typography.Text>
    </Flex>
  </Flex>
);

// "Idle now" panel for a Fleet card: where the vehicle is standing, for how long,
// why, and the GPS fix that places it there.
export const IdleNowPanel = ({ span }) => {
  const { place, reason } = span;
  const Icon = PLACE_ICON[place.kind] || MapPin;
  const alert = reason.tone === 'error';
  const tone = alert
    ? { edge: 'var(--kr-red-600)', bg: 'var(--kr-red-50)', fg: 'var(--kr-red-700)' }
    : { edge: 'var(--kr-saffron-500)', bg: '#fff8ec', fg: '#7A4300' };
  return (
    <div
      role="status"
      style={{ borderRadius: 10, border: `1px solid ${tone.edge}`, borderLeft: `4px solid ${tone.edge}`, background: tone.bg, padding: '10px 12px' }}
    >
      {/* Headline: IDLE NOW and how long */}
      <Flex justify="space-between" align="center" gap={8}>
        <Flex align="center" gap={6}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: tone.edge, animation: 'tmsPulse 1.6s ease-in-out infinite' }} aria-hidden />
          <Typography.Text strong style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: tone.fg }}>Idle now</Typography.Text>
        </Flex>
        <Typography.Text strong style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: tone.fg, whiteSpace: 'nowrap' }}>
          {fmtDuration(span.minutes)}
        </Typography.Text>
      </Flex>

      {/* Where */}
      <Flex align="flex-start" gap={8} style={{ marginTop: 8 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: '#fff', border: `1px solid ${tone.edge}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <Icon size={15} style={{ color: tone.fg }} aria-hidden />
        </span>
        <div style={{ minWidth: 0 }}>
          <Typography.Text strong ellipsis={{ tooltip: place.name }} style={{ display: 'block', fontSize: 13.5, color: 'var(--text-heading)' }}>
            {place.name}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {IDLE_PLACE_KIND[place.kind]} · since {dayjs(span.start).format('HH:mm')}
            {place.limitMin ? ` · limit ${place.limitMin} min` : ''}
          </Typography.Text>
        </div>
      </Flex>

      {/* Why, and the tracker's reading */}
      <Flex align="center" gap={8} wrap style={{ marginTop: 8 }}>
        <Tag color={reason.tone} style={{ marginInlineEnd: 0, fontWeight: 700 }}>{reason.label}</Tag>
        <Flex align="center" gap={4}>
          <Power size={12} style={{ color: reason.ignition ? 'var(--kr-green-800)' : 'var(--text-muted)' }} aria-hidden />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>Ignition {reason.ignition ? 'on' : 'off'} · 0 km/h</Typography.Text>
        </Flex>
      </Flex>
      {place.note && (
        <Typography.Text style={{ display: 'block', fontSize: 12, marginTop: 6, color: 'var(--text-body)' }}>{place.note}</Typography.Text>
      )}

      {/* The GPS fix that confirms the place */}
      {place.lat && (
        <Flex align="center" gap={6} style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed rgba(0,0,0,0.12)' }}>
          <MapPin size={12} style={{ color: 'var(--color-brand)' }} aria-hidden />
          <Typography.Text style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-heading)' }}>
            {place.lat}, {place.lng}
          </Typography.Text>
          <Tag color="processing" style={{ marginInlineEnd: 0, marginLeft: 'auto', fontSize: 10.5, lineHeight: '16px' }}>GPS confirmed</Tag>
        </Flex>
      )}
    </div>
  );
};

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

export const VehicleActivityModal = ({ vehicle: v, tms, initialFrom, initialTo, onClose }) => {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  const tooLong = to.diff(from, 'day', true) > MAX_DAYS;
  const valid = to.isAfter(from) && !tooLong;
  const multiDay = !sameDay(from.valueOf(), Math.min(to.valueOf(), Date.now()));

  const { segments, summary } = useMemo(
    () => {
      if (!valid) return { segments: [], summary: null };
      const act = vehicleActivity(v, from.valueOf(), to.valueOf());
      return { ...act, segments: tms ? withIdlePlaces(act.segments, v, tms) : act.segments };
    },
    [v, tms, from, to, valid],
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
      title: 'Why idle',
      key: 'reason',
      width: 230,
      render: (_, s) => (s.reason ? <IdleReason reason={s.reason} compact /> : <Typography.Text type="secondary">—</Typography.Text>),
    },
    {
      title: 'Location',
      key: 'place',
      width: 260,
      render: (_, s) => (s.place ? <IdlePlace place={s.place} compact /> : <Typography.Text type="secondary">{s.state === ACTIVITY.RUNNING ? 'On the road' : '—'}</Typography.Text>),
    },
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
              <Col xs={12} sm={8} md={4}><Stat label="Running" value={fmtDuration(summary.running)} color="var(--kr-green-800)" /></Col>
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
              scroll={{ x: 990 }}
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
