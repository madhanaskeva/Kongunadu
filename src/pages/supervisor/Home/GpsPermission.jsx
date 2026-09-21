import React from 'react';
import { Button } from '../components/ds';

export const GpsPermission = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column", padding: "32px 24px 40px" }}>
      <div style={{ width: "72px", height: "72px", borderRadius: "var(--radius-lg)", background: "var(--color-brand-tint)", display: "grid", placeItems: "center" }}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <h2 style={{ margin: "24px 0 8px", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em", color: "var(--text-heading)" }}>
        Location access is required
      </h2>
      <p style={{ margin: "0", fontSize: "15px" }}>
        Trips cannot be opened without GPS. The app needs location access, including in the background, to validate routes, detect idle time and monitor the 100 m safe radius.
      </p>
      <ul style={{ margin: "20px 0 0", padding: "0 0 0 18px", fontSize: "15px", lineHeight: "1.6" }}>
        <li>Geolocation permission</li>
        <li>Background location access</li>
        <li>Continuous capture while a trip is enroute</li>
      </ul>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
        <Button size="lg" fullWidth={true} onClick={v.grantGps} style={v.bigBtn}>Allow location</Button>
        <Button variant="ghost" size="lg" fullWidth={true} onClick={v.goHome}>Not now</Button>
      </div>
    </div>
  </>
);

export default GpsPermission;
