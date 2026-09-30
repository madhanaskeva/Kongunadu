import React from 'react';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { Alert, Badge, Button, Card, Col, Flex, Modal, Progress, Row, Statistic, Timeline, Typography } from 'antd';

// With VITE_GOOGLE_MAPS_API_KEY set the Maps Embed API is used; without it, the keyless embed
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const enc = encodeURIComponent;

const embedUrl = ({ origin, destination, place }) => {
  if (MAPS_KEY) {
    return origin
      ? `https://www.google.com/maps/embed/v1/directions?key=${MAPS_KEY}&origin=${enc(origin)}&destination=${enc(destination)}&mode=driving`
      : `https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=${enc(place)}&zoom=14`;
  }
  return origin
    ? `https://maps.google.com/maps?saddr=${enc(origin)}&daddr=${enc(destination)}&output=embed`
    : `https://maps.google.com/maps?q=${enc(place)}&z=14&output=embed`;
};

const openUrl = ({ origin, destination, place }) =>
  origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${enc(origin)}&destination=${enc(destination)}&travelmode=driving`
    : `https://www.google.com/maps/search/?api=1&query=${enc(place)}`;

const coords = l => (l && l.lat && l.lng ? `${l.lat},${l.lng}` : null);

// Google can't find names like "Yashoda Hospitals LOX Bank – Hyderabad", so route between places it
// can: the loading point's address and the city after the "–" of the first unloading stop
const inIndia = s => `${s}, India`;
const stopCity = s => {
  const first = String(s || '').split(/,\s*(?=[^,]*[–-])/)[0];
  const parts = first.split(/\s[–-]\s/);
  return (parts[1] || parts[0]).trim();
};

// Where to point the map: the open trip's loading point → unloading point, else the vehicle's
// "A → B" route, else its parked / service location
const mapTarget = (v, trip, tms, branchName) => {
  if (trip) {
    const l = tms.L[trip.loading];
    return { origin: inIndia((l && (l.address || l.name)) || branchName), destination: inIndia(stopCity(trip.unloading)) };
  }
  const parts = String(v.route || '').split('→').map(s => s.trim()).filter(Boolean);
  if (parts.length === 2) return { origin: inIndia(parts[0]), destination: inIndia(parts[1]) };
  const text = String(v.route || '').replace(/^(Parked at|Loading at|Unloading at|Service bay,)\s*/i, '');
  const loc = (tms.locations || []).find(l => text.toLowerCase().includes(l.name.split(' ')[0].toLowerCase()));
  return { place: coords(loc) || `${text}, ${branchName}` };
};

const timeline = (v, trip, tms) => {
  if (!trip) return [{ t: v.lastSeen, ev: `Last position · ${v.route}`, km: null }];
  if (trip.track && trip.track.points) return trip.track.points.map(([t, ev, km]) => ({ t, ev, km }));
  if (trip.id === 'T01') return tms.gpsLog || [];
  const l = tms.L[trip.loading] || {};
  const opened = String(trip.opened || '').replace(/^\d+ \w+ \d{4} /, '');
  return [
    { t: opened, ev: `Trip opened at ${l.name || 'loading point'}`, km: 0 },
    { t: v.lastSeen, ev: v.gps === 'Failed' ? 'Last GPS fix before signal loss' : 'Latest position update', km: trip.gpsKm },
  ];
};

const Stat = ({ label, value }) => (
  <Card size="small" variant="borderless" style={{ background: 'var(--surface-muted)' }} styles={{ body: { padding: '10px 12px' } }}>
    <Statistic groupSeparator=""
      title={label}
      value={value}
      styles={{
        title: { fontSize: 11, fontWeight: 600, marginBottom: 2 },
        content: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-heading)' },
      }}
    />
  </Card>
);

export const FleetTrackModal = ({ vehicle: v, trip, tms, onClose, onOpenTrip }) => {
  if (!v) return null;
  const target = mapTarget(v, trip, tms, v.branchName);
  const events = timeline(v, trip, tms);
  const pct = trip && trip.fixedKm ? Math.min(100, Math.round(((trip.gpsKm || 0) / trip.fixedKm) * 100)) : null;
  const gpsNote =
    v.gps === 'Failed'
      ? `No GPS fix since ${v.lastSeen}. The map shows the planned route, not the live position.`
      : v.gps === 'Weak'
      ? `GPS signal is weak. Last fix ${v.lastSeen}.`
      : null;

  return (
    <Modal
      open
      onCancel={onClose}
      width={1080}
      centered
      destroyOnHidden
      mask={{ closable: true }}
      className="tms-modal"
      title={
        <div>
          <div className="tms-kicker">GPS tracking</div>
          <Typography.Title level={4} style={{ margin: 0 }}>{`${v.number} · ${trip ? trip.number : v.status}`}</Typography.Title>
        </div>
      }
      styles={{
        mask: { backdropFilter: 'blur(3px)', backgroundColor: 'rgba(20, 32, 43, 0.55)' },
        // Padding lives on header/body/footer (not the container) so the map runs edge to edge.
        container: { padding: 0, overflow: 'hidden' },
        header: { padding: '20px 56px 16px 24px', margin: 0, borderBottom: '1px solid var(--border-default)' },
        body: { padding: 0, maxHeight: '75vh', overflowY: 'auto' },
        footer: { margin: 0, padding: '16px 24px', background: 'var(--surface-muted)', borderTop: '1px solid var(--border-default)' },
      }}
      footer={
        <Flex justify="space-between" align="center" gap={12} wrap>
          <Button type="link" href={openUrl(target)} target="_blank" rel="noreferrer" icon={<ExternalLink size={14} />} style={{ paddingInline: 0 }}>
            Open in Google Maps
          </Button>
          {trip && (
            <Button type="primary" onClick={() => onOpenTrip(trip.id)}>
              View trip details
            </Button>
          )}
        </Flex>
      }
    >
      {/* Map-specific stacking on phones: map on top, trip panel below. */}
      <style>{`
        @media (max-width: 600px) {
          .tms-track { min-height: 0 !important; }
          .tms-track-map { min-height: 260px !important; flex-basis: 100% !important; }
          .tms-track-panel { border-left: 0 !important; border-top: 1px solid var(--border-default); padding: 16px !important; }
        }
      `}</style>
      <Flex wrap className="tms-track" style={{ minHeight: 480 }}>
        {/* Map */}
        <div className="tms-track-map" style={{ flex: '1 1 560px', minHeight: '420px', position: 'relative', background: 'var(--surface-muted)' }}>
          <iframe
            title={`Map for ${v.number}`}
            src={embedUrl(target)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>

        {/* Trip panel */}
        <Flex
          vertical
          gap={16}
          className="tms-track-panel"
          style={{ flex: '1 1 300px', maxWidth: '100%', padding: 20, borderLeft: '1px solid var(--border-default)', boxSizing: 'border-box' }}
        >
          <Flex vertical gap={6}>
            <Badge
              color={v.gpsColor}
              text={
                <Typography.Text strong style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: v.gpsColor }}>
                  GPS {v.gps} · {v.lastSeen}
                </Typography.Text>
              }
            />
            <Flex gap={6} align="flex-start">
              <Navigation size={15} style={{ marginTop: 3, flexShrink: 0, color: 'var(--text-brand)' }} />
              <Typography.Text style={{ color: 'var(--text-heading)' }}>
                {trip ? `${(tms.L[trip.loading] || {}).name || '—'} → ${trip.unloading}` : v.route}
              </Typography.Text>
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              {v.type} · {v.branchName} · {v.driverName}
            </Typography.Text>
          </Flex>

          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Map shows the start and end points of the route. The truck's live position will be added when the GPS feed is connected.
          </Typography.Text>

          {gpsNote && <Alert type="warning" title={gpsNote} />}

          {trip ? (
            <>
              <Row gutter={[8, 8]}>
                <Col span={12}><Stat label="GPS distance" value={trip.gpsKm != null ? `${trip.gpsKm} km` : '—'} /></Col>
                <Col span={12}><Stat label="Fixed route" value={trip.fixedKm ? `${trip.fixedKm} km` : '—'} /></Col>
                <Col span={12}><Stat label="Open for" value={`${trip.hoursOpen} h`} /></Col>
                <Col span={12}><Stat label="Trip type" value={trip.type} /></Col>
              </Row>
              {pct != null && (
                <div>
                  <Flex justify="space-between">
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>Route covered</Typography.Text>
                    <Typography.Text strong style={{ fontSize: 12 }}>{pct}%</Typography.Text>
                  </Flex>
                  <Progress percent={pct} showInfo={false} strokeColor="var(--color-brand)" railColor="var(--kr-grey-100)" />
                </div>
              )}
            </>
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              No open trip on this vehicle. The map shows its last known location.
            </Typography.Text>
          )}

          {trip && trip.diversion && (
            <Alert
              type="error"
              title={`Route diversion · ${trip.diversion.offKm} km off ${trip.diversion.expected} at ${trip.diversion.at} (${trip.diversion.state})`}
            />
          )}

          <div>
            <Typography.Text type="secondary" strong style={{ display: 'block', fontSize: 12, marginBottom: 12 }}>
              GPS timeline
            </Typography.Text>
            <Timeline
              items={events.map((e, i) => {
                const last = i === events.length - 1;
                return {
                  key: i,
                  color: last ? 'green' : 'gray',
                  icon: last ? <MapPin size={14} style={{ color: 'var(--color-brand)' }} /> : undefined,
                  content: (
                    <>
                      <Typography.Text style={{ display: 'block', fontSize: 13, color: 'var(--text-heading)' }}>{e.ev}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {e.t}{e.km != null ? ` · ${e.km} km` : ''}{e.speed ? ` · ${e.speed} km/h` : ''}
                      </Typography.Text>
                    </>
                  ),
                };
              })}
            />
          </div>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default FleetTrackModal;
