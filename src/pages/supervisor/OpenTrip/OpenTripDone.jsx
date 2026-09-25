import React from 'react';
import { Button } from '../components/ds';
import { ENROUTE_LABEL } from '../../../utils/tripStatus';

export const OpenTripDone = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column", padding: "32px 24px 40px", textAlign: "center" }}>
      <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "var(--color-brand)", display: "grid", placeItems: "center", margin: "16px auto 0" }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
      </div>
      <h2 style={{ margin: "20px 0 4px", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em", color: "var(--text-heading)" }}>Trip opened</h2>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "20px", color: "var(--text-brand)", fontWeight: "700" }}>{v.newTripNumber}</div>
      <p style={{ margin: "12px 0 0", fontSize: "15px", color: "var(--text-body)" }}>
        Status {ENROUTE_LABEL}. GPS monitoring has started for {v.newTripVehicle}. The vehicle will not appear as available until this trip is closed.
      </p>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
        <Button size="lg" fullWidth={true} onClick={v.goHome} style={v.bigBtn}>Back to home</Button>
        <Button variant="secondary" size="lg" fullWidth={true} onClick={v.goUnclosed}>View unclosed trips</Button>
      </div>
    </div>
  </>
);

export default OpenTripDone;
