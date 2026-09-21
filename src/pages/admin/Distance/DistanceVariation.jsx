import React from 'react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';

export const DistanceVariation = () => {
  const { T, st, distQ, setDistQ, distReview, navTo } = useTMSAdmin();
  const tms = T();

  const distThr = Number(st.variance) || 5;
  const kmTxt = n => n == null ? '—' : n.toLocaleString('en-IN') + ' km';

  const distAll = (tms.distanceChecks || []).map(d => {
    const delta = km => km == null ? null : Math.round((km - d.fixedKm) / d.fixedKm * 1000) / 10;
    const g = delta(d.gpsKm);
    const o = delta(d.odoKm);
    const pct = Math.max(Math.abs(g || 0), Math.abs(o || 0));
    const flagged = pct > distThr;
    const review = flagged ? (distReview[d.id] || d.review || 'Open') : 'Within ' + distThr + '%';
    const [statusBg, statusFg, edge] = review === 'Open'
      ? ['var(--kr-red-100)', 'var(--kr-red-800)', 'var(--kr-red-600)']
      : review === 'Under review'
      ? ['var(--color-hazard-soft)', '#7A4300', 'var(--kr-saffron-500)']
      : review === 'Reviewed'
      ? ['var(--kr-grey-100)', 'var(--kr-grey-700)', 'var(--kr-grey-300)']
      : ['var(--color-brand-tint)', 'var(--kr-green-800)', 'var(--color-brand)'];
    const sign = x => x == null ? 'No reading' : (x > 0 ? '+' : '') + x.toFixed(1) + '%';
    const dColor = x => x == null || Math.abs(x) > distThr ? 'var(--kr-red-700)' : 'var(--text-muted)';
    const mx = Math.max(d.fixedKm, d.gpsKm || 0, d.odoKm || 0);
    const bars = [
      ['Fixed · Maps', d.fixedKm, 'var(--kr-grey-700)'],
      ['GPS', d.gpsKm, 'var(--color-brand)'],
      ['Odometer', d.odoKm, 'var(--kr-saffron-500)'],
    ].map(([label, km, color]) => ({
      label,
      value: kmTxt(km),
      w: km == null ? '0%' : Math.round(km / mx * 100) + '%',
      color,
    }));
    const [srcName, srcKm] = Math.abs(o || 0) >= Math.abs(g || 0) ? ['Odometer', d.odoKm] : ['GPS', d.gpsKm];
    const diff = (srcKm || 0) - d.fixedKm;
    const v = tms.V[d.vehicle];
    const hasTrip = !!(d.trip && tms.T[d.trip]);

    return {
      ...d,
      vehicleNumber: v ? v.number : '—',
      branchName: (tms.B[d.branch] || {}).name,
      fixedText: kmTxt(d.fixedKm),
      gpsText: kmTxt(d.gpsKm),
      odoText: kmTxt(d.odoKm),
      gpsDelta: sign(g),
      odoDelta: sign(o),
      gpsDeltaColor: dColor(g),
      odoDeltaColor: dColor(o),
      pct,
      pctText: pct.toFixed(1) + '%',
      pctColor: flagged ? 'var(--kr-red-700)' : 'var(--text-heading)',
      pctW: Math.min(100, Math.round(pct / (distThr * 3) * 100)) + '%',
      barColor: flagged ? 'var(--kr-red-600)' : 'var(--color-brand)',
      flagged,
      review,
      statusBg,
      statusFg,
      edge,
      bars,
      diffText: srcName + ' ' + (diff > 0 ? '+' : '') + diff + ' km vs fixed',
      canClose: review === 'Open' || review === 'Under review',
      hasTrip,
      trip: hasTrip ? d.trip : '',
      cursor: hasTrip ? 'pointer' : 'default',
    };
  });

  const distFlagged = distAll.filter(d => d.flagged).length;
  const q = (distQ || '').trim().toLowerCase();
  const distRows = distAll
    .filter(d => !q || [d.vehicleNumber, d.number, d.route, d.branchName].join(' ').toLowerCase().includes(q))
    .sort((a, b) => b.pct - a.pct);
  const distAlerts = distAll.filter(d => d.canClose).sort((a, b) => b.pct - a.pct);
  const distAvg = distAll.reduce((t, d) => t + d.pct, 0) / (distAll.length || 1);

  const distTiles = [
    { label: 'Trips compared', value: distAll.length, sub: 'Closed trips · last 7 days', edge: 'var(--color-brand)', color: 'var(--text-heading)' },
    { label: `Within ${distThr}%`, value: distAll.length - distFlagged, sub: Math.round((distAll.length - distFlagged) / (distAll.length || 1) * 100) + '% of trips', edge: 'var(--color-brand)', color: 'var(--text-heading)' },
    { label: `Over ${distThr}%`, value: distFlagged, sub: 'Flagged for review', edge: 'var(--kr-red-600)', color: 'var(--kr-red-700)' },
    { label: 'Average variance', value: distAvg.toFixed(1) + '%', sub: 'Furthest source vs fixed KM', edge: 'var(--kr-grey-300)', color: 'var(--text-heading)' },
  ];

  const distCols = ['Trip', 'Route', 'Fixed KM · Google Maps', 'GPS KM', 'Odometer KM', 'Variance'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Description & Settings link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
        <div></div>
        <button
          onClick={() => navTo('settings')}
          style={{
            all: 'unset',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-brand)',
            whiteSpace: 'nowrap',
          }}
        >
          Threshold {distThr}% · change in Settings &rarr;
        </button>
      </div>

      {/* 4 KPI Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '12px' }}>
        {distTiles.map((k, idx) => (
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
                color: k.color,
                lineHeight: 1.1,
                marginTop: '4px',
              }}
            >
              {k.value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* 4 Explanation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: '12px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--kr-grey-700)' }}></span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: 'var(--text-heading)' }}>
              Fixed route KM
            </span>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '4px' }}>
            Google Maps reference
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-body)', marginTop: '6px' }}>
            Set once per route in Route Master. This is the billing baseline.
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--color-brand)' }}></span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: 'var(--text-heading)' }}>
              GPS KM
            </span>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '4px' }}>
            Device track
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-body)', marginTop: '6px' }}>
            Distance summed from GPS fixes between trip open and close.
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--kr-saffron-500)' }}></span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: 'var(--text-heading)' }}>
              Odometer KM
            </span>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '4px' }}>
            Closing − opening
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-body)', marginTop: '6px' }}>
            Readings entered by the supervisor when the trip opens and closes.
          </div>
        </div>

        <div style={{ background: 'var(--color-brand-tint)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: 'var(--text-heading)' }}>
            Distance comparison
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '4px' }}>
            Flag above {distThr}%
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-body)', marginTop: '6px' }}>
            The source furthest from the fixed KM sets the trip variance. Flagged trips go to review.
          </div>
        </div>
      </div>

      {/* Review Alerts Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '15px',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color: 'var(--text-heading)',
            }}
          >
            Review alerts
          </h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {distAlerts.length} trips with variance over {distThr}% of fixed route KM
          </span>
        </div>

        {distAlerts.length === 0 && (
          <div style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--text-heading)' }}>
              No distance alerts to review
            </div>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
              All flagged trips have been reviewed.
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))', gap: '16px' }}>
          {distAlerts.map(a => (
            <div
              key={a.id}
              style={{
                background: '#fff',
                border: '1px solid var(--border-default)',
                borderLeft: `4px solid ${a.edge}`,
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>
                  {a.vehicleNumber}
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
                    background: a.statusBg,
                    color: a.statusFg,
                  }}
                >
                  {a.review}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-heading)' }}>{a.route}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{a.number}</span> · {a.branchName} · closed {a.closed}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '12px',
                  background: 'var(--surface-muted)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                {a.bars.map((b, bIdx) => (
                  <div key={bIdx} style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr) 72px', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{b.label}</span>
                    <span style={{ height: '10px', background: '#fff', borderRadius: '2px', overflow: 'hidden' }}>
                      <span style={{ display: 'block', height: '100%', width: b.w, background: b.color }}></span>
                    </span>
                    <span style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                      {b.value}
                    </span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-default)',
                }}
              >
                <span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', color: 'var(--kr-red-700)' }}>
                    {a.pctText}
                  </span>{' '}
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{a.diffText}</span>
                </span>
                {a.hasTrip && (
                  <button
                    onClick={() => navTo('trip', { selectedTrip: a.trip })}
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
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closed Trips Comparison Table */}
      <div style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '15px',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color: 'var(--text-heading)',
            }}
          >
            Distance comparison · closed trips
          </h2>
          <input
            type="text"
            placeholder="Search vehicle, trip, route or branch"
            value={distQ}
            onChange={setDistQ}
            style={{
              width: '320px',
              maxWidth: '100%',
              boxSizing: 'border-box',
              height: '36px',
              padding: '0 12px',
              fontSize: '14px',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '960px' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--surface-muted)' }}>
                {distCols.map((c, i) => (
                  <th
                    key={i}
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
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {distRows.map(r => (
                <tr
                  key={r.id}
                  onClick={() => r.hasTrip && navTo('trip', { selectedTrip: r.trip })}
                  style={{
                    cursor: r.cursor,
                    borderTop: '1px solid var(--border-default)',
                  }}
                  className="tms-table-row"
                >
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-heading)' }}>{r.vehicleNumber}</span>
                    <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{r.number}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ display: 'block', color: 'var(--text-heading)' }}>{r.route}</span>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>{r.branchName} · closed {r.closed}</span>
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-heading)' }}>
                    {r.fixedText}
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'block', color: 'var(--text-heading)' }}>{r.gpsText}</span>
                    <span style={{ display: 'block', fontSize: '12px', color: r.gpsDeltaColor }}>{r.gpsDelta}</span>
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'block', color: 'var(--text-heading)' }}>{r.odoText}</span>
                    <span style={{ display: 'block', fontSize: '12px', color: r.odoDeltaColor }}>{r.odoDelta}</span>
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        title={`Tick marks the ${distThr}% threshold`}
                        style={{ position: 'relative', width: '90px', height: '8px', background: 'var(--kr-grey-100)', borderRadius: '2px' }}
                      >
                        <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: r.pctW, background: r.barColor, borderRadius: '2px' }}></span>
                        <span style={{ position: 'absolute', left: '33.3%', top: '-3px', bottom: '-3px', width: '2px', background: 'var(--kr-grey-700)' }}></span>
                      </span>
                      <span style={{ fontWeight: 700, color: r.pctColor }}>{r.pctText}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {distRows.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            No trips match this search.
          </div>
        )}
      </div>
    </div>
  );
};

export default DistanceVariation;

