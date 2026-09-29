import React from 'react';
import { Button } from '../components/ds';

export const Offline = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column", padding: "32px 24px 40px" }}>
      <div style={{ width: "72px", height: "72px", borderRadius: "var(--radius-lg)", background: "var(--kr-red-50)", display: "grid", placeItems: "center" }}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--kr-red-600)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </div>
      <h2 style={{ margin: "24px 0 8px", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em", color: "var(--text-heading)" }}>
        Could not reach the server
      </h2>
      <p style={{ margin: "0", fontSize: "15px" }}>Your trip has been kept on this device and will be submitted when the connection returns. Nothing is lost.</p>
      <div style={{ marginTop: "20px", padding: "14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Waiting to sync
        </div>
        <div style={{ marginTop: "6px", fontFamily: "var(--font-mono)", fontSize: "15px", color: "var(--text-heading)" }}>Open Trip · TN 28 BC 1180 · 09:41</div>
      </div>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px" }}><Button size="lg" fullWidth={true} onClick={v.goHome} style={v.bigBtn}>Retry</Button></div>
    </div>
  </>
);

export default Offline;
