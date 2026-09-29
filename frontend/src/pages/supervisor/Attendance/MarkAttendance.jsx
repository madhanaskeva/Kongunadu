import React from 'react';
import { Button, Select } from '../components/ds';

export const MarkAttendance = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
      <div role="tablist" aria-label="Attendance" style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(0,1fr)", padding: "0 8px", background: "#fff", borderBottom: "1px solid var(--border-default)" }}>
        {(v.attTabs || []).map((tb, tbIdx) => (
          <React.Fragment key={tbIdx}>
            <button role="tab" aria-selected={tb.selected} data-tab={tb.id} onClick={v.setAttTab} style={{ all: "unset", cursor: "pointer", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", height: "50px", padding: "0 6px", textAlign: "center", fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: "700", letterSpacing: "0.03em", textTransform: "uppercase", color: tb.color, borderBottom: `3px solid ${tb.bar}`, marginBottom: "-1px", transition: "color var(--dur-fast)" }} className="sv-h13">
              {tb.label}
            </button>
          </React.Fragment>
        ))}
      </div>
      {v.attTabMark ? (
        <>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <Select label="Vehicle number" placeholder="Select vehicle" options={v.amVehicleOptions} value={v.am.vehicle} onChange={v.setAmVehicle} />
              <div style={{ marginTop: "6px", fontSize: "13px", color: "var(--text-muted)" }}>{v.amVehicleHint}</div>
            </div>
            <div>
              <Select label="Driver name" placeholder="Select driver" options={v.amDriverOptions} value={v.am.driver} onChange={v.setAmDriver} />
              <div style={{ marginTop: "6px", fontSize: "13px", color: "var(--text-muted)" }}>{v.amDriverHint}</div>
            </div>
            <div>
              <Select label="Vehicle status" placeholder="Select status" options={v.amStatusOptions} value={v.am.status} onChange={v.setAmStatus} />
              <div style={{ marginTop: "6px", fontSize: "13px", color: "var(--text-muted)" }}>{v.amStatusHint}</div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Present today · {v.amRowCount}
                </span>
                {v.showAttMonth ? (
                  <>
                    <button onClick={v.goAttMonth} style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-brand)" }}>
                      Month view →
                    </button>
                  </>
                ) : null}
              </div>
              <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ textAlign: "left", background: "var(--surface-muted)" }}>
                      <th style={{ padding: "9px 6px 9px 12px", fontFamily: "var(--font-display)", fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        S.No
                      </th>
                      <th style={{ padding: "9px 6px", fontFamily: "var(--font-display)", fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                        Vehicle number
                      </th>
                      <th style={{ padding: "9px 6px", fontFamily: "var(--font-display)", fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                        Driver name
                      </th>
                      <th style={{ padding: "9px 6px", fontFamily: "var(--font-display)", fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                        Vehicle status
                      </th>
                      <th style={{ padding: "9px 8px 9px 0" }}><span style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)" }}>Remove</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(v.amRows || []).map((r, rIdx) => (
                      <React.Fragment key={rIdx}>
                        <tr style={{ borderTop: "1px solid var(--border-default)", background: r.bg }}>
                          <td style={{ padding: "10px 6px 10px 12px", fontWeight: "700", color: "var(--text-muted)" }}>{r.sno}</td>
                          <td style={{ padding: "10px 6px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-heading)", whiteSpace: "nowrap" }}>{r.vehicle}</td>
                          <td style={{ padding: "10px 6px", fontWeight: "700", color: "var(--text-heading)" }}>{r.name}</td>
                          <td style={{ padding: "10px 6px" }}>
                            <span style={{ display: "inline-flex", fontFamily: "var(--font-display)", fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 6px", borderRadius: "var(--radius-sm)", whiteSpace: "nowrap", background: r.vsBg, color: r.vsFg }}>
                              {r.vehStatus}
                            </span>
                          </td>
                          <td style={{ padding: "6px 8px 6px 0", textAlign: "right" }}>
                            <button data-id={r.id} onClick={v.removeAm} aria-label={r.removeLabel} title="Remove" style={{ all: "unset", cursor: "pointer", width: "32px", height: "32px", boxSizing: "border-box", display: "inline-grid", placeItems: "center", borderRadius: "var(--radius-md)", border: "2px solid var(--kr-red-100)", background: "#fff", color: "var(--kr-red-600)" }} className="sv-h14">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg>
                            </button>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                {v.amRowsEmpty ? (
                  <>
                    <div style={{ padding: "24px 16px", textAlign: "center", fontSize: "14px", color: "var(--text-muted)" }}>
                      No drivers marked yet. Pick a vehicle, driver and vehicle status above.
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          <div style={{ position: "sticky", bottom: "0", marginTop: "auto", padding: "12px 16px 40px", background: "#fff", borderTop: "1px solid var(--border-default)" }}>
            <Button size="lg" fullWidth={true} onClick={v.saveAmEntry} style={v.bigBtn}>Save attendance</Button>
          </div>
        </>
      ) : null}
      {v.attTabMarked ? (
        <>
          <div style={{ padding: "16px 16px 40px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {v.attUnsaved ? (
              <>
                <div role="status" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: "var(--color-hazard-soft)", borderRadius: "var(--radius-md)", fontSize: "14px", lineHeight: "1.45", color: "#7A4300" }}>
                  <span style={{ flex: "1", minWidth: "0" }}>{v.attUnsavedText}</span>
                  <button data-tab="mark" onClick={v.setAttTab} style={{ all: "unset", cursor: "pointer", flex: "none", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Save now →
                  </button>
                </div>
              </>
            ) : null}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)" }}>
                Saved attendance · {v.savedDayCount} days
              </span>
              {v.showAttMonth ? (
                <>
                  <button onClick={v.goAttMonth} style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-brand)" }}>
                    Month view →
                  </button>
                </>
              ) : null}
            </div>
            {(v.savedDays || []).map((sd, sdIdx) => (
              <React.Fragment key={sdIdx}>
                <div style={{ border: "1px solid var(--border-default)", borderLeft: `4px solid ${sd.edge}`, borderRadius: "var(--radius-lg)", overflow: "hidden", background: "#fff" }}>
                  <button data-day={sd.day} onClick={v.toggleAttDay} aria-expanded={sd.expanded} style={{ all: "unset", cursor: "pointer", boxSizing: "border-box", width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "14px" }} className="sv-h2">
                    <span style={{ flex: "1", minWidth: "0", display: "block" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-heading)" }}>{sd.label}</span>
                        {sd.isToday ? (
                          <>
                            <span style={{ fontFamily: "var(--font-display)", fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 6px", borderRadius: "var(--radius-sm)", background: "var(--color-brand)", color: "#fff" }}>
                              Today
                            </span>
                          </>
                        ) : null}
                      </span>
                      <span style={{ display: "block", marginTop: "3px", fontSize: "13px", color: "var(--text-muted)" }}>{sd.savedLine}</span>
                      <span style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 7px", borderRadius: "var(--radius-sm)", background: "var(--st-closed-bg)", color: "var(--st-closed-fg)" }}>
                          {sd.present} present
                        </span>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 7px", borderRadius: "var(--radius-sm)", background: "var(--st-absent-bg)", color: "var(--st-absent-fg)" }}>
                          {sd.absent} absent
                        </span>
                        {sd.unmarked ? (
                          <>
                            <span style={{ fontFamily: "var(--font-display)", fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 7px", borderRadius: "var(--radius-sm)", background: "var(--st-neutral-bg)", color: "var(--st-neutral-fg)" }}>
                              {sd.unmarked} not marked
                            </span>
                          </>
                        ) : null}
                      </span>
                    </span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", transform: `rotate(${sd.rot})`, transition: "transform var(--dur-fast)" }}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {sd.open ? (
                    <>
                      <div style={{ borderTop: "1px solid var(--border-default)" }}>
                        {(sd.rows || []).map((r, rIdx) => (
                          <React.Fragment key={rIdx}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderBottom: "1px solid var(--border-default)" }}>
                              <span style={{ flex: "1", minWidth: "0" }}>
                                <span style={{ display: "block", fontSize: "15px", fontWeight: "700", color: "var(--text-heading)" }}>{r.name}</span>
                                <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{r.vehicle}</span>
                              </span>
                              <span style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: "var(--radius-sm)", background: r.badgeBg, color: r.badgeFg }}>
                                {r.badge}
                              </span>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              </React.Fragment>
            ))}
            {v.savedDaysEmpty ? (
              <>
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "20px", color: "var(--text-heading)" }}>No saved attendance yet</div>
                  <p style={{ margin: "8px 0 0", fontSize: "14px", color: "var(--text-muted)" }}>Mark drivers in Mark new attendance and tap Save attendance.</p>
                </div>
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  </>
);

export default MarkAttendance;
