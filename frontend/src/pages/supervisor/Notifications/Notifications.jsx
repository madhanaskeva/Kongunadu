import React from 'react';

export const Notifications = ({ v }) => (
  <>
    <div style={{ flex: "1", display: "flex", flexDirection: "column", padding: "16px", gap: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
          <strong style={{ color: "var(--text-heading)" }}>{v.notifUnread}</strong>
          {' '}unread · {v.notifTotal} total
        </span>
        {v.notifHasUnread ? (
          <>
            <button onClick={v.markAllRead} style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-brand)", padding: "8px 0" }}>
              Mark all read
            </button>
          </>
        ) : null}
      </div>
      <div role="tablist" aria-label="Filter notifications" style={{ display: "flex", gap: "6px", overflowX: "auto", margin: "0 -16px", padding: "0 16px 2px", scrollbarWidth: "none" }}>
        {(v.notifFilters || []).map((f, fIdx) => (
          <React.Fragment key={fIdx}>
            <button role="tab" aria-selected={f.on} data-f={f.id} onClick={v.setNotifFilter} style={{ all: "unset", cursor: "pointer", flex: "none", padding: "7px 12px", borderRadius: "var(--radius-pill)", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", border: `1px solid ${f.border}`, background: f.bg, color: f.color }}>
              {f.label}
            </button>
          </React.Fragment>
        ))}
      </div>
      {(v.notifShown || []).map((n, nIdx) => (
        <React.Fragment key={nIdx}>
          <button data-id={n.id} onClick={v.openNotif} style={{ all: "unset", cursor: "pointer", boxSizing: "border-box", width: "100%", display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", border: "1px solid var(--border-default)", borderLeft: `4px solid ${n.edge}`, borderRadius: "var(--radius-lg)", background: n.bg, transition: "box-shadow var(--dur-base)" }} className="sv-h3">
            <span style={{ flex: "none", width: "40px", height: "40px", borderRadius: "var(--radius-md)", display: "grid", placeItems: "center", background: n.iconBg, color: n.iconFg }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={n.icon} />
              </svg>
            </span>
            <span style={{ flex: "1", minWidth: "0", display: "block" }}>
              <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: n.iconFg }}>{n.kindLabel}</span>
                <span style={{ flex: "none", fontSize: "12px", color: "var(--text-muted)" }}>{n.at}</span>
              </span>
              <span style={{ display: "block", marginTop: "3px", fontSize: "15px", lineHeight: "1.3", fontWeight: n.weight, color: "var(--text-heading)" }}>{n.title}</span>
              <span style={{ display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden", marginTop: "3px", fontSize: "13px", lineHeight: "1.45", color: "var(--text-muted)" }}>
                {n.body}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
                {n.from}
                {n.urgent ? (
                  <>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 6px", borderRadius: "var(--radius-sm)", background: "var(--kr-red-100)", color: "var(--kr-red-800)" }}>
                      Urgent
                    </span>
                  </>
                ) : null}
              </span>
            </span>
            {n.unread ? (
              <>
                <span aria-label="Unread" style={{ flex: "none", width: "10px", height: "10px", marginTop: "4px", borderRadius: "50%", background: "var(--kr-red-600)" }} />
              </>
            ) : null}
          </button>
        </React.Fragment>
      ))}
      {v.notifShownEmpty ? (
        <>
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", margin: "0 auto 16px", borderRadius: "50%", background: "var(--surface-muted)", display: "grid", placeItems: "center" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "20px", color: "var(--text-heading)" }}>{v.notifEmptyTitle}</div>
            <p style={{ margin: "8px 0 0", fontSize: "14px", color: "var(--text-muted)" }}>{v.notifEmptyText}</p>
          </div>
        </>
      ) : null}
    </div>
  </>
);

export default Notifications;
