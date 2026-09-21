import React from 'react';
import { Button, Input } from '../components/ds';

export const DeviceApproval = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column", padding: "calc(40px + env(safe-area-inset-top)) 24px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}><img src="/assets/logo-1600.png" alt="" style={{ height: "44px", width: "auto" }} /></div>
      <div style={{ marginTop: "10px", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "20px", letterSpacing: "-0.01em", color: "var(--text-heading)" }}>
        Kongunadu Road Lines
      </div>
      <div style={{ marginTop: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-brand)" }}>
          Step 1 of 3 · Approval
        </span>
        <span style={{ display: "flex", gap: "6px" }} aria-hidden="true">
          {(v.obSteps || []).map((st, stIdx) => (
            <React.Fragment key={stIdx}>
              <span style={{ width: "22px", height: "4px", borderRadius: "2px", background: st.bg }} />
            </React.Fragment>
          ))}
        </span>
      </div>
      <h2 style={{ margin: "6px 0 0", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "30px", letterSpacing: "-0.02em", lineHeight: "1.1", color: "var(--text-heading)" }}>
        Request approval
      </h2>
      <p style={{ margin: "8px 0 24px", fontSize: "15px", color: "var(--text-muted)" }}>Enter your name and mobile number. Head Office approves this phone, assigns your branch and shares a 4-digit OTP with you.</p>
      {v.obRejected ? (
        <>
          <div role="alert" style={{ padding: "12px 14px", marginBottom: "16px", background: "var(--kr-red-50)", border: "1px solid var(--kr-red-100)", borderRadius: "var(--radius-md)", color: "var(--kr-red-800)", fontSize: "14px", fontWeight: "600" }}>
            Head Office rejected the request for +91 {v.obPhoneText}. Check the number and request again.
          </div>
        </>
      ) : null}
      {v.obEditable ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Input label="Full name" placeholder="As on your ID" value={v.ob.name} onChange={v.setObName} error={v.obNameErr} autoComplete="name" />
            <Input label="Mobile number" placeholder="98410 22314" value={v.ob.phone} onChange={v.setObPhone} prefix="+91" inputMode="numeric" error={v.obPhoneErr} />
          </div>
        </>
      ) : null}
      {v.obWaiting ? (
        <>
          <div style={{ border: "1px solid var(--border-default)", borderTop: "4px solid var(--color-hazard)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px" }}>
              <span style={{ flex: "none", width: "22px", height: "22px", border: "3px solid var(--color-hazard-soft)", borderTopColor: "var(--color-hazard)", borderRadius: "50%", animation: "tmsSpin .9s linear infinite", display: "inline-block" }} />
              <div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-heading)" }}>Waiting for Head Office approval</div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>You move to OTP entry as soon as it is approved.</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "10px 16px", borderTop: "1px solid var(--border-default)", fontSize: "14px" }}>
              <span style={{ color: "var(--text-muted)" }}>Name</span>
              <span style={{ fontWeight: "700", color: "var(--text-heading)" }}>{v.ob.name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "10px 16px", borderTop: "1px solid var(--border-default)", fontSize: "14px" }}>
              <span style={{ color: "var(--text-muted)" }}>Mobile number</span>
              <span style={{ fontWeight: "700", color: "var(--text-heading)" }}>+91 {v.obPhoneText}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "10px 16px", borderTop: "1px solid var(--border-default)", fontSize: "14px" }}>
              <span style={{ color: "var(--text-muted)" }}>Requested</span>
              <span style={{ fontWeight: "700", color: "var(--text-heading)" }}>{v.obRequestedAt}</span>
            </div>
          </div>
        </>
      ) : null}
      <div style={{ marginTop: "auto", paddingTop: "28px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {v.obSending ? (
          <>
            <div style={{ height: "56px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", background: "var(--kr-green-800)", borderRadius: "var(--radius-md)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.02em" }}>
              <span style={{ width: "18px", height: "18px", border: "3px solid rgba(255,255,255,.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "tmsSpin .8s linear infinite", display: "inline-block" }} />
              Sending request
            </div>
          </>
        ) : null}
        {v.obEditable ? (
          <>
            <Button size="lg" fullWidth={true} onClick={v.requestApproval} style={v.bigBtn}>Request approval</Button>
          </>
        ) : null}
        {v.obWaiting ? (
          <>
            <Button variant="secondary" size="lg" fullWidth={true} onClick={v.cancelApproval}>Change mobile number</Button>
          </>
        ) : null}
        <Button variant="ghost" size="lg" fullWidth={true} onClick={v.goLogin}>Already registered? Sign in</Button>
      </div>
    </div>
  </>
);

export default DeviceApproval;
