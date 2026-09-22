import React from 'react';
import NotificationCard from '../../../components/common/NotificationCard';
import { useTMSAdmin } from '../../../context/TMSAdminContext';

// Every admin notification, newest first. Opened from "View all" in the header's notifications popup.
export const Notifications = () => {
  const { adminNotifications, adminNotifRead, markAdminNotifsRead } = useTMSAdmin();
  const list = adminNotifications || [];
  const readSet = new Set(adminNotifRead || []);
  const isUnread = n => !readSet.has(n.id);
  const unread = list.filter(isUnread).length;

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', padding: '14px 18px', borderBottom: '1px solid var(--border-default)' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-heading)' }}>{list.length}</strong> {list.length === 1 ? 'notification' : 'notifications'}
          {unread ? ` · ${unread} unread` : ''}
        </div>
        {unread > 0 && markAdminNotifsRead && (
          <button
            type="button"
            onClick={markAdminNotifsRead}
            style={{ all: 'unset', cursor: 'pointer', padding: '0 14px', height: '34px', display: 'inline-flex', alignItems: 'center', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}
          >
            Mark all as read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px' }}>
        {list.map(item => (
          <NotificationCard key={item.id} title={item.title} body={item.body} time={item.time} unread={isUnread(item)} />
        ))}

        {list.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            No notifications yet
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
