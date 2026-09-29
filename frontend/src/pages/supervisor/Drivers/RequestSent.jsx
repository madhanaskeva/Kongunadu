import React from 'react';
import { Button } from '../components/ds';

export const RequestSent = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column", padding: "32px 24px 40px", textAlign: "center" }}>
      <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "var(--color-hazard-soft)", display: "grid", placeItems: "center", margin: "16px auto 0" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7A4300" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </div>
      <h2 style={{ margin: "20px 0 4px", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em", color: "var(--text-heading)" }}>Sent for approval</h2>
      <p style={{ margin: "8px 0 0", fontSize: "15px" }}>{v.rf.name} will appear in the driver list once Head Office approves the request. You will also get a notification.</p>
      <div role="status" aria-live="polite" style={{ marginTop: "20px", padding: "14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            Request status
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: "var(--radius-sm)", background: v.reqSent.bg, color: v.reqSent.fg }}>
            {v.reqSent.label}
          </span>
        </div>
        <div style={{ marginTop: "8px", fontSize: "14px", lineHeight: "1.5", color: "var(--text-body)" }}>{v.reqSent.note}</div>
        <div style={{ marginTop: "4px", fontSize: "12px", color: "var(--text-muted)" }}>{v.reqSent.when}</div>
      </div>
      <div style={{ marginTop: "auto" }}><Button size="lg" fullWidth={true} onClick={v.goHome} style={v.bigBtn}>Back to home</Button></div>
    </div>
  </>
);

export default RequestSent;
