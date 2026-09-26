import React from 'react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { ENROUTE_LABEL } from '../../../utils/tripStatus';
import { getDashModules, buildCustomWidget, DEFAULT_PALETTE } from '../../../utils/dashboard-custom';
import { RowActions } from '../../../components/common/RowActions';
import { DynamicChart, CHART_TYPES, CHART_LABELS } from '../../../components/charts';
import {
  Truck, Navigation, TriangleAlert, EyeOff, Tag, UserCheck, Clock,
  SatelliteDish, Ruler, Route, Radar, Smartphone, Gauge,
} from 'lucide-react';

// One icon per KPI, so a card is recognisable before you read its label.
const CARD_ICONS = {
  trips: Truck,
  enroute: Navigation,
  exceptions: TriangleAlert,
  hiddenKm: EyeOff,
  nonBiz: Tag,
  attendance: UserCheck,
  longOpen: Clock,
  gpsNoFix: SatelliteDish,
  distance: Ruler,
  diversions: Route,
  radius: Radar,
  fleetRunning: Gauge,
  driverApprovals: UserCheck,
  deviceApprovals: Smartphone,
};

// The accent at card-fill strength, keyed off the edge colour each KPI already carries.
const EDGE_TINTS = {
  'var(--color-brand)': 'var(--color-brand-tint)',
  'var(--kr-green-700)': 'var(--kr-green-100)',
  'var(--kr-green-600)': 'var(--kr-green-100)',
  'var(--kr-red-600)': 'var(--kr-red-100)',
  'var(--kr-saffron-500)': 'var(--kr-saffron-100)',
  'var(--st-enroute-edge)': 'var(--st-enroute-bg)',
  'var(--kr-grey-300)': 'var(--kr-grey-100)',
  'var(--kr-grey-500)': 'var(--kr-grey-100)',
};

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
      { id: 'nonBiz', label: 'Non-business', value: Math.round((nonBiz.length / (trips.length || 1)) * 100) + '%', sub: 'of movements · all recorded', subColor: 'var(--text-muted)', edge: 'var(--kr-green-600)', route: 'analytics' },
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
      {
        id: 'branchTrips',
        title: 'Trips by branch · today',
        meta: 'Target 300–400/day',
        desc: 'Business and non-business trips per branch',
        kindLabel: 'Stacked bars',
        isHbar: true,
        rows: hbar(bb.map(([name, biz, non]) => [name, [[biz, 'var(--color-brand)'], [non, 'var(--kr-green-100)']], biz + non, ' · ' + non + ' non-biz']), 132),
        legend: [{ label: 'Business', color: 'var(--color-brand)' }, { label: 'Non-business', color: 'var(--kr-green-100)' }],
        route: 'analytics',
        chartData: bb.map(([name, biz, non], i) => ({
          label: name,
          value: biz + non,
          sub: `${biz} biz · ${non} non-biz`,
          color: ['#00623F', '#0B7E52', '#F29A1F', '#2F7DB5', '#7A4300'][i % 5],
        })),
        centerValue: bb.reduce((acc, [, biz, non]) => acc + biz + non, 0),
        centerLabel: 'Trips',
      },
      {
        id: 'tripsTrend',
        title: 'Trips per day',
        meta: 'Last 14 days',
        desc: 'Daily trip volume across all branches',
        kindLabel: 'Columns',
        isColumn: true,
        route: 'analytics',
        bars: trend.map((v, i) => ({ h: Math.max(8, Math.round((v / 350) * 100)) + '%', color: i === trend.length - 1 ? 'var(--kr-green-800)' : 'var(--color-brand)', title: (i + 1) + ' Sep · ' + v, val: v, lbl: (i + 1) + ' Sep' })),
        axisStart: '1 Sep',
        axisEnd: '14 Sep',
        chartData: trend.map((v, i) => ({
          label: `${i + 1} Sep`,
          value: v,
          color: i === trend.length - 1 ? '#004A31' : '#00623F',
        })),
        centerValue: trend.reduce((acc, v) => acc + v, 0),
        centerLabel: '14-Day Trips',
      },
      {
        id: 'gpsHealth',
        title: 'GPS health · fleet',
        meta: 'Live',
        desc: 'Tracking, weak signal and no fix across the fleet',
        kindLabel: 'Summary',
        isStat: true,
        stats: [[gpsOk, 'Tracking', 'var(--color-brand)'], [gpsWeak, 'Weak signal', 'var(--kr-saffron-600)'], [gpsFail, 'No fix', 'var(--kr-red-600)']].map(([value, label, color]) => ({ value, label, color, w: Math.max(1, Math.round((value / gpsTotal) * 100)) + '%' })),
        note: 'When GPS fails the odometer is used; when both fail the trip closes as a manual exception.',
        route: 'fleet',
        chartData: [
          { label: 'Tracking (OK)', value: gpsOk, color: '#00623F' },
          { label: 'Weak signal', value: gpsWeak, color: '#F29A1F' },
          { label: 'No fix', value: gpsFail, color: '#D91619' },
        ],
        centerValue: gpsTotal,
        centerLabel: 'Vehicles',
      },
      {
        id: 'excByType',
        title: 'Open exceptions by type',
        meta: openExc.length + ' open',
        desc: 'Where the open exceptions come from',
        kindLabel: 'Bars',
        isHbar: true,
        route: 'exceptions',
        rows: hbar(excByType.map(([t, n]) => [t, [[n, 'var(--kr-red-600)']], n]), Math.max(1, ...excByType.map(x => x[1]))),
        chartData: excByType.map(([t, n], i) => ({
          label: t,
          value: n,
          color: ['#D91619', '#F29A1F', '#00623F', '#2F7DB5', '#7A4300', '#5B52D4'][i % 6],
        })),
        centerValue: openExc.length,
        centerLabel: 'Exceptions',
      },
      {
        id: 'vehStatus',
        title: 'Vehicle status · today',
        meta: '722 vehicles',
        desc: 'Running, idle by cause, and in maintenance',
        kindLabel: 'Bars',
        isHbar: true,
        route: 'attendance',
        rows: hbar(vehStatusBars.map(v => [v.label, [[v.count, v.color]], v.count]), 296),
        chartData: vehStatusBars.map(v => ({
          label: v.label,
          value: v.count,
          color: v.color === 'var(--kr-green-100)' ? '#0B7E52' : v.color === 'var(--kr-grey-300)' ? '#7C7C76' : v.color,
        })),
        centerValue: 722,
        centerLabel: 'Vehicles',
      },
      {
        id: 'distVariance',
        title: 'Distance variance · worst trips',
        meta: 'Flag above ' + distThr + '%',
        desc: 'Furthest source vs fixed km, closed trips',
        kindLabel: 'Bars',
        isHbar: true,
        route: 'distance',
        rows: hbar(worstDist.map(d => [(tms.V[d.vehicle] || {}).number || d.number, [[d.pct, d.flagged ? 'var(--kr-red-600)' : 'var(--color-brand)']], d.pctText]), Math.max(1, ...worstDist.map(d => d.pct))),
        chartData: worstDist.map((d, i) => ({
          label: (tms.V[d.vehicle] || {}).number || d.number,
          value: Number(d.pct.toFixed(1)),
          valueSuffix: '%',
          color: d.flagged ? '#D91619' : ['#00623F', '#F29A1F', '#2F7DB5', '#7A4300', '#5B52D4'][i % 5],
        })),
        centerValue: worstDist[0]?.pctText || '0%',
        centerLabel: 'Max Variance',
        valueSuffix: '%',
      }
    ],
    lists: [],
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

  const handleUpdateChartType = (uid, chartType) => {
    const nextCharts = (currentCfg.charts || []).map(c =>
      c.uid === uid ? { ...c, chartType } : c
    );
    saveDash({ ...currentCfg, charts: nextCharts });
    showToast('info', 'Chart view updated', `Changed to ${CHART_LABELS[chartType] || chartType}.`);
  };

  const dashCharts = (currentCfg.charts || []).map(it => {
    const selectedType = it.chartType || it.style || 'bar';
    if (it.module) {
      const m = modulesMap[it.module];
      if (!m) return null;
      const widget = buildCustomWidget.charts(it, m, hbar, DEFAULT_PALETTE);
      return { ...widget, ...it, chartType: selectedType };
    }
    const w = cat.charts[it.src];
    if (!w) return null;
    return { ...w, ...it, title: it.title || w.title, chartType: selectedType };
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '16px', alignItems: 'stretch' }}>
          {dashCards.map((k, i) => {
            const edge = k.edge || 'var(--color-brand)';
            const tint = EDGE_TINTS[edge] || 'var(--kr-grey-100)';
            const Icon = CARD_ICONS[k.src] || CARD_ICONS[k.id];
            return (
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
                // The whole card carries its accent, not just the top bar.
                border: `1px solid ${edge}`,
                borderTop: `4px solid ${edge}`,
                borderRadius: 'var(--radius-lg)',
                padding: '14px 16px',
                boxShadow: '0 1px 3px rgba(0, 48, 33, 0.05)',
                transition: 'box-shadow var(--dur-base), transform var(--dur-base)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 60, 40, 0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 48, 33, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: edge, lineHeight: 1.35 }}>
                  {k.label}
                </div>
                {Icon && (
                  <span style={{ flex: 'none', width: '30px', height: '30px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: tint, color: edge }}>
                    <Icon size={16} strokeWidth={2.2} />
                  </span>
                )}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '32px', letterSpacing: '-0.02em', color: 'var(--text-heading)', marginTop: '8px', lineHeight: 1 }}>
                {k.value}
              </div>
              <div style={{ fontSize: '12.5px', lineHeight: 1.4, color: k.subColor || 'var(--text-muted)', marginTop: 'auto', paddingTop: '8px' }}>
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
            );
          })}
        </div>
      )}

      {/* DASHBOARD CHARTS */}
      {dashCharts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(max(320px, calc((100% - 48px) / 3)), 1fr))', gap: '24px', alignItems: 'stretch' }}>
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
                boxShadow: '0 1px 3px rgba(0, 48, 33, 0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border-default)', background: 'var(--surface-muted, #f7faf9)', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.title}
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Chart view type switcher */}
                  <div
                    style={{
                      display: 'inline-flex',
                      background: 'var(--surface-muted, #f6f6f4)',
                      borderRadius: 'var(--radius-md, 6px)',
                      padding: '2px',
                      border: '1px solid var(--border-default, #ecece8)',
                    }}
                  >
                    {CHART_TYPES.map((ct) => {
                      const Icon = ct.icon;
                      const isActive = (c.chartType || 'bar') === ct.value;
                      return (
                        <button
                          key={ct.value}
                          type="button"
                          onClick={() => handleUpdateChartType(c.uid, ct.value)}
                          title={`${ct.label}: ${ct.description}`}
                          style={{
                            all: 'unset',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '26px',
                            height: '26px',
                            borderRadius: '4px',
                            background: isActive ? '#fff' : 'transparent',
                            color: isActive ? 'var(--color-brand)' : 'var(--text-muted)',
                            boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => navTo(c.route || 'dashboard')}
                    style={{ all: 'unset', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-brand)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    {c.meta}
                  </button>
                </div>
              </div>
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                <DynamicChart chart={c} />
              </div>
            </section>
          ))}
        </div>
      )}

    </div>
  );
};

export default Dashboard;
