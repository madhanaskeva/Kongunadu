import React, { useMemo } from 'react';
import { Clock, ExternalLink, MapPin, Route, Truck, User } from 'lucide-react';
import dayjs from 'dayjs';
import { Alert, Button, Col, Descriptions, Flex, Modal, Progress, Row, Tag, Typography } from 'antd';
import { ACTIVITY, IDLE_PLACE_KIND, fmtDuration, vehicleActivity, withIdlePlaces } from '../../../utils/vehicleActivity';
import { ENROUTE_LABEL } from '../../../utils/tripStatus';
import { ActivityBar, PLACE_ICON } from './VehicleActivityModal';

// Fleet & GPS › Idle: one vehicle's stop in full — where it stands, since when,
// why, the trip it is on, and every idle stop it has made today.

const ALERT_TONE = { edge: 'var(--kr-red-600)', bg: 'var(--kr-red-50)', fg: 'var(--kr-red-700)' };
const IDLE_TONE = { edge: 'var(--kr-saffron-500)', bg: '#fff8ec', fg: '#7A4300' };

const SectionTitle = ({ children, extra }) => (
  <Flex justify="space-between" align="center" gap={8} style={{ marginBottom: 8 }}>
    <Typography.Text strong style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
      {children}
    </Typography.Text>
    {extra}
  </Flex>
);

export const IdleDetailModal = ({ vehicle: v, tms, categoryLabel, onClose, onTrack, onActivity, onOpenTrip }) => {
  const now = dayjs();
  const { spans, summary } = useMemo(() => {
    const act = vehicleActivity(v, now.startOf('day').valueOf(), now.valueOf());
    return { spans: withIdlePlaces(act.segments, v, tms), summary: act.summary };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, tms]);

  const last = spans[spans.length - 1];
  const idleNow = last && last.state === ACTIVITY.IDLE ? last : null;
  const idleStops = spans.filter(s => s.state === ACTIVITY.IDLE).reverse();
  const trip = v.openTrip;

  const place = idleNow && idleNow.place;
  const reason = idleNow && idleNow.reason;
  const tone = reason && reason.tone === 'error' ? ALERT_TONE : IDLE_TONE;
  const PlaceIcon = (place && PLACE_ICON[place.kind]) || MapPin;
  const limit = place && place.limitMin;
  const over = limit && idleNow.minutes > limit ? idleNow.minutes - limit : 0;
  const mapsUrl = place && place.lat
    ? `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`
    : place ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}` : null;
  const source = v.gpsIdle && v.gpsIdle.fromTrip ? 'Supervisor app · trip stage' : v.gpsIdle ? 'GPS tracker report' : 'GPS pings';

  const name = (map, id) => ((tms[map] || {})[id] || {}).name;

  // Under maintenance: the latest trip that took the vehicle to the service bay.
  const inService = v.idleCat === 'maintenance' || v.status === 'Maintenance';
  const serviceTrip = inService
    ? (tms.trips || []).filter(t => t.vehicle === v.id && t.reason === 'Maintenance')
      .sort((a, b) => (Date.parse(b.opened) || 0) - (Date.parse(a.opened) || 0))[0]
    : null;

  return (
    <Modal
      open
      onCancel={onClose}
      width={760}
      centered
      destroyOnHidden
      className="tms-modal"
      title={
        <Flex align="flex-start" gap={12}>
          <span className="fl-card-icon" style={{ '--fl-tone-bg': tone.bg, '--fl-tone-fg': tone.fg }} aria-hidden>
            <Truck size={18} strokeWidth={2.2} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="tms-kicker">Idle details{categoryLabel ? ` · ${categoryLabel}` : ''}</div>
            <Typography.Title level={4} style={{ margin: 0 }}>{v.number}</Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>{v.type} · {v.branchName} · {v.driverName}</Typography.Text>
          </div>
        </Flex>
      }
      footer={
        <Flex gap={8} justify="flex-end" wrap>
          <Button icon={<MapPin size={14} />} onClick={onTrack}>Track on map</Button>
          <Button icon={<Clock size={14} />} onClick={onActivity}>Activity timeline</Button>
          <Button type="primary" onClick={onClose}>Close</Button>
        </Flex>
      }
    >
      <Flex vertical gap={18}>
        {idleNow ? (
          /* 1 · The stop it is in now */
          <div style={{ borderRadius: 12, border: `1px solid ${tone.edge}`, borderLeft: `5px solid ${tone.edge}`, background: tone.bg, padding: 16 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={9}>
                <Flex align="center" gap={6}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: tone.edge, animation: 'tmsPulse 1.6s ease-in-out infinite' }} aria-hidden />
                  <Typography.Text strong style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: tone.fg }}>Idle now</Typography.Text>
                </Flex>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, lineHeight: 1.15, color: tone.fg }}>
                  {fmtDuration(idleNow.minutes)}
                </div>
                <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
                  Since {dayjs(idleNow.start).format('HH:mm')} · now {now.format('HH:mm')}
                </Typography.Text>
              </Col>
              <Col xs={24} sm={15}>
                <Flex align="flex-start" gap={10}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', border: `1px solid ${tone.edge}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <PlaceIcon size={17} style={{ color: tone.fg }} aria-hidden />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <Typography.Text strong style={{ display: 'block', fontSize: 15, color: 'var(--text-heading)' }}>{place.name}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>{IDLE_PLACE_KIND[place.kind]}</Typography.Text>
                    <Flex align="center" gap={8} wrap style={{ marginTop: 8 }}>
                      <Tag color={reason.tone} style={{ marginInlineEnd: 0, fontWeight: 700 }}>{reason.label}</Tag>
                    </Flex>
                  </div>
                </Flex>
              </Col>
            </Row>

            {/* Halt limit at this place, e.g. a fuel bunk */}
            {limit ? (
              <div style={{ marginTop: 14 }}>
                <Flex justify="space-between" gap={8}>
                  <Typography.Text style={{ fontSize: 12 }}>Allowed halt {fmtDuration(limit)}</Typography.Text>
                  <Typography.Text strong style={{ fontSize: 12, color: over ? 'var(--kr-red-700)' : 'var(--good-700)' }}>
                    {over ? `Over by ${fmtDuration(over)}` : `${fmtDuration(limit - idleNow.minutes)} left`}
                  </Typography.Text>
                </Flex>
                <Progress
                  percent={Math.min(100, Math.round((idleNow.minutes / limit) * 100))}
                  showInfo={false}
                  size="small"
                  strokeColor={over ? 'var(--kr-red-600)' : 'var(--kr-saffron-500)'}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <Alert
            type="info"
            showIcon
            title={v.gps === 'Pending' ? 'No GPS device fitted, so there is no live stop to show.' : 'GPS shows no stop in progress right now.'}
            description={`Last known position: ${v.route}${v.lastSeen && v.lastSeen !== '—' ? ` · ${v.lastSeen}` : ''}`}
          />
        )}

        {/* 2 · Stop details */}
        {idleNow && (
          <div>
            <SectionTitle>Stop details</SectionTitle>
            <Descriptions
              size="small"
              bordered
              column={{ xs: 1, sm: 2 }}
              items={[
                { key: 'place', label: 'Location', children: place.name },
                { key: 'kind', label: 'Type of place', children: IDLE_PLACE_KIND[place.kind] },
                { key: 'since', label: 'Idle since', children: dayjs(idleNow.start).format('DD MMM YYYY, HH:mm') },
                { key: 'dur', label: 'Idle for', children: fmtDuration(idleNow.minutes) },
                {
                  key: 'fix',
                  label: 'GPS fix',
                  children: place.lat ? (
                    <Flex align="center" gap={8} wrap>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{place.lat}, {place.lng}</span>
                      <Tag color="processing" style={{ marginInlineEnd: 0 }}>GPS confirmed</Tag>
                    </Flex>
                  ) : <Typography.Text type="secondary">No coordinates in the masters</Typography.Text>,
                },
                {
                  key: 'map',
                  label: 'Map',
                  children: (
                    <Typography.Link href={mapsUrl} target="_blank" rel="noreferrer">
                      Open in Google Maps <ExternalLink size={12} style={{ verticalAlign: -1 }} />
                    </Typography.Link>
                  ),
                },
                { key: 'src', label: 'Source', children: source },
                { key: 'seen', label: 'Last GPS ping', children: v.lastSeen },
              ]}
            />
            {place.note && (
              <Alert type={reason.tone === 'error' ? 'error' : 'warning'} showIcon style={{ marginTop: 10 }} title={place.note} />
            )}
          </div>
        )}

        {/* 3 · Maintenance: where it is being serviced and the movement that took it there */}
        {inService && (
          <div>
            <SectionTitle extra={serviceTrip && onOpenTrip && (
              <Button size="small" type="link" onClick={() => onOpenTrip(serviceTrip.id)} style={{ paddingInline: 0 }}>Open movement →</Button>
            )}>
              Maintenance
            </SectionTitle>
            <Descriptions
              size="small"
              bordered
              column={{ xs: 1, sm: 2 }}
              items={[
                { key: 'bay', label: 'Service location', children: v.route || '—' },
                { key: 'status', label: 'Status', children: <Tag color="cyan" style={{ marginInlineEnd: 0 }}>Under maintenance</Tag> },
                { key: 'stood', label: 'Standing today', children: idleNow ? `${fmtDuration(idleNow.minutes)} · since ${dayjs(idleNow.start).format('HH:mm')}` : '—' },
                { key: 'odo', label: 'Odometer', children: v.odometer ? `${Number(v.odometer).toLocaleString('en-IN')} km` : '—' },
                ...(serviceTrip ? [
                  { key: 'mv', label: 'Moved in by', children: <Typography.Text strong>{serviceTrip.number}</Typography.Text> },
                  { key: 'mvwhen', label: 'Reached service bay', children: serviceTrip.closed || serviceTrip.opened || '—' },
                  { key: 'mvroute', label: 'Movement', span: { xs: 1, sm: 2 }, children: `${name('L', serviceTrip.loading) || serviceTrip.from || '—'} → ${serviceTrip.unloading || '—'}${serviceTrip.odoKm || serviceTrip.gpsKm ? ` · ${serviceTrip.odoKm || serviceTrip.gpsKm} km` : ''}` },
                ] : []),
              ]}
            />
          </div>
        )}

        {/* 4 · The open trip, as the supervisor app holds it */}
        <div>
          <SectionTitle extra={trip && onOpenTrip && (
            <Button size="small" type="link" onClick={() => onOpenTrip(trip.id)} style={{ paddingInline: 0 }}>Open trip →</Button>
          )}>
            Trip
          </SectionTitle>
          {trip ? (
            <Descriptions
              size="small"
              bordered
              column={{ xs: 1, sm: 2 }}
              items={[
                { key: 'no', label: 'Trip number', children: <Typography.Text strong>{trip.number}</Typography.Text> },
                { key: 'stage', label: 'Stage', children: <Tag style={{ marginInlineEnd: 0 }}>{trip.stage || ENROUTE_LABEL}</Tag> },
                { key: 'client', label: 'Client', children: name('C', trip.client) || '—' },
                { key: 'opened', label: 'Opened', children: trip.opened || '—' },
                {
                  key: 'route',
                  label: 'Route',
                  span: { xs: 1, sm: 2 },
                  children: (
                    <Flex align="center" gap={6} wrap>
                      <Route size={13} style={{ color: 'var(--text-muted)' }} aria-hidden />
                      <span>{name('L', trip.loading) || trip.from || '—'}</span>
                      <span style={{ color: 'var(--text-muted)' }}>→</span>
                      <span>{trip.unloading || '—'}</span>
                    </Flex>
                  ),
                },
                { key: 'sup', label: 'Supervisor', children: name('S', trip.supervisor) || '—' },
                {
                  key: 'drv',
                  label: 'Driver',
                  children: (
                    <Flex align="center" gap={6}><User size={13} style={{ color: 'var(--text-muted)' }} aria-hidden />{name('D', trip.driver) || v.driverName}</Flex>
                  ),
                },
              ]}
            />
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              {inService ? 'No open trip · the vehicle is in for maintenance.' : 'No open trip · the vehicle is parked without business.'}
            </Typography.Text>
          )}
        </div>

        {/* 5 · Every idle stop today, latest first */}
        <div>
          <SectionTitle extra={
            <Flex gap={12}>
              <Typography.Text style={{ fontSize: 12, color: 'var(--good-700)', fontWeight: 700 }}>Run {fmtDuration(summary.running)}</Typography.Text>
              <Typography.Text style={{ fontSize: 12, color: '#7A4300', fontWeight: 700 }}>Idle {fmtDuration(summary.idle)}</Typography.Text>
            </Flex>
          }>
            Idle stops today · {idleStops.length}
          </SectionTitle>
          {spans.length > 0 && <ActivityBar segments={spans} height={10} />}
          <Flex vertical style={{ marginTop: 10, border: '1px solid var(--border-default)', borderRadius: 10, overflow: 'hidden' }}>
            {idleStops.length === 0 ? (
              <Typography.Text type="secondary" style={{ padding: 12, fontSize: 12.5 }}>No idle stops recorded today.</Typography.Text>
            ) : idleStops.map((s, i) => {
              const Icon = PLACE_ICON[s.place.kind] || MapPin;
              const current = s === idleNow;
              return (
                <Flex
                  key={s.start}
                  align="center"
                  gap={10}
                  wrap
                  style={{ padding: '9px 12px', borderTop: i ? '1px solid var(--border-default)' : 'none', background: current ? tone.bg : undefined }}
                >
                  <Typography.Text strong style={{ fontSize: 12.5, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', width: 96 }}>
                    {dayjs(s.start).format('HH:mm')} – {current ? 'now' : dayjs(s.end).format('HH:mm')}
                  </Typography.Text>
                  <Flex align="center" gap={6} style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <Icon size={14} style={{ color: '#7A4300', flex: 'none' }} aria-hidden />
                    <Typography.Text ellipsis={{ tooltip: s.place.name }} style={{ fontSize: 12.5 }}>{s.place.name}</Typography.Text>
                  </Flex>
                  <Tag color={s.reason.tone} style={{ marginInlineEnd: 0, fontSize: 11 }}>{s.reason.label}</Tag>
                  <Typography.Text strong style={{ fontSize: 12.5, whiteSpace: 'nowrap', minWidth: 64, textAlign: 'right', color: current ? tone.fg : 'var(--text-heading)' }}>
                    {fmtDuration(s.minutes)}
                  </Typography.Text>
                </Flex>
              );
            })}
          </Flex>
        </div>
      </Flex>
    </Modal>
  );
};

export default IdleDetailModal;
