import React from 'react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { ENROUTE_LABEL } from '../../../utils/tripStatus';
import { getDashModules, buildCustomWidget, DEFAULT_PALETTE } from '../../../utils/dashboard-custom';
import { RowActions } from '../../../components/common/RowActions';

export const Dashboard = () => {
  const {
    T,
    dashCfg,
    saveDash,
    dashDefault,
    navTo,
    showToast,
    setSelectedTrip,
    setExcSel,
    setExcAssignees,
    setExcNote,
    setDrawer,
    deleted,
    excOverrides,
    drvReqs,
    devReqs,
    distReview,
    approvals,
    st,
    fmtPhone,
    fmtImei,
    vehTanks,
    masterEdits,
  } = useTMSAdmin();

  const tms = T();
  const trips = (tms.trips || []).filter(t => !deleted.includes(t.id));
  const exceptions = (tms.exceptions || []).map(x => ({ ...x, ...(excOverrides[x.id] || {}) }));
  const openExc = exceptions.filter(x => x.status !== 'Resolved');
  const enroute = trips.filter(t => t.status === 'Enroute');
  const nonBiz = trips.filter(t => t.type === 'Non-Business');
  const longOpen = enroute.filter(t => t.hoursOpen > 24);

  const distThr = Number(st.variance) || 5;
  const distAll = (tms.distanceChecks || []).map(d => {
    const delta = km => km == null ? null : Math.round((km - d.fixedKm) / d.fixedKm * 1000) / 10;
    const g = delta(d.gpsKm), o = delta(d.odoKm);
    const pct = Math.max(Math.abs(g || 0), Math.abs(o || 0));
    const flagged = pct > distThr;
    const review = flagged ? (distReview[d.id] || d.review || 'Open') : 'Within 5%';
    return { ...d, pct, pctText: pct.toFixed(1) + '%', flagged, review };
  });
  const distFlagged = distAll.filter(d => d.flagged).length;
  const distOpenCount = distAll.filter(d => d.review === 'Open').length;
  const distAlerts = distAll.filter(d => d.review === 'Open' || d.review === 'Under review').sort((a, b) => b.pct - a.pct);

  const pendingDrivers = [...drvReqs.filter(r => r.status === 'Pending'), ...(tms.drivers || []).filter(d => (approvals[d.id] || d.approval) === 'Pending approval')];
  const devPending = devReqs.filter(r => r.status === 'Pending');

  const gpsOk = (tms.vehicles || []).filter(v => v.gps === 'OK').length * 68;
  const gpsWeak = (tms.vehicles || []).filter(v => v.gps === 'Weak').length * 9;
  const gpsFail = (tms.vehicles || []).filter(v => v.gps === 'Failed').length * 4;
  const gpsTotal = gpsOk + gpsWeak + gpsFail || 1;

  const bb = [['Chennai HO', 118, 14], ['Namakkal', 84, 9], ['Hyderabad', 52, 6], ['Bengaluru', 36, 3], ['Mumbai', 22, 2]];
  const hbar = (rows, max) => rows.map(([name, segs, value, rest]) => ({
    name, value, rest: rest || '', segs: segs.map(([n, color]) => ({ w: Math.min(100, Math.round(n / (max || 1) * 100)) + '%', color }))
  }));

  const types = ['Hidden kilometres', 'Distance variance', 'Route diversion', 'GPS failure', 'Both sources failed', 'Long open trip', 'Radius breach', 'Missing attendance', 'Idle vehicles'];
  const excByType = types.map(t => [t, openExc.filter(x => x.type === t).length]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]);
  const worstDist = [...distAll].sort((a, b) => b.pct - a.pct).slice(0, 5);
  const trend = [284, 301, 322, 298, 310, 336, 341, 289, 305, 318, 327, 344, 312, 312];
  const vehStatusBars = [['Running · trip assigned', 281, 'var(--color-brand)'], ['Idle · no business', 296, 'var(--kr-green-100)'], ['Idle · no driver', 88, 'var(--kr-saffron-500)'], ['Maintenance · service', 57, 'var(--kr-grey-300)']].map(([label, count, color]) => ({ label, count, color, pct: Math.round(count / 296 * 100) + '%' }));

  const dashCatalog = {
    cards: [
      { id: 'trips', label: 'Trips today', value: 312, sub: '+18 vs yesterday · 300–400 target', subColor: 'var(--kr-green-700)', edge: 'var(--color-brand)', route: 'trips' },
      { id: 'enroute', label: `${ENROUTE_LABEL} now`, value: enroute.length * 47, sub: enroute.filter(t => t.hoursOpen > 24).length + ' open over 24 h', subColor: '#7A4300', edge: 'var(--color-brand)', route: 'trips' },
      { id: 'exceptions', label: 'Open exceptions', value: openExc.length, sub: openExc.filter(x => x.severity === 'High').length + ' high severity', subColor: 'var(--kr-red-700)', edge: 'var(--kr-red-600)', route: 'exceptions' },
      { id: 'hiddenKm', label: 'Hidden km · month', value: '412', sub: '6 unaccounted distance alerts', subColor: '#7A4300', edge: 'var(--kr-saffron-500)', route: 'exceptions' },
      { id: 'nonBiz', label: 'Non-business', value: Math.round((nonBiz.length / (trips.length || 1)) * 100) + '%', sub: 'of movements · all recorded', subColor: 'var(--text-muted)', edge: 'var(--kr-green-100)', route: 'analytics' },
      { id: 'attendance', label: 'Attendance', value: '86%', sub: '3 branches incomplete today', subColor: '#7A4300', edge: 'var(--kr-saffron-500)', route: 'attendance' },
      { id: 'longOpen', label: 'Long open trips', value: longOpen.length, sub: `${ENROUTE_LABEL} for more than 24 h`, subColor: '#7A4300', edge: 'var(--kr-saffron-500)', route: 'trips' },
      { id: 'gpsNoFix', label: 'GPS · no fix', value: gpsFail, sub: gpsWeak + ' weak signal · ' + gpsOk + ' tracking', subColor: 'var(--kr-red-700)', edge: 'var(--kr-red-600)', route: 'fleet' },
      { id: 'distance', label: 'Distance over ' + distThr + '%', value: distFlagged, sub: distOpenCount + ' open for review', subColor: 'var(--kr-red-700)', edge: 'var(--kr-red-600)', route: 'distance' },
      { id: 'diversions', label: 'Route diversions', value: 2, sub: '1 off route now', subColor: '#7A4300', edge: 'var(--kr-saffron-500)', route: 'fleet' },
      { id: 'radius', label: 'Radius alerts', value: (tms.radiusAlerts || []).length, sub: 'Left a safe zone without a trip', subColor: 'var(--kr-red-700)', edge: 'var(--kr-red-600)', route: 'fleet' },
      { id: 'fleetRunning', label: 'Fleet running', value: 281, sub: 'of 722 vehicles · 88 idle, no driver', subColor: 'var(--text-muted)', edge: 'var(--color-brand)', route: 'fleet' },
      { id: 'driverApprovals', label: 'Driver approvals', value: pendingDrivers.length, sub: 'Waiting for your decision', subColor: '#7A4300', edge: 'var(--kr-saffron-500)', route: 'drivers' },
      { id: 'deviceApprovals', label: 'Device approvals', value: devPending.length, sub: 'Supervisor phones pending', subColor: '#7A4300', edge: 'var(--kr-saffron-500)', route: 'deviceApprovals' }
    ],
    charts: [
      { id: 'branchTrips', title: 'Trips by branch · today', meta: 'Target 300–400/day', desc: 'Business and non-business trips per branch', kindLabel: 'Stacked bars', isHbar: true, rows: hbar(bb.map(([name, biz, non]) => [name, [[biz, 'var(--color-brand)'], [non, 'var(--kr-green-100)']], biz + non, ' · ' + non + ' non-biz']), 132), legend: [{ label: 'Business', color: 'var(--color-brand)' }, { label: 'Non-business', color: 'var(--kr-green-100)' }], route: 'analytics' },
      { id: 'tripsTrend', title: 'Trips per day', meta: 'Last 14 days', desc: 'Daily trip volume across all branches', kindLabel: 'Columns', isColumn: true, route: 'analytics', bars: trend.map((v, i) => ({ h: Math.max(8, Math.round((v / 350) * 100)) + '%', color: i === trend.length - 1 ? 'var(--kr-green-800)' : 'var(--color-brand)', title: (i + 1) + ' Sep · ' + v, val: v, lbl: (i + 1) + ' Sep' })), axisStart: '1 Sep', axisEnd: '14 Sep' },
      { id: 'gpsHealth', title: 'GPS health · fleet', meta: 'Live', desc: 'Tracking, weak signal and no fix across the fleet', kindLabel: 'Summary', isStat: true, stats: [[gpsOk, 'Tracking', 'var(--color-brand)'], [gpsWeak, 'Weak signal', 'var(--kr-saffron-600)'], [gpsFail, 'No fix', 'var(--kr-red-600)']].map(([value, label, color]) => ({ value, label, color, w: Math.max(1, Math.round((value / gpsTotal) * 100)) + '%' })), note: 'When GPS fails the odometer is used; when both fail the trip closes as a manual exception.', route: 'fleet' },
      { id: 'excByType', title: 'Open exceptions by type', meta: openExc.length + ' open', desc: 'Where the open exceptions come from', kindLabel: 'Bars', isHbar: true, route: 'exceptions', rows: hbar(excByType.map(([t, n]) => [t, [[n, 'var(--kr-red-600)']], n]), Math.max(1, ...excByType.map(x => x[1]))) },
      { id: 'vehStatus', title: 'Vehicle status · today', meta: '722 vehicles', desc: 'Running, idle by cause, and in maintenance', kindLabel: 'Bars', isHbar: true, route: 'attendance', rows: hbar(vehStatusBars.map(v => [v.label, [[v.count, v.color]], v.count]), 296) },
      { id: 'distVariance', title: 'Distance variance · worst trips', meta: 'Flag above ' + distThr + '%', desc: 'Furthest source vs fixed km, closed trips', kindLabel: 'Bars', isHbar: true, route: 'distance', rows: hbar(worstDist.map(d => [(tms.V[d.vehicle] || {}).number || d.number, [[d.pct, d.flagged ? 'var(--kr-red-600)' : 'var(--color-brand)']], d.pctText]), Math.max(1, ...worstDist.map(d => d.pct))) }
    ],
    lists: [
      { id: 'openExceptions', title: 'Open exceptions', desc: 'Newest open exceptions with branch', linkLabel: 'All exceptions →', route: 'exceptions', items: openExc.slice(0, 5).map(x => ({ kind: 'exc', id: x.id, dot: x.severity === 'High' ? 'var(--kr-red-600)' : x.severity === 'Medium' ? 'var(--kr-saffron-500)' : 'var(--kr-grey-500)', title: x.type + ' · ' + ((tms.V[x.vehicle] || {}).number || '—'), detail: x.detail, meta: (tms.B[x.branch] || {}).name })) },
      { id: 'longOpenTrips', title: 'Long open trips', desc: `${ENROUTE_LABEL} for more than 24 hours`, linkLabel: 'Over 24 h', route: 'trips', items: longOpen.map(t => ({ kind: 'trip', id: t.id, dot: 'var(--kr-saffron-500)', title: t.number, mono: true, detail: `${(tms.V[t.vehicle] || {}).number || ''} · ${(tms.D[t.driver] || {}).name || ''} · ${(tms.B[t.branch] || {}).name || ''}`, meta: t.hoursOpen + ' h', metaColor: 'var(--kr-saffron-600)' })) },
      { id: 'distAlerts', title: 'Distance variance alerts', desc: 'Flagged trips waiting for review', linkLabel: 'Distance variation →', route: 'distance', items: distAlerts.slice(0, 5).map(d => ({ kind: d.trip ? 'trip' : 'route', id: d.trip, route: 'distance', dot: 'var(--kr-red-600)', title: `${(tms.V[d.vehicle] || {}).number || d.number} · ${d.pctText}`, detail: (d.route || 'Corridor'), meta: d.review, metaColor: 'var(--kr-red-800)' })) },
      { id: 'driverQueue', title: 'Driver approvals', desc: 'New and pending drivers to approve', linkLabel: 'Driver master →', route: 'drivers', items: pendingDrivers.slice(0, 5).map(q => ({ kind: 'drv', id: q.id, dot: 'var(--kr-saffron-500)', title: q.name, detail: `${(tms.B[q.branch] || {}).name} · ${q.licence}`, meta: 'Review', metaColor: 'var(--text-brand)' })) },
      { id: 'deviceRequests', title: 'Device approvals', desc: 'Supervisor phones asking to register', linkLabel: 'Device approvals →', route: 'deviceApprovals', items: devPending.slice(0, 5).map(r => ({ kind: 'route', route: 'deviceApprovals', id: r.id, dot: 'var(--kr-saffron-500)', title: '+91 ' + r.phone, detail: `IMEI ${r.imei} · ${r.device || 'Android phone'}`, meta: r.requestedAt || 'Pending' })) },
      { id: 'recentTrips', title: 'Recently closed trips', desc: 'Latest trips closed by supervisors', linkLabel: 'All trips →', route: 'trips', items: trips.filter(t => t.status === 'Closed').slice(0, 5).map(t => ({ kind: 'trip', id: t.id, dot: (t.flags || []).length ? 'var(--st-flagged-edge)' : 'var(--st-closed-edge)', title: t.number, mono: true, detail: `${(tms.V[t.vehicle] || {}).number || ''} · ${(tms.D[t.driver] || {}).name || ''} · ${(tms.C[t.client] || {}).name || ''}`, meta: t.status, metaColor: 'var(--st-closed-fg)' })) }
    ]
  };

  const cat = {
    cards: Object.fromEntries(dashCatalog.cards.map(w => [w.id, w])),
    charts: Object.fromEntries(dashCatalog.charts.map(w => [w.id, w])),
    lists: Object.fromEntries(dashCatalog.lists.map(w => [w.id, w])),
  };

  const modulesMap = getDashModules(tms, {
    deleted,
    excOverrides,
    masterEdits,
    vehTanks,
    drvReqs,
    approvals,
    devReqs,
    distReview,
    st,
    fmtPhone,
    fmtImei,
  });

  const currentCfg = dashCfg || dashDefault();

  const dashCards = (currentCfg.cards || []).map(it => {
    if (it.module) {
      const m = modulesMap[it.module];
      if (!m) return null;
      return buildCustomWidget.cards(it, m);
    }
    const w = cat.cards[it.src];
    if (!w) return null;
    return { ...w, ...it, label: it.title || w.label };
  }).filter(Boolean);

  const dashCharts = (currentCfg.charts || []).map(it => {
    if (it.module) {
      const m = modulesMap[it.module];
      if (!m) return null;
      return buildCustomWidget.charts(it, m, hbar, DEFAULT_PALETTE);
    }
    const w = cat.charts[it.src];
    if (!w) return null;
    return { ...w, ...it, title: it.title || w.title };
  }).filter(Boolean);

  const dashLists = (currentCfg.lists || []).map(it => {
    if (it.module) {
      const m = modulesMap[it.module];
      if (!m) return null;
      return buildCustomWidget.lists(it, m);
    }
    const w = cat.lists[it.src];
    if (!w) return null;
    return { ...w, ...it, title: it.title || w.title };
  }).filter(Boolean);

  const openDashItem = (item) => {
    if (item.kind === 'exc') {
      const x = exceptions.find(z => z.id === item.id);
      if (x) {
        setExcSel(x.id);
        setExcAssignees(x.assigneeIds || []);
        setExcNote('');
        setDrawer({ isException: true, kicker: 'Exception ' + x.id, title: x.type });
      }
    } else if (item.kind === 'trip' && item.id) {
      navTo('trip', { selectedTrip: item.id });
    } else if (item.kind === 'drv') {
      navTo('drivers');
    } else if (item.route) {
      navTo(item.route);
    }
  };

  const activeBranchesCount = (tms.branches || []).filter(b => b.status === 'Active').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
        <div></div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Shown for now without the export; wire onClick={() => navTo('reports')} back to enable it. */}
          <button
            type="button"
            style={{ all: 'unset', cursor: 'pointer', padding: '0 14px', height: '32px', display: 'inline-flex', alignItems: 'center', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '13px', fontWeight: 700, color: 'var(--color-brand)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-brand-tint)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Export today
          </button>
          <button
            onClick={() => navTo('exceptions')}
            style={{ all: 'unset', cursor: 'pointer', padding: '0 14px', height: '32px', display: 'inline-flex', alignItems: 'center', borderRadius: 'var(--radius-md)', background: 'var(--color-brand)', color: '#fff', fontSize: '13px', fontWeight: 700 }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-brand-strong)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-brand)'}
          >
            Review exceptions
          </button>
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      {dashCards.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(max(140px, calc((100% - 120px) / 6)), 1fr))', gap: 'clamp(12px, 2vw, 24px)' }}>
          {dashCards.map((k, i) => (
            <button
              key={k.uid || i}
              onClick={() => navTo(k.route || 'dashboard')}
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                background: '#fff',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 18px',
                borderTop: `4px solid ${k.edge || 'var(--color-brand)'}`,
                transition: 'box-shadow var(--dur-base), transform var(--dur-base)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                {k.label}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '32px', letterSpacing: '-0.02em', color: 'var(--text-heading)', marginTop: '6px', lineHeight: 1 }}>
                {k.value}
              </div>
              <div style={{ fontSize: '13px', color: k.subColor || 'var(--text-muted)', marginTop: '6px' }}>
                {k.sub}
              </div>
              {k.hasStats && k.stats && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                  {k.stats.map((x, xi) => (
                    <div
                      key={xi}
                      style={{
                        paddingTop: '6px',
                        borderTop: '1px solid var(--border-default)',
                        fontSize: '12px',
                        lineHeight: 1.4,
                        color: 'var(--text-body)',
                        textAlign: 'left',
                        wordBreak: 'break-word',
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          fontFamily: 'var(--font-display)',
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {x.h}
                      </span>
                      {x.text}
                    </div>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* DASHBOARD CHARTS */}
      {dashCharts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(max(320px, calc((100% - 48px) / 3)), 1fr))', gap: '24px' }}>
          {dashCharts.map((c, i) => (
            <section
              key={c.uid || i}
              style={{
                background: '#fff',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border-default)', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
                  {c.title}
                </h2>
                <button
                  onClick={() => navTo(c.route || 'dashboard')}
                  style={{ all: 'unset', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-brand)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  {c.meta}
                </button>
              </div>
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {/* Horizontal Bars */}
                {c.isHbar && c.rows && (
                  <>
                    {c.rows.map((b, bi) => (
                      <div key={bi} style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 150px) 1fr minmax(56px, auto)', gap: '12px', alignItems: 'center', fontSize: '14px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {b.name}
                        </span>
                        <span style={{ height: '14px', background: 'var(--kr-grey-100)', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
                          {b.segs.map((g, gi) => (
                            <span key={gi} style={{ width: g.w, background: g.color }} />
                          ))}
                        </span>
                        <span style={{ textAlign: 'right', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          <strong style={{ color: 'var(--text-heading)' }}>{b.value}</strong>{b.rest}
                        </span>
                      </div>
                    ))}
                    {c.legend && c.legend.length > 0 && (
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', paddingTop: '4px' }}>
                        {c.legend.map((l, li) => (
                          <span key={li} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '10px', height: '10px', background: l.color }} />
                            {l.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Columns Trend */}
                {c.isColumn && c.bars && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '160px', borderBottom: '1px solid var(--border-default)' }}>
                      {c.bars.map((b, bi) => (
                        <div
                          key={bi}
                          title={b.title}
                          style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'stretch', height: '100%', minWidth: 0 }}
                        >
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', textAlign: 'center' }}>
                            {b.val}
                          </span>
                          <div style={{ height: b.h, background: b.color, borderRadius: '2px 2px 0 0' }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>{c.axisStart}</span>
                      <span>{c.axisEnd}</span>
                    </div>
                  </>
                )}

                {/* Stat Summary */}
                {c.isStat && c.stats && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      {c.stats.map((x, xi) => (
                        <div key={xi}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '30px', lineHeight: 1, color: x.color }}>
                            {x.value}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{x.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', height: '10px', borderRadius: '2px', overflow: 'hidden', gap: '2px' }}>
                      {c.stats.map((x, xi) => (
                        <span key={xi} title={x.label} style={{ width: x.w, background: x.color }} />
                      ))}
                    </div>
                    {c.note && <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>{c.note}</p>}
                  </>
                )}

                {/* Custom Grouped Bars for Custom Modules */}
                {c.isGroups && c.groups && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {c.groups.map((gr, gri) => (
                      <div key={gri} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
                            {gr.h}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {gr.sub}
                          </span>
                        </div>
                        {gr.rows && gr.rows.map((b, bi) => (
                          <div key={bi} style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 150px) 1fr minmax(56px, auto)', gap: '12px', alignItems: 'center', fontSize: '14px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {b.name}
                            </span>
                            <span style={{ height: '14px', background: 'var(--kr-grey-100)', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
                              {b.segs.map((g, gi) => (
                                <span key={gi} style={{ width: g.w, background: g.color }} />
                              ))}
                            </span>
                            <span style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                              {b.value}
                            </span>
                          </div>
                        ))}
                        {gr.hasNote && gr.note && (
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            {gr.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* DASHBOARD LISTS */}
      {dashLists.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(max(320px, calc((100% - 24px) / 2)), 1fr))', gap: '24px' }}>
          {dashLists.map((l, i) => (
            <section
              key={l.uid || i}
              style={{
                background: '#fff',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border-default)', gap: '8px' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
                  {l.title}
                </h2>
                <button
                  onClick={() => navTo(l.route || 'dashboard')}
                  style={{ all: 'unset', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--text-brand)', whiteSpace: 'nowrap' }}
                >
                  {l.linkLabel || 'Open →'}
                </button>
              </div>

              {/* Custom Table View for Custom Lists */}
              {l.isTable && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', background: 'var(--surface-muted)' }}>
                        {l.cols && l.cols.map((h, hi) => (
                          <th
                            key={hi}
                            style={{
                              padding: '10px 14px',
                              fontFamily: 'var(--font-display)',
                              fontSize: '11px',
                              fontWeight: 700,
                              letterSpacing: '0.1em',
                              textTransform: 'uppercase',
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                        <th
                          style={{
                            padding: '10px 14px',
                            fontFamily: 'var(--font-display)',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            textAlign: 'center',
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {l.tRows && l.tRows.map((r, ri) => (
                        <tr
                          key={ri}
                          style={{ borderTop: '1px solid var(--border-default)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-muted)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {r.cells && r.cells.map((c, ci) => (
                            <td
                              key={ci}
                              style={{
                                padding: '10px 14px',
                                whiteSpace: 'nowrap',
                                maxWidth: '260px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontWeight: c.weight,
                                color: c.color,
                              }}
                            >
                              {c.v}
                            </td>
                          ))}
                          <td style={{ padding: '8px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <RowActions
                              onView={() => openDashItem(r)}
                              viewLabel="View details"
                              buttonAriaLabel="Actions"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Standard List Items */}
              {!l.isTable && l.items && l.items.map((x, xi) => (
                <button
                  key={xi}
                  onClick={() => openDashItem(x)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    display: 'grid',
                    gridTemplateColumns: '8px 1fr auto',
                    gap: '12px',
                    alignItems: 'center',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 18px',
                    borderBottom: '1px solid var(--border-default)',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-muted)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: x.dot || 'var(--color-brand)' }} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700, fontSize: '14px', color: 'var(--text-heading)', fontFamily: x.mono ? 'var(--font-mono)' : 'inherit' }}>
                      {x.title}
                    </span>
                    <span style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {x.detail}
                    </span>
                  </span>
                  <span style={{ whiteSpace: 'nowrap', fontSize: x.metaColor ? '14px' : '12px', fontWeight: 700, color: x.metaColor || 'var(--text-muted)' }}>
                    {x.meta}
                  </span>
                </button>
              ))}

              {((!l.isTable && (!l.items || l.items.length === 0)) || (l.isTable && (!l.tRows || l.tRows.length === 0))) && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  {l.empty || 'No records.'}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
