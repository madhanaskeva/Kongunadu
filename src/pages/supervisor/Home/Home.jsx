import React from 'react';
import { ENROUTE_LABEL_LOWER } from '../../../utils/tripStatus';

export const Home = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column", padding: "20px 16px 32px", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>{v.todayLong}</div>
        <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-heading)" }}>{v.activeCount} {v.tripWord} {ENROUTE_LABEL_LOWER}</div>
      </div>
      <button onClick={v.goAttMark} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: "14px", minHeight: "76px", padding: "14px 18px", background: "var(--color-brand-tint)", color: "var(--text-heading)", border: "1px solid var(--border-default)", borderLeft: "6px solid var(--color-brand)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", transition: "background var(--dur-fast), box-shadow var(--dur-fast)" }} className="sv-h3 sv-h7 sv-a4">
        <span style={{ flex: "none", width: "44px", height: "44px", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", background: "var(--color-brand-tint)", color: "var(--color-brand)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="m9 16 2 2 4-4" />
          </svg>
        </span>
        <div style={{ flex: "1", minWidth: "0" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "22px", letterSpacing: "-0.02em", textTransform: "uppercase", color: "var(--text-heading)" }}>
            Attendance
          </div>
          <div style={{ fontSize: "14px", color: "var(--text-body)", marginTop: "2px" }}>{v.attendanceMarked} of {v.attendanceTotal} drivers marked today</div>
        </div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      </button>
      <button onClick={v.goOpen} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", minHeight: "104px", padding: "22px 22px", background: "var(--color-brand)", color: "#fff", borderRadius: "var(--radius-lg)", transition: "background var(--dur-fast)" }} className="sv-h5 sv-a4">
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em", textTransform: "uppercase" }}>Open Trip</div>
          <div style={{ fontSize: "14px", opacity: ".85", marginTop: "4px" }}>Truck loaded. Start a new trip.</div>
        </div>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
      </button>
      <button onClick={v.goUnclosed} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", minHeight: "104px", padding: "22px 22px", background: "var(--color-brand-tint)", color: "var(--text-heading)", borderRadius: "var(--radius-lg)", borderTop: "4px solid var(--color-brand)", transition: "background var(--dur-fast), box-shadow var(--dur-fast)" }} className="sv-h7 sv-a4">
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em", textTransform: "uppercase" }}>Unclosed Trips</div>
          <div style={{ fontSize: "14px", color: "var(--text-body)", marginTop: "4px" }}>{v.unclosedHint}</div>
        </div>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "34px", letterSpacing: "-0.02em", color: v.unclosedCountColor }}>{v.activeCount}</span>
      </button>
      <button onClick={v.goCloseList} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", minHeight: "104px", padding: "22px 22px", background: "var(--color-brand)", color: "#fff", borderRadius: "var(--radius-lg)", transition: "background var(--dur-fast)" }} className="sv-h5 sv-a4">
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em", textTransform: "uppercase" }}>Close Trip</div>
          <div style={{ fontSize: "14px", opacity: ".85", marginTop: "4px" }}>Unloading done. Record closing details.</div>
        </div>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
      </button>
      <button onClick={v.goHistory} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", minHeight: "104px", padding: "22px 22px", background: "var(--color-brand-tint)", color: "var(--text-heading)", border: "2px solid var(--border-strong)", borderRadius: "var(--radius-lg)", transition: "background var(--dur-fast), border-color var(--dur-fast), box-shadow var(--dur-fast)" }} className="sv-h7 sv-a4">
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em", textTransform: "uppercase" }}>Trip History</div>
          <div style={{ fontSize: "14px", color: "var(--text-body)", marginTop: "4px" }}>{v.histHomeHint}</div>
        </div>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l3 2" />
        </svg>
      </button>
    </div>
  </>
);

export default Home;
