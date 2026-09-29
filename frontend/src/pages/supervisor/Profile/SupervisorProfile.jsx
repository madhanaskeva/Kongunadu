import React from 'react';
import { ENROUTE_LABEL } from '../../../utils/tripStatus';
import { Button } from '../components/ds';

export const SupervisorProfile = ({ v }) => (
  <div style={{ flex: "1", display: "flex", flexDirection: "column", padding: "20px 16px 32px", gap: "16px" }}>
    {/* Profile Main Card */}
    <div
      style={{
        background: "var(--color-brand-tint, #f0fdf4)",
        border: "1px solid var(--color-brand)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "var(--color-brand, #006039)",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--font-display)",
          fontWeight: "800",
          fontSize: "22px",
          letterSpacing: "0.04em",
          flex: "none",
        }}
      >
        {v.supInitials || "SV"}
      </div>
      <div style={{ flex: "1", minWidth: "0" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "20px", color: "var(--text-heading)" }}>
          {v.supFullName || v.supName || "Supervisor"}
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-body)", marginTop: "2px" }}>
          {v.supRoleText}
        </div>
        <div style={{ marginTop: "6px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "2px 8px", borderRadius: "var(--radius-pill)", background: "#fff", border: "1px solid var(--color-brand)", fontSize: "11px", fontWeight: "700", color: "var(--color-brand)" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-brand)" }} />
          Active · Device Approved
        </div>
      </div>
    </div>

    {/* Contact & Branch Details Section */}
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "15px", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-heading)" }}>
        Profile Details
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Supervisor ID</div>
          <div style={{ fontWeight: "700", color: "var(--text-heading)", marginTop: "2px" }}>{v.supId || "S01"}</div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Branch</div>
          <div style={{ fontWeight: "700", color: "var(--text-heading)", marginTop: "2px" }}>{v.branchName}</div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Mobile Number</div>
          <div style={{ fontWeight: "700", color: "var(--text-heading)", marginTop: "2px" }}>+91 98410 22314</div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Role Access</div>
          <div style={{ fontWeight: "700", color: "var(--text-heading)", marginTop: "2px" }}>Branch Field Operations</div>
        </div>
      </div>
    </div>

    {/* Operations & System Stats */}
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "15px", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-heading)" }}>
        Operational Overview
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--surface-muted)" }}>
        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-body)" }}>{ENROUTE_LABEL} Vehicles</span>
        <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-brand)" }}>{v.activeCount} active</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--text-heading)" }}>
        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--surface-muted)" }}>Driver Attendance</span>
        <span style={{ fontSize: "14px", fontWeight: "800", color: "#fff" }}>{v.attendanceMarked} of {v.attendanceTotal} drivers</span>
      </div>
    </div>

    {/* Sign Out Button */}
    <div style={{ marginTop: "12px" }}>
      <Button
        variant="danger"
        size="lg"
        fullWidth={true}
        onClick={v.onSignOut}
      >
        Sign out
      </Button>
    </div>
  </div>
);

export default SupervisorProfile;
