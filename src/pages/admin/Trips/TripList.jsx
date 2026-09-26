import React, { useEffect, useState } from 'react';
import {
  ArrowDown, Building2, ChevronDown, CircleCheck, Download,
  Flag, ClockAlert, Play, Search, Tag, TriangleAlert, Truck, X,
} from 'lucide-react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { RowActions } from '../../../components/common/RowActions';
import { MultiSelect } from '../../../components/common/MultiSelect';
import { Pagination, usePagination } from '../../../components/common/Pagination';
import { downloadXlsx, fileDate } from '../../../utils/spreadsheet';
import { matchesSearch } from '../../../utils/search';
import { isPendingClose, pendingCloseDetail, PENDING_CLOSE_LABEL, ENROUTE_LABEL, ENROUTE_LABEL_LOWER } from '../../../utils/tripStatus';

// Tab id for the exception filter — not a trip status, so it is matched separately.
const PENDING_TAB = 'pending';

const filterLabel = { display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' };
const fieldWrap = { position: 'relative', display: 'flex', alignItems: 'center' };
const fieldStyle = {
  width: '100%',
  height: '44px',
  boxSizing: 'border-box',
  padding: '0 34px 0 38px',
  appearance: 'none',
  WebkitAppearance: 'none',
  borderRadius: '10px',
  border: '1px solid #d5dfda',
  background: '#fff',
  fontSize: '14px',
  color: 'var(--text-heading)',
  cursor: 'pointer',
};
const iconLeft = { position: 'absolute', left: '12px', pointerEvents: 'none', color: 'var(--kr-grey-700)' };
const iconRight = { position: 'absolute', right: '12px', pointerEvents: 'none', color: 'var(--kr-grey-700)' };

const FilterSelect = ({ label, icon: Icon, value, onChange, allLabel, options, width }) => (
  <div style={{ width, flex: 'none' }}>
    <label style={filterLabel}>{label}</label>
    <div style={fieldWrap}>
      <Icon size={17} style={iconLeft} />
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} style={fieldStyle}>
        <option value="">{allLabel}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={17} style={iconRight} />
    </div>
  </div>
);

const FilterMultiSelect = ({ label, noun, width, ...rest }) => (
  <div style={{ width, flex: 'none' }}>
    <label style={filterLabel} id={`${noun}-filter-label`}>{label}</label>
    <MultiSelect noun={noun} labelledBy={`${noun}-filter-label`} {...rest} />
  </div>
);

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
    (ignoreStatus || statusMatch(t)) &&
    (!tf.type || t.type === tf.type) &&
    (!pickedVehicles.length || pickedVehicles.includes(t.vehicle)) &&
    (!tf.flag || (tf.flag === 'flagged' ? t.hasFlags : !t.hasFlags)) &&
    matchesSearch(tf.q, t.number, t.vehicleNumber, t.driverName, t.clientName, t.unloading);

  const tripRows = trips.filter(t => tripMatch(t, false));
  const statusPool = trips.filter(t => tripMatch(t, true));

  const branchOptions = (tms.branches || []).map(b => ({ value: b.id, label: b.name }));
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

  const tripCols = ['Trip number', 'Branch', 'Vehicle', 'Driver', 'Client · unloading', 'Type', 'Opened', 'Status', 'Flags', 'Actions'];
  const tripEnrouteCount = tripRows.filter(t => t.status === 'Enroute').length;

  const [draftQ, setDraftQ] = useState(tf.q || '');
  // Only the first few ticked vehicles get a chip; the rest stay behind a "+n more".
  const [allChips, setAllChips] = useState(false);
  const CHIP_CAP = 5;

  useEffect(() => { setDraftQ(tf.q || ''); }, [tf.q]);
  const tripPg = usePagination(tripRows, [tf.branch, tf.status, tf.type, tf.flag, tf.q, pickedVehicles.join(',')]);


  const clearTf = () => {
    setDraftQ('');
    setTf({ branch: '', status: '', type: '', flag: '', q: '', vehicles: [] });
  };
  const runSearch = () => setTf({ ...tf, q: draftQ.trim() });

  const exportTrips = () => {
    if (!tripRows.length) { showToast('warning', 'Nothing to export', 'No trips match the current filters.'); return; }
    const cols = [
      ['Trip number', t => t.number], ['Branch', t => t.branchName], ['Vehicle', t => t.vehicleNumber], ['Driver', t => t.driverName],
      ['Client', t => t.clientName], ['Unloading', t => t.unloading], ['Type', t => t.typeLabel], ['Opened', t => t.opened],
      ['Closed', t => t.closed], ['Start KM', t => t.startKm], ['Closing KM', t => t.closeKm], ['Invoice', t => t.invoice],
      ['LR', t => t.lr], ['Status', t => t.badge], ['Flags', t => (t.flags || []).join(', ')],
      ['Pending closure', t => (t.pendingClose ? t.pendingCloseDetail : '')],
    ];
    const name = `Trips_${fileDate()}.xlsx`;
    downloadXlsx(name, [{ name: 'Trips', columns: cols.map(c => c[0]), rows: tripRows.map(t => cols.map(c => { const v = c[1](t); return v == null ? '' : v; })) }]);
    showToast('success', 'Excel downloaded', `${name} · ${tripRows.length} trips`);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <button
              key={k.label}
              type="button"
              onClick={() => setTf({ ...tf, ...k.apply })}
              aria-pressed={k.on}
              className="tms-card"
              style={{
                font: 'inherit', textAlign: 'left', cursor: 'pointer', width: '100%', boxSizing: 'border-box',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px', padding: '16px 18px',
                // The whole card carries its own colour, not just the top bar.
                border: `1px solid ${k.fg}`,
                borderTop: `4px solid ${k.fg}`,
                boxShadow: k.on ? `inset 0 0 0 1px ${k.fg}, 0 2px 10px rgba(0, 48, 33, 0.10)` : '0 1px 3px rgba(0, 48, 33, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '12.5px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: k.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {k.label}
                </span>
                <span style={{ flex: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: k.bg, color: k.fg }}>
                  <Icon size={18} strokeWidth={2.2} />
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: 'var(--kr-grey-900)', lineHeight: 1.1 }}>
                {k.value}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {k.note}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="tms-card" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end', padding: '18px 20px' }}>
        <FilterSelect
          label="Branch"
          icon={Building2}
          width="190px"
          value={tf.branch}
          allLabel="All branches"
          options={branchOptions}
          // Switching branch drops any ticked vehicle that branch does not own,
          // otherwise the table would silently come back empty.
          onChange={(v) => setTf({
            ...tf,
            branch: v,
            vehicles: pickedVehicles.filter(id => !v || (tms.V[id] || {}).branch === v),
          })}
        />
        <FilterMultiSelect
          label="Vehicle"
          icon={Truck}
          noun="vehicle"
          width="210px"
          allLabel="All vehicles"
          options={vehicleOptions}
          value={pickedVehicles}
          onChange={setVehicles}
        />
        <FilterSelect label="Type" icon={Tag} width="160px" value={tf.type} allLabel="All types" options={typeOptions} onChange={(v) => setTf({ ...tf, type: v })} />
        <FilterSelect label="Flags" icon={Flag} width="160px" value={tf.flag} allLabel="All" options={flagOptions} onChange={(v) => setTf({ ...tf, flag: v })} />

        <form
          onSubmit={(e) => { e.preventDefault(); runSearch(); }}
          className="tms-trip-search"
          style={{ flex: 1, minWidth: '260px', display: 'flex', gap: '10px', alignItems: 'center' }}
        >
          <div style={{ ...fieldWrap, flex: 1 }}>
            <Search size={17} style={iconLeft} />
            <input
              type="text"
              placeholder="Trip no., vehicle, driver, client..."
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              style={{ ...fieldStyle, cursor: 'text', padding: '0 12px 0 38px' }}
            />
          </div>
          <button
            type="submit"
            style={{ all: 'unset', cursor: 'pointer', height: '44px', padding: '0 24px', borderRadius: '10px', background: 'var(--kr-green-700)', color: '#fff', fontSize: '14px', fontWeight: 700 }}
          >
            Search
          </button>
          <button
            type="button"
            onClick={clearTf}
            style={{ all: 'unset', cursor: 'pointer', height: '44px', boxSizing: 'border-box', padding: '0 20px', borderRadius: '10px', border: '1px solid #d5dfda', background: '#fff', fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}
          >
            Clear
          </button>
        </form>

        {/* Ticked vehicles stay visible, so a narrow result is never a mystery.
            Everything ticked is the same as nothing ticked, so that case just says so. */}
        {pickedVehicles.length > 0 && (() => {
          const everyOne = pickedVehicles.length === vehicleOptions.length;
          const chips = everyOne ? [] : allChips ? pickedVehicles : pickedVehicles.slice(0, CHIP_CAP);
          const hidden = pickedVehicles.length - chips.length;
          return (
            <div
              style={{
                flexBasis: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexWrap: 'wrap',
                marginTop: '2px',
                paddingTop: '14px',
                borderTop: '1px solid #edf1ef',
              }}
            >
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--kr-grey-700)', marginRight: '2px' }}>
                {everyOne
                  ? `All ${vehicleOptions.length} vehicles`
                  : `${pickedVehicles.length} of ${vehicleOptions.length} vehicles`}
              </span>
              {chips.map(id => (
                <span
                  key={id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '26px',
                    padding: '0 4px 0 9px',
                    borderRadius: '999px',
                    background: 'var(--kr-green-100)',
                    color: 'var(--kr-green-800)',
                    fontSize: '12px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {(tms.V[id] || {}).number || id}
                  <button
                    type="button"
                    onClick={() => setVehicles(pickedVehicles.filter(x => x !== id))}
                    aria-label={`Remove ${(tms.V[id] || {}).number || id} from the filter`}
                    style={{ all: 'unset', cursor: 'pointer', display: 'grid', placeItems: 'center', width: '18px', height: '18px', borderRadius: '50%' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,74,49,.15)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
              {hidden > 0 && !everyOne && (
                <button
                  type="button"
                  onClick={() => setAllChips(true)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    height: '26px',
                    boxSizing: 'border-box',
                    padding: '0 10px',
                    borderRadius: '999px',
                    border: '1px dashed #c3d5cc',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--kr-grey-700)',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  +{hidden} more
                </button>
              )}
              {allChips && !everyOne && pickedVehicles.length > CHIP_CAP && (
                <button
                  type="button"
                  onClick={() => setAllChips(false)}
                  style={{ all: 'unset', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'var(--kr-grey-700)' }}
                >
                  Show less
                </button>
              )}
              <button
                type="button"
                onClick={() => { setVehicles([]); setAllChips(false); }}
                style={{ all: 'unset', cursor: 'pointer', marginLeft: '2px', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-brand)' }}
              >
                Clear
              </button>
            </div>
          );
        })()}
      </div>

      {/* Table Container */}
      <div className="tms-card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #e3e9e6', gap: '12px', flexWrap: 'wrap' }}>
          {/* Status Tabs */}
          {/* Status filters — press one to narrow the list, press it again to go back to All. */}
          <div className="tms-tabrow" style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 0' }}>
            {[
              { id: '', label: 'All', count: statusPool.length },
              { id: 'Enroute', label: ENROUTE_LABEL, count: statusPool.filter(t => t.status === 'Enroute').length },
              { id: 'Closed', label: 'Closed', count: statusPool.filter(t => t.status === 'Closed').length },
              { id: PENDING_TAB, label: PENDING_CLOSE_LABEL, count: statusPool.filter(t => t.pendingClose).length, accent: 'var(--st-pending-fg)', edge: 'var(--st-pending-edge)', soft: 'var(--st-pending-bg)', icon: ClockAlert },
            ].map(tab => {
              const on = (tf.status || '') === tab.id;
              const accent = tab.accent || 'var(--kr-green-700)';
              const edge = tab.edge || 'var(--kr-green-700)';
              const soft = tab.soft || 'var(--kr-green-100)';
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={on}
                  title={on ? `Clear the ${tab.label} filter` : `Show only ${tab.label}`}
                  onClick={() => setTf({ ...tf, status: on ? '' : tab.id })}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    height: '38px',
                    padding: '0 16px',
                    borderRadius: 'var(--radius-pill, 999px)',
                    border: `1.5px solid ${on ? edge : 'var(--border-strong, #cbd5e1)'}`,
                    background: on ? soft : '#fff',
                    color: on ? accent : 'var(--text-heading)',
                    fontSize: '14px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    transition: 'background var(--dur-fast, 0.15s), border-color var(--dur-fast, 0.15s)',
                  }}
                >
                  {TabIcon && <TabIcon size={15} style={{ color: on ? accent : 'var(--st-pending-edge)' }} />}
                  {tab.label}
                  <span style={{ fontSize: '13px', fontWeight: 600, color: on ? accent : 'var(--text-muted)' }}>{tab.count}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 0', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-heading)' }}>{tripRows.length}</strong> trips · {tripEnrouteCount} {ENROUTE_LABEL_LOWER}
              {pendingCloseCount > 0 && (
                <> · <strong style={{ color: 'var(--st-pending-fg)' }}>{pendingCloseCount}</strong> pending closure</>
              )}
            </span>
            {can('trips', 'export') && (
              // Shown for now without the export; wire onClick={exportTrips} back to enable it.
              <button
                type="button"
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '38px',
                  padding: '0 16px',
                  boxSizing: 'border-box',
                  borderRadius: '10px',
                  color: 'var(--kr-green-800)',
                  border: '1px solid var(--kr-green-700)',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                <Download size={17} />
                Export Excel
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '1080px' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f7faf9' }}>
                {tripCols.map((c) => (
                  <th
                    key={c}
                    style={{
                      padding: '12px 16px',
                      fontFamily: 'var(--font-display)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--kr-grey-700)',
                      whiteSpace: 'nowrap',
                      textAlign: c === 'Actions' ? 'center' : 'left',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {c}
                      {c === 'Opened' && <ArrowDown size={13} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tripPg.rows.map((t) => (
                <tr
                  key={t.id}
                  style={{ borderTop: '1px solid #edf1ef' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5faf7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                    {t.number}
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{t.branchName}</td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: 'var(--text-heading)', fontWeight: 700 }}>{t.vehicleNumber}</td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{t.driverName}</td>
                  <td style={{ padding: '12px 16px', maxWidth: '260px' }}>
                    <span style={{ display: 'block', color: 'var(--text-heading)', fontWeight: 600 }}>{t.clientName}</span>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.unloading}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', maxWidth: '150px' }}>{t.typeLabel}</td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: 'var(--text-body)' }}>{t.opened}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: 'var(--font-display)',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: t.badgeBg,
                        color: t.badgeFg,
                      }}
                    >
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'currentColor' }} />
                      {t.badge}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: t.flagColor, minWidth: '160px', maxWidth: '220px' }}>
                    {t.hasFlags ? (
                      <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.4 }}>
                        <Flag size={13} fill="currentColor" style={{ flex: 'none', marginTop: '2px' }} />
                        {t.flagText}
                      </span>
                    ) : t.pendingClose ? null : '—'}
                    {t.pendingClose && (
                      <span style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: t.hasFlags ? '4px' : 0, lineHeight: 1.4, color: 'var(--st-pending-fg)' }}>
                        <ClockAlert size={13} style={{ flex: 'none', marginTop: '2px' }} />
                        {t.pendingCloseDetail}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <RowActions
                      onView={() => openTrip(t.id)}
                      viewLabel={`View trip ${t.number}`}
                      buttonAriaLabel={`Actions for ${t.number}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tripRows.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--text-heading)' }}>
              No trips match these filters
            </div>
            <p style={{ margin: '6px 0 16px', color: 'var(--text-muted)', fontSize: '14px' }}>
              Every recorded movement is kept. Try widening the branch, status or type filter.
            </p>
            <button
              onClick={clearTf}
              style={{ all: 'unset', cursor: 'pointer', padding: '0 18px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--color-brand-tint)', color: 'var(--color-brand)', fontWeight: 700, fontSize: '14px' }}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Pagination */}
        <Pagination {...tripPg} noun="trips" />
      </div>
    </div>
  );
};

export default TripList;
