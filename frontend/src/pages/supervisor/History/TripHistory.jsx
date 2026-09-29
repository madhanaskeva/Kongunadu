import React, { useState } from 'react';
import { Eraser, X } from 'lucide-react';
import { Button } from '../components/ds';

export const TripHistory = ({ v }) => {
  const [openCards, setOpenCards] = useState({});

  const toggleCard = (id, e) => {
    e.stopPropagation();
    setOpenCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <>
      <div style={{ flex: "1", display: "flex", flexDirection: "column", padding: "16px", gap: "12px" }}>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Top Row: Vehicle Number & Date Range Filter */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
            {/* Vehicle Number Filter Dropdown */}
            <div style={{ flex: "1", minWidth: "0", position: "relative" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-heading)" }}>
                  Vehicle number
                </span>
                <button
                  type="button"
                  onClick={v.toggleHfVehOpen}
                  aria-label="Filter by vehicle number"
                  aria-expanded={v.hfVehOpen}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    height: "48px",
                    padding: "0 12px",
                    fontFamily: "inherit",
                    fontSize: "15px",
                    fontWeight: "600",
                    color: "var(--text-heading)",
                    background: "#fff",
                    border: `2px solid ${v.hfVehOpen || v.hfVehHasSelection ? "var(--color-brand)" : "var(--border-strong)"}`,
                    borderRadius: "var(--radius-md)",
                    outline: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {v.hfVehTriggerLabel}
                  </span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", transform: v.hfVehOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </label>

              {v.hfVehOpen && (
                <div
                  role="dialog"
                  aria-label="Vehicle checkbox filter"
                  style={{
                    position: "absolute",
                    left: "0",
                    right: "0",
                    top: "calc(100% + 8px)",
                    zIndex: "10",
                    background: "#fff",
                    border: "1px solid var(--border-default)",
                    borderTop: "4px solid var(--color-brand)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow-lg)",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "14px", color: "var(--text-heading)" }}>
                      Filter by Vehicle
                    </span>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={v.selectAllHfVehicles}
                        style={{ all: "unset", cursor: "pointer", fontSize: "12px", fontWeight: "700", color: "var(--color-brand)" }}
                      >
                        Select All
                      </button>
                      <span style={{ color: "var(--border-strong)" }}>|</span>
                      <button
                        type="button"
                        onClick={v.clearHfVehicles}
                        aria-label="Clear vehicle selection"
                        title="Clear"
                        style={{ all: "unset", cursor: "pointer", width: "28px", height: "28px", display: "grid", placeItems: "center", border: "1px solid transparent", borderRadius: "var(--radius-sm)", color: "var(--text-muted)" }}
                        className="sv-h13"
                      >
                        <Eraser size={16} strokeWidth={2} aria-hidden="true" />
                      </button>
                      <span style={{ color: "var(--border-strong)" }}>|</span>
                      <button
                        type="button"
                        onClick={v.toggleHfVehOpen}
                        aria-label="Close vehicle filter"
                        title="Close"
                        style={{ all: "unset", cursor: "pointer", width: "28px", height: "28px", display: "grid", placeItems: "center", border: "1px solid transparent", borderRadius: "var(--radius-sm)", color: "var(--kr-red-600)" }}
                        className="sv-h14"
                      >
                        <X size={16} strokeWidth={2.5} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "200px", overflowY: "auto" }}>
                    {(v.histVehicles || []).map((veh) => {
                      const isChecked = (v.hfSelectedVehicles || []).includes(veh.id);
                      return (
                        <label
                          key={veh.id}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            borderRadius: "var(--radius-md)",
                            background: isChecked ? "var(--color-brand-tint)" : "var(--surface-muted)",
                            border: `1px solid ${isChecked ? "var(--color-brand)" : "transparent"}`,
                            cursor: "pointer",
                            transition: "background 0.15s ease",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => v.toggleHfVehicle(veh.id)}
                              style={{ width: "16px", height: "16px", accentColor: "var(--color-brand)", cursor: "pointer" }}
                            />
                            <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-heading)" }}>
                              {veh.number}
                            </span>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>
                            {veh.count} {veh.count === 1 ? "trip" : "trips"}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Date Range Filter Button */}
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

          {/* Bottom Row: Client Filter Dropdown */}
          <div style={{ position: "relative" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-heading)" }}>
                Client
              </span>
              <button
                type="button"
                onClick={v.toggleHfClientOpen}
                aria-label="Filter by client"
                aria-expanded={v.hfClientOpen}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  height: "48px",
                  padding: "0 12px",
                  fontFamily: "inherit",
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "var(--text-heading)",
                  background: "#fff",
                  border: `2px solid ${v.hfClientOpen || v.hfClientHasSelection ? "var(--color-brand)" : "var(--border-strong)"}`,
                  borderRadius: "var(--radius-md)",
                  outline: "0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {v.hfClientTriggerLabel}
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", transform: v.hfClientOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </label>

            {v.hfClientOpen && (
              <div
                role="dialog"
                aria-label="Client checkbox filter"
                style={{
                  position: "absolute",
                  left: "0",
                  right: "0",
                  top: "calc(100% + 8px)",
                  zIndex: "10",
                  background: "#fff",
                  border: "1px solid var(--border-default)",
                  borderTop: "4px solid var(--color-brand)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-lg)",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "14px", color: "var(--text-heading)" }}>
                    Filter by Client
                  </span>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={v.selectAllHfClients}
                      style={{ all: "unset", cursor: "pointer", fontSize: "12px", fontWeight: "700", color: "var(--color-brand)" }}
                    >
                      Select All
                    </button>
                    <span style={{ color: "var(--border-strong)" }}>|</span>
                    <button
                      type="button"
                      onClick={v.clearHfClients}
                      aria-label="Clear client selection"
                      title="Clear"
                      style={{ all: "unset", cursor: "pointer", width: "28px", height: "28px", display: "grid", placeItems: "center", border: "1px solid transparent", borderRadius: "var(--radius-sm)", color: "var(--text-muted)" }}
                      className="sv-h13"
                    >
                      <Eraser size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                    <span style={{ color: "var(--border-strong)" }}>|</span>
                    <button
                      type="button"
                      onClick={v.toggleHfClientOpen}
                      aria-label="Close client filter"
                      title="Close"
                      style={{ all: "unset", cursor: "pointer", width: "28px", height: "28px", display: "grid", placeItems: "center", border: "1px solid transparent", borderRadius: "var(--radius-sm)", color: "var(--kr-red-600)" }}
                      className="sv-h14"
                    >
                      <X size={16} strokeWidth={2.5} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "200px", overflowY: "auto" }}>
                  {(v.histClients || []).map((cli) => {
                    const isChecked = (v.hfSelectedClients || []).includes(cli.id);
                    return (
                      <label
                        key={cli.id}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderRadius: "var(--radius-md)",
                          background: isChecked ? "var(--color-brand-tint)" : "var(--surface-muted)",
                          border: `1px solid ${isChecked ? "var(--color-brand)" : "transparent"}`,
                          cursor: "pointer",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => v.toggleHfClient(cli.id)}
                            style={{ width: "16px", height: "16px", accentColor: "var(--color-brand)", cursor: "pointer" }}
                          />
                          <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-heading)" }}>
                            {cli.name}
                          </span>
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>
                          {cli.count} {cli.count === 1 ? "trip" : "trips"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {v.hfCalOpen ? (
            <>
              <div role="dialog" aria-label="Closed date range" style={{ position: "absolute", left: "0", right: "0", top: "calc(100% + 8px)", zIndex: "6", background: "#fff", border: "1px solid var(--border-default)", borderTop: "4px solid var(--color-brand)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "17px", color: "var(--text-heading)" }}>Date range</span>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={v.toggleHfCal}
                      aria-label="Close date range filter"
                      title="Close"
                      style={{ all: "unset", cursor: "pointer", width: "28px", height: "28px", display: "grid", placeItems: "center", border: "1px solid transparent", borderRadius: "var(--radius-sm)", color: "var(--kr-red-600)" }}
                      className="sv-h14"
                    >
                      <X size={16} strokeWidth={2.5} aria-hidden="true" />
                    </button>
                  </div>
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
        {/* Group trips by Vehicle Number accordion-wise */}
        {(() => {
          const list = v.histList || [];
          if (!list.length) return null;

          const grouped = list.reduce((acc, t) => {
            const vehNo = t.vehicleNumber || (t.crewLine ? t.crewLine.split(' · ')[0] : t.number);
            if (!acc[vehNo]) {
              acc[vehNo] = {
                vehNo,
                edge: t.edge,
                trips: []
              };
            }
            acc[vehNo].trips.push(t);
            return acc;
          }, {});

          const hasClientFilter = (v.hfSelectedClients && v.hfSelectedClients.length > 0) || v.hfClientHasSelection;

          return Object.values(grouped).map((group) => {
            const isExplicitlyToggled = openCards[group.vehNo] !== undefined;
            const isOpen = isExplicitlyToggled
              ? !!openCards[group.vehNo]
              : (v.hfSelectedVehicles && v.hfSelectedVehicles.length === 1) || Object.keys(grouped).length === 1;
            return (
              <div
                key={group.vehNo}
                style={{
                  border: "1px solid var(--border-default)",
                  borderLeft: `4px solid ${group.edge}`,
                  borderRadius: "var(--radius-lg)",
                  background: "#fff",
                  overflow: "hidden",
                  transition: "box-shadow var(--dur-base)",
                }}
                className="sv-h3"
              >
                {/* Collapsed Vehicle Heading Header */}
                <div
                  onClick={(e) => toggleCard(group.vehNo, e)}
                  style={{
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    userSelect: "none",
                    background: isOpen ? "var(--surface-muted, #f8faf9)" : "#fff",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: "800", color: "var(--text-heading)" }}>
                      {group.vehNo}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={(e) => toggleCard(group.vehNo, e)}
                      aria-label={isOpen ? "Hide details" : "Show details"}
                      aria-expanded={isOpen}
                      style={{
                        all: "unset",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "var(--kr-grey-100, #f1f5f9)",
                        color: "var(--text-heading)",
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s ease",
                        }}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded Section: Shows all trip cards for this vehicle as separate cards */}
                {isOpen && (
                  <div
                    style={{
                      borderTop: "1px solid var(--border-default)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      padding: "12px",
                      background: "var(--surface-muted, #f8faf9)",
                    }}
                  >
                    {group.trips.map((t, idx) => {
                      const displayRoute = hasClientFilter
                        ? t.routeLine
                        : (t.routeWithoutClient || (t.routeLine ? t.routeLine.replace(/^.*? → /, '') : ''));

                      return (
                        <div
                          key={t.id || idx}
                          data-id={t.id}
                          onClick={v.openHistTrip}
                          title="Click to view trip details"
                          style={{
                            padding: "14px",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--border-default)",
                            borderLeft: `4px solid ${t.edge}`,
                            background: "#fff",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            cursor: "pointer",
                            transition: "transform 0.15s ease, box-shadow 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#fff";
                            e.currentTarget.style.boxShadow = "var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1))";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#fff";
                            e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: "700", color: "var(--text-heading)" }}>
                              {t.number}
                            </span>
                            <span style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 8px", borderRadius: "var(--radius-sm)", background: t.badgeBg, color: t.badgeFg }}>
                              {t.badge}
                            </span>
                          </div>

                          <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-heading)" }}>
                            {t.crewLine}
                          </div>
                          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                            {displayRoute}
                          </div>

                          <div style={{ marginTop: "4px", paddingTop: "8px", borderTop: "1px dashed var(--border-default)", display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
                            <span>Closed {t.closedAt}</span>
                            <span style={{ fontWeight: "700", color: "var(--text-heading)" }}>{t.distance}</span>
                          </div>

                          {t.flagged && (
                            <div style={{ marginTop: "4px", fontSize: "12px", fontWeight: "600", color: "var(--st-flagged-fg)" }}>
                              {t.flagLine}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          });
        })()}
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
};

export default TripHistory;
