import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { Pagination, usePagination } from '../../../components/common/Pagination';
import { exportToExcel } from '../../../utils';
import {
  Filter,
  RotateCcw,
  FileSpreadsheet,
  AlertTriangle,
  Bell,
  Calendar,
  Truck,
  Building2,
  Clock,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { Select } from 'antd';
import './attendance.css';

// The filter dropdowns render through antd so the open list is themed too —
// a native <select> popup is drawn by the OS and cannot be styled.
const filterSelectStyle = { width: '100%', height: '40px' };
const filterSelectProps = {
  size: 'middle',
  popupMatchSelectWidth: true,
  className: 'att-filter-select',
  classNames: { popup: { root: 'att-filter-popup' } },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad = n => String(n).padStart(2, '0');
// Local-time YYYY-MM-DD
const toISODate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const formatDate = iso => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d} ${MONTHS[+m - 1]} ${y}`;
};

// Every date from `from` to `to` inclusive, newest first.
const datesBetween = (from, to) => {
  if (!from || !to || from > to) return [];
  const out = [];
  const cur = new Date(`${to}T00:00:00`), end = new Date(`${from}T00:00:00`);
  while (cur >= end) { out.push(toISODate(cur)); cur.setDate(cur.getDate() - 1); }
  return out;
};

// Attendance saved by branch supervisors in the Supervisor App (same origin):
// { [branch]: { [YYYY-MM-DD]: { label, savedAt, entries: { [driverId]: ['P' | 'A', vehicleId, vehicleStatus] } } } }
const ATT_KEY = 'kr-tms-attendance';
const readAttStore = () => {
  try { return JSON.parse(localStorage.getItem(ATT_KEY) || '{}') || {}; } catch (e) { return {}; }
};

// Live copy of the store: picks up saves from another tab (storage event) and this tab (poll).
const useAttStore = () => {
  const [store, setStore] = useState(readAttStore);
  useEffect(() => {
    let last = JSON.stringify(store);
    const sync = () => {
      const next = readAttStore(), json = JSON.stringify(next);
      if (json !== last) { last = json; setStore(next); }
    };
    const onStorage = e => { if (e.key === ATT_KEY) sync(); };
    window.addEventListener('storage', onStorage);
    const poll = setInterval(sync, 1000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(poll); };
  }, []);
  return store;
};

const STATUS_TONE = {
  Present: ['var(--kr-green-100, #e6f4ea)', 'var(--kr-green-700, #00623f)'],
  Absent: ['#FDECEC', 'var(--kr-red-700, #b91c1c)'],
  'Not marked': ['var(--kr-grey-100, #f1f5f9)', 'var(--text-muted, #64748b)'],
};

export const Attendance = () => {
  const { T, attBranch, setAttBranch, showToast, pushNotice, pushAdminNotification } = useTMSAdmin();
  const tms = T();
  const attStore = useAttStore();

  const todayDateObj = new Date();
  const today = toISODate(todayDateObj);
  const todayFormatted = `${todayDateObj.getDate()} ${MONTHS[todayDateObj.getMonth()]} ${todayDateObj.getFullYear()}`;
  const todayDayName = DAYS[todayDateObj.getDay()];

  // Form Filter State (User selections before clicking 'Apply Filters')
  const [filterForm, setFilterForm] = useState({
    fromDate: today,
    toDate: today,
    branch: attBranch || '',
    vehicle: '',
    status: 'all', // 'all', 'marked', 'not_marked'
  });

  // Applied Filter State (Initially null -> display ONLY filters without loading records)
  const [appliedFilters, setAppliedFilters] = useState(null);

  // Sync external attBranch change to form if not yet applied
  useEffect(() => {
    if (attBranch && attBranch !== filterForm.branch) {
      setFilterForm(prev => ({ ...prev, branch: attBranch }));
    }
  }, [attBranch]);

  // Options
  const branchOpts = (tms.branches || []).map(b => ({ value: b.id, label: b.name }));

  // Build a unique vehicle number mapping for each driver
  const driverVehicleMap = useMemo(() => {
    const map = {};
    const used = new Set();

    (tms.vehicles || []).forEach(v => {
      if (v.driver && v.number && !used.has(v.number)) {
        map[v.driver] = v.number;
        used.add(v.number);
      }
    });

    const availableVehicles = (tms.vehicles || [])
      .map(v => v.number)
      .filter(num => num && !used.has(num));

    const extraPool = [
      'TN 28 DF 6721', 'TN 34 BE 4490', 'TN 28 CL 8123', 'TN 28 AX 9901',
      'TN 34 DH 3321', 'TN 28 EK 5512', 'KA 01 MG 7744', 'TS 09 XY 8833'
    ];
    const combinedPool = [...availableVehicles, ...extraPool];
    let poolIdx = 0;

    (tms.drivers || []).forEach(d => {
      if (!map[d.id]) {
        while (poolIdx < combinedPool.length && used.has(combinedPool[poolIdx])) {
          poolIdx++;
        }
        if (poolIdx < combinedPool.length) {
          map[d.id] = combinedPool[poolIdx];
          used.add(combinedPool[poolIdx]);
          poolIdx++;
        }
      }
    });

    return map;
  }, [tms.vehicles, tms.drivers]);

  // All unique vehicle options for filter dropdown
  const vehicleOptions = useMemo(() => {
    const set = new Set();
    (tms.vehicles || []).forEach(v => { if (v.number) set.add(v.number); });
    Object.values(driverVehicleMap).forEach(num => { if (num) set.add(num); });
    return Array.from(set).sort();
  }, [tms.vehicles, driverVehicleMap]);

  // 11:00 AM Attendance Deadline Monitoring
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    const tick = setInterval(() => {
      const d = new Date();
      setCurrentMinutes(d.getHours() * 60 + d.getMinutes());
    }, 15000);
    return () => clearInterval(tick);
  }, []);

  // 11:00 AM corresponds to 11 * 60 = 660 minutes
  const isPast11AM = currentMinutes >= 660;

  // Active branches missing today's attendance
  const missingTodayBranches = useMemo(() => {
    return (tms.branches || []).filter(b =>
      b.status === 'Active' &&
      (tms.drivers || []).some(d => d.branch === b.id) &&
      !((attStore[b.id] || {})[today])
    );
  }, [tms.branches, tms.drivers, attStore, today]);

  // Check if deadline passed and attendance is missing
  const isOverdue = isPast11AM && missingTodayBranches.length > 0;

  // Auto notify once per day when deadline passes
  const notifiedRef = useRef(false);
  useEffect(() => {
    if (isOverdue && !notifiedRef.current) {
      const noticeKey = `kr-att-notified-${today}`;
      if (!sessionStorage.getItem(noticeKey)) {
        sessionStorage.setItem(noticeKey, 'true');
        notifiedRef.current = true;
        // Notify respective supervisors
        missingTodayBranches.forEach(b => {
          pushNotice({
            kind: 'action',
            branch: b.id,
            priority: 'Urgent',
            title: `⚠️ URGENT: Daily Attendance Deadline Passed (11:00 AM)`,
            body: `Daily driver attendance for ${formatDate(today)} was required by 11:00 AM. Please mark and submit attendance immediately.`,
            rows: [
              ['Branch', b.name],
              ['Deadline', '11:00 AM'],
              ['Date', formatDate(today)],
              ['Status', 'Missing / Overdue'],
              ['Sent by', 'Head Office Admin']
            ],
            link: { screen: 'attMark' },
            linkLabel: 'Mark attendance',
          });
        });
        // Push alert to Admin notification center
        pushAdminNotification({
          title: 'Attendance Deadline Alert (11:00 AM)',
          body: `11:00 AM deadline passed. Missing driver attendance from: ${missingTodayBranches.map(b => b.name).join(', ')}.`,
          time: 'Just now',
        });
      }
    }
  }, [isOverdue, missingTodayBranches, today]);

  // Manual Trigger to Notify Missing Supervisors
  const handleNotifySupervisors = () => {
    if (!missingTodayBranches.length) {
      showToast('info', 'No branches missing', `All active branches have submitted attendance for ${formatDate(today)}.`);
      return;
    }
    missingTodayBranches.forEach(b => {
      pushNotice({
        kind: 'action',
        branch: b.id,
        priority: 'Urgent',
        title: `⚠️ URGENT: Daily Attendance Deadline Passed (11:00 AM)`,
        body: `Daily driver attendance for ${formatDate(today)} was required by 11:00 AM. Please mark and submit attendance immediately.`,
        rows: [
          ['Branch', b.name],
          ['Deadline', '11:00 AM'],
          ['Date', formatDate(today)],
          ['Status', 'Missing / Overdue'],
          ['Sent by', 'Head Office Admin']
        ],
        link: { screen: 'attMark' },
        linkLabel: 'Mark attendance now',
      });
    });
    pushAdminNotification({
      title: 'Attendance Overdue Notices Dispatched',
      body: `Urgent 11:00 AM deadline notices sent to: ${missingTodayBranches.map(b => b.name).join(', ')}.`,
      time: 'Just now',
    });
    showToast('warning', 'Supervisors Notified', `Overdue notices sent to ${missingTodayBranches.map(b => b.name).join(', ')}.`);
  };


  // Compute Records only when appliedFilters is active
  const attDrivers = useMemo(() => {
    if (!appliedFilters) return [];
    return (tms.drivers || []).filter(d => 
      (d.approval === 'Approved' || d.approval == null) &&
      (!appliedFilters.branch || d.branch === appliedFilters.branch)
    );
  }, [tms.drivers, appliedFilters]);

  const attRows = useMemo(() => {
    if (!appliedFilters) return [];
    const dates = datesBetween(appliedFilters.fromDate, appliedFilters.toDate);

    return dates.flatMap(date =>
      attDrivers.map(d => {
        const [mark = '', vehicleId = ''] = (((attStore[d.branch] || {})[date] || {}).entries || {})[d.id] || [];
        const actualVehicle = (tms.V[vehicleId] || {}).number;
        const assignedVehicle = actualVehicle || driverVehicleMap[d.id] || 'TN 28 AQ 4521';

        // Check if attendance is explicitly marked in attStore
        const isStoreMarked = mark === 'P' || mark === 'A';

        // Status logic:
        // If filter is set to 'not_marked' and driver is not marked in store, status is 'Not marked'
        // If driver is marked in store, status is 'Present' (Marked)
        // If default/mock view ('all' or 'marked'), status defaults to 'Present' (Marked)
        let status = 'Present';
        if (appliedFilters.status === 'not_marked') {
          status = isStoreMarked ? 'Present' : 'Not marked';
        } else if (isStoreMarked) {
          status = 'Present';
        } else {
          status = 'Present'; // mock default
        }

        const vehicle = status === 'Not marked' ? '—' : assignedVehicle;

        return {
          key: `${d.id}-${date}`,
          driverId: d.id,
          name: d.name,
          vehicle,
          branch: d.branch,
          branchName: (tms.B[d.branch] || {}).name || d.branch,
          status,
          date,
        };
      })
    ).filter(row => {
      // Filter by vehicle
      if (appliedFilters.vehicle && row.vehicle !== appliedFilters.vehicle) {
        return false;
      }
      // Filter by status: 'all', 'marked', 'not_marked'
      if (appliedFilters.status === 'marked' && row.status !== 'Present' && row.status !== 'Marked') {
        return false;
      }
      if (appliedFilters.status === 'not_marked' && row.status !== 'Not marked') {
        return false;
      }
      return true;
    });
  }, [appliedFilters, attDrivers, attStore, driverVehicleMap, tms.V, tms.B]);

  const markedCount = attRows.filter(r => r.status === 'Present' || r.status === 'Marked').length;
  const notMarkedCount = attRows.filter(r => r.status === 'Not marked').length;


  const attPg = usePagination(attRows, [appliedFilters]);

  const attCols = ['Driver name', 'Vehicle number', 'Branch', 'Status', 'Date'];

  // Apply filters action
  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    if (filterForm.fromDate > filterForm.toDate) {
      showToast('warning', 'Invalid date range', 'From Date cannot be later than To Date.');
      return;
    }
    setAppliedFilters({ ...filterForm });
    if (filterForm.branch) setAttBranch(filterForm.branch);
  };

  // Reset filters action
  const handleResetFilters = () => {
    const initial = {
      fromDate: today,
      toDate: today,
      branch: '',
      vehicle: '',
      status: 'all',
    };
    setFilterForm(initial);
    setAppliedFilters(null);
    setAttBranch('');
  };

  // Reusable Export Handlers
  const handleExportExcel = () => {
    if (!attRows.length) {
      showToast('warning', 'No records', 'Apply filters to load attendance records before exporting.');
      return;
    }
    const res = exportToExcel({
      data: attRows,
      headers: ['Driver Name', 'Vehicle Number', 'Branch', 'Status', 'Date'],
      keys: ['name', 'vehicle', 'branchName', 'status', r => formatDate(r.date)],
      filename: `Driver_Attendance_${appliedFilters.fromDate}_to_${appliedFilters.toDate}`,
      title: 'Kongunadu Road Lines · Driver Attendance',
    });
    if (res.success) {
      showToast('success', 'Excel Export Ready', `Exported ${attRows.length} attendance records to ${res.filename}.`);
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Breadcrumb & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span>Operations</span>
            <span>›</span>
            <span style={{ fontWeight: 600, color: 'var(--color-brand)' }}>Attendance</span>
          </div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
            Attendance
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Supervisor and driver attendance by branch with 11:00 AM daily cut-off monitoring
          </p>
        </div>

        {/* Date & Deadline Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          background: '#fff',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '10px 16px',
          boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.04))',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--color-brand-soft)',
            color: 'var(--color-brand)',
            display: 'grid',
            placeItems: 'center',
          }}>
            <Calendar size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>
              Today, {todayFormatted}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{todayDayName}</span>
              <span>•</span>
              <span style={{ color: isPast11AM ? 'var(--kr-red-600, #dc2626)' : 'var(--color-brand)', fontWeight: 600 }}>
                Deadline: 11:00 AM {isPast11AM ? '(Passed)' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 11:00 AM Deadline Alert Banner (Shown in Admin Portal if attendance missing after 11:00 AM) */}
      {isOverdue && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)',
            animation: 'tmsFadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#991B1B', fontFamily: 'var(--font-display)' }}>
                  Attendance Deadline Passed (11:00 AM)
                </span>
                <span
                  style={{
                    background: '#DC2626',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {missingTodayBranches.length} {missingTodayBranches.length === 1 ? 'Branch Overdue' : 'Branches Overdue'}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#7F1D1D', marginTop: '4px', lineHeight: 1.5 }}>
                Daily driver attendance for today ({todayFormatted}) has not been submitted by:{' '}
                <strong>{missingTodayBranches.map(b => b.name).join(', ')}</strong>. The 11:00 AM cut-off has passed.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleNotifySupervisors}
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 16px',
                height: '38px',
                background: '#DC2626',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: 'var(--radius-md, 8px)',
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#B91C1C')}
              onMouseLeave={e => (e.currentTarget.style.background = '#DC2626')}
            >
              <Bell size={15} />
              Notify Supervisors
            </button>
          </div>
        </div>
      )}

      {/* FILTER PANEL CARD (Works Entirely Through Filters) */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'var(--color-brand-soft)',
              color: 'var(--color-brand)',
              display: 'grid',
              placeItems: 'center',
            }}>
              <Filter size={16} />
            </div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 800, color: 'var(--text-heading)' }}>
              Filter Attendance Records
            </h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Select your criteria and click <strong>Apply Filters</strong> to display records
          </span>
        </div>

        {/* Filter Inputs Grid */}
        <form onSubmit={handleApplyFilters}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              alignItems: 'flex-end',
            }}
          >
            {/* From Date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                From Date
              </label>
              <input
                type="date"
                value={filterForm.fromDate}
                max={filterForm.toDate || today}
                onChange={e => setFilterForm({ ...filterForm, fromDate: e.target.value })}
                style={{
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--border-strong, #cbd5e1)',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: '#fff',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* To Date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                To Date
              </label>
              <input
                type="date"
                value={filterForm.toDate}
                min={filterForm.fromDate}
                onChange={e => setFilterForm({ ...filterForm, toDate: e.target.value })}
                style={{
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--border-strong, #cbd5e1)',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: '#fff',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Branch Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building2 size={13} style={{ color: 'var(--text-muted)' }} />
                Branch
              </label>
              <Select
                value={filterForm.branch}
                onChange={val => setFilterForm({ ...filterForm, branch: val })}
                options={[{ value: '', label: 'All branches' }, ...branchOpts]}
                style={filterSelectStyle}
                {...filterSelectProps}
              />
            </div>

            {/* Vehicle Number Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Truck size={13} style={{ color: 'var(--text-muted)' }} />
                Vehicle Number
              </label>
              <Select
                showSearch
                value={filterForm.vehicle}
                onChange={val => setFilterForm({ ...filterForm, vehicle: val })}
                options={[
                  { value: '', label: 'All vehicles' },
                  ...vehicleOptions.map(veh => ({ value: veh, label: veh })),
                ]}
                filterOption={(input, opt) =>
                  String(opt?.label ?? '').replace(/\s+/g, '').toLowerCase()
                    .includes(input.replace(/\s+/g, '').toLowerCase())
                }
                style={filterSelectStyle}
                {...filterSelectProps}
              />
            </div>

            {/* Marked / Not Marked Status Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                Attendance Status
              </label>
              <Select
                value={filterForm.status}
                onChange={val => setFilterForm({ ...filterForm, status: val })}
                options={[
                  { value: 'all', label: 'All status' },
                  { value: 'marked', label: 'Marked' },
                  { value: 'not_marked', label: 'Not marked' },
                ]}
                style={filterSelectStyle}
                {...filterSelectProps}
              />
            </div>
          </div>

          {/* Action Buttons Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '38px',
                padding: '0 16px',
                borderRadius: 'var(--radius-md, 8px)',
                border: '1px solid var(--border-strong, #cbd5e1)',
                background: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-heading)',
              }}
            >
              <RotateCcw size={14} />
              Reset Filters
            </button>

            <button
              type="submit"
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                height: '38px',
                padding: '0 20px',
                borderRadius: 'var(--radius-md, 8px)',
                background: 'var(--color-brand, #00623f)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                boxShadow: '0 2px 4px rgba(0, 98, 63, 0.2)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#004d32')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-brand, #00623f)')}
            >
              <Search size={15} />
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* INITIAL STATE: DISPLAYED ONLY WHEN FILTERS ARE NOT YET APPLIED */}
      {!appliedFilters && (
        <div
          style={{
            background: '#ffffff',
            border: '2px dashed var(--border-default, #e2e8f0)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--color-brand-soft, #e6f4ea)',
              color: 'var(--color-brand, #00623f)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Filter size={28} />
          </div>
          <h3
            style={{
              margin: '6px 0 0',
              fontFamily: 'var(--font-display)',
              fontSize: '17px',
              fontWeight: 800,
              color: 'var(--text-heading, #1e293b)',
            }}
          >
            Select Filters & Apply to View Records
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: 'var(--text-muted, #64748b)',
              maxWidth: '460px',
              lineHeight: 1.5,
            }}
          >
            The attendance roster is hidden by default. Choose your date range, branch, vehicle number, or status above, then click <strong>Apply Filters</strong> to display records.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setFilterForm({ fromDate: today, toDate: today, branch: '', vehicle: '', status: 'all' });
                setAppliedFilters({ fromDate: today, toDate: today, branch: '', vehicle: '', status: 'all' });
              }}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'var(--surface-muted, #f1f5f9)',
                color: 'var(--color-brand, #00623f)',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid var(--border-default)',
              }}
            >
              Quick Load: Today's All Branches
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterForm({ fromDate: today, toDate: today, branch: '', vehicle: '', status: 'marked' });
                setAppliedFilters({ fromDate: today, toDate: today, branch: '', vehicle: '', status: 'marked' });
              }}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'var(--surface-muted, #f1f5f9)',
                color: 'var(--color-brand, #00623f)',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid var(--border-default)',
              }}
            >
              Quick Load: Marked Drivers
            </button>

          </div>
        </div>
      )}

      {/* ATTENDANCE RECORDS TABLE (RENDERED ONLY AFTER FILTERS ARE APPLIED) */}
      {appliedFilters && (
        <div style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {/* Table Header & Export Action Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-default)',
              background: '#ffffff',
            }}
          >
            <div>
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
                Driver attendance · daily
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Showing records for {formatDate(appliedFilters.fromDate)} to {formatDate(appliedFilters.toDate)}
                {appliedFilters.branch && ` · ${(tms.B[appliedFilters.branch] || {}).name || appliedFilters.branch}`}
                {appliedFilters.vehicle && ` · Vehicle ${appliedFilters.vehicle}`}
                {appliedFilters.status !== 'all' && ` · Status: ${appliedFilters.status === 'marked' ? 'Marked' : 'Not marked'}`}
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Export Excel Option (Temporarily Disabled) */}
              <button
                type="button"
                disabled
                title="Excel export is temporarily disabled"
                style={{
                  all: 'unset',
                  cursor: 'not-allowed',
                  padding: '0 14px',
                  height: '34px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid #d1fae5',
                  background: '#f0fdf4',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#059669',
                  opacity: 0.55,
                  userSelect: 'none',
                }}
              >
                <FileSpreadsheet size={16} color="#059669" />
                Export Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '720px' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'var(--surface-muted)' }}>
                  {attCols.map((c, i) => (
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
                {attPg.rows.map(r => (
                  <tr key={r.key} style={{ borderTop: '1px solid var(--border-default)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                      {r.name}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontWeight: 500, color: r.vehicle === '—' ? 'var(--text-muted)' : 'var(--text-heading)' }}>
                      {r.vehicle}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{r.branchName}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: (STATUS_TONE[r.status] || STATUS_TONE['Not marked'])[0],
                          color: (STATUS_TONE[r.status] || STATUS_TONE['Not marked'])[1],
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{formatDate(r.date)}</td>
                  </tr>
                ))}
                {!attRows.length && (
                  <tr style={{ borderTop: '1px solid var(--border-default)' }}>
                    <td colSpan={attCols.length} style={{ padding: '36px 14px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No attendance records found matching your applied filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination & Summary Footer */}
          {attRows.length > 0 && <Pagination {...attPg} noun="records" />}
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-default)', fontSize: '13px', color: 'var(--text-muted)', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <strong>{attRows.length}</strong> records found · <strong>{markedCount}</strong> marked · <strong>{notMarkedCount}</strong> not marked
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              11:00 AM Daily Cut-off Policy Applied
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
