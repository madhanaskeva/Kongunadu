import React, { useMemo } from 'react';
import { Alert, Card, Col, DatePicker, Flex, Row, Segmented, Space, Statistic, Tabs, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { Calendar, ArrowRight, Clock, RotateCcw } from 'lucide-react';
import { ENROUTE_LABEL_LOWER } from '../../../utils/tripStatus';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toISODate = (d) => {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseISODate = (iso) => {
  if (!iso) return new Date();
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

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
  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);
  const todayISO = useMemo(() => toISODate(today), [today]);

  const defaultFrom30d = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
    return toISODate(d);
  }, [today]);

  const {
    anTab = 'trips',
    setAnTab,
    range = '30d',
    setRange,
    customFrom = defaultFrom30d,
    setCustomFrom,
    customTo = todayISO,
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
    { id: '14d', label: '14 days' },
    { id: '30d', label: '30 days' },
    { id: 'q', label: 'Quarter' },
    { id: 'custom', label: 'Custom' },
  ];

  const presetOptions = useMemo(() => {
    const d7 = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    const d14 = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 13);
    const d30 = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthLabel = `${MONTHS_SHORT[today.getMonth()]} ${today.getFullYear()}`;

    const qNum = Math.floor(today.getMonth() / 3) + 1;
    const qStart = new Date(today.getFullYear(), (qNum - 1) * 3, 1);
    const qEnd = new Date(today.getFullYear(), qNum * 3, 0);
    const qLabel = `Q${qNum} ${today.getFullYear()}`;

    return [
      { label: 'Last 7 Days', from: toISODate(d7), to: todayISO },
      { label: 'Last 14 Days', from: toISODate(d14), to: todayISO },
      { label: 'Last 30 Days', from: toISODate(d30), to: todayISO },
      { label: monthLabel, from: toISODate(monthStart), to: todayISO },
      { label: qLabel, from: toISODate(qStart), to: toISODate(qEnd) },
    ];
  }, [today, todayISO]);

  // Resolve days, factor, and date labels
  const { effectiveDays, factor, periodInfo, startDateObj, endDateObj } = useMemo(() => {
    let days = 30;
    let sObj = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
    let eObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let badgeText = '30 Days';
    let chartSubSuffix = 'last 30 days';

    if (range === '7d') {
      days = 7;
      sObj = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
      eObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      badgeText = '7 Days';
      chartSubSuffix = 'last 7 days';
    } else if (range === '14d') {
      days = 14;
      sObj = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 13);
      eObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      badgeText = '14 Days';
      chartSubSuffix = 'last 14 days';
    } else if (range === '30d') {
      days = 30;
      sObj = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
      eObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      badgeText = '30 Days';
      chartSubSuffix = 'last 30 days';
    } else if (range === 'q') {
      const qNum = Math.floor(today.getMonth() / 3) + 1;
      sObj = new Date(today.getFullYear(), (qNum - 1) * 3, 1);
      eObj = new Date(today.getFullYear(), qNum * 3, 0);
      const diffMs = eObj.getTime() - sObj.getTime();
      days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
      badgeText = `Quarter (Q${qNum})`;
      chartSubSuffix = `Q${qNum} ${today.getFullYear()} (${days} days)`;
    } else if (range === 'custom') {
      const fromObj = parseISODate(customFrom || toISODate(sObj));
      const toObj = parseISODate(customTo || todayISO);
      sObj = fromObj;
      eObj = toObj;
      const diffMs = toObj.getTime() - fromObj.getTime();
      const calcDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
      days = calcDays;
      badgeText = `${days} Day${days !== 1 ? 's' : ''}`;
      chartSubSuffix = `${formatShortDate(toISODate(fromObj))} – ${formatShortDate(toISODate(toObj))} (${days} days)`;
    }

    const sLabel = `${sObj.getDate()} ${MONTHS_SHORT[sObj.getMonth()]}`;
    const eLabel = `${eObj.getDate()} ${MONTHS_SHORT[eObj.getMonth()]}`;
    const midTime = sObj.getTime() + (eObj.getTime() - sObj.getTime()) / 2;
    const midObj = new Date(midTime);
    const mLabel = `${midObj.getDate()} ${MONTHS_SHORT[midObj.getMonth()]}`;

    const summary = `${formatFullDate(toISODate(sObj))} – ${formatFullDate(toISODate(eObj))} (${days} day${days !== 1 ? 's' : ''})`;

    const pInfo = {
      badgeText,
      chartSubSuffix,
      startLabel: sLabel,
      midLabel: mLabel,
      endLabel: eLabel,
      summary,
    };

    const f = days / 30;
    return { effectiveDays: days, factor: f, periodInfo: pInfo, startDateObj: sObj, endDateObj: eObj };
  }, [range, customFrom, customTo, today, todayISO]);

  // Generate series data for chart
  const seriesData = useMemo(() => {
    let barCount = 14;
    let isWeekly = false;

    if (range === '7d') {
      barCount = 7;
    } else if (range === '14d') {
      barCount = 14;
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
    const startTime = startDateObj.getTime();

    for (let i = 0; i < barCount; i++) {
      let val = pattern[i % pattern.length];
      let barLabel = '';

      if (effectiveDays <= 14) {
        const d = new Date(startTime + i * 86400000);
        barLabel = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
        if (range === '7d') {
          val = pattern[7 + (i % 7)] || val;
        }
      } else if (range === 'q') {
        barLabel = `W${i + 1}`;
      } else {
        const step = (effectiveDays - 1) / (barCount - 1 || 1);
        const d = new Date(startTime + i * step * 86400000);
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
  }, [anTab, range, effectiveDays, startDateObj, endDateObj]);

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
          chartSub: `Percentage of ${ENROUTE_LABEL_LOWER} minutes with a valid fix, ${periodInfo.chartSubSuffix}`,
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

  const handleRangeClick = (rId) => {
    setRange(rId);
    if (rId === '7d') {
      const f = toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6));
      if (setCustomFrom) setCustomFrom(f);
      if (setCustomTo) setCustomTo(todayISO);
    } else if (rId === '14d') {
      const f = toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 13));
      if (setCustomFrom) setCustomFrom(f);
      if (setCustomTo) setCustomTo(todayISO);
    } else if (rId === '30d') {
      const f = toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29));
      if (setCustomFrom) setCustomFrom(f);
      if (setCustomTo) setCustomTo(todayISO);
    } else if (rId === 'q') {
      const qNum = Math.floor(today.getMonth() / 3) + 1;
      const qStart = new Date(today.getFullYear(), (qNum - 1) * 3, 1);
      const qEnd = new Date(today.getFullYear(), qNum * 3, 0);
      if (setCustomFrom) setCustomFrom(toISODate(qStart));
      if (setCustomTo) setCustomTo(toISODate(qEnd));
    }
  };

  return (
    <Flex vertical gap={20}>
      {/* 6 Category Tabs */}
      <Card styles={{ body: { padding: '0 18px' } }}>
        <Tabs
          activeKey={anTab}
          onChange={setAnTab}
          items={anTabs.map((t) => ({ key: t.value, label: t.label }))}
        />
      </Card>

      {/* Date Range Options */}
      <Flex vertical gap={12}>
        <Flex justify="space-between" gap={12} wrap align="center">
          <Segmented
            value={range}
            onChange={handleRangeClick}
            options={ranges.map((r) => ({ value: r.id, label: r.label }))}
            style={{ maxWidth: '100%', overflowX: 'auto' }}
          />

          {/* Active Period Summary Badge */}
          <Tag icon={<Clock size={14} style={{ color: 'var(--color-brand)', marginInlineEnd: 6, verticalAlign: '-2px' }} />} style={{ padding: '4px 12px', borderRadius: 999, marginInlineEnd: 0, whiteSpace: 'normal' }}>
            Active Range: <strong>{periodInfo.summary}</strong>
          </Tag>
        </Flex>

        {/* Custom Date Range Panel (Expanded when Custom is selected) */}
        {range === 'custom' && (
          <Card
            size="small"
            title={
              <Space size={8}>
                <Calendar size={18} style={{ color: 'var(--color-brand)', verticalAlign: '-3px' }} />
                <span>Select Custom Date Period</span>
              </Space>
            }
          >
            {/* Quick Presets */}
            {/* <Space size={6} wrap>
              <Typography.Text type="secondary" strong style={{ fontSize: 11, textTransform: 'uppercase' }}>Presets:</Typography.Text>
              {presetOptions.map((p) => {
                const isCur = customFrom === p.from && customTo === p.to;
                return (
                  <Button
                    key={p.label}
                    size="small"
                    shape="round"
                    type={isCur ? 'primary' : 'default'}
                    ghost={isCur}
                    onClick={() => {
                      if (setCustomFrom) setCustomFrom(p.from);
                      if (setCustomTo) setCustomTo(p.to);
                    }}
                  >
                    {p.label}
                  </Button>
                );
              })}
            </Space> */}

            {/* Inputs Row */}
            <Row gutter={[16, 12]} align="bottom">
              <Col xs={24} sm={11} lg={6}>
                <Typography.Text strong style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>From Date</Typography.Text>
                <DatePicker
                  value={customFrom ? dayjs(customFrom, 'YYYY-MM-DD') : null}
                  format="DD-MM-YYYY"
                  allowClear={false}
                  disabledDate={(d) => !!customTo && d.isAfter(dayjs(customTo, 'YYYY-MM-DD'), 'day')}
                  onChange={(d) => handleFromChange(d ? d.format('YYYY-MM-DD') : '')}
                  style={{ width: '100%' }}
                />
              </Col>

              <Col xs={0} sm={2} lg={1}>
                <Flex justify="center" align="center" style={{ height: 42, color: 'var(--text-muted)' }}>
                  <ArrowRight size={18} />
                </Flex>
              </Col>

              <Col xs={24} sm={11} lg={6}>
                <Typography.Text strong style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>To Date</Typography.Text>
                <DatePicker
                  value={customTo ? dayjs(customTo, 'YYYY-MM-DD') : null}
                  format="DD-MM-YYYY"
                  allowClear={false}
                  disabledDate={(d) => !!customFrom && d.isBefore(dayjs(customFrom, 'YYYY-MM-DD'), 'day')}
                  onChange={(d) => handleToChange(d ? d.format('YYYY-MM-DD') : '')}
                  style={{ width: '100%' }}
                />
              </Col>

              <Col xs={24} lg={11}>
                <Alert
                  type="success"
                  showIcon
                  icon={<Clock size={15} />}
                  title={`${effectiveDays} day${effectiveDays !== 1 ? 's' : ''} duration (${formatShortDate(customFrom)} – ${formatShortDate(customTo)})`}
                />
              </Col>
            </Row>
          </Card>
        )}
      </Flex>

      {/* 4 KPIs */}
      <Row gutter={[16, 16]}>
        {ad.kpis.map(([label, value, sub, color], idx) => (
          <Col key={idx} xs={24} sm={12} lg={6}>
            <Card className="tms-kpi" style={{ height: '100%', '--kpi': color === 'var(--text-muted)' ? 'var(--color-brand)' : color }}>
              <Statistic
                title={<span className="tms-kpi-label">{label}</span>}
                value={value}
                formatter={(v) => v}
              />
              <Typography.Text style={{ display: 'block', fontSize: 13, color, marginTop: 6 }}>{sub}</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Chart & Table */}
      <Row gutter={[24, 24]}>
        {/* Chart Column */}
        <Col xs={24} lg={12}>
          <Card
            title={ad.chartTitle}
            extra={<Tag color="success" style={{ marginInlineEnd: 0 }}>{periodInfo.badgeText}</Tag>}
            style={{ height: '100%' }}
          >
            <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>{ad.chartSub}</Typography.Paragraph>

            <Flex align="flex-end" gap={6} style={{ height: 180, borderBottom: '1px solid var(--border-default)', paddingTop: 10 }}>
              {ad.series.map((item, i) => {
                const h = Math.max(8, Math.round((item.val / mx) * 100)) + '%';
                const isLast = i === ad.series.length - 1;
                const color = isLast ? 'var(--kr-green-800)' : 'var(--color-brand)';

                return (
                  <Tooltip key={i} title={item.tooltip}>
                    <Flex vertical justify="flex-end" style={{ flex: 1, height: '100%', cursor: 'pointer' }}>
                      <div
                        style={{
                          height: h,
                          background: color,
                          borderRadius: '3px 3px 0 0',
                          transition: 'height 0.3s ease-out, background 0.2s',
                        }}
                      />
                    </Flex>
                  </Tooltip>
                );
              })}
            </Flex>

            <Flex justify="space-between" style={{ marginTop: 8 }}>
              <Typography.Text type="secondary" strong style={{ fontSize: 12 }}>{periodInfo.startLabel}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>{periodInfo.midLabel}</Typography.Text>
              <Typography.Text type="secondary" strong style={{ fontSize: 12 }}>{periodInfo.endLabel}</Typography.Text>
            </Flex>
          </Card>
        </Col>

        {/* Breakdown Table Column */}
        <Col xs={24} lg={12}>
          <Card title={ad.tableTitle} style={{ height: '100%' }} styles={{ body: { padding: 0 } }}>
            {ad.rows.map(([k, v, sub], idx) => (
              <Flex
                key={idx}
                justify="space-between"
                align="center"
                gap={12}
                style={{ padding: '11px 18px', borderBottom: idx === ad.rows.length - 1 ? 'none' : '1px solid var(--border-default)' }}
              >
                <Flex vertical style={{ minWidth: 0 }}>
                  <Typography.Text strong style={{ color: 'var(--text-heading)' }}>{k}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>{sub}</Typography.Text>
                </Flex>
                <Typography.Text strong style={{ fontSize: 16, color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                  {v}
                </Typography.Text>
              </Flex>
            ))}
          </Card>
        </Col>
      </Row>
    </Flex>
  );
};

export default Analytics;
