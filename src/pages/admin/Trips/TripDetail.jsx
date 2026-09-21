import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTMSAdmin } from '../../../context/TMSAdminContext';

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

  const tms = T();
  const currentTripId = id || selectedTrip || 'T07';
  const rawTrip = (tms.trips || []).find(t => t.id === currentTripId) || (tms.trips || [])[0];

  if (!rawTrip) return <div style={{ padding: '24px' }}>Trip not found</div>;

  const v = tms.V[rawTrip.vehicle];
  const d = tms.D[rawTrip.driver];
  const c = tms.C[rawTrip.client];
  const b = tms.B[rawTrip.branch];
  const s = tms.S[rawTrip.supervisor];

  const dist = [
    ['Fixed route', 'Billing reference', rawTrip.fixedKm, 'var(--kr-green-100)'],
    ['GPS', 'Actual movement', rawTrip.gpsKm, 'var(--color-brand)'],
    ['Odometer', 'Vehicle reading', rawTrip.odoKm, 'var(--kr-green-800)']
  ];
  const maxKm = Math.max(1, ...dist.map(x => x[2] || 0));
  const pct = rawTrip.fixedKm
    ? Math.round((Math.abs(Math.max(rawTrip.odoKm || 0, rawTrip.gpsKm || 0) - rawTrip.fixedKm) / rawTrip.fixedKm) * 1000) / 10
    : 0;
  const flagged = rawTrip.fixedKm && pct > Number(st.variance || 5);

  const badge = rawTrip.status === 'Closed' ? ((rawTrip.flags || []).length ? 'Closed · flagged' : 'Closed') : (rawTrip.hoursOpen > 24 ? 'Long open' : rawTrip.stage || 'Enroute');
  const badgeBg = rawTrip.status === 'Closed' ? 'var(--st-closed-bg)' : 'var(--st-enroute-bg)';
  const badgeFg = rawTrip.status === 'Closed' ? 'var(--st-closed-fg)' : 'var(--st-enroute-fg)';

  const editTrip = () => {
    setDrawer({
      isForm: true,
      isTripEdit: true,
      kicker: 'Edit trip record',
      title: rawTrip.number,
      saveLabel: 'Save changes',
      required: ['startKm'],
      fields: [
        ['invoice', 'Loading invoice number'],
        ['lr', 'LR number'],
        ['startKm', 'Start KM'],
        ['closeKm', 'Closing odometer'],
        ['advance', 'Advance given'],
        ['diesel', 'Diesel given'],
        ['type', 'Trip type', ['Business', 'Non-Business']],
        ['reason', 'Non-business reason', ['', 'Maintenance', 'Internal Movement', 'Empty Return', 'Driver Testing']],
      ],
    });
    setForm({
      invoice: rawTrip.invoice || '',
      lr: rawTrip.lr || '',
      startKm: rawTrip.startKm,
      closeKm: rawTrip.closeKm || '',
      advance: (rawTrip.advance || '').replace('₹', ''),
      diesel: (rawTrip.diesel || '').replace(' L', ''),
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

  const tripRecords = [
    ['Branch', (b || {}).name],
    ['Supervisor', (s || {}).name],
    ['Client', (c || {}).name],
    ['Customer(s)', rawTrip.unloading],
    ['Vehicle', (v || {}).number],
    ['Driver', (d || {}).name],
    ['Loading location', (tms.L[rawTrip.loading] || {}).name],
    ['Trip type', rawTrip.type + (rawTrip.reason ? ' · ' + rawTrip.reason : '')],
    ['Start KM', rawTrip.startKm ? rawTrip.startKm.toLocaleString('en-IN') : '—'],
    ['Closing KM', rawTrip.closeKm ? rawTrip.closeKm.toLocaleString('en-IN') : 'Pending'],
    ['Loading invoice', rawTrip.invoice || 'Pending'],
    ['LR number', rawTrip.lr || '—'],
    ['Advance given', rawTrip.advance || 'Pending'],
    ['Diesel given', rawTrip.diesel || 'Pending'],
    ['Loading qty', rawTrip.qtyLoad],
    ['Unloading qty', rawTrip.qtyUnload || 'Pending'],
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

      {/* Grid 1: Triple Distance Verification & Trip Record */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
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

        <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <h2 style={{ margin: 0, padding: '14px 18px', borderBottom: '1px solid var(--border-default)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
            Trip record
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {tripRecords.map(([k, val], i) => (
              <div key={i} style={{ padding: '10px 18px', borderBottom: '1px solid var(--border-default)', minWidth: 0 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{k}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)', overflowWrap: 'anywhere' }}>
                  {val || '—'}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Grid 2: Status Lifecycle & GPS Log */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
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
                {gpsLogs.map((g, i) => (
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
        </section>
      </div>
    </div>
  );
};

export default TripDetail;
