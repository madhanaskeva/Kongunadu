import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { exportToExcel } from '../../../utils';
import {
  Filter,
  RotateCcw,
  Download,
  AlertTriangle,
  Bell,
  Calendar,
  Truck,
  Building2,
  Clock,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { Alert, Avatar, Button, Card, Col, DatePicker, Divider, Empty, Flex, Row, Select, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import '../../../styles/attendance.css';
import { FILE_TRANSFER_ENABLED } from '../../../utils/featureFlags';

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
    window.addEventListener('kr-tms-attendance-changed', sync);
    const poll = setInterval(sync, 1000);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('kr-tms-attendance-changed', sync);
      clearInterval(poll);
    };
  }, []);
  return store;
};

// antd Tag preset colour per attendance status.
const STATUS_TONE = {
  Present: 'success',
  Absent: 'error',
  'Not marked': 'default',
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
        const branchKey = d.branch;
        const branchObj = tms.B[d.branch] || {};
        const branchName = branchObj.name || d.branch;
        const branchStore = attStore[branchKey] || (branchObj.name ? attStore[branchObj.name] : null) || {};
        const dayData = branchStore[date] || {};
        const dayEntries = dayData.entries || {};
        const entry = dayEntries[d.id] || dayEntries[d.name];

        let mark = '';
        let vehicleId = '';
        if (Array.isArray(entry)) {
          mark = entry[0] || '';
          vehicleId = entry[1] || '';
        } else if (entry && typeof entry === 'object') {
          mark = entry.mark || entry.status || '';
          vehicleId = entry.vehicleId || entry.vehicle || '';
        } else if (typeof entry === 'string') {
          mark = entry;
        }

        // Live connection from app side:
        // Only show 'Present' if the driver was actually marked 'P' / 'Present' in the app side.
        // If marked 'A' / 'Absent', show 'Absent'.
        // If the particular driver is NOT marked in the app side, show 'Not marked'.
        let status = 'Not marked';
        if (mark === 'P' || mark === 'Present') {
          status = 'Present';
        } else if (mark === 'A' || mark === 'Absent') {
          status = 'Absent';
        } else {
          status = 'Not marked';
        }

        const actualVehicle = vehicleId ? (tms.V[vehicleId] || {}).number || vehicleId : '';
        const assignedVehicle = actualVehicle || driverVehicleMap[d.id] || (tms.V[d.vehicle] || {}).number || '—';
        const vehicle = (status === 'Not marked' || status === 'Absent') ? '—' : assignedVehicle;

        return {
          key: `${d.id}-${date}`,
          driverId: d.id,
          name: d.name,
          vehicle,
          branch: d.branch,
          branchName,
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


  // Table paging: back to page 1 whenever the applied filters or page size change.
  const [attPage, setAttPage] = useState(1);
  const [attPageSize, setAttPageSize] = useState(10);
  useEffect(() => { setAttPage(1); }, [appliedFilters, attPageSize]);

  const nowrap = { whiteSpace: 'nowrap' };
  const attColumns = [
    { title: 'Driver name', dataIndex: 'name', key: 'name', onCell: () => ({ style: nowrap }), render: v => <Typography.Text strong style={{ color: 'var(--text-heading)' }}>{v}</Typography.Text> },
    { title: 'Vehicle number', dataIndex: 'vehicle', key: 'vehicle', onCell: () => ({ style: nowrap }), render: v => <Typography.Text type={v === '—' ? 'secondary' : undefined} style={{ fontWeight: 500 }}>{v}</Typography.Text> },
    { title: 'Branch', dataIndex: 'branchName', key: 'branchName', onCell: () => ({ style: nowrap }) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: v => <Tag color={STATUS_TONE[v] || STATUS_TONE['Not marked']}>{v}</Tag> },
    { title: 'Date', dataIndex: 'date', key: 'date', onCell: () => ({ style: nowrap }), render: v => formatDate(v) },
  ];

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
      title: 'Driver Attendance',
    });
    if (res.success) {
      showToast('success', 'Excel Export Ready', `Exported ${attRows.length} attendance records to ${res.filename}.`);
    } else {
      showToast('warning', 'Export failed', res.message || 'Could not create the Excel file.');
    }
  };


  return (
    <Flex vertical gap={20}>
      {/* Page Header */}
      <Flex justify="space-between" align="flex-start" wrap gap={16}>
        <div>
          <Typography.Title level={2} style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em' }}>
            Attendance
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ margin: '4px 0 0', fontSize: 13 }}>
            Supervisor and driver attendance by branch with 11:00 AM daily cut-off monitoring
          </Typography.Paragraph>
        </div>

        {/* Date & Deadline Card */}
        <Card size="small" styles={{ body: { padding: '10px 16px' } }}>
          <Flex align="center" gap={14}>
            <Avatar shape="square" size={36} style={{ background: 'var(--color-brand-soft)', color: 'var(--color-brand)' }} icon={<Calendar size={18} />} />
            <div>
              <Typography.Text strong style={{ display: 'block', fontSize: 13 }}>
                Today, {todayFormatted}
              </Typography.Text>
              <Space size={6} style={{ fontSize: 11 }}>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>{todayDayName}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>•</Typography.Text>
                <Typography.Text strong type={isPast11AM ? 'danger' : undefined} style={{ fontSize: 11, color: isPast11AM ? undefined : 'var(--color-brand)' }}>
                  Deadline: 11:00 AM {isPast11AM ? '(Passed)' : ''}
                </Typography.Text>
              </Space>
            </div>
          </Flex>
        </Card>
      </Flex>

      {/* 11:00 AM Deadline Alert Banner (Shown in Admin Portal if attendance missing after 11:00 AM) */}
      {isOverdue && (
        <Alert
          type="error"
          showIcon
          icon={<AlertTriangle size={22} />}
          title={
            <Space size={10} wrap>
              <Typography.Text strong style={{ fontSize: 15 }}>Attendance Deadline Passed (11:00 AM)</Typography.Text>
              <Tag color="error" variant="solid" style={{ textTransform: 'uppercase', marginInlineEnd: 0 }}>
                {missingTodayBranches.length} {missingTodayBranches.length === 1 ? 'Branch Overdue' : 'Branches Overdue'}
              </Tag>
            </Space>
          }
          description={
            <>
              Daily driver attendance for today ({todayFormatted}) has not been submitted by:{' '}
              <strong>{missingTodayBranches.map(b => b.name).join(', ')}</strong>. The 11:00 AM cut-off has passed.
            </>
          }
          action={
            <Button type="primary" danger icon={<Bell size={15} />} onClick={handleNotifySupervisors}>
              Notify Supervisors
            </Button>
          }
          style={{ flexWrap: 'wrap', rowGap: 12 }}
        />
      )}

      {/* FILTER PANEL CARD (Works Entirely Through Filters) */}
      <Card
        title={
          <Space size={8}>
            <Avatar shape="square" size={28} style={{ background: 'var(--color-brand-soft)', color: 'var(--color-brand)' }} icon={<Filter size={16} />} />
            <span>Filter Attendance Records</span>
          </Space>
        }
        extra={
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Select your criteria and click <strong>Apply Filters</strong> to display records
          </Typography.Text>
        }
        styles={{ header: { flexWrap: 'wrap', gap: 8, paddingBlock: 10 } }}
      >
        {/* Filter Inputs Grid */}
        <form onSubmit={handleApplyFilters}>
          <Row gutter={[14, 14]} align="bottom">
            {/* From Date */}
            <Col xs={24} sm={12} lg={8} xl={4}>
              <Typography.Text strong style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
                <Calendar size={13} style={{ color: 'var(--text-muted)', marginRight: 4, verticalAlign: '-2px' }} />
                From Date
              </Typography.Text>
              <DatePicker
                value={filterForm.fromDate ? dayjs(filterForm.fromDate, 'YYYY-MM-DD') : null}
                format="DD-MM-YYYY"
                allowClear={false}
                disabledDate={d => d.isAfter(dayjs(filterForm.toDate || today, 'YYYY-MM-DD'), 'day')}
                onChange={d => setFilterForm({ ...filterForm, fromDate: d ? d.format('YYYY-MM-DD') : '' })}
                style={{ width: '100%' }}
              />
            </Col>

            {/* To Date */}
            <Col xs={24} sm={12} lg={8} xl={4}>
              <Typography.Text strong style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
                <Calendar size={13} style={{ color: 'var(--text-muted)', marginRight: 4, verticalAlign: '-2px' }} />
                To Date
              </Typography.Text>
              <DatePicker
                value={filterForm.toDate ? dayjs(filterForm.toDate, 'YYYY-MM-DD') : null}
                format="DD-MM-YYYY"
                allowClear={false}
                disabledDate={d => !!filterForm.fromDate && d.isBefore(dayjs(filterForm.fromDate, 'YYYY-MM-DD'), 'day')}
                onChange={d => setFilterForm({ ...filterForm, toDate: d ? d.format('YYYY-MM-DD') : '' })}
                style={{ width: '100%' }}
              />
            </Col>

            {/* Branch Filter */}
            <Col xs={24} sm={12} lg={8} xl={5}>
              <Typography.Text strong style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
                <Building2 size={13} style={{ color: 'var(--text-muted)', marginRight: 4, verticalAlign: '-2px' }} />
                Branch
              </Typography.Text>
              <Select
                value={filterForm.branch}
                onChange={val => setFilterForm({ ...filterForm, branch: val })}
                options={[{ value: '', label: 'All branches' }, ...branchOpts]}
                style={{ width: '100%' }}
              />
            </Col>

            {/* Vehicle Number Dropdown */}
            <Col xs={24} sm={12} lg={12} xl={6}>
              <Typography.Text strong style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
                <Truck size={13} style={{ color: 'var(--text-muted)', marginRight: 4, verticalAlign: '-2px' }} />
                Vehicle Number
              </Typography.Text>
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
                listHeight={264}
                classNames={{ popup: { root: 'att-filter-popup' } }}
                style={{ width: '100%' }}
              />
            </Col>

            {/* Marked / Not Marked Status Filter */}
            <Col xs={24} sm={24} lg={12} xl={5}>
              <Typography.Text strong style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
                <Clock size={13} style={{ color: 'var(--text-muted)', marginRight: 4, verticalAlign: '-2px' }} />
                Attendance Status
              </Typography.Text>
              <Select
                value={filterForm.status}
                onChange={val => setFilterForm({ ...filterForm, status: val })}
                options={[
                  { value: 'all', label: 'All status' },
                  { value: 'marked', label: 'Marked' },
                  { value: 'not_marked', label: 'Not marked' },
                ]}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>

          <Divider style={{ margin: '16px 0' }} />

          {/* Action Buttons Row */}
          <Flex justify="flex-end" align="center" gap={10} wrap>
            <Button htmlType="button" icon={<RotateCcw size={14} />} onClick={handleResetFilters}>
              Reset Filters
            </Button>
            <Button type="primary" htmlType="submit" icon={<Search size={15} />}>
              Apply Filters
            </Button>
          </Flex>
        </form>
      </Card>

      {/* INITIAL STATE: DISPLAYED ONLY WHEN FILTERS ARE NOT YET APPLIED */}
      {!appliedFilters && (
        <Card style={{ borderStyle: 'dashed', borderWidth: 2 }} styles={{ body: { padding: '48px 24px' } }}>
          <Empty
            image={<Avatar size={56} style={{ background: 'var(--color-brand-soft)', color: 'var(--color-brand)' }} icon={<Filter size={28} />} />}
            styles={{ image: { height: 'auto', marginBottom: 12 } }}
            description={
              <Flex vertical align="center" gap={6}>
                <Typography.Title level={4} style={{ margin: 0, fontSize: 17 }}>
                  Select Filters & Apply to View Records
                </Typography.Title>
                <Typography.Paragraph type="secondary" style={{ margin: 0, fontSize: 13, maxWidth: 460 }}>
                  The attendance roster is hidden by default. Choose your date range, branch, vehicle number, or status above, then click <strong>Apply Filters</strong> to display records.
                </Typography.Paragraph>
              </Flex>
            }
          >
            <Flex gap={8} wrap justify="center" style={{ marginTop: 12 }}>
              <Button
                shape="round"
                size="small"
                onClick={() => {
                  setFilterForm({ fromDate: today, toDate: today, branch: '', vehicle: '', status: 'all' });
                  setAppliedFilters({ fromDate: today, toDate: today, branch: '', vehicle: '', status: 'all' });
                }}
              >
                Quick Load: Today's All Branches
              </Button>
              <Button
                shape="round"
                size="small"
                onClick={() => {
                  setFilterForm({ fromDate: today, toDate: today, branch: '', vehicle: '', status: 'marked' });
                  setAppliedFilters({ fromDate: today, toDate: today, branch: '', vehicle: '', status: 'marked' });
                }}
              >
                Quick Load: Marked Drivers
              </Button>
            </Flex>
          </Empty>
        </Card>
      )}

      {/* ATTENDANCE RECORDS TABLE (RENDERED ONLY AFTER FILTERS ARE APPLIED) */}
      {appliedFilters && (
        <Card
          title="Driver attendance · daily"
          extra={
            /* Export Excel: the filtered records shown below */
            <Button
              icon={<Download size={17} />}
              onClick={FILE_TRANSFER_ENABLED ? handleExportExcel : undefined}
              title="Download these attendance records as an Excel workbook"
            >
              Export Excel
            </Button>
          }
          styles={{ header: { flexWrap: 'wrap', gap: 8, paddingBlock: 10 }, body: { padding: 0 } }}
        >
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: 0, padding: '10px 18px' }}>
            Showing records for {formatDate(appliedFilters.fromDate)} to {formatDate(appliedFilters.toDate)}
            {appliedFilters.branch && ` · ${(tms.B[appliedFilters.branch] || {}).name || appliedFilters.branch}`}
            {appliedFilters.vehicle && ` · Vehicle ${appliedFilters.vehicle}`}
            {appliedFilters.status !== 'all' && ` · Status: ${appliedFilters.status === 'marked' ? 'Marked' : 'Not marked'}`}
          </Typography.Paragraph>

          {/* Table */}
          <Table
            columns={attColumns}
            dataSource={attRows}
            rowKey="key"
            tableLayout="auto"
            scroll={{ x: 720 }}
            locale={{ emptyText: 'No attendance records found matching your applied filter criteria.' }}
            pagination={attRows.length > 0 ? {
              current: attPage,
              pageSize: attPageSize,
              onChange: (p, size) => {
                if (size !== attPageSize) setAttPageSize(size);
                else setAttPage(p);
              },
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (t, [a, b]) => `Showing ${a} to ${b} of ${t} records`,
            } : false}
          />

          {/* Summary Footer */}
          <Flex
            justify="space-between"
            align="center"
            wrap
            gap={10}
            style={{ padding: '12px 18px', borderTop: '1px solid var(--border-default)', background: 'var(--surface-muted)' }}
          >
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              <strong>{attRows.length}</strong> records found · <strong>{markedCount}</strong> marked · <strong>{notMarkedCount}</strong> not marked
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              11:00 AM Daily Cut-off Policy Applied
            </Typography.Text>
          </Flex>
        </Card>
      )}
    </Flex>
  );
};

export default Attendance;
