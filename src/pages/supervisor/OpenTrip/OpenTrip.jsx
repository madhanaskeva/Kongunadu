import React from 'react';
import { Button, Checkbox, Input, Select } from '../components/ds';

export const OpenTrip = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "12px" }}>
          <div style={{ padding: "12px", background: "var(--surface-muted)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Trip number
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: v.tripNumberColor, marginTop: "4px", whiteSpace: "nowrap" }}>{v.tripNumberPreview}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", lineHeight: "1.35" }}>{v.tripNumberNote}</div>
          </div>
          <div style={{ padding: "12px", background: "var(--surface-muted)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Branch</div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-heading)", marginTop: "4px" }}>Chennai HO</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>From your login</div>
          </div>
        </div>
        {v.openHasErrors ? (
          <>
            <div role="alert" style={{ padding: "12px 14px", background: "var(--kr-red-50)", border: "1px solid var(--kr-red-100)", borderRadius: "var(--radius-md)", color: "var(--kr-red-800)", fontSize: "14px", fontWeight: "600" }}>
              {v.openErrorCount} required fields are missing. Complete the highlighted fields to save this trip.
            </div>
          </>
        ) : null}
        <div>
          <div style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-heading)", marginBottom: "8px" }}>Trip type</div>
          <div role="radiogroup" aria-label="Trip type" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "8px" }}>
            {(v.tripTypeTabs || []).map((tt, ttIdx) => (
              <React.Fragment key={ttIdx}>
                <button role="radio" aria-checked={tt.on} data-v={tt.value} onClick={v.setType} style={{ all: "unset", cursor: "pointer", boxSizing: "border-box", height: "52px", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "15px", letterSpacing: "0.04em", textTransform: "uppercase", border: `2px solid ${tt.border}`, background: tt.bg, color: tt.fg, transition: "background var(--dur-fast)" }}>
                  {tt.label}
                </button>
              </React.Fragment>
            ))}
          </div>
          <div style={{ marginTop: "6px", fontSize: "13px", color: "var(--text-muted)" }}>{v.typeHint}</div>
        </div>
        {v.isBusiness ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <Select label="Client name" placeholder={v.clientPlaceholder} options={v.clientOptionsShown} value={v.form.client} onChange={v.setClient} />
                <div style={{ marginTop: "6px", fontSize: "13px", color: "var(--text-muted)" }}>{v.clientHint}</div>
                {v.err.client ? (
                  <>
                    <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--status-danger)", fontWeight: "600" }}>Select the client this load belongs to.</div>
                  </>
                ) : null}
              </div>
              <div>
                <Select label="Vehicle number" placeholder="Select available vehicle" options={v.vehicleOptions} value={v.form.vehicle} onChange={v.setVehicle} />
                <div style={{ marginTop: "6px", fontSize: "13px", color: "var(--text-muted)" }}>{v.vehicleHint}</div>
                {v.err.vehicle ? (
                  <>
                    <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--status-danger)", fontWeight: "600" }}>Select a vehicle.</div>
                  </>
                ) : null}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-heading)" }}>Driver name</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{v.dc.tag}</span>
                </div>
                {v.dc.none ? (
                  <>
                    <div style={{ marginTop: "8px", padding: "14px", border: `2px dashed ${v.dc.border}`, borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--text-muted)" }}>
                      Select a vehicle first. Its mapped driver appears here to confirm.
                    </div>
                  </>
                ) : null}
                {v.dc.has ? (
                  <>
                    <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "12px", padding: "12px", border: `2px solid ${v.dc.border}`, borderRadius: "var(--radius-md)", background: v.dc.bg }}>
                      <div aria-hidden="true" style={{ flex: "none", width: "44px", height: "44px", borderRadius: "50%", background: v.dc.avatarBg, color: v.dc.avatarFg, display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "15px" }}>
                        {v.dc.initials}
                      </div>
                      <div style={{ flex: "1", minWidth: "0" }}>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: v.dc.statusFg }}>
                          {v.dc.status}
                        </div>
                        <div style={{ marginTop: "2px", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "17px", lineHeight: "1.2", color: "var(--text-heading)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {v.dc.name}
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.dc.sub}</div>
                      </div>
                      {v.dc.ask ? (
                        <>
                          <div style={{ flex: "none", display: "flex", gap: "8px" }}>
                            <button onClick={v.rejectDriver} aria-label="Not this driver, choose another" title="Choose another driver" style={{ all: "unset", cursor: "pointer", boxSizing: "border-box", width: "44px", height: "44px", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", border: "2px solid var(--kr-red-600)", background: "#fff", color: "var(--kr-red-600)" }} className="sv-h9">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                                <path d="M6 6l12 12M18 6 6 18" />
                              </svg>
                            </button>
                            <button onClick={v.acceptDriver} aria-label="Confirm this driver" title="Confirm driver" style={{ all: "unset", cursor: "pointer", boxSizing: "border-box", width: "44px", height: "44px", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", border: "2px solid var(--color-brand)", background: "var(--color-brand)", color: "#fff" }} className="sv-h10">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M5 12.5l4.5 4.5L19 7.5" />
                              </svg>
                            </button>
                          </div>
                        </>
                      ) : null}
                      {v.dc.ok ? (
                        <>
                          <button onClick={v.openDrvPick} style={{ all: "unset", cursor: "pointer", flex: "none", boxSizing: "border-box", height: "44px", padding: "0 12px", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "13px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-brand)" }} className="sv-h11">
                            Change
                          </button>
                        </>
                      ) : null}
                    </div>
                  </>
                ) : null}
                {v.dc.empty ? (
                  <>
                    <div style={{ marginTop: "8px", padding: "14px", border: "2px solid var(--color-hazard)", borderRadius: "var(--radius-md)", background: "var(--color-hazard-soft)", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ fontSize: "14px", lineHeight: "1.5", color: "#7A4300" }}>{v.dc.emptyText}</div>
                      <Button variant="secondary" size="md" fullWidth={true} onClick={v.openDrvPick}>Choose driver</Button>
                    </div>
                  </>
                ) : null}
                <div style={{ marginTop: "6px", fontSize: "13px", color: "var(--text-muted)" }}>{v.dc.hint}</div>
                {v.err.driver ? (
                  <>
                    <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--status-danger)", fontWeight: "600" }}>{v.driverErrText}</div>
                  </>
                ) : null}
              </div>
              <div>
                <Select label="Loading location" placeholder="Select predefined location" options={v.locationOptions} value={v.form.loading} onChange={v.setLoading} />
                <div style={{ marginTop: "6px", fontSize: "13px", color: "var(--text-muted)" }}>{v.loadingHint}</div>
                {v.err.loading ? (
                  <>
                    <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--status-danger)", fontWeight: "600" }}>Select the loading location.</div>
                  </>
                ) : null}
                {v.addLocOpen ? (
                  <>
                    <div style={{ marginTop: "10px", padding: "14px", border: "2px dashed var(--color-brand)", borderRadius: "var(--radius-md)", background: "var(--color-brand-tint)", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--kr-green-600)", animation: "tmsPulse 1.6s ease-in-out infinite" }} />
                        <span style={{ fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--kr-green-900)" }}>
                          New loading point · GPS captured
                        </span>
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "var(--text-heading)" }}>13.0827° N, 80.2707° E</div>
                      <div style={{ fontSize: "13px", color: "var(--text-body)", marginTop: "-6px" }}>Accuracy 8 m · taken at 09:41 from where you are standing.</div>
                      <Input label="Location name" placeholder="e.g. Oragadam Plant Gate 3" value={v.newLoc.name} onChange={v.setNewLocName} error={v.newLocErr} />
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Saved to Chennai HO with a 100 m safe radius. Head Office can correct it later.</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        <Button size="md" onClick={v.saveNewLoc}>Use this point</Button>
                        <Button variant="ghost" size="md" onClick={v.cancelNewLoc}>Cancel</Button>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-heading)" }}>Unloading location</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{v.unloadCountLabel}</span>
                </div>
                {v.hasCustomers ? (
                  <>
                    <div role="radiogroup" aria-label="Unloading drops" style={{ marginTop: "8px", display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "8px" }}>
                      {(v.unloadModeTabs || []).map((um, umIdx) => (
                        <React.Fragment key={umIdx}>
                          <button role="radio" aria-checked={um.on} data-v={um.value} onClick={v.setUnloadMode} style={{ all: "unset", cursor: "pointer", boxSizing: "border-box", minHeight: "48px", padding: "6px 10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1px", borderRadius: "var(--radius-md)", border: `2px solid ${um.border}`, background: um.bg, color: um.fg, transition: "background var(--dur-fast)" }}>
                            <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14px", letterSpacing: "0.04em", textTransform: "uppercase" }}>{um.label}</span>
                            <span style={{ fontSize: "12px", opacity: ".85" }}>{um.sub}</span>
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </>
                ) : null}
                {v.unloadSingle ? (
                  <>
                    <div style={{ marginTop: "10px" }}>
                      <Select label="Customer" placeholder="Select unloading customer" options={v.singleCustOptions} value={v.singleCust} onChange={v.setSingleCust} />
                      {v.singleCustInfo ? (
                        <>
                          <div style={{ marginTop: "6px", fontSize: "13px", color: "var(--text-muted)" }}>{v.singleCustInfo}</div>
                        </>
                      ) : null}
                    </div>
                  </>
                ) : null}
                {v.unloadMulti ? (
                  <>
                    <div style={{ marginTop: "10px", border: "2px solid var(--border-strong)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                      {(v.customerOptions || []).map((c, cIdx) => (
                        <React.Fragment key={cIdx}>
                          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${c.divider}`, background: c.bg }}>
                            <Checkbox label={c.name} description={c.sub} checked={c.on} onChange={c.toggle} style={v.fullRow} />
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </>
                ) : null}
                {v.noCustomers ? (
                  <>
                    <div style={{ marginTop: "8px", padding: "14px", border: "2px dashed var(--border-strong)", borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--text-muted)" }}>
                      {v.unloadEmptyText}
                    </div>
                  </>
                ) : null}
                {v.err.unloading ? (
                  <>
                    <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--status-danger)", fontWeight: "600" }}>{v.unloadErrText}</div>
                  </>
                ) : null}
                {v.routeKnown ? (
                  <>
                    <div style={{ marginTop: "10px", padding: "12px 14px", background: "var(--color-hazard-soft)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "#7A4300", lineHeight: "1.5" }}>
                      <strong>Route diversion alert is on.</strong>
                      {' '}{v.routeSummary} GPS raises an exception to Head Office if the vehicle leaves this corridor by more than 10 km.
                    </div>
                  </>
                ) : null}
              </div>
              <div>
                <Input label="Start KM" value={v.form.startKm} onChange={v.setStartKm} inputMode="numeric" disabled={v.startKmLocked} suffix="km" hint={v.startKmHint} />
                {v.err.startKm ? (
                  <>
                    <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--status-danger)", fontWeight: "600" }}>
                      Enter the odometer reading. This is the vehicle’s first recorded trip.
                    </div>
                  </>
                ) : null}
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-heading)" }}>Remarks</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Optional · {v.remarksCount}/250</span>
                </span>
                <textarea value={v.form.remarks} onChange={v.setRemarks} maxLength="250" rows="3" placeholder="Anything the admin should know about this trip" style={{ boxSizing: "border-box", width: "100%", minHeight: "88px", padding: "10px 12px", fontFamily: "inherit", fontSize: "16px", lineHeight: "1.4", color: "var(--text-heading)", background: "#fff", border: "2px solid var(--border-strong)", borderRadius: "var(--radius-md)", outline: "0", resize: "vertical" }} className="sv-f1" />
              </label>
            </div>
          </>
        ) : null}
        {v.isNonBusiness ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <Input label="From" placeholder="e.g. Sriperumbudur hub" value={v.form.from} onChange={v.setFrom} />
                {v.err.from ? (
                  <>
                    <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--status-danger)", fontWeight: "600" }}>Enter where the vehicle starts from.</div>
                  </>
                ) : null}
              </div>
              <div>
                <Input label="To" placeholder="e.g. Ambattur service centre" value={v.form.to} onChange={v.setTo} />
                {v.err.to ? (
                  <>
                    <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--status-danger)", fontWeight: "600" }}>Enter where the vehicle is going.</div>
                  </>
                ) : null}
              </div>
              <div>
                <Input label="KM" placeholder="0" value={v.form.km} onChange={v.setKm} inputMode="numeric" suffix="km" hint="Distance from From to To." />
                {v.err.km ? (
                  <>
                    <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--status-danger)", fontWeight: "600" }}>Enter the distance in km.</div>
                  </>
                ) : null}
              </div>
              <div>
                <Select label="Purpose" placeholder="Select purpose" options={v.reasonOptions} value={v.form.reason} onChange={v.setReason} />
                <div style={{ marginTop: "6px", fontSize: "13px", color: "var(--text-muted)" }}>Purposes are set by Head Office in the Admin Portal.</div>
                {v.err.reason ? (
                  <>
                    <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--status-danger)", fontWeight: "600" }}>Select the purpose of this movement.</div>
                  </>
                ) : null}
              </div>
              <div>
                <Select label="Vehicle number" placeholder="Select vehicle" options={v.vehicleOptions} value={v.form.vehicle} onChange={v.setVehicle} />
                <div style={{ marginTop: "6px", fontSize: "13px", color: "var(--text-muted)" }}>{v.nbVehicleHint}</div>
                {v.err.vehicle ? (
                  <>
                    <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--status-danger)", fontWeight: "600" }}>Select a vehicle.</div>
                  </>
                ) : null}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-heading)" }}>Driver name</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{v.dc.tag}</span>
                </div>
                {v.dc.none ? (
                  <>
                    <div style={{ marginTop: "8px", padding: "14px", border: `2px dashed ${v.dc.border}`, borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--text-muted)" }}>
                      Select a vehicle first. Its mapped driver appears here to confirm.
                    </div>
                  </>
                ) : null}
                {v.dc.has ? (
                  <>
                    <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "12px", padding: "12px", border: `2px solid ${v.dc.border}`, borderRadius: "var(--radius-md)", background: v.dc.bg }}>
                      <div aria-hidden="true" style={{ flex: "none", width: "44px", height: "44px", borderRadius: "50%", background: v.dc.avatarBg, color: v.dc.avatarFg, display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "15px" }}>
                        {v.dc.initials}
                      </div>
                      <div style={{ flex: "1", minWidth: "0" }}>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: v.dc.statusFg }}>
                          {v.dc.status}
                        </div>
                        <div style={{ marginTop: "2px", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "17px", lineHeight: "1.2", color: "var(--text-heading)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {v.dc.name}
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.dc.sub}</div>
                      </div>
                      {v.dc.ask ? (
                        <>
                          <div style={{ flex: "none", display: "flex", gap: "8px" }}>
                            <button onClick={v.rejectDriver} aria-label="Not this driver, choose another" title="Choose another driver" style={{ all: "unset", cursor: "pointer", boxSizing: "border-box", width: "44px", height: "44px", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", border: "2px solid var(--kr-red-600)", background: "#fff", color: "var(--kr-red-600)" }} className="sv-h9">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                                <path d="M6 6l12 12M18 6 6 18" />
                              </svg>
                            </button>
                            <button onClick={v.acceptDriver} aria-label="Confirm this driver" title="Confirm driver" style={{ all: "unset", cursor: "pointer", boxSizing: "border-box", width: "44px", height: "44px", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", border: "2px solid var(--color-brand)", background: "var(--color-brand)", color: "#fff" }} className="sv-h10">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M5 12.5l4.5 4.5L19 7.5" />
                              </svg>
                            </button>
                          </div>
                        </>
                      ) : null}
                      {v.dc.ok ? (
                        <>
                          <button onClick={v.openDrvPick} style={{ all: "unset", cursor: "pointer", flex: "none", boxSizing: "border-box", height: "44px", padding: "0 12px", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "13px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-brand)" }} className="sv-h11">
                            Change
                          </button>
                        </>
                      ) : null}
                    </div>
                  </>
                ) : null}
                {v.dc.empty ? (
                  <>
                    <div style={{ marginTop: "8px", padding: "14px", border: "2px solid var(--color-hazard)", borderRadius: "var(--radius-md)", background: "var(--color-hazard-soft)", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ fontSize: "14px", lineHeight: "1.5", color: "#7A4300" }}>{v.dc.emptyText}</div>
                      <Button variant="secondary" size="md" fullWidth={true} onClick={v.openDrvPick}>Choose driver</Button>
                    </div>
                  </>
                ) : null}
                <div style={{ marginTop: "6px", fontSize: "13px", color: "var(--text-muted)" }}>{v.dc.hint}</div>
                {v.err.driver ? (
                  <>
                    <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--status-danger)", fontWeight: "600" }}>{v.driverErrText}</div>
                  </>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", background: "var(--surface-muted)", borderRadius: "var(--radius-md)", fontSize: "14px" }}>
          <span style={{ color: "var(--text-muted)" }}>Status on save</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: "var(--radius-sm)", background: "var(--st-enroute-bg)", color: "var(--st-enroute-fg)" }}>
            Enroute
          </span>
        </div>
      </div>
      <div style={{ position: "sticky", bottom: "0", marginTop: "auto", padding: "12px 16px 40px", background: "#fff", borderTop: "1px solid var(--border-default)", display: "flex", flexDirection: "column", gap: "8px" }}>
        <Button size="lg" fullWidth={true} onClick={v.reviewOpen} style={v.bigBtn}>Save trip</Button>
        <Button variant="ghost" size="lg" fullWidth={true} onClick={v.askDiscard}>Discard</Button>
      </div>
    </div>
  </>
);

export default OpenTrip;
