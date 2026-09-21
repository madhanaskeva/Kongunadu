import React from 'react';

export const MonthlyAttendance = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column", padding: "16px", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "18px", color: "var(--text-heading)" }}>September 2026</div>
        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>11 of 14 days complete</span>
      </div>
      <div style={{ padding: "12px 14px", background: "var(--color-hazard-soft)", borderRadius: "var(--radius-md)", fontSize: "14px", color: "#7A4300" }}>
        <strong>3 days missing.</strong>
        {' '}2, 7 and 9 September have unmarked drivers. Missing attendance is reported to the admin after 48 hours.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "6px" }}>
        {(v.weekdays || []).map((w, wIdx) => (
          <React.Fragment key={wIdx}>
            <div style={{ textAlign: "center", fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", color: "var(--text-muted)", padding: "4px 0" }}>
              {w}
            </div>
          </React.Fragment>
        ))}
        {(v.monthCells || []).map((c, cIdx) => (
          <React.Fragment key={cIdx}>
            <button data-day={c.day} onClick={v.pickDay} style={{ all: "unset", cursor: c.cursor, aspectRatio: "1", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: "700", background: c.bg, color: c.fg, border: `2px solid ${c.border}` }}>
              {c.label}
            </button>
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "13px", color: "var(--text-muted)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "2px", background: "var(--color-brand)" }} />
          Complete
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "2px", background: "var(--color-hazard)" }} />
          Missing
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "2px", border: "2px solid var(--color-brand)", boxSizing: "border-box" }} />
          Today
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "2px", background: "var(--kr-grey-100)" }} />
          Upcoming
        </span>
      </div>
      <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "14px" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Month to date
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr)) 1fr", gap: "8px", marginTop: "10px", textAlign: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "22px", color: "var(--text-heading)" }}>86%</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Driver utilisation</div>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "22px", color: "var(--text-heading)" }}>1</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Continuous absence</div>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "22px", color: "var(--text-heading)" }}>4.2</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Idle days / vehicle</div>
          </div>
        </div>
      </div>
    </div>
  </>
);

export default MonthlyAttendance;
