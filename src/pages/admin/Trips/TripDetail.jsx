import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { Pagination, usePagination } from '../../../components/common/Pagination';
import './tripDetail.css';

export const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    T,
    selectedTrip,
    setSelectedTrip,
    st,
    setDrawer,
    setForm,
    setConfirm,
    deleted,
    setDeleted,
    showToast,
    navTo,
  } = useTMSAdmin();
  const { can } = useModuleAccess();

  const tms = T();
  const gpsPg = usePagination(tms.gpsLog || []);
  const currentTripId = id || selectedTrip || 'T07';
  // A trip opened by URL must exist (deleted trips stay gone); otherwise fall back to the first trip.
  const rawTrip = (tms.trips || []).find(t => t.id === currentTripId) || (id ? null : (tms.trips || [])[0]);

  if (!rawTrip) return <div style={{ padding: '24px' }}>Trip not found</div>;

  const v = tms.V[rawTrip.vehicle];
  const d = tms.D[rawTrip.driver];
  const c = tms.C[rawTrip.client];
  const b = tms.B[rawTrip.branch];
  const s = tms.S[rawTrip.supervisor];

  const isClosed = rawTrip.status === 'Closed';

  const fmtKm = n => (n != null && n !== '' ? Number(n).toLocaleString('en-IN') + ' km' : null);
  const fmtMoney = n => {
    if (!n && n !== 0) return null;
    const str = String(n).trim();
    if (str.startsWith('₹')) return str;
    const num = Number(str.replace(/[^\d.]/g, ''));
    return isNaN(num) ? str : '₹' + num.toLocaleString('en-IN');
  };

  const computedOdo =
    rawTrip.odoKm != null
      ? rawTrip.odoKm
      : rawTrip.closeKm != null && rawTrip.startKm != null && rawTrip.closeKm >= rawTrip.startKm
      ? rawTrip.closeKm - rawTrip.startKm
      : null;

  const dist = [
    ['Fixed route', 'Billing reference', rawTrip.fixedKm, 'var(--kr-green-100)'],
    ['GPS', 'Actual movement', rawTrip.gpsKm, 'var(--color-brand)'],
    ['Odometer', 'Vehicle reading', computedOdo, 'var(--kr-green-800)'],
  ];
  const maxKm = Math.max(1, ...dist.map(x => x[2] || 0));
  const actualKm = Math.max(computedOdo || 0, rawTrip.gpsKm || 0);
  const pct = rawTrip.fixedKm
    ? Math.round((Math.abs(actualKm - rawTrip.fixedKm) / rawTrip.fixedKm) * 1000) / 10
    : 0;
  const flagged = rawTrip.fixedKm && pct > Number(st.variance || 5);

  const badge =
    rawTrip.status === 'Closed'
      ? (rawTrip.flags || []).length
        ? 'Closed · flagged'
        : 'Closed'
      : rawTrip.hoursOpen > 24
      ? 'Long open'
      : rawTrip.stage || 'Enroute';
  const badgeBg = rawTrip.status === 'Closed' ? 'var(--st-closed-bg)' : 'var(--st-enroute-bg)';
  const badgeFg = rawTrip.status === 'Closed' ? 'var(--st-closed-fg)' : 'var(--st-enroute-fg)';

  const editTrip = () => {
    setDrawer({
      isForm: true,
      isTripEdit: true,
      isMaster: true,
      masterKey: 'trips',
      kicker: 'Edit trip record',
      title: rawTrip.number,
      saveLabel: 'Save changes',
      required: ['startKm'],
      fields: [
        ['invoice', 'Loading invoice number'],
        ['lr', 'LR number'],
        ['startKm', 'Start KM'],
        ['closeKm', 'Closing odometer'],
        ['advance', 'Advance given (₹)'],
        ['bunk', 'Bunk name'],
        ['rate', 'Diesel rate (₹/L)'],
        ['diesel', 'Diesel quantity (L)'],
        ['totalExpense', 'Total expense (₹)'],
        ['qtyLoad', 'Loading qty'],
        ['qtyUnload', 'Unloading qty'],
        ['remarks', 'Open remarks'],
        ['closeRemarks', 'Close remarks'],
        ['type', 'Trip type', ['Business', 'Non-Business']],
        ['reason', 'Non-business reason', ['Maintenance', 'Internal Movement', 'Empty Return', 'Driver Testing']],
      ],
    });
    setForm({
      id: rawTrip.id,
      invoice: rawTrip.invoice || '',
      lr: rawTrip.lr || '',
      startKm: rawTrip.startKm,
      closeKm: rawTrip.closeKm || '',
      advance: (rawTrip.advance || '').replace(/[₹\s]/g, ''),
      bunk: rawTrip.bunk || '',
      rate: rawTrip.rate || '',
      diesel: (rawTrip.diesel || '').replace(/\s*L$/i, '').trim(),
      totalExpense: (rawTrip.totalExpense || '').replace(/[₹\s]/g, ''),
      qtyLoad: rawTrip.qtyLoad || '',
      qtyUnload: rawTrip.qtyUnload || '',
      remarks: rawTrip.remarks || '',
      closeRemarks: rawTrip.closeRemarks || '',
      type: rawTrip.type,
      reason: rawTrip.reason || '',
    });
  };

  const askDeleteTrip = () => {
    setConfirm({
      title: `Delete trip ${rawTrip.number}?`,
      body: 'The record is removed from billing and analytics. Deletion is logged with your user and the vehicle movement remains in the GPS audit log, so no movement disappears.',
      okLabel: 'Delete trip',
      danger: true,
      onOk: () => {
        setDeleted([...deleted, rawTrip.id]);
        navTo('trips');
        showToast('danger', 'Trip deleted', `${rawTrip.number} removed. Logged in the audit trail.`);
      },
    });
  };

  const tripDist = computedOdo != null ? computedOdo : null;

  const dieselLitres =
    rawTrip.dieselLitres != null
      ? Number(rawTrip.dieselLitres)
      : rawTrip.diesel
      ? Number(String(rawTrip.diesel).replace(/[^\d.]/g, ''))
      : null;

  const dieselRate = rawTrip.rate ? Number(rawTrip.rate) : null;
  const dieselAmount =
    rawTrip.dieselTotal != null
      ? Number(rawTrip.dieselTotal)
      : dieselRate && dieselLitres
      ? Math.round(dieselRate * dieselLitres)
      : null;

  const tripRecords = [
    ['Branch', (b || {}).name || rawTrip.branchName || '—'],
    ['Supervisor', (s || {}).name || rawTrip.supervisorName || '—'],
    ['Client', (c || {}).name || rawTrip.clientName || '—'],
    [
      'Customer(s)',
      rawTrip.unloading ||
        (Array.isArray(rawTrip.customers)
          ? rawTrip.customers.map(id => (tms.U[id] || {}).name).filter(Boolean).join(', ')
          : '—'),
    ],
    ['Vehicle', (v || {}).number || rawTrip.vehicleNumber || rawTrip.vehicle || '—'],
    ['Vehicle type', (v || {}).type || rawTrip.vehicleType || '—'],
    ['Driver', (d || {}).name || rawTrip.driverName || '—'],
    ['Trip type', rawTrip.type + (rawTrip.reason ? ' · ' + rawTrip.reason : '')],
    ['Loading location', (tms.L[rawTrip.loading] || {}).name || rawTrip.loading || '—'],
    ['Opened at', rawTrip.opened || '—'],
    ['Start KM', rawTrip.startKm != null ? fmtKm(rawTrip.startKm) : '—'],
    ['Closing KM', rawTrip.closeKm != null ? fmtKm(rawTrip.closeKm) : isClosed ? '—' : 'Pending'],
    ['Trip distance', tripDist != null ? fmtKm(tripDist) : isClosed ? '—' : 'Pending'],
    [
      'Variance vs fixed',
      !rawTrip.fixedKm ? 'Not applicable' : isClosed ? `${pct}%` : 'Pending verification at close',
      flagged ? { bg: 'var(--color-hazard-soft)', color: '#7A4300' } : null,
    ],
    ['Loading invoice', rawTrip.invoice || (isClosed ? '—' : 'Pending')],
    ['LR number', rawTrip.lr || '—'],
    ['Advance given', fmtMoney(rawTrip.advance) || (isClosed ? '—' : 'Pending')],
    ['Bunk name', rawTrip.bunk || (isClosed ? '—' : 'Pending')],
    ['Diesel rate', dieselRate ? '₹' + dieselRate.toFixed(2) + '/L' : isClosed ? '—' : 'Pending'],
    [
      'Diesel quantity',
      dieselLitres
        ? dieselLitres.toLocaleString('en-IN') + ' L'
        : rawTrip.diesel || (isClosed ? '—' : 'Pending'),
    ],
    ['Diesel amount', dieselAmount ? fmtMoney(dieselAmount) : isClosed ? '—' : 'Pending'],
    ['Total expense', fmtMoney(rawTrip.totalExpense) || (isClosed ? '—' : 'Pending')],
    ['Loading qty', rawTrip.qtyLoad || '—'],
    ['Unloading qty', rawTrip.qtyUnload || (isClosed ? '—' : 'Pending')],
    ['Open remarks', rawTrip.remarks || '—'],
    ['Close remarks', rawTrip.closeRemarks || (isClosed ? '—' : 'Pending')],
    ['Closed at', rawTrip.closed || (isClosed ? '—' : 'Pending')],
    [
      'Verification status',
      rawTrip.status === 'Closed'
        ? flagged
          ? 'Variance flagged'
          : 'Within threshold'
        : rawTrip.status || 'Enroute',
      flagged ? { bg: 'var(--color-hazard-soft)', color: '#7A4300' } : null,
    ],
  ];

  const lifecycle = [
    ['Loaded', (rawTrip.opened || '').split(' ').slice(0, 3).join(' '), true],
    ['Opened · Enroute', `${rawTrip.opened} · Trip ID generated on save`, true],
    ['GPS monitoring', rawTrip.status === 'Enroute' ? 'Live · last fix 2 min ago' : 'Complete · 410 fixes stored', true],
    ['Closed', rawTrip.closed || 'Pending unloading', rawTrip.status === 'Closed'],
    ['Billing', rawTrip.type === 'Non-Business' ? 'Not applicable · reason recorded' : rawTrip.status === 'Closed' ? 'Ready · ' + (rawTrip.invoice || '') : 'After close', rawTrip.status === 'Closed'],
  ];

  const gpsLogs = tms.gpsLog || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <button
            onClick={() => navTo('trips')}
            style={{ all: 'unset', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--text-brand)' }}
          >
            ← All trips
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)' }}>
              {rawTrip.number}
            </span>
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
                background: badgeBg,
                color: badgeFg,
              }}
            >
              {badge}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              {rawTrip.type} · {(b || {}).name} · opened by {(s || {}).name}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {can('trips', 'edit') && (
            <button
              onClick={editTrip}
              style={{
                all: 'unset',
                cursor: 'pointer',
                height: '32px',
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--color-brand)',
              }}
            >
              Edit record
            </button>
          )}
          {can('trips', 'delete') && (
            <button
              onClick={askDeleteTrip}
              style={{
                all: 'unset',
                cursor: 'pointer',
                height: '32px',
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--kr-red-700)',
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Flagged Alert Banner */}
      {flagged && (
        <div
          role="alert"
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'var(--color-hazard-soft)',
            borderRadius: 'var(--radius-md)',
            color: '#7A4300',
            fontSize: '14px',
            flexWrap: 'wrap',
          }}
        >
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Flagged
          </strong>
          <span>Distance variance {pct}% exceeds {st.variance}% threshold</span>
          <button
            onClick={() => navTo('exceptions')}
            style={{ all: 'unset', cursor: 'pointer', marginLeft: 'auto', fontWeight: 700, color: '#7A4300' }}
          >
            Open in exceptions →
          </button>
        </div>
      )}

      {/* Summary: distance check beside the status lifecycle */}
      <div className="td-summary-grid">
        <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '18px' }}>
          <h2 style={{ margin: '0 0 14px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
            Triple distance verification
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dist.map(([label, role, km, color], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 70px', gap: '12px', alignItems: 'center', fontSize: '14px' }}>
                <span>
                  <span style={{ display: 'block', fontWeight: 700, color: 'var(--text-heading)' }}>{label}</span>
                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>{role}</span>
                </span>
                <span style={{ height: '18px', background: 'var(--kr-grey-100)', borderRadius: '2px', overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: Math.round(((km || 0) / maxKm) * 100) + '%', background: color, transition: 'width var(--dur-base)' }} />
                </span>
                <span style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--text-heading)' }}>
                  {km == null ? '—' : km + ' km'}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: flagged ? 'var(--color-hazard-soft)' : 'var(--color-brand-tint)',
              color: flagged ? '#7A4300' : 'var(--kr-green-900)',
              fontSize: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <span>
              {rawTrip.status === 'Enroute'
                ? 'Verification runs at close. GPS distance is compared live against the fixed route.'
                : !rawTrip.fixedKm
                ? 'Non-business movement. No billing reference; GPS and odometer are recorded for the audit trail.'
                : `Largest deviation ${pct}% from the ${rawTrip.fixedKm} km fixed route (threshold ${st.variance}%).`}
            </span>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {rawTrip.status === 'Enroute' ? 'Pending' : flagged ? 'Flagged' : 'Within threshold'}
            </strong>
          </div>
          <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Fallback: {rawTrip.gpsKm == null ? 'GPS missing, odometer used for distance.' : 'both sources present, odometer merged with GPS.'}
          </div>
        </section>
        <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '18px' }}>
          <h2 style={{ margin: '0 0 14px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
            Status lifecycle
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {lifecycle.map(([label, meta, done], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '16px 1fr', gap: '12px', minHeight: '52px' }}>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: done ? 'var(--color-brand)' : '#fff',
                      border: `2px solid ${done ? 'var(--color-brand)' : 'var(--border-strong)'}`,
                      boxSizing: 'border-box',
                      marginTop: '4px',
                      flex: 'none',
                    }}
                  />
                  {i < lifecycle.length - 1 && <span style={{ flex: 1, width: '2px', background: 'var(--border-default)' }} />}
                </span>
                <span style={{ paddingBottom: '14px' }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: '14px', color: done ? 'var(--text-heading)' : 'var(--text-muted)' }}>
                    {label}
                  </span>
                  <span style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {meta}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Full-width trip record: 4 columns on desktop, 2 on tablet, 1 on mobile */}
      <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <h2 style={{ margin: 0, padding: '14px 18px', borderBottom: '1px solid var(--border-default)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
          Trip record
        </h2>
        <div className="td-record-grid">
          {tripRecords.map(([k, val, styleObj], i) => (
            <div
              key={i}
              style={{
                padding: '10px 18px',
                minWidth: 0,
                background: styleObj?.bg || '#fff',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{k}</div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: styleObj?.color || 'var(--text-heading)',
                  overflowWrap: 'anywhere',
                }}
              >
                {val || '—'}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border-default)', gap: '8px', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
            GPS log
          </h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Stored separately for route replay</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-muted)', textAlign: 'left' }}>
                <th style={{ padding: '8px 18px', fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Time</th>
                <th style={{ padding: '8px 12px', fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Event</th>
                <th style={{ padding: '8px 12px', fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>KM</th>
                <th style={{ padding: '8px 18px', fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Speed</th>
              </tr>
            </thead>
            <tbody>
              {gpsPg.rows.map((g, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border-default)' }}>
                  <td style={{ padding: '10px 18px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{g.t}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-heading)' }}>{g.ev}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{g.km}</td>
                  <td style={{ padding: '10px 18px', textAlign: 'right', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{g.speed} km/h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {gpsLogs.length > 0 && <Pagination {...gpsPg} noun="GPS events" />}
      </section>
    </div>
  );
};

export default TripDetail;
