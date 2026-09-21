import React from 'react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';

export const FleetMonitor = () => {
  const { T, fleetFilter, setFleetFilter, navTo, deleted } = useTMSAdmin();
  const tms = T();

  const ff = fleetFilter;
  const trips = (tms.trips || []).filter(t => !deleted.includes(t.id));

  // Fleet Vehicles
  const fleetAll = (tms.vehicles || []).map(v => ({
    ...v,
    branchName: (tms.B[v.branch] || {}).name,
    driverName: v.driver && tms.D[v.driver] ? tms.D[v.driver].name : 'No driver',
    gpsColor: v.gps === 'OK' ? 'var(--kr-green-600)' : v.gps === 'Weak' ? 'var(--kr-saffron-600)' : 'var(--kr-red-600)',
    radiusAlert: v.id === 'V04'
      ? 'Left Ambattur Cold Store 100 m radius at 02:14 without an open trip.'
      : v.id === 'V05'
      ? 'No GPS fix for 2 h 14 min. Distance falling back to odometer.'
      : false,
  }));

  const fleetCards = fleetAll.filter(v =>
    ff === 'all' ||
    (ff === 'running' && v.status === 'Running') ||
    (ff === 'idle' && v.status === 'Idle') ||
    (ff === 'maint' && v.status === 'Maintenance') ||
    (ff === 'gps' && v.gps !== 'OK')
  );

  const gpsTone = g => g === 'OK' ? 'var(--kr-green-600)' : g === 'Weak' ? 'var(--kr-saffron-600)' : 'var(--kr-red-600)';

  // Diversions
  const divStates = {
    'Off route now': ['var(--kr-red-100)', 'var(--kr-red-800)', 'var(--kr-red-600)', 'tmsPulse 1.6s ease-in-out infinite'],
    'Rejoined': ['var(--color-hazard-soft)', '#7A4300', 'var(--kr-saffron-500)', 'none'],
    'Reviewed': ['var(--kr-grey-100)', 'var(--kr-grey-700)', 'var(--kr-grey-500)', 'none'],
  };
  const divOrder = { 'Off route now': 0, 'Rejoined': 1, 'Reviewed': 2 };
  const divCards = trips
    .filter(t => t.diversion)
    .sort((a, b) => (divOrder[a.diversion.state] ?? 3) - (divOrder[b.diversion.state] ?? 3))
    .map(t => {
      const dv = t.diversion;
      const st = divStates[dv.state] || divStates.Reviewed;
      const v = tms.V[t.vehicle] || {};
      const d = tms.D[t.driver] || {};
      const b = tms.B[t.branch] || {};
      const c = tms.C[t.client] || {};
      return {
        id: t.id,
        number: t.number,
        state: dv.state,
        stateBg: st[0],
        stateFg: st[1],
        edge: st[2],
        pulse: st[3],
        crewLine: `${v.number || t.vehicle} · ${d.name || t.driver} · ${b.name || t.branch}`,
        routeLine: `${c.name || t.client} → ${t.unloading}`,
        expected: dv.expected,
        actual: dv.actual,
        at: dv.at,
        offKm: dv.offKm + ' km',
        offColor: dv.offKm > 20 ? 'var(--kr-red-700)' : 'var(--text-heading)',
        minutes: dv.minutes + ' min',
        extraKm: '+' + dv.extraKm + ' km',
        detected: dv.detected,
        gps: v.gps || '—',
        gpsColor: gpsTone(v.gps),
      };
    });
  const divSummary = {
    count: divCards.length,
    live: divCards.filter(d => d.state === 'Off route now').length,
    over: trips.filter(t => t.diversion && t.diversion.offKm > 20).length,
  };

  // Non-billable trips
  const nbTrips = trips.filter(t => t.type === 'Non-Business');
  const nbCards = nbTrips.map(t => {
    const tr = t.track || { points: [] };
    const v = tms.V[t.vehicle] || {};
    const d = tms.D[t.driver] || {};
    const b = tms.B[t.branch] || {};
    const closed = t.status === 'Closed';
    const pts = (tr.points || []).map(([time, ev, km], i) => ({
      t: time,
      ev,
      km,
      dot: i === tr.points.length - 1 ? (closed ? 'var(--kr-grey-500)' : 'var(--color-brand)') : 'var(--kr-grey-300)',
      line: i === tr.points.length - 1 ? 'transparent' : 'var(--border-default)',
    }));
    return {
      id: t.id,
      number: t.number,
      reason: t.reason || 'Non-business',
      status: t.status,
      badgeBg: closed ? 'var(--kr-grey-100)' : 'var(--color-brand-soft)',
      badgeFg: closed ? 'var(--kr-grey-700)' : 'var(--kr-green-800)',
      crewLine: `${v.number || t.vehicle} · ${d.name || t.driver} · ${b.name || t.branch}`,
      fromTo: `${(tms.L[t.loading] || {}).name || '—'} → ${t.unloading || '—'}`,
      gpsKm: t.gpsKm != null ? String(t.gpsKm) : '—',
      gpsUnit: t.gpsKm != null ? 'km' : '',
      odoKm: t.odoKm != null ? String(t.odoKm) : 'Open',
      odoUnit: t.odoKm != null ? 'km' : '',
      maxSpeed: tr.maxSpeed ? String(tr.maxSpeed) : '—',
      speedUnit: tr.maxSpeed ? 'km/h' : '',
      idle: tr.idleMin != null ? String(tr.idleMin) : '—',
      idleUnit: tr.idleMin != null ? 'min' : '',
      points: pts,
      when: closed ? `${t.opened} → ${(t.closed || '').replace(/^\d+ \w+ \d{4} /, '')}` : `Since ${t.opened}`,
      gps: v.gps || '—',
      gpsColor: gpsTone(v.gps),
      lastFix: tr.lastFix || '—',
    };
  });
  const nbReasons = Object.entries(
    nbTrips.reduce((m, t) => {
      const r = t.reason || 'Other';
      m[r] = (m[r] || 0) + 1;
      return m;
    }, {})
  ).map(([r, n]) => `${r} ${n}`).join(' · ');
  const nbSummary = {
    count: nbCards.length,
    km: nbTrips.reduce((a, t) => a + (t.gpsKm || 0), 0),
    reasons: nbReasons,
  };

  // Radius Alerts
  const rbTime = t => {
    if (!t) return '—';
    const [hh, mm] = t.split(':').map(Number);
    return (hh % 12 || 12) + ':' + String(mm).padStart(2, '0') + (hh < 12 ? ' AM' : ' PM');
  };
  const rbCards = (tms.radiusAlerts || []).map(a => {
    const l = tms.L[a.location] || {};
    const isVeh = a.kind === 'vehicle';
    const who = isVeh ? tms.V[a.ref] : tms.S[a.ref];
    return {
      id: a.id,
      kindLabel: isVeh ? 'Vehicle' : 'Supervisor',
      name: who ? (isVeh ? who.number : who.name) : '—',
      nameFont: isVeh ? 'var(--font-mono)' : 'inherit',
      place: l.name || '—',
      zoneText: isVeh ? 'Left ' + (l.radius || 100) + ' m zone' : 'Left operational zone',
      time: rbTime(a.left),
      away: (a.awayM < 1000 ? a.awayM + ' m' : (a.awayM / 1000).toFixed(1) + ' km') + ' away',
      awayColor: a.awayM >= 1000 ? 'var(--kr-red-700)' : 'var(--text-muted)',
    };
  });
  const rbTiles = [
    { label: 'Active alerts', value: rbCards.length, color: 'var(--kr-red-700)' },
    { label: 'Vehicles', value: (tms.radiusAlerts || []).filter(a => a.kind === 'vehicle').length, color: 'var(--text-heading)' },
    { label: 'Supervisors', value: (tms.radiusAlerts || []).filter(a => a.kind === 'supervisor').length, color: 'var(--text-heading)' },
  ];

  // Filters & Tiles
  const fleetFilters = [
    { id: 'all', label: 'All' },
    { id: 'running', label: 'Running' },
    { id: 'idle', label: 'Idle' },
    { id: 'maint', label: 'Maintenance' },
    { id: 'gps', label: 'GPS issues' },
    { id: 'diversion', label: 'Route diversion' },
    { id: 'nonbill', label: 'Non-billable trips' },
    { id: 'radius', label: 'Radius alert' },
  ].map(f => {
    const a = f.id === ff;
    return {
      ...f,
      border: a ? 'var(--color-brand)' : 'var(--border-strong)',
      bg: a ? 'var(--color-brand)' : '#fff',
      color: a ? '#fff' : 'var(--text-heading)',
    };
  });

  const fleetTiles = [
    { label: 'Fleet', value: 722, edge: 'var(--color-brand)' },
    { label: 'Running', value: 281, edge: 'var(--color-brand)' },
    { label: 'Idle · no business', value: 296, edge: 'var(--kr-green-100)' },
    { label: 'Idle · no driver', value: 88, edge: 'var(--kr-saffron-500)' },
    { label: 'Maintenance', value: 57, edge: 'var(--kr-grey-300)' },
  ];

  const fallbackRows = [
    { o: 'Working', g: 'Working', a: 'Normal · sources merged', color: 'var(--kr-green-700)' },
    { o: 'Working', g: 'Failed', a: 'Use odometer', color: '#7A4300' },
    { o: 'Failed', g: 'Working', a: 'Use GPS', color: '#7A4300' },
    { o: 'Failed', g: 'Failed', a: 'Manual exception · admin report', color: 'var(--kr-red-700)' },
  ];

  const fleetShowVehicles = ff !== 'diversion' && ff !== 'nonbill' && ff !== 'radius';
  const fleetShowDiversion = ff === 'diversion';
  const fleetShowNonBill = ff === 'nonbill';
  const fleetShowRadius = ff === 'radius';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 5 KPI Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px' }}>
        {fleetTiles.map((k, idx) => (
          <div
            key={idx}
            style={{
              background: '#fff',
              border: '1px solid var(--border-default)',
              borderTop: `4px solid ${k.edge}`,
              borderRadius: 'var(--radius-lg)',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{k.label}</div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '24px',
                color: 'var(--text-heading)',
                lineHeight: 1.1,
                marginTop: '4px',
              }}
            >
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {fleetFilters.map(f => (
          <button
            key={f.id}
            onClick={() => setFleetFilter(f.id)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              padding: '0 14px',
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 'var(--radius-pill)',
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              border: `2px solid ${f.border}`,
              background: f.bg,
              color: f.color,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* VEHICLES VIEW */}
      {fleetShowVehicles && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
          {fleetCards.map(v => (
            <div
              key={v.id}
              style={{
                background: '#fff',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '16px',
                    color: 'var(--text-heading)',
                  }}
                >
                  {v.number}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'var(--font-display)',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: v.gpsColor,
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: v.gpsColor }}></span>
                  GPS {v.gps}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {v.type} · {v.branchName}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-heading)' }}>{v.route}</div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border-default)',
                  paddingTop: '10px',
                }}
              >
                <span>{v.status} · {v.driverName}</span>
                <span style={{ whiteSpace: 'nowrap' }}>{v.lastSeen}</span>
              </div>
              {v.radiusAlert && (
                <div
                  style={{
                    fontSize: '13px',
                    padding: '8px 10px',
                    background: 'var(--color-hazard-soft)',
                    borderRadius: 'var(--radius-md)',
                    color: '#7A4300',
                  }}
                >
                  {v.radiusAlert}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* DIVERSIONS VIEW */}
      {fleetShowDiversion && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-heading)' }}>{divSummary.count}</strong> flagged routes · {divSummary.live} off route now · {divSummary.over} over 20 km
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Alert fires when a vehicle leaves its fixed corridor by more than 10 km
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '16px' }}>
            {divCards.map(d => (
              <div
                key={d.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--border-default)',
                  borderLeft: `4px solid ${d.edge}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>
                    {d.number}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: 'var(--font-display)',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: d.stateBg,
                      color: d.stateFg,
                    }}
                  >
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: d.stateFg, animation: d.pulse }}></span>
                    {d.state}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-heading)' }}>{d.crewLine}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{d.routeLine}</div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '18px 88px minmax(0,1fr)',
                    gap: '8px 10px',
                    alignItems: 'baseline',
                    padding: '12px',
                    background: 'var(--surface-muted)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '14px',
                  }}
                >
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-brand)', alignSelf: 'center' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>Expected</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{d.expected}</span>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--kr-red-600)', alignSelf: 'center' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>Actual</span>
                  <span style={{ fontWeight: 600, color: 'var(--kr-red-800)' }}>{d.actual}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--text-muted)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ alignSelf: 'center' }}
                  >
                    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"></path>
                    <circle cx="12" cy="10" r="2.5"></circle>
                  </svg>
                  <span style={{ color: 'var(--text-muted)' }}>Left at</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{d.at}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '8px' }}>
                  <div style={{ padding: '10px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Off corridor</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: d.offColor }}>
                      {d.offKm}
                    </div>
                  </div>
                  <div style={{ padding: '10px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Duration</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: 'var(--text-heading)' }}>
                      {d.minutes}
                    </div>
                  </div>
                  <div style={{ padding: '10px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Extra distance</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: 'var(--text-heading)' }}>
                      {d.extraKm}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-default)',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>Detected {d.detected} · <span style={{ color: d.gpsColor, fontWeight: 700 }}>GPS {d.gps}</span></span>
                  <button
                    onClick={() => navTo('trip', { selectedTrip: d.id })}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text-brand)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    View trip &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NON-BILLABLE VIEW */}
      {fleetShowNonBill && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-heading)' }}>{nbSummary.count}</strong> non-billable movements · {nbSummary.km} km by GPS · {nbSummary.reasons}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Not invoiced. Tracked for utilisation and hidden-km checks.
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: '16px' }}>
            {nbCards.map(n => (
              <div
                key={n.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--border-default)',
                  borderLeft: '4px solid var(--kr-grey-500)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>
                    {n.number}
                  </span>
                  <span style={{ display: 'flex', gap: '6px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--kr-grey-100)',
                        color: 'var(--kr-grey-700)',
                      }}
                    >
                      {n.reason}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: n.badgeBg,
                        color: n.badgeFg,
                      }}
                    >
                      {n.status}
                    </span>
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-heading)' }}>{n.crewLine}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{n.fromTo}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '8px' }}>
                  <div style={{ padding: '10px', background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>GPS</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                      {n.gpsKm}
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px' }}>
                        {n.gpsUnit}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '10px', background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Odometer</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                      {n.odoKm}
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px' }}>
                        {n.odoUnit}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '10px', background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Top speed</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                      {n.maxSpeed}
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px' }}>
                        {n.speedUnit}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '10px', background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Idle</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                      {n.idle}
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '3px' }}>
                        {n.idleUnit}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    GPS timeline
                  </div>
                  {n.points.map((p, pIdx) => (
                    <div
                      key={pIdx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '48px 16px minmax(0,1fr) auto',
                        gap: '8px',
                        alignItems: 'start',
                        minHeight: '34px',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)', paddingTop: '1px' }}>
                        {p.t}
                      </span>
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                        <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: p.dot, marginTop: '5px', flex: 'none' }}></span>
                        <span style={{ flex: 1, width: '2px', background: p.line }}></span>
                      </span>
                      <span style={{ fontSize: '14px', color: 'var(--text-heading)', paddingBottom: '8px' }}>{p.ev}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.km} km</span>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-default)',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>{n.when} · <span style={{ color: n.gpsColor, fontWeight: 700 }}>GPS {n.gps}</span> · last fix {n.lastFix}</span>
                  <button
                    onClick={() => navTo('trip', { selectedTrip: n.id })}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text-brand)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    View trip &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RADIUS ALERT VIEW */}
      {fleetShowRadius && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--color-brand-tint)',
                color: 'var(--kr-green-800)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--color-brand)',
                  animation: 'tmsPulse 1.6s ease-in-out infinite',
                }}
              ></span>
              Live monitoring
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Vehicles and supervisors outside their safe radius right now
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,220px))', gap: '12px' }}>
            {rbTiles.map((k, idx) => (
              <div
                key={idx}
                style={{
                  background: '#fff',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '28px', lineHeight: 1.1, color: k.color }}>
                  {k.value}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>{k.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '12px' }}>
            {rbCards.map(r => (
              <div
                key={r.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ minWidth: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: 'var(--text-heading)' }}>
                    {r.kindLabel}: <span style={{ fontFamily: r.nameFont }}>{r.name}</span>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 'none' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'var(--kr-red-100)',
                        color: 'var(--kr-red-800)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Outside radius
                    </span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--kr-red-700)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      style={{ flex: 'none' }}
                    >
                      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"></path>
                      <path d="M12 9v4"></path>
                      <path d="M12 17h.01"></path>
                    </svg>
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-body)' }}>
                  {r.place} · {r.zoneText}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '14px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9"></circle>
                      <path d="M12 7v5l3 2"></path>
                    </svg>
                    {r.time}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: r.awayColor }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9"></circle>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    {r.away}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Distance Fallback Table */}
      <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <h2
          style={{
            margin: 0,
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-default)',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '15px',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            color: 'var(--text-heading)',
          }}
        >
          Distance source fallback
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-muted)', textAlign: 'left' }}>
              <th style={{ padding: '8px 18px', fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Odometer
              </th>
              <th style={{ padding: '8px 14px', fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                GPS
              </th>
              <th style={{ padding: '8px 18px', fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {fallbackRows.map((r, idx) => (
              <tr key={idx} style={{ borderTop: '1px solid var(--border-default)' }}>
                <td style={{ padding: '10px 18px' }}>{r.o}</td>
                <td style={{ padding: '10px 14px' }}>{r.g}</td>
                <td style={{ padding: '10px 18px', fontWeight: 600, color: r.color }}>{r.a}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default FleetMonitor;
