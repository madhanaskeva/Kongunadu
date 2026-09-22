import React, { useState } from 'react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { TMSReports } from '../../../utils';
import { downloadXlsx, fileDate } from '../../../utils/spreadsheet';
import { Pagination, usePagination } from '../../../components/common/Pagination';

export const Reports = () => {
  const { T, rb, setRb, showToast, navTo } = useTMSAdmin();
  const { can } = useModuleAccess();
  const tms = T();
  const R = (typeof window !== 'undefined' && window.TMSReports) || TMSReports;

  const [templatesOpen, setTemplatesOpen] = useState(false);

  // Scopes & prompt examples matching HTML
  const RB_SCOPES = {
    trip: [
      ['open', 'Open trips', 'open trips'],
      ['closed', 'Closed trips', 'closed trips'],
      ['long', 'Long open', 'long open trips'],
      ['nonbiz', 'Non-business', 'non-business trips'],
      ['gps', 'GPS issues', 'trips with GPS failure'],
      ['variance', 'Variance above 5%', 'trips with distance variance above 5%'],
    ],
    vehicle: [
      ['running', 'Running', 'running vehicles'],
      ['idle', 'Idle', 'idle vehicles'],
      ['maint', 'Maintenance', 'maintenance vehicles'],
      ['highkm', 'Above 1.5 lakh km', 'vehicles above 150000 km'],
    ],
    driver: [
      ['active', 'Active', 'active drivers'],
      ['pending', 'Pending approval', 'drivers pending approval'],
      ['inactive', 'Inactive', 'inactive drivers'],
    ],
    attendance: [
      ['absent', 'Absent over 3 days', 'drivers absent for more than 3 days'],
      ['inactive', 'Inactive', 'status inactive'],
    ],
    gps: [
      ['ok', 'Tracking', null, r => r.gps === 'OK', 'GPS is OK'],
      ['weak', 'Weak signal', 'gps weak'],
      ['failed', 'No fix', 'gps failed'],
    ],
    exception: [
      ['open', 'Open', 'open exceptions'],
      ['high', 'High severity', 'high severity exceptions'],
      ['resolved', 'Resolved', 'resolved exceptions'],
    ],
  };

  const RB_ASK = {
    trip: ['Give me the long opened trips', 'Trips handled by Supervisor Senthil', 'Diesel filled above 100 litres', 'Trips from Chennai'],
    vehicle: ['Vehicles above 150000 km', 'Idle vehicles in Chennai'],
    driver: ['Drivers pending approval', 'Drivers from Chennai'],
    attendance: ['Drivers absent for more than 3 days', 'Drivers from Namakkal'],
    gps: ['Vehicles with GPS failed', 'GPS weak'],
    exception: ['High severity exceptions', 'Open exceptions'],
  };

  const curType = rb.type || 'trip';
  const TY = R && R.TYPES && R.TYPES[curType] ? R.TYPES[curType] : { label: 'Trip register', noun: 'trips', fields: [] };
  const allDataset = R ? R.dataset(curType, tms) : [];

  const rbScopeObj = (type, id) => {
    const x = (RB_SCOPES[type] || []).find(s => s[0] === id);
    return x ? { id: x[0], label: x[1], text: x[2], test: x[3], desc: x[4] } : null;
  };

  const rbSpec = () => {
    const sc = rbScopeObj(curType, rb.scope || 'all');
    const conditions = [];
    if (sc && sc.text) conditions.push({ text: sc.text, join: 'and' });
    if ((rb.ask || '').trim()) conditions.push({ text: rb.ask.trim(), join: 'and' });
    return { type: curType, scope: rb.scope || 'all', ask: (rb.ask || '').trim(), quick: {}, conditions };
  };

  const rbRows = (spec) => {
    if (!R) return [];
    const sc = rbScopeObj(spec.type, spec.scope);
    const rows = R.run(spec, tms);
    return sc && sc.test ? rows.filter(sc.test) : rows;
  };

  const colKeys = rb.cols && rb.cols[curType]
    ? rb.cols[curType]
    : TY.fields.filter(f => f.def).map(f => f.key);

  const scopeRows = (id) => {
    const sc = rbScopeObj(curType, id);
    return rbRows({
      type: curType,
      scope: id,
      ask: '',
      conditions: sc && sc.text ? [{ text: sc.text, join: 'and' }] : [],
    });
  };

  const scopes = [
    { id: 'all', label: 'All ' + TY.noun, n: allDataset.length },
    ...(RB_SCOPES[curType] || []).map(x => ({ id: x[0], label: x[1], n: scopeRows(x[0]).length })),
  ];

  const setCols = (keys) => {
    setRb(prev => ({
      ...prev,
      cols: { ...(prev.cols || {}), [curType]: keys },
    }));
  };

  const toggleCol = (k) => {
    const order = TY.fields.map(f => f.key);
    const next = order.filter(x => x === k ? !colKeys.includes(k) : colKeys.includes(x));
    setCols(next);
  };

  // Plain-text parser info
  const p = (rb.ask || '').trim() && R ? R.parse(rb.ask, curType, tms) : null;
  const inferred = (rb.ask || '').trim() && R ? R.inferType(rb.ask) : '';

  // Live preview rows
  const fmtN = n => Number(n).toLocaleString('en-IN', { maximumFractionDigits: 1 });
  const fmtV = (f, v) => v == null || v === '' ? '—' : f.kind === 'num' ? fmtN(v) + (f.unit ? (f.unit === '%' ? '%' : ' ' + f.unit) : '') : String(v);

  const prevCols = colKeys.map(k => R ? R.field(curType, k) : null).filter(Boolean);
  const prevAll = (rb.scope || 'all') === 'all' ? allDataset : scopeRows(rb.scope);
  const prevRows = prevAll.slice(0, 6);

  // Generate Report
  const handleGenerate = () => {
    if (!colKeys.length) {
      showToast('warning', 'Pick a heading', 'Choose at least one heading to put in the report.');
      return;
    }
    setRb(prev => ({ ...prev, loading: true }));
    setTimeout(() => {
      const spec = rbSpec();
      const rows = rbRows(spec);
      const order = TY.fields.map(f => f.key);
      const used = spec.conditions
        .flatMap(c => R.parse(c.text, spec.type, tms).clauses.map(x => x.field))
        .filter(k => R.field(spec.type, k));
      const nextCols = order.filter(k => colKeys.includes(k) || used.includes(k));

      setRb(prev => ({
        ...prev,
        loading: false,
        tab: 'report',
        cell: null,
        cols: { ...(prev.cols || {}), [spec.type]: nextCols },
        result: { spec, rows, at: new Date() },
      }));
    }, 650);
  };

  const handleReset = () => {
    setRb({
      type: 'trip',
      scope: 'all',
      cols: {},
      ask: '',
      loading: false,
      result: null,
      tab: 'report',
      cell: null,
    });
  };

  // Sheets data for Excel viewer & export
  const getSheets = () => {
    const res = rb.result;
    if (!res || !R) return null;
    const type = res.spec.type;
    const typeObj = R.TYPES[type];
    const curCols = (rb.cols && rb.cols[type] ? rb.cols[type] : typeObj.fields.filter(f => f.def).map(f => f.key))
      .map(k => R.field(type, k))
      .filter(Boolean);
    const sc = rbScopeObj(type, res.spec.scope);
    const parseRes = res.spec.ask ? R.parse(res.spec.ask, type, tms) : null;
    const understood = [
      ...(sc ? [sc.text ? R.parse(sc.text, type, tms).clauses.map(x => x.label).join('; ') : sc.desc] : []),
      ...(parseRes && parseRes.understood ? parseRes.clauses.map(x => x.label) : []),
    ];
    const crit = [
      ['Report type', typeObj.label],
      ['Show', sc ? sc.label : 'All ' + typeObj.noun],
      ['Asked', res.spec.ask || '—'],
      ['Understood as', understood.join('; ') || 'No conditions · every record'],
      ['Generated', res.at.toLocaleString('en-IN')],
      ['Exported by', 'Head Office Admin'],
      ['Records', res.rows.length],
    ];

    return {
      type,
      TY: typeObj,
      cols: curCols,
      crit,
      sc,
      understood,
      askBad: !!(parseRes && !parseRes.understood),
      report: {
        name: typeObj.label,
        columns: curCols.map(f => f.label + (f.unit ? ' (' + f.unit + ')' : '')),
        rows: res.rows.map(r => curCols.map(f => r[f.key] == null ? '' : r[f.key])),
      },
      criteria: {
        name: 'Criteria',
        columns: ['Item', 'Value'],
        rows: crit,
      },
    };
  };

  const getFileName = (sh) => {
    if (!sh || !rb.result) return 'Report.xlsx';
    const d = rb.result.at;
    const dd = n => String(n).padStart(2, '0');
    const part = s => String(s).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return [part(sh.TY.label), sh.sc ? part(sh.sc.label) : 'All', `${dd(d.getDate())}-${dd(d.getMonth() + 1)}-${d.getFullYear()}`].join('_') + '.xlsx';
  };

  const handleExport = () => {
    const sh = getSheets();
    if (!sh || !R) {
      showToast('warning', 'Nothing to download', 'Generate a report first, then download it.');
      return;
    }
    const blob = R.xlsx([sh.report, sh.criteria]);
    const name = getFileName(sh);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    const rc = sh.report.rows.length;
    showToast('success', 'Excel downloaded', `${name} · ${rc} rows · ${sh.cols.length} columns`);
  };

  const letter = (i) => {
    let s = '';
    for (i++; i > 0; i = Math.floor((i - 1) / 26)) {
      s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
    }
    return s;
  };

  const sh = getSheets();
  const onReport = (rb.tab || 'report') !== 'criteria';
  let sheetCols = [];
  let sheetRows = [];
  const cellMap = {};

  if (sh && rb.result) {
    const heads2 = onReport ? sh.cols.map(f => f.label + (f.unit ? ' (' + f.unit + ')' : '')) : ['Item', 'Value'];
    const kinds = onReport ? sh.cols.map(f => f.kind) : ['text', 'text'];
    const body = onReport
      ? rb.result.rows.map(r => sh.cols.map(f => fmtV(f, r[f.key])))
      : sh.crit.map(r => r.map(String));
    const sel = rb.cell || 'A1';

    sheetCols = heads2.map((h, i) => ({
      letter: letter(i),
      w: kinds[i] === 'num' ? '96px' : (onReport ? '130px' : i ? '360px' : '140px'),
    }));

    sheetRows = [heads2, ...body].map((row, ri) => ({
      n: ri + 1,
      cells: row.map((v, ci) => {
        const ref = letter(ci) + (ri + 1);
        const hd = ri === 0;
        const num = !hd && kinds[ci] === 'num';
        cellMap[ref] = v;
        return {
          ref,
          v,
          align: num ? 'right' : 'left',
          weight: hd ? 700 : 400,
          bg: hd ? '#E2EFDA' : ri % 2 ? '#fff' : '#F7FBF8',
          color: hd ? '#1E4D2B' : '#222',
          ring: ref === sel ? 'inset 0 0 0 2px #107C41' : 'none',
        };
      }),
    }));

    for (let ri = sheetRows.length; ri < 16; ri++) {
      sheetRows.push({
        n: ri + 1,
        cells: heads2.map((_, ci) => {
          const ref = letter(ci) + (ri + 1);
          return {
            ref,
            v: '',
            align: 'left',
            weight: 400,
            bg: '#fff',
            color: '#222',
            ring: ref === sel ? 'inset 0 0 0 2px #107C41' : 'none',
          };
        }),
      });
    }
  }

  const res = rb.result;
  const numCol = sh && sh.cols ? sh.cols.find(f => f.kind === 'num' && f.unit === 'km') : null;
  const rowCount = res ? res.rows.length : 0;
  const resPg = usePagination(res ? res.rows : [], [res]);
  const rbStatus = !res
    ? ''
    : onReport
    ? `Ready · Count ${rowCount}` + (numCol ? ` · Sum of ${numCol.label} ${fmtN(res.rows.reduce((a, r) => a + (Number(r[numCol.key]) || 0), 0))} km` : '')
    : `Ready · ${sh ? sh.crit.length : 0} criteria`;

  // 12 Standard Reports
  const readyReports = [
    ['Daily trip register', 'All trips opened and closed, by branch. Replaces the Excel trip sheet.', 'Today 06:00', '312'],
    ['Billing-ready trips', 'Closed business trips with invoice, LR, customer and verified distance.', 'Yesterday 21:00', '288'],
    ['Non-business movements', 'Every movement without billing, with reason and distance.', 'Yesterday 21:00', '34'],
    ['Exception report', 'Hidden km, variance over threshold, GPS failures, manual exceptions.', 'Today 06:00', '19'],
    ['Hidden kilometre audit', 'Odometer gaps between consecutive trips per vehicle.', '12 Sep', '6'],
    ['Driver attendance', 'Present, absent, utilisation and continuous absence per driver.', '13 Sep', '604'],
    ['Vehicle utilisation', 'Running, idle by cause and maintenance days per vehicle.', '13 Sep', '722'],
    ['GPS health', 'Fix rate, gaps and device status per vehicle.', 'Today 06:00', '722'],
    ['Branch report', 'Trips, distance, exceptions and vehicle count summarised per branch.', 'Today 06:00', '14'],
    ['Distance report', 'Opening and closing odometer, GPS distance and variance per trip and vehicle.', 'Today 06:00', '312'],
    ['Diesel report', 'Fuel filled, litres consumed and mileage (km/l) per vehicle and driver.', 'Yesterday 21:00', '186'],
    ['Vehicle report', 'Registration, type, branch, status, documents due and total km per vehicle.', 'Today 06:00', '722'],
  ].map(([name, desc, last, rows]) => ({ name, desc, last, rows }));

  // What each ready-made report exports: report type, optional row filter and columns (default: all).
  const readySpec = {
    'Daily trip register': ['trip'],
    'Billing-ready trips': ['trip', r => r.status === 'Closed' && r.type === 'Business'],
    'Non-business movements': ['trip', r => r.type === 'Non-Business', ['number', 'date', 'vehicle', 'driver', 'branch', 'from', 'reason', 'distance', 'status']],
    'Exception report': ['exception'],
    'Hidden kilometre audit': ['exception', r => /hidden/i.test(r.etype)],
    'Driver attendance': ['attendance'],
    'Vehicle utilisation': ['vehicle', null, ['vehicle', 'vtype', 'branch', 'status', 'trips', 'distance']],
    'GPS health': ['gps'],
    'Branch report': ['trip', null, ['branch', 'number', 'date', 'vehicle', 'distance', 'status', 'flags']],
    'Distance report': ['trip', null, ['number', 'vehicle', 'startKm', 'closeKm', 'fixedKm', 'gpsKm', 'odoKm', 'variance']],
    'Diesel report': ['trip', null, ['number', 'vehicle', 'driver', 'branch', 'distance', 'diesel']],
    'Vehicle report': ['vehicle'],
  };

  const exportReady = (r) => {
    const [type, keep, keys] = readySpec[r.name] || ['trip'];
    const fields = keys ? keys.map(k => R.field(type, k)).filter(Boolean) : R.TYPES[type].fields;
    const rows = R.dataset(type, tms).filter(x => !keep || keep(x));
    const name = `${r.name.replace(/[^A-Za-z0-9]+/g, '_')}_${fileDate()}.xlsx`;
    downloadXlsx(name, [{
      name: r.name,
      columns: fields.map(f => f.label + (f.unit ? ' (' + f.unit + ')' : '')),
      rows: rows.map(x => fields.map(f => (x[f.key] == null ? '' : x[f.key]))),
    }]);
    showToast('success', 'Excel downloaded', `${name} · ${rows.length} rows`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {!R && (
        <div style={{ padding: '12px 14px', background: 'var(--kr-red-100)', borderRadius: 'var(--radius-md)', color: 'var(--kr-red-800)', fontSize: '14px' }}>
          The report engine (tms-report-builder.js) did not load. Check that the file sits in your public folder.
        </div>
      )}

      {R && (
        <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', padding: '18px', borderBottom: '1px solid var(--border-default)' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
                Report builder
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Pick a report type, choose what to show and which headings, ask in plain words, then generate an Excel sheet.
              </div>
            </div>
            <button
              onClick={handleReset}
              style={{ all: 'unset', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}
            >
              Start over
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch' }}>
            {/* Form Left Column */}
            <div
              style={{
                flex: '1 1 320px',
                maxWidth: '100%',
                boxSizing: 'border-box',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                background: 'var(--surface-muted)',
                borderRight: '1px solid var(--border-default)',
              }}
            >
              {/* Type Select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
                  Report type
                </label>
                <select
                  value={curType}
                  onChange={(e) => {
                    const next = e.target.value;
                    setRb(prev => ({
                      type: next,
                      scope: 'all',
                      cols: prev.cols || {},
                      ask: '',
                      loading: false,
                      result: null,
                      tab: 'report',
                      cell: null,
                    }));
                  }}
                  style={{
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-strong)',
                    fontSize: '14px',
                    outline: 'none',
                    background: '#fff',
                  }}
                >
                  {Object.keys(R.TYPES).map(k => (
                    <option key={k} value={k}>{R.TYPES[k].label}</option>
                  ))}
                </select>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {allDataset.length} {TY.noun} available. Pick what to show, then ask for anything more specific.
                </div>
              </div>

              {/* Show Pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
                  Show
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {scopes.map(s => {
                    const on = (rb.scope || 'all') === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setRb(prev => ({ ...prev, scope: s.id }))}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          height: '32px',
                          padding: '0 12px',
                          borderRadius: 'var(--radius-pill)',
                          fontFamily: 'var(--font-display)',
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          border: `2px solid ${on ? 'var(--color-brand)' : 'var(--border-strong)'}`,
                          background: on ? 'var(--color-brand)' : '#fff',
                          color: on ? '#fff' : 'var(--text-heading)',
                        }}
                      >
                        {s.label}
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', opacity: 0.8 }}>{s.n}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Headings Pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
                    Headings
                  </span>
                  <span style={{ display: 'flex', gap: '10px', alignItems: 'baseline', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {colKeys.length} of {TY.fields.length} selected
                    <button
                      onClick={() => setCols(TY.fields.map(f => f.key))}
                      style={{ all: 'unset', cursor: 'pointer', fontWeight: 700, color: 'var(--text-brand)' }}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setCols([])}
                      style={{ all: 'unset', cursor: 'pointer', fontWeight: 700, color: 'var(--text-muted)' }}
                    >
                      None
                    </button>
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {TY.fields.map(f => {
                    const on = colKeys.includes(f.key);
                    return (
                      <button
                        key={f.key}
                        onClick={() => toggleCol(f.key)}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          height: '32px',
                          padding: '0 12px',
                          borderRadius: 'var(--radius-pill)',
                          fontFamily: 'var(--font-display)',
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          border: `2px solid ${on ? 'var(--color-brand)' : 'var(--border-strong)'}`,
                          background: on ? 'var(--color-brand)' : '#fff',
                          color: on ? '#fff' : 'var(--text-heading)',
                        }}
                      >
                        {on && <span style={{ marginRight: '6px' }}>✓</span>}
                        {f.label}
                      </button>
                    );
                  })}
                </div>
                {colKeys.length === 0 && (
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--kr-red-700)' }}>
                    Choose at least one heading.
                  </div>
                )}
              </div>

              {/* Ask in plain words */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
                    Ask in plain words
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Optional</span>
                </div>
                <textarea
                  value={rb.ask || ''}
                  onChange={(e) => setRb(prev => ({ ...prev, ask: e.target.value.slice(0, 200) }))}
                  rows={3}
                  placeholder={`e.g. ${(RB_ASK[curType] || [''])[0].toLowerCase()}`}
                  style={{
                    boxSizing: 'border-box',
                    width: '100%',
                    minHeight: '84px',
                    padding: '10px 12px',
                    fontFamily: 'inherit',
                    fontSize: '15px',
                    lineHeight: 1.4,
                    color: 'var(--text-heading)',
                    background: '#fff',
                    border: '2px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md)',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Understood Chips / Bad prompt / Inferred Switch */}
              {p && p.understood && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '-10px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--kr-green-800)', fontWeight: 700 }}>Understood:</span>
                  {p.clauses.map((x, i) => (
                    <span key={i} style={{ fontSize: '12px', padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--color-brand-tint)', color: 'var(--kr-green-900)' }}>
                      {x.label}
                    </span>
                  ))}
                </div>
              )}
              {p && !p.understood && (
                <div style={{ fontSize: '12px', color: '#7A4300', marginTop: '-10px' }}>
                  Not understood yet. Try words like “long open”, “above 100 litres”, a branch, a driver or “this week”.
                </div>
              )}
              {inferred && inferred !== curType && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '-10px', padding: '8px 10px', background: 'var(--color-hazard-soft)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: '#7A4300' }}>
                  This sounds like a {R.TYPES[inferred].label}.
                  <button
                    onClick={() => {
                      setRb(prev => ({
                        type: inferred,
                        scope: 'all',
                        cols: prev.cols || {},
                        ask: prev.ask,
                        loading: false,
                        result: null,
                        tab: 'report',
                        cell: null,
                      }));
                    }}
                    style={{ all: 'unset', cursor: 'pointer', fontWeight: 700, color: '#7A4300', textDecoration: 'underline' }}
                  >
                    Switch to {R.TYPES[inferred].label}
                  </button>
                </div>
              )}

              {/* Try examples */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '-8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Try one of these</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(RB_ASK[curType] || []).map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => setRb(prev => ({ ...prev, ask: t }))}
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid var(--border-strong)',
                        color: 'var(--text-body)',
                        background: '#fff',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  width: '100%',
                  boxSizing: 'border-box',
                  height: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-brand)',
                  color: '#fff',
                  fontFamily: 'var(--font-display)',
                  fontSize: '14px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Generate report
              </button>
            </div>

            {/* Right Output: Live Preview or Excel Viewer */}
            <div
              style={{
                flex: '3 1 480px',
                minWidth: 0,
                maxWidth: '100%',
                boxSizing: 'border-box',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Preview before generation */}
              {!res && !rb.loading && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
                      Preview · live data
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {prevAll.length} of {allDataset.length} {TY.noun}{prevAll.length > prevRows.length ? ` · first ${prevRows.length} shown` : ''}
                    </span>
                  </div>

                  {prevRows.length === 0 || prevCols.length === 0 ? (
                    <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)', padding: '28px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {prevCols.length === 0 ? 'Select at least one heading to see the live values.' : `No ${TY.noun} match this selection right now.`}
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: 'var(--surface-muted)' }}>
                            {prevCols.map((h, i) => (
                              <th
                                key={i}
                                style={{
                                  padding: '9px 12px',
                                  textAlign: h.kind === 'num' ? 'right' : 'left',
                                  fontFamily: 'var(--font-display)',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  letterSpacing: '0.1em',
                                  textTransform: 'uppercase',
                                  color: 'var(--text-muted)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {h.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {prevRows.map((r, ri) => (
                            <tr key={ri} style={{ borderTop: '1px solid var(--border-default)' }}>
                              {prevCols.map((f, ci) => (
                                <td
                                  key={ci}
                                  style={{
                                    padding: '9px 12px',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '260px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    textAlign: f.kind === 'num' ? 'right' : 'left',
                                    fontWeight: ci === 0 ? 700 : 400,
                                    color: 'var(--text-body)',
                                  }}
                                >
                                  {fmtV(f, r[f.key])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Generate to open the full report as an Excel sheet you can download.
                  </div>
                </>
              )}

              {/* Loading Shimmer */}
              {rb.loading && (
                <div style={{ border: '1px solid #c8c8c8', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <div style={{ height: '48px', background: '#107C41', opacity: 0.85 }}></div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ height: '14px', width: '40%', background: 'var(--kr-grey-200)', borderRadius: '2px' }}></div>
                    <div style={{ height: '12px', background: 'var(--kr-grey-100)', borderRadius: '2px' }}></div>
                    <div style={{ height: '12px', width: '92%', background: 'var(--kr-grey-100)', borderRadius: '2px' }}></div>
                    <div style={{ height: '12px', width: '86%', background: 'var(--kr-grey-100)', borderRadius: '2px' }}></div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>Building the sheet…</div>
                  </div>
                </div>
              )}

              {/* Report Results */}
              {res && !rb.loading && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
                      Report Results
                    </span>
                    {can('reports', 'export') && (
                      // Shown for now without the export; wire onClick={handleExport} back to enable it.
                      <button
                        type="button"
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          height: '32px',
                          padding: '0 14px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-brand)',
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: 700,
                        }}
                      >
                        Download .xlsx
                      </button>
                    )}
                  </div>

                  {res.rows.length === 0 || sh.cols.length === 0 ? (
                    <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)', padding: '28px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {sh.cols.length === 0 ? 'Select at least one heading to see the live values.' : `No ${TY.noun} match this selection right now.`}
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: 'var(--surface-muted)' }}>
                            {sh.cols.map((h, i) => (
                              <th
                                key={i}
                                style={{
                                  padding: '9px 12px',
                                  textAlign: h.kind === 'num' ? 'right' : 'left',
                                  fontFamily: 'var(--font-display)',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  letterSpacing: '0.1em',
                                  textTransform: 'uppercase',
                                  color: 'var(--text-muted)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {h.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {resPg.rows.map((r, ri) => (
                            <tr key={ri} style={{ borderTop: '1px solid var(--border-default)' }}>
                              {sh.cols.map((f, ci) => (
                                <td
                                  key={ci}
                                  style={{
                                    padding: '9px 12px',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '260px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    textAlign: f.kind === 'num' ? 'right' : 'left',
                                    fontWeight: ci === 0 ? 700 : 400,
                                    color: 'var(--text-body)',
                                  }}
                                >
                                  {fmtV(f, r[f.key])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <Pagination {...resPg} noun="rows" style={{ padding: '10px 12px' }} />
                    </div>
                  )}

                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {rowCount} rows generated. Click Download .xlsx to get the full file.
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 12 Ready-Made Reports Section */}
      <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <button
          onClick={() => setTemplatesOpen(!templatesOpen)}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            boxSizing: 'border-box',
            padding: '14px 18px',
          }}
        >
          <span>
            <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
              Ready-made reports
            </span>
            <span style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)' }}>
              Standard exports, scoped by branch and date range. Each export records who exported it.
            </span>
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-brand)' }}>
            {templatesOpen ? 'Hide' : 'Show'}
          </span>
        </button>

        {templatesOpen && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '16px', padding: '0 18px 18px' }}>
            {readyReports.map((r, idx) => (
              <div
                key={idx}
                style={{
                  background: '#fff',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: 'var(--text-heading)' }}>
                  {r.name}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-body)', flex: 1 }}>{r.desc}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Last run {r.last} · {r.rows} rows
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Shown for now without the export; wire onClick={() => exportReady(r)} back to enable it. */}
                  <button
                    type="button"
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      padding: '0 12px',
                      height: '32px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-brand)',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    Export Excel
                  </button>

                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Reports;
