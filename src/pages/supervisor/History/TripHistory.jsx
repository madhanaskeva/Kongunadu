import React from 'react';
import { Button, Select } from '../components/ds';

export const TripHistory = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column", padding: "16px", gap: "12px" }}>
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
          <div style={{ flex: "1", minWidth: "0" }}><Select label="Vehicle number" options={v.hfVehicleOptions} value={v.hfVehicleValue} onChange={v.setHfVehicle} /></div>
          <button onClick={v.toggleHfCal} aria-label="Filter by date range" aria-expanded={v.hfCalOpen} title="Date range" style={{ all: "unset", cursor: "pointer", position: "relative", flex: "none", boxSizing: "border-box", width: "52px", height: "48px", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", border: `2px solid ${v.hfCalBorder}`, background: v.hfCalBg, color: v.hfCalFg }} className="sv-h12">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            {v.hfHasRange ? (
              <>
                <span style={{ position: "absolute", top: "-5px", right: "-5px", width: "12px", height: "12px", borderRadius: "50%", background: "var(--kr-red-600)", border: "2px solid #fff" }} />
              </>
            ) : null}
          </button>
        </div>
        {v.hfCalOpen ? (
          <>
            <div role="dialog" aria-label="Closed date range" style={{ position: "absolute", left: "0", right: "0", top: "calc(100% + 8px)", zIndex: "6", background: "#fff", border: "1px solid var(--border-default)", borderTop: "4px solid var(--color-brand)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "17px", color: "var(--text-heading)" }}>Date range</span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>By closed date</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {(v.hfPresets || []).map((pr, prIdx) => (
                  <React.Fragment key={prIdx}>
                    <button data-from={pr.from} data-to={pr.to} onClick={v.pickHfPreset} style={{ all: "unset", cursor: "pointer", padding: "6px 12px", borderRadius: "var(--radius-pill)", fontSize: "13px", fontWeight: "600", border: `1px solid ${pr.border}`, background: pr.bg, color: pr.color }}>
                      {pr.label}
                    </button>
                  </React.Fragment>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "10px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "0" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-heading)" }}>From date</span>
                  <input type="date" value={v.hfDraft.from} onChange={v.setHfFrom} max={v.hfMaxDay} style={{ boxSizing: "border-box", width: "100%", height: "48px", padding: "0 10px", fontFamily: "inherit", fontSize: "16px", color: "var(--text-heading)", background: "#fff", border: `2px solid ${v.hfDateBorder}`, borderRadius: "var(--radius-md)", outline: "0" }} className="sv-f1" />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "0" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-heading)" }}>To date</span>
                  <input type="date" value={v.hfDraft.to} onChange={v.setHfTo} min={v.hfDraft.from} max={v.hfMaxDay} style={{ boxSizing: "border-box", width: "100%", height: "48px", padding: "0 10px", fontFamily: "inherit", fontSize: "16px", color: "var(--text-heading)", background: "#fff", border: `2px solid ${v.hfDateBorder}`, borderRadius: "var(--radius-md)", outline: "0" }} className="sv-f1" />
                </label>
              </div>
              {v.hfErr ? (
                <>
                  <div role="alert" style={{ fontSize: "13px", fontWeight: "600", color: "var(--status-danger)" }}>{v.hfErr}</div>
                </>
              ) : null}
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: "1" }}><Button size="md" fullWidth={true} onClick={v.applyHfRange}>Apply</Button></div>
                <div style={{ flex: "1" }}><Button variant="ghost" size="md" fullWidth={true} onClick={v.clearHfRange}>Clear dates</Button></div>
              </div>
            </div>
          </>
        ) : null}
      </div>
      {v.hfHasRange ? (
        <>
          <div style={{ display: "flex" }}>
            <button onClick={v.clearHfRange} aria-label="Remove date range" style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 10px 6px 12px", borderRadius: "var(--radius-pill)", background: "var(--color-brand-tint)", border: "1px solid var(--color-brand)", fontSize: "13px", fontWeight: "600", color: "var(--kr-green-900)" }}>
              {v.hfRangeLabel}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </>
      ) : null}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
        <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>{v.histCountLine}</span>
        {v.hfAnyFilter ? (
          <>
            <button onClick={v.clearHfAll} style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-brand)" }}>
              Clear filters
            </button>
          </>
        ) : null}
        {v.hfNoFilter ? (
          <>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Newest first</span>
          </>
        ) : null}
      </div>
      {(v.histList || []).map((t, tIdx) => (
        <React.Fragment key={tIdx}>
          <button data-id={t.id} onClick={v.openHistTrip} style={{ all: "unset", cursor: "pointer", display: "block", padding: "16px", border: "1px solid var(--border-default)", borderLeft: `4px solid ${t.edge}`, borderRadius: "var(--radius-lg)", background: "#fff", transition: "box-shadow var(--dur-base)" }} className="sv-h3">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "15px", fontWeight: "700", color: "var(--text-heading)" }}>{t.number}</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 8px", borderRadius: "var(--radius-sm)", background: t.badgeBg, color: t.badgeFg }}>
                {t.badge}
              </span>
            </div>
            <div style={{ marginTop: "6px", fontSize: "15px", fontWeight: "600", color: "var(--text-heading)" }}>{t.crewLine}</div>
            <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>{t.routeLine}</div>
            <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--border-default)", display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13px", color: "var(--text-muted)" }}>
              <span>Closed {t.closedAt}</span>
              <span style={{ fontWeight: "700", color: "var(--text-heading)" }}>{t.distance}</span>
            </div>
            {t.flagged ? (
              <>
                <div style={{ marginTop: "8px", fontSize: "13px", color: "var(--st-flagged-fg)" }}>{t.flagLine}</div>
              </>
            ) : null}
          </button>
        </React.Fragment>
      ))}
      {v.histEmpty ? (
        <>
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", margin: "0 auto 16px", borderRadius: "50%", background: "var(--surface-muted)", display: "grid", placeItems: "center" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 7v5l3 2" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "20px", color: "var(--text-heading)" }}>{v.histEmptyTitle}</div>
            <p style={{ margin: "8px 0 16px", fontSize: "14px", color: "var(--text-muted)" }}>{v.histEmptyText}</p>
            {v.hfAnyFilter ? (
              <>
                <Button variant="secondary" onClick={v.clearHfAll}>Clear filters</Button>
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  </>
);

export default TripHistory;
