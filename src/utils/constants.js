export const APP_CONFIG = {
  APP_NAME: 'Kongunadu Road Lines',
  SUBTITLE: 'Transport Management System',
  VERSION: '1.0.0',
  DATE_FORMAT: 'DD MMM YYYY',
  TIME_FORMAT: 'HH:mm',
  CURRENCY: '₹',
};

export const TRIP_TYPES = {
  BUSINESS: 'Business',
  NON_BUSINESS: 'Non-Business',
};

export const TRIP_STATUS = {
  ENROUTE: 'Enroute',
  CLOSED: 'Closed',
};

export const NON_BUSINESS_REASONS = [
  'Maintenance',
  'Internal Movement',
  'Empty Return',
  'Driver Testing',
  'Yard Shunting',
];

export const EXCEPTION_SEVERITIES = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export const EXCEPTION_TYPES = [
  'Hidden kilometres',
  'Distance variance',
  'Route diversion',
  'GPS failure',
  'Long open trip',
  'Radius breach',
  'Missing attendance',
  'Idle vehicles',
  'Both sources failed',
];

export const ROLES = {
  ADMIN: 'Administrator',
  OWNER: 'Owner (read-only)',
  BILLING: 'Billing (read-only)',
  SUPERVISOR: 'Supervisor',
  DRIVER: 'Driver',
};

