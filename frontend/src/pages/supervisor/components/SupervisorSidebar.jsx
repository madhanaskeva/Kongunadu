import React from 'react';
import { Badge, Menu } from 'antd';
import { Bell, CalendarCheck, ChevronRight, CircleCheck, History, House, LogOut, PlusCircle, TriangleAlert, User } from 'lucide-react';
import BrandLogo from '../../../components/common/BrandLogo';
import '../../../styles/adminLayout.css';

// Admin-style sidebar for the signed-in Supervisor App. It only calls the navigation handlers the
// screens already use (goHome, goOpen, …), so every screen and its state behave exactly as before.
// `screens` lists the screens that keep an item highlighted (e.g. the review and done steps of Open Trip).
const NAV_GROUPS = [
  { group: null, items: [{ key: 'home', label: 'Dashboard', icon: House, go: 'goHome', screens: ['home'] }] },
  {
    group: 'Trips',
    items: [
      { key: 'open', label: 'Open Trip', icon: PlusCircle, go: 'goOpen', screens: ['open', 'openReview', 'openDone', 'gpsPerm'] },
      { key: 'closeList', label: 'Close Trip', icon: CircleCheck, go: 'goCloseList', screens: ['closeList', 'close', 'closeReview', 'closeDone'] },
      { key: 'unclosed', label: 'Unclosed Trips', icon: TriangleAlert, go: 'goUnclosed', screens: ['unclosed', 'trip'], count: 'activeCount' },
      { key: 'history', label: 'Trip History', icon: History, go: 'goHistory', screens: ['history', 'histTrip'] },
    ],
  },
  {
    group: 'Drivers',
    items: [
      { key: 'attMark', label: 'Attendance', icon: CalendarCheck, go: 'goAttMark', screens: ['attMark', 'attendance', 'attMonth', 'reqDriver', 'reqDone'] },
    ],
  },
  {
    group: 'Account',
    items: [
      { key: 'notifications', label: 'Notifications', icon: Bell, go: 'goNotifications', screens: ['notifications', 'notifDetail'], count: 'notifUnread', countBg: 'var(--kr-saffron-600)' },
      { key: 'profile', label: 'Profile', icon: User, go: 'goProfile', screens: ['profile'] },
    ],
  },
];

export const SupervisorSidebar = ({ v, onNavigate, showBrand = true }) => {
  const all = NAV_GROUPS.flatMap(g => g.items);
  const active = all.find(n => n.screens.some(sc => v.is[sc]));

  const toItem = (n) => {
    const Icon = n.icon;
    const count = n.count ? v[n.count] : 0;
    return {
      key: n.key,
      icon: <Icon size={19} strokeWidth={1.9} />,
      label: (
        <span className="tms-sidebar-link">
          <span className="tms-sidebar-link-text">{n.label}</span>
          {count ? (
            <Badge count={count} color={n.countBg || 'var(--color-brand)'} className={`tms-sidebar-badge${n.countBg ? '' : ' tms-sidebar-badge--brand'}`} />
          ) : (
            active && active.key === n.key && <ChevronRight size={18} />
          )}
        </span>
      ),
    };
  };

  const items = [
    ...NAV_GROUPS.flatMap((g, gIdx) => [
      ...(gIdx > 0 ? [{ type: 'divider', key: `div-${gIdx}` }] : []),
      ...(g.group ? [{ type: 'group', key: `grp-${gIdx}`, label: g.group, children: g.items.map(toItem) }] : g.items.map(toItem)),
    ]),
    { type: 'divider', key: 'div-out' },
    { key: 'signout', icon: <LogOut size={19} strokeWidth={1.9} />, label: <span className="tms-sidebar-link"><span className="tms-sidebar-link-text">Sign out</span></span> },
  ];

  const onClick = ({ key }) => {
    if (onNavigate) onNavigate();
    if (key === 'signout') { v.onSignOut(); return; }
    const n = all.find(x => x.key === key);
    // Re-clicking the current item does nothing, so an in-progress form is not reset.
    if (!n || (active && active.key === key)) return;
    const fn = v[n.go];
    if (fn) fn();
  };

  return (
    <nav aria-label="Supervisor" className={`tms-sidebar sv-sidebar${showBrand ? ' sv-sidebar--brand' : ''}`}>
      {/* On desktop the logo sits in the top bar; the phone drawer shows it here. */}
      {showBrand ? (
        <div className="sv-sidebar-brand">
          <BrandLogo size={38} />
        </div>
      ) : null}
      <Menu theme="dark" mode="inline" selectedKeys={active ? [active.key] : []} items={items} onClick={onClick} className="tms-sidebar-menu" />
      <div className="tms-sidebar-footer">
        On every road
        <br />
        with you
        <span />
      </div>
    </nav>
  );
};

export default SupervisorSidebar;
