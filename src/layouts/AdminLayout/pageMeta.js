const PAGE_META = [
  ['/admin/dashboard', 'Operations', 'Operations dashboard', 'Live view of trips, exceptions and fleet across branches'],
  ['/admin/trips', 'Operations', 'Trips', 'Monitor and manage all transport trips across branches'],
  ['/admin/exceptions', 'Operations', 'Exceptions & irregularities', 'Review and resolve flagged trip movements'],
  ['/admin/fleet', 'Operations', 'Fleet & GPS monitor', 'Live vehicle positions and GPS health'],
  ['/admin/distance', 'Operations', 'Distance variation', 'Fixed route vs GPS vs odometer distance checks'],
  ['/admin/attendance', 'Operations', 'Attendance', 'Supervisor and driver attendance by branch'],
  ['/admin/masters/branches', 'Masters', 'Branch Master'],
  ['/admin/masters/supervisors', 'Masters', 'Supervisor Master'],
  ['/admin/masters/vehicles', 'Masters', 'Vehicle Master'],
  ['/admin/masters/drivers', 'Masters', 'Driver Master'],
  ['/admin/masters/clients/', 'Client Master', 'Client profile', 'Client details and the customers it delivers to'],
  ['/admin/masters/clients', 'Masters', 'Client Master'],
  ['/admin/masters/locations', 'Masters', 'Loading Location Master'],
  ['/admin/masters/routes', 'Masters', 'Route Master'],
  ['/admin/analytics', 'Insight', 'Analytics'],
  ['/admin/reports', 'Insight', 'Reports & export'],
  ['/admin/device-approvals', 'System', 'Device approvals'],
  ['/admin/users', 'System', 'Users & roles'],
  ['/admin/settings', 'System', 'Settings'],
  ['/admin/notifications', 'Account', 'Notifications', 'Every message and update sent to Head Office'],
  ['/admin/profile', 'Account', 'My profile', 'Your account details, sign-in email and password'],
];

export const getPageMeta = (pathname) => {
  const hit = PAGE_META.find(([path]) => pathname.includes(path)) || PAGE_META[0];
  return { crumb: hit[1], title: hit[2], sub: hit[3] || '' };
};

export default getPageMeta;
