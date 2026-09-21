import React, { useEffect, useState } from 'react';
import {
  Activity, ArrowDown, Building2, ChevronDown, ChevronLeft, ChevronRight, CircleCheck, Download, Ellipsis,
  Eye, Flag, Play, Search, Tag, TriangleAlert, Truck,
} from 'lucide-react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';

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

const pageBtn = (active, disabled) => ({
  all: 'unset',
  cursor: disabled ? 'default' : 'pointer',
  boxSizing: 'border-box',
  minWidth: '36px',
  height: '36px',
  padding: '0 8px',
  display: 'grid',
  placeItems: 'center',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 700,
  border: `1px solid ${active ? 'var(--kr-green-700)' : '#d5dfda'}`,
  background: active ? 'var(--kr-green-700)' : '#fff',
  color: active ? '#fff' : disabled ? 'var(--kr-grey-300)' : 'var(--text-heading)',
});

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

  const tms = T();
  const trips = (tms.trips || []).filter(t => !deleted.includes(t.id)).map(t => {
    const v = tms.V[t.vehicle], d = tms.D[t.driver], c = tms.C[t.client], b = tms.B[t.branch], s = tms.S[t.supervisor];
    const long = t.status === 'Enroute' && t.hoursOpen > 24;
    const gpsBad = (t.flags || []).some(f => /GPS/.test(f));
    const badge = t.status === 'Closed' ? ((t.flags || []).length ? 'Closed · flagged' : 'Closed') : long ? 'Long open' : gpsBad ? 'GPS issue' : t.stage || 'Enroute';
    const badgeColors = {
      'Enroute': ['var(--st-enroute-bg)', 'var(--st-enroute-fg)'],
      'Closed': ['var(--st-closed-bg)', 'var(--st-closed-fg)'],
      'Closed · flagged': ['var(--st-flagged-bg)', 'var(--st-flagged-fg)'],
      'Long open': ['var(--st-long-bg)', 'var(--st-long-fg)'],
      'GPS issue': ['var(--st-gps-bg)', 'var(--st-gps-fg)'],
      'Loading': ['var(--st-loading-bg)', 'var(--st-loading-fg)'],
      'Unloading': ['var(--st-unloading-bg)', 'var(--st-unloading-fg)'],
      'Delayed': ['var(--st-delayed-bg)', 'var(--st-delayed-fg)'],
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
    };
  });

  const q = (tf.q || '').toLowerCase();
  const tripMatch = (t, ignoreStatus) =>
    (!tf.branch || t.branch === tf.branch) &&
    (ignoreStatus || !tf.status || t.status === tf.status) &&
    (!tf.type || t.type === tf.type) &&
    (!tf.flag || (tf.flag === 'flagged' ? t.hasFlags : !t.hasFlags)) &&
    (!q || [t.number, t.vehicleNumber, t.driverName, t.clientName, t.unloading].join(' ').toLowerCase().includes(q));

  const tripRows = trips.filter(t => tripMatch(t, false));
  const statusPool = trips.filter(t => tripMatch(t, true));

  const branchOptions = (tms.branches || []).map(b => ({ value: b.id, label: b.name }));
  const statusOptions = [{ value: 'Enroute', label: 'Enroute' }, { value: 'Closed', label: 'Closed' }];
  const typeOptions = [{ value: 'Business', label: 'Business' }, { value: 'Non-Business', label: 'Non-Business' }];
  const flagOptions = [{ value: 'flagged', label: 'Flagged only' }, { value: 'clean', label: 'No flags' }];

  const tripCols = ['Trip number', 'Branch', 'Vehicle', 'Driver', 'Client · unloading', 'Type', 'Opened', 'Status', 'Flags', 'Actions'];
  const tripEnrouteCount = tripRows.filter(t => t.status === 'Enroute').length;

  const [draftQ, setDraftQ] = useState(tf.q || '');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeActionId, setActiveActionId] = useState(null);

  useEffect(() => {
    const handleDocClick = () => setActiveActionId(null);
    window.addEventListener('click', handleDocClick);
    return () => window.removeEventListener('click', handleDocClick);
  }, []);

  useEffect(() => { setDraftQ(tf.q || ''); }, [tf.q]);
  useEffect(() => { setPage(1); setActiveActionId(null); }, [tf.branch, tf.status, tf.type, tf.flag, tf.q, pageSize]);

  const pageCount = Math.max(1, Math.ceil(tripRows.length / pageSize));
  const curPage = Math.min(page, pageCount);
  const pageRows = tripRows.slice((curPage - 1) * pageSize, curPage * pageSize);
  const firstShown = tripRows.length ? (curPage - 1) * pageSize + 1 : 0;
  const lastShown = Math.min(curPage * pageSize, tripRows.length);

  const clearTf = () => {
    setDraftQ('');
    setTf({ branch: '', status: '', type: '', flag: '', q: '' });
  };
  const runSearch = () => setTf({ ...tf, q: draftQ.trim() });

  const exportTrips = () => {
    showToast('success', 'Export started', `${tripRows.length} trips · Excel will download shortly.`);
  };

  const openTrip = (id) => {
    setSelectedTrip(id);
    navTo('trip', { selectedTrip: id });
  };

  const kpis = [
    { label: 'Total Trips', value: trips.length, note: 'All recorded trips', icon: Truck, bg: 'var(--st-enroute-bg)', fg: 'var(--st-enroute-edge)' },
    { label: 'Enroute', value: trips.filter(t => t.status === 'Enroute').length, note: 'Active trips on road', icon: Play, bg: 'var(--kr-green-100)', fg: 'var(--kr-green-700)' },
    { label: 'Closed', value: trips.filter(t => t.status === 'Closed').length, note: 'Completed trips', icon: CircleCheck, bg: 'var(--kr-green-100)', fg: 'var(--kr-green-600)' },
    { label: 'Exceptions', value: trips.filter(t => t.hasFlags).length, note: 'Needs attention', icon: TriangleAlert, bg: 'var(--kr-red-100)', fg: 'var(--kr-red-600)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="tms-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
              <span style={{ flex: 'none', width: '54px', height: '54px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: k.bg, color: k.fg }}>
                <Icon size={26} strokeWidth={2.2} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)' }}>{k.label}</div>
                <div style={{ marginTop: '2px', fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: 'var(--kr-grey-900)' }}>{k.value}</div>
              </div>
              <div style={{ alignSelf: 'flex-end', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>{k.note}</div>
            </div>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="tms-card" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end', padding: '18px 20px' }}>
        <FilterSelect label="Branch" icon={Building2} width="190px" value={tf.branch} allLabel="All branches" options={branchOptions} onChange={(v) => setTf({ ...tf, branch: v })} />
        <FilterSelect label="Status" icon={Activity} width="170px" value={tf.status} allLabel="All statuses" options={statusOptions} onChange={(v) => setTf({ ...tf, status: v })} />
        <FilterSelect label="Type" icon={Tag} width="160px" value={tf.type} allLabel="All types" options={typeOptions} onChange={(v) => setTf({ ...tf, type: v })} />
        <FilterSelect label="Flags" icon={Flag} width="160px" value={tf.flag} allLabel="Any" options={flagOptions} onChange={(v) => setTf({ ...tf, flag: v })} />

        <form
          onSubmit={(e) => { e.preventDefault(); runSearch(); }}
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
      </div>

      {/* Table Container */}
      <div className="tms-card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 20px', borderBottom: '1px solid #e3e9e6', gap: '12px', flexWrap: 'wrap' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: '', label: 'All', count: statusPool.length },
              { id: 'Enroute', label: 'Enroute', count: statusPool.filter(t => t.status === 'Enroute').length },
              { id: 'Closed', label: 'Closed', count: statusPool.filter(t => t.status === 'Closed').length },
            ].map(tab => {
              const on = (tf.status || '') === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTf({ ...tf, status: tab.id })}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    padding: '16px 22px 13px',
                    fontSize: '15px',
                    fontWeight: 700,
                    borderBottom: `3px solid ${on ? 'var(--kr-green-700)' : 'transparent'}`,
                    color: on ? 'var(--kr-green-700)' : 'var(--text-heading)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {tab.label}
                  <span style={{ fontSize: '13px', fontWeight: on ? 700 : 500, color: on ? 'var(--kr-green-700)' : 'var(--text-muted)' }}>({tab.count})</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 0', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-heading)' }}>{tripRows.length}</strong> trips · {tripEnrouteCount} enroute
            </span>
            <button
              onClick={exportTrips}
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
              {pageRows.map((t) => (
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
                    ) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', position: 'relative' }}>
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {activeActionId === t.id && (
                        <div
                          style={{
                            position: 'absolute',
                            right: '100%',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            marginRight: '8px',
                            zIndex: 50,
                            background: '#fff',
                            border: '1px solid #d5dfda',
                            borderRadius: '8px',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
                            padding: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            whiteSpace: 'nowrap',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActionId(null);
                              openTrip(t.id);
                            }}
                            title={`View details for ${t.number}`}
                            aria-label={`View details for ${t.number}`}
                            style={{
                              all: 'unset',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: 'var(--kr-green-800)',
                              background: 'var(--kr-green-100)',
                              transition: 'background var(--dur-fast)',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#d2ebd9'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--kr-green-100)'}
                          >
                            <Eye size={15} />
                            <span>View</span>
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveActionId(prev => prev === t.id ? null : t.id);
                        }}
                        aria-label={`Actions for ${t.number}`}
                        title="Actions"
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          width: '32px',
                          height: '32px',
                          display: 'inline-grid',
                          placeItems: 'center',
                          borderRadius: '8px',
                          color: activeActionId === t.id ? 'var(--kr-green-700)' : 'var(--kr-grey-700)',
                          background: activeActionId === t.id ? 'var(--kr-green-100)' : 'transparent',
                          transition: 'background var(--dur-fast), color var(--dur-fast)',
                        }}
                        onMouseEnter={e => {
                          if (activeActionId !== t.id) e.currentTarget.style.background = 'var(--kr-green-100)';
                        }}
                        onMouseLeave={e => {
                          if (activeActionId !== t.id) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Ellipsis size={20} />
                      </button>
                    </div>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '14px 20px', borderTop: '1px solid #e3e9e6', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span>Showing {firstShown} to {lastShown} of {tripRows.length} trips</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button disabled={curPage === 1} onClick={() => setPage(curPage - 1)} aria-label="Previous page" style={pageBtn(false, curPage === 1)}>
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)} aria-current={n === curPage ? 'page' : undefined} style={pageBtn(n === curPage, false)}>
                {n}
              </button>
            ))}
            <button disabled={curPage === pageCount} onClick={() => setPage(curPage + 1)} aria-label="Next page" style={pageBtn(false, curPage === pageCount)}>
              <ChevronRight size={18} />
            </button>
            <div style={{ ...fieldWrap, marginLeft: '12px' }}>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                aria-label="Rows per page"
                style={{ ...fieldStyle, width: '110px', height: '36px', padding: '0 30px 0 12px', fontWeight: 600 }}
              >
                {[10, 25, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
              </select>
              <ChevronDown size={16} style={iconRight} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripList;
