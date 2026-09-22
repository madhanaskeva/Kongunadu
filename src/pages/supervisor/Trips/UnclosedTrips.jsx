import React from 'react';

export const UnclosedTrips = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column", padding: "16px", gap: "12px" }}>
      {(v.unclosedList || []).map((t, tIdx) => (
        <React.Fragment key={tIdx}>
          <button data-id={t.id} onClick={v.openTripDetail} style={{ all: "unset", cursor: "pointer", display: "block", padding: "16px", border: "1px solid var(--border-default)", borderLeft: `4px solid ${t.edge}`, borderRadius: "var(--radius-lg)", background: "#fff", transition: "box-shadow var(--dur-base)" }} className="sv-h3">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "15px", fontWeight: "700", color: "var(--text-heading)" }}>{t.number}</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 8px", borderRadius: "var(--radius-sm)", background: t.badgeBg, color: t.badgeFg }}>
                {t.badge}
              </span>
            </div>
            <div style={{ marginTop: "6px", fontSize: "15px", fontWeight: "600", color: "var(--text-heading)" }}>{t.crewLine}</div>
            <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>{t.routeLine}</div>
            <div style={{ marginTop: "10px", height: "6px", background: "var(--kr-grey-100)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: t.progress, background: "var(--color-brand)" }} />
            </div>
            <div style={{ marginTop: "6px", display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-muted)" }}>
              <span>{t.gpsKm} of {t.fixedKm} km by GPS</span>
              <span>{t.hoursOpen} h open</span>
            </div>
          </button>
        </React.Fragment>
      ))}
      {v.unclosedEmpty ? (
        <>
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", margin: "0 auto 16px", borderRadius: "50%", background: "var(--color-brand-tint)", display: "grid", placeItems: "center" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 5 5L20 7" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "20px", color: "var(--text-heading)" }}>All trips closed</div>
            <p style={{ margin: "8px 0 0", fontSize: "14px", color: "var(--text-muted)" }}>Nothing is enroute for {v.branchName}. Trips you open will appear here until they are closed.</p>
          </div>
        </>
      ) : null}
    </div>
  </>
);

export default UnclosedTrips;
