import React from 'react';
import { Button, Input } from '../components/ds';

export const Register = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column", padding: "calc(40px + env(safe-area-inset-top)) 24px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}><img src="/assets/logo-1600.png" alt="" style={{ height: "44px", width: "auto" }} /></div>
      <div style={{ marginTop: "10px", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "20px", letterSpacing: "-0.01em", color: "var(--text-heading)" }}>
        Kongunadu Road Lines
      </div>
      <div style={{ marginTop: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-brand)" }}>
          Step 3 of 3 · Register
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
        Register
      </h2>
      <p style={{ margin: "8px 0 24px", fontSize: "15px", color: "var(--text-muted)" }}>Create your supervisor account. You sign in with this mobile number and password.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Input label="Name" placeholder="Full name" value={v.reg.name} onChange={v.setRegName} error={v.regErr.name} />
        <Input label="Phone number" value={v.obPhoneText} prefix="+91" inputMode="numeric" disabled={true} hint="Approved by Head Office for this device." />
        <Input label="Password" type="password" placeholder="At least 6 characters" value={v.reg.password} onChange={v.setRegPassword} error={v.regErr.password} hint={v.regPasswordHint} />
      </div>
      <div style={{ marginTop: "auto", paddingTop: "28px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {v.regSaving ? (
          <>
            <div style={{ height: "56px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", background: "var(--kr-green-800)", borderRadius: "var(--radius-md)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.02em" }}>
              <span style={{ width: "18px", height: "18px", border: "3px solid rgba(255,255,255,.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "tmsSpin .8s linear infinite", display: "inline-block" }} />
              Registering
            </div>
          </>
        ) : null}
        {v.regIdle ? (
          <>
            <Button size="lg" fullWidth={true} onClick={v.doRegister} style={v.bigBtn}>Register</Button>
          </>
        ) : null}
      </div>
    </div>
  </>
);

export default Register;
