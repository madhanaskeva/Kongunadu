import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Building2, CalendarCheck, ChartColumn, ChevronRight, Contact, FileText, House, MapPin, MapPinned,
  Route, Settings, ShieldCheck, TrendingUp, TriangleAlert, Truck, User, Users, UsersRound,
} from 'lucide-react';
import { useTMSAdmin } from '../../context/TMSAdminContext';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { moduleForPath } from '../../utils/moduleAccess';
import './adminLayout.css';

export const AdminSidebar = ({ onClose }) => {
  const { T, devReqs, drvReqs, approvals, excOverrides, distReview, deleted } = useTMSAdmin();
  const tms = T();
  const { can } = useModuleAccess();

  const trips = (tms.trips || []).filter(t => !deleted.includes(t.id));
  const enrouteCount = trips.filter(t => t.status === 'Enroute').length;

  const exceptions = (tms.exceptions || []).map(x => ({ ...x, ...(excOverrides[x.id] || {}) }));
  const openExcCount = exceptions.filter(x => x.status !== 'Resolved').length;

  const distThr = 5;
  const distAll = (tms.distanceChecks || []).map(d => {
    const delta = km => km == null ? null : Math.round((km - d.fixedKm) / d.fixedKm * 1000) / 10;
    const g = delta(d.gpsKm), o = delta(d.odoKm);
    const pct = Math.max(Math.abs(g || 0), Math.abs(o || 0));
    const flagged = pct > distThr;
    const review = flagged ? (distReview[d.id] || d.review || 'Open') : 'Within 5%';
    return { ...d, review };
  });
  const distOpenCount = distAll.filter(d => d.review === 'Open').length;

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
        { label: 'Trips', path: '/admin/trips', icon: Truck, count: enrouteCount, countBg: 'var(--color-brand)' },
        { label: 'Exceptions', path: '/admin/exceptions', icon: TriangleAlert, count: openExcCount, countBg: 'var(--kr-red-600)' },
        { label: 'Fleet & GPS', path: '/admin/fleet', icon: MapPin },
        { label: 'Distance Variation', path: '/admin/distance', icon: TrendingUp, count: distOpenCount || null, countBg: 'var(--kr-red-600)' },
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
        { label: 'Loading Locations', path: '/admin/masters/locations', icon: MapPinned },
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
      ],
    },
  ];

  return (
    <nav aria-label="Main" className="tms-sidebar">
      {navGroups
        .map(g => ({ ...g, items: g.items.filter(n => can(moduleForPath(n.path))) }))
        .filter(g => g.items.length)
        .map((g, gIdx) => (
        <section key={gIdx} className="tms-sidebar-group">
          {g.group && <div className="tms-sidebar-group-label">{g.group}</div>}
          {g.items.map((n) => {
            const Icon = n.icon;
            return (
              <NavLink
                key={n.path}
                to={n.path}
                end={n.path === '/admin/dashboard'}
                className={({ isActive }) => `tms-sidebar-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={19} strokeWidth={1.9} className="tms-sidebar-icon" />
                    <span style={{ flex: 1, minWidth: 0 }}>{n.label}</span>
                    {n.count ? (
                      <span className="tms-sidebar-badge" style={{ backgroundColor: n.countBg }}>
                        {n.count}
                      </span>
                    ) : (
                      isActive && <ChevronRight size={18} />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </section>
      ))}

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
