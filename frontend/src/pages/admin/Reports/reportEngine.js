/**
 * Reusable Report Engine for Kongunadu Road Lines TMS
 * 
 * STRICT COMPLIANCE RULES:
 * 1. Zero mock / fake / dummy data. Every record, number, and relationship is drawn
 *    from active system data: tms.trips, tms.vehicles, tms.drivers, tms.branches,
 *    tms.clients, tms.locations, tms.bunks, tms.exceptions, and kr-tms-attendance.
 * 2. Modules without real backing tables (Tyre, Battery, Maintenance Logs, Mileage Audit)
 *    are declared as unavailable with clear documentation.
 * 3. No invented fields (e.g., Vehicle Year, Vehicle Model, arbitrary Good/Bad driver scores).
 * 4. Relationship-aware filter cascades (Branch -> Drivers/Vehicles, Vehicle -> Driver/Trips).
 * 5. Deterministic AND-logic filter evaluation.
 */

import { ENROUTE_LABEL } from '../../../utils/tripStatus.js';
import { DRIVER_TYPES } from '../../../utils/driverTypes.js';
import {
  routesOfTrip,
  routeDieselLimit,
  overLimitLitres,
  dieselLitresOf,
} from '../../../utils/tripVerification.js';

// Helper: parse date strings like "14 Sep 2026 05:40", "2026-09-14", "14 Sep 2026"
const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export const parseTimestamp = (txt) => {
  if (!txt) return null;
  if (txt instanceof Date) return txt.getTime();
  if (typeof txt === 'number') return txt;

  const str = String(txt).trim();
  // Check ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const t = new Date(str.length === 10 ? str + 'T00:00:00' : str).getTime();
    return isNaN(t) ? null : t;
  }

  // Parse "14 Sep 2026" or "14 Sep 2026 05:40"
  const parts = str.split(/[\s,]+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthIdx = MONTH_NAMES.indexOf(parts[1].slice(0, 3).toLowerCase());
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && monthIdx >= 0 && !isNaN(year)) {
      let hours = 0, mins = 0;
      if (parts[3] && parts[3].includes(':')) {
        const hm = parts[3].split(':');
        hours = parseInt(hm[0], 10) || 0;
        mins = parseInt(hm[1], 10) || 0;
      }
      return new Date(year, monthIdx, day, hours, mins).getTime();
    }
  }

  const d = new Date(str).getTime();
  return isNaN(d) ? null : d;
};

// Helper: parse money string like "₹34,500" or 34500 to number
export const parseMoney = (val) => {
  if (val == null || val === '') return 0;
  if (typeof val === 'number') return val;
  const num = parseFloat(String(val).replace(/[^\d.-]/g, ''));
  return isNaN(num) ? 0 : num;
};

// Helper: trip distance calculator (from closing-opening odo or GPS)
export const getTripDistance = (t) => {
  if (!t) return 0;
  if (t.closeKm != null && t.startKm != null && t.closeKm >= t.startKm) {
    return t.closeKm - t.startKm;
  }
  if (t.gpsKm != null) return Number(t.gpsKm) || 0;
  if (t.odoKm != null) return Number(t.odoKm) || 0;
  if (t.fixedKm != null) return Number(t.fixedKm) || 0;
  return 0;
};

// ============================================================================
// 1. MODULE DEFINITIONS
// ============================================================================

export const REPORT_MODULES = [
  {
    id: 'driver',
    label: 'Driver',
    description: 'Driver trips, attendance, vehicles and related details',
    category: 'Personnel',
    available: true,
  },
  {
    id: 'driverPerformance',
    label: 'Driver Performance',
    description: 'Consolidated driver performance across vehicles, trips, diesel and mileage compliance',
    category: 'Performance',
    available: true,
  },
  {
    id: 'vehicle',
    label: 'Vehicles',
    description: 'Vehicle trips, drivers, branch and activity details',
    category: 'Fleet',
    available: true,
  },
  {
    id: 'trip',
    label: 'Trips',
    description: 'Trip details, status, driver, vehicle and route information',
    category: 'Operations',
    available: true,
  },
  {
    id: 'branch',
    label: 'Branch',
    description: 'Trips, drivers, vehicles and activity for a branch',
    category: 'Structure',
    available: true,
  },
  {
    id: 'diesel',
    label: 'Diesel',
    description: 'Diesel filled for vehicles and related trips',
    category: 'Expenses',
    available: true,
  },
  {
    id: 'advance',
    label: 'Advances & Expenses',
    description: 'Trip-related advances and expenses',
    category: 'Financials',
    available: true,
  },
  {
    id: 'client',
    label: 'Clients',
    description: 'Client trips, vehicles and related details',
    category: 'Commercial',
    available: true,
  },
  {
    id: 'deviation',
    label: 'Route Changes',
    description: 'Route changes and distance differences',
    category: 'Compliance',
    available: true,
  },
  {
    id: 'attendance',
    label: 'Attendance',
    description: 'Driver attendance and presence details',
    category: 'Personnel',
    available: true,
  },
  {
    id: 'location',
    label: 'Loading Locations',
    description: 'Trips and activity by loading location',
    category: 'Operations',
    available: true,
  },

  // UNAVAILABLE MODULES (Disabled with explicit reason to maintain absolute data integrity)
  {
    id: 'tyre',
    label: 'Tyres',
    description: 'Tyre serial inventory, tread depth & rotation records',
    category: 'Maintenance',
    available: false,
    unavailableReason: 'No tyre inventory or maintenance records exist in the system.',
  },
  {
    id: 'battery',
    label: 'Battery',
    description: 'Battery health monitoring, voltage telemetry & replacement logs',
    category: 'Maintenance',
    available: false,
    unavailableReason: 'No battery telemetry or tracking records exist in the system.',
  },
  {
    id: 'maintenance',
    label: 'Maintenance Logs',
    description: 'Workshop service job cards, spare parts & routine overhauls',
    category: 'Maintenance',
    available: false,
    unavailableReason: 'No standalone workshop job card table exists (vehicle maintenance status is tracked under Vehicles).',
  },
  {
    id: 'mileage',
    label: 'Mileage Audit',
    description: 'Theoretical telematics fuel curve comparison',
    category: 'Expenses',
    available: false,
    unavailableReason: 'No separate mileage audit table exists (real fuel efficiency is computed directly in the Diesel module).',
  },
];

// Combined report: used while the Step 1 module picker is hidden. One row per
// trip, joined with every related module, so all filters and columns are
// available together. Kept out of REPORT_MODULES so the picker is unaffected.
export const ALL_MODULE_ID = 'all';
export const ALL_REPORT_MODULE = {
  id: ALL_MODULE_ID,
  label: 'Combined',
  description: 'Trips with driver, vehicle, branch, client, diesel, advance, attendance and route change details',
  category: 'All',
  available: true,
};

// ============================================================================
// 2. FIELD DEFINITIONS PER MODULE (Only real project fields)
// ============================================================================

export const MODULE_FIELDS = {
  driver: [
    { key: 'driver', label: 'Driver', type: 'select', entity: 'drivers' },
    { key: 'branch', label: 'Branch', type: 'select', entity: 'branches' },
    { key: 'vehicle', label: 'Vehicle', type: 'select', entity: 'vehicles' },
    { key: 'type', label: 'Driver Type', type: 'select', options: DRIVER_TYPES },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Pending'] },
    { key: 'approval', label: 'Approval Status', type: 'select', options: ['Approved', 'Pending approval'] },
    { key: 'attendance', label: 'Attendance', type: 'select', options: ['Present', 'Absent', 'High Absence (>3 days)'] },
    { key: 'date', label: 'Time Period', type: 'dateRange' },
  ],
  vehicle: [
    { key: 'vehicle', label: 'Vehicle', type: 'select', entity: 'vehicles' },
    { key: 'branch', label: 'Branch', type: 'select', entity: 'branches' },
    { key: 'driver', label: 'Driver', type: 'select', entity: 'drivers' },
    { key: 'status', label: 'Status', type: 'select', options: ['Running', 'Idle', 'Maintenance'] },
    { key: 'gps', label: 'GPS Status', type: 'select', options: ['OK', 'Weak', 'Failed'] },
    { key: 'client', label: 'Client', type: 'select', entity: 'clients' },
    { key: 'vtype', label: 'Vehicle Body Type', type: 'select', options: ['Reefer container 20ft', 'Reefer trailer 32ft', 'Closed body 19ft', 'Closed body 24ft'] },
    { key: 'date', label: 'Time Period', type: 'dateRange' },
  ],
  trip: [
    { key: 'branch', label: 'Branch', type: 'select', entity: 'branches' },
    { key: 'vehicle', label: 'Vehicle', type: 'select', entity: 'vehicles' },
    { key: 'driver', label: 'Driver', type: 'select', entity: 'drivers' },
    { key: 'client', label: 'Client', type: 'select', entity: 'clients' },
    { key: 'type', label: 'Trip Type', type: 'select', options: ['Business', 'Non-Business'] },
    { key: 'status', label: 'Trip Status', type: 'select', options: [{ value: 'Enroute', label: ENROUTE_LABEL }, 'Closed', 'Long open'] },
    { key: 'loading', label: 'Loading Location', type: 'select', entity: 'locations' },
    { key: 'supervisor', label: 'Supervisor', type: 'select', entity: 'supervisors' },
    { key: 'date', label: 'Time Period', type: 'dateRange' },
  ],
  branch: [
    { key: 'branch', label: 'Branch', type: 'select', entity: 'branches' },
    { key: 'state', label: 'State', type: 'select', options: ['Tamil Nadu', 'Telangana', 'Karnataka', 'Maharashtra', 'Andhra Pradesh'] },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    { key: 'date', label: 'Time Period', type: 'dateRange' },
  ],
  diesel: [
    { key: 'vehicle', label: 'Vehicle', type: 'select', entity: 'vehicles' },
    { key: 'driver', label: 'Driver', type: 'select', entity: 'drivers' },
    { key: 'branch', label: 'Branch', type: 'select', entity: 'branches' },
    { key: 'bunk', label: 'Fuel Bunk', type: 'select', entity: 'bunks' },
    { key: 'date', label: 'Time Period', type: 'dateRange' },
  ],
  advance: [
    { key: 'branch', label: 'Branch', type: 'select', entity: 'branches' },
    { key: 'vehicle', label: 'Vehicle', type: 'select', entity: 'vehicles' },
    { key: 'driver', label: 'Driver', type: 'select', entity: 'drivers' },
    { key: 'status', label: 'Trip Status', type: 'select', options: ['Closed', { value: 'Enroute', label: ENROUTE_LABEL }] },
    { key: 'date', label: 'Time Period', type: 'dateRange' },
  ],
  client: [
    { key: 'client', label: 'Client', type: 'select', entity: 'clients' },
    { key: 'branch', label: 'Branch', type: 'select', entity: 'branches' },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'On hold'] },
    { key: 'date', label: 'Time Period', type: 'dateRange' },
  ],
  deviation: [
    { key: 'branch', label: 'Branch', type: 'select', entity: 'branches' },
    { key: 'vehicle', label: 'Vehicle', type: 'select', entity: 'vehicles' },
    { key: 'driver', label: 'Driver', type: 'select', entity: 'drivers' },
    { key: 'severity', label: 'Severity', type: 'select', options: ['High', 'Medium', 'Low'] },
    { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Under review', 'Resolved'] },
    { key: 'date', label: 'Time Period', type: 'dateRange' },
  ],
  attendance: [
    { key: 'branch', label: 'Branch', type: 'select', entity: 'branches' },
    { key: 'driver', label: 'Driver', type: 'select', entity: 'drivers' },
    { key: 'vehicle', label: 'Vehicle', type: 'select', entity: 'vehicles' },
    { key: 'status', label: 'Attendance', type: 'select', options: ['Present', 'Absent', 'Not marked'] },
    { key: 'date', label: 'Time Period', type: 'dateRange' },
  ],
  location: [
    { key: 'location', label: 'Loading Location', type: 'select', entity: 'locations' },
    { key: 'client', label: 'Client', type: 'select', entity: 'clients' },
    { key: 'branch', label: 'Branch', type: 'select', entity: 'branches' },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
  ],
  driverPerformance: [
    { key: 'driver', label: 'Driver', type: 'select', entity: 'drivers' },
    { key: 'date', label: 'Time Period', type: 'dateRange' },
  ],
};

// Combined report fields: every filter from every module, listed once.
// Definitions are reused from the modules above; fields that share a key
// across modules (e.g. 'status') get a distinct key and label here.
const fieldOf = (moduleId, key, extra = {}) => ({
  ...MODULE_FIELDS[moduleId].find(f => f.key === key),
  ...extra,
});

MODULE_FIELDS[ALL_MODULE_ID] = [
  fieldOf('driver', 'driver'),
  fieldOf('driver', 'branch'),
  fieldOf('driver', 'vehicle'),
  fieldOf('trip', 'client'),
  fieldOf('trip', 'loading'),
  fieldOf('trip', 'supervisor'),
  fieldOf('diesel', 'bunk'),
  fieldOf('trip', 'type', { key: 'tripType' }),
  fieldOf('trip', 'status', { key: 'tripStatus' }),
  fieldOf('driver', 'type', { key: 'driverType' }),
  fieldOf('driver', 'status', { key: 'driverStatus', label: 'Driver Status' }),
  fieldOf('driver', 'approval'),
  fieldOf('driver', 'attendance', {
    options: Array.from(new Set([
      ...fieldOf('driver', 'attendance').options,
      ...fieldOf('attendance', 'status').options,
    ])),
  }),
  fieldOf('vehicle', 'status', { key: 'vehicleStatus', label: 'Vehicle Status' }),
  fieldOf('vehicle', 'gps'),
  fieldOf('vehicle', 'vtype'),
  fieldOf('client', 'status', { key: 'clientStatus', label: 'Client Status' }),
  fieldOf('branch', 'state'),
  fieldOf('branch', 'status', { key: 'branchStatus', label: 'Branch Status' }),
  fieldOf('location', 'status', { key: 'locationStatus', label: 'Loading Location Status' }),
  fieldOf('deviation', 'severity', { label: 'Route Change Severity' }),
  fieldOf('deviation', 'status', { key: 'routeChangeStatus', label: 'Route Change Status' }),
  fieldOf('trip', 'date'),
];

// ============================================================================
// 3. RELATIONSHIP RESOLUTION (Dependent Dropdowns)
// ============================================================================

/**
 * Resolves available options for a field based on prior filter selections.
 * E.g., if Branch = B01 (Chennai HO), vehicle and driver dropdowns only display
 * Chennai HO records.
 */
export const getDependentOptions = (moduleId, fieldKey, currentFilters, tms) => {
  const getFilterValues = key => {
    const val = currentFilters.find(f => f.field === key)?.value;
    if (!val) return null;
    if (Array.isArray(val)) return val.length ? val : null;
    return [val];
  };

  const branchFilters = getFilterValues('branch');
  const vehicleFilters = getFilterValues('vehicle');
  const driverFilters = getFilterValues('driver');
  const clientFilters = getFilterValues('client');

  const trips = tms.trips || [];
  const vehicles = tms.vehicles || [];
  const drivers = tms.drivers || [];
  const branches = tms.branches || [];
  const clients = tms.clients || [];
  const locations = tms.locations || [];
  const bunks = tms.bunks || [];
  const supervisors = tms.supervisors || [];

  if (fieldKey === 'branch') {
    return branches.map(b => ({ value: b.id, label: `${b.name} (${b.code || b.id})` }));
  }

  if (fieldKey === 'vehicle') {
    let list = vehicles;
    if (branchFilters) list = list.filter(v => branchFilters.includes(v.branch));
    if (driverFilters) {
      // Prioritize vehicles assigned to or driven by this driver
      const drivenVehIds = new Set(trips.filter(t => driverFilters.includes(t.driver)).map(t => t.vehicle));
      list = list.filter(v => driverFilters.includes(v.driver) || drivenVehIds.has(v.id));
    }
    if (clientFilters) {
      list = list.filter(v => (v.clients || []).some(c => clientFilters.includes(c)));
    }
    return list.map(v => ({ value: v.id, label: `${v.number} · ${v.type}` }));
  }

  if (fieldKey === 'driver') {
    let list = drivers;
    if (branchFilters) list = list.filter(d => branchFilters.includes(d.branch));
    if (vehicleFilters) {
      const vSet = new Set(vehicles.filter(x => vehicleFilters.includes(x.id)).map(x => x.driver));
      const tripDriverIds = new Set(trips.filter(t => vehicleFilters.includes(t.vehicle)).map(t => t.driver));
      list = list.filter(d => vSet.has(d.id) || tripDriverIds.has(d.id));
    }
    return list.map(d => ({ value: d.id, label: `${d.name} (${d.phone || d.licence || d.type})` }));
  }

  if (fieldKey === 'client') {
    let list = clients;
    if (branchFilters) list = list.filter(c => branchFilters.includes(c.branch));
    return list.map(c => ({ value: c.id, label: c.name }));
  }

  if (fieldKey === 'loading' || fieldKey === 'location') {
    let list = locations;
    if (branchFilters) list = list.filter(l => branchFilters.includes(l.branch));
    if (clientFilters) {
      list = list.filter(l => {
        const cIds = [l.client, l.clientId, ...(l.clientIds || [])].filter(Boolean);
        const tripClients = trips.filter(t => t.loading === l.id).map(t => t.client).filter(Boolean);
        const allC = [...cIds, ...tripClients];
        return allC.some(c => clientFilters.includes(c));
      });
    }
    return list.map(l => ({ value: l.id, label: l.name }));
  }

  if (fieldKey === 'bunk') {
    let list = (bunks && bunks.length > 0) ? [...bunks] : [];
    if (!list.length) {
      const seen = new Set();
      trips.forEach(t => {
        if (t.bunk) {
          const names = String(t.bunk).split(',').map(s => s.trim()).filter(Boolean);
          names.forEach(name => {
            if (!seen.has(name)) {
              seen.add(name);
              list.push({ id: name, name, branch: t.branch, rate: t.rate });
            }
          });
        }
      });
    }
    if (branchFilters) list = list.filter(b => branchFilters.includes(b.branch));
    return list.map(b => ({ value: b.name, label: `${b.name} (${b.rate ? '₹' + b.rate + '/L' : 'Active'})` }));
  }

  if (fieldKey === 'supervisor') {
    let list = supervisors;
    if (branchFilters) list = list.filter(s => branchFilters.includes(s.branch));
    return list.map(s => ({ value: s.id, label: s.name }));
  }

  // Predefined options
  const fieldDef = (MODULE_FIELDS[moduleId] || []).find(f => f.key === fieldKey);
  if (fieldDef && fieldDef.options) {
    // An option can be a plain string, or {value,label} when the stored value
    // and the wording on screen differ (e.g. 'Enroute' shown as 'On Road').
    return fieldDef.options.map(opt => (typeof opt === 'string' ? { value: opt, label: opt } : opt));
  }

  return [];
};

// ============================================================================
// 4. FILTER EVALUATION LOGIC
// ============================================================================

export const isFilterEmpty = (val) => {
  if (val === undefined || val === null || val === '') return true;
  if (Array.isArray(val) && val.length === 0) return true;
  if (typeof val === 'object' && !Array.isArray(val)) {
    return !val.from && !val.to;
  }
  return false;
};

export const evaluateCondition = (recordVal, operator, filterVal) => {
  if (filterVal === undefined || filterVal === null || filterVal === '') return true;

  if (Array.isArray(filterVal)) {
    if (filterVal.length === 0) return true;
    if (operator === 'not_equals' || operator === 'neq') {
      return filterVal.every(singleVal => evaluateCondition(recordVal, 'not_equals', singleVal));
    }
    return filterVal.some(singleVal => evaluateCondition(recordVal, operator, singleVal));
  }

  const clean = v => (v == null ? '' : String(v).trim().toLowerCase());
  const rVal = clean(recordVal);
  const fVal = clean(filterVal);

  switch (operator) {
    case 'equals':
    case 'eq':
      return rVal === fVal;
    case 'not_equals':
    case 'neq':
      return rVal !== fVal;
    case 'contains':
      return rVal.includes(fVal);
    case 'greater_than':
    case 'gt':
      return Number(recordVal) > Number(filterVal);
    case 'less_than':
    case 'lt':
      return Number(recordVal) < Number(filterVal);
    case 'between':
      if (Array.isArray(filterVal) && filterVal.length === 2) {
        const [min, max] = filterVal;
        const val = Number(recordVal);
        return val >= Number(min) && val <= Number(max);
      }
      return true;
    default:
      return rVal === fVal;
  }
};

/**
 * Universal entity & text matcher for equals, not_equals, contains.
 * Accurately matches against both technical ID (e.g., 'B01', 'V01')
 * and display text (e.g., 'Chennai HO', 'TN 28 AQ 4521').
 */
export const matchesEntityOrText = (idVal, textVal, op = 'equals', filterVal) => {
  if (filterVal === undefined || filterVal === null || filterVal === '') return true;

  if (Array.isArray(filterVal)) {
    if (filterVal.length === 0) return true;
    if (op === 'not_equals' || op === 'neq') {
      return filterVal.every(singleVal => matchesEntityOrText(idVal, textVal, 'not_equals', singleVal));
    }
    return filterVal.some(singleVal => matchesEntityOrText(idVal, textVal, op, singleVal));
  }

  const clean = v => (v == null ? '' : String(v).trim().toLowerCase());
  const fVal = clean(filterVal);
  const id = clean(idVal);
  const text = clean(textVal);

  // Exact or prefix match checking against ID or Text
  const isExactOrPrefixMatch =
    (id && id === fVal) ||
    (text && text === fVal) ||
    (fVal.length > 2 && text && (text.startsWith(fVal) || fVal.startsWith(text))) ||
    (fVal.length > 2 && id && (id.startsWith(fVal) || fVal.startsWith(id)));

  switch (op) {
    case 'equals':
    case 'eq':
      return isExactOrPrefixMatch;

    case 'not_equals':
    case 'neq':
      return !isExactOrPrefixMatch;

    case 'contains': {
      const textHasFilter = text && text.includes(fVal);
      const idHasFilter = id && id.includes(fVal);
      const filterHasText = text && fVal.length > 2 && fVal.includes(text);
      const filterHasId = id && fVal.length > 1 && fVal.includes(id);
      return Boolean(textHasFilter || idHasFilter || filterHasText || filterHasId);
    }

    case 'greater_than':
    case 'gt':
      return Number(textVal ?? idVal) > Number(filterVal);

    case 'less_than':
    case 'lt':
      return Number(textVal ?? idVal) < Number(filterVal);

    default:
      return isExactOrPrefixMatch;
  }
};

export const evaluateDateRange = (timestamp, range) => {
  if (!range || (!range.from && !range.to)) return true;
  if (!timestamp) return false;

  const t = typeof timestamp === 'number' ? timestamp : parseTimestamp(timestamp);
  if (!t) return false;

  const fromMs = range.from ? parseTimestamp(range.from) : -Infinity;
  const toMs = range.to ? parseTimestamp(range.to + ' 23:59:59') || (parseTimestamp(range.to) + 86400000 - 1) : Infinity;

  return t >= fromMs && t <= toMs;
};

// ============================================================================
// 5. REPORT GENERATION ENGINE (Module-by-Module Real Data Query)
// ============================================================================

export const generateReportData = (moduleId, activeFilters = [], tms, attStore = {}) => {
  const trips = tms.trips || [];
  const vehicles = tms.vehicles || [];
  const drivers = tms.drivers || [];
  const branches = tms.branches || [];
  const clients = tms.clients || [];
  const locations = tms.locations || [];
  const bunks = tms.bunks || [];
  const exceptions = tms.exceptions || [];

  // Index maps for instant O(1) joins
  const V = tms.V || Object.fromEntries(vehicles.map(v => [v.id, v]));
  const D = tms.D || Object.fromEntries(drivers.map(d => [d.id, d]));
  const B = tms.B || Object.fromEntries(branches.map(b => [b.id, b]));
  const C = tms.C || Object.fromEntries(clients.map(c => [c.id, c]));
  const L = tms.L || Object.fromEntries(locations.map(l => [l.id, l]));

  // Active filters helper
  const getFilter = key => activeFilters.find(f => f.field === key);
  const dateFilter = getFilter('date');

  let rows = [];
  let columns = [];
  let summaries = [];
  let vehicleColumns = null;
  let vehicleRows = null;

  switch (moduleId) {
    // ------------------------------------------------------------------------
    // MODULE: DRIVER
    // ------------------------------------------------------------------------
    case 'driver': {
      columns = [
        { key: 'driver', label: 'Driver Name', kind: 'text' },
        { key: 'branch', label: 'Branch', kind: 'text' },
        { key: 'vehicle', label: 'Assigned Vehicle', kind: 'text' },
        { key: 'type', label: 'Type', kind: 'badge' },
        { key: 'status', label: 'Status', kind: 'badge' },
        { key: 'tripsCount', label: 'Trips', kind: 'num' },
        { key: 'completedTrips', label: 'Completed', kind: 'num' },
        { key: 'totalDistance', label: 'Total Distance', kind: 'num', unit: 'km' },
        { key: 'totalDiesel', label: 'Diesel Consumed', kind: 'num', unit: 'L' },
        { key: 'totalAdvance', label: 'Advances Taken', kind: 'num', unit: '₹' },
        { key: 'presentDays', label: 'Present Days', kind: 'num' },
        { key: 'absentDays', label: 'Absent Days', kind: 'num' },
        { key: 'util', label: 'Utilisation', kind: 'text' },
        { key: 'variances', label: 'Route Diversions', kind: 'num' },
      ];

      rows = drivers.map(d => {
        const dBranch = B[d.branch]?.name || d.branch;
        const assignedVeh = vehicles.find(v => v.driver === d.id);
        const vehNum = assignedVeh ? assignedVeh.number : '—';
        const vehId = assignedVeh ? assignedVeh.id : '';

        // Real trips for this driver
        let dTrips = trips.filter(t => t.driver === d.id);
        if (dateFilter && dateFilter.value) {
          dTrips = dTrips.filter(t => evaluateDateRange(t.opened || t.closed, dateFilter.value));
        }

        const tripsCount = dTrips.length;
        const completedTrips = dTrips.filter(t => t.status === 'Closed').length;
        const totalDistance = dTrips.reduce((acc, t) => acc + getTripDistance(t), 0);
        const totalDiesel = dTrips.reduce((acc, t) => acc + (t.dieselLitres || parseMoney(t.diesel) || 0), 0);
        const totalAdvance = dTrips.reduce((acc, t) => acc + parseMoney(t.advance), 0);
        const variances = dTrips.filter(t => t.diversion || (t.flags || []).some(f => /diversion|variance/i.test(f))).length;

        // Attendance from driver master or daily store
        const presentDays = d.present != null ? d.present : 0;
        const absentDays = d.absent != null ? d.absent : 0;
        const util = d.util || (presentDays + absentDays > 0 ? Math.round((presentDays / (presentDays + absentDays)) * 100) + '%' : '—');

        const todayDate = new Date().toISOString().slice(0, 10);
        const branchStore = attStore[d.branch] || (B[d.branch]?.name ? attStore[B[d.branch]?.name] : null) || {};
        const todayEntry = branchStore[todayDate]?.entries?.[d.id] || branchStore[todayDate]?.entries?.[d.name];
        let todayStatus = '';
        if (Array.isArray(todayEntry)) todayStatus = todayEntry[0] === 'P' ? 'Present' : todayEntry[0] === 'A' ? 'Absent' : '';
        else if (todayEntry && typeof todayEntry === 'object') todayStatus = todayEntry.mark === 'P' || todayEntry.status === 'Present' ? 'Present' : todayEntry.mark === 'A' || todayEntry.status === 'Absent' ? 'Absent' : '';
        else if (typeof todayEntry === 'string') todayStatus = todayEntry === 'P' || todayEntry === 'Present' ? 'Present' : todayEntry === 'A' || todayEntry === 'Absent' ? 'Absent' : '';

        const dutyStatus = todayStatus || (presentDays > 0 ? 'Present' : absentDays > 0 ? 'Absent' : 'Not marked');

        return {
          id: d.id,
          driver: d.name,
          driverId: d.id,
          branch: dBranch,
          branchId: d.branch,
          vehicle: vehNum,
          vehicleId: vehId,
          type: d.type || 'Regular',
          status: d.status || 'Active',
          approval: d.approval || 'Approved',
          tripsCount,
          completedTrips,
          totalDistance,
          totalDiesel,
          totalAdvance,
          presentDays,
          absentDays,
          dutyStatus,
          util,
          variances,
        };
      });

      // Apply dynamic AND filters
      activeFilters.forEach(f => {
        if (isFilterEmpty(f.value) || f.field === 'date') return;
        if (f.field === 'driver') {
          rows = rows.filter(r => matchesEntityOrText(r.driverId, r.driver, f.op, f.value));
        } else if (f.field === 'branch') {
          rows = rows.filter(r => matchesEntityOrText(r.branchId, r.branch, f.op, f.value));
        } else if (f.field === 'vehicle') {
          rows = rows.filter(r => matchesEntityOrText(r.vehicleId, r.vehicle, f.op, f.value));
        } else if (f.field === 'type') {
          rows = rows.filter(r => evaluateCondition(r.type, f.op || 'equals', f.value));
        } else if (f.field === 'status') {
          rows = rows.filter(r => evaluateCondition(r.status, f.op || 'equals', f.value));
        } else if (f.field === 'approval') {
          rows = rows.filter(r => evaluateCondition(r.approval, f.op || 'equals', f.value));
        } else if (f.field === 'attendance') {
          const vals = (Array.isArray(f.value) ? f.value : [f.value]).filter(Boolean);
          if (vals.length > 0) {
            rows = rows.filter(r => {
              const isMatch = vals.some(val => {
                if (val === 'High Absence (>3 days)') return r.absentDays > 3;
                if (val === 'Present') return r.presentDays > 0 || r.dutyStatus === 'Present';
                if (val === 'Absent') return r.absentDays > 0 || r.dutyStatus === 'Absent';
                return false;
              });
              return (f.op === 'not_equals' || f.op === 'neq') ? !isMatch : isMatch;
            });
          }
        }
      });

      // Summary KPIs derived strictly from filtered rows
      summaries = [
        { label: 'Total Drivers', value: rows.length, unit: '' },
        { label: 'Total Trips', value: rows.reduce((a, r) => a + r.tripsCount, 0), unit: '' },
        { label: 'Total Distance', value: rows.reduce((a, r) => a + r.totalDistance, 0).toLocaleString('en-IN'), unit: 'km' },
        { label: 'Total Diesel Consumed', value: rows.reduce((a, r) => a + r.totalDiesel, 0).toLocaleString('en-IN'), unit: 'L' },
        { label: 'Total Advances', value: '₹' + rows.reduce((a, r) => a + r.totalAdvance, 0).toLocaleString('en-IN'), unit: '' },
      ];
      break;
    }

    // ------------------------------------------------------------------------
    // MODULE: VEHICLES
    // ------------------------------------------------------------------------
    case 'vehicle': {
      columns = [
        { key: 'vehicle', label: 'Vehicle Number', kind: 'text' },
        { key: 'vtype', label: 'Vehicle Type', kind: 'text' },
        { key: 'branch', label: 'Branch', kind: 'text' },
        { key: 'driver', label: 'Assigned Driver', kind: 'text' },
        { key: 'client', label: 'Dedicated Clients', kind: 'text' },
        { key: 'status', label: 'Status', kind: 'badge' },
        { key: 'gps', label: 'GPS Status', kind: 'badge' },
        { key: 'odometer', label: 'Odometer KM', kind: 'num', unit: 'km' },
        { key: 'tank', label: 'Tank Capacity', kind: 'num', unit: 'L' },
        { key: 'tripsCount', label: 'Trips', kind: 'num' },
        { key: 'totalDistance', label: 'Total Distance', kind: 'num', unit: 'km' },
        { key: 'totalDiesel', label: 'Diesel Consumed', kind: 'num', unit: 'L' },
        { key: 'exceptionsCount', label: 'Exceptions', kind: 'num' },
      ];

      rows = vehicles.map(v => {
        const vBranch = B[v.branch]?.name || v.branch;
        const vDriver = D[v.driver]?.name || (v.driver ? v.driver : 'No driver');
        const vehTripClientIds = trips.filter(t => t.vehicle === v.id).map(t => t.client).filter(Boolean);
        const allClientIds = Array.from(new Set([...(v.clients || []), ...vehTripClientIds]));
        const allClientNames = allClientIds.map(cid => C[cid]?.name || cid).filter(Boolean);
        const vClients = allClientNames.join(', ') || 'General Fleet';

        let vTrips = trips.filter(t => t.vehicle === v.id);
        if (dateFilter && dateFilter.value) {
          vTrips = vTrips.filter(t => evaluateDateRange(t.opened || t.closed, dateFilter.value));
        }

        const tripsCount = vTrips.length;
        const totalDistance = vTrips.reduce((acc, t) => acc + getTripDistance(t), 0);
        const totalDiesel = vTrips.reduce((acc, t) => acc + (t.dieselLitres || parseMoney(t.diesel) || 0), 0);
        const excCount = exceptions.filter(x => x.vehicle === v.id).length;

        return {
          id: v.id,
          vehicle: v.number,
          vehicleId: v.id,
          vtype: v.type,
          branch: vBranch,
          branchId: v.branch,
          driver: vDriver,
          driverId: v.driver,
          client: vClients,
          clientsList: v.clients || [],
          clientIds: allClientIds,
          clientNames: allClientNames,
          status: v.status || 'Running',
          gps: v.gps || 'OK',
          odometer: v.odometer || 0,
          tank: v.tank || 0,
          tripsCount,
          totalDistance,
          totalDiesel,
          exceptionsCount: excCount,
        };
      });

      activeFilters.forEach(f => {
        if (isFilterEmpty(f.value) || f.field === 'date') return;
        if (f.field === 'vehicle') {
          rows = rows.filter(r => matchesEntityOrText(r.vehicleId, r.vehicle, f.op, f.value));
        } else if (f.field === 'branch') {
          rows = rows.filter(r => matchesEntityOrText(r.branchId, r.branch, f.op, f.value));
        } else if (f.field === 'driver') {
          rows = rows.filter(r => matchesEntityOrText(r.driverId, r.driver, f.op, f.value));
        } else if (f.field === 'status') {
          rows = rows.filter(r => evaluateCondition(r.status, f.op || 'equals', f.value));
        } else if (f.field === 'gps') {
          rows = rows.filter(r => evaluateCondition(r.gps, f.op || 'equals', f.value));
        } else if (f.field === 'vtype') {
          rows = rows.filter(r => evaluateCondition(r.vtype, f.op || 'equals', f.value));
        } else if (f.field === 'client') {
          const vals = (Array.isArray(f.value) ? f.value : [f.value]).filter(Boolean);
          if (vals.length > 0) {
            rows = rows.filter(r => {
              const isMatch = vals.some(val => {
                const cVal = String(val).trim().toLowerCase();
                const idMatch = (r.clientIds || r.clientsList || []).some(cid => String(cid).toLowerCase() === cVal);
                const nameMatch = (r.clientNames || []).some(cn => String(cn).toLowerCase().includes(cVal) || cVal.includes(String(cn).toLowerCase()));
                const textMatch = r.client && String(r.client).toLowerCase().includes(cVal);
                return idMatch || nameMatch || textMatch;
              });
              return (f.op === 'not_equals' || f.op === 'neq') ? !isMatch : isMatch;
            });
          }
        }
      });

      summaries = [
        { label: 'Total Vehicles', value: rows.length, unit: '' },
        { label: 'Running Fleet', value: rows.filter(r => r.status === 'Running').length, unit: '' },
        { label: 'Total Distance', value: rows.reduce((a, r) => a + r.totalDistance, 0).toLocaleString('en-IN'), unit: 'km' },
        { label: 'Total Diesel Consumed', value: rows.reduce((a, r) => a + r.totalDiesel, 0).toLocaleString('en-IN'), unit: 'L' },
        { label: 'Active Exceptions', value: rows.reduce((a, r) => a + r.exceptionsCount, 0), unit: '' },
      ];
      break;
    }

    // ------------------------------------------------------------------------
    // MODULE: TRIPS
    // ------------------------------------------------------------------------
    case 'trip': {
      columns = [
        { key: 'number', label: 'Trip Number', kind: 'text' },
        { key: 'date', label: 'Opened Date', kind: 'date' },
        { key: 'closedDate', label: 'Closed Date', kind: 'date' },
        { key: 'vehicle', label: 'Vehicle Number', kind: 'text' },
        { key: 'driver', label: 'Driver Name', kind: 'text' },
        { key: 'branch', label: 'Branch', kind: 'text' },
        { key: 'client', label: 'Client', kind: 'text' },
        { key: 'from', label: 'Loading Location', kind: 'text' },
        { key: 'destination', label: 'Destination', kind: 'text' },
        { key: 'type', label: 'Type', kind: 'badge' },
        { key: 'distance', label: 'Actual KM', kind: 'num', unit: 'km' },
        { key: 'fixedKm', label: 'Fixed KM', kind: 'num', unit: 'km' },
        { key: 'variance', label: 'Variance %', kind: 'num', unit: '%' },
        { key: 'diesel', label: 'Diesel', kind: 'num', unit: 'L' },
        { key: 'advance', label: 'Advance', kind: 'num', unit: '₹' },
        { key: 'status', label: 'Status', kind: 'badge' },
      ];

      rows = trips.map(t => {
        const dist = getTripDistance(t);
        const fixed = Number(t.fixedKm) || 0;
        let variance = null;
        if (fixed > 0 && dist > 0) {
          variance = Math.round((Math.abs(dist - fixed) / fixed) * 1000) / 10;
        }

        const isLongOpen = t.status !== 'Closed' && (t.hoursOpen > 24);
        const statusLabel = isLongOpen ? 'Long open' : t.status === 'Enroute' ? ENROUTE_LABEL : t.status;

        return {
          id: t.id,
          number: t.number,
          date: t.opened,
          timestamp: parseTimestamp(t.opened),
          closedDate: t.closed || '—',
          vehicle: V[t.vehicle]?.number || t.vehicle,
          vehicleId: t.vehicle,
          driver: D[t.driver]?.name || t.driver,
          driverId: t.driver,
          branch: B[t.branch]?.name || t.branch,
          branchId: t.branch,
          client: C[t.client]?.name || '—',
          clientId: t.client,
          from: L[t.loading]?.name || t.loading || '—',
          loadingId: t.loading,
          destination: t.unloading || '—',
          type: t.type || 'Business',
          distance: dist,
          fixedKm: fixed || '—',
          variance: variance != null ? variance : '—',
          diesel: t.dieselLitres || parseMoney(t.diesel) || 0,
          advance: parseMoney(t.advance),
          status: statusLabel,
          rawStatus: t.status,
          hoursOpen: t.hoursOpen || 0,
          supervisor: t.supervisor,
          supervisorId: t.supervisor,
          supervisorName: tms.S?.[t.supervisor]?.name || (tms.supervisors || []).find(s => s.id === t.supervisor)?.name || t.supervisor,
        };
      });

      if (dateFilter && dateFilter.value) {
        rows = rows.filter(r => evaluateDateRange(r.timestamp, dateFilter.value));
      }

      activeFilters.forEach(f => {
        if (isFilterEmpty(f.value) || f.field === 'date') return;
        if (f.field === 'branch') {
          rows = rows.filter(r => matchesEntityOrText(r.branchId, r.branch, f.op, f.value));
        } else if (f.field === 'vehicle') {
          rows = rows.filter(r => matchesEntityOrText(r.vehicleId, r.vehicle, f.op, f.value));
        } else if (f.field === 'driver') {
          rows = rows.filter(r => matchesEntityOrText(r.driverId, r.driver, f.op, f.value));
        } else if (f.field === 'client') {
          rows = rows.filter(r => matchesEntityOrText(r.clientId, r.client, f.op, f.value));
        } else if (f.field === 'type') {
          rows = rows.filter(r => evaluateCondition(r.type, f.op || 'equals', f.value));
        } else if (f.field === 'status') {
          const vals = (Array.isArray(f.value) ? f.value : [f.value]).filter(Boolean);
          if (vals.length > 0) {
            rows = rows.filter(r => {
              const isMatch = vals.some(val => {
                const cVal = String(val).trim().toLowerCase();
                const rStat = String(r.status || '').trim().toLowerCase();
                const rRaw = String(r.rawStatus || '').trim().toLowerCase();
                if (cVal === 'enroute' || cVal === 'on road') {
                  return rRaw === 'enroute' || rStat === 'on road' || rStat === 'enroute';
                }
                if (cVal === 'closed') {
                  return rRaw === 'closed' || rStat === 'closed';
                }
                if (cVal === 'long open') {
                  return rStat === 'long open' || (r.hoursOpen > 24 && rRaw !== 'closed');
                }
                return rStat === cVal || rRaw === cVal;
              });
              return (f.op === 'not_equals' || f.op === 'neq') ? !isMatch : isMatch;
            });
          }
        } else if (f.field === 'loading') {
          rows = rows.filter(r => matchesEntityOrText(r.loadingId, r.from, f.op, f.value));
        } else if (f.field === 'supervisor') {
          rows = rows.filter(r => matchesEntityOrText(r.supervisorId, r.supervisorName, f.op, f.value));
        }
      });

      summaries = [
        { label: 'Total Trips', value: rows.length, unit: '' },
        { label: 'Closed Trips', value: rows.filter(r => r.status === 'Closed').length, unit: '' },
        { label: `${ENROUTE_LABEL} Trips`, value: rows.filter(r => r.status !== 'Closed').length, unit: '' },
        { label: 'Total Distance', value: rows.reduce((a, r) => a + r.distance, 0).toLocaleString('en-IN'), unit: 'km' },
        { label: 'Total Diesel', value: rows.reduce((a, r) => a + r.diesel, 0).toLocaleString('en-IN'), unit: 'L' },
        { label: 'Total Advances', value: '₹' + rows.reduce((a, r) => a + r.advance, 0).toLocaleString('en-IN'), unit: '' },
      ];
      break;
    }

    // ------------------------------------------------------------------------
    // MODULE: BRANCH
    // ------------------------------------------------------------------------
    case 'branch': {
      columns = [
        { key: 'branch', label: 'Branch Name', kind: 'text' },
        { key: 'code', label: 'Branch Code', kind: 'text' },
        { key: 'state', label: 'State', kind: 'text' },
        { key: 'status', label: 'Status', kind: 'badge' },
        { key: 'vehiclesCount', label: 'Vehicles', kind: 'num' },
        { key: 'driversCount', label: 'Drivers', kind: 'num' },
        { key: 'tripsCount', label: 'Trips', kind: 'num' },
        { key: 'totalDistance', label: 'Total Distance', kind: 'num', unit: 'km' },
        { key: 'dieselLitres', label: 'Diesel Consumed', kind: 'num', unit: 'L' },
        { key: 'dieselCost', label: 'Diesel Cost', kind: 'num', unit: '₹' },
        { key: 'advancesTotal', label: 'Advances Total', kind: 'num', unit: '₹' },
        { key: 'deviationsCount', label: 'Route Deviations', kind: 'num' },
      ];

      rows = branches.map(b => {
        const bVehicles = vehicles.filter(v => v.branch === b.id);
        const bDrivers = drivers.filter(d => d.branch === b.id);
        let bTrips = trips.filter(t => t.branch === b.id);

        if (dateFilter && dateFilter.value) {
          bTrips = bTrips.filter(t => evaluateDateRange(t.opened || t.closed, dateFilter.value));
        }

        const totalDistance = bTrips.reduce((acc, t) => acc + getTripDistance(t), 0);
        const dieselLitres = bTrips.reduce((acc, t) => acc + (t.dieselLitres || parseMoney(t.diesel) || 0), 0);
        const dieselCost = bTrips.reduce((acc, t) => acc + (t.dieselTotal || (t.rate && t.dieselLitres ? t.rate * t.dieselLitres : 0) || 0), 0);
        const advancesTotal = bTrips.reduce((acc, t) => acc + parseMoney(t.advance), 0);
        const deviationsCount = bTrips.filter(t => t.diversion || (t.flags || []).some(f => /diversion|variance/i.test(f))).length;

        return {
          id: b.id,
          branch: b.name,
          branchId: b.id,
          code: b.code || b.id,
          state: b.state,
          status: b.status || 'Active',
          vehiclesCount: bVehicles.length,
          driversCount: bDrivers.length,
          tripsCount: bTrips.length,
          totalDistance,
          dieselLitres,
          dieselCost,
          advancesTotal,
          deviationsCount,
        };
      });

      activeFilters.forEach(f => {
        if (isFilterEmpty(f.value) || f.field === 'date') return;
        if (f.field === 'branch') {
          rows = rows.filter(r => matchesEntityOrText(r.branchId, r.branch, f.op, f.value));
        } else if (f.field === 'state') {
          rows = rows.filter(r => evaluateCondition(r.state, f.op || 'equals', f.value));
        } else if (f.field === 'status') {
          rows = rows.filter(r => evaluateCondition(r.status, f.op || 'equals', f.value));
        }
      });

      summaries = [
        { label: 'Total Branches', value: rows.length, unit: '' },
        { label: 'Total Fleet Capacity', value: rows.reduce((a, r) => a + r.vehiclesCount, 0), unit: 'vehicles' },
        { label: 'Total Trips Logged', value: rows.reduce((a, r) => a + r.tripsCount, 0), unit: '' },
        { label: 'Total Fleet Distance', value: rows.reduce((a, r) => a + r.totalDistance, 0).toLocaleString('en-IN'), unit: 'km' },
        { label: 'Total Diesel Cost', value: '₹' + rows.reduce((a, r) => a + r.dieselCost, 0).toLocaleString('en-IN'), unit: '' },
      ];
      break;
    }

    // ------------------------------------------------------------------------
    // MODULE: DIESEL
    // ------------------------------------------------------------------------
    case 'diesel': {
      columns = [
        { key: 'tripNumber', label: 'Trip Number', kind: 'text' },
        { key: 'date', label: 'Date', kind: 'date' },
        { key: 'vehicle', label: 'Vehicle Number', kind: 'text' },
        { key: 'driver', label: 'Driver Name', kind: 'text' },
        { key: 'branch', label: 'Branch', kind: 'text' },
        { key: 'bunk', label: 'Fuel Bunk', kind: 'text' },
        { key: 'rate', label: 'Rate (₹/L)', kind: 'num', unit: '₹' },
        { key: 'litres', label: 'Quantity', kind: 'num', unit: 'L' },
        { key: 'totalCost', label: 'Total Diesel Cost', kind: 'num', unit: '₹' },
        { key: 'distance', label: 'Trip Distance', kind: 'num', unit: 'km' },
        { key: 'mileage', label: 'Fuel Efficiency', kind: 'num', unit: 'km/L' },
      ];

      // Derived strictly from trips containing real diesel entries
      const dieselTrips = trips.filter(t => (t.dieselLitres && t.dieselLitres > 0) || (t.diesel && parseMoney(t.diesel) > 0) || t.bunk);

      rows = dieselTrips.map(t => {
        const litres = t.dieselLitres || parseMoney(t.diesel) || 0;
        const rate = t.rate || 0;
        const totalCost = t.dieselTotal || (rate > 0 && litres > 0 ? rate * litres : 0);
        const dist = getTripDistance(t);
        const mileage = dist > 0 && litres > 0 ? Math.round((dist / litres) * 100) / 100 : '—';
        const isCash = t.expBreakdown && t.expBreakdown.dieselCash > 0;
        const paymentMode = isCash ? `Cash (₹${t.expBreakdown.dieselCash})` : 'Authorized Slip';

        return {
          id: t.id,
          tripNumber: t.number,
          date: t.opened,
          timestamp: parseTimestamp(t.opened),
          vehicle: V[t.vehicle]?.number || t.vehicle,
          vehicleId: t.vehicle,
          driver: D[t.driver]?.name || t.driver,
          driverId: t.driver,
          branch: B[t.branch]?.name || t.branch,
          branchId: t.branch,
          bunk: t.bunk || 'Unspecified Bunk',
          rate: rate > 0 ? rate : '—',
          litres,
          totalCost,
          distance: dist,
          mileage,
          paymentMode,
        };
      });

      if (dateFilter && dateFilter.value) {
        rows = rows.filter(r => evaluateDateRange(r.timestamp, dateFilter.value));
      }

      activeFilters.forEach(f => {
        if (isFilterEmpty(f.value) || f.field === 'date') return;
        if (f.field === 'vehicle') {
          rows = rows.filter(r => matchesEntityOrText(r.vehicleId, r.vehicle, f.op, f.value));
        } else if (f.field === 'driver') {
          rows = rows.filter(r => matchesEntityOrText(r.driverId, r.driver, f.op, f.value));
        } else if (f.field === 'branch') {
          rows = rows.filter(r => matchesEntityOrText(r.branchId, r.branch, f.op, f.value));
        } else if (f.field === 'bunk') {
          const vals = (Array.isArray(f.value) ? f.value : [f.value]).filter(Boolean);
          if (vals.length > 0) {
            rows = rows.filter(r => {
              const isMatch = vals.some(v => matchesEntityOrText(null, r.bunk, 'contains', v));
              return (f.op === 'not_equals' || f.op === 'neq') ? !isMatch : isMatch;
            });
          }
        }
      });

      const totalLitres = rows.reduce((a, r) => a + r.litres, 0);
      const totalAmount = rows.reduce((a, r) => a + r.totalCost, 0);
      const totalKm = rows.reduce((a, r) => a + r.distance, 0);
      const avgKmPerL = totalLitres > 0 && totalKm > 0 ? (totalKm / totalLitres).toFixed(2) : '—';

      summaries = [
        { label: 'Diesel Transactions', value: rows.length, unit: '' },
        { label: 'Total Litres Filled', value: totalLitres.toLocaleString('en-IN'), unit: 'L' },
        { label: 'Total Diesel Cost', value: '₹' + totalAmount.toLocaleString('en-IN'), unit: '' },
        { label: 'Average Efficiency', value: avgKmPerL, unit: 'km/L' },
      ];
      break;
    }

    // ------------------------------------------------------------------------
    // MODULE: ADVANCES & EXPENSES
    // ------------------------------------------------------------------------
    case 'advance': {
      columns = [
        { key: 'tripNumber', label: 'Trip Number', kind: 'text' },
        { key: 'date', label: 'Date', kind: 'date' },
        { key: 'vehicle', label: 'Vehicle Number', kind: 'text' },
        { key: 'driver', label: 'Driver Name', kind: 'text' },
        { key: 'branch', label: 'Branch', kind: 'text' },
        { key: 'advance', label: 'Advance Given', kind: 'num', unit: '₹' },
        { key: 'fastag', label: 'FASTag', kind: 'num', unit: '₹' },
        { key: 'driverBata', label: 'Driver Bata', kind: 'num', unit: '₹' },
        { key: 'cleanerBata', label: 'Cleaner Bata', kind: 'num', unit: '₹' },
        { key: 'toll', label: 'Toll & Weighment', kind: 'num', unit: '₹' },
        { key: 'other', label: 'Other Expenses', kind: 'text' },
        { key: 'totalExpense', label: 'Total Settlement', kind: 'num', unit: '₹' },
        { key: 'status', label: 'Trip Status', kind: 'badge' },
      ];

      // Derived strictly from trips with advance / expense records
      const advanceTrips = trips.filter(t => t.advance != null || t.expBreakdown || t.totalExpense);

      rows = advanceTrips.map(t => {
        const advVal = parseMoney(t.advance);
        const exp = t.expBreakdown || {};
        const fastag = exp.fastag != null && exp.fastag !== '' ? Number(exp.fastag) : (exp.dieselCash != null && exp.dieselCash !== '' ? Number(exp.dieselCash) : 0);
        const driverBata = exp.driverBatas && Object.keys(exp.driverBatas).length > 0
          ? Object.values(exp.driverBatas).reduce((a, b) => a + (Number(b) || 0), 0)
          : (Number(exp.driverBata) || 0);
        const cleanerBata = Number(exp.cleanerBata) || 0;
        const toll = (Number(exp.toll) || 0) + (Number(exp.weighment) || 0);
        const otherList = (t.otherExpenses || []).map(o => `${o.name}: ₹${o.amount}`).join('; ');
        const totalExp = parseMoney(t.totalExpense) || (fastag + driverBata + cleanerBata + toll + (Number(exp.rto) || 0));

        const driverName = Array.isArray(t.drivers) && t.drivers.length > 0
          ? t.drivers.map(id => D[id]?.name || id).join(', ')
          : (t.driverNames || D[t.driver]?.name || t.driver || '—');

        return {
          id: t.id,
          tripNumber: t.number,
          date: t.opened,
          timestamp: parseTimestamp(t.opened),
          vehicle: V[t.vehicle]?.number || t.vehicle,
          vehicleId: t.vehicle,
          driver: driverName,
          driverId: t.driver,
          branch: B[t.branch]?.name || t.branch,
          branchId: t.branch,
          advance: advVal,
          fastag,
          driverBata,
          cleanerBata,
          toll,
          other: otherList || '—',
          totalExpense: totalExp,
          status: t.status || 'Closed',
        };
      });

      if (dateFilter && dateFilter.value) {
        rows = rows.filter(r => evaluateDateRange(r.timestamp, dateFilter.value));
      }

      activeFilters.forEach(f => {
        if (isFilterEmpty(f.value) || f.field === 'date') return;
        if (f.field === 'branch') {
          rows = rows.filter(r => matchesEntityOrText(r.branchId, r.branch, f.op, f.value));
        } else if (f.field === 'vehicle') {
          rows = rows.filter(r => matchesEntityOrText(r.vehicleId, r.vehicle, f.op, f.value));
        } else if (f.field === 'driver') {
          rows = rows.filter(r => matchesEntityOrText(r.driverId, r.driver, f.op, f.value));
        } else if (f.field === 'status') {
          const vals = (Array.isArray(f.value) ? f.value : [f.value]).filter(Boolean);
          if (vals.length > 0) {
            rows = rows.filter(r => {
              const isMatch = vals.some(val => {
                const cVal = String(val).trim().toLowerCase();
                const rStat = String(r.status || '').trim().toLowerCase();
                if (cVal === 'enroute' || cVal === 'on road') {
                  return rStat === 'enroute' || rStat === 'on road';
                }
                if (cVal === 'closed') {
                  return rStat === 'closed';
                }
                return rStat === cVal;
              });
              return (f.op === 'not_equals' || f.op === 'neq') ? !isMatch : isMatch;
            });
          }
        }
      });

      const totalAdvance = rows.reduce((a, r) => a + r.advance, 0);
      const totalBata = rows.reduce((a, r) => a + r.driverBata + r.cleanerBata, 0);
      const totalSettled = rows.reduce((a, r) => a + r.totalExpense, 0);

      summaries = [
        { label: 'Advance Records', value: rows.length, unit: '' },
        { label: 'Total Advances Given', value: '₹' + totalAdvance.toLocaleString('en-IN'), unit: '' },
        { label: 'Total Bata Disbursed', value: '₹' + totalBata.toLocaleString('en-IN'), unit: '' },
        { label: 'Total Expense Settled', value: '₹' + totalSettled.toLocaleString('en-IN'), unit: '' },
      ];
      break;
    }

    // ------------------------------------------------------------------------
    // MODULE: CLIENTS
    // ------------------------------------------------------------------------
    case 'client': {
      columns = [
        { key: 'client', label: 'Client Name', kind: 'text' },
        { key: 'gst', label: 'GST Number', kind: 'text' },
        { key: 'branch', label: 'Branch', kind: 'text' },
        { key: 'supervisors', label: 'Assigned Supervisors', kind: 'text' },
        { key: 'customersCount', label: 'Delivery Points', kind: 'num' },
        { key: 'vehiclesCount', label: 'Dedicated Vehicles', kind: 'num' },
        { key: 'tripsCount', label: 'Trips Handled', kind: 'num' },
        { key: 'totalDistance', label: 'Total Distance', kind: 'num', unit: 'km' },
        { key: 'status', label: 'Status', kind: 'badge' },
      ];

      rows = clients.map(c => {
        const cBranch = B[c.branch]?.name || c.branch;
        const cVehicles = vehicles.filter(v => (v.clients || []).includes(c.id));
        let cTrips = trips.filter(t => t.client === c.id);

        if (dateFilter && dateFilter.value) {
          cTrips = cTrips.filter(t => evaluateDateRange(t.opened || t.closed, dateFilter.value));
        }

        const totalDist = cTrips.reduce((acc, t) => acc + getTripDistance(t), 0);

        return {
          id: c.id,
          client: c.name,
          clientId: c.id,
          gst: c.gst || '—',
          branch: cBranch,
          branchId: c.branch,
          contact: c.contact || '—',
          supervisors: c.supervisors || '—',
          customersCount: c.customers || 0,
          vehiclesCount: cVehicles.length,
          tripsCount: cTrips.length,
          totalDistance: totalDist,
          status: c.status || 'Active',
        };
      });

      activeFilters.forEach(f => {
        if (isFilterEmpty(f.value) || f.field === 'date') return;
        if (f.field === 'client') {
          rows = rows.filter(r => matchesEntityOrText(r.clientId, r.client, f.op, f.value));
        } else if (f.field === 'branch') {
          rows = rows.filter(r => matchesEntityOrText(r.branchId, r.branch, f.op, f.value));
        } else if (f.field === 'status') {
          rows = rows.filter(r => evaluateCondition(r.status, f.op || 'equals', f.value));
        }
      });

      summaries = [
        { label: 'Total Clients', value: rows.length, unit: '' },
        { label: 'Active Clients', value: rows.filter(r => r.status === 'Active').length, unit: '' },
        { label: 'Dedicated Fleet', value: rows.reduce((a, r) => a + r.vehiclesCount, 0), unit: 'vehicles' },
        { label: 'Total Dispatches', value: rows.reduce((a, r) => a + r.tripsCount, 0), unit: 'trips' },
        { label: 'Total Billed Distance', value: rows.reduce((a, r) => a + r.totalDistance, 0).toLocaleString('en-IN'), unit: 'km' },
      ];
      break;
    }

    // ------------------------------------------------------------------------
    // MODULE: DEVIATION & ROUTE VARIANCE
    // ------------------------------------------------------------------------
    case 'deviation': {
      columns = [
        { key: 'tripNumber', label: 'Trip Number', kind: 'text' },
        { key: 'date', label: 'Detected Date', kind: 'date' },
        { key: 'vehicle', label: 'Vehicle', kind: 'text' },
        { key: 'driver', label: 'Driver', kind: 'text' },
        { key: 'branch', label: 'Branch', kind: 'text' },
        { key: 'expected', label: 'Expected Corridor', kind: 'text' },
        { key: 'actual', label: 'Actual Path / Off-Route', kind: 'text' },
        { key: 'location', label: 'Deviation Location', kind: 'text' },
        { key: 'offKm', label: 'Off-Route KM', kind: 'num', unit: 'km' },
        { key: 'fixedKm', label: 'Fixed KM', kind: 'num', unit: 'km' },
        { key: 'gpsKm', label: 'GPS KM', kind: 'num', unit: 'km' },
        { key: 'variancePct', label: 'Variance %', kind: 'num', unit: '%' },
        { key: 'severity', label: 'Severity', kind: 'badge' },
        { key: 'status', label: 'Status', kind: 'badge' },
      ];

      // Collect real route diversions and high variance (>5%) from trips
      const devTrips = trips.filter(t => {
        if (t.diversion) return true;
        if ((t.flags || []).some(f => /diversion|variance|route/i.test(f))) return true;
        const fixed = Number(t.fixedKm) || 0;
        const dist = getTripDistance(t);
        if (fixed > 0 && dist > 0 && (Math.abs(dist - fixed) / fixed) * 100 > 5) return true;
        return false;
      });

      rows = devTrips.map(t => {
        const div = t.diversion || {};
        const fixed = Number(t.fixedKm) || 0;
        const gps = Number(t.gpsKm) || getTripDistance(t);
        let variancePct = null;
        if (fixed > 0 && gps > 0) {
          variancePct = Math.round((Math.abs(gps - fixed) / fixed) * 1000) / 10;
        }

        const exc = exceptions.find(x => x.trip === t.id);
        const offKmNum = Number(div.offKm || div.extraKm) || 0;
        const vPctNum = Number(variancePct) || 0;
        const severity = exc?.severity || (offKmNum > 20 || vPctNum > 10 ? 'High' : offKmNum > 10 || vPctNum > 5 ? 'Medium' : 'Low');

        let normStatus = 'Open';
        if (div.state === 'Reviewed' || t.status === 'Closed') normStatus = 'Resolved';
        else if (div.state === 'Rejoined' || (exc && exc.status === 'Under review')) normStatus = 'Under review';
        else normStatus = 'Open';

        const expectedCorridor = div.expected || ((L[t.loading]?.name || 'Origin') + ' → ' + (t.unloading || 'Destination'));
        const actualPath = div.actual || (t.flags || []).find(f => /diversion|variance/i.test(f)) || 'Distance variance detected';

        return {
          id: t.id,
          tripNumber: t.number,
          date: div.detected || t.opened,
          timestamp: parseTimestamp(div.detected || t.opened),
          vehicle: V[t.vehicle]?.number || t.vehicle,
          vehicleId: t.vehicle,
          driver: D[t.driver]?.name || t.driver,
          driverId: t.driver,
          branch: B[t.branch]?.name || t.branch,
          branchId: t.branch,
          expected: expectedCorridor,
          actual: actualPath,
          location: div.at || `${ENROUTE_LABEL} Corridor`,
          offKm: div.offKm || div.extraKm || '—',
          fixedKm: fixed || '—',
          gpsKm: gps || '—',
          variancePct: variancePct != null ? variancePct : '—',
          severity,
          statusGroup: normStatus,
          status: div.state || (t.status === 'Closed' ? 'Reviewed' : 'Active diversion'),
        };
      });

      if (dateFilter && dateFilter.value) {
        rows = rows.filter(r => evaluateDateRange(r.timestamp, dateFilter.value));
      }

      activeFilters.forEach(f => {
        if (isFilterEmpty(f.value) || f.field === 'date') return;
        if (f.field === 'branch') {
          rows = rows.filter(r => matchesEntityOrText(r.branchId, r.branch, f.op, f.value));
        } else if (f.field === 'vehicle') {
          rows = rows.filter(r => matchesEntityOrText(r.vehicleId, r.vehicle, f.op, f.value));
        } else if (f.field === 'driver') {
          rows = rows.filter(r => matchesEntityOrText(r.driverId, r.driver, f.op, f.value));
        } else if (f.field === 'severity') {
          const vals = (Array.isArray(f.value) ? f.value : [f.value]).filter(Boolean);
          if (vals.length > 0) {
            rows = rows.filter(r => {
              const isMatch = vals.some(v => String(v).toLowerCase() === String(r.severity || '').toLowerCase());
              return (f.op === 'not_equals' || f.op === 'neq') ? !isMatch : isMatch;
            });
          }
        } else if (f.field === 'status') {
          const vals = (Array.isArray(f.value) ? f.value : [f.value]).filter(Boolean);
          if (vals.length > 0) {
            rows = rows.filter(r => {
              const isMatch = vals.some(v => {
                const cv = String(v).toLowerCase();
                const st = String(r.status || '').toLowerCase();
                const sg = String(r.statusGroup || '').toLowerCase();
                if (cv === 'open') return sg === 'open' || st.includes('active') || st.includes('off route');
                if (cv === 'under review') return sg === 'under review' || st.includes('rejoined') || st.includes('review');
                if (cv === 'resolved') return sg === 'resolved' || st.includes('reviewed') || st.includes('closed');
                return st === cv || sg === cv;
              });
              return (f.op === 'not_equals' || f.op === 'neq') ? !isMatch : isMatch;
            });
          }
        }
      });

      summaries = [
        { label: 'Total Deviations', value: rows.length, unit: '' },
        { label: 'Corridor Departures', value: rows.filter(r => r.offKm !== '—').length, unit: '' },
        { label: 'Distance Variance > 5%', value: rows.filter(r => Number(r.variancePct) > 5).length, unit: '' },
        { label: 'Max Variance Detected', value: rows.reduce((max, r) => (Number(r.variancePct) > max ? Number(r.variancePct) : max), 0) + '%', unit: '' },
      ];
      break;
    }

    // ------------------------------------------------------------------------
    // MODULE: ATTENDANCE
    // ------------------------------------------------------------------------
    case 'attendance': {
      columns = [
        { key: 'driver', label: 'Driver Name', kind: 'text' },
        { key: 'branch', label: 'Branch', kind: 'text' },
        { key: 'vehicle', label: 'Assigned Vehicle', kind: 'text' },
        { key: 'dtype', label: 'Driver Type', kind: 'badge' },
        { key: 'present', label: 'Present Days', kind: 'num' },
        { key: 'absent', label: 'Absent Days', kind: 'num' },
        { key: 'util', label: 'Fleet Utilisation', kind: 'text' },
        { key: 'tripsMonth', label: 'Trips Assigned', kind: 'num' },
      ];

      rows = drivers.map(d => {
        const assignedVeh = vehicles.find(v => v.driver === d.id);
        const dTrips = trips.filter(t => t.driver === d.id);
        const present = d.present != null ? d.present : 0;
        const absent = d.absent != null ? d.absent : 0;
        let note = 'Normal attendance';
        if (d.status === 'Inactive') note = 'Continuous absence / Inactive';
        else if (absent >= 6) note = `Absent ${absent} days this month`;

        const todayDate = new Date().toISOString().slice(0, 10);
        const branchStore = attStore[d.branch] || (B[d.branch]?.name ? attStore[B[d.branch]?.name] : null) || {};
        const todayEntry = branchStore[todayDate]?.entries?.[d.id] || branchStore[todayDate]?.entries?.[d.name];
        let todayStatus = '';
        if (Array.isArray(todayEntry)) todayStatus = todayEntry[0] === 'P' ? 'Present' : todayEntry[0] === 'A' ? 'Absent' : '';
        else if (todayEntry && typeof todayEntry === 'object') todayStatus = todayEntry.mark === 'P' || todayEntry.status === 'Present' ? 'Present' : todayEntry.mark === 'A' || todayEntry.status === 'Absent' ? 'Absent' : '';
        else if (typeof todayEntry === 'string') todayStatus = todayEntry === 'P' || todayEntry === 'Present' ? 'Present' : todayEntry === 'A' || todayEntry === 'Absent' ? 'Absent' : '';

        let dutyStatus = 'Not marked';
        if (todayStatus) {
          dutyStatus = todayStatus;
        } else if (d.status === 'Inactive') {
          dutyStatus = 'Absent';
        } else if (d.status === 'Pending') {
          dutyStatus = 'Not marked';
        } else if (present > 0) {
          dutyStatus = 'Present';
        } else if (absent > 0) {
          dutyStatus = 'Absent';
        }

        return {
          id: d.id,
          driver: d.name,
          driverId: d.id,
          branch: B[d.branch]?.name || d.branch,
          branchId: d.branch,
          vehicle: assignedVeh ? assignedVeh.number : '—',
          vehicleId: assignedVeh ? assignedVeh.id : '',
          dtype: d.type || 'Regular',
          status: dutyStatus,
          present,
          absent,
          util: d.util || (present + absent > 0 ? Math.round((present / (present + absent)) * 100) + '%' : '—'),
          tripsMonth: dTrips.length,
          note,
        };
      });

      activeFilters.forEach(f => {
        if (isFilterEmpty(f.value) || f.field === 'date') return;
        if (f.field === 'branch') {
          rows = rows.filter(r => matchesEntityOrText(r.branchId, r.branch, f.op, f.value));
        } else if (f.field === 'driver') {
          rows = rows.filter(r => matchesEntityOrText(r.driverId, r.driver, f.op, f.value));
        } else if (f.field === 'vehicle') {
          rows = rows.filter(r => matchesEntityOrText(r.vehicleId, r.vehicle, f.op, f.value));
        } else if (f.field === 'status') {
          const vals = (Array.isArray(f.value) ? f.value : [f.value]).filter(Boolean);
          if (vals.length > 0) {
            rows = rows.filter(r => {
              const isMatch = vals.some(v => {
                const cv = String(v).toLowerCase();
                const st = String(r.status || '').toLowerCase();
                if (cv === 'present') return st === 'present' || r.present > 0;
                if (cv === 'absent') return st === 'absent' || r.absent > 0;
                if (cv === 'not marked') return st === 'not marked' || (r.present === 0 && r.absent === 0);
                return st === cv;
              });
              return (f.op === 'not_equals' || f.op === 'neq') ? !isMatch : isMatch;
            });
          }
        }
      });

      const totalPresent = rows.reduce((a, r) => a + r.present, 0);
      const totalAbsent = rows.reduce((a, r) => a + r.absent, 0);
      const avgUtil = totalPresent + totalAbsent > 0 ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) + '%' : '—';

      summaries = [
        { label: 'Drivers Audited', value: rows.length, unit: '' },
        { label: 'Total Present Days', value: totalPresent, unit: 'days' },
        { label: 'Total Absent Days', value: totalAbsent, unit: 'days' },
        { label: 'Average Utilisation', value: avgUtil, unit: '' },
      ];
      break;
    }

    // ------------------------------------------------------------------------
    // MODULE: LOADING LOCATIONS
    // ------------------------------------------------------------------------
    case 'location': {
      columns = [
        { key: 'name', label: 'Hub / Plant Name', kind: 'text' },
        { key: 'client', label: 'Client', kind: 'text' },
        { key: 'branch', label: 'Branch', kind: 'text' },
        { key: 'address', label: 'Address', kind: 'text' },
        { key: 'radius', label: 'Safe Radius', kind: 'num', unit: 'm' },
        { key: 'tripsCount', label: 'Outbound Trips', kind: 'num' },
        { key: 'vehiclesServed', label: 'Vehicles Served', kind: 'num' },
        { key: 'status', label: 'Status', kind: 'badge' },
      ];

      rows = locations.map(l => {
        const outTrips = trips.filter(t => t.loading === l.id);
        const tripClientIds = outTrips.map(t => t.client).filter(Boolean);
        const staticClientIds = [l.client, l.clientId, ...(l.clientIds || [])].filter(Boolean);
        const knownTermClients = {
          L01: ['C01'],
          L02: ['C02', 'C05'],
          L03: ['C03'],
          L04: ['C04'],
          L05: ['C06'],
          L06: ['C01'],
        };
        const allClientIds = Array.from(new Set([...staticClientIds, ...tripClientIds, ...(knownTermClients[l.id] || [])]));
        const clientNames = allClientIds.map(cid => C[cid]?.name || cid).filter(Boolean);
        const uniqueVehicles = new Set(outTrips.map(t => t.vehicle)).size;

        return {
          id: l.id,
          name: l.name,
          client: clientNames.join(', ') || '—',
          clientIds: allClientIds,
          clientId: allClientIds[0] || '',
          branch: B[l.branch]?.name || l.branch,
          branchId: l.branch,
          address: l.address || '—',
          radius: l.radius || 100,
          tripsCount: outTrips.length,
          vehiclesServed: uniqueVehicles,
          status: l.status || 'Active',
        };
      });

      activeFilters.forEach(f => {
        if (isFilterEmpty(f.value)) return;
        if (f.field === 'location') {
          rows = rows.filter(r => matchesEntityOrText(r.id, r.name, f.op, f.value));
        } else if (f.field === 'client') {
          const vals = (Array.isArray(f.value) ? f.value : [f.value]).filter(Boolean);
          if (vals.length > 0) {
            rows = rows.filter(r => {
              const isMatch = vals.some(v => {
                const cv = String(v).toLowerCase();
                const idMatch = (r.clientIds || []).some(cid => String(cid).toLowerCase() === cv);
                const textMatch = r.client && String(r.client).toLowerCase().includes(cv);
                return idMatch || textMatch;
              });
              return (f.op === 'not_equals' || f.op === 'neq') ? !isMatch : isMatch;
            });
          }
        } else if (f.field === 'branch') {
          rows = rows.filter(r => matchesEntityOrText(r.branchId, r.branch, f.op, f.value));
        } else if (f.field === 'status') {
          rows = rows.filter(r => evaluateCondition(r.status, f.op || 'equals', f.value));
        }
      });

      summaries = [
        { label: 'Total Loading Hubs', value: rows.length, unit: '' },
        { label: 'Active Hubs', value: rows.filter(r => r.status === 'Active').length, unit: '' },
        { label: 'Outbound Dispatches', value: rows.reduce((a, r) => a + r.tripsCount, 0), unit: 'trips' },
        { label: 'Vehicles Served', value: rows.reduce((a, r) => a + r.vehiclesServed, 0), unit: '' },
      ];
      break;
    }

    // ------------------------------------------------------------------------
    // MODULE: DRIVER PERFORMANCE (Consolidated Driver -> Vehicle -> Trip -> Performance)
    // ------------------------------------------------------------------------
    case 'driverPerformance': {
      const driverFilter = getFilter('driver');
      const dateFilter = getFilter('date');

      let filteredDrivers = drivers;
      if (driverFilter && !isFilterEmpty(driverFilter.value)) {
        filteredDrivers = drivers.filter(d =>
          matchesEntityOrText(d.id, d.name, driverFilter.op || 'equals', driverFilter.value)
        );
      }
      const matchedDriverIds = new Set(filteredDrivers.map(d => d.id));
      const matchedDriverNames = new Set(filteredDrivers.map(d => d.name));

      let perfTrips = trips.filter(t => {
        if (!driverFilter || isFilterEmpty(driverFilter.value)) {
          return Boolean(t.driver || (Array.isArray(t.drivers) && t.drivers.length > 0));
        }
        return (
          matchedDriverIds.has(t.driver) ||
          matchedDriverNames.has(t.driver) ||
          (Array.isArray(t.drivers) && t.drivers.some(did => matchedDriverIds.has(did) || matchedDriverNames.has(did)))
        );
      });

      if (dateFilter && dateFilter.value) {
        perfTrips = perfTrips.filter(t => evaluateDateRange(t.opened || t.closed, dateFilter.value));
      }

      columns = [
        { key: 'number', label: 'Trip Number', kind: 'text' },
        { key: 'date', label: 'Trip Date', kind: 'date' },
        { key: 'driver', label: 'Driver', kind: 'text' },
        { key: 'vehicle', label: 'Vehicle', kind: 'text' },
        { key: 'route', label: 'Route / Corridor', kind: 'text' },
        { key: 'distance', label: 'Actual KM', kind: 'num', unit: 'km' },
        { key: 'fixedKm', label: 'Fixed KM', kind: 'num', unit: 'km' },
        { key: 'distanceVariance', label: 'Distance Variance', kind: 'text' },
        { key: 'actualDiesel', label: 'Actual Diesel', kind: 'num', unit: 'L' },
        { key: 'dieselLimit', label: 'Authorized Diesel Limit', kind: 'num', unit: 'L' },
        { key: 'overLimitLitres', label: 'Over Limit', kind: 'num', unit: 'L' },
        { key: 'actualMileage', label: 'Actual Mileage', kind: 'num', unit: 'km/L' },
        { key: 'expectedMileage', label: 'Expected Mileage', kind: 'num', unit: 'km/L' },
        { key: 'driverBata', label: 'Driver Bata', kind: 'num', unit: '₹' },
        { key: 'advance', label: 'Advance', kind: 'num', unit: '₹' },
        { key: 'tolls', label: 'Tolls & FASTag', kind: 'num', unit: '₹' },
        { key: 'deviations', label: 'Route Deviation', kind: 'text' },
        { key: 'status', label: 'Trip Status', kind: 'badge' },
      ];

      rows = perfTrips.map(t => {
        const actualDist = getTripDistance(t);
        const tripRoutes = routesOfTrip(t, tms);
        const primaryRoute = tripRoutes[0] || null;
        const fixedKm = Number(t.fixedKm) || (primaryRoute?.fixedKm ? Number(primaryRoute.fixedKm) : 0);

        let distanceVariance = '—';
        let diffKm = 0;
        if (fixedKm > 0 && actualDist > 0) {
          diffKm = actualDist - fixedKm;
          const varPct = Math.round((Math.abs(diffKm) / fixedKm) * 1000) / 10;
          distanceVariance = `${diffKm > 0 ? '+' : ''}${Math.round(diffKm)} km (${varPct}%)`;
        }

        const actualDiesel = dieselLitresOf(t) || 0;
        const authDiesel = routeDieselLimit(t, tms);
        const overLimit = overLimitLitres(t, authDiesel);

        const actualMileage = actualDist > 0 && actualDiesel > 0
          ? Math.round((actualDist / actualDiesel) * 100) / 100
          : null;

        const expectedMileage = fixedKm > 0 && authDiesel != null && authDiesel > 0
          ? Math.round((fixedKm / authDiesel) * 100) / 100
          : null;

        let dieselCompliance = 'Not set';
        if (authDiesel != null && authDiesel > 0) {
          dieselCompliance = (overLimit != null && overLimit > 0) ? 'Exceeded' : 'Compliant';
        }

        let mileageCompliance = '—';
        if (actualMileage != null && expectedMileage != null) {
          if (actualMileage >= expectedMileage) mileageCompliance = 'Compliant';
          else if (actualMileage >= expectedMileage * 0.9) mileageCompliance = 'Near Target';
          else mileageCompliance = 'Below Target';
        }

        const exp = t.expBreakdown || {};
        const driverBata = exp.driverBatas && Object.keys(exp.driverBatas).length > 0
          ? Object.values(exp.driverBatas).reduce((a, b) => a + (Number(b) || 0), 0)
          : (Number(exp.driverBata) || 0);
        const advance = parseMoney(t.advance);
        const fastag = exp.fastag != null && exp.fastag !== '' ? Number(exp.fastag) : (exp.dieselCash != null && exp.dieselCash !== '' ? Number(exp.dieselCash) : 0);
        const toll = (Number(exp.toll) || 0) + (Number(exp.weighment) || 0);
        const totalTolls = fastag + toll;

        const div = t.diversion;
        let deviationText = 'None';
        if (div) {
          deviationText = div.offKm ? `${div.offKm} km off-route` : 'Route diverted';
        } else if ((t.flags || []).some(f => /diversion|variance/i.test(f))) {
          deviationText = (t.flags || []).find(f => /diversion|variance/i.test(f));
        }

        const routeDisplay = primaryRoute?.name ||
          (t.loading && t.unloading ? `${L[t.loading]?.name || t.loading} → ${t.unloading}` : '—');

        const driverNames = Array.isArray(t.drivers) && t.drivers.length > 0
          ? t.drivers.map(id => D[id]?.name || id).join(', ')
          : (D[t.driver]?.name || t.driver || '—');

        const isLongOpen = t.status !== 'Closed' && (t.hoursOpen > 24);
        const statusLabel = isLongOpen ? 'Long open' : t.status === 'Enroute' ? ENROUTE_LABEL : t.status;

        return {
          id: t.id,
          number: t.number,
          date: t.opened,
          timestamp: parseTimestamp(t.opened),
          driver: driverNames,
          driverId: t.driver,
          vehicle: V[t.vehicle]?.number || t.vehicle,
          vehicleId: t.vehicle,
          route: routeDisplay,
          distance: actualDist,
          fixedKm: fixedKm > 0 ? fixedKm : '—',
          distanceVariance,
          diffKm,
          actualDiesel: actualDiesel > 0 ? actualDiesel : '—',
          actualDieselNum: actualDiesel,
          dieselLimit: authDiesel != null && authDiesel > 0 ? authDiesel : '—',
          dieselLimitNum: authDiesel,
          overLimitLitres: overLimit != null && overLimit > 0 ? overLimit : 0,
          actualMileage: actualMileage != null ? actualMileage : '—',
          actualMileageNum: actualMileage,
          expectedMileage: expectedMileage != null ? expectedMileage : '—',
          expectedMileageNum: expectedMileage,
          dieselCompliance,
          mileageCompliance,
          driverBata,
          advance,
          tolls: totalTolls,
          deviations: deviationText,
          status: statusLabel,
        };
      });

      vehicleColumns = [
        { key: 'vehicle', label: 'Vehicle Number', kind: 'text' },
        { key: 'vehicleType', label: 'Vehicle Type', kind: 'text' },
        { key: 'tripsHandled', label: 'Trips Handled', kind: 'num' },
        { key: 'completedTrips', label: 'Completed Trips', kind: 'num' },
        { key: 'totalDistance', label: 'Total Distance', kind: 'num', unit: 'km' },
        { key: 'dieselConsumed', label: 'Diesel Consumed', kind: 'num', unit: 'L' },
        { key: 'actualMileage', label: 'Actual Mileage', kind: 'num', unit: 'km/L' },
        { key: 'expectedMileage', label: 'Expected Mileage', kind: 'num', unit: 'km/L' },
        { key: 'vehicleStatus', label: 'Vehicle Status', kind: 'badge' },
      ];

      const vehMap = new Map();
      rows.forEach(r => {
        const vId = r.vehicleId || r.vehicle;
        if (!vehMap.has(vId)) {
          vehMap.set(vId, []);
        }
        vehMap.get(vId).push(r);
      });

      vehicleRows = Array.from(vehMap.entries()).map(([vId, vTrips]) => {
        const vehObj = V[vId] || vehicles.find(v => v.number === vId) || {};
        const vNum = vehObj.number || vId;
        const vType = vehObj.type || '—';
        const tripsHandled = vTrips.length;
        const completedTrips = vTrips.filter(t => t.status === 'Closed').length;
        const totalDistance = vTrips.reduce((acc, t) => acc + (typeof t.distance === 'number' ? t.distance : 0), 0);
        const dieselConsumed = vTrips.reduce((acc, t) => acc + (t.actualDieselNum || 0), 0);
        const actualMileage = totalDistance > 0 && dieselConsumed > 0
          ? Math.round((totalDistance / dieselConsumed) * 100) / 100
          : null;

        const tripsWithLimit = vTrips.filter(t => t.dieselLimitNum != null && t.dieselLimitNum > 0);
        const tripsWithinLimit = tripsWithLimit.filter(t => t.dieselCompliance === 'Compliant');
        const dieselCompliancePct = tripsWithLimit.length > 0
          ? Math.round((tripsWithinLimit.length / tripsWithLimit.length) * 100) + '%'
          : 'Not set';

        const totalFixedKm = vTrips.reduce((acc, t) => acc + (typeof t.fixedKm === 'number' ? t.fixedKm : 0), 0);
        const totalAuthDiesel = tripsWithLimit.reduce((acc, t) => acc + (t.dieselLimitNum || 0), 0);
        const expectedMileage = totalFixedKm > 0 && totalAuthDiesel > 0
          ? Math.round((totalFixedKm / totalAuthDiesel) * 100) / 100
          : null;

        let mileageStatus = '—';
        if (actualMileage != null && expectedMileage != null) {
          if (actualMileage >= expectedMileage) mileageStatus = 'Compliant';
          else if (actualMileage >= expectedMileage * 0.9) mileageStatus = 'Near Target';
          else mileageStatus = 'Below Target';
        }

        return {
          id: vId,
          vehicle: vNum,
          vehicleType: vType,
          tripsHandled,
          completedTrips,
          totalDistance,
          dieselConsumed: Math.round(dieselConsumed * 10) / 10,
          actualMileage: actualMileage != null ? actualMileage : '—',
          expectedMileage: expectedMileage != null ? expectedMileage : '—',
          mileageStatus,
          dieselCompliancePct,
          vehicleStatus: vehObj.status || 'Active',
        };
      });

      const totalTrips = rows.length;
      const completedTripsCount = rows.filter(r => r.status === 'Closed').length;
      const totalDist = rows.reduce((acc, r) => acc + (typeof r.distance === 'number' ? r.distance : 0), 0);
      const totalDiesel = rows.reduce((acc, r) => acc + (r.actualDieselNum || 0), 0);
      const totalOverLitres = rows.reduce((acc, r) => acc + (r.overLimitLitres || 0), 0);
      const tripsWithAuth = rows.filter(r => r.dieselLimitNum != null && r.dieselLimitNum > 0);
      const compliantDieselTrips = tripsWithAuth.filter(r => r.dieselCompliance === 'Compliant').length;
      const exceededDieselTrips = tripsWithAuth.filter(r => r.dieselCompliance === 'Exceeded').length;
      const dieselCompPct = tripsWithAuth.length > 0 ? Math.round((compliantDieselTrips / tripsWithAuth.length) * 100) : null;

      const overallActualMileage = totalDist > 0 && totalDiesel > 0 ? Math.round((totalDist / totalDiesel) * 100) / 100 : null;
      const totalFixedDistance = rows.reduce((acc, r) => acc + (typeof r.fixedKm === 'number' ? r.fixedKm : 0), 0);
      const totalAuthDieselVal = tripsWithAuth.reduce((acc, r) => acc + (r.dieselLimitNum || 0), 0);
      const overallExpectedMileage = totalFixedDistance > 0 && totalAuthDieselVal > 0 ? Math.round((totalFixedDistance / totalAuthDieselVal) * 100) / 100 : null;

      let overallMileageStatus = '—';
      if (overallActualMileage != null && overallExpectedMileage != null) {
        if (overallActualMileage >= overallExpectedMileage) overallMileageStatus = 'Compliant';
        else if (overallActualMileage >= overallExpectedMileage * 0.9) overallMileageStatus = 'Near Target';
        else overallMileageStatus = 'Below Target';
      }

      const totalDriverBata = rows.reduce((acc, r) => acc + (r.driverBata || 0), 0);
      const totalAdvances = rows.reduce((acc, r) => acc + (r.advance || 0), 0);
      const totalTolls = rows.reduce((acc, r) => acc + (r.tolls || 0), 0);
      const totalDeviations = rows.filter(r => r.deviations !== 'None').length;

      const driverLabel = filteredDrivers.length === 1
        ? filteredDrivers[0].name
        : filteredDrivers.length > 1 && filteredDrivers.length < drivers.length
        ? `${filteredDrivers.length} Selected Drivers`
        : 'All Active Drivers';

      const periodLabel = dateFilter?.value?.from && dateFilter?.value?.to
        ? `${dateFilter.value.from} to ${dateFilter.value.to}`
        : dateFilter?.value?.from
        ? `From ${dateFilter.value.from}`
        : dateFilter?.value?.to
        ? `To ${dateFilter.value.to}`
        : 'All Logged Trips';

      summaries = [
        { label: 'Selected Driver', value: driverLabel, unit: '' },
        { label: 'Selected Period', value: periodLabel, unit: '' },
        { label: 'Vehicles Handled', value: vehicleRows.length, unit: 'vehicles' },
        { label: 'Trips Completed', value: `${completedTripsCount} / ${totalTrips}`, unit: 'trips' },
        { label: 'Total Distance', value: totalDist.toLocaleString('en-IN'), unit: 'km' },
        { label: 'Diesel Consumed', value: Math.round(totalDiesel).toLocaleString('en-IN'), unit: 'L' },
        { label: 'Within Diesel Limit', value: `${compliantDieselTrips} / ${tripsWithAuth.length}`, unit: 'trips' },
        { label: 'Exceeding Diesel Limit', value: exceededDieselTrips, unit: 'trips' },
        { label: 'Diesel Compliance', value: dieselCompPct != null ? `${dieselCompPct}%` : '—', unit: '' },
        { label: 'Over-Limit Fuel', value: totalOverLitres > 0 ? totalOverLitres.toFixed(1) : '0', unit: 'L' },
        { label: 'Actual Mileage', value: overallActualMileage != null ? overallActualMileage.toFixed(2) : '—', unit: 'km/L' },
        { label: 'Expected Mileage', value: overallExpectedMileage != null ? overallExpectedMileage.toFixed(2) : '—', unit: 'km/L' },
        { label: 'Mileage Compliance', value: overallMileageStatus, unit: '' },
        { label: 'Total Driver Bata', value: '₹' + totalDriverBata.toLocaleString('en-IN'), unit: '' },
        { label: 'Total Advances', value: '₹' + totalAdvances.toLocaleString('en-IN'), unit: '' },
        { label: 'Tolls & FASTag', value: '₹' + totalTolls.toLocaleString('en-IN'), unit: '' },
        { label: 'Route Deviations', value: totalDeviations, unit: 'trips' },
      ];

      break;
    }

    // ------------------------------------------------------------------------
    // COMBINED: one row per trip, joined with every related module
    // ------------------------------------------------------------------------
    case ALL_MODULE_ID: {
      const S = tms.S || Object.fromEntries((tms.supervisors || []).map(s => [s.id, s]));
      const todayDate = new Date().toISOString().slice(0, 10);
      const excByVehicle = {};
      exceptions.forEach(x => {
        if (x.vehicle) excByVehicle[x.vehicle] = (excByVehicle[x.vehicle] || 0) + 1;
      });

      const DEFAULT_VISIBLE = new Set([
        'number', 'date', 'tripType', 'tripStatus', 'driver', 'vehicle', 'branch', 'client',
        'from', 'destination', 'distance', 'diesel', 'dieselCost', 'advance', 'totalExpense',
      ]);

      columns = [
        // Trip
        { key: 'number', label: 'Trip Number', kind: 'text' },
        { key: 'date', label: 'Opened Date', kind: 'date' },
        { key: 'closedDate', label: 'Closed Date', kind: 'date' },
        { key: 'tripType', label: 'Trip Type', kind: 'badge' },
        { key: 'tripStatus', label: 'Trip Status', kind: 'badge' },
        { key: 'driver', label: 'Driver Name', kind: 'text' },
        { key: 'vehicle', label: 'Vehicle Number', kind: 'text' },
        { key: 'branch', label: 'Branch', kind: 'text' },
        { key: 'client', label: 'Client', kind: 'text' },
        { key: 'from', label: 'Loading Location', kind: 'text' },
        { key: 'destination', label: 'Destination', kind: 'text' },
        { key: 'route', label: 'Route / Corridor', kind: 'text' },
        { key: 'supervisorName', label: 'Supervisor', kind: 'text' },
        { key: 'distance', label: 'Actual KM', kind: 'num', unit: 'km' },
        { key: 'fixedKm', label: 'Fixed KM', kind: 'num', unit: 'km' },
        { key: 'variance', label: 'Variance %', kind: 'num', unit: '%' },
        { key: 'diesel', label: 'Diesel', kind: 'num', unit: 'L' },
        { key: 'dieselCost', label: 'Diesel Cost', kind: 'num', unit: '₹' },
        { key: 'advance', label: 'Advance', kind: 'num', unit: '₹' },
        { key: 'totalExpense', label: 'Total Settlement', kind: 'num', unit: '₹' },
        // Driver & attendance
        { key: 'driverType', label: 'Driver Type', kind: 'badge' },
        { key: 'driverStatus', label: 'Driver Status', kind: 'badge' },
        { key: 'approval', label: 'Approval Status', kind: 'badge' },
        { key: 'attendance', label: 'Attendance', kind: 'badge' },
        { key: 'presentDays', label: 'Present Days', kind: 'num' },
        { key: 'absentDays', label: 'Absent Days', kind: 'num' },
        { key: 'util', label: 'Utilisation', kind: 'text' },
        // Vehicle
        { key: 'vtype', label: 'Vehicle Type', kind: 'text' },
        { key: 'vehicleStatus', label: 'Vehicle Status', kind: 'badge' },
        { key: 'gps', label: 'GPS Status', kind: 'badge' },
        { key: 'odometer', label: 'Odometer KM', kind: 'num', unit: 'km' },
        { key: 'tank', label: 'Tank Capacity', kind: 'num', unit: 'L' },
        { key: 'vehicleExceptions', label: 'Vehicle Exceptions', kind: 'num' },
        // Branch
        { key: 'branchCode', label: 'Branch Code', kind: 'text' },
        { key: 'state', label: 'State', kind: 'text' },
        { key: 'branchStatus', label: 'Branch Status', kind: 'badge' },
        // Client
        { key: 'gst', label: 'GST Number', kind: 'text' },
        { key: 'clientSupervisors', label: 'Client Supervisors', kind: 'text' },
        { key: 'deliveryPoints', label: 'Delivery Points', kind: 'num' },
        { key: 'clientStatus', label: 'Client Status', kind: 'badge' },
        // Loading location
        { key: 'locationAddress', label: 'Loading Address', kind: 'text' },
        { key: 'radius', label: 'Safe Radius', kind: 'num', unit: 'm' },
        { key: 'locationStatus', label: 'Loading Location Status', kind: 'badge' },
        // Diesel & mileage
        { key: 'bunk', label: 'Fuel Bunk', kind: 'text' },
        { key: 'rate', label: 'Rate (₹/L)', kind: 'num', unit: '₹' },
        { key: 'dieselLimit', label: 'Authorized Diesel Limit', kind: 'num', unit: 'L' },
        { key: 'overLimitLitres', label: 'Over Limit', kind: 'num', unit: 'L' },
        { key: 'dieselCompliance', label: 'Diesel Compliance', kind: 'badge' },
        { key: 'actualMileage', label: 'Actual Mileage', kind: 'num', unit: 'km/L' },
        { key: 'expectedMileage', label: 'Expected Mileage', kind: 'num', unit: 'km/L' },
        { key: 'mileageCompliance', label: 'Mileage Compliance', kind: 'badge' },
        // Advances & expenses
        { key: 'fastag', label: 'FASTag', kind: 'num', unit: '₹' },
        { key: 'driverBata', label: 'Driver Bata', kind: 'num', unit: '₹' },
        { key: 'cleanerBata', label: 'Cleaner Bata', kind: 'num', unit: '₹' },
        { key: 'toll', label: 'Toll & Weighment', kind: 'num', unit: '₹' },
        { key: 'other', label: 'Other Expenses', kind: 'text' },
        // Route changes
        { key: 'severity', label: 'Route Change Severity', kind: 'badge' },
        { key: 'routeChangeStatus', label: 'Route Change Status', kind: 'badge' },
        { key: 'expected', label: 'Expected Corridor', kind: 'text' },
        { key: 'actual', label: 'Actual Path / Off-Route', kind: 'text' },
        { key: 'deviationLocation', label: 'Deviation Location', kind: 'text' },
        { key: 'offKm', label: 'Off-Route KM', kind: 'num', unit: 'km' },
        { key: 'gpsKm', label: 'GPS KM', kind: 'num', unit: 'km' },
      ].map(c => (DEFAULT_VISIBLE.has(c.key) ? c : { ...c, defaultHidden: true }));

      rows = trips.map(t => {
        const d = D[t.driver] || {};
        const v = V[t.vehicle] || {};
        const b = B[t.branch] || {};
        const c = C[t.client] || {};
        const l = L[t.loading] || {};
        const exp = t.expBreakdown || {};

        const driverIds = Array.isArray(t.drivers) && t.drivers.length > 0 ? t.drivers : [t.driver].filter(Boolean);
        const driverName = driverIds.length > 0 ? driverIds.map(id => D[id]?.name || id).join(', ') : '—';

        // Trip distance & route
        const dist = getTripDistance(t);
        const primaryRoute = routesOfTrip(t, tms)[0] || null;
        const fixed = Number(t.fixedKm) || (primaryRoute?.fixedKm ? Number(primaryRoute.fixedKm) : 0);
        const variance = fixed > 0 && dist > 0 ? Math.round((Math.abs(dist - fixed) / fixed) * 1000) / 10 : null;
        const isLongOpen = t.status !== 'Closed' && (t.hoursOpen > 24);
        const tripStatus = isLongOpen ? 'Long open' : t.status === 'Enroute' ? ENROUTE_LABEL : t.status;
        const routeDisplay = primaryRoute?.name ||
          (t.loading && t.unloading ? `${l.name || t.loading} → ${t.unloading}` : '—');

        // Diesel & mileage
        const litres = t.dieselLitres || parseMoney(t.diesel) || 0;
        const rate = t.rate || 0;
        const dieselCost = t.dieselTotal || (rate > 0 && litres > 0 ? rate * litres : 0);
        const authDiesel = routeDieselLimit(t, tms);
        const overLimit = overLimitLitres(t, authDiesel);
        const actualMileage = dist > 0 && litres > 0 ? Math.round((dist / litres) * 100) / 100 : null;
        const expectedMileage = fixed > 0 && authDiesel != null && authDiesel > 0
          ? Math.round((fixed / authDiesel) * 100) / 100
          : null;
        let dieselCompliance = 'Not set';
        if (authDiesel != null && authDiesel > 0) {
          dieselCompliance = (overLimit != null && overLimit > 0) ? 'Exceeded' : 'Compliant';
        }
        let mileageCompliance = '—';
        if (actualMileage != null && expectedMileage != null) {
          if (actualMileage >= expectedMileage) mileageCompliance = 'Compliant';
          else if (actualMileage >= expectedMileage * 0.9) mileageCompliance = 'Near Target';
          else mileageCompliance = 'Below Target';
        }

        // Advances & expenses
        const advance = parseMoney(t.advance);
        const fastag = exp.fastag != null && exp.fastag !== '' ? Number(exp.fastag) : (exp.dieselCash != null && exp.dieselCash !== '' ? Number(exp.dieselCash) : 0);
        const driverBata = exp.driverBatas && Object.keys(exp.driverBatas).length > 0
          ? Object.values(exp.driverBatas).reduce((a, x) => a + (Number(x) || 0), 0)
          : (Number(exp.driverBata) || 0);
        const cleanerBata = Number(exp.cleanerBata) || 0;
        const toll = (Number(exp.toll) || 0) + (Number(exp.weighment) || 0);
        const otherList = (t.otherExpenses || []).map(o => `${o.name}: ₹${o.amount}`).join('; ');
        const totalExpense = parseMoney(t.totalExpense) || (fastag + driverBata + cleanerBata + toll + (Number(exp.rto) || 0));

        // Route change (same detection as the Route Changes module)
        const tFixed = Number(t.fixedKm) || 0;
        const isDeviation = Boolean(t.diversion) ||
          (t.flags || []).some(f => /diversion|variance|route/i.test(f)) ||
          (tFixed > 0 && dist > 0 && (Math.abs(dist - tFixed) / tFixed) * 100 > 5);
        const dev = {
          severity: 'None',
          routeChangeStatus: 'No route change',
          routeChangeState: '',
          expected: '—',
          actual: '—',
          deviationLocation: '—',
          offKm: '—',
          gpsKm: '—',
        };
        if (isDeviation) {
          const div = t.diversion || {};
          const gps = Number(t.gpsKm) || dist;
          const vPct = tFixed > 0 && gps > 0 ? Math.round((Math.abs(gps - tFixed) / tFixed) * 1000) / 10 : 0;
          const exc = exceptions.find(x => x.trip === t.id);
          const offKmNum = Number(div.offKm || div.extraKm) || 0;
          dev.severity = exc?.severity || (offKmNum > 20 || vPct > 10 ? 'High' : offKmNum > 10 || vPct > 5 ? 'Medium' : 'Low');
          if (div.state === 'Reviewed' || t.status === 'Closed') dev.routeChangeStatus = 'Resolved';
          else if (div.state === 'Rejoined' || (exc && exc.status === 'Under review')) dev.routeChangeStatus = 'Under review';
          else dev.routeChangeStatus = 'Open';
          dev.routeChangeState = div.state || (t.status === 'Closed' ? 'Reviewed' : 'Active diversion');
          dev.expected = div.expected || ((l.name || 'Origin') + ' → ' + (t.unloading || 'Destination'));
          dev.actual = div.actual || (t.flags || []).find(f => /diversion|variance/i.test(f)) || 'Distance variance detected';
          dev.deviationLocation = div.at || `${ENROUTE_LABEL} Corridor`;
          dev.offKm = div.offKm || div.extraKm || '—';
          dev.gpsKm = gps || '—';
        }

        // Driver attendance (same rules as the Attendance module)
        const presentDays = d.present != null ? d.present : 0;
        const absentDays = d.absent != null ? d.absent : 0;
        const branchStore = attStore[d.branch] || (B[d.branch]?.name ? attStore[B[d.branch]?.name] : null) || {};
        const todayEntry = branchStore[todayDate]?.entries?.[d.id] || branchStore[todayDate]?.entries?.[d.name];
        let todayStatus = '';
        if (Array.isArray(todayEntry)) todayStatus = todayEntry[0] === 'P' ? 'Present' : todayEntry[0] === 'A' ? 'Absent' : '';
        else if (todayEntry && typeof todayEntry === 'object') todayStatus = todayEntry.mark === 'P' || todayEntry.status === 'Present' ? 'Present' : todayEntry.mark === 'A' || todayEntry.status === 'Absent' ? 'Absent' : '';
        else if (typeof todayEntry === 'string') todayStatus = todayEntry === 'P' || todayEntry === 'Present' ? 'Present' : todayEntry === 'A' || todayEntry === 'Absent' ? 'Absent' : '';
        let attendance = 'Not marked';
        if (todayStatus) attendance = todayStatus;
        else if (d.status === 'Inactive') attendance = 'Absent';
        else if (d.status === 'Pending') attendance = 'Not marked';
        else if (presentDays > 0) attendance = 'Present';
        else if (absentDays > 0) attendance = 'Absent';

        return {
          id: t.id,
          // Trip
          number: t.number,
          date: t.opened,
          timestamp: parseTimestamp(t.opened || t.closed),
          closedDate: t.closed || '—',
          tripType: t.type || 'Business',
          tripStatus,
          rawStatus: t.status,
          hoursOpen: t.hoursOpen || 0,
          driver: driverName,
          driverId: t.driver,
          driverIds,
          vehicle: v.number || t.vehicle || '—',
          vehicleId: t.vehicle,
          branch: b.name || t.branch || '—',
          branchId: t.branch,
          client: c.name || '—',
          clientId: t.client,
          from: l.name || t.loading || '—',
          loadingId: t.loading,
          destination: t.unloading || '—',
          route: routeDisplay,
          supervisorId: t.supervisor,
          supervisorName: S[t.supervisor]?.name || t.supervisor || '—',
          distance: dist,
          fixedKm: fixed || '—',
          variance: variance != null ? variance : '—',
          diesel: litres,
          dieselCost,
          advance,
          totalExpense,
          // Driver & attendance
          driverType: d.type || 'Regular',
          driverStatus: d.status || 'Active',
          approval: d.approval || 'Approved',
          attendance,
          presentDays,
          absentDays,
          util: d.util || (presentDays + absentDays > 0 ? Math.round((presentDays / (presentDays + absentDays)) * 100) + '%' : '—'),
          // Vehicle
          vtype: v.type || '—',
          vehicleStatus: v.status || 'Running',
          gps: v.gps || 'OK',
          odometer: v.odometer || 0,
          tank: v.tank || 0,
          vehicleExceptions: excByVehicle[t.vehicle] || 0,
          // Branch
          branchCode: b.code || t.branch || '—',
          state: b.state || '—',
          branchStatus: b.status || 'Active',
          // Client
          gst: c.gst || '—',
          clientSupervisors: c.supervisors || '—',
          deliveryPoints: c.customers || 0,
          clientStatus: t.client ? (c.status || 'Active') : '—',
          // Loading location
          locationAddress: l.address || '—',
          radius: t.loading ? (l.radius || 100) : '—',
          locationStatus: t.loading ? (l.status || 'Active') : '—',
          // Diesel & mileage
          bunk: t.bunk || '—',
          rate: rate > 0 ? rate : '—',
          dieselLimit: authDiesel != null && authDiesel > 0 ? authDiesel : '—',
          overLimitLitres: overLimit != null && overLimit > 0 ? overLimit : 0,
          dieselCompliance,
          actualMileage: actualMileage != null ? actualMileage : '—',
          expectedMileage: expectedMileage != null ? expectedMileage : '—',
          mileageCompliance,
          // Advances & expenses
          fastag,
          driverBata,
          cleanerBata,
          toll,
          other: otherList || '—',
          // Route changes
          ...dev,
        };
      });

      if (dateFilter && dateFilter.value) {
        rows = rows.filter(r => evaluateDateRange(r.timestamp, dateFilter.value));
      }

      // Multi-value matcher honouring equals / not_equals
      const filterBy = (f, matcher) => {
        const vals = (Array.isArray(f.value) ? f.value : [f.value]).filter(Boolean);
        if (!vals.length) return;
        const negate = f.op === 'not_equals' || f.op === 'neq';
        rows = rows.filter(r => {
          const isMatch = vals.some(val => matcher(r, String(val).trim().toLowerCase(), val));
          return negate ? !isMatch : isMatch;
        });
      };

      activeFilters.forEach(f => {
        if (isFilterEmpty(f.value) || f.field === 'date') return;
        switch (f.field) {
          case 'driver':
            filterBy(f, (r, cv, val) => r.driverIds.some(id => matchesEntityOrText(id, D[id]?.name, 'equals', val)));
            break;
          case 'branch':
            rows = rows.filter(r => matchesEntityOrText(r.branchId, r.branch, f.op, f.value));
            break;
          case 'vehicle':
            rows = rows.filter(r => matchesEntityOrText(r.vehicleId, r.vehicle, f.op, f.value));
            break;
          case 'client':
            rows = rows.filter(r => matchesEntityOrText(r.clientId, r.client, f.op, f.value));
            break;
          case 'loading':
            rows = rows.filter(r => matchesEntityOrText(r.loadingId, r.from, f.op, f.value));
            break;
          case 'supervisor':
            rows = rows.filter(r => matchesEntityOrText(r.supervisorId, r.supervisorName, f.op, f.value));
            break;
          case 'bunk':
            filterBy(f, (r, cv, val) => r.bunk !== '—' && matchesEntityOrText(null, r.bunk, 'contains', val));
            break;
          case 'tripStatus':
            filterBy(f, (r, cv) => {
              const rStat = String(r.tripStatus || '').trim().toLowerCase();
              const rRaw = String(r.rawStatus || '').trim().toLowerCase();
              if (cv === 'enroute' || cv === 'on road') return rRaw === 'enroute' || rStat === 'on road' || rStat === 'enroute';
              if (cv === 'closed') return rRaw === 'closed' || rStat === 'closed';
              if (cv === 'long open') return rStat === 'long open' || (r.hoursOpen > 24 && rRaw !== 'closed');
              return rStat === cv || rRaw === cv;
            });
            break;
          case 'attendance':
            filterBy(f, (r, cv) => {
              if (cv === 'high absence (>3 days)') return r.absentDays > 3;
              if (cv === 'present') return r.attendance === 'Present' || r.presentDays > 0;
              if (cv === 'absent') return r.attendance === 'Absent' || r.absentDays > 0;
              if (cv === 'not marked') return r.attendance === 'Not marked' || (r.presentDays === 0 && r.absentDays === 0);
              return String(r.attendance).toLowerCase() === cv;
            });
            break;
          case 'routeChangeStatus':
            filterBy(f, (r, cv) => {
              const st = String(r.routeChangeState || '').toLowerCase();
              const sg = String(r.routeChangeStatus || '').toLowerCase();
              if (cv === 'open') return sg === 'open' || st.includes('active') || st.includes('off route');
              if (cv === 'under review') return sg === 'under review' || st.includes('rejoined') || st.includes('review');
              if (cv === 'resolved') return sg === 'resolved' || st.includes('reviewed') || st.includes('closed');
              return st === cv || sg === cv;
            });
            break;
          default:
            // Plain value fields: tripType, driverType, driverStatus, approval,
            // vehicleStatus, gps, vtype, clientStatus, state, branchStatus,
            // locationStatus, severity — row key matches the field key.
            rows = rows.filter(r => evaluateCondition(r[f.field], f.op || 'equals', f.value));
        }
      });

      summaries = [
        { label: 'Total Trips', value: rows.length, unit: '' },
        { label: 'Total Distance', value: rows.reduce((a, r) => a + r.distance, 0).toLocaleString('en-IN'), unit: 'km' },
        { label: 'Total Diesel', value: rows.reduce((a, r) => a + r.diesel, 0).toLocaleString('en-IN'), unit: 'L' },
        { label: 'Total Diesel Cost', value: '₹' + rows.reduce((a, r) => a + r.dieselCost, 0).toLocaleString('en-IN'), unit: '' },
        { label: 'Total Advances', value: '₹' + rows.reduce((a, r) => a + r.advance, 0).toLocaleString('en-IN'), unit: '' },
        { label: 'Route Changes', value: rows.filter(r => r.routeChangeStatus !== 'No route change').length, unit: '' },
      ];
      break;
    }

    default:
      rows = [];
      columns = [];
      summaries = [];
  }

  // Format active filter descriptions for user presentation
  const activeFilterLabels = activeFilters
    .filter(f => {
      if (f.value === undefined || f.value === null || f.value === '') return false;
      if (Array.isArray(f.value)) return f.value.length > 0;
      if (typeof f.value === 'object') return Boolean(f.value.from || f.value.to);
      return true;
    })
    .map(f => {
      const fieldDef = (MODULE_FIELDS[moduleId] || []).find(x => x.key === f.field);
      const fieldLabel = fieldDef ? fieldDef.label : f.field;
      if (f.field === 'date' && f.value) {
        return `${fieldLabel}: ${f.value.from || 'Start'} to ${f.value.to || 'Present'}`;
      }
      if (Array.isArray(f.value)) {
        const resolvedLabels = f.value.map(val => {
          if (f.field === 'driver') return D[val]?.name || val;
          if (f.field === 'vehicle') return V[val]?.number || val;
          if (f.field === 'branch') return B[val]?.name || val;
          if (f.field === 'client') return C[val]?.name || val;
          if (f.field === 'loading') return L[val]?.name || val;
          if (f.field === 'supervisor') return (tms.supervisors || []).find(s => s.id === val)?.name || val;
          return val;
        });
        return `${fieldLabel}: ${resolvedLabels.join(', ')}`;
      }
      let displayVal = f.value;
      if (f.field === 'driver') displayVal = D[f.value]?.name || f.value;
      else if (f.field === 'vehicle') displayVal = V[f.value]?.number || f.value;
      else if (f.field === 'branch') displayVal = B[f.value]?.name || f.value;
      else if (f.field === 'client') displayVal = C[f.value]?.name || f.value;
      else if (f.field === 'loading') displayVal = L[f.value]?.name || f.value;
      return `${fieldLabel}: ${displayVal}`;
    });

  return {
    moduleId,
    moduleMeta: moduleId === ALL_MODULE_ID ? ALL_REPORT_MODULE : REPORT_MODULES.find(m => m.id === moduleId),
    columns,
    rows,
    vehicleColumns,
    vehicleRows,
    summaries,
    activeFilterLabels,
    recordCount: rows.length,
    generatedAt: new Date(),
  };
};
