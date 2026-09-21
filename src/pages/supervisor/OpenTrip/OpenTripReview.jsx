import React from 'react';
import { Button } from '../components/ds';

export const OpenTripReview = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <p style={{ margin: "0", fontSize: "15px" }}>Check the details. The trip number is generated when you confirm, and GPS monitoring starts immediately.</p>
        <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          {(v.reviewRows || []).map((r, rIdx) => (
            <React.Fragment key={rIdx}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "12px 14px", borderBottom: "1px solid var(--border-default)", fontSize: "15px" }}>
                <span style={{ color: "var(--text-muted)" }}>{r.k}</span>
                <span style={{ fontWeight: "700", color: "var(--text-heading)", textAlign: "right" }}>{r.v}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={{ padding: "12px 14px", background: "var(--color-brand-tint)", borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--kr-green-900)" }}>
          <strong>Validation passed.</strong>
          {' '}{v.reviewNote}
        </div>
      </div>
      <div style={{ position: "sticky", bottom: "0", marginTop: "auto", padding: "12px 16px 40px", background: "#fff", borderTop: "1px solid var(--border-default)", display: "flex", flexDirection: "column", gap: "8px" }}>
        {v.saving ? (
          <>
            <div style={{ height: "56px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", background: "var(--kr-green-800)", borderRadius: "var(--radius-md)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: "700", textTransform: "uppercase" }}>
              <span style={{ width: "18px", height: "18px", border: "3px solid rgba(255,255,255,.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "tmsSpin .8s linear infinite", display: "inline-block" }} />
              Saving trip
            </div>
          </>
        ) : null}
        {v.notSaving ? (
          <>
            <Button size="lg" fullWidth={true} onClick={v.confirmOpen} style={v.bigBtn}>Confirm and open trip</Button>
          </>
        ) : null}
        <Button variant="ghost" size="lg" fullWidth={true} onClick={v.back}>Edit details</Button>
      </div>
    </div>
  </>
);

export default OpenTripReview;
