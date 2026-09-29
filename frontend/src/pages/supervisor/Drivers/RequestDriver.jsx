import React from 'react';
import { Button, Input } from '../components/ds';

export const RequestDriver = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ padding: "12px 14px", background: "var(--color-hazard-soft)", borderRadius: "var(--radius-md)", fontSize: "14px", lineHeight: "1.5", color: "#7A4300" }}>{v.reqIntro}</div>
        {v.reqHasErrors ? (
          <>
            <div role="alert" style={{ padding: "12px 14px", borderLeft: "4px solid var(--status-danger)", background: "var(--kr-red-100)", borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--kr-red-800)" }}>
              <strong>{v.reqErrorCount} {v.reqErrorWord} to fix.</strong>
              {' '}Check the highlighted fields below.
            </div>
          </>
        ) : null}
        <section style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span aria-hidden="true" style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--color-brand)", color: "#fff", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "13px" }}>
              1
            </span>
            <h3 style={{ margin: "0", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-heading)" }}>
              Driver details
            </h3>
          </div>
          <Input label="Driver name" placeholder="Full name as on licence" value={v.rf.name} onChange={v.setRf.name} error={v.rerr.name} />
          <Input label="Licence number" placeholder="TN28 2019 0004521" value={v.rf.licence} onChange={v.setRfLicence} error={v.rerr.licence} />
          <Input label="Mobile number" placeholder="90031 55012" prefix="+91" inputMode="numeric" value={v.rf.phone} onChange={v.setRfPhone} error={v.rerr.phone} />
        </section>
        <section style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span aria-hidden="true" style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--color-brand)", color: "#fff", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "13px" }}>
              2
            </span>
            <h3 style={{ margin: "0", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-heading)" }}>
              Documents
            </h3>
          </div>
          {(v.uploads || []).map((u, uIdx) => (
            <React.Fragment key={uIdx}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-heading)" }}>{u.label}</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{u.note}</span>
                </div>
                {u.empty ? (
                  <>
                    <label style={{ marginTop: "8px", position: "relative", boxSizing: "border-box", display: "flex", alignItems: "center", gap: "14px", minHeight: "76px", padding: "14px", border: `2px dashed ${u.border}`, borderRadius: "var(--radius-md)", background: "var(--surface-muted)", cursor: "pointer" }} className="sv-h12">
                      <input type="file" accept="image/*" aria-label={u.label} data-k={u.key} onChange={v.pickUpload} style={{ position: "absolute", inset: "0", width: "100%", height: "100%", opacity: "0", cursor: "pointer" }} />
                      <span aria-hidden="true" style={{ flex: "none", width: "44px", height: "44px", borderRadius: "var(--radius-md)", background: "var(--color-brand-tint)", color: "var(--color-brand)", display: "grid", placeItems: "center" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      </span>
                      <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontWeight: "700", fontSize: "15px", color: "var(--text-heading)" }}>Take photo or upload</span>
                        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>JPG or PNG · up to 5 MB</span>
                      </span>
                    </label>
                  </>
                ) : null}
                {u.set ? (
                  <>
                    <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "12px", padding: "10px", border: "2px solid var(--color-brand)", borderRadius: "var(--radius-md)", background: "var(--color-brand-tint)" }}>
                      <div aria-hidden="true" style={{ flex: "none", boxSizing: "border-box", width: "72px", height: "52px", borderRadius: "var(--radius-sm)", background: "#fff", border: "1px solid var(--border-default)", display: "grid", placeItems: "center", overflow: "hidden", color: "var(--text-muted)" }}>
                        {u.url ? (
                          <>
                            <img src={u.url} alt="" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
                          </>
                        ) : null}
                        {u.noPreview ? (
                          <>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="M21 15l-5-5L5 21" />
                            </svg>
                          </>
                        ) : null}
                      </div>
                      <div style={{ flex: "1", minWidth: "0" }}>
                        <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--text-heading)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                        <div style={{ fontSize: "12px", color: "var(--kr-green-800)" }}>{u.size} · attached</div>
                      </div>
                      <button data-k={u.key} onClick={v.clearUpload} aria-label={u.removeLabel} style={{ all: "unset", cursor: "pointer", flex: "none", width: "44px", height: "44px", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", color: "var(--kr-red-600)" }} className="sv-h11">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                          <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                      </button>
                    </div>
                  </>
                ) : null}
                {u.err ? (
                  <>
                    <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--status-danger)", fontWeight: "600" }}>{u.errText}</div>
                  </>
                ) : null}
              </div>
            </React.Fragment>
          ))}
        </section>
        <section style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span aria-hidden="true" style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--color-brand)", color: "#fff", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "13px" }}>
              3
            </span>
            <h3 style={{ margin: "0", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-heading)" }}>
              Bank account
            </h3>
          </div>
          <Input label="Account holder name" placeholder="As in bank passbook" value={v.rf.holder} onChange={v.setRf.holder} error={v.rerr.holder} />
          <Input label="Account number" placeholder="9 to 18 digits" inputMode="numeric" value={v.rf.account} onChange={v.setRfAccount} error={v.rerr.account} />
          <Input label="IFSC code" placeholder="SBIN0001234" value={v.rf.ifsc} onChange={v.setRfIfsc} error={v.rerr.ifsc} hint="11 characters, printed on the passbook or cheque leaf." />
        </section>
        <section style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span aria-hidden="true" style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--color-brand)", color: "#fff", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "13px" }}>
              4
            </span>
            <h3 style={{ margin: "0", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-heading)" }}>
              Family & reference
            </h3>
          </div>
          <Input label="Family contact number" placeholder="Emergency contact" prefix="+91" inputMode="numeric" value={v.rf.family} onChange={v.setRfFamily} error={v.rerr.family} />
          <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-heading)" }}>Reference</span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Optional · {v.refCount}/250</span>
            </span>
            <textarea value={v.rf.reference} onChange={v.setRfReference} maxLength="250" rows="3" placeholder="Who referred this driver, previous employer, years of experience" style={{ boxSizing: "border-box", width: "100%", minHeight: "88px", padding: "10px 12px", fontFamily: "inherit", fontSize: "16px", lineHeight: "1.4", color: "var(--text-heading)", background: "#fff", border: "2px solid var(--border-strong)", borderRadius: "var(--radius-md)", outline: "0", resize: "vertical" }} className="sv-f1" />
          </label>
        </section>
      </div>
      <div style={{ position: "sticky", bottom: "0", marginTop: "auto", padding: "12px 16px 40px", background: "#fff", borderTop: "1px solid var(--border-default)", display: "flex", flexDirection: "column", gap: "8px" }}>
        <Button size="lg" fullWidth={true} onClick={v.submitDriver} style={v.bigBtn}>Send for approval</Button>
        {v.reqFromOpen ? (
          <>
            <Button variant="ghost" size="lg" fullWidth={true} onClick={v.back}>Back to Open Trip</Button>
          </>
        ) : null}
      </div>
    </div>
  </>
);

export default RequestDriver;
