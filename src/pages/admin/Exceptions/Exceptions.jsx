import React from 'react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';

export const Exceptions = () => {
  const {
    T,
    excType,
    setExcType,
    excStatus,
    setExcStatus,
    setExcSel,
    setExcAssignee,
    setExcNote,
    setDrawer,
    excOverrides,
    width,
  } = useTMSAdmin();

  const tms = T();
  const narrow = width < 900;
  const excTileCols = `repeat(${narrow ? 2 : 5}, minmax(0, 1fr))`;

  const exceptions = (tms.exceptions || []).map(x => {
    const o = excOverrides[x.id] || {};
    const xx = { ...x, ...o };
    const v = tms.V[xx.vehicle];
    const tr = tms.T[xx.trip];
    const sevColors = {
      High: ['var(--kr-red-100)', 'var(--kr-red-800)'],
      Medium: ['var(--color-hazard-soft)', '#7A4300'],
      Low: ['var(--kr-grey-100)', 'var(--kr-grey-700)']
    };
    const [sevBg, sevFg] = sevColors[xx.severity] || ['var(--kr-grey-100)', 'var(--kr-grey-700)'];
    return {
      ...xx,
      vehicleNumber: v ? v.number : '—',
      tripNumber: tr ? tr.number : '—',
      branchName: (tms.B[xx.branch] || {}).name || '—',
      sevBg,
      sevFg,
    };
  });

  const openExc = exceptions.filter(x => x.status !== 'Resolved');
  const types = ['Hidden kilometres', 'Distance variance', 'Route diversion', 'GPS failure', 'Both sources failed', 'Long open trip', 'Radius breach', 'Missing attendance', 'Idle vehicles'];

  const excTiles = [
    { type: '', label: 'All open', count: openExc.length },
    ...types.map(t => ({ type: t, label: t, count: openExc.filter(x => x.type === t).length }))
  ].map(k => {
    const a = excType === k.type;
    return {
      ...k,
      bg: a ? 'var(--color-brand)' : '#fff',
      border: a ? 'var(--color-brand)' : 'var(--border-default)',
      labelColor: a ? 'rgba(255,255,255,.85)' : 'var(--text-muted)',
      valueColor: a ? '#fff' : 'var(--text-heading)',
    };
  });

  const statusMap = { open: 'Open', review: 'Under review', resolved: 'Resolved' };
  const excRows = exceptions.filter(x =>
    (!excType || x.type === excType) &&
    (excStatus === 'all' || x.status === statusMap[excStatus])
  );

  const excTabs = [
    { value: 'open', label: 'Open', count: exceptions.filter(x => x.status === 'Open').length },
    { value: 'review', label: 'Under review', count: exceptions.filter(x => x.status === 'Under review').length },
    { value: 'resolved', label: 'Resolved', count: exceptions.filter(x => x.status === 'Resolved').length },
    { value: 'all', label: 'All' },
  ];

  const excCols = ['Severity', 'Type', 'Vehicle / trip', 'Detail', 'Branch', 'Raised', 'Assignee'];

  const openException = (x) => {
    setExcSel(x.id);
    setExcAssignee(x.assignee === 'Unassigned' ? '' : x.assignee);
    setExcNote('');
    setDrawer({ isException: true, kicker: 'Exception ' + x.id, title: x.type });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 10 Exception Category Tiles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: excTileCols, gap: '12px' }}>
        {excTiles.map((k, i) => (
          <button
            key={i}
            onClick={() => setExcType(k.type)}
            style={{
              all: 'unset',
              boxSizing: 'border-box',
              minWidth: 0,
              cursor: 'pointer',
              display: 'block',
              background: k.bg,
              border: `1px solid ${k.border}`,
              borderRadius: 'var(--radius-lg)',
              padding: '12px 14px',
              textAlign: 'left',
              transition: 'box-shadow var(--dur-fast)',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: k.labelColor }}>{k.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '24px', color: k.valueColor, lineHeight: 1.1 }}>
              {k.count}
            </div>
          </button>
        ))}
      </div>

      {/* Exceptions Table Card */}
      <div style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {/* Status Tabs */}
        <div style={{ padding: '0 18px', borderBottom: '1px solid var(--border-default)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {excTabs.map((t) => {
            const on = excStatus === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setExcStatus(t.value)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: 700,
                  borderBottom: `3px solid ${on ? 'var(--color-brand)' : 'transparent'}`,
                  color: on ? 'var(--color-brand)' : 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
                {t.count !== undefined && <span style={{ fontSize: '12px', opacity: 0.8 }}>({t.count})</span>}
              </button>
            );
          })}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '820px' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--surface-muted)' }}>
                {excCols.map((c, i) => (
                  <th key={i} style={{ padding: '10px 14px', fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {excRows.map((x) => (
                <tr
                  key={x.id}
                  onClick={() => openException(x)}
                  style={{ cursor: 'pointer', borderTop: '1px solid var(--border-default)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-muted)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        fontFamily: 'var(--font-display)',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: x.sevBg,
                        color: x.sevFg,
                      }}
                    >
                      {x.severity}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                    {x.type}
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-heading)' }}>{x.vehicleNumber}</span>
                    <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{x.tripNumber}</span>
                  </td>
                  <td style={{ padding: '12px 14px', maxWidth: '340px', color: 'var(--text-body)' }}>
                    {x.detail}
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{x.branchName}</td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{x.raised}</td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{x.assignee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {excRows.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--text-heading)' }}>
              No {excStatus === 'all' ? '' : statusMap[excStatus]?.toLowerCase()} exceptions
            </div>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
              Nothing of this type needs attention.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Exceptions;
