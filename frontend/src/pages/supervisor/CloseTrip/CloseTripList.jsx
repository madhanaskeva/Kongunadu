import React from 'react';
import { Button } from '../components/ds';

export const CloseTripList = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column", padding: "16px", gap: "12px" }}>
      <p style={{ margin: "0", fontSize: "15px" }}>Select the trip whose unloading is complete.</p>
      {(v.activeTrips || []).map((t, tIdx) => (
        <React.Fragment key={tIdx}>
          <button data-id={t.id} onClick={v.pickClose} style={{ all: "unset", cursor: "pointer", display: "block", padding: "16px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", background: "#fff", transition: "box-shadow var(--dur-base)" }} className="sv-h3">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "15px", fontWeight: "700", color: "var(--text-heading)" }}>{t.number}</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 8px", borderRadius: "var(--radius-sm)", background: t.badgeBg, color: t.badgeFg }}>
                {t.badge}
              </span>
            </div>
            <div style={{ marginTop: "6px", fontSize: "15px", fontWeight: "600", color: "var(--text-heading)" }}>{t.crewLine}</div>
            <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>{t.routeLine}</div>
            <div style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-muted)" }}>Opened {t.opened} · {t.hoursOpen} h open</div>
          </button>
        </React.Fragment>
      ))}
      {v.noActive ? (
        <>
          <div style={{ padding: "40px 20px", textAlign: "center", border: "2px dashed var(--border-default)", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "20px", color: "var(--text-heading)" }}>No trips to close</div>
            <p style={{ margin: "8px 0 16px", fontSize: "14px", color: "var(--text-muted)" }}>Every trip for {v.branchName} is closed. Open a trip after the next loading.</p>
            <Button variant="secondary" onClick={v.goOpen}>Open trip</Button>
          </div>
        </>
      ) : null}
    </div>
  </>
);

export default CloseTripList;
