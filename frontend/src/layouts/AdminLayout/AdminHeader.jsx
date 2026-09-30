import React, { useState } from 'react';
import { Avatar, Badge, Button, Dropdown, Flex, Typography } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTMSAdmin } from '../../context/TMSAdminContext';
import { ChevronDown, Menu, Bell, Megaphone, User, LogOut } from 'lucide-react';
import SendNoticeModal from '../../components/common/SendNoticeModal';
import AdminNotificationsModal from '../../components/common/AdminNotificationsModal';
import logoImg from '@/assets/images/logo-1600.png';

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

  const onProfile = pathname.startsWith('/admin/profile');
  const displayName = user?.name || 'Head Office Admin';
  const shortName = user?.role === 'Administrator' ? 'Admin' : displayName;
  const nameWords = shortName.split(' ').filter(Boolean);
  const initials = (nameWords.length > 1 ? nameWords[0][0] + nameWords[1][0] : shortName.slice(0, 2)).toUpperCase();
  const branchLabel = user?.branch === 'All branches' || !user?.branch ? 'HO - Chennai' : user.branch;
  const roleLabel = user?.role || 'Administrator';

  // antd Dropdown handles click-outside / Escape itself
  const profileItems = [
    { key: 'profile', icon: <User size={18} />, label: 'Admin Profile' },
    { key: 'signout', icon: <LogOut size={18} />, label: 'Sign out', danger: true },
  ];

  const onProfileMenu = ({ key }) => {
    setDropdownOpen(false);
    if (key === 'profile') {
      navigate('/admin/profile');
    } else if (key === 'signout') {
      if (logout) logout();
      navigate('/login');
    }
  };

  return (
    <>
    <header className="tms-topbar">
      {narrow && (
        <Button type="text" onClick={onOpenNav} aria-label="Open menu" className="tms-topbar-icon" icon={<Menu size={22} />} />
      )}

      <Link to="/admin/dashboard" className="tms-topbar-brand">
        <img src={logoImg} alt="Kongunadu Road Lines" />
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
      <Flex align="center" gap={12} className="tms-topbar-actions">
        <Button
          type="primary"
          onClick={() => setSendNoticeOpen(true)}
          className="tms-topbar-send-notice-btn"
          aria-label="Send notice"
          icon={<Megaphone size={17} />}
        >
          <span className="tms-topbar-send-notice-label">Send notice</span>
        </Button>

        <Badge count={unreadAdminNotifCount} overflowCount={99} size="small" offset={[-6, 6]}>
          <Button
            type="text"
            onClick={() => setAdminNotifOpen(true)}
            className="tms-topbar-icon"
            aria-label={`Notifications${unreadAdminNotifCount > 0 ? `, ${unreadAdminNotifCount} unread` : ''}`}
            icon={<Bell size={20} />}
          />
        </Badge>

        <Dropdown
          trigger={['click']}
          placement="bottomRight"
          open={dropdownOpen}
          onOpenChange={setDropdownOpen}
          menu={{ items: profileItems, onClick: onProfileMenu }}
          popupRender={(menuNode) => (
            <div className="tms-topbar-dropdown">
              <div className="tms-topbar-dropdown-head">
                <Typography.Text strong>{displayName}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {roleLabel} · {branchLabel === 'HO - Chennai' ? 'All branches' : branchLabel}
                </Typography.Text>
              </div>
              {menuNode}
            </div>
          )}
        >
          <button
            type="button"
            aria-label="My profile menu"
            aria-expanded={dropdownOpen}
            aria-current={onProfile ? 'page' : undefined}
            className={`tms-topbar-account${onProfile || dropdownOpen ? ' is-active' : ''}`}
          >
            <Avatar size={42} className="tms-topbar-avatar">{initials}</Avatar>
            {!narrow && (
              <Flex vertical style={{ textAlign: 'left', lineHeight: 1.25 }}>
                <Typography.Text strong style={{ fontSize: 15 }}>{shortName}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{branchLabel}</Typography.Text>
              </Flex>
            )}
            <ChevronDown
              size={18}
              color="var(--text-muted)"
              style={{ transition: 'transform 0.15s ease', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}
            />
          </button>
        </Dropdown>
      </Flex>
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
