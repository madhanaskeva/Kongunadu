import React from 'react';
import { Button, Input } from '../components/ds';

export const Login = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column", padding: "calc(40px + env(safe-area-inset-top)) 24px 40px" }}>
      <img src="/assets/logo-1600.png" alt="Kongunadu Road Lines" style={{ height: "44px", width: "auto", alignSelf: "flex-start" }} />
      <div style={{ marginTop: "36px", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-brand)" }}>
        Transport Management System
      </div>
      <h2 style={{ margin: "6px 0 0", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "30px", letterSpacing: "-0.02em", lineHeight: "1.1", color: "var(--text-heading)" }}>
        Supervisor sign in
      </h2>
      <p style={{ margin: "8px 0 28px", fontSize: "15px", color: "var(--text-muted)" }}>Your branch is set from your account. Trips you open are recorded against it.</p>
      {v.loginError ? (
        <>
          <div role="alert" style={{ display: "flex", gap: "10px", padding: "12px 14px", marginBottom: "16px", background: "var(--kr-red-50)", border: "1px solid var(--kr-red-100)", borderRadius: "var(--radius-md)", color: "var(--kr-red-800)", fontSize: "14px", fontWeight: "600" }}>
            {v.loginErrText}
          </div>
        </>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Input label="Mobile number" value={v.loginPhone} onChange={v.setLoginPhone} prefix="+91" inputMode="numeric" autoComplete="tel" />
        <Input label="Password" type="password" value={v.loginPassword} onChange={v.setLoginPassword} autoComplete="current-password" />
      </div>
      <div style={{ marginTop: "28px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {v.loginLoading ? (
          <>
            <div style={{ height: "56px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", background: "var(--kr-green-800)", borderRadius: "var(--radius-md)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.02em" }}>
              <span style={{ width: "18px", height: "18px", border: "3px solid rgba(255,255,255,.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "tmsSpin .8s linear infinite", display: "inline-block" }} />
              Signing in
            </div>
          </>
        ) : null}
        {v.loginIdle ? (
          <>
            <Button size="lg" fullWidth={true} onClick={v.doLogin} style={v.bigBtn}>Sign in</Button>
          </>
        ) : null}
        <Button variant="ghost" size="lg" fullWidth={true} onClick={v.loginFail}>Forgot password</Button>
        <Button variant="ghost" size="lg" fullWidth={true} onClick={v.restartApproval}>New device? Request approval</Button>
      </div>
      <div style={{ marginTop: "auto", paddingTop: "24px", fontSize: "13px", color: "var(--text-muted)" }}>
        Session expires after 12 hours of inactivity. OTP login is planned for a later phase.
      </div>
    </div>
  </>
);

export default Login;
