import React, { useEffect, useState } from 'react';
import { MapPin, Clock, TriangleAlert, Search, Building2, Users, Truck, Tag as TagIcon, Flag } from 'lucide-react';
import dayjs from 'dayjs';
import {
  Alert, Button, Card, Col, DatePicker, Descriptions, Empty, Flex, Form, Input, Pagination, Row,
  Select, Space, Statistic, Table, Tag, Timeline, Typography,
} from 'antd';
import { AimOutlined, ClockCircleOutlined, EnvironmentOutlined, WarningOutlined } from '@ant-design/icons';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import FleetTrackModal from './FleetTrackModal';
import VehicleActivityModal, { ActivityBar, ACTIVITY_TONE, IdleNowPanel } from './VehicleActivityModal';
import { ACTIVITY, fmtDuration, minutesAgo, vehicleActivity, withIdlePlaces } from '../../../utils/vehicleActivity';
import { useDebounce } from '../../../utils/debounce';
import { matchesSearch as textMatches } from '../../../utils/search';
import { evaluateDateRange } from '../Reports/reportEngine';
// Shared filter-bar styles (.tl-filters) — the same bar as the Trips page.
import '../../../styles/tripDetail.css';

const DATE_FMT = 'YYYY-MM-DD';
const EMPTY_FILTERS = { branch: '', client: '', vehicles: [], type: '', flag: '', from: '', to: '' };

// Client-side paging for the card grids (default 10 / page). Any change to `resetKeys`
// (filters, search) or the page size sends the grid back to page 1.
const usePagedCards = (items, resetKeys, noun) => {
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setCurrent(1); }, [pageSize, ...resetKeys]);
  const total = items.length;
  const page = Math.min(current, Math.max(1, Math.ceil(total / pageSize)));
  return {
    rows: items.slice((page - 1) * pageSize, page * pageSize),
    pagination: {
      current: page,
      pageSize,
      total,
      showSizeChanger: true,
      pageSizeOptions: [10, 20, 50, 100],
      showTotal: (t, [a, b]) => `Showing ${a} to ${b} of ${t} ${noun}`,
      onChange: (p, size) => {
        if (size !== pageSize) setPageSize(size);
        else setCurrent(p);
      },
    },
  };
};

// Status / state → antd Tag preset (green / amber / blue / red / grey as before).
const STATUS_TAG = { Running: 'success', Idle: 'warning', Maintenance: 'processing' };
const GPS_TAG = { OK: 'success', Weak: 'warning' };
const DIVERSION_TAG = { 'Off route now': 'error', Rejoined: 'warning', Reviewed: 'default' };

// Card edge + status chip colours, one entry per vehicle status.
const FLEET_TONES = {
  Running: { edge: 'var(--good-600)', bg: 'var(--good-100)', fg: 'var(--good-800)' },
  Idle: { edge: 'var(--kr-saffron-500)', bg: 'var(--kr-saffron-100)', fg: '#7A4300' },
  Maintenance: { edge: 'var(--st-enroute-edge)', bg: 'var(--st-enroute-bg)', fg: 'var(--st-enroute-fg)' },
  default: { edge: 'var(--kr-grey-300)', bg: 'var(--kr-grey-100)', fg: 'var(--kr-grey-700)' },
};

export const FleetMonitor = () => {
  const { T, fleetFilter, setFleetFilter, navTo, deleted } = useTMSAdmin();
  const tms = T();
  const [trackId, setTrackId] = useState(null);
  const [idleDurationFilter, setIdleDurationFilter] = useState('all');
  const [fleetQ, setFleetQ] = useState('');
  const debouncedFleetQ = useDebounce(fleetQ, 300);

  const ff = fleetFilter;
  const trips = (tms.trips || []).filter(t => !deleted.includes(t.id));

  /* ------------------------------------------------------------------- */
  /* Filter bar — the same filters as the Trips page, applied to whichever */
  /* cards the current tab shows.                                          */
  /* ------------------------------------------------------------------- */
  const [flt, setFlt] = useState(EMPTY_FILTERS);
  const patchFlt = (p) => setFlt(prev => ({ ...prev, ...p }));
  const fltKey = JSON.stringify(flt);
  const hasFilters = fltKey !== JSON.stringify(EMPTY_FILTERS);

  const allVehicles = tms.vehicles || [];
  // Clients narrow to the branch: its own clients plus any client a vehicle of that branch serves.
  const clientsOfBranch = (branch) => (tms.clients || []).filter(c =>
    !branch || c.branch === branch || allVehicles.some(v => v.branch === branch && (v.clients || []).includes(c.id)));
  const branchOptions = (tms.branches || []).map(b => ({ value: b.id, label: b.name }));
  const clientOptions = clientsOfBranch(flt.branch).map(c => ({ value: c.id, label: c.name }));
  const vehicleOptions = allVehicles
    .filter(v => (!flt.branch || v.branch === flt.branch) && (!flt.client || (v.clients || []).includes(flt.client)))
    .map(v => ({ value: v.id, label: v.number }));
  const typeOptions = [...new Set(allVehicles.map(v => v.type).filter(Boolean))].map(t => ({ value: t, label: t }));
  const flagOptions = [{ value: 'flagged', label: 'Flagged' }, { value: 'clean', label: 'No flagged' }];

  // Does this vehicle pass the branch / client / vehicle / type filters?
  const vehPass = (v) => !!v &&
    (!flt.branch || v.branch === flt.branch) &&
    (!flt.client || (v.clients || []).includes(flt.client)) &&
    (!flt.vehicles.length || flt.vehicles.includes(v.id)) &&
    (!flt.type || v.type === flt.type);
  const flagPass = (flagged) => !flt.flag || (flt.flag === 'flagged' ? flagged : !flagged);
  // Trip-based cards (diversions, non-billable) filter on the trip itself and its opened date.
  const tripPass = (t) =>
    (!flt.branch || t.branch === flt.branch) &&
    (!flt.client || t.client === flt.client) &&
    (!flt.vehicles.length || flt.vehicles.includes(t.vehicle)) &&
    (!flt.type || (tms.V[t.vehicle] || {}).type === flt.type) &&
    flagPass((t.flags || []).length > 0) &&
    evaluateDateRange(t.opened, dateRange);
  const dateRange = { from: flt.from, to: flt.to };
  const hasDates = !!(flt.from || flt.to);
  // Vehicle cards follow the GPS, not trips: a vehicle passes the From / To dates
  // when its tracker reported inside the range. No device fitted → no data;
  // a failed tracker only counts up to its last fix.
  const rangeStart = flt.from ? dayjs(flt.from).startOf('day') : null;
  const rangeEnd = flt.to ? dayjs(flt.to).endOf('day') : null;
  const vehDatePass = (v) => {
    if (!hasDates) return true;
    if (v.gps === 'Pending') return false;
    if (v.gps === 'Failed' && rangeStart) {
      const ago = minutesAgo(v.lastSeen);
      if (ago != null && dayjs().subtract(ago, 'minute').isBefore(rangeStart)) return false;
    }
    return !rangeStart || !rangeStart.isAfter(dayjs());
  };

  // The single Date beside the search picks which day's GPS timeline the cards
  // show. It stays inside the From / To range: no pick means today, or the
  // range's last day when today is outside it.
  const [activityId, setActivityId] = useState(null);
  const [tlDate, setTlDate] = useState('');
  const today = dayjs().startOf('day');
  const clampDay = (d) => {
    if (rangeEnd && d.isAfter(rangeEnd, 'day')) d = rangeEnd.startOf('day');
    if (rangeStart && d.isBefore(rangeStart, 'day')) d = rangeStart;
    return d.isAfter(today, 'day') ? today : d;
  };
  const timelineDay = clampDay(tlDate ? dayjs(tlDate) : today);
  const isToday = timelineDay.isSame(today, 'day');
  const activityRange = (() => {
    const end = timelineDay.endOf('day');
    return { from: timelineDay.startOf('day'), to: end.isAfter(dayjs()) ? dayjs() : end };
  })();
  const dayLabel = isToday ? 'Today' : activityRange.from.format('DD MMM YYYY');

  // Radius alerts are today's live breaches (they carry a time, not a date), so
  // they show only while today falls inside the From / To range.
  const todayInRange = evaluateDateRange(dayjs().format(DATE_FMT), dateRange);
  // Radius alerts: vehicles by their own record, supervisors by branch and client.
  const alertPass = (a) => {
    if (!todayInRange) return false;
    if (a.kind === 'vehicle') return vehPass(tms.V[a.ref]);
    const s = tms.S[a.ref] || {};
    return !flt.vehicles.length && !flt.type &&
      (!flt.branch || s.branch === flt.branch) &&
      (!flt.client || (s.clientIds || []).includes(flt.client));
  };

  // Fleet Vehicles
  const fleetAll = (tms.vehicles || []).map(v => {
    let idleHours = 0;
    let idleText = v.lastSeen;

    if (v.id === 'V02') { idleHours = 1.5; idleText = '1 h 30 min ago'; }
    else if (v.id === 'V04') { idleHours = 2.5; idleText = '2 h 30 min ago'; }
    else if (v.id === 'V08') { idleHours = 0.5; idleText = '30 min ago'; }
    else if (v.id === 'V10') { idleHours = 4.5; idleText = '4 h 30 min ago'; }
    else if (v.status === 'Idle') { idleHours = 1.2; idleText = '1 h 12 min ago'; }

    return {
      ...v,
      idleHours,
      lastSeen: idleText,
      branchName: (tms.B[v.branch] || {}).name,
      // Mock GPS tracker report of the vehicle standing still now (live feed later).
      gpsIdle: (tms.gpsIdleReports || []).find(r => r.vehicle === v.id) || null,
      driverName: v.driver && tms.D[v.driver] ? tms.D[v.driver].name : 'No driver',
      gpsColor: v.gps === 'OK' ? 'var(--good-600)' : v.gps === 'Weak' ? 'var(--kr-saffron-600)' : 'var(--kr-red-600)',
      gpsBg: v.gps === 'OK' ? 'var(--good-100)' : v.gps === 'Weak' ? 'var(--kr-saffron-100)' : 'var(--kr-red-100)',
      // Each card is edged and chipped in its own status colour.
      tone: FLEET_TONES[v.status] || FLEET_TONES.default,
      radiusAlert: v.id === 'V04'
        ? 'Left Ambattur Cold Store 100 m radius at 02:14 without an open trip.'
        : v.id === 'V05'
        ? 'No GPS fix for 2 h 14 min. Distance falling back to odometer.'
        : false,
    };
  });

  const fleetCards = fleetAll.filter(v => {
    const matchesCategory =
      ff === 'all' ||
      (ff === 'running' && v.status === 'Running') ||
      (ff === 'idle' && v.status === 'Idle') ||
      (ff === 'maint' && v.status === 'Maintenance') ||
      (ff === 'gps' && v.gps !== 'OK');

    const targetMinHours = (ff === 'idle' && idleDurationFilter !== 'all') ? Number(idleDurationFilter) : 0;
    const matchesDuration = ff !== 'idle' || idleDurationFilter === 'all' || v.idleHours > targetMinHours;

    const q = debouncedFleetQ.trim().toLowerCase();
    const matchesSearch = !q || (
      (v.number && v.number.toLowerCase().includes(q)) ||
      (v.type && v.type.toLowerCase().includes(q)) ||
      (v.branchName && v.branchName.toLowerCase().includes(q)) ||
      (v.route && v.route.toLowerCase().includes(q)) ||
      (v.driverName && v.driverName.toLowerCase().includes(q)) ||
      (v.status && v.status.toLowerCase().includes(q)) ||
      (v.gps && v.gps.toLowerCase().includes(q)) ||
      (v.radiusAlert && v.radiusAlert.toLowerCase().includes(q)) ||
      (v.lastSeen && v.lastSeen.toLowerCase().includes(q))
    );

    return matchesCategory && matchesDuration && matchesSearch &&
      vehPass(v) && flagPass(v.gps !== 'OK' || !!v.radiusAlert) && vehDatePass(v);
  });

  // A branch can run hundreds of vehicles, so the grid is paged like every other list (default 10 / page).
  const fleetPg = usePagedCards(fleetCards, [ff, idleDurationFilter, debouncedFleetQ, fltKey], 'vehicles');

  const gpsTone = g => g === 'OK' ? 'var(--good-600)' : g === 'Weak' ? 'var(--kr-saffron-600)' : 'var(--kr-red-600)';

  // Diversions
  const divStates = {
    'Off route now': ['var(--kr-red-100)', 'var(--kr-red-800)', 'var(--kr-red-600)', 'tmsPulse 1.6s ease-in-out infinite'],
    'Rejoined': ['var(--color-hazard-soft)', '#7A4300', 'var(--kr-saffron-500)', 'none'],
    'Reviewed': ['var(--kr-grey-100)', 'var(--kr-grey-700)', 'var(--kr-grey-500)', 'none'],
  };
  const divOrder = { 'Off route now': 0, 'Rejoined': 1, 'Reviewed': 2 };
  const divCards = trips
    .filter(t => t.diversion && tripPass(t))
    .sort((a, b) => (divOrder[a.diversion.state] ?? 3) - (divOrder[b.diversion.state] ?? 3))
    .map(t => {
      const dv = t.diversion;
      const st = divStates[dv.state] || divStates.Reviewed;
      const v = tms.V[t.vehicle] || {};
      const d = tms.D[t.driver] || {};
      const b = tms.B[t.branch] || {};
      const c = tms.C[t.client] || {};
      const drvName = Array.isArray(t.drivers) && t.drivers.length > 0
        ? t.drivers.map(id => tms.D[id]?.name || id).join(', ')
        : (t.driverNames || d.name || t.driver || '—');
      return {
        id: t.id,
        number: t.number,
        state: dv.state,
        stateBg: st[0],
        stateFg: st[1],
        edge: st[2],
        pulse: st[3],
        crewLine: `${v.number || t.vehicle} · ${drvName} · ${b.name || t.branch}`,
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
  const filteredDivCards = divCards.filter(d => {
    if (!debouncedFleetQ.trim()) return true;
    const q = debouncedFleetQ.trim().toLowerCase();
    return (
      (d.number && d.number.toLowerCase().includes(q)) ||
      (d.crewLine && d.crewLine.toLowerCase().includes(q)) ||
      (d.routeLine && d.routeLine.toLowerCase().includes(q)) ||
      (d.state && d.state.toLowerCase().includes(q)) ||
      (d.expected && d.expected.toLowerCase().includes(q)) ||
      (d.actual && d.actual.toLowerCase().includes(q)) ||
      (d.at && d.at.toLowerCase().includes(q))
    );
  });
  const divPg = usePagedCards(filteredDivCards, [ff, debouncedFleetQ, fltKey], 'flagged routes');

  const divSummary = {
    count: divCards.length,
    live: divCards.filter(d => d.state === 'Off route now').length,
    over: trips.filter(t => t.diversion && tripPass(t) && t.diversion.offKm > 20).length,
  };

  // Non-billable trips
  const nbTrips = trips.filter(t => t.type === 'Non-Business' && tripPass(t));
  const nbCards = nbTrips.map(t => {
    const tr = t.track || { points: [] };
    const v = tms.V[t.vehicle] || {};
    const d = tms.D[t.driver] || {};
    const b = tms.B[t.branch] || {};
    const drvName = Array.isArray(t.drivers) && t.drivers.length > 0
      ? t.drivers.map(id => tms.D[id]?.name || id).join(', ')
      : (t.driverNames || d.name || t.driver || '—');
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
      crewLine: `${v.number || t.vehicle} · ${drvName} · ${b.name || t.branch}`,
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

  const filteredNbCards = nbCards.filter(n => {
    if (!debouncedFleetQ.trim()) return true;
    const q = debouncedFleetQ.trim().toLowerCase();
    return (
      (n.number && n.number.toLowerCase().includes(q)) ||
      (n.reason && n.reason.toLowerCase().includes(q)) ||
      (n.status && n.status.toLowerCase().includes(q)) ||
      (n.crewLine && n.crewLine.toLowerCase().includes(q)) ||
      (n.fromTo && n.fromTo.toLowerCase().includes(q))
    );
  });
  const nbPg = usePagedCards(filteredNbCards, [ff, debouncedFleetQ, fltKey], 'movements');

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
  const rbAlerts = (tms.radiusAlerts || []).filter(alertPass);
  const rbCards = rbAlerts.map(a => {
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

  const filteredRbCards = rbCards.filter(r => {
    if (!debouncedFleetQ.trim()) return true;
    const q = debouncedFleetQ.trim().toLowerCase();
    return (
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.kindLabel && r.kindLabel.toLowerCase().includes(q)) ||
      (r.place && r.place.toLowerCase().includes(q)) ||
      (r.zoneText && r.zoneText.toLowerCase().includes(q)) ||
      (r.away && r.away.toLowerCase().includes(q))
    );
  });
  const rbPg = usePagedCards(filteredRbCards, [ff, debouncedFleetQ, fltKey], 'alerts');

  // Every card in this view is an open breach, so they carry a tint by default.
  const rbTiles = [
    { label: 'Active alerts', value: rbCards.length, color: 'var(--kr-red-700)', bg: 'var(--kr-red-100)', edge: 'var(--kr-red-600)' },
    { label: 'Vehicles', value: rbAlerts.filter(a => a.kind === 'vehicle').length, color: 'var(--text-heading)', bg: 'var(--st-enroute-bg)', edge: 'var(--st-enroute-edge)' },
    { label: 'Supervisors', value: rbAlerts.filter(a => a.kind === 'supervisor').length, color: 'var(--text-heading)', bg: 'var(--color-brand-tint)', edge: 'var(--color-brand)' },
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
  ];

  const fleetTiles = [
    { label: 'Fleet', value: 722, edge: 'var(--color-brand)' },
    { label: 'Running', value: 281, edge: 'var(--color-brand)' },
    { label: 'Idle · no business', value: 296, edge: 'var(--st-enroute-edge)' },
    { label: 'Idle · no driver', value: 88, edge: 'var(--kr-saffron-500)' },
    { label: 'Maintenance', value: 57, edge: 'var(--kr-grey-500)' },
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

  const fallbackColumns = [
    { title: 'Odometer', dataIndex: 'o', key: 'o' },
    { title: 'GPS', dataIndex: 'g', key: 'g' },
    { title: 'Action', dataIndex: 'a', key: 'a', render: (v, r) => <Typography.Text strong style={{ color: r.color }}>{v}</Typography.Text> },
  ];

  const kicker = { fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' };
  const bigValue = { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--text-heading)', whiteSpace: 'nowrap' };
  const unitStyle = { fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' };
  const dot = (color, size = 7, animation) => (
    <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: color, flex: 'none', animation }} />
  );

  return (
    <Flex vertical gap={20}>
      {/* 5 KPI Tiles */}
      <Row gutter={[12, 12]}>
        {fleetTiles.map((k, idx) => (
          <Col key={idx} flex="1 1 150px">
            <Card size="small" className="tms-kpi" style={{ height: '100%', '--kpi': k.edge }}>
              <Statistic groupSeparator=""
                title={<span className="tms-kpi-label">{k.label}</span>}
                value={k.value}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters Bar — same filters as the Trips page */}
      <Card className="tl-filters" styles={{ body: { padding: '18px 20px' } }}>
        <Form layout="vertical">
          <Flex gap={14} wrap align="flex-end">
            <Form.Item label="Branch" className="tl-filter" style={{ width: 190 }}>
              <Select
                prefix={<Building2 size={17} />}
                value={flt.branch}
                options={[{ value: '', label: 'All branches' }, ...branchOptions]}
                popupMatchSelectWidth={false}
                // A new branch drops any client or vehicle it does not own.
                onChange={(v) => patchFlt({
                  branch: v,
                  client: flt.client && clientsOfBranch(v).some(c => c.id === flt.client) ? flt.client : '',
                  vehicles: flt.vehicles.filter(id => !v || (tms.V[id] || {}).branch === v),
                })}
              />
            </Form.Item>
            <Form.Item label="Client" className="tl-filter" style={{ width: 200 }}>
              <Select
                prefix={<Users size={17} />}
                value={flt.client}
                options={[{ value: '', label: 'All clients' }, ...clientOptions]}
                popupMatchSelectWidth={false}
                showSearch={{ filterOption: (input, o) => textMatches(input, o.label) }}
                onChange={(v) => patchFlt({
                  client: v,
                  vehicles: flt.vehicles.filter(id => !v || ((tms.V[id] || {}).clients || []).includes(v)),
                })}
              />
            </Form.Item>
            <Form.Item label="Vehicle" className="tl-filter" style={{ width: 210 }}>
              <Select
                mode="multiple"
                prefix={<Truck size={17} />}
                placeholder="All vehicles"
                value={flt.vehicles}
                options={vehicleOptions}
                onChange={(ids) => patchFlt({ vehicles: ids })}
                maxTagCount={0}
                maxTagPlaceholder={() => (flt.vehicles.length === 1
                  ? (tms.V[flt.vehicles[0]] || {}).number || '1 vehicle'
                  : `${flt.vehicles.length} vehicles`)}
                popupMatchSelectWidth={240}
                showSearch={{ filterOption: (input, o) => textMatches(input, o.label) }}
              />
            </Form.Item>
            <Form.Item label="Type" className="tl-filter" style={{ width: 200 }}>
              <Select
                prefix={<TagIcon size={17} />}
                value={flt.type}
                options={[{ value: '', label: 'All types' }, ...typeOptions]}
                popupMatchSelectWidth={false}
                onChange={(v) => patchFlt({ type: v })}
              />
            </Form.Item>
            <Form.Item label="Flags" className="tl-filter" style={{ width: 160 }}>
              <Select
                prefix={<Flag size={17} />}
                value={flt.flag}
                options={[{ value: '', label: 'All flags' }, ...flagOptions]}
                popupMatchSelectWidth={false}
                onChange={(v) => patchFlt({ flag: v })}
              />
            </Form.Item>
            {/* Vehicles match on trips opened in the range; trip cards on their own opened date. */}
            <Form.Item label="From date" className="tl-filter" style={{ width: 170 }}>
              <DatePicker
                value={flt.from ? dayjs(flt.from) : null}
                format="DD MMM YYYY"
                placeholder="From date"
                disabledDate={d => !!flt.to && d.isAfter(dayjs(flt.to), 'day')}
                onChange={d => patchFlt({ from: d ? d.format(DATE_FMT) : '' })}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="To date" className="tl-filter" style={{ width: 170 }}>
              <DatePicker
                value={flt.to ? dayjs(flt.to) : null}
                format="DD MMM YYYY"
                placeholder="To date"
                disabledDate={d => !!flt.from && d.isBefore(dayjs(flt.from), 'day')}
                onChange={d => patchFlt({ to: d ? d.format(DATE_FMT) : '' })}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Button onClick={() => { setFlt(EMPTY_FILTERS); setFleetQ(''); setTlDate(''); }} disabled={!hasFilters && !fleetQ && !tlDate}>
              Clear
            </Button>
          </Flex>
        </Form>
      </Card>

      {/* Filter Pills, Search Bar, and Right Side Duration Filter Option */}
      <Flex justify="space-between" align="center" gap={12} wrap>
        <Flex gap={8} wrap align="center" style={{ flex: '1 1 auto', minWidth: 0 }}>
          {/* View tabs as rounded pill buttons; the active one is filled. */}
          <Flex gap={8} wrap role="tablist" aria-label="Fleet view">
            {fleetFilters.map(f => (
              <Button
                key={f.id}
                shape="round"
                role="tab"
                aria-selected={ff === f.id}
                type={ff === f.id ? 'primary' : 'default'}
                onClick={() => {
                  setFleetFilter(f.id);
                  if (f.id !== 'idle') setIdleDurationFilter('all');
                }}
                style={{ fontWeight: 600 }}
              >
                {f.label}
              </Button>
            ))}
          </Flex>

          <Input
            allowClear
            prefix={<Search size={15} style={{ color: 'var(--text-muted)' }} />}
            placeholder={
              ff === 'diversion'
                ? 'Search route diversions...'
                : ff === 'nonbill'
                ? 'Search non-billable trips...'
                : ff === 'radius'
                ? 'Search radius alerts...'
                : 'Search vehicles, drivers, routes...'
            }
            value={fleetQ}
            onChange={(e) => setFleetQ(e.target.value)}
            aria-label="Search fleet vehicles and GPS health"
            style={{ flex: '1 1 250px', maxWidth: 360 }}
          />

          {/* The day whose GPS running / idle times the vehicle cards show. Empty means today. */}
          {fleetShowVehicles && (
            <DatePicker
              value={isToday && !tlDate ? null : timelineDay}
              format="DD MMM YYYY"
              placeholder="Today"
              aria-label="Timeline date"
              // Only days inside the From / To range, and never the future.
              disabledDate={d => d.isAfter(dayjs(), 'day')
                || (rangeStart && d.isBefore(rangeStart, 'day'))
                || (rangeEnd && d.isAfter(rangeEnd, 'day'))}
              onChange={d => setTlDate(d ? d.format(DATE_FMT) : '')}
              style={{ width: 170 }}
            />
          )}
        </Flex>

        {/* Right side duration filter option — ONLY shown in IDLE section */}
        {ff === 'idle' && (
          <Select
            value={idleDurationFilter}
            onChange={setIdleDurationFilter}
            options={[
              { value: 'all', label: 'All durations' },
              { value: '1', label: 'More than 1 hour' },
              { value: '2', label: 'More than 2 hours' },
              { value: '3', label: 'More than 3 hours' },
              { value: '4', label: 'More than 4 hours' },
            ]}
            prefix={<Clock size={15} />}
            aria-label="Idle duration"
            style={{ width: 200, maxWidth: '100%', marginLeft: 'auto' }}
          />
        )}
      </Flex>

      {/* VEHICLES VIEW */}
      {fleetShowVehicles && (
        fleetCards.length === 0 ? (
          <Card>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                fleetQ ? (
                  <>
                    <Typography.Text strong style={{ display: 'block' }}>No vehicles matching "{fleetQ}"</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>Try searching by registration number, driver, branch, or route.</Typography.Text>
                  </>
                ) : hasFilters ? (
                  'No vehicles match the selected filters.'
                ) : (
                  `No idle vehicles match the selected duration filter ${idleDurationFilter !== 'all' ? `(more than ${idleDurationFilter} ${idleDurationFilter === '1' ? 'hour' : 'hours'})` : ''}.`
                )
              }
            >
              {fleetQ && (
                <Button type="link" onClick={() => setFleetQ('')}>
                  Clear search &rarr;
                </Button>
              )}
              {!fleetQ && hasFilters && (
                <Button type="link" onClick={() => setFlt(EMPTY_FILTERS)}>
                  Clear filters &rarr;
                </Button>
              )}
            </Empty>
          </Card>
        ) : (
          <>
          <Row gutter={[16, 16]}>
            {fleetPg.rows.map(v => {
              const act = vehicleActivity(v, activityRange.from.valueOf(), activityRange.to.valueOf());
              // If GPS shows the vehicle standing right now, one message says where, since when and why.
              const lastSpan = withIdlePlaces(act.segments.slice(-1), v, tms)[0];
              const idleNow = isToday && lastSpan && lastSpan.state === ACTIVITY.IDLE ? lastSpan : null;
              return (
              <Col key={v.id} xs={24} sm={12} xl={8} xxl={6}>
                <Card
                  hoverable
                  role="button"
                  tabIndex={0}
                  aria-label={`Track ${v.number} on the map`}
                  onClick={() => setTrackId(v.id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTrackId(v.id); } }}
                  style={{ height: '100%', borderLeft: `4px solid ${v.tone.edge}` }}
                  styles={{ body: { height: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px' } }}
                >
                  {/* Plate + GPS state */}
                  <Flex justify="space-between" align="center" gap={8}>
                    <Typography.Text style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                      {v.number}
                    </Typography.Text>
                    <Tag color={GPS_TAG[v.gps] || 'error'} title={`GPS ${v.gps}`} style={{ ...kicker, fontSize: 10.5, marginInlineEnd: 0 }}>
                      {v.gps}
                    </Tag>
                  </Flex>

                  <Typography.Text type="secondary" ellipsis style={{ fontSize: 12.5 }}>
                    {v.type} · {v.branchName}
                  </Typography.Text>

                  {/* Body takes the slack, so every footer in a row lines up */}
                  <Flex vertical gap={8} style={{ flex: 1, minHeight: 46 }}>
                    <Typography.Paragraph
                      strong
                      ellipsis={{ rows: 2, tooltip: v.route }}
                      style={{ margin: 0, lineHeight: 1.4, color: 'var(--text-heading)' }}
                    >
                      {v.route}
                    </Typography.Paragraph>
                    {v.radiusAlert && (
                      <Alert type="warning" showIcon icon={<TriangleAlert size={13} />} title={v.radiusAlert} style={{ fontSize: 12.5, padding: '8px 10px' }} />
                    )}
                    {idleNow && <IdleNowPanel span={idleNow} />}
                  </Flex>

                  {/* Status, driver and last fix, on one aligned line */}
                  <Flex align="center" gap={8} style={{ borderTop: '1px solid var(--border-default)', paddingTop: 10, fontSize: 12.5 }}>
                    <Tag color={STATUS_TAG[v.status] || 'default'} style={{ ...kicker, fontSize: 10.5, letterSpacing: '0.06em', marginInlineEnd: 0 }}>
                      {v.status}
                    </Tag>
                    <Typography.Text type="secondary" ellipsis style={{ fontSize: 12.5, minWidth: 0 }}>{v.driverName}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12.5, marginLeft: 'auto', flex: 'none', whiteSpace: 'nowrap' }}>{v.lastSeen}</Typography.Text>
                  </Flex>

                  {/* The selected day's Running / Idle times, from GPS */}
                  {act.segments.every(s => s.state === ACTIVITY.NO_GPS) ? (
                    <Flex justify="space-between" gap={8}>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{dayLabel}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>No GPS data for this day</Typography.Text>
                    </Flex>
                  ) : (
                    <Flex vertical gap={6}>
                      <Flex justify="space-between" gap={8}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{dayLabel}</Typography.Text>
                        <Typography.Text style={{ fontSize: 12 }}>
                          <span style={{ color: 'var(--good-700)', fontWeight: 700 }}>Run {fmtDuration(act.summary.running)}</span>
                          {' · '}
                          <span style={{ color: '#7A4300', fontWeight: 700 }}>Idle {fmtDuration(act.summary.idle)}</span>
                        </Typography.Text>
                      </Flex>
                      <ActivityBar segments={act.segments} height={8} />
                      <div
                        className="fl-spans"
                        onClick={e => e.stopPropagation()}
                        style={{ maxHeight: 118, overflowY: 'auto', border: '1px solid var(--border-default)', borderRadius: 8 }}
                      >
                        {act.segments.map((s, i) => (
                          <Flex
                            key={i}
                            align="center"
                            gap={8}
                            style={{ padding: '4px 10px', fontSize: 12, borderTop: i ? '1px solid var(--border-default)' : 0 }}
                          >
                            <span style={{ width: 8, height: 8, borderRadius: 2, flex: 'none', background: ACTIVITY_TONE[s.state].color }} />
                            <Typography.Text style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                              {dayjs(s.start).format('HH:mm')} – {dayjs(s.end).format('HH:mm')}
                            </Typography.Text>
                            <Typography.Text strong style={{ fontSize: 12, color: s.state === ACTIVITY.RUNNING ? 'var(--good-700)' : s.state === ACTIVITY.IDLE ? '#7A4300' : 'var(--text-muted)' }}>
                              {s.state}
                            </Typography.Text>
                            <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                              {fmtDuration(s.minutes)}
                            </Typography.Text>
                          </Flex>
                        ))}
                      </div>
                    </Flex>
                  )}

                  <Flex justify="space-between" align="center" gap={8}>
                    <Space size={6} style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-brand)' }}>
                      <MapPin size={13} /> Track on map
                    </Space>
                    <Button
                      type="link"
                      size="small"
                      icon={<Clock size={13} />}
                      style={{ paddingInline: 0, fontSize: 12, fontWeight: 700 }}
                      onClick={e => { e.stopPropagation(); setActivityId(v.id); }}
                      onKeyDown={e => e.stopPropagation()}
                    >
                      Activity timeline
                    </Button>
                  </Flex>
                </Card>
              </Col>
              );
            })}
          </Row>
          <Card size="small">
            <Pagination align="end" {...fleetPg.pagination} />
          </Card>
          </>
        )
      )}

      {trackId && (() => {
        const v = fleetAll.find(x => x.id === trackId);
        const trip = trips.find(t => t.vehicle === trackId && t.status !== 'Closed');
        return (
          <FleetTrackModal
            vehicle={v}
            trip={trip}
            tms={tms}
            onClose={() => setTrackId(null)}
            onOpenTrip={id => { setTrackId(null); navTo('trip', { selectedTrip: id }); }}
          />
        );
      })()}

      {activityId && (
        <VehicleActivityModal
          vehicle={fleetAll.find(x => x.id === activityId)}
          tms={tms}
          initialFrom={activityRange.from}
          initialTo={activityRange.to}
          onClose={() => setActivityId(null)}
        />
      )}

      {/* DIVERSIONS VIEW */}
      {fleetShowDiversion && (
        <Flex vertical gap={16}>
          <Flex justify="space-between" align="baseline" gap={12} wrap>
            <Typography.Text type="secondary">
              <Typography.Text strong>{divSummary.count}</Typography.Text> flagged routes · {divSummary.live} off route now · {divSummary.over} over 20 km
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Alert fires when a vehicle leaves its fixed corridor by more than 10 km
            </Typography.Text>
          </Flex>
          {filteredDivCards.length === 0 ? (
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  fleetQ ? (
                    <Typography.Text strong>No route diversions matching "{fleetQ}"</Typography.Text>
                  ) : (
                    'No active route diversions detected.'
                  )
                }
              >
                {fleetQ && (
                  <Button type="link" onClick={() => setFleetQ('')}>
                    Clear search &rarr;
                  </Button>
                )}
              </Empty>
            </Card>
          ) : (
            <>
              <Row gutter={[16, 16]}>
                {divPg.rows.map(d => (
                  <Col key={d.id} xs={24} lg={12} xxl={8}>
                    <Card style={{ height: '100%', borderLeft: `4px solid ${d.edge}` }} styles={{ body: { padding: 16 } }}>
                      <Flex vertical gap={12}>
                        <Flex justify="space-between" align="center" gap={8}>
                          <Typography.Text strong style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--text-heading)' }}>
                            {d.number}
                          </Typography.Text>
                          <Tag color={DIVERSION_TAG[d.state] || 'default'} style={{ ...kicker, marginInlineEnd: 0 }}>
                            <Space size={6}>
                              {dot(d.stateFg, 7, d.pulse)}
                              {d.state}
                            </Space>
                          </Tag>
                        </Flex>
                        <div>
                          <Typography.Text strong style={{ display: 'block', fontSize: 15, color: 'var(--text-heading)' }}>{d.crewLine}</Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 13 }}>{d.routeLine}</Typography.Text>
                        </div>
                        <Card size="small" variant="borderless" style={{ background: 'var(--surface-muted)' }}>
                          <Descriptions
                            column={1}
                            size="small"
                            colon={false}
                            styles={{ label: { width: 110 }, content: { fontWeight: 600, color: 'var(--text-heading)' } }}
                            items={[
                              { key: 'expected', label: <Space size={8}>{dot('var(--color-brand)', 10)}Expected</Space>, children: d.expected },
                              {
                                key: 'actual',
                                label: <Space size={8}>{dot('var(--kr-red-600)', 10)}Actual</Space>,
                                children: <span style={{ color: 'var(--kr-red-800)' }}>{d.actual}</span>,
                              },
                              { key: 'at', label: <Space size={8}><EnvironmentOutlined />Left at</Space>, children: d.at },
                            ]}
                          />
                        </Card>
                        <Row gutter={8}>
                          {[
                            ['Off corridor', d.offKm, d.offColor],
                            ['Duration', d.minutes, 'var(--text-heading)'],
                            ['Extra distance', d.extraKm, 'var(--text-heading)'],
                          ].map(([label, value, color]) => (
                            <Col key={label} span={8}>
                              <Card size="small" style={{ height: '100%' }} styles={{ body: { padding: 10 } }}>
                                <Statistic groupSeparator=""
                                  title={label}
                                  value={value}
                                  styles={{ title: { fontSize: 12, marginBottom: 0 }, content: { ...bigValue, color } }}
                                />
                              </Card>
                            </Col>
                          ))}
                        </Row>
                        <Flex justify="space-between" align="center" gap={8} style={{ paddingTop: 10, borderTop: '1px solid var(--border-default)' }}>
                          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                            Detected {d.detected} · <Typography.Text strong style={{ fontSize: 13, color: d.gpsColor }}>GPS {d.gps}</Typography.Text>
                          </Typography.Text>
                          <Button type="link" size="small" onClick={() => navTo('trip', { selectedTrip: d.id })} style={{ paddingInline: 0 }}>
                            View trip &rarr;
                          </Button>
                        </Flex>
                      </Flex>
                    </Card>
                  </Col>
                ))}
              </Row>
              <Card size="small">
                <Pagination align="end" {...divPg.pagination} />
              </Card>
            </>
          )}
        </Flex>
      )}

      {/* NON-BILLABLE VIEW */}
      {fleetShowNonBill && (
        <Flex vertical gap={16}>
          <Flex justify="space-between" align="baseline" gap={12} wrap>
            <Typography.Text type="secondary">
              <Typography.Text strong>{nbSummary.count}</Typography.Text> non-billable movements · {nbSummary.km} km by GPS · {nbSummary.reasons}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Not invoiced. Tracked for utilisation and hidden-km checks.
            </Typography.Text>
          </Flex>
          {filteredNbCards.length === 0 ? (
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  fleetQ ? (
                    <Typography.Text strong>No non-billable movements matching "{fleetQ}"</Typography.Text>
                  ) : (
                    'No non-billable movements recorded.'
                  )
                }
              >
                {fleetQ && (
                  <Button type="link" onClick={() => setFleetQ('')}>
                    Clear search &rarr;
                  </Button>
                )}
              </Empty>
            </Card>
          ) : (
            <>
              <Row gutter={[16, 16]}>
                {nbPg.rows.map(n => (
                  <Col key={n.id} xs={24} lg={12} xxl={8}>
                    <Card style={{ height: '100%', borderLeft: '4px solid var(--kr-grey-500)' }} styles={{ body: { padding: 16 } }}>
                      <Flex vertical gap={12}>
                        <Flex justify="space-between" align="center" gap={8} wrap>
                          <Typography.Text strong style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--text-heading)' }}>
                            {n.number}
                          </Typography.Text>
                          <Space size={6}>
                            <Tag style={{ ...kicker, marginInlineEnd: 0 }}>{n.reason}</Tag>
                            <Tag color={n.status === 'Closed' ? 'default' : 'success'} style={{ ...kicker, marginInlineEnd: 0 }}>{n.status}</Tag>
                          </Space>
                        </Flex>
                        <div>
                          <Typography.Text strong style={{ display: 'block', fontSize: 15, color: 'var(--text-heading)' }}>{n.crewLine}</Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 13 }}>{n.fromTo}</Typography.Text>
                        </div>
                        <Row gutter={[8, 8]}>
                          {[
                            ['GPS', n.gpsKm, n.gpsUnit],
                            ['Odometer', n.odoKm, n.odoUnit],
                            ['Top speed', n.maxSpeed, n.speedUnit],
                            ['Idle', n.idle, n.idleUnit],
                          ].map(([label, value, unit]) => (
                            <Col key={label} xs={12} sm={6}>
                              <Card size="small" variant="borderless" style={{ height: '100%', background: 'var(--surface-muted)' }} styles={{ body: { padding: 10 } }}>
                                <Statistic groupSeparator=""
                                  title={label}
                                  value={value}
                                  suffix={unit}
                                  styles={{ title: { fontSize: 12, marginBottom: 0 }, content: bigValue, suffix: unitStyle }}
                                />
                              </Card>
                            </Col>
                          ))}
                        </Row>
                        <div>
                          <Typography.Text type="secondary" style={{ ...kicker, letterSpacing: '0.12em', display: 'block', marginBottom: 12 }}>
                            GPS timeline
                          </Typography.Text>
                          <Timeline
                            items={n.points.map((p, pIdx) => ({
                              key: pIdx,
                              color: p.dot,
                              content: (
                                <Flex justify="space-between" gap={8}>
                                  <span>
                                    <Typography.Text type="secondary" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, marginRight: 8 }}>{p.t}</Typography.Text>
                                    <Typography.Text style={{ color: 'var(--text-heading)' }}>{p.ev}</Typography.Text>
                                  </span>
                                  <Typography.Text type="secondary" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{p.km} km</Typography.Text>
                                </Flex>
                              ),
                            }))}
                          />
                        </div>
                        <Flex justify="space-between" align="center" gap={8} style={{ paddingTop: 10, borderTop: '1px solid var(--border-default)' }}>
                          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                            {n.when} · <Typography.Text strong style={{ fontSize: 13, color: n.gpsColor }}>GPS {n.gps}</Typography.Text> · last fix {n.lastFix}
                          </Typography.Text>
                          <Button type="link" size="small" onClick={() => navTo('trip', { selectedTrip: n.id })} style={{ paddingInline: 0 }}>
                            View trip &rarr;
                          </Button>
                        </Flex>
                      </Flex>
                    </Card>
                  </Col>
                ))}
              </Row>
              <Card size="small">
                <Pagination align="end" {...nbPg.pagination} />
              </Card>
            </>
          )}
        </Flex>
      )}

      {/* RADIUS ALERT VIEW */}
      {fleetShowRadius && (
        <Flex vertical gap={16}>
          <Flex justify="space-between" align="center" gap={12} wrap>
            <Tag color="success" style={{ fontSize: 13, fontWeight: 600, padding: '4px 12px', borderRadius: 999, marginInlineEnd: 0 }}>
              <Space size={8}>
                {dot('var(--color-brand)', 8, 'tmsPulse 1.6s ease-in-out infinite')}
                Live monitoring
              </Space>
            </Tag>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Vehicles and supervisors outside their safe radius right now
            </Typography.Text>
          </Flex>

          <Row gutter={[12, 12]}>
            {rbTiles.map((k, idx) => (
              <Col key={idx} xs={24} sm={8} lg={6}>
                <Card size="small" style={{ background: k.bg, borderColor: k.edge }} styles={{ body: { padding: '14px 16px' } }}>
                  <Statistic groupSeparator=""
                    title={k.label}
                    value={k.value}
                    styles={{ title: { fontSize: 14 }, content: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, lineHeight: 1.1, color: k.color } }}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          {filteredRbCards.length === 0 ? (
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  fleetQ ? (
                    <Typography.Text strong>No radius alerts matching "{fleetQ}"</Typography.Text>
                  ) : (
                    'No active radius breaches right now.'
                  )
                }
              >
                {fleetQ && (
                  <Button type="link" onClick={() => setFleetQ('')}>
                    Clear search &rarr;
                  </Button>
                )}
              </Empty>
            </Card>
          ) : (
            <>
              <Row gutter={[12, 12]}>
                {rbPg.rows.map(r => (
                  <Col key={r.id} xs={24} md={12} xl={8}>
                    <Card
                      style={{ height: '100%', background: 'var(--kr-red-50, #fdf3f3)', borderColor: 'var(--kr-red-100)', borderLeft: '4px solid var(--kr-red-600)' }}
                      styles={{ body: { padding: 16 } }}
                    >
                      <Flex vertical gap={6}>
                        <Flex justify="space-between" align="flex-start" gap={10}>
                          <Typography.Text style={{ minWidth: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-heading)' }}>
                            {r.kindLabel}: <span style={{ fontFamily: r.nameFont }}>{r.name}</span>
                          </Typography.Text>
                          <Space size={8} style={{ flex: 'none' }}>
                            <Tag color="error" style={{ fontWeight: 600, borderRadius: 999, marginInlineEnd: 0 }}>Outside radius</Tag>
                            <WarningOutlined aria-hidden="true" style={{ fontSize: 20, color: 'var(--kr-red-700)' }} />
                          </Space>
                        </Flex>
                        <Typography.Text>
                          {r.place} · {r.zoneText}
                        </Typography.Text>
                        <Space size={18} wrap>
                          <Typography.Text type="secondary">
                            <Space size={6}><ClockCircleOutlined />{r.time}</Space>
                          </Typography.Text>
                          <Typography.Text style={{ color: r.awayColor }}>
                            <Space size={6}><AimOutlined />{r.away}</Space>
                          </Typography.Text>
                        </Space>
                      </Flex>
                    </Card>
                  </Col>
                ))}
              </Row>
              <Card size="small">
                <Pagination align="end" {...rbPg.pagination} />
              </Card>
            </>
          )}
        </Flex>
      )}

      {/* Distance Fallback Table */}
      <Card
        title={
          <Typography.Title level={2} style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            Distance source fallback
          </Typography.Title>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={fallbackColumns}
          dataSource={fallbackRows}
          rowKey={r => `${r.o}-${r.g}`}
          tableLayout="auto"
          pagination={false}
        />
      </Card>
    </Flex>
  );
};

export default FleetMonitor;
