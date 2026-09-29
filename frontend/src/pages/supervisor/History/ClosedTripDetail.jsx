import React from 'react';
import { Button } from '../components/ds';

export const ClosedTripDetail = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: "700", color: "var(--text-heading)" }}>{v.hist.number}</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: "var(--radius-sm)", background: v.hist.badgeBg, color: v.hist.badgeFg }}>
            {v.hist.badge}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "8px" }}>
          <div style={{ padding: "12px", background: "var(--surface-muted)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Fixed route</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "19px", color: "var(--text-heading)" }}>{v.hist.fixedKm}</div>
          </div>
          <div style={{ padding: "12px", background: "var(--surface-muted)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>GPS</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "19px", color: "var(--text-heading)" }}>{v.hist.gpsKm}</div>
          </div>
          <div style={{ padding: "12px", background: "var(--surface-muted)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Odometer</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "19px", color: "var(--text-heading)" }}>{v.hist.odoKm}</div>
          </div>
        </div>
        <div style={{ padding: "12px 14px", background: v.hist.verifyBg, borderRadius: "var(--radius-md)", fontSize: "14px", color: v.hist.verifyFg, lineHeight: "1.5" }}>
          {v.hist.verifyText}
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
            Opened · {v.hist.openedAt}
          </div>
          <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {(v.hist.openRows || []).map((r, rIdx) => (
              <React.Fragment key={rIdx}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,42%) minmax(0,58%)", gap: "12px", padding: "11px 14px", borderBottom: "1px solid var(--border-default)", fontSize: "14px", alignItems: "baseline" }}>
                  <span style={{ color: "var(--text-muted)" }}>{r.k}</span>
                  <span style={{ fontWeight: "700", color: "var(--text-heading)", textAlign: "right", overflowWrap: "anywhere" }}>{r.v}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
            Closed · {v.hist.closedAt}
          </div>
          <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {(v.hist.closeRows || []).map((r, rIdx) => (
              <React.Fragment key={rIdx}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,42%) minmax(0,58%)", gap: "12px", padding: "11px 14px", borderBottom: "1px solid var(--border-default)", fontSize: "14px", alignItems: "baseline", background: r.bg }}>
                  <span style={{ color: "var(--text-muted)" }}>{r.k}</span>
                  <span style={{ fontWeight: "700", color: r.color, textAlign: "right", overflowWrap: "anywhere" }}>{r.v}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        {v.hist.flagged ? (
          <>
            <div style={{ padding: "12px 14px", background: "var(--color-hazard-soft)", borderRadius: "var(--radius-md)", fontSize: "14px", color: "#7A4300", lineHeight: "1.5" }}>
              <strong>Sent to the admin as an exception.</strong>
              {' '}{v.hist.flagLine}
            </div>
          </>
        ) : null}
      </div>
      <div style={{ position: "sticky", bottom: "0", marginTop: "auto", padding: "12px 16px 40px", background: "#fff", borderTop: "1px solid var(--border-default)" }}>
        <Button variant="secondary" size="lg" fullWidth={true} onClick={v.back}>Back to trip history</Button>
      </div>
    </div>
  </>
);

export default ClosedTripDetail;
