import React from 'react';
import { Button } from '../components/ds';

export const NotificationDetail = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ flex: "none", width: "48px", height: "48px", borderRadius: "var(--radius-md)", display: "grid", placeItems: "center", background: v.nd.iconBg, color: v.nd.iconFg }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={v.nd.icon} />
            </svg>
          </span>
          <div style={{ flex: "1", minWidth: "0" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: v.nd.iconFg }}>{v.nd.kindLabel}</div>
            <div style={{ marginTop: "2px", fontSize: "13px", color: "var(--text-muted)" }}>{v.nd.from} · {v.nd.atLong}</div>
          </div>
          {v.nd.urgent ? (
            <>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: "var(--radius-sm)", background: "var(--kr-red-100)", color: "var(--kr-red-800)" }}>
                Urgent
              </span>
            </>
          ) : null}
        </div>
        <h2 style={{ margin: "0", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "22px", lineHeight: "1.2", letterSpacing: "-0.01em", color: "var(--text-heading)" }}>
          {v.nd.title}
        </h2>
        <div style={{ padding: "14px 16px", background: "var(--surface-muted)", borderRadius: "var(--radius-md)", fontSize: "15px", lineHeight: "1.55", color: "var(--text-body)", whiteSpace: "pre-line" }}>
          {v.nd.body}
        </div>
        {v.nd.hasNote ? (
          <>
            <div style={{ padding: "12px 14px", background: "var(--color-hazard-soft)", borderRadius: "var(--radius-md)", fontSize: "14px", lineHeight: "1.5", color: "#7A4300" }}>
              <strong>What to do.</strong>
              {' '}{v.nd.note}
            </div>
          </>
        ) : null}
        {v.nd.hasRows ? (
          <>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
                Details
              </div>
              <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                {(v.nd.rowList || []).map((r, rIdx) => (
                  <React.Fragment key={rIdx}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "11px 14px", borderBottom: "1px solid var(--border-default)", fontSize: "14px" }}>
                      <span style={{ flex: "none", color: "var(--text-muted)" }}>{r.k}</span>
                      <span style={{ fontWeight: "700", color: "var(--text-heading)", textAlign: "right" }}>{r.v}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
      <div style={{ position: "sticky", bottom: "0", marginTop: "auto", padding: "12px 16px 40px", background: "#fff", borderTop: "1px solid var(--border-default)", display: "flex", flexDirection: "column", gap: "8px" }}>
        {v.nd.hasLink ? (
          <>
            <Button size="lg" fullWidth={true} onClick={v.openNotifLink} style={v.bigBtn}>{v.nd.linkLabel}</Button>
          </>
        ) : null}
        {v.nd.canUnread ? (
          <>
            <Button variant="ghost" size="lg" fullWidth={true} onClick={v.markNotifUnread}>Mark as unread</Button>
          </>
        ) : null}
      </div>
    </div>
  </>
);

export default NotificationDetail;
