import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  Building2,
  CircleCheck,
  Download,
  Flag,
  ClockAlert,
  Play,
  Search,
  Tag as TagIcon,
  TriangleAlert,
  Truck,
  Users,
  X,
  Eye,
} from 'lucide-react';
import dayjs from 'dayjs';
import {
  Avatar, Button, Card, Col, DatePicker, Empty, Flex, Form, Input, Row, Select, Space, Statistic, Table, Tag, Tooltip, Typography,
} from 'antd';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { downloadXlsx, fileDate } from '../../../utils/spreadsheet';
import { matchesSearch } from '../../../utils/search';
import { useDebounce } from '../../../utils/debounce';
import { evaluateDateRange } from '../Reports/reportEngine';
import { isPendingClose, pendingCloseDetail, PENDING_CLOSE_LABEL, ENROUTE_LABEL, ENROUTE_LABEL_LOWER } from '../../../utils/tripStatus';
// Scoped filter-bar styles (.tl-filters) live with the other Trips page CSS.
import '../../../styles/tripDetail.css';
import { FILE_TRANSFER_ENABLED } from '../../../utils/featureFlags';

// Tab id for the exception filter — not a trip status, so it is matched separately.
const PENDING_TAB = 'pending';
// Opened-date filter bounds are kept as plain 'YYYY-MM-DD' strings in tf.
const DATE_FMT = 'YYYY-MM-DD';

export const TripList = () => {
  const {
    T,
    tf,
    setTf,
    setSelectedTrip,
    navTo,
    deleted,
    showToast,
  } = useTMSAdmin();
  const { can } = useModuleAccess();

  const tms = T();
  const trips = (tms.trips || []).filter(t => !deleted.includes(t.id)).map(t => {
    const v = tms.V[t.vehicle], d = tms.D[t.driver], c = tms.C[t.client], b = tms.B[t.branch], s = tms.S[t.supervisor];
    const long = t.status === 'Enroute' && t.hoursOpen > 24;
    const gpsBad = (t.flags || []).some(f => /GPS/.test(f));
    // A trip that has arrived but was never closed is the most actionable state,
    // so it outranks the long-open and GPS badges.
    const pendingClose = isPendingClose(t);
    const badge = t.status === 'Closed' ? ((t.flags || []).length ? 'Closed · flagged' : 'Closed')
      : pendingClose ? PENDING_CLOSE_LABEL
      : long ? 'Long open' : gpsBad ? 'GPS issue' : t.stage || ENROUTE_LABEL;
    const badgeColors = {
      [ENROUTE_LABEL]: ['var(--st-enroute-bg)', 'var(--st-enroute-fg)'],
      'Closed': ['var(--st-closed-bg)', 'var(--st-closed-fg)'],
      'Closed · flagged': ['var(--st-flagged-bg)', 'var(--st-flagged-fg)'],
      'Long open': ['var(--st-long-bg)', 'var(--st-long-fg)'],
      'GPS issue': ['var(--st-gps-bg)', 'var(--st-gps-fg)'],
      'Loading': ['var(--st-loading-bg)', 'var(--st-loading-fg)'],
      'Unloading': ['var(--st-unloading-bg)', 'var(--st-unloading-fg)'],
      'Delayed': ['var(--st-delayed-bg)', 'var(--st-delayed-fg)'],
      [PENDING_CLOSE_LABEL]: ['var(--st-pending-bg)', 'var(--st-pending-fg)'],
    };
    const [badgeBg, badgeFg] = badgeColors[badge] || ['var(--kr-grey-100)', 'var(--kr-grey-700)'];
    const flags = t.flags || [];
    return {
      ...t,
      vehicleNumber: v ? v.number : '—',
      driverName: d ? d.name : '—',
      clientName: c ? c.name : '—',
      branchName: b ? b.name : '—',
      supervisorName: s ? s.name : '—',
      badge,
      badgeBg,
      badgeFg,
      typeLabel: t.type + (t.reason ? ' · ' + t.reason : ''),
      flagText: flags.join(', ') || '—',
      flagColor: flags.length ? badgeFg : 'var(--text-muted)',
      hasFlags: flags.length > 0,
      pendingClose,
      pendingCloseDetail: pendingClose ? pendingCloseDetail(t) : '',
    };
  });

  const statusMatch = (t) =>
    !tf.status || (tf.status === PENDING_TAB ? t.pendingClose : t.status === tf.status);

  // No vehicle ticked means every vehicle, so an empty list is not a filter.
  const pickedVehicles = tf.vehicles || [];

  const tripMatch = (t, ignoreStatus) =>
    (!tf.branch || t.branch === tf.branch) &&
    (!tf.client || t.client === tf.client) &&
    evaluateDateRange(t.opened, { from: tf.from, to: tf.to }) &&
    (ignoreStatus || statusMatch(t)) &&
    (!tf.type || t.type === tf.type) &&
    (!pickedVehicles.length || pickedVehicles.includes(t.vehicle)) &&
    (!tf.flag || (tf.flag === 'flagged' ? t.hasFlags : !t.hasFlags)) &&
    matchesSearch(tf.q, t.number, t.vehicleNumber, t.driverName, t.clientName, t.unloading);

  const tripRows = trips.filter(t => tripMatch(t, false));
  const statusPool = trips.filter(t => tripMatch(t, true));

  const branchOptions = (tms.branches || []).map(b => ({ value: b.id, label: b.name }));

  // Clients narrow to the chosen branch: its own clients plus any client that
  // already has a trip run out of that branch, so no reachable trip is hidden.
  const clientsOfBranch = (branch) => (tms.clients || []).filter(c =>
    !branch || c.branch === branch || trips.some(t => t.branch === branch && t.client === c.id));
  const clientOptions = clientsOfBranch(tf.branch).map(c => ({ value: c.id, label: c.name }));
  const typeOptions = [{ value: 'Business', label: 'Business' }, { value: 'Non-Business', label: 'Non-Business' }];
  const flagOptions = [{ value: 'flagged', label: 'Flagged' }, { value: 'clean', label: 'No flagged' }];

  // Vehicles narrow to the branch already chosen, and each carries its trip count
  // so the list says how much picking it would actually show.
  const vehicleOptions = (tms.vehicles || [])
    .filter(veh => !tf.branch || veh.branch === tf.branch)
    .map(veh => ({
      value: veh.id,
      label: veh.number,
      sub: [veh.type, (tms.B[veh.branch] || {}).name].filter(Boolean).join(' · '),
      count: trips.filter(t => t.vehicle === veh.id).length,
    }));

  const setVehicles = (ids) => setTf({ ...tf, vehicles: ids });

  const tripEnrouteCount = tripRows.filter(t => t.status === 'Enroute').length;

  // Stable dayjs values: a new object each render makes an open calendar jump back to the selected month.
  const fromDay = useMemo(() => (tf.from ? dayjs(tf.from) : null), [tf.from]);
  const toDay = useMemo(() => (tf.to ? dayjs(tf.to) : null), [tf.to]);

  const [draftQ, setDraftQ] = useState(tf.q || '');
  const debouncedDraftQ = useDebounce(draftQ, 350);
  // Only the first few ticked vehicles get a chip; the rest stay behind a "+n more".
  const [allChips, setAllChips] = useState(false);
  const CHIP_CAP = 5;

  useEffect(() => { setDraftQ(tf.q || ''); }, [tf.q]);

  useEffect(() => {
    setTf(prev => {
      const trimmed = debouncedDraftQ.trim();
      return prev.q === trimmed ? prev : { ...prev, q: trimmed };
    });
  }, [debouncedDraftQ]);

  // Table paging; any filter change sends the table back to page 1.
  const [tripPage, setTripPage] = useState(1);
  const [tripPageSize, setTripPageSize] = useState(10);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setTripPage(1); }, [tf.branch, tf.client, tf.from, tf.to, tf.status, tf.type, tf.flag, tf.q, pickedVehicles.join(',')]);

  // Search text inside the vehicle dropdown (drives its "Select these n" action).
  const [vehQ, setVehQ] = useState('');
  const shownVehicles = vehicleOptions.filter(o => matchesSearch(vehQ, o.label, o.sub));
  const shownVehicleIds = shownVehicles.map(o => o.value);
  const allShownOn = shownVehicleIds.length > 0 && shownVehicleIds.every(id => pickedVehicles.includes(id));
  const toggleAllShown = () =>
    setVehicles(allShownOn
      ? pickedVehicles.filter(id => !shownVehicleIds.includes(id))
      : [...new Set([...pickedVehicles, ...shownVehicleIds])]);
  // Everything ticked narrows nothing, so it reads the same as nothing ticked.
  const vehicleTriggerText = pickedVehicles.length === vehicleOptions.length && vehicleOptions.length > 1
    ? 'All vehicles'
    : pickedVehicles.length === 1
    ? (vehicleOptions.find(o => o.value === pickedVehicles[0]) || {}).label || '1 vehicle'
    : `${pickedVehicles.length} vehicles`;

  const clearTf = () => {
    setDraftQ('');
    setTf({ branch: '', client: '', status: '', type: '', flag: '', from: '', to: '', q: '', vehicles: [] });
  };
  const runSearch = () => setTf({ ...tf, q: draftQ.trim() });

  const exportTrips = () => {
    if (!tripRows.length) { showToast('warning', 'Nothing to export', 'No trips match the current filters.'); return; }
    const cols = [
      ['Trip number', t => t.number], ['Branch', t => t.branchName], ['Vehicle', t => t.vehicleNumber], ['Driver', t => t.driverName],
      ['Client', t => t.clientName], ['Unloading', t => t.unloading], ['Type', t => t.typeLabel], ['Opened date', t => t.opened],
      ['Closed', t => t.closed], ['Start KM', t => t.startKm], ['Closing KM', t => t.closeKm], ['Invoice', t => t.invoice],
      ['LR', t => t.lr], ['Status', t => t.badge], ['Flags', t => (t.flags || []).join(', ')],
      ['Pending closure', t => (t.pendingClose ? t.pendingCloseDetail : '')],
    ];
    const name = `Trips_${fileDate()}.xlsx`;
    try {
      downloadXlsx(name, [{ name: 'Trips', columns: cols.map(c => c[0]), rows: tripRows.map(t => cols.map(c => { const v = c[1](t); return v == null ? '' : v; })) }]);
      showToast('success', 'Excel downloaded', `${name} · ${tripRows.length} trips`);
    } catch (e) {
      showToast('warning', 'Export failed', (e && e.message) || 'Could not create the Excel file.');
    }
  };

  const openTrip = (id) => {
    setSelectedTrip(id);
    navTo('trip', { selectedTrip: id });
  };

  const pendingCloseCount = trips.filter(t => t.pendingClose).length;

  // Each card is a shortcut into the filter it counts.
  const kpis = [
    { label: 'Total Trips', value: trips.length, note: 'All recorded trips', icon: Truck, bg: 'var(--st-enroute-bg)', fg: 'var(--st-enroute-edge)', apply: { status: '', flag: '' }, on: !tf.status && !tf.flag },
    { label: ENROUTE_LABEL, value: trips.filter(t => t.status === 'Enroute').length, note: 'Active trips on road', icon: Play, bg: 'var(--kr-green-100)', fg: 'var(--kr-green-700)', apply: { status: 'Enroute', flag: '' }, on: tf.status === 'Enroute' },
    { label: 'Closed', value: trips.filter(t => t.status === 'Closed').length, note: 'Completed trips', icon: CircleCheck, bg: 'var(--kr-green-100)', fg: 'var(--kr-green-600)', apply: { status: 'Closed', flag: '' }, on: tf.status === 'Closed' },
    { label: 'Pending closure', value: pendingCloseCount, note: 'Completed · not closed', icon: ClockAlert, bg: 'var(--st-pending-bg)', fg: 'var(--st-pending-edge)', apply: { status: PENDING_TAB, flag: '' }, on: tf.status === PENDING_TAB },
    { label: 'Exceptions', value: trips.filter(t => t.hasFlags).length, note: 'Flagged trips', icon: TriangleAlert, bg: 'var(--kr-red-100)', fg: 'var(--kr-red-600)', apply: { status: '', flag: 'flagged' }, on: tf.flag === 'flagged' },
  ];

  const statusTabs = [
    { id: '', label: 'All', count: statusPool.length },
    { id: 'Enroute', label: ENROUTE_LABEL, count: statusPool.filter(t => t.status === 'Enroute').length },
    { id: 'Closed', label: 'Closed', count: statusPool.filter(t => t.status === 'Closed').length },
    { id: PENDING_TAB, label: PENDING_CLOSE_LABEL, count: statusPool.filter(t => t.pendingClose).length, color: 'gold', icon: ClockAlert },
  ];

  const nowrap = { whiteSpace: 'nowrap' };
  const tripColumns = [
    { title: 'Trip number', dataIndex: 'number', key: 'number', onCell: () => ({ style: nowrap }), render: v => <Typography.Text strong>{v}</Typography.Text> },
    { title: 'Branch', dataIndex: 'branchName', key: 'branch', onCell: () => ({ style: nowrap }) },
    { title: 'Vehicle', dataIndex: 'vehicleNumber', key: 'vehicle', onCell: () => ({ style: nowrap }), render: v => <Typography.Text strong>{v}</Typography.Text> },
    { title: 'Driver', dataIndex: 'driverName', key: 'driver', onCell: () => ({ style: nowrap }) },
    {
      title: 'Client · unloading',
      key: 'client',
      onCell: () => ({ style: { maxWidth: 260 } }),
      render: (_, t) => (
        <Flex vertical>
          <Typography.Text strong>{t.clientName}</Typography.Text>
          <Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>{t.unloading}</Typography.Text>
        </Flex>
      ),
    },
    { title: 'Type', dataIndex: 'typeLabel', key: 'type', onCell: () => ({ style: { maxWidth: 150, fontSize: 13 } }) },
    {
      title: <Space size={4}>Opened date<ArrowDown size={13} /></Space>,
      dataIndex: 'opened',
      key: 'opened',
      onCell: () => ({ style: nowrap }),
    },
    {
      title: 'Status',
      key: 'status',
      // Trip states carry their own palette (var(--st-*)), which no preset colour matches.
      render: (_, t) => (
        <Tag variant="filled" className="tl-status-tag" style={{ background: t.badgeBg, color: t.badgeFg }}>
          <span className="tl-status-dot" />
          {t.badge}
        </Tag>
      ),
    },
    {
      title: 'Flags',
      key: 'flags',
      onCell: () => ({ style: { minWidth: 200, maxWidth: 260 } }),
      // One chip per flag (flagText is a comma-joined list), then the
      // pending-closure note as its own amber chip underneath.
      render: (_, t) => {
        const flags = t.hasFlags ? String(t.flagText || '').split(/\s*,\s*/).filter(Boolean) : [];
        if (!flags.length && !t.pendingClose) return <Typography.Text type="secondary">—</Typography.Text>;
        return (
          <ul className="tl-flags" style={{ '--flag': t.flagColor || 'var(--kr-red-600)' }}>
            {flags.map((f, i) => (
              <li key={i} className="tl-flag">
                <Flag size={12} fill="currentColor" className="tl-flag-icon" />
                <span>{f}</span>
              </li>
            ))}
            {t.pendingClose && (
              <li className="tl-flag tl-flag--pending">
                <ClockAlert size={13} className="tl-flag-icon" />
                <span>{t.pendingCloseDetail}</span>
              </li>
            )}
          </ul>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, t) => (
        <Tooltip title={`View trip ${t.number}`}>
          <Button type="text" size="small" className="tms-row-action tms-row-action--view" icon={<Eye size={16} strokeWidth={2} />} aria-label={`View trip ${t.number}`} onClick={() => openTrip(t.id)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <Flex vertical gap={20}>
      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        {kpis.map(k => {
          const Icon = k.icon;
          const apply = () => setTf({ ...tf, ...k.apply });
          return (
            <Col key={k.label} flex="1 1 230px">
              <Card
                hoverable
                role="button"
                tabIndex={0}
                aria-pressed={k.on}
                onClick={apply}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apply(); } }}
                className={`tms-kpi tms-kpi--link tl-kpi${k.on ? ' tms-kpi--on' : ''}`}
                style={{ '--kpi': k.fg, '--tl-kpi-fg': k.fg, height: '100%' }}
                styles={{ body: { padding: '16px 18px' } }}
              >
                <Flex vertical gap={10}>
                  <Flex align="center" justify="space-between" gap={8}>
                    <Typography.Text ellipsis className="tl-kpi-label">{k.label}</Typography.Text>
                    <Avatar size={32} icon={<Icon size={18} strokeWidth={2.2} />} style={{ background: k.bg, color: k.fg, flex: 'none' }} />
                  </Flex>
                  <Statistic value={k.value} className="tl-kpi-value" />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>{k.note}</Typography.Text>
                </Flex>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Filters Bar */}
      <Card className="tl-filters" styles={{ body: { padding: '18px 20px' } }}>
        <Form layout="vertical" onFinish={runSearch}>
          <Flex gap={14} wrap align="flex-end">
            <Form.Item label="Branch" className="tl-filter" style={{ width: 190 }}>
              <Select
                prefix={<Building2 size={17} />}
                value={tf.branch || ''}
                options={[{ value: '', label: 'All branches' }, ...branchOptions]}
                popupMatchSelectWidth={false}
                // Switching branch drops any ticked vehicle or client that branch does not
                // own, otherwise the table would silently come back empty.
                onChange={(v) => setTf({
                  ...tf,
                  branch: v,
                  client: tf.client && clientsOfBranch(v).some(c => c.id === tf.client) ? tf.client : '',
                  vehicles: pickedVehicles.filter(id => !v || (tms.V[id] || {}).branch === v),
                })}
              />
            </Form.Item>
            <Form.Item label="Client" className="tl-filter" style={{ width: 200 }}>
              <Select
                prefix={<Users size={17} />}
                value={tf.client || ''}
                options={[{ value: '', label: 'All clients' }, ...clientOptions]}
                popupMatchSelectWidth={false}
                showSearch={{ filterOption: (input, o) => matchesSearch(input, o.label) }}
                onChange={(v) => setTf({ ...tf, client: v })}
              />
            </Form.Item>
            <Form.Item label="Vehicle" className="tl-filter" style={{ width: 210 }}>
              <Select
                mode="multiple"
                prefix={<Truck size={17} />}
                placeholder="All vehicles"
                value={pickedVehicles}
                options={vehicleOptions}
                onChange={setVehicles}
                maxTagCount={0}
                maxTagPlaceholder={() => vehicleTriggerText}
                popupMatchSelectWidth={280}
                showSearch={{
                  searchValue: vehQ,
                  onSearch: setVehQ,
                  autoClearSearchValue: false,
                  filterOption: (input, o) => matchesSearch(input, o.label, o.sub),
                }}
                onOpenChange={open => { if (!open) setVehQ(''); }}
                notFoundContent={`No vehicle matches “${vehQ}”.`}
                optionRender={o => (
                  <Flex align="center" gap={10}>
                    <Flex vertical flex={1} style={{ minWidth: 0 }}>
                      <Typography.Text ellipsis>{o.data.label}</Typography.Text>
                      {o.data.sub && <Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>{o.data.sub}</Typography.Text>}
                    </Flex>
                    {o.data.count != null && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{o.data.count}</Typography.Text>}
                  </Flex>
                )}
                popupRender={menu => (
                  <>
                    <Flex justify="space-between" align="center" gap={8} className="tl-veh-head">
                      <Button type="link" size="small" onClick={toggleAllShown} disabled={shownVehicles.length === 0}>
                        {allShownOn ? 'Clear these' : vehQ ? `Select these ${shownVehicles.length}` : 'Select all'}
                      </Button>
                      <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>{pickedVehicles.length} selected</Typography.Text>
                    </Flex>
                    {menu}
                  </>
                )}
              />
            </Form.Item>
            <Form.Item label="Type" className="tl-filter" style={{ width: 160 }}>
              <Select
                prefix={<TagIcon size={17} />}
                value={tf.type || ''}
                options={[{ value: '', label: 'All types' }, ...typeOptions]}
                popupMatchSelectWidth={false}
                onChange={(v) => setTf({ ...tf, type: v })}
              />
            </Form.Item>
            <Form.Item label="Flags" className="tl-filter" style={{ width: 160 }}>
              <Select
                prefix={<Flag size={17} />}
                value={tf.flag || ''}
                options={[{ value: '', label: 'All flags' }, ...flagOptions]}
                popupMatchSelectWidth={false}
                onChange={(v) => setTf({ ...tf, flag: v })}
              />
            </Form.Item>
            {/* Matches on the trip's opened date; either end may be left open.
                Each end has its own calendar, and can't be set past the other end. */}
            <Form.Item label="From date" className="tl-filter" style={{ width: 170 }}>
              <DatePicker
                value={fromDay}
                format="DD MMM YYYY"
                placeholder="From date"
                allowClear
                disabledDate={d => !!toDay && d.isAfter(toDay, 'day')}
                onChange={d => setTf({ ...tf, from: d ? d.format(DATE_FMT) : '' })}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="To date" className="tl-filter" style={{ width: 170 }}>
              <DatePicker
                value={toDay}
                format="DD MMM YYYY"
                placeholder="To date"
                allowClear
                disabledDate={d => !!fromDay && d.isBefore(fromDay, 'day')}
                onChange={d => setTf({ ...tf, to: d ? d.format(DATE_FMT) : '' })}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Flex gap={10} align="center" className="tl-search">
              <Input
                prefix={<Search size={17} />}
                placeholder="Trip no., vehicle, driver, client..."
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
              />
              <Button type="primary" htmlType="submit">Search</Button>
              <Button onClick={clearTf}>Clear</Button>
            </Flex>
          </Flex>
        </Form>

        {/* Ticked vehicles stay visible, so a narrow result is never a mystery.
            Everything ticked is the same as nothing ticked, so that case just says so. */}
        {pickedVehicles.length > 0 && (() => {
          const everyOne = pickedVehicles.length === vehicleOptions.length;
          const chips = everyOne ? [] : allChips ? pickedVehicles : pickedVehicles.slice(0, CHIP_CAP);
          const hidden = pickedVehicles.length - chips.length;
          return (
            <Flex align="center" gap={6} wrap className="tl-chips">
              <Typography.Text type="secondary" strong style={{ fontSize: 12.5 }}>
                {everyOne
                  ? `All ${vehicleOptions.length} vehicles`
                  : `${pickedVehicles.length} of ${vehicleOptions.length} vehicles`}
              </Typography.Text>
              {chips.map(id => (
                <Tag
                  key={id}
                  color="success"
                  bordered={false}
                  className="tl-chip"
                  closable={{
                    closeIcon: <X size={12} strokeWidth={2.5} />,
                    'aria-label': `Remove ${(tms.V[id] || {}).number || id} from the filter`,
                  }}
                  onClose={(e) => { e.preventDefault(); setVehicles(pickedVehicles.filter(x => x !== id)); }}
                >
                  {(tms.V[id] || {}).number || id}
                </Tag>
              ))}
              {hidden > 0 && !everyOne && (
                <Button type="dashed" size="small" shape="round" onClick={() => setAllChips(true)}>
                  +{hidden} more
                </Button>
              )}
              {allChips && !everyOne && pickedVehicles.length > CHIP_CAP && (
                <Button type="text" size="small" onClick={() => setAllChips(false)}>
                  Show less
                </Button>
              )}
              <Button type="link" size="small" onClick={() => { setVehicles([]); setAllChips(false); }}>
                Clear
              </Button>
            </Flex>
          );
        })()}
      </Card>

      {/* Table Container */}
      <Card styles={{ body: { padding: 0 } }}>
        <Flex justify="space-between" align="center" gap={12} wrap className="tl-table-head">
          {/* Status filters — press one to narrow the list, press it again to go back to All. */}
          <Flex gap={8} wrap align="center" className="tl-status-tabs">
            {statusTabs.map(tab => {
              const on = (tf.status || '') === tab.id;
              const TabIcon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  shape="round"
                  color={on ? (tab.color || 'primary') : 'default'}
                  variant={on ? 'filled' : 'outlined'}
                  aria-pressed={on}
                  title={on ? `Clear the ${tab.label} filter` : `Show only ${tab.label}`}
                  icon={TabIcon && <TabIcon size={15} className="tl-tab-icon" />}
                  onClick={() => setTf({ ...tf, status: on ? '' : tab.id })}
                >
                  {tab.label}
                  <Typography.Text type={on ? undefined : 'secondary'} className="tl-tab-count">{tab.count}</Typography.Text>
                </Button>
              );
            })}
          </Flex>

          <Flex align="center" gap={16} wrap className="tl-table-extra">
            <Typography.Text className="tl-summary">
              <Typography.Text strong>{tripRows.length}</Typography.Text> trips · <Typography.Text strong style={{ color: 'var(--kr-green-700)' }}>{tripEnrouteCount}</Typography.Text> {ENROUTE_LABEL_LOWER}
              {pendingCloseCount > 0 && (
                <> · <Typography.Text strong style={{ color: 'var(--st-pending-fg)' }}>{pendingCloseCount}</Typography.Text> pending closure</>
              )}
            </Typography.Text>
            {can('trips', 'export') && (
              // Exports the trips matching the current filters and search.
              <Button
                color="primary"
                variant="outlined"
                icon={<Download size={17} />}
                onClick={FILE_TRANSFER_ENABLED ? exportTrips : undefined}
              >
                Export Excel
              </Button>
            )}
          </Flex>
        </Flex>

        <Table
          columns={tripColumns}
          dataSource={tripRows}
          rowKey="id"
          tableLayout="auto"
          scroll={{ x: 1080 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Flex vertical gap={6} align="center">
                    <Typography.Text strong style={{ fontSize: 18 }}>No trips match these filters</Typography.Text>
                    <Typography.Text type="secondary">
                      Every recorded movement is kept. Try widening the branch, status or type filter.
                    </Typography.Text>
                  </Flex>
                }
              >
                <Button color="primary" variant="filled" onClick={clearTf}>Clear filters</Button>
              </Empty>
            ),
          }}
          pagination={{
            current: tripPage,
            pageSize: tripPageSize,
            onChange: (p, size) => {
              if (size !== tripPageSize) { setTripPageSize(size); setTripPage(1); } else setTripPage(p);
            },
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (total, [from, to]) => `Showing ${from} to ${to} of ${total} trips`,
          }}
        />
      </Card>
    </Flex>
  );
};

export default TripList;
