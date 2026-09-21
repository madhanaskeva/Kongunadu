import React from 'react';
import { Button } from '../components/ds';

export const VerifyOtp = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column", padding: "calc(40px + env(safe-area-inset-top)) 24px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}><img src="/assets/logo-1600.png" alt="" style={{ height: "44px", width: "auto" }} /></div>
      <div style={{ marginTop: "10px", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "20px", letterSpacing: "-0.01em", color: "var(--text-heading)" }}>
        Kongunadu Road Lines
      </div>
      <div style={{ marginTop: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-brand)" }}>
          Step 2 of 3 · Verify
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
        Enter OTP
      </h2>
      <p style={{ margin: "8px 0 24px", fontSize: "15px", color: "var(--text-muted)" }}>Head Office approved +91 {v.obPhoneText}. Enter the 4-digit OTP they shared with you.</p>
      {v.obOtpShared ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", marginBottom: "20px", background: "var(--color-brand-tint)", borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--kr-green-900)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 5 5L20 7" />
            </svg>
            <span>
              <strong>OTP received</strong>
              {' '}from Head Office and filled in.
            </span>
          </div>
        </>
      ) : null}
      <div role="group" aria-label="4-digit OTP" data-otp-group="" style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
        {(v.otpBoxes || []).map((b, bIdx) => (
          <React.Fragment key={bIdx}>
            <input data-i={b.i} value={b.v} onChange={v.setOtpDigit} onKeyDown={v.otpKey} onFocus={v.selectAll} inputMode="numeric" autoComplete="one-time-code" maxLength="4" aria-label={b.label} style={{ boxSizing: "border-box", width: "64px", height: "72px", padding: "0", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "30px", fontWeight: "700", color: "var(--text-heading)", background: b.bg, border: `2px solid ${b.border}`, borderRadius: "var(--radius-md)", outline: "0" }} className="sv-f1" />
          </React.Fragment>
        ))}
      </div>
      {v.obOtpErr ? (
        <>
          <div role="alert" style={{ marginTop: "12px", textAlign: "center", fontSize: "14px", fontWeight: "600", color: "var(--status-danger)" }}>{v.obOtpErr}</div>
        </>
      ) : null}
      <div style={{ marginTop: "auto", paddingTop: "28px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <Button size="lg" fullWidth={true} onClick={v.verifyOtp} style={v.bigBtn}>Verify OTP</Button>
        <Button variant="ghost" size="lg" fullWidth={true} onClick={v.restartApproval}>Request approval again</Button>
      </div>
    </div>
  </>
);

export default VerifyOtp;
