// Per-user module access for the Admin Portal: which sidebar modules a portal user can open
// and which actions (add / edit / delete / export) they get inside each one.
import { users as seedUsers, supervisors as seedSupervisors } from './tms-data';

export const ACTIONS = [
  ['view', 'View'],
  ['add', 'Add'],
  ['edit', 'Edit'],
  ['delete', 'Delete'],
  ['export', 'Export'],
];

// [key, label, actions that apply, route]
export const MODULE_GROUPS = [
  {
    group: 'Operations',
    items: [
      ['dashboard', 'Dashboard', ['view'], '/admin/dashboard'],
      ['trips', 'Trips', ['view', 'edit', 'delete', 'export', 'verify'], '/admin/trips'],
      ['exceptions', 'Exceptions', ['view', 'edit'], '/admin/exceptions'],
      ['fleet', 'Fleet & GPS', ['view'], '/admin/fleet'],
      ['distance', 'Distance Variation', ['view', 'edit'], '/admin/distance'],
      ['attendance', 'Attendance', ['view', 'edit', 'export'], '/admin/attendance'],
    ],
  },
  {
    group: 'Masters',
    items: [
      ['branches', 'Branches', ['view', 'add', 'edit', 'delete'], '/admin/masters/branches'],
      ['supervisors', 'Supervisors', ['view', 'add', 'edit', 'delete'], '/admin/masters/supervisors'],
      ['vehicles', 'Vehicles', ['view', 'add', 'edit', 'delete'], '/admin/masters/vehicles'],
      ['drivers', 'Drivers', ['view', 'add', 'edit', 'delete'], '/admin/masters/drivers'],
      ['clients', 'Clients & customers', ['view', 'add', 'edit', 'delete'], '/admin/masters/clients'],
      ['locations', 'Loading Locations', ['view', 'add', 'edit', 'delete'], '/admin/masters/locations'],
      ['routes', 'Routes', ['view', 'add', 'edit', 'delete'], '/admin/masters/routes'],
    ],
  },
  {
    group: 'Insight',
    items: [
      ['analytics', 'Analytics', ['view', 'export'], '/admin/analytics'],
      ['reports', 'Reports', ['view', 'export'], '/admin/reports'],
    ],
  },
  {
    group: 'System',
    items: [
      ['deviceApprovals', 'Device Approvals', ['view', 'edit'], '/admin/device-approvals'],
      ['users', 'Users & roles', ['view', 'add', 'edit', 'delete'], '/admin/users'],
      ['settings', 'Settings', ['view', 'edit'], '/admin/settings'],
    ],
  },
];

export const ALL_MODULES = MODULE_GROUPS.flatMap(g => g.items);
export const MODULE_TOTAL = ALL_MODULES.length;

const ACCESS_KEY = 'kr-tms-user-access';
const MASTER_KEY = 'kr-tms-master-edits';
const DELETED_KEY = 'kr-tms-deleted';

const readJson = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch (e) { return fallback; }
};

export const readAccess = () => readJson(ACCESS_KEY, {});
export const writeAccess = v => {
  try { localStorage.setItem(ACCESS_KEY, JSON.stringify(v)); } catch (e) {}
};

export const isAdminRole = role => /^Administrator/.test(role || '');

// Starting access for a role, before any per-user changes
export const roleDefault = role => {
  const out = {};
  ALL_MODULES.forEach(([key, , acts]) => {
    let allowed = [];
    if (isAdminRole(role)) allowed = acts;
    else if (/^Verification/.test(role)) allowed = key === 'trips' ? ['view', 'verify', 'export'] : ['dashboard', 'exceptions', 'distance', 'vehicles', 'drivers', 'analytics', 'reports'].includes(key) ? acts.filter(a => a === 'view' || a === 'export') : [];
    else if (/^Owner/.test(role)) allowed = ['users', 'deviceApprovals', 'settings'].includes(key) ? [] : acts.filter(a => a === 'view' || a === 'export');
    else if (/^Billing/.test(role)) allowed = ['dashboard', 'trips', 'clients', 'analytics', 'reports'].includes(key) ? acts.filter(a => a === 'view' || a === 'export') : [];
    out[key] = allowed;
  });
  return out;
};

export const userAccess = (u, saved = readAccess()) =>
  !u ? {} : isAdminRole(u.role) ? roleDefault(u.role) : saved[u.id] || roleDefault(u.role);

export const accessCount = access => ALL_MODULES.filter(([key]) => (access[key] || []).includes('view')).length;

export const can = (access, key, act = 'view') => (access[key] || []).includes(act);

// Module that owns a URL (longest route prefix wins); null for pages every user may open, like My profile
export const moduleForPath = pathname => {
  const hit = ALL_MODULES.filter(([, , , path]) => pathname === path || pathname.startsWith(path + '/')).sort((a, b) => b[3].length - a[3].length)[0];
  return hit ? hit[0] : null;
};

export const firstAllowedPath = access => {
  const hit = ALL_MODULES.find(([key]) => can(access, key));
  return hit ? hit[3] : null;
};

// Master records as the admin pages show them: seed list + saved adds/edits − deleted
const readMaster = (route, seed) => {
  const e = readJson(MASTER_KEY, {})[route] || {};
  const ed = e.edited || {};
  const gone = new Set(readJson(DELETED_KEY, []));
  return [...(e.added || []), ...seed.map(u => (ed[u.id] ? { ...u, ...ed[u.id] } : u))].filter(u => !gone.has(u.id));
};

export const readPortalUsers = () => readMaster('users', seedUsers);
export const readSupervisors = () => readMaster('supervisors', seedSupervisors);
