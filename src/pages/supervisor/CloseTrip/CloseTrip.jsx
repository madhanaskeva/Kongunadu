import React from 'react';
import { Button, Input, Select } from '../components/ds';

export const CloseTrip = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "18px" }}>
        {v.resumeHere ? (
          <>
            <div role="status" style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "12px 14px", background: "var(--color-hazard-soft)", borderRadius: "var(--radius-md)", fontSize: "14px", lineHeight: "1.45", color: "#7A4300" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: "1px" }}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <span>
                <strong>Close this trip first.</strong>
                {' '}You go back to Open Trip for {v.resumeVehicle} as soon as it is closed.
              </span>
            </div>
          </>
        ) : null}
        <div style={{ padding: "14px", background: "var(--color-brand)", borderRadius: "var(--radius-lg)", color: "#fff" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: "700" }}>{v.sel.number}</div>
          <div style={{ fontSize: "14px", opacity: ".85", marginTop: "4px" }}>{v.sel.crewLine} · {v.sel.partyName}</div>
          <div style={{ display: "flex", gap: "20px", marginTop: "12px", fontSize: "13px" }}>
            <span>
              <span style={{ opacity: ".6" }}>Start KM</span>
              <br />
              <strong style={{ fontSize: "16px" }}>{v.sel.startKm}</strong>
            </span>
            <span>
              <span style={{ opacity: ".6" }}>Fixed route</span>
              <br />
              <strong style={{ fontSize: "16px" }}>{v.sel.fixedKm} km</strong>
            </span>
            <span>
              <span style={{ opacity: ".6" }}>GPS so far</span>
              <br />
              <strong style={{ fontSize: "16px" }}>{v.sel.gpsKm} km</strong>
            </span>
            <span>
              <span style={{ opacity: ".6" }}>Tank</span>
              <br />
              <strong style={{ fontSize: "16px" }}>{v.tankLabel}</strong>
            </span>
          </div>
        </div>
        {v.closeHasErrors ? (
          <>
            <div role="alert" style={{ padding: "12px 14px", background: "var(--kr-red-50)", border: "1px solid var(--kr-red-100)", borderRadius: "var(--radius-md)", color: "var(--kr-red-800)", fontSize: "14px", fontWeight: "600" }}>
              The trip cannot close until the required fields are filled.
            </div>
          </>
        ) : null}
        <Input label="Loading invoice number" placeholder="e.g. SP/INV/22890" value={v.cf.invoice} onChange={v.setCf.invoice} error={v.cerr.invoice} />
        <Input label="LR number (optional)" placeholder="Lorry receipt" value={v.cf.lr} onChange={v.setCf.lr} />
        {/* ODOMETER · point-to-point readings with photos */}
        <section style={{ border: `1px solid ${v.legBox.border}`, borderRadius: "var(--radius-lg)", padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Odometer readings
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>From → to, with photo</span>
          </div>
          {(v.legCards || []).map((l, lIdx) => (
            <React.Fragment key={lIdx}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: l.bg }}>
                <div aria-hidden="true" style={{ flex: "none", boxSizing: "border-box", width: "56px", height: "44px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)", background: "#fff", display: "grid", placeItems: "center", overflow: "hidden", color: "var(--text-muted)" }}>
                  {l.url ? (
                    <>
                      <img src={l.url} alt="" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
                    </>
                  ) : null}
                  {l.noPhoto ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </>
                  ) : null}
                </div>
                <div style={{ flex: "1", minWidth: "0" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>{l.title}</div>
                  <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--text-heading)", lineHeight: "1.3" }}>{l.route}</div>
                  <div style={{ fontSize: "13px", color: "var(--text-body)" }}>
                    {l.reading} ·{' '}
                    <strong style={{ color: "var(--text-brand)" }}>{l.km}</strong>
                  </div>
                </div>
                <div style={{ flex: "none", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <button data-i={l.i} onClick={v.editLeg} style={{ all: "unset", cursor: "pointer", minHeight: "32px", padding: "0 8px", fontSize: "13px", fontWeight: "700", color: "var(--text-brand)" }}>
                    Edit
                  </button>
                  <button data-i={l.i} onClick={v.removeLeg} style={{ all: "unset", cursor: "pointer", minHeight: "32px", padding: "0 8px", fontSize: "13px", fontWeight: "700", color: "var(--kr-red-600)" }}>
                    Remove
                  </button>
                </div>
              </div>
            </React.Fragment>
          ))}
          {v.legSummary ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--surface-muted)", borderRadius: "var(--radius-md)" }}>
                <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>Closing odometer</span>
                <span style={{ textAlign: "right" }}>
                  <strong style={{ fontFamily: "var(--font-display)", fontSize: "17px", color: "var(--text-heading)" }}>{v.legSummary.close}</strong>
                  <br />
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{v.legSummary.dist}</span>
                </span>
              </div>
            </>
          ) : null}
          {v.legEditorOpen ? (
            <>
              <div style={{ padding: "12px", border: "2px dashed var(--color-brand)", borderRadius: "var(--radius-md)", background: "var(--color-brand-tint)", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--kr-green-900)" }}>
                  {v.legEditorTitle}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <Select label="From" placeholder="Select point" options={v.pointOptions} value={v.cf.legDraft.from} onChange={v.setLegFrom} />
                  <Select label="To" placeholder="Select point" options={v.pointOptions} value={v.cf.legDraft.to} onChange={v.setLegTo} />
                </div>
                {v.legErr.route ? (
                  <>
                    <div style={{ marginTop: "-4px", fontSize: "13px", color: "var(--status-danger)", fontWeight: "600" }}>{v.legErr.route}</div>
                  </>
                ) : null}
                <Input label="Odometer at To point" placeholder={v.legPrevText} value={v.cf.legDraft.reading} onChange={v.setLegReading} inputMode="numeric" suffix="km" error={v.legErr.reading} hint={v.legReadingHint} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-heading)" }}>Odometer photo</div>
                  {v.legPhotoEmpty ? (
                    <>
                      <label style={{ marginTop: "8px", position: "relative", boxSizing: "border-box", display: "flex", alignItems: "center", gap: "12px", minHeight: "64px", padding: "10px 12px", border: `2px dashed ${v.legPhotoBorder}`, borderRadius: "var(--radius-md)", background: "#fff", cursor: "pointer" }}>
                        <input type="file" accept="image/*" aria-label="Odometer photo" onChange={v.pickLegPhoto} style={{ position: "absolute", inset: "0", width: "100%", height: "100%", opacity: "0", cursor: "pointer" }} />
                        <span aria-hidden="true" style={{ flex: "none", width: "40px", height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-brand-tint)", color: "var(--color-brand)", display: "grid", placeItems: "center" }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        </span>
                        <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text-heading)" }}>Take photo of the odometer</span>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Reading must be clearly visible</span>
                        </span>
                      </label>
                    </>
                  ) : null}
                  {v.legPhotoSet ? (
                    <>
                      <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "12px", padding: "8px", border: "2px solid var(--color-brand)", borderRadius: "var(--radius-md)", background: "#fff" }}>
                        <div aria-hidden="true" style={{ flex: "none", boxSizing: "border-box", width: "64px", height: "48px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)", background: "var(--surface-muted)", overflow: "hidden" }}>
                          {v.legPhoto.url ? (
                            <>
                              <img src={v.legPhoto.url} alt="" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
                            </>
                          ) : null}
                        </div>
                        <div style={{ flex: "1", minWidth: "0" }}>
                          <div style={{ fontWeight: "700", fontSize: "13px", color: "var(--text-heading)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {v.legPhoto.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--kr-green-800)" }}>{v.legPhoto.size} · attached</div>
                        </div>
                        <button onClick={v.clearLegPhoto} aria-label="Remove odometer photo" style={{ all: "unset", cursor: "pointer", flex: "none", width: "40px", height: "40px", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", color: "var(--kr-red-600)" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : null}
                  {v.legErr.photo ? (
                    <>
                      <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--status-danger)", fontWeight: "600" }}>{v.legErr.photo}</div>
                    </>
                  ) : null}
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <Button size="md" onClick={v.saveLeg}>{v.legSaveLabel}</Button>
                  {v.legCanCancel ? (
                    <>
                      <Button variant="ghost" size="md" onClick={v.cancelLeg}>Cancel</Button>
                    </>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
          {v.legAddShown ? (
            <>
              <Button variant="secondary" size="md" fullWidth={true} onClick={v.openLegEditor}>+ Add reading</Button>
            </>
          ) : null}
          {v.cerr.legs ? (
            <>
              <div style={{ fontSize: "13px", color: "var(--status-danger)", fontWeight: "600" }}>{v.cerr.legs}</div>
            </>
          ) : null}
        </section>
        {/* DIESEL · one entry per bunk */}
        <section style={{ border: `1px solid ${v.fillBox.border}`, borderRadius: "var(--radius-lg)", padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Diesel given
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Bunk, quantity and rate</span>
          </div>
          {(v.fillCards || []).map((d, dIdx) => (
            <React.Fragment key={dIdx}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "10px 12px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: d.bg }}>
                <span aria-hidden="true" style={{ flex: "none", width: "36px", height: "36px", borderRadius: "50%", background: "var(--color-brand-tint)", color: "var(--color-brand)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "14px" }}>
                  {d.n}
                </span>
                <div style={{ flex: "1", minWidth: "0" }}>
                  <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--text-heading)", lineHeight: "1.3" }}>{d.bunk}</div>
                  <div style={{ fontSize: "13px", color: d.lineColor }}>{d.line}</div>
                </div>
                <div style={{ flex: "none", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <button data-i={d.i} onClick={v.editFill} style={{ all: "unset", cursor: "pointer", minHeight: "32px", padding: "0 8px", fontSize: "13px", fontWeight: "700", color: "var(--text-brand)" }}>
                    Edit
                  </button>
                  <button data-i={d.i} onClick={v.removeFill} style={{ all: "unset", cursor: "pointer", minHeight: "32px", padding: "0 8px", fontSize: "13px", fontWeight: "700", color: "var(--kr-red-600)" }}>
                    Remove
                  </button>
                </div>
              </div>
            </React.Fragment>
          ))}
          {v.fillEditorOpen ? (
            <>
              <div style={{ padding: "12px", border: "2px dashed var(--color-brand)", borderRadius: "var(--radius-md)", background: "var(--color-brand-tint)", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--kr-green-900)" }}>
                  {v.fillEditorTitle}
                </div>
                <Input label="Bunk name" placeholder="e.g. IOC – Sriperumbudur Highway" value={v.cf.fillDraft.bunk} onChange={v.setFillBunk} error={v.fillErr.bunk} hint={v.fillBunkHint} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "10px" }}>
                  <Input label="Quantity" suffix="L" value={v.cf.fillDraft.litres} onChange={v.setFillLitres} inputMode="decimal" error={v.fillErr.litres} hint={v.qtyHint} />
                  <Input label="Rate" prefix="₹" suffix="/L" value={v.cf.fillDraft.rate} onChange={v.setFillRate} inputMode="decimal" error={v.fillErr.rate} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Amount</span>
                  <strong style={{ color: "var(--text-heading)" }}>{v.fillDraftAmount}</strong>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <Button size="md" onClick={v.saveFill}>{v.fillSaveLabel}</Button>
                  {v.fillCanCancel ? (
                    <>
                      <Button variant="ghost" size="md" onClick={v.cancelFill}>Cancel</Button>
                    </>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
          {v.fillAddShown ? (
            <>
              <Button variant="secondary" size="md" fullWidth={true} onClick={v.openFillEditor}>+ Add bunk</Button>
            </>
          ) : null}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--surface-muted)", borderRadius: "var(--radius-md)" }}>
            <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>{v.dieselTotalLabel}</span>
            <strong style={{ fontFamily: "var(--font-display)", fontSize: "18px", color: "var(--text-heading)" }}>{v.dieselAmount}</strong>
          </div>
          {v.cerr.fills ? (
            <>
              <div style={{ fontSize: "13px", color: "var(--status-danger)", fontWeight: "600" }}>{v.cerr.fills}</div>
            </>
          ) : null}
        </section>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "12px" }}>
          <Input label="Loading qty" value={v.cf.qtyLoad} onChange={v.setCf.qtyLoad} error={v.cerr.qtyLoad} />
          <Input label="Unloading qty" value={v.cf.qtyUnload} onChange={v.setCf.qtyUnload} error={v.cerr.qtyUnload} />
        </div>
        <Input label="Total expense" prefix="₹" placeholder="0" value={v.cf.totalExpense} onChange={v.setTotalExpense} inputMode="numeric" error={v.cerr.totalExpense} hint={v.totalExpenseHint} />
        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-heading)" }}>Remarks</span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Optional · {v.closeRemarksCount}/250</span>
          </span>
          <textarea value={v.cf.remarks} onChange={v.setCloseRemarks} maxLength="250" rows="3" placeholder="Delays, short delivery, extra stops or anything Head Office should know" style={{ boxSizing: "border-box", width: "100%", minHeight: "88px", padding: "10px 12px", fontFamily: "inherit", fontSize: "16px", lineHeight: "1.4", color: "var(--text-heading)", background: "#fff", border: "2px solid var(--border-strong)", borderRadius: "var(--radius-md)", outline: "0", resize: "vertical" }} className="sv-f1" />
        </label>
        {v.closeManualException ? (
          <>
            <div style={{ padding: "12px 14px", background: "var(--color-hazard-soft)", borderRadius: "var(--radius-md)", fontSize: "14px", color: "#7A4300" }}>
              <strong>Manual exception.</strong>
              {' '}GPS and odometer both unavailable for this trip. Admin will receive an exception report; enter the closing reading from the dashboard photo.
            </div>
          </>
        ) : null}
      </div>
      <div style={{ position: "sticky", bottom: "0", marginTop: "auto", padding: "12px 16px 40px", background: "#fff", borderTop: "1px solid var(--border-default)", display: "flex", flexDirection: "column", gap: "8px" }}>
        <Button size="lg" fullWidth={true} onClick={v.submitClose} style={v.bigBtn}>Close trip</Button>
        <Button variant="ghost" size="lg" fullWidth={true} onClick={v.back}>Back</Button>
      </div>
    </div>
  </>
);

export default CloseTrip;
