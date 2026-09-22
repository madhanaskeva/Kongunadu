import React from 'react';
import { Button, Input, Select } from '../components/ds';

export const VehicleIdleStatus = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "18px", color: "var(--text-heading)" }}>{v.todayDM} · {v.nowHM}</div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Mark each {v.branchName} vehicle that is standing idle and say why. Vehicles on a trip are running and cannot be marked.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
          <div style={{ padding: "12px", background: "var(--color-hazard-soft)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "12px", color: "#7A4300" }}>Idle</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "22px", color: "#7A4300" }}>{v.idleStats.idle}</div>
          </div>
          <div style={{ padding: "12px", background: "var(--st-enroute-bg)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "12px", color: "var(--st-enroute-fg)" }}>On trip</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "22px", color: "var(--st-enroute-fg)" }}>{v.idleStats.running}</div>
          </div>
          <div style={{ padding: "12px", background: "var(--surface-muted)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Ready</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "22px", color: "var(--text-heading)" }}>{v.idleStats.ready}</div>
          </div>
        </div>
        {v.idleHasErrors ? (
          <>
            <div role="alert" style={{ padding: "12px 14px", background: "var(--kr-red-50)", border: "1px solid var(--kr-red-100)", borderRadius: "var(--radius-md)", color: "var(--kr-red-800)", fontSize: "14px", fontWeight: "600" }}>
              {v.idleErrorText}
            </div>
          </>
        ) : null}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {(v.idleFilters || []).map((f, fIdx) => (
            <React.Fragment key={fIdx}>
              <button data-f={f.id} onClick={v.setIdleFilter} style={{ all: "unset", cursor: "pointer", padding: "8px 14px", minHeight: "36px", boxSizing: "border-box", borderRadius: "var(--radius-pill)", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", border: `2px solid ${f.border}`, background: f.bg, color: f.color }}>
                {f.label}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {(v.idleVehicles || []).map((v, vIdx) => (
            <React.Fragment key={vIdx}>
              <div style={{ padding: "12px 14px", border: "1px solid var(--border-default)", borderLeft: `4px solid ${v.edge}`, borderRadius: "var(--radius-md)", background: v.bg, display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ flex: "1", minWidth: "0" }}>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-heading)" }}>{v.number}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{v.sub}</div>
                  </div>
                  {v.running ? (
                    <>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: "var(--radius-sm)", background: "var(--st-enroute-bg)", color: "var(--st-enroute-fg)" }}>
                        On trip
                      </span>
                    </>
                  ) : null}
                  {v.canMark ? (
                    <>
                      <button data-id={v.id} onClick={v.toggleIdle} aria-pressed={v.on} style={{ all: "unset", cursor: "pointer", minWidth: "84px", height: "40px", padding: "0 12px", boxSizing: "border-box", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "13px", letterSpacing: "0.04em", textTransform: "uppercase", border: `2px solid ${v.tBorder}`, background: v.tBg, color: v.tFg }}>
                        {v.tLabel}
                      </button>
                    </>
                  ) : null}
                </div>
                {v.on ? (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <Select label="Idle reason" placeholder="Select reason" options={v.idleReasonOptions} value={v.reason} onChange={v.setReason} />
                      {v.reasonErr ? (
                        <>
                          <div style={{ fontSize: "13px", color: "var(--status-danger)", fontWeight: "600" }}>Select why this vehicle is idle.</div>
                        </>
                      ) : null}
                      {v.isOther ? (
                        <>
                          <Input label="Describe the reason" placeholder="e.g. Waiting for FC renewal at RTO" value={v.note} onChange={v.setNote} error={v.noteErr} />
                        </>
                      ) : null}
                      <div style={{ fontSize: "13px", fontWeight: "600", color: v.sinceColor }}>{v.sinceText}</div>
                    </div>
                  </>
                ) : null}
              </div>
            </React.Fragment>
          ))}
          {v.idleListEmpty ? (
            <>
              <div style={{ padding: "32px 20px", textAlign: "center", border: "2px dashed var(--border-default)", borderRadius: "var(--radius-lg)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "18px", color: "var(--text-heading)" }}>{v.idleEmptyTitle}</div>
                <p style={{ margin: "6px 0 0", fontSize: "14px", color: "var(--text-muted)" }}>{v.idleEmptyText}</p>
              </div>
            </>
          ) : null}
        </div>
      </div>
      <div style={{ position: "sticky", bottom: "0", marginTop: "auto", padding: "12px 16px 40px", background: "#fff", borderTop: "1px solid var(--border-default)" }}>
        <Button size="lg" fullWidth={true} onClick={v.saveIdle} style={v.bigBtn}>Save idle status</Button>
      </div>
    </div>
  </>
);

export default VehicleIdleStatus;
