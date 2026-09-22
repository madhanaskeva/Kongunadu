import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTMSAdmin } from '../../context/TMSAdminContext';
import { ChevronDown, Menu, Bell, Megaphone, User, LogOut } from 'lucide-react';
import SendNoticeModal from '../../components/common/SendNoticeModal';
import AdminNotificationsModal from '../../components/common/AdminNotificationsModal';

export const AdminHeader = ({ onOpenNav, narrow }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const {
    adminNotifOpen,
    setAdminNotifOpen,
    sendNoticeOpen,
    setSendNoticeOpen,
    unreadAdminNotifCount,
  } = useTMSAdmin();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const onProfile = pathname.startsWith('/admin/profile');
  const displayName = user?.name || 'Head Office Admin';
  const shortName = user?.role === 'Administrator' ? 'Admin' : displayName;
  const nameWords = shortName.split(' ').filter(Boolean);
  const initials = (nameWords.length > 1 ? nameWords[0][0] + nameWords[1][0] : shortName.slice(0, 2)).toUpperCase();
  const branchLabel = user?.branch === 'All branches' || !user?.branch ? 'HO - Chennai' : user.branch;
  const roleLabel = user?.role || 'Administrator';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    setDropdownOpen(false);
    if (logout) logout();
    navigate('/login');
  };

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

      {/* Topbar Action Items & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 'none' }}>
        {/* Send notice button */}
        <button
          type="button"
          onClick={() => setSendNoticeOpen(true)}
          className="tms-topbar-send-notice-btn"
          aria-label="Send notice"
        >
          <Megaphone size={17} />
          <span className="tms-topbar-send-notice-label">Send notice</span>
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

        {/* Profile Trigger Button & Dropdown Menu */}
        <div ref={dropdownRef} style={{ position: 'relative', flex: 'none' }}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="My profile menu"
            aria-expanded={dropdownOpen}
            aria-current={onProfile ? 'page' : undefined}
            className={`tms-topbar-account${onProfile || dropdownOpen ? ' is-active' : ''}`}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 8px 4px 12px',
              borderRadius: '8px',
              transition: 'background 0.15s ease',
            }}
          >
            <span className="tms-topbar-avatar">{initials}</span>
            {!narrow && (
              <span style={{ textAlign: 'left', lineHeight: 1.25 }}>
                <span style={{ display: 'block', fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>
                  {shortName}
                </span>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {branchLabel}
                </span>
              </span>
            )}
            <ChevronDown
              size={18}
              color="var(--text-muted)"
              style={{
                transition: 'transform 0.15s ease',
                transform: dropdownOpen ? 'rotate(180deg)' : 'none',
              }}
            />
          </button>

          {/* Profile Dropdown Popover */}
          {dropdownOpen && (
            <div
              className="tms-topbar-dropdown"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                zIndex: 100,
                width: '260px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderTop: '4px solid #005A36',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
              }}
            >
              {/* Popover Header */}
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
                  {displayName}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                  {roleLabel} · {branchLabel === 'HO - Chennai' ? 'All branches' : branchLabel}
                </div>
              </div>

              {/* Popover Options */}
              <div style={{ padding: '6px 0' }}>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/admin/profile');
                  }}
                  style={{
                    all: 'unset',
                    boxSizing: 'border-box',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 18px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1f2937',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <User size={18} color="#4b5563" />
                  <span>Admin Profile</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    all: 'unset',
                    boxSizing: 'border-box',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 18px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#dc2626',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={18} color="#dc2626" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
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
