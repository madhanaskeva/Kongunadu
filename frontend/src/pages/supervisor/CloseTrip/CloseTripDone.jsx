import React from 'react';
import { Button } from '../components/ds';

export const CloseTripDone = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column", padding: "24px 20px 40px" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "var(--color-brand)", display: "grid", placeItems: "center", margin: "8px auto 0" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
        </div>
        <h2 style={{ margin: "20px 0 4px", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em", color: "var(--text-heading)" }}>Trip closed</h2>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", color: "var(--text-brand)", fontWeight: "700" }}>{v.sel.number}</div>
        <p style={{ margin: "8px 0 20px", fontSize: "15px" }}>{v.sel.vehicleNumber} is now available for the next assignment.</p>
      </div>
      <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", background: "var(--surface-muted)", fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Triple distance verification
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", textAlign: "center" }}>
          <div style={{ padding: "14px 8px", borderRight: "1px solid var(--border-default)" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Fixed route</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "22px", color: "var(--text-heading)" }}>{v.verify.fixed}</div>
          </div>
          <div style={{ padding: "14px 8px", borderRight: "1px solid var(--border-default)" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>GPS</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "22px", color: "var(--text-heading)" }}>{v.verify.gps}</div>
          </div>
          <div style={{ padding: "14px 8px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Odometer</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "22px", color: "var(--text-heading)" }}>{v.verify.odo}</div>
          </div>
        </div>
        <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border-default)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", background: v.verify.bg, color: v.verify.fg }}>
          <span>Variance {v.verify.pct} against fixed route</span>
          <strong style={{ fontFamily: "var(--font-display)", fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{v.verify.label}</strong>
        </div>
      </div>
      <div style={{ marginTop: "auto", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <Button size="lg" fullWidth={true} onClick={v.goHome} style={v.bigBtn}>Back to home</Button>
      </div>
    </div>
  </>
);

export default CloseTripDone;
