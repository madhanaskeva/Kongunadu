import React from 'react';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import Modal from '../../../components/common/Modal';

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
  <div style={{ background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</div>
    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: 'var(--text-heading)', marginTop: '2px' }}>{value}</div>
  </div>
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
      isOpen
      onClose={onClose}
      subtitle="GPS tracking"
      title={`${v.number} · ${trip ? trip.number : v.status}`}
      maxWidth="1080px"
      bodyStyle={{ padding: 0 }}
      footerStyle={{ flexWrap: 'wrap' }}
      footer={
        <>
          <a
            href={openUrl(target)}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-brand)', marginRight: 'auto', whiteSpace: 'nowrap' }}
          >
            <ExternalLink size={14} /> Open in Google Maps
          </a>
          {trip && (
            <button
              type="button"
              onClick={() => onOpenTrip(trip.id)}
              style={{
                all: 'unset', cursor: 'pointer', padding: '0 16px', height: '36px', display: 'inline-flex', alignItems: 'center',
                borderRadius: 'var(--radius-md)', background: 'var(--color-brand)', color: '#fff', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap',
              }}
            >
              View trip details
            </button>
          )}
        </>
      }
    >
      <style>{`
        @media (max-width: 600px) {
          .tms-track { min-height: 0 !important; }
          .tms-track-map { min-height: 260px !important; flex-basis: 100% !important; }
          .tms-track-panel { border-left: 0 !important; border-top: 1px solid var(--border-default); padding: 16px !important; }
        }
      `}</style>
      <div className="tms-track" style={{ display: 'flex', flexWrap: 'wrap', minHeight: '480px' }}>
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
        <div className="tms-track-panel" style={{ flex: '1 1 300px', maxWidth: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '1px solid var(--border-default)', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: v.gpsColor }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: v.gpsColor }} />
              GPS {v.gps} · {v.lastSeen}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-heading)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
              <Navigation size={15} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--text-brand)' }} />
              {trip ? `${(tms.L[trip.loading] || {}).name || '—'} → ${trip.unloading}` : v.route}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {v.type} · {v.branchName} · {v.driverName}
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Map shows the start and end points of the route. The truck's live position will be added when the GPS feed is connected.
          </div>

          {gpsNote && (
            <div style={{ fontSize: '13px', padding: '8px 10px', background: 'var(--color-hazard-soft)', borderRadius: 'var(--radius-md)', color: '#7A4300' }}>
              {gpsNote}
            </div>
          )}

          {trip ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <Stat label="GPS distance" value={trip.gpsKm != null ? `${trip.gpsKm} km` : '—'} />
                <Stat label="Fixed route" value={trip.fixedKm ? `${trip.fixedKm} km` : '—'} />
                <Stat label="Open for" value={`${trip.hoursOpen} h`} />
                <Stat label="Trip type" value={trip.type} />
              </div>
              {pct != null && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    <span>Route covered</span>
                    <strong style={{ color: 'var(--text-heading)' }}>{pct}%</strong>
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', background: 'var(--kr-grey-100)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-brand)' }} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No open trip on this vehicle. The map shows its last known location.</div>
          )}

          {trip && trip.diversion && (
            <div style={{ fontSize: '13px', padding: '8px 10px', background: 'var(--kr-red-50)', border: '1px solid var(--kr-red-100)', borderRadius: 'var(--radius-md)', color: 'var(--kr-red-800)' }}>
              Route diversion · {trip.diversion.offKm} km off {trip.diversion.expected} at {trip.diversion.at} ({trip.diversion.state})
            </div>
          )}

          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>GPS timeline</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {events.map((e, i) => {
                const last = i === events.length - 1;
                return (
                  <div key={i} style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {last ? (
                        <MapPin size={14} style={{ color: 'var(--color-brand)', flexShrink: 0 }} />
                      ) : (
                        <span style={{ width: '8px', height: '8px', margin: '3px', borderRadius: '50%', background: 'var(--kr-grey-300)', flexShrink: 0 }} />
                      )}
                      {!last && <span style={{ flex: 1, width: '2px', background: 'var(--border-default)' }} />}
                    </div>
                    <div style={{ paddingBottom: last ? 0 : '12px', fontSize: '13px' }}>
                      <div style={{ color: 'var(--text-heading)' }}>{e.ev}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {e.t}{e.km != null ? ` · ${e.km} km` : ''}{e.speed ? ` · ${e.speed} km/h` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default FleetTrackModal;
