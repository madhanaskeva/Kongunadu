import React from 'react';

/**
 * NotificationCard — Reusable component matching the notification card layout from Image 3.
 *
 * Props:
 *   title: Title string (e.g. "Driver Request", "Maintenance Alert", "Trip Update", "System Notice")
 *   body: Message body text
 *   time: Timestamp string (e.g. "Just now", "2 hrs ago", "4 hrs ago", "1 day ago")
 *   unread: boolean, indicates unread state
 *   onClick: optional click handler
 *   style: optional inline style overrides
 */
export const NotificationCard = ({
  title,
  body,
  time,
  unread = false,
  onClick,
  style = {},
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#ffffff',
        border: unread ? '1.5px solid var(--kr-green-600, #005a36)' : '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        boxShadow: unread ? '0 2px 6px rgba(0, 90, 54, 0.08)' : '0 1px 2px rgba(0, 0, 0, 0.03)',
        transition: 'all 0.15s ease',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        ...style,
      }}
    >
      {unread && (
        <span
          style={{
            position: 'absolute',
            top: '14px',
            right: '16px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--kr-green-700, #005a36)',
          }}
          title="Unread message"
        />
      )}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '15px',
          fontWeight: 700,
          color: '#111827',
          lineHeight: '1.3',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: '#374151',
          lineHeight: '1.45',
        }}
      >
        {body}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          color: '#9ca3af',
          marginTop: '2px',
        }}
      >
        {time}
      </div>
    </div>
  );
};

export default NotificationCard;

