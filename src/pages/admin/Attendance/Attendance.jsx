import React from 'react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';

export const Attendance = () => {
  const { T, attBranch, setAttBranch, showToast } = useTMSAdmin();
  const tms = T();

  // Branch calendar grid calculation
  const attBranches = (tms.branches || []).map(b => {
    const inactive = b.status !== 'Active';
    const missingMap = { B01: [], B02: [7], B03: [2, 9], B04: [2, 7, 9], B05: [] };
    const missing = missingMap[b.id] || [];
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = i + 1;
      return {
        title: `${b.name} · ${d} Sep`,
        bg: inactive ? 'var(--kr-grey-200)' : missing.includes(d) ? 'var(--kr-saffron-500)' : 'var(--color-brand)',
      };
    });
    return {
      name: b.name,
      days,
      summary: inactive ? 'Inactive' : missing.length ? `${missing.length} missing` : 'Complete',
      color: inactive ? 'var(--text-muted)' : missing.length ? '#7A4300' : 'var(--kr-green-700)',
    };
  });

  // Vehicle status bars
  const vehStatusBars = [
    ['Running · trip assigned', 281, 'var(--color-brand)'],
    ['Idle · no business', 296, 'var(--kr-green-100)'],
    ['Idle · no driver', 88, 'var(--kr-saffron-500)'],
    ['Maintenance · service', 57, 'var(--kr-grey-300)'],
  ].map(([label, count, color]) => ({
    label,
    count,
    color,
    pct: Math.round((count / 296) * 100) + '%',
  }));

  // Driver roster rows
  const branchOpts = (tms.branches || []).map(b => ({ value: b.id, label: b.name }));
  const attRows = (tms.drivers || [])
    .filter(d => (d.approval === 'Approved' || d.approval == null) && (!attBranch || d.branch === attBranch))
    .map(d => ({
      ...d,
      branchName: (tms.B[d.branch] || {}).name || d.branch,
      absentColor: d.absent >= 6 ? 'var(--kr-red-700)' : 'var(--text-body)',
      note: d.status === 'Inactive'
        ? 'Continuous absence · 26 days'
        : d.absent >= 6
        ? `Absent ${d.absent} days this month`
        : '—',
      noteColor: d.status === 'Inactive' ? 'var(--kr-red-700)' : d.absent >= 6 ? '#7A4300' : 'var(--text-muted)',
    }));

  const attCols = ['Driver', 'Branch', 'Type', 'Present', 'Absent', 'Utilisation', 'Note'];

  const sendReminders = () => {
    showToast('success', 'Reminders sent', '3 supervisors with missing days notified.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top 2 Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '24px' }}>
        {/* Branch Completion Tracker */}
        <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
              Completion tracker · September
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Day 14 of 30</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
            {attBranches.map((b, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 90px', gap: '12px', alignItems: 'center', fontSize: '14px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{b.name}</span>
                <span style={{ display: 'flex', gap: '2px' }}>
                  {b.days.map((d, dIdx) => (
                    <span
                      key={dIdx}
                      title={d.title}
                      style={{ flex: 1, height: '18px', borderRadius: '2px', background: d.bg }}
                    ></span>
                  ))}
                </span>
                <span style={{ textAlign: 'right', color: b.color, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {b.summary}
                </span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', paddingTop: '4px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', background: 'var(--color-brand)' }}></span>
                Complete
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', background: 'var(--kr-saffron-500)' }}></span>
                Missing
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', background: 'var(--kr-grey-200)' }}></span>
                Branch inactive
              </span>
            </div>
          </div>
        </section>

        {/* Vehicle Status Today */}
        <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '18px' }}>
          <h2
            style={{
              margin: '0 0 14px',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '15px',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color: 'var(--text-heading)',
            }}
          >
            Vehicle status · today
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {vehStatusBars.map((s, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 50px', gap: '12px', alignItems: 'center', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-heading)' }}>{s.label}</span>
                <span style={{ height: '14px', background: 'var(--kr-grey-100)', borderRadius: '2px', overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: s.pct, background: s.color }}></span>
                </span>
                <span style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-heading)' }}>{s.count}</span>
              </div>
            ))}
          </div>
          <p style={{ margin: '14px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Idle vehicles are split by cause so utilisation gaps (no business vs no driver) are visible per branch.
          </p>
        </section>
      </div>

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
            Driver attendance · month to date
          </h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={attBranch}
              onChange={(e) => setAttBranch(e.target.value)}
              style={{
                height: '34px',
                padding: '0 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                fontSize: '13px',
                outline: 'none',
                background: '#fff',
              }}
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
              {attRows.map(d => (
                <tr key={d.id} style={{ borderTop: '1px solid var(--border-default)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                    {d.name}
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{d.branchName}</td>
                  <td style={{ padding: '12px 14px' }}>{d.type}</td>
                  <td style={{ padding: '12px 14px' }}>{d.present}</td>
                  <td style={{ padding: '12px 14px', color: d.absentColor, fontWeight: d.absent >= 6 ? 700 : 400 }}>
                    {d.absent}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '80px', height: '8px', background: 'var(--kr-grey-100)', borderRadius: '2px', overflow: 'hidden' }}>
                        <span style={{ display: 'block', height: '100%', width: d.util, background: 'var(--color-brand)' }}></span>
                      </span>
                      {d.util}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: d.noteColor }}>
                    {d.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
