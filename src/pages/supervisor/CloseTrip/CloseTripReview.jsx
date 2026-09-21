import React from 'react';
import { Button } from '../components/ds';

export const CloseTripReview = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px", display: "flex", flexDirection: "column" }}>
        <p style={{ margin: "0", fontSize: "15px" }}>Check the details before closing. Once closed, the trip is locked and the vehicle is free for the next assignment.</p>
        {(v.closeSummary || []).map((sec, secIdx) => (
          <React.Fragment key={secIdx}>
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>
                {sec.title}
              </div>
              <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                {(sec.rows || []).map((r, rIdx) => (
                  <React.Fragment key={rIdx}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "11px 14px", borderBottom: "1px solid var(--border-default)", fontSize: "14px", background: r.bg }}>
                      <span style={{ flex: "none", maxWidth: "48%", color: "var(--text-muted)" }}>{r.k}</span>
                      <span style={{ fontWeight: "700", color: "var(--text-heading)", textAlign: "right", overflowWrap: "anywhere" }}>{r.v}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </React.Fragment>
        ))}
        {v.hasClosePhotos ? (
          <>
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>
                Odometer photos
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "10px" }}>
                {(v.closePhotos || []).map((ph, phIdx) => (
                  <React.Fragment key={phIdx}>
                    <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                      <div aria-hidden="true" style={{ height: "96px", background: "var(--surface-muted)", overflow: "hidden" }}>
                        {ph.url ? (
                          <>
                            <img src={ph.url} alt="" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
                          </>
                        ) : null}
                      </div>
                      <div style={{ padding: "6px 8px", fontSize: "12px", color: "var(--text-body)" }}>{ph.caption}</div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </>
        ) : null}
        <div style={{ marginTop: "16px", padding: "12px 14px", background: v.verify.bg, borderRadius: "var(--radius-md)", fontSize: "14px", color: v.verify.fg }}>
          <strong>{v.closeReviewHead}</strong>
          {' '}{v.closeReviewNote}
        </div>
      </div>
      <div style={{ position: "sticky", bottom: "0", marginTop: "auto", padding: "12px 16px 40px", background: "#fff", borderTop: "1px solid var(--border-default)", display: "flex", flexDirection: "column", gap: "8px" }}>
        <Button size="lg" fullWidth={true} onClick={v.confirmClose} style={v.bigBtn}>Confirm and close trip</Button>
        <Button variant="ghost" size="lg" fullWidth={true} onClick={v.back}>Edit details</Button>
      </div>
    </div>
  </>
);

export default CloseTripReview;
