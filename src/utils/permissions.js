export const ROLE_PERMISSIONS = {
  Administrator: {
    trips: 'Full',
    editTrip: true,
    deleteTrip: true,
    masters: 'Full',
    driverApproval: 'Approve',
    exceptions: 'Resolve',
    attendance: 'Full',
    analytics: 'Full + export',
    users: 'Full',
    settings: 'Full',
  },
  'Owner (read-only)': {
    trips: 'View',
    editTrip: false,
    deleteTrip: false,
    masters: 'View',
    driverApproval: 'View',
    exceptions: 'View',
    attendance: 'View',
    analytics: 'Full',
    users: 'No',
    settings: 'View',
  },
  'Billing (read-only)': {
    trips: 'View closed',
    editTrip: false,
    deleteTrip: false,
    masters: 'No',
    driverApproval: 'No',
    exceptions: 'No',
    attendance: 'No',
    analytics: 'Billing only',
    users: 'No',
    settings: 'No',
  },
};

export const hasPermission = (userRole, action) => {
  const perms = ROLE_PERMISSIONS[userRole] || {};
  return !!perms[action];
};

