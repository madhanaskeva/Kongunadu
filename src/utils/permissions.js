export const ROLE_PERMISSIONS = {
  Administrator: {
    trips: 'Full',
    editTrip: true,
    deleteTrip: true,
    verifyTrip: true,
    approveEscalation: true,
    masters: 'Full',
    driverApproval: 'Approve',
    exceptions: 'Resolve',
    attendance: 'Full',
    analytics: 'Full + export',
    users: 'Full',
    settings: 'Full',
  },
  // Level 1 of the trip approval workflow: checks supervisor-submitted expenses
  // before Head Office processes the trip. Can approve a clean trip outright and
  // escalate one that fails a check, but cannot edit or delete the record.
  'Verification Team': {
    trips: 'View closed',
    editTrip: false,
    deleteTrip: false,
    verifyTrip: true,
    masters: 'View',
    driverApproval: 'No',
    exceptions: 'View',
    attendance: 'View',
    analytics: 'View',
    users: 'No',
    settings: 'No',
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

