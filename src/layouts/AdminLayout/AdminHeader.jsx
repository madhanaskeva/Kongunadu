import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ChevronDown, LogOut, Menu, Smartphone } from 'lucide-react';

export const AdminHeader = ({ onOpenNav, narrow }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const displayName = user?.name || 'Head Office Admin';
  const shortName = user?.role === 'Administrator' ? 'Admin' : displayName;
  const nameWords = shortName.split(' ').filter(Boolean);
  const initials = (nameWords.length > 1 ? nameWords[0][0] + nameWords[1][0] : shortName.slice(0, 2)).toUpperCase();

  const handleLogout = () => {
    setAccountOpen(false);
    logout();
    navigate('/');
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

        <div style={{ position: 'relative', flex: 'none' }}>
          <button
            onClick={() => setAccountOpen(!accountOpen)}
            aria-expanded={accountOpen}
            aria-label="Account"
            className="tms-topbar-account"
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
            <ChevronDown size={18} color="var(--text-muted)" />
          </button>

          {accountOpen && (
            <div role="menu" className="tms-topbar-menu">
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>{displayName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {user?.role || 'Administrator'} · {user?.branch || 'All branches'}
                </div>
              </div>
              <button
                role="menuitem"
                onClick={() => {
                  setAccountOpen(false);
                  navigate('/supervisor');
                }}
              >
                <Smartphone size={16} /> Supervisor app
              </button>
              <button role="menuitem" onClick={handleLogout} style={{ color: 'var(--kr-red-700)' }}>
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {accountOpen && (
        <div
          onClick={() => setAccountOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 25 }}
        />
      )}
    </>
  );
};

export default AdminHeader;
