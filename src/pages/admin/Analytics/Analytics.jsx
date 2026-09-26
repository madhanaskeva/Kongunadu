import React, { useMemo } from 'react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { Calendar, ArrowRight, Clock, RotateCcw } from 'lucide-react';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatShortDate = (iso) => {
  if (!iso) return '';
  const parts = String(iso).split('-');
  if (parts.length < 3) return iso;
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return `${d} ${MONTHS_SHORT[m] || ''}`;
};

const formatFullDate = (iso) => {
  if (!iso) return '';
  const parts = String(iso).split('-');
  if (parts.length < 3) return iso;
  const y = parts[0];
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return `${d} ${MONTHS_SHORT[m] || ''} ${y}`;
};

export const Analytics = () => {
  const {
    anTab = 'trips',
    setAnTab,
    range = '30d',
    setRange,
    customFrom = '2026-09-01',
    setCustomFrom,
    customTo = '2026-09-14',
    setCustomTo,
    drvReqs = [],
    approvals = {},
    T,
  } = useTMSAdmin();

  const tms = T ? T() : {};

  const pendingDrivers = [
    ...(drvReqs || []).filter((r) => r.status === 'Pending'),
    ...(tms.drivers || []).filter((d) => (approvals[d.id] || d.approval) === 'Pending approval'),
  ].length;

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

  const presetOptions = [
    { label: 'Last 7 Days', from: '2026-09-08', to: '2026-09-14' },
    { label: 'Last 14 Days', from: '2026-09-01', to: '2026-09-14' },
    { label: 'Last 30 Days', from: '2026-08-16', to: '2026-09-14' },
    { label: 'Sep 2026', from: '2026-09-01', to: '2026-09-30' },
    { label: 'Q3 2026', from: '2026-07-01', to: '2026-09-30' },
  ];

  // Resolve days, factor, and date labels
  const { effectiveDays, factor, periodInfo } = useMemo(() => {
    let days = 30;
    let pInfo = {
      badgeText: 'Last 30 Days',
      chartSubSuffix: 'last 30 days',
      startLabel: '16 Aug',
      midLabel: '1 Sep',
      endLabel: '14 Sep',
      summary: '16 Aug 2026 – 14 Sep 2026 (30 days)',
    };

    if (range === '7d') {
      days = 7;
      pInfo = {
        badgeText: '7 Days',
        chartSubSuffix: 'last 7 days',
        startLabel: '8 Sep',
        midLabel: '11 Sep',
        endLabel: '14 Sep',
        summary: '8 Sep 2026 – 14 Sep 2026 (7 days)',
      };
    } else if (range === '30d') {
      days = 30;
      pInfo = {
        badgeText: '30 Days',
        chartSubSuffix: 'last 30 days',
        startLabel: '16 Aug',
        midLabel: '1 Sep',
        endLabel: '14 Sep',
        summary: '16 Aug 2026 – 14 Sep 2026 (30 days)',
      };
    } else if (range === 'q') {
      days = 90;
      pInfo = {
        badgeText: 'Quarter (Q3)',
        chartSubSuffix: 'Q3 2026 (last 90 days)',
        startLabel: '1 Jul',
        midLabel: '15 Aug',
        endLabel: '30 Sep',
        summary: '1 Jul 2026 – 30 Sep 2026 (90 days)',
      };
    } else if (range === 'custom') {
      const fromObj = new Date(`${customFrom || '2026-09-01'}T00:00:00`);
      const toObj = new Date(`${customTo || '2026-09-14'}T00:00:00`);
      const diffMs = toObj.getTime() - fromObj.getTime();
      const calcDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
      days = calcDays;

      const sLabel = formatShortDate(customFrom);
      const eLabel = formatShortDate(customTo);

      // Calculate middle date
      const midTime = fromObj.getTime() + diffMs / 2;
      const midObj = new Date(midTime);
      const mLabel = `${midObj.getDate()} ${MONTHS_SHORT[midObj.getMonth()]}`;

      pInfo = {
        badgeText: `${days} Day${days !== 1 ? 's' : ''}`,
        chartSubSuffix: `${sLabel} – ${eLabel} (${days} days)`,
        startLabel: sLabel,
        midLabel: mLabel,
        endLabel: eLabel,
        summary: `${formatFullDate(customFrom)} – ${formatFullDate(customTo)} (${days} day${days !== 1 ? 's' : ''})`,
      };
    }

    const f = days / 30;
    return { effectiveDays: days, factor: f, periodInfo: pInfo };
  }, [range, customFrom, customTo]);

  // Generate series data for chart
  const seriesData = useMemo(() => {
    let barCount = 14;
    let isWeekly = false;

    if (range === '7d') {
      barCount = 7;
    } else if (range === '30d') {
      barCount = 14;
    } else if (range === 'q') {
      barCount = 13;
      isWeekly = true;
    } else {
      if (effectiveDays <= 14) {
        barCount = effectiveDays;
      } else if (effectiveDays <= 31) {
        barCount = Math.min(effectiveDays, 16);
      } else {
        barCount = Math.min(14, Math.max(8, Math.round(effectiveDays / 7)));
        isWeekly = true;
      }
    }

    const basePatterns = {
      trips: [284, 301, 322, 298, 310, 336, 341, 289, 305, 318, 327, 344, 312, 312],
      gps: [97, 96, 98, 95, 97, 98, 96, 94, 97, 98, 97, 96, 97, 97],
      vehicles: [58, 60, 62, 59, 61, 64, 65, 57, 60, 62, 63, 66, 61, 61],
      drivers: [498, 504, 512, 490, 508, 515, 520, 486, 502, 509, 514, 518, 512, 512],
      branches: [284, 301, 322, 298, 310, 336, 341, 289, 305, 318, 327, 344, 312, 312],
      irregularities: [6, 4, 7, 5, 3, 8, 6, 9, 4, 5, 7, 6, 5, 8],
    };

    const pattern = basePatterns[anTab] || basePatterns.trips;

    if (isWeekly && (anTab === 'trips' || anTab === 'branches')) {
      const weeklyPattern = [920, 945, 960, 935, 980, 1010, 995, 1025, 970, 990, 1020, 1040, 1015];
      return weeklyPattern.slice(0, barCount).map((v, i) => ({
        val: v,
        label: `W${i + 1}`,
        tooltip: `Week ${i + 1}: ${v.toLocaleString('en-IN')} trips`,
      }));
    }

    const items = [];
    const fromObj = range === 'custom' ? new Date(`${customFrom}T00:00:00`) : new Date('2026-09-14T00:00:00');

    for (let i = 0; i < barCount; i++) {
      let val = pattern[i % pattern.length];
      let barLabel = '';

      if (range === '7d') {
        const d = new Date('2026-09-08T00:00:00');
        d.setDate(d.getDate() + i);
        barLabel = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
        val = pattern[7 + (i % 7)] || val;
      } else if (range === 'custom') {
        if (effectiveDays <= 14) {
          const d = new Date(fromObj.getTime() + i * 86400000);
          barLabel = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
        } else {
          const step = (effectiveDays - 1) / (barCount - 1 || 1);
          const d = new Date(fromObj.getTime() + i * step * 86400000);
          barLabel = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
        }
      } else if (range === 'q') {
        barLabel = `W${i + 1}`;
      } else {
        const d = new Date('2026-08-16T00:00:00');
        d.setDate(d.getDate() + Math.round(i * (30 / barCount)));
        barLabel = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
      }

      let tooltip = '';
      if (anTab === 'trips' || anTab === 'branches') {
        tooltip = `${barLabel}: ${val.toLocaleString('en-IN')} trips`;
      } else if (anTab === 'gps') {
        tooltip = `${barLabel}: ${val}% fix rate`;
      } else if (anTab === 'vehicles') {
        tooltip = `${barLabel}: ${val}% fleet active`;
      } else if (anTab === 'drivers') {
        tooltip = `${barLabel}: ${val} drivers present`;
      } else if (anTab === 'irregularities') {
        tooltip = `${barLabel}: ${val} irregularities recorded`;
      }

      items.push({ val, label: barLabel, tooltip });
    }

    return items;
  }, [anTab, range, effectiveDays, customFrom]);

  // Compute Definition for current tab & range
  const ad = useMemo(() => {
    const F = factor;
    const D = effectiveDays;

    switch (anTab) {
      case 'trips': {
        const totalTrips = Math.max(1, Math.round(4218 * F));
        const busTrips = Math.max(1, Math.round(3796 * F));
        const nonBusTrips = Math.max(0, totalTrips - busTrips);
        const avgClose = D <= 7 ? '18.9 h' : D >= 90 ? '19.8 h' : '19.4 h';
        const pctChange = F >= 1 ? `+${(6.2 + (F - 1) * 2).toFixed(1)}%` : `+${(4.8 + (1 - F) * 1.5).toFixed(1)}%`;

        return {
          chartTitle: 'Trips per day',
          chartSub: `Business vs non-business, ${periodInfo.chartSubSuffix}`,
          kpis: [
            ['Total trips', totalTrips.toLocaleString('en-IN'), `${pctChange} vs previous period`, 'var(--kr-green-700)'],
            ['Business', busTrips.toLocaleString('en-IN'), `${Math.round((busTrips / totalTrips) * 100)}% of movements`, 'var(--text-muted)'],
            ['Non-business', nonBusTrips.toLocaleString('en-IN'), 'Maintenance 41% · Empty return 38%', 'var(--text-muted)'],
            ['Avg close time', avgClose, 'Target under 24 h', 'var(--kr-green-700)'],
          ],
          series: seriesData,
          tableTitle: 'Trips by client',
          rows: [
            ['INOX Air Products', Math.max(1, Math.round(1204 * F)).toLocaleString('en-IN'), '29% · 3 branches'],
            ['Linde India', Math.max(1, Math.round(892 * F)).toLocaleString('en-IN'), '21%'],
            ['Air Liquide India', Math.max(1, Math.round(648 * F)).toLocaleString('en-IN'), '15%'],
            ['Bharat Petroleum', Math.max(1, Math.round(571 * F)).toLocaleString('en-IN'), '14%'],
            ['Hindustan Petroleum', Math.max(1, Math.round(402 * F)).toLocaleString('en-IN'), '10%'],
            ['Suguna Foods', Math.max(1, Math.round(301 * F)).toLocaleString('en-IN'), '7% · on hold'],
            ['Non-business', nonBusTrips.toLocaleString('en-IN'), 'All reasons recorded'],
          ],
        };
      }

      case 'gps': {
        const fixRate = D <= 7 ? '97.4%' : D >= 90 ? '96.2%' : '96.8%';
        const diversions = Math.max(1, Math.round(23 * F));
        const majorDiv = Math.max(1, Math.round(4 * F));
        const idleEv = Math.max(3, Math.round(318 * F));
        const radiusBr = Math.max(1, Math.round(11 * F));

        return {
          chartTitle: 'GPS fix rate',
          chartSub: `Percentage of enroute minutes with a valid fix, ${periodInfo.chartSubSuffix}`,
          kpis: [
            ['Fix rate', fixRate, 'Target 98%', '#7A4300'],
            ['Route diversions', String(diversions), `${majorDiv} over 20 km`, '#7A4300'],
            ['Idle events', idleEv.toLocaleString('en-IN'), 'Over 15 min', 'var(--text-muted)'],
            ['Radius breaches', String(radiusBr), 'Without an open trip', 'var(--kr-red-700)'],
          ],
          series: seriesData,
          tableTitle: 'Vehicles with recurring GPS gaps',
          rows: [
            ['TS 09 UB 3344', `${Math.max(1, Math.round(6 * F))} gaps`, 'Hyderabad · device check due'],
            ['TN 34 CV 0921', `${Math.max(1, Math.round(4 * F))} gaps`, 'Namakkal · weak signal on NH44'],
            ['MH 04 GH 6612', `${Math.max(1, Math.round(2 * F))} gaps`, 'Mumbai'],
            ['KA 01 AJ 9087', `${Math.max(1, Math.round(1 * F))} gap${Math.round(1 * F) > 1 ? 's' : ''}`, 'Bengaluru'],
          ],
        };
      }

      case 'vehicles': {
        const util = D <= 7 ? '63%' : D >= 90 ? '59%' : '61%';
        const hiddenKm = Math.max(12, Math.round(412 * F));
        const idleVeh = Math.max(70, Math.round(88 * (1 + (1 - F) * 0.04)));

        return {
          chartTitle: 'Fleet utilisation',
          chartSub: `Running vehicles as a share of fleet, ${periodInfo.chartSubSuffix}`,
          kpis: [
            ['Utilisation', util, '+3 pts vs benchmark', 'var(--kr-green-700)'],
            ['Idle · no driver', String(idleVeh), '12% of fleet', '#7A4300'],
            ['Avg km per vehicle', '312', 'per running day', 'var(--text-muted)'],
            ['Hidden km', hiddenKm.toLocaleString('en-IN'), 'Unaccounted in this period', 'var(--kr-red-700)'],
          ],
          series: seriesData,
          tableTitle: 'Most idle vehicles',
          rows: [
            ['TN 28 AR 7712', `${Math.min(D, Math.max(1, Math.round(11 * F)))} days`, 'Chennai HO · no driver'],
            ['TN 28 AQ 8890', `${Math.min(D, Math.max(1, Math.round(9 * F)))} days`, 'Chennai HO · no business'],
            ['TN 34 CQ 5566', `${Math.min(D, Math.max(1, Math.round(7 * F)))} days`, 'Namakkal · maintenance'],
            ['TN 28 BD 2209', `${Math.min(D, Math.max(1, Math.round(6 * F)))} days`, 'Chennai HO'],
          ],
        };
      }

      case 'drivers': {
        const contAbs = Math.max(1, Math.round(7 * F));
        return {
          chartTitle: 'Driver attendance',
          chartSub: `Present drivers per day across branches, ${periodInfo.chartSubSuffix}`,
          kpis: [
            ['Utilisation', '81%', 'Present days with a trip', 'var(--text-muted)'],
            ['Present today', '512', 'of 604 active drivers', 'var(--kr-green-700)'],
            ['Continuous absence', String(contAbs), '5+ days', 'var(--kr-red-700)'],
            ['Pending approvals', String(pendingDrivers), 'Supporting drivers', '#7A4300'],
          ],
          series: seriesData,
          tableTitle: 'Attention',
          rows: [
            ['Ravi T.', `${Math.min(D, Math.max(1, Math.round(26 * F)))} absent`, 'Chennai HO · inactive'],
            ['Ibrahim K.', `${Math.min(D, Math.max(1, Math.round(8 * F)))} absent`, 'Namakkal · supporting'],
            ['Basavaraj H.', `${Math.min(D, Math.max(1, Math.round(6 * F)))} absent`, 'Bengaluru'],
            ['Karthik R.', `${Math.min(D, Math.max(1, Math.round(4 * F)))} absent`, 'Chennai HO'],
          ],
        };
      }

      case 'branches': {
        return {
          chartTitle: 'Trips by branch',
          chartSub: `Daily trips, all branches stacked, ${periodInfo.chartSubSuffix}`,
          kpis: [
            ['Active branches', '5', 'Visakhapatnam inactive', 'var(--text-muted)'],
            ['Top branch', 'Chennai HO', `${Math.round(132 * (D <= 7 ? 1.05 : 1))} trips today`, 'var(--kr-green-700)'],
            ['Exceptions per 100 trips', '2.1', 'Hyderabad highest at 3.8', '#7A4300'],
            ['Attendance complete', '2 of 5', 'Chennai, Mumbai', '#7A4300'],
          ],
          series: seriesData,
          tableTitle: 'Branch scorecard',
          rows: [
            ['Chennai HO', Math.max(1, Math.round(132 * (D <= 7 ? 7 : D))).toLocaleString('en-IN'), '1.6 exc/100 · attendance complete'],
            ['Namakkal', Math.max(1, Math.round(93 * (D <= 7 ? 7 : D))).toLocaleString('en-IN'), '2.2 exc/100 · 1 day missing'],
            ['Hyderabad', Math.max(1, Math.round(58 * (D <= 7 ? 7 : D))).toLocaleString('en-IN'), '3.8 exc/100 · GPS failures'],
            ['Bengaluru', Math.max(1, Math.round(39 * (D <= 7 ? 7 : D))).toLocaleString('en-IN'), '2.4 exc/100 · 3 days missing'],
            ['Mumbai', Math.max(1, Math.round(24 * (D <= 7 ? 7 : D))).toLocaleString('en-IN'), '0.8 exc/100'],
          ],
        };
      }

      case 'irregularities': {
        const hiddenKm = Math.max(10, Math.round(412 * F));
        const alertsCount = Math.max(1, Math.round(6 * F));
        const leakEst = (1.2 * F).toFixed(1);
        const missTrips = Math.max(1, Math.round(9 * F));
        const gpsExc = Math.max(1, Math.round(31 * F));
        const bothFail = Math.max(1, Math.round(4 * F));
        const totLeak = (3.4 * F).toFixed(1);
        const recLeak = (2.1 * F).toFixed(1);

        return {
          chartTitle: 'Irregularities per day',
          chartSub: `Hidden km, missing trips, GPS exceptions, billing leakage, ${periodInfo.chartSubSuffix}`,
          kpis: [
            ['Hidden km', hiddenKm.toLocaleString('en-IN'), `${alertsCount} alerts · ₹${leakEst} L est. leakage`, 'var(--kr-red-700)'],
            ['Missing trips', String(missTrips), 'Movement without trip record', 'var(--kr-red-700)'],
            ['GPS exceptions', String(gpsExc), `${bothFail} with both sources failed`, '#7A4300'],
            ['Billing leakage', `₹${totLeak} L`, `Recovered ₹${recLeak} L after review`, '#7A4300'],
          ],
          series: seriesData,
          tableTitle: 'Leakage by cause',
          rows: [
            ['Route diversion', `₹${Math.max(0.1, 0.5 * F).toFixed(1)} L`, `${Math.max(1, Math.round(23 * F))} events`],
            ['Hidden kilometres', `₹${Math.max(0.1, 1.2 * F).toFixed(1)} L`, '55 km avg gap'],
            ['Unrecorded movement', `₹${Math.max(0.1, 0.9 * F).toFixed(1)} L`, `${Math.max(1, Math.round(9 * F))} radius breaches`],
            ['Variance over 5%', `₹${Math.max(0.1, 0.8 * F).toFixed(1)} L`, `${Math.max(1, Math.round(14 * F))} trips`],
          ],
        };
      }

      default:
        return null;
    }
  }, [anTab, factor, effectiveDays, periodInfo, seriesData, pendingDrivers]);

  const mx = Math.max(...(ad.series.map((s) => s.val) || [1]));

  const handleFromChange = (newFrom) => {
    if (setCustomFrom) setCustomFrom(newFrom);
    if (customTo && newFrom > customTo && setCustomTo) {
      setCustomTo(newFrom);
    }
  };

  const handleToChange = (newTo) => {
    if (setCustomTo) setCustomTo(newTo);
    if (customFrom && newTo < customFrom && setCustomFrom) {
      setCustomFrom(newTo);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 6 Category Tabs */}
      <div style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '4px 18px', overflowX: 'auto' }}>
        <div className="tms-tabrow" style={{ display: 'flex', gap: '8px' }}>
          {anTabs.map((t) => (
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
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {ranges.map((r) => {
              const on = range === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    padding: '0 16px',
                    height: '36px',
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
                    transition: 'all 0.15s ease',
                    boxShadow: on ? '0 2px 4px rgba(5,150,105,0.2)' : 'none',
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Active Period Summary Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              background: '#f1f5f9',
              border: '1px solid var(--border-default)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-heading)',
            }}
          >
            <Clock size={14} style={{ color: 'var(--color-brand)' }} />
            <span>Active Range: <strong>{periodInfo.summary}</strong></span>
          </div>
        </div>

        {/* Custom Date Range Panel (Expanded when Custom is selected) */}
        {range === 'custom' && (
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} style={{ color: 'var(--color-brand)' }} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: 'var(--text-heading)' }}>
                  Select Custom Date Period
                </span>
              </div>

              {/* Quick Presets */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginRight: '2px' }}>
                  Presets:
                </span>
                {presetOptions.map((p) => {
                  const isCur = customFrom === p.from && customTo === p.to;
                  return (
                    <button
                      key={p.label}
                      onClick={() => {
                        if (setCustomFrom) setCustomFrom(p.from);
                        if (setCustomTo) setCustomTo(p.to);
                      }}
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-pill)',
                        border: `1px solid ${isCur ? 'var(--color-brand)' : 'var(--border-default)'}`,
                        background: isCur ? 'var(--color-brand-tint, #ecfdf5)' : '#f8fafc',
                        color: isCur ? 'var(--color-brand)' : 'var(--text-muted)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inputs Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px', flex: '1 1 200px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>From Date</span>
                </label>
                <input
                  type="date"
                  value={customFrom}
                  max={customTo}
                  onChange={(e) => handleFromChange(e.target.value)}
                  style={{
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: '1px solid var(--border-strong, #cbd5e1)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    background: '#fff',
                    color: 'var(--text-heading)',
                    boxSizing: 'border-box',
                    width: '100%',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '22px', color: 'var(--text-muted)' }}>
                <ArrowRight size={18} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px', flex: '1 1 200px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>To Date</span>
                </label>
                <input
                  type="date"
                  value={customTo}
                  min={customFrom}
                  onChange={(e) => handleToChange(e.target.value)}
                  style={{
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: '1px solid var(--border-strong, #cbd5e1)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    background: '#fff',
                    color: 'var(--text-heading)',
                    boxSizing: 'border-box',
                    width: '100%',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', flex: '2 1 240px', minHeight: '40px', paddingTop: '22px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 14px',
                    borderRadius: 'var(--radius-md, 8px)',
                    background: 'var(--color-brand-tint, #ecfdf5)',
                    border: '1px solid var(--color-brand, #059669)',
                    color: 'var(--kr-green-900, #064e3b)',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  <Clock size={15} style={{ color: 'var(--color-brand)' }} />
                  <span>
                    {effectiveDays} day{effectiveDays !== 1 ? 's' : ''} duration ({formatShortDate(customFrom)} – {formatShortDate(customTo)})
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
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
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
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
        <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '18px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
              {ad.chartTitle}
            </h2>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-brand)', background: 'var(--color-brand-tint, #ecfdf5)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-brand)' }}>
              {periodInfo.badgeText}
            </span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>{ad.chartSub}</div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '180px', borderBottom: '1px solid var(--border-default)', paddingTop: '10px' }}>
            {ad.series.map((item, i) => {
              const h = Math.max(8, Math.round((item.val / mx) * 100)) + '%';
              const isLast = i === ad.series.length - 1;
              const color = isLast ? 'var(--kr-green-800)' : 'var(--color-brand)';

              return (
                <div
                  key={i}
                  title={item.tooltip}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    height: '100%',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      height: h,
                      background: color,
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.3s ease-out, background 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                  />
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 600 }}>
            <span>{periodInfo.startLabel}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{periodInfo.midLabel}</span>
            <span>{periodInfo.endLabel}</span>
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
                borderBottom: idx === ad.rows.length - 1 ? 'none' : '1px solid var(--border-default)',
                fontSize: '14px',
                alignItems: 'center',
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
