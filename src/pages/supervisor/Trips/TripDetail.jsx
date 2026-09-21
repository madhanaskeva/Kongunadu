import React from 'react';
import { Button } from '../components/ds';

export const TripDetail = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {v.resumeHere ? (
          <>
            <div role="status" style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "12px 14px", background: "var(--color-hazard-soft)", borderRadius: "var(--radius-md)", fontSize: "14px", lineHeight: "1.45", color: "#7A4300" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: "1px" }}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <span>
                <strong>Close this trip first.</strong>
                {' '}You go back to Open Trip for {v.resumeVehicle} as soon as it is closed.
              </span>
            </div>
          </>
        ) : null}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: "700", color: "var(--text-heading)" }}>{v.sel.number}</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: "var(--radius-sm)", background: v.sel.badgeBg, color: v.sel.badgeFg }}>
            {v.sel.badge}
          </span>
        </div>
        {v.selLongOpen ? (
          <>
            <div style={{ padding: "12px 14px", background: "var(--color-hazard-soft)", borderRadius: "var(--radius-md)", fontSize: "14px", color: "#7A4300" }}>
              <strong>Long open trip.</strong>
              {' '}Open for {v.sel.hoursOpen} h against an expected {v.sel.expectedHours} h. Close it if unloading is done, or the admin will be alerted.
            </div>
          </>
        ) : null}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
          <div style={{ padding: "12px", background: "var(--surface-muted)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Fixed route</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "20px", color: "var(--text-heading)" }}>{v.sel.fixedKm}</div>
          </div>
          <div style={{ padding: "12px", background: "var(--surface-muted)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>GPS so far</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "20px", color: "var(--text-heading)" }}>{v.sel.gpsKm}</div>
          </div>
          <div style={{ padding: "12px", background: "var(--surface-muted)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Start KM</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "20px", color: "var(--text-heading)" }}>{v.sel.startKm}</div>
          </div>
        </div>
        <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          {(v.selRows || []).map((r, rIdx) => (
            <React.Fragment key={rIdx}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "11px 14px", borderBottom: "1px solid var(--border-default)", fontSize: "14px" }}>
                <span style={{ color: "var(--text-muted)" }}>{r.k}</span>
                <span style={{ fontWeight: "700", color: "var(--text-heading)", textAlign: "right" }}>{r.v}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
            GPS timeline
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {(v.gpsLog || []).map((g, gIdx) => (
              <React.Fragment key={gIdx}>
                <div style={{ display: "grid", gridTemplateColumns: "48px 16px 1fr", gap: "8px", alignItems: "start", minHeight: "44px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)", paddingTop: "2px" }}>{g.t}</span>
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--color-brand)", marginTop: "5px", flex: "none" }} />
                    <span style={{ flex: "1", width: "2px", background: "var(--border-default)" }} />
                  </span>
                  <span style={{ fontSize: "14px", color: "var(--text-heading)", paddingBottom: "12px" }}>
                    {g.ev}
                    <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)" }}>{g.km} km · {g.speed} km/h</span>
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      <div style={{ position: "sticky", bottom: "0", marginTop: "auto", padding: "12px 16px 40px", background: "#fff", borderTop: "1px solid var(--border-default)" }}>
        <Button size="lg" fullWidth={true} onClick={v.closeFromDetail} style={v.bigBtn}>Close this trip</Button>
      </div>
    </div>
  </>
);

export default TripDetail;
