import React from 'react';
import { Avatar, Badge, Button, Card, Col, Divider, Empty, Flex, Row, Space, Statistic, Table, Tooltip, Typography } from 'antd';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { ENROUTE_LABEL } from '../../../utils/tripStatus';
import { getDashModules, buildCustomWidget, DEFAULT_PALETTE } from '../../../utils/dashboard-custom';
import { DynamicChart } from '../../../components/charts';
import {
  Truck, Navigation, TriangleAlert, EyeOff, Tag, UserCheck, Clock,
  SatelliteDish, Ruler, Route, Radar, Smartphone, Gauge, Eye,
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
    dashDefault,
    navTo,
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
  const vehStatusBars = [['Running · trip assigned', 281, 'var(--color-brand)'], ['Idle · no business', 296, 'var(--st-enroute-edge)'], ['Idle · no driver', 88, 'var(--kr-saffron-500)'], ['Maintenance · service', 57, 'var(--kr-grey-500)']].map(([label, count, color]) => ({ label, count, color, pct: Math.round(count / 296 * 100) + '%' }));

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
      { id: 'distance', label: 'Distance over ' + distThr + '%', value: distFlagged, sub: distOpenCount + ' open for review', subColor: 'var(--kr-red-700)', edge: 'var(--kr-red-600)',  },
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
          color: ['#275e74', '#3a768d', '#F29A1F', '#2F7DB5', '#7A4300'][i % 5],
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
          color: i === trend.length - 1 ? '#1c4b5f' : '#275e74',
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
          { label: 'Tracking (OK)', value: gpsOk, color: '#275e74' },
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
          color: ['#D91619', '#F29A1F', '#275e74', '#2F7DB5', '#7A4300', '#5B52D4'][i % 6],
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
          color: v.color === 'var(--kr-green-100)' ? '#3a768d' : v.color === 'var(--kr-grey-300)' ? '#7C7C76' : v.color,
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
        route: 'trips',
        rows: hbar(worstDist.map(d => [(tms.V[d.vehicle] || {}).number || d.number, [[d.pct, d.flagged ? 'var(--kr-red-600)' : 'var(--color-brand)']], d.pctText]), Math.max(1, ...worstDist.map(d => d.pct))),
        chartData: worstDist.map((d, i) => ({
          label: (tms.V[d.vehicle] || {}).number || d.number,
          value: Number(d.pct.toFixed(1)),
          valueSuffix: '%',
          color: d.flagged ? '#D91619' : ['#275e74', '#F29A1F', '#2F7DB5', '#7A4300', '#5B52D4'][i % 5],
        })),
        centerValue: worstDist[0]?.pctText || '0%',
        centerLabel: 'Max Variance',
        valueSuffix: '%',
      }
    ],
    lists: [
      { id: 'openExceptions', title: 'Open exceptions', desc: 'Newest open exceptions with branch', items: openExc.slice(0, 5).map(x => ({ kind: 'exc', id: x.id, dot: x.severity === 'High' ? 'var(--kr-red-600)' : x.severity === 'Medium' ? 'var(--kr-saffron-500)' : 'var(--kr-grey-500)', title: x.type + ' · ' + ((tms.V[x.vehicle] || {}).number || '—'), detail: x.detail, meta: (tms.B[x.branch] || {}).name })) },
      { id: 'longOpenTrips', title: 'Long open trips', desc: `${ENROUTE_LABEL} for more than 24 hours`, linkLabel: 'Over 24 h', route: 'trips', items: longOpen.map(t => ({ kind: 'trip', id: t.id, dot: 'var(--kr-saffron-500)', title: t.number, mono: true, detail: `${(tms.V[t.vehicle] || {}).number || ''} · ${(tms.D[t.driver] || {}).name || ''} · ${(tms.B[t.branch] || {}).name || ''}`, meta: t.hoursOpen + ' h', metaColor: 'var(--kr-saffron-800)' })) },
      { id: 'distAlerts', title: 'Distance variance alerts', desc: 'Flagged trips waiting for review', linkLabel: 'All trips →', route: 'trips', items: distAlerts.slice(0, 5).map(d => ({ kind: d.trip ? 'trip' : 'route', id: d.trip, route: 'trips', dot: 'var(--kr-red-600)', title: `${(tms.V[d.vehicle] || {}).number || d.number} · ${d.pctText}`, detail: (d.route || 'Corridor'), meta: d.review, metaColor: 'var(--kr-red-800)' })) },
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
      const widget = buildCustomWidget.cards(it, m);
      const isExc = it.module === 'exceptions' || m.id === 'exceptions';
      return {
        ...widget,
        ...it,
        label: it.title || widget.label,
        route: isExc ? null : (it.route || widget.route || null),
        noLink: isExc,
      };
    }
    const w = cat.cards[it.src];
    if (!w) return null;
    const isExc = it.src === 'exceptions' || w.id === 'exceptions' || it.src === 'hiddenKm';
    return {
      ...w,
      ...it,
      label: it.title || w.label,
      route: isExc ? null : (it.route || w.route || null),
      noLink: isExc,
    };
  }).filter(Boolean);

  const dashCharts = (currentCfg.charts || []).map(it => {
    const selectedType = it.chartType || it.style || 'bar';
    if (it.module) {
      const m = modulesMap[it.module];
      if (!m) return null;
      const widget = buildCustomWidget.charts(it, m, hbar, DEFAULT_PALETTE);
      const isExc = it.module === 'exceptions' || m.id === 'exceptions';
      return {
        ...widget,
        ...it,
        title: it.title || widget.title,
        chartType: selectedType,
        route: isExc ? null : (it.route || widget.route || null),
        noLink: isExc,
      };
    }
    const w = cat.charts[it.src];
    if (!w) return null;
    const isExc = it.src === 'excByType' || w.id === 'excByType';
    return {
      ...w,
      ...it,
      title: it.title || w.title,
      chartType: selectedType,
      route: isExc ? null : (it.route || w.route || null),
      noLink: isExc,
    };
  }).filter(Boolean);

  const dashLists = (currentCfg.lists || []).map(it => {
    if (it.module) {
      const m = modulesMap[it.module];
      if (!m) return null;
      const widget = buildCustomWidget.lists(it, m);
      const isExc = it.module === 'exceptions' || m.id === 'exceptions';
      return {
        ...widget,
        ...it,
        title: it.title || widget.title,
        linkLabel: isExc ? null : (it.linkLabel || widget.linkLabel || null),
        route: isExc ? null : (it.route || widget.route || null),
        noActions: isExc || widget.noActions,
        noLink: isExc,
      };
    }
    const w = cat.lists[it.src];
    if (!w) return null;
    const isExc = it.src === 'openExceptions' || w.id === 'openExceptions';
    return {
      ...w,
      ...it,
      title: it.title || w.title,
      linkLabel: isExc ? null : (it.linkLabel || w.linkLabel || null),
      route: isExc ? null : (it.route || w.route || null),
      noActions: isExc,
      noLink: isExc,
    };
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

  // Custom-list table columns: one per header in l.cols, plus the view action.
  const listColumns = (l) => [
    ...(l.cols || []).map((h, hi) => ({
      title: h,
      key: 'c' + hi,
      onCell: () => ({ style: { whiteSpace: 'nowrap', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' } }),
      onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      render: (_, r) => {
        const c = (r.cells || [])[hi];
        if (!c) return null;
        return <span style={{ fontWeight: c.weight, color: c.color }}>{c.v}</span>;
      },
    })),
    ...(!l.noActions ? [{
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, r) => (
        <Space size={4} onClick={e => e.stopPropagation()}>
          <Tooltip title="View details">
            <Button type="text" size="small" aria-label="Actions" icon={<Eye size={16} strokeWidth={2.2} />} onClick={() => openDashItem(r)} />
          </Tooltip>
        </Space>
      ),
    }] : []),
  ];

  return (
    <Flex vertical gap={24}>

      {/* DASHBOARD CARDS */}
      {dashCards.length > 0 && (
        <Row gutter={[16, 16]}>
          {dashCards.map((k, i) => {
            const edge = k.edge || 'var(--color-brand)';
            const tint = EDGE_TINTS[edge] || 'var(--kr-grey-100)';
            const Icon = CARD_ICONS[k.src] || CARD_ICONS[k.id];
            return (
              <Col key={k.uid || i} xs={24} sm={12} lg={8} xl={6} xxl={4}>
                <Card
                  hoverable
                  onClick={() => navTo(k.route || 'dashboard')}
                  className="tms-kpi tms-kpi--link"
                  style={{ height: '100%', '--kpi': edge }}
                  styles={{ body: { padding: '14px 16px', height: '100%', display: 'flex', flexDirection: 'column' } }}
                >
                  <Statistic
                    title={
                      <Flex justify="space-between" align="flex-start" gap={8}>
                        <Typography.Text strong style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--kpi)', lineHeight: 1.35 }}>
                          {k.label}
                        </Typography.Text>
                        {Icon && <Avatar size={30} style={{ flex: 'none', background: tint, color: edge }} icon={<Icon size={16} strokeWidth={2.2} />} />}
                      </Flex>
                    }
                    value={k.value}
                    formatter={v => v}
                  />
                  {/* Highlighted sub-lines take the card's blue; plain ones stay muted. */}
                  <Typography.Text style={{ fontSize: 12.5, color: k.subColor && k.subColor !== 'var(--text-muted)' ? 'var(--kpi)' : undefined, marginTop: 'auto', paddingTop: 8 }} type={k.subColor && k.subColor !== 'var(--text-muted)' ? undefined : 'secondary'}>
                    {k.sub}
                  </Typography.Text>
                  {k.hasStats && k.stats && (
                    <Flex vertical gap={6} style={{ marginTop: 10 }}>
                      {k.stats.map((x, xi) => (
                        <div key={xi}>
                          <Divider style={{ margin: '0 0 6px' }} />
                          <Typography.Text type="secondary" strong style={{ display: 'block', fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            {x.h}
                          </Typography.Text>
                          <Typography.Text style={{ fontSize: 12, wordBreak: 'break-word' }}>{x.text}</Typography.Text>
                        </div>
                      ))}
                    </Flex>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* DASHBOARD CHARTS */}
      {dashCharts.length > 0 && (
        <Row gutter={[24, 24]}>
          {dashCharts.map((c, i) => (
            <Col key={c.uid || i} xs={24} lg={12} xl={8}>
              <Card
                title={c.title}
                extra={
                  <Flex align="center" gap={10}>
                    <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navTo(c.route || 'dashboard')}>
                      {c.meta}
                    </Button>
                  </Flex>
                }
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                styles={{ header: { flexWrap: 'wrap', gap: 8 }, body: { flex: 1, display: 'flex', flexDirection: 'column', gap: 12 } }}
              >
                <DynamicChart chart={c} />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* DASHBOARD LISTS */}
      {dashLists.length > 0 && (
        <Row gutter={[24, 24]}>
          {dashLists.map((l, i) => (
            <Col key={l.uid || i} xs={24} xl={12}>
              <Card
                title={l.title}
                extra={l.linkLabel && (
                  <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navTo(l.route || 'dashboard')}>
                    {l.linkLabel}
                  </Button>
                )}
                style={{ height: '100%' }}
                styles={{ body: { padding: 0 } }}
              >
                {/* Custom Table View for Custom Lists */}
                {l.isTable && l.tRows && l.tRows.length > 0 && (
                  <Table
                    columns={listColumns(l)}
                    dataSource={l.tRows}
                    rowKey={(r) => l.tRows.indexOf(r)}
                    tableLayout="auto"
                    scroll={{ x: 'max-content' }}
                    pagination={false}
                    size="small"
                  />
                )}

                {/* Standard List Items */}
                {!l.isTable && l.items && l.items.map((x, xi) => {
                  const isNoClick = l.noLink || l.id === 'openExceptions' || l.module === 'exceptions';
                  return (
                    <Flex
                      key={xi}
                      align="center"
                      gap={12}
                      role={isNoClick ? undefined : 'button'}
                      tabIndex={isNoClick ? undefined : 0}
                      onClick={isNoClick ? undefined : () => openDashItem(x)}
                      onKeyDown={isNoClick ? undefined : e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDashItem(x); } }}
                      style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-default)', cursor: isNoClick ? 'default' : 'pointer' }}
                    >
                      <Badge color={x.dot || 'var(--color-brand)'} />
                      <Flex vertical flex={1} style={{ minWidth: 0 }}>
                        <Typography.Text strong style={{ color: 'var(--text-heading)', fontFamily: x.mono ? 'var(--font-mono)' : undefined }}>
                          {x.title}
                        </Typography.Text>
                        <Typography.Text type="secondary" ellipsis style={{ fontSize: 13 }}>
                          {x.detail}
                        </Typography.Text>
                      </Flex>
                      <Typography.Text strong type={x.metaColor ? undefined : 'secondary'} style={{ whiteSpace: 'nowrap', fontSize: x.metaColor ? 14 : 12, color: x.metaColor || undefined }}>
                        {x.meta}
                      </Typography.Text>
                    </Flex>
                  );
                })}

                {((!l.isTable && (!l.items || l.items.length === 0)) || (l.isTable && (!l.tRows || l.tRows.length === 0))) && (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={l.empty || 'No records.'} style={{ padding: '24px 0' }} />
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}

    </Flex>
  );
};

export default Dashboard;
