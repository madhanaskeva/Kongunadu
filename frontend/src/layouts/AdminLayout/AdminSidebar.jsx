import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Badge, Menu } from 'antd';
import {
  Building2, CalendarCheck, ChartColumn, ChevronRight, Contact, FileText, House, MapPin,
  Bell, Route, Settings, ShieldCheck, Truck, User, Users, UsersRound,
} from 'lucide-react';
import { useTMSAdmin } from '../../context/TMSAdminContext';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { moduleForPath } from '../../utils/moduleAccess';
import '../../styles/adminLayout.css';

export const AdminSidebar = ({ onClose }) => {
  const { T, devReqs, drvReqs, approvals, deleted } = useTMSAdmin();
  const tms = T();
  const { can } = useModuleAccess();
  const { pathname } = useLocation();

  const trips = (tms.trips || []).filter(t => !deleted.includes(t.id));
  const enrouteCount = trips.filter(t => t.status === 'Enroute').length;

  const pendingDrivers = [...drvReqs.filter(r => r.status === 'Pending'), ...(tms.drivers || []).filter(d => (approvals[d.id] || d.approval) === 'Pending approval')].length;
  const devPending = devReqs.filter(r => r.status === 'Pending').length;

  const navGroups = [
    {
      group: null,
      items: [{ label: 'Dashboard', path: '/admin/dashboard', icon: House }],
    },
    {
      group: 'Operations',
      items: [
        // Exceptions and Distance Variation are no longer their own destinations:
        // both are read and acted on inside the trip they belong to. The routes stay
        // reachable from the dashboard and from the trip page.
        { label: 'Trips', path: '/admin/trips', icon: Truck, count: enrouteCount, countBg: 'var(--color-brand)' },
        { label: 'Fleet & GPS', path: '/admin/fleet', icon: MapPin },
        { label: 'Attendance', path: '/admin/attendance', icon: CalendarCheck },
      ],
    },
    {
      group: 'Masters',
      items: [
        { label: 'Branches', path: '/admin/masters/branches', icon: Building2 },
        { label: 'Supervisors', path: '/admin/masters/supervisors', icon: Users },
        { label: 'Vehicles', path: '/admin/masters/vehicles', icon: Truck },
        { label: 'Drivers', path: '/admin/masters/drivers', icon: User, count: pendingDrivers || null, countBg: 'var(--kr-saffron-600)' },
        { label: 'Clients', path: '/admin/masters/clients', icon: Contact },
        { label: 'Routes', path: '/admin/masters/routes', icon: Route },
      ],
    },
    {
      group: 'Insight',
      items: [
        { label: 'Analytics', path: '/admin/analytics', icon: ChartColumn },
        { label: 'Reports', path: '/admin/reports', icon: FileText },
      ],
    },
    {
      group: 'System',
      items: [
        { label: 'Device Approvals', path: '/admin/device-approvals', icon: ShieldCheck, count: devPending || null, countBg: 'var(--kr-saffron-600)' },
        { label: 'Users & Roles', path: '/admin/users', icon: UsersRound },
        { label: 'Settings', path: '/admin/settings', icon: Settings },
      { label: 'Notifications', path: '/admin/notifications', icon: Bell },
      ],
    },
  ];

  // Active item: the longest nav path the URL starts with, so
  // /admin/trips/42 still highlights "Trips" (NavLink did the same).
  const visibleGroups = navGroups
    .map(g => ({ ...g, items: g.items.filter(n => can(moduleForPath(n.path))) }))
    .filter(g => g.items.length);
  const activeKey = visibleGroups
    .flatMap(g => g.items.map(n => n.path))
    .filter(p => (p === '/admin/dashboard' ? pathname === p : pathname === p || pathname.startsWith(p + '/')))
    .sort((a, b) => b.length - a.length)[0];

  const toItem = (n) => {
    const Icon = n.icon;
    return {
      key: n.path,
      icon: <Icon size={19} strokeWidth={1.9} />,
      label: (
        <NavLink to={n.path} end={n.path === '/admin/dashboard'} onClick={onClose} className="tms-sidebar-link">
          <span className="tms-sidebar-link-text">{n.label}</span>
          {n.count ? (
            <Badge
              count={n.count}
              color={n.countBg}
              className={`tms-sidebar-badge${n.countBg === 'var(--color-brand)' ? ' tms-sidebar-badge--brand' : ''}`}
            />
          ) : (
            activeKey === n.path && <ChevronRight size={18} />
          )}
        </NavLink>
      ),
    };
  };

  const menuItems = visibleGroups.flatMap((g, gIdx) => [
    ...(gIdx > 0 ? [{ type: 'divider', key: `div-${gIdx}` }] : []),
    g.group
      ? { type: 'group', key: `grp-${gIdx}`, label: g.group, children: g.items.map(toItem) }
      : g.items.map(toItem),
  ].flat());

  return (
    <nav aria-label="Main" className="tms-sidebar">
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={activeKey ? [activeKey] : []}
        items={menuItems}
        className="tms-sidebar-menu"
      />

      <div className="tms-sidebar-footer">
        On every road
        <br />
        with you
        <span />
      </div>
    </nav>
  );
};

export default AdminSidebar;
