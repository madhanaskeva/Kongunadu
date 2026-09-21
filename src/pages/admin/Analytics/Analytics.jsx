import React from 'react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';

export const Analytics = () => {
  const { anTab, setAnTab, range, setRange, navTo, drvReqs, approvals, T } = useTMSAdmin();
  const tms = T();

  const pendingDrivers = [
    ...drvReqs.filter(r => r.status === 'Pending'),
    ...(tms.drivers || []).filter(d => (approvals[d.id] || d.approval) === 'Pending approval'),
  ].length;

  const anDefs = {
    trips: {
      chartTitle: 'Trips per day',
      chartSub: 'Business vs non-business, last 14 days',
      kpis: [
        ['Total trips', '4,218', '+6.2% vs previous period', 'var(--kr-green-700)'],
        ['Business', '3,796', '90% of movements', 'var(--text-muted)'],
        ['Non-business', '422', 'Maintenance 41% · Empty return 38%', 'var(--text-muted)'],
        ['Avg close time', '19.4 h', 'Target under 24 h', 'var(--kr-green-700)'],
      ],
      series: [284, 301, 322, 298, 310, 336, 341, 289, 305, 318, 327, 344, 312, 312],
      tableTitle: 'Trips by client',
      rows: [
        ['INOX Air Products', '1,204', '29% · 3 branches'],
        ['Linde India', '892', '21%'],
        ['Air Liquide India', '648', '15%'],
        ['Bharat Petroleum', '571', '14%'],
        ['Hindustan Petroleum', '402', '10%'],
        ['Suguna Foods', '301', '7% · on hold'],
        ['Non-business', '422', 'All reasons recorded'],
      ],
    },
    gps: {
      chartTitle: 'GPS fix rate',
      chartSub: 'Percentage of enroute minutes with a valid fix',
      kpis: [
        ['Fix rate', '96.8%', 'Target 98%', '#7A4300'],
        ['Route diversions', '23', '4 over 20 km', '#7A4300'],
        ['Idle events', '318', 'Over 15 min', 'var(--text-muted)'],
        ['Radius breaches', '11', 'Without an open trip', 'var(--kr-red-700)'],
      ],
      series: [97, 96, 98, 95, 97, 98, 96, 94, 97, 98, 97, 96, 97, 97],
      tableTitle: 'Vehicles with recurring GPS gaps',
      rows: [
        ['TS 09 UB 3344', '6 gaps', 'Hyderabad · device check due'],
        ['TN 34 CV 0921', '4 gaps', 'Namakkal · weak signal on NH44'],
        ['MH 04 GH 6612', '2 gaps', 'Mumbai'],
        ['KA 01 AJ 9087', '1 gap', 'Bengaluru'],
      ],
    },
    vehicles: {
      chartTitle: 'Fleet utilisation',
      chartSub: 'Running vehicles as a share of fleet, daily',
      kpis: [
        ['Utilisation', '61%', '+3 pts vs last month', 'var(--kr-green-700)'],
        ['Idle · no driver', '88', '12% of fleet', '#7A4300'],
        ['Avg km per vehicle', '312', 'per running day', 'var(--text-muted)'],
        ['Hidden km', '412', 'Unaccounted this month', 'var(--kr-red-700)'],
      ],
      series: [58, 60, 62, 59, 61, 64, 65, 57, 60, 62, 63, 66, 61, 61],
      tableTitle: 'Most idle vehicles',
      rows: [
        ['TN 28 AR 7712', '11 days', 'Chennai HO · no driver'],
        ['TN 28 AQ 8890', '9 days', 'Chennai HO · no business'],
        ['TN 34 CQ 5566', '7 days', 'Namakkal · maintenance'],
        ['TN 28 BD 2209', '6 days', 'Chennai HO'],
      ],
    },
    drivers: {
      chartTitle: 'Driver attendance',
      chartSub: 'Present drivers per day across branches',
      kpis: [
        ['Utilisation', '81%', 'Present days with a trip', 'var(--text-muted)'],
        ['Present today', '512', 'of 604 active drivers', 'var(--kr-green-700)'],
        ['Continuous absence', '7', '5+ days', 'var(--kr-red-700)'],
        ['Pending approvals', String(pendingDrivers), 'Supporting drivers', '#7A4300'],
      ],
      series: [498, 504, 512, 490, 508, 515, 520, 486, 502, 509, 514, 518, 512, 512],
      tableTitle: 'Attention',
      rows: [
        ['Ravi T.', '26 absent', 'Chennai HO · inactive'],
        ['Ibrahim K.', '8 absent', 'Namakkal · supporting'],
        ['Basavaraj H.', '6 absent', 'Bengaluru'],
        ['Karthik R.', '4 absent', 'Chennai HO'],
      ],
    },
    branches: {
      chartTitle: 'Trips by branch',
      chartSub: 'Daily trips, all branches stacked',
      kpis: [
        ['Active branches', '5', 'Visakhapatnam inactive', 'var(--text-muted)'],
        ['Top branch', 'Chennai HO', '132 trips today', 'var(--kr-green-700)'],
        ['Exceptions per 100 trips', '2.1', 'Hyderabad highest at 3.8', '#7A4300'],
        ['Attendance complete', '2 of 5', 'Chennai, Mumbai', '#7A4300'],
      ],
      series: [284, 301, 322, 298, 310, 336, 341, 289, 305, 318, 327, 344, 312, 312],
      tableTitle: 'Branch scorecard',
      rows: [
        ['Chennai HO', '132', '1.6 exc/100 · attendance complete'],
        ['Namakkal', '93', '2.2 exc/100 · 1 day missing'],
        ['Hyderabad', '58', '3.8 exc/100 · GPS failures'],
        ['Bengaluru', '39', '2.4 exc/100 · 3 days missing'],
        ['Mumbai', '24', '0.8 exc/100'],
      ],
    },
    irregularities: {
      chartTitle: 'Irregularities per day',
      chartSub: 'Hidden km, missing trips, GPS exceptions, billing leakage',
      kpis: [
        ['Hidden km', '412', '6 alerts · ₹1.2 L est. leakage', 'var(--kr-red-700)'],
        ['Missing trips', '9', 'Movement without trip record', 'var(--kr-red-700)'],
        ['GPS exceptions', '31', '4 with both sources failed', '#7A4300'],
        ['Billing leakage', '₹3.4 L', 'Recovered ₹2.1 L after review', '#7A4300'],
      ],
      series: [6, 4, 7, 5, 3, 8, 6, 9, 4, 5, 7, 6, 5, 8],
      tableTitle: 'Leakage by cause',
      rows: [
        ['Route diversion', '₹0.5 L', '23 events'],
        ['Hidden kilometres', '₹1.2 L', '55 km avg gap'],
        ['Unrecorded movement', '₹0.9 L', '9 radius breaches'],
        ['Variance over 5%', '₹0.8 L', '14 trips'],
      ],
    },
  };

  const ad = anDefs[anTab] || anDefs.trips;
  const mx = Math.max(...ad.series);

  const anTabs = [
    { value: 'trips', label: 'Trip' },
    { value: 'gps', label: 'GPS' },
    { value: 'vehicles', label: 'Vehicle' },
    { value: 'drivers', label: 'Driver' },
    { value: 'branches', label: 'Branch' },
    { value: 'irregularities', label: 'Irregularities' },
  ];

  const ranges = [
    { id: '7d', label: '7 days' },
    { id: '30d', label: '30 days' },
    { id: 'q', label: 'Quarter' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 6 Category Tabs */}
      <div style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '4px 18px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {anTabs.map(t => (
            <button
              key={t.value}
              onClick={() => setAnTab(t.value)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '12px 16px',
                fontFamily: 'var(--font-display)',
                fontSize: '14px',
                fontWeight: 700,
                color: anTab === t.value ? 'var(--color-brand)' : 'var(--text-muted)',
                borderBottom: `3px solid ${anTab === t.value ? 'var(--color-brand)' : 'transparent'}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range & Export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {ranges.map(r => {
            const on = range === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  padding: '0 14px',
                  height: '34px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: 'var(--radius-pill)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  border: `2px solid ${on ? 'var(--color-brand)' : 'var(--border-strong)'}`,
                  background: on ? 'var(--color-brand)' : '#fff',
                  color: on ? '#fff' : 'var(--text-heading)',
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => navTo('reports')}
          style={{
            all: 'unset',
            cursor: 'pointer',
            padding: '0 16px',
            height: '34px',
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-strong)',
            background: '#fff',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-heading)',
          }}
        >
          Export this view
        </button>
      </div>

      {/* 4 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '16px' }}>
        {ad.kpis.map(([label, value, sub, color], idx) => (
          <div
            key={idx}
            style={{
              background: '#fff',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 18px',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '30px', letterSpacing: '-0.02em', color: 'var(--text-heading)', marginTop: '6px', lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: '13px', color, marginTop: '6px' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Chart & Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '24px' }}>
        {/* Chart Column */}
        <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '18px' }}>
          <h2 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
            {ad.chartTitle}
          </h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>{ad.chartSub}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '180px', borderBottom: '1px solid var(--border-default)' }}>
            {ad.series.map((v, i) => {
              const h = Math.round((v / mx) * 100) + '%';
              const color = i === ad.series.length - 1 ? 'var(--kr-green-800)' : 'var(--color-brand)';
              return (
                <div key={i} title={String(v)} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                  <div style={{ height: h, background: color, borderRadius: '2px 2px 0 0', transition: 'height 0.2s ease-out' }}></div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
            <span>1 Sep</span>
            <span>14 Sep</span>
          </div>
        </section>

        {/* Breakdown Table Column */}
        <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <h2 style={{ margin: 0, padding: '14px 18px', borderBottom: '1px solid var(--border-default)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
            {ad.tableTitle}
          </h2>
          {ad.rows.map(([k, v, sub], idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '12px',
                padding: '11px 18px',
                borderBottom: '1px solid var(--border-default)',
                fontSize: '14px',
              }}
            >
              <span>
                <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-heading)' }}>{k}</span>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>{sub}</span>
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                {v}
              </span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Analytics;

