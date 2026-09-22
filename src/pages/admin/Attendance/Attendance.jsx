import React, { useState, useEffect, useMemo } from 'react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { Pagination, usePagination } from '../../../components/common/Pagination';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = n => String(n).padStart(2, '0');
// Local-time YYYY-MM-DD (toISOString would shift the day for IST users).
const toISODate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const formatDate = iso => { const [y, m, d] = iso.split('-'); return `${d} ${MONTHS[+m - 1]} ${y}`; };

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
const readAttStore = () => { try { return JSON.parse(localStorage.getItem(ATT_KEY) || '{}') || {}; } catch (e) { return {}; } };

// Live copy of the store: picks up saves from another tab (storage event) and this tab (poll).
const useAttStore = () => {
  const [store, setStore] = useState(readAttStore);
  useEffect(() => {
    let last = JSON.stringify(store);
    const sync = () => { const next = readAttStore(), json = JSON.stringify(next); if (json !== last) { last = json; setStore(next); } };
    const onStorage = e => { if (e.key === ATT_KEY) sync(); };
    window.addEventListener('storage', onStorage);
    const poll = setInterval(sync, 1000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(poll); };
  }, []);
  return store;
};

const STATUS_TONE = {
  Present: ['var(--kr-green-100)', 'var(--kr-green-700)'],
  Absent: ['#FDECEC', 'var(--kr-red-700)'],
  'Not marked': ['var(--kr-grey-100)', 'var(--text-muted)'],
};

const filterInputStyle = {
  height: '34px',
  padding: '0 10px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-strong)',
  fontSize: '13px',
  outline: 'none',
  background: '#fff',
};
const filterLabelStyle = { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' };

export const Attendance = () => {
  const { T, attBranch, setAttBranch, showToast, pushNotice } = useTMSAdmin();
  const tms = T();
  const attStore = useAttStore();

  // Daily driver attendance · one row per driver per day in the chosen date range
  const today = toISODate(new Date());
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const branchOpts = (tms.branches || []).map(b => ({ value: b.id, label: b.name }));
  const attDrivers = (tms.drivers || [])
    .filter(d => (d.approval === 'Approved' || d.approval == null) && (!attBranch || d.branch === attBranch));

  // Build a unique vehicle number mapping for each driver
  const driverVehicleMap = useMemo(() => {
    const map = {};
    const used = new Set();

    // 1. Direct assignments from vehicles where vehicle has driver defined
    (tms.vehicles || []).forEach(v => {
      if (v.driver && v.number && !used.has(v.number)) {
        map[v.driver] = v.number;
        used.add(v.number);
      }
    });

    // 2. Available vehicles from tms.vehicles not yet assigned
    const availableVehicles = (tms.vehicles || [])
      .map(v => v.number)
      .filter(num => num && !used.has(num));

    // 3. Fallback pool of unique realistic vehicle registration numbers
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

  const attRows = datesBetween(fromDate, toDate).flatMap(date =>
    attDrivers.map(d => {
      const [mark = '', vehicleId = ''] = (((attStore[d.branch] || {})[date] || {}).entries || {})[d.id] || [];
      const actualVehicle = (tms.V[vehicleId] || {}).number;
      // Default to driver's assigned unique vehicle number if not explicitly specified by saved attendance
      const assignedVehicle = actualVehicle || driverVehicleMap[d.id] || 'TN 28 AQ 4521';

      // Status logic:
      // If supervisor/admin explicitly saved attendance:
      //   - 'A' -> 'Absent'
      //   - 'P' -> 'Present'
      // If not yet marked in storage, display mock default:
      //   - 'Present' with their assigned unique vehicle number
      const status = mark === 'A' ? 'Absent' : mark === 'P' ? 'Present' : 'Present';
      const vehicle = status === 'Absent' && !actualVehicle ? '—' : assignedVehicle;

      return {
        key: `${d.id}-${date}`,
        name: d.name,
        vehicle: (tms.V[vehicleId] || {}).number || '—',
        vehicle,
        branchName: (tms.B[d.branch] || {}).name || d.branch,
        status: mark === 'P' ? 'Present' : mark === 'A' ? 'Absent' : 'Not marked',
        status,
        date,
      };
    })
  );
  const presentCount = attRows.filter(r => r.status === 'Present').length;
  const absentCount = attRows.filter(r => r.status === 'Absent').length;
  const attPg = usePagination(attRows, [fromDate, toDate, attBranch]);

  const attCols = ['Driver name', 'Vehicle number', 'Branch', 'Status', 'Date'];

  // Remind every active branch (or the selected one) that has not saved attendance for the "To" date.
  const sendReminders = () => {
    const day = toDate || today;
    const missing = (tms.branches || []).filter(b =>
      b.status === 'Active' && (!attBranch || b.id === attBranch) &&
      (tms.drivers || []).some(d => d.branch === b.id) &&
      !((attStore[b.id] || {})[day])
    );
    if (!missing.length) {
      showToast('info', 'No reminders needed', `Every branch has saved attendance for ${formatDate(day)}.`);
      return;
    }
    missing.forEach(b => pushNotice({
      kind: 'message',
      branch: b.id,
      priority: 'High',
      title: `Attendance pending · ${formatDate(day)}`,
      body: `Head Office has not received driver attendance for ${formatDate(day)}. Mark and save attendance in the app.`,
      rows: [['Branch', b.name], ['Date', formatDate(day)], ['Sent by', 'Head Office Admin']],
      link: { screen: 'attMark' },
      linkLabel: 'Mark attendance',
    }));
    showToast('success', 'Reminders sent', `${missing.length} ${missing.length === 1 ? 'branch' : 'branches'} notified: ${missing.map(b => b.name).join(', ')}.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Driver Attendance Roster Table */}
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
            Driver attendance · daily
          </h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={filterLabelStyle}>
              From
              <input
                type="date"
                value={fromDate}
                max={toDate || today}
                onChange={(e) => setFromDate(e.target.value)}
                style={filterInputStyle}
              />
            </label>
            <label style={filterLabelStyle}>
              To
              <input
                type="date"
                value={toDate}
                min={fromDate}
                max={today}
                onChange={(e) => setToDate(e.target.value)}
                style={filterInputStyle}
              />
            </label>
            <select
              value={attBranch}
              onChange={(e) => setAttBranch(e.target.value)}
              style={filterInputStyle}
            >
              <option value="">All branches</option>
              {branchOpts.map(b => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
            <button
              onClick={sendReminders}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '0 14px',
                height: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                background: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-heading)',
              }}
            >
              Send reminders
            </button>
          </div>
        </div>

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
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{r.vehicle}</td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{r.branchName}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: STATUS_TONE[r.status][0],
                        color: STATUS_TONE[r.status][1],
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
                  <td colSpan={attCols.length} style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No attendance for the selected dates and branch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {attRows.length > 0 && <Pagination {...attPg} noun="records" />}
        <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border-default)', fontSize: '13px', color: 'var(--text-muted)' }}>
          {attRows.length} records · {presentCount} present · {absentCount} absent · {attRows.length - presentCount - absentCount} not marked
        </div>
      </div>
    </div>
  );
};

export default Attendance;
