import React from 'react';
import { Button } from '../components/ds';

export const DailyAttendance = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "18px", color: "var(--text-heading)" }}>14 September</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{v.attendanceMarked} of {v.attendanceTotal} drivers marked</div>
          </div>
          {v.showAttMonth ? (
            <>
              <button onClick={v.goAttMonth} style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-brand)", padding: "10px 0" }}>
                Month view →
              </button>
            </>
          ) : null}
        </div>
        <div style={{ height: "6px", background: "var(--kr-grey-100)", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: v.attendancePct, background: "var(--color-brand)", transition: "width var(--dur-base) var(--ease-out)" }} />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
            Drivers
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {(v.attDrivers || []).map((d, dIdx) => (
              <React.Fragment key={dIdx}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ flex: "1", minWidth: "0" }}>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-heading)" }}>{d.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{d.sub}</div>
                  </div>
                  <button data-id={d.id} data-v="P" onClick={v.markDriver} style={{ all: "unset", cursor: "pointer", minWidth: "44px", height: "44px", padding: "0 12px", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "13px", border: `2px solid ${d.pBorder}`, background: d.pBg, color: d.pFg }}>
                    P
                  </button>
                  <button data-id={d.id} data-v="A" onClick={v.markDriver} style={{ all: "unset", cursor: "pointer", minWidth: "44px", height: "44px", padding: "0 12px", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "13px", border: `2px solid ${d.aBorder}`, background: d.aBg, color: d.aFg }}>
                    A
                  </button>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
            Vehicle status
          </div>
          <button onClick={v.goIdle} style={{ all: "unset", cursor: "pointer", boxSizing: "border-box", width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }} className="sv-h2">
            <div style={{ flex: "1", minWidth: "0" }}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-heading)" }}>{v.idleSummary}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Idle vehicles and reasons are recorded in Vehicle idle status.</div>
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-brand)" }}>
              Record →
            </span>
          </button>
        </div>
      </div>
      <div style={{ position: "sticky", bottom: "0", marginTop: "auto", padding: "12px 16px 40px", background: "#fff", borderTop: "1px solid var(--border-default)" }}>
        <Button size="lg" fullWidth={true} onClick={v.saveAttendance} style={v.bigBtn}>Save attendance</Button>
      </div>
    </div>
  </>
);

export default DailyAttendance;
