import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTMSAdmin } from '../../context/TMSAdminContext';
import { ChevronRight, Menu, Bell } from 'lucide-react';
import SendNoticeModal from '../../components/common/SendNoticeModal';
import AdminNotificationsModal from '../../components/common/AdminNotificationsModal';

export const AdminHeader = ({ onOpenNav, narrow }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const {
    adminNotifOpen,
    setAdminNotifOpen,
    sendNoticeOpen,
    setSendNoticeOpen,
    unreadAdminNotifCount,
  } = useTMSAdmin();

  const onProfile = pathname.startsWith('/admin/profile');
  const displayName = user?.name || 'Head Office Admin';
  const shortName = user?.role === 'Administrator' ? 'Admin' : displayName;
  const nameWords = shortName.split(' ').filter(Boolean);
  const initials = (nameWords.length > 1 ? nameWords[0][0] + nameWords[1][0] : shortName.slice(0, 2)).toUpperCase();

  return (
    <>
      <header className="tms-topbar">
        {narrow && (
          <button onClick={onOpenNav} aria-label="Open menu" className="tms-topbar-icon">
            <Menu size={22} />
          </button>
        )}

        <Link to="/admin/dashboard" className="tms-topbar-brand">
          <img src="/assets/logo-1600.png" alt="Kongunadu Road Lines" />
        </Link>

        {!narrow && (
          <div className="tms-topbar-tagline">
            Safe moves
            <br />
            Stronger tomorrows
          </div>
        )}

        <div className="tms-topbar-scene" aria-hidden="true" />

        {/* Send notice button */}
        <button
          type="button"
          onClick={() => setSendNoticeOpen(true)}
          className="tms-topbar-send-notice-btn"
        >
          Send notice
        </button>

        {/* Notifications icon button */}
        <button
          type="button"
          onClick={() => setAdminNotifOpen(true)}
          className="tms-topbar-icon tms-topbar-notif-btn"
          aria-label={`Notifications${unreadAdminNotifCount > 0 ? `, ${unreadAdminNotifCount} unread` : ''}`}
        >
          <Bell size={20} />
          {unreadAdminNotifCount > 0 && (
            <span className="tms-topbar-notif-badge">
              {unreadAdminNotifCount > 99 ? '99+' : unreadAdminNotifCount}
            </span>
          )}
        </button>

        <div style={{ position: 'relative', flex: 'none' }}>
          <button
            onClick={() => navigate('/admin/profile')}
            aria-label="My profile"
            aria-current={onProfile ? 'page' : undefined}
            className={`tms-topbar-account${onProfile ? ' is-active' : ''}`}
          >
            <span className="tms-topbar-avatar">{initials}</span>
            {!narrow && (
              <span style={{ textAlign: 'left', lineHeight: 1.25 }}>
                <span style={{ display: 'block', fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>
                  {shortName}
                </span>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {user?.branch === 'All branches' || !user?.branch ? 'HO - Chennai' : user.branch}
                </span>
              </span>
            )}
            <ChevronRight size={18} color="var(--text-muted)" />
          </button>
        </div>
      </header>

      {/* Popups */}
      <SendNoticeModal
        isOpen={sendNoticeOpen}
        onClose={() => setSendNoticeOpen(false)}
      />

      <AdminNotificationsModal
        isOpen={adminNotifOpen}
        onClose={() => setAdminNotifOpen(false)}
      />
    </>
  );
};

export default AdminHeader;
