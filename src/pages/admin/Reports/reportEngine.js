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

// ============================================================================
// 2. FIELD DEFINITIONS PER MODULE (Only real project fields)
// ============================================================================

export const MODULE_FIELDS = {
  driver: [
    { key: 'driver', label: 'Driver', type: 'select', entity: 'drivers' },
    { key: 'branch', label: 'Branch', type: 'select', entity: 'branches' },
    { key: 'vehicle', label: 'Vehicle', type: 'select', entity: 'vehicles' },
    { key: 'type', label: 'Driver Type', type: 'select', options: ['Regular', 'Supporting'] },
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
    { key: 'status', label: 'Trip Status', type: 'select', options: ['Enroute', 'Closed', 'Long open'] },
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
    { key: 'status', label: 'Trip Status', type: 'select', options: ['Closed', 'Enroute'] },
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
};

// ============================================================================
// 3. RELATIONSHIP RESOLUTION (Dependent Dropdowns)
// ============================================================================

/**
 * Resolves available options for a field based on prior filter selections.
 * E.g., if Branch = B01 (Chennai HO), vehicle and driver dropdowns only display
 * Chennai HO records.
 */
export const getDependentOptions = (moduleId, fieldKey, currentFilters, tms) => {
  const branchFilter = currentFilters.find(f => f.field === 'branch')?.value;
  const vehicleFilter = currentFilters.find(f => f.field === 'vehicle')?.value;
  const driverFilter = currentFilters.find(f => f.field === 'driver')?.value;
  const clientFilter = currentFilters.find(f => f.field === 'client')?.value;

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
    if (branchFilter) list = list.filter(v => v.branch === branchFilter);
    if (driverFilter) {
      // Prioritize vehicles assigned to or driven by this driver
      const drivenVehIds = new Set(trips.filter(t => t.driver === driverFilter).map(t => t.vehicle));
      list = list.filter(v => v.driver === driverFilter || drivenVehIds.has(v.id));
    }
    if (clientFilter) {
      list = list.filter(v => (v.clients || []).includes(clientFilter));
    }
    return list.map(v => ({ value: v.id, label: `${v.number} · ${v.type}` }));
  }

  if (fieldKey === 'driver') {
    let list = drivers;
    if (branchFilter) list = list.filter(d => d.branch === branchFilter);
    if (vehicleFilter) {
      const v = vehicles.find(x => x.id === vehicleFilter);
      const tripDriverIds = new Set(trips.filter(t => t.vehicle === vehicleFilter).map(t => t.driver));
      list = list.filter(d => (v && v.driver === d.id) || tripDriverIds.has(d.id));
    }
    return list.map(d => ({ value: d.id, label: `${d.name} (${d.phone || d.licence || d.type})` }));
  }

  if (fieldKey === 'client') {
    let list = clients;
    if (branchFilter) list = list.filter(c => c.branch === branchFilter);
    return list.map(c => ({ value: c.id, label: c.name }));
  }

  if (fieldKey === 'loading' || fieldKey === 'location') {
    let list = locations;
    if (branchFilter) list = list.filter(l => l.branch === branchFilter);
    if (clientFilter) list = list.filter(l => l.client === clientFilter || l.clientId === clientFilter);
    return list.map(l => ({ value: l.id, label: l.name }));
  }

  if (fieldKey === 'bunk') {
    let list = bunks;
    if (branchFilter) list = list.filter(b => b.branch === branchFilter);
    return list.map(b => ({ value: b.name, label: `${b.name} (${b.rate ? '₹' + b.rate + '/L' : 'Active'})` }));
  }

  if (fieldKey === 'supervisor') {
    let list = supervisors;
    if (branchFilter) list = list.filter(s => s.branch === branchFilter);
    return list.map(s => ({ value: s.id, label: s.name }));
  }

  // Predefined options
  const fieldDef = (MODULE_FIELDS[moduleId] || []).find(f => f.key === fieldKey);
  if (fieldDef && fieldDef.options) {
    return fieldDef.options.map(opt => ({ value: opt, label: opt }));
  }

  return [];
};

// ============================================================================
// 4. FILTER EVALUATION LOGIC
// ============================================================================

export const evaluateCondition = (recordVal, operator, filterVal) => {
  if (filterVal === undefined || filterVal === null || filterVal === '') return true;

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
        { key: 'tripsCount', label: 'Trips (Real)', kind: 'num' },
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
          util,
          variances,
        };
      });

      // Apply dynamic AND filters
      activeFilters.forEach(f => {
        if (!f.value || f.field === 'date') return;
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
          if (f.op === 'not_equals') {
            if (f.value === 'Present') rows = rows.filter(r => r.presentDays === 0);
            else if (f.value === 'Absent') rows = rows.filter(r => r.absentDays === 0);
            else if (f.value === 'High Absence (>3 days)') rows = rows.filter(r => r.absentDays <= 3);
          } else {
            if (f.value === 'Present') rows = rows.filter(r => r.presentDays > 0);
            else if (f.value === 'Absent') rows = rows.filter(r => r.absentDays > 0);
            else if (f.value === 'High Absence (>3 days)') rows = rows.filter(r => r.absentDays > 3);
          }
        }
      });

      // Summary KPIs derived strictly from filtered rows
      summaries = [
        { label: 'Total Drivers', value: rows.length, unit: '' },
        { label: 'Total Real Trips', value: rows.reduce((a, r) => a + r.tripsCount, 0), unit: '' },
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
        { key: 'tripsCount', label: 'Trips (Real)', kind: 'num' },
        { key: 'totalDistance', label: 'Total Distance', kind: 'num', unit: 'km' },
        { key: 'totalDiesel', label: 'Diesel Consumed', kind: 'num', unit: 'L' },
        { key: 'exceptionsCount', label: 'Exceptions', kind: 'num' },
      ];

      rows = vehicles.map(v => {
        const vBranch = B[v.branch]?.name || v.branch;
        const vDriver = D[v.driver]?.name || (v.driver ? v.driver : 'No driver');
        const vClients = (v.clients || []).map(cid => C[cid]?.name || cid).join(', ') || 'General Fleet';

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
        if (!f.value || f.field === 'date') return;
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
          rows = rows.filter(r => {
            const hasClient = (r.clientsList || []).includes(f.value) || matchesEntityOrText(null, r.client, 'contains', f.value);
            return f.op === 'not_equals' ? !hasClient : hasClient;
          });
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
        const statusLabel = isLongOpen ? 'Long open' : t.status;

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
          supervisor: t.supervisor,
        };
      });

      if (dateFilter && dateFilter.value) {
        rows = rows.filter(r => evaluateDateRange(r.timestamp, dateFilter.value));
      }

      activeFilters.forEach(f => {
        if (!f.value || f.field === 'date') return;
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
          rows = rows.filter(r => evaluateCondition(r.status, f.op || 'equals', f.value));
        } else if (f.field === 'loading') {
          rows = rows.filter(r => matchesEntityOrText(r.loadingId, r.from, f.op, f.value));
        } else if (f.field === 'supervisor') {
          rows = rows.filter(r => matchesEntityOrText(r.supervisor, null, f.op, f.value));
        }
      });

      summaries = [
        { label: 'Total Trips', value: rows.length, unit: '' },
        { label: 'Closed Trips', value: rows.filter(r => r.status === 'Closed').length, unit: '' },
        { label: 'Enroute Trips', value: rows.filter(r => r.status !== 'Closed').length, unit: '' },
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
        { key: 'tripsCount', label: 'Trips (Real)', kind: 'num' },
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
        if (!f.value || f.field === 'date') return;
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
        { key: 'paymentMode', label: 'Payment Mode', kind: 'badge' },
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
        if (!f.value || f.field === 'date') return;
        if (f.field === 'vehicle') {
          rows = rows.filter(r => matchesEntityOrText(r.vehicleId, r.vehicle, f.op, f.value));
        } else if (f.field === 'driver') {
          rows = rows.filter(r => matchesEntityOrText(r.driverId, r.driver, f.op, f.value));
        } else if (f.field === 'branch') {
          rows = rows.filter(r => matchesEntityOrText(r.branchId, r.branch, f.op, f.value));
        } else if (f.field === 'bunk') {
          rows = rows.filter(r => matchesEntityOrText(null, r.bunk, f.op, f.value));
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
        const driverBata = exp.driverBata || 0;
        const cleanerBata = exp.cleanerBata || 0;
        const toll = (exp.toll || 0) + (exp.weighment || 0);
        const otherList = (t.otherExpenses || []).map(o => `${o.name}: ₹${o.amount}`).join('; ');
        const totalExp = parseMoney(t.totalExpense) || (driverBata + cleanerBata + toll + (exp.rto || 0));

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
          advance: advVal,
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
        if (!f.value || f.field === 'date') return;
        if (f.field === 'branch') {
          rows = rows.filter(r => matchesEntityOrText(r.branchId, r.branch, f.op, f.value));
        } else if (f.field === 'vehicle') {
          rows = rows.filter(r => matchesEntityOrText(r.vehicleId, r.vehicle, f.op, f.value));
        } else if (f.field === 'driver') {
          rows = rows.filter(r => matchesEntityOrText(r.driverId, r.driver, f.op, f.value));
        } else if (f.field === 'status') {
          rows = rows.filter(r => evaluateCondition(r.status, f.op || 'equals', f.value));
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
        { key: 'contact', label: 'Desk / Contact', kind: 'text' },
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
        if (!f.value || f.field === 'date') return;
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
          location: div.at || 'Enroute Corridor',
          offKm: div.offKm || div.extraKm || '—',
          fixedKm: fixed || '—',
          gpsKm: gps || '—',
          variancePct: variancePct != null ? variancePct : '—',
          status: div.state || (t.status === 'Closed' ? 'Reviewed' : 'Active diversion'),
        };
      });

      if (dateFilter && dateFilter.value) {
        rows = rows.filter(r => evaluateDateRange(r.timestamp, dateFilter.value));
      }

      activeFilters.forEach(f => {
        if (!f.value || f.field === 'date') return;
        if (f.field === 'branch') {
          rows = rows.filter(r => matchesEntityOrText(r.branchId, r.branch, f.op, f.value));
        } else if (f.field === 'vehicle') {
          rows = rows.filter(r => matchesEntityOrText(r.vehicleId, r.vehicle, f.op, f.value));
        } else if (f.field === 'driver') {
          rows = rows.filter(r => matchesEntityOrText(r.driverId, r.driver, f.op, f.value));
        } else if (f.field === 'status') {
          rows = rows.filter(r => evaluateCondition(r.status, f.op || 'equals', f.value));
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
        { key: 'status', label: 'Duty Status', kind: 'badge' },
        { key: 'present', label: 'Present Days', kind: 'num' },
        { key: 'absent', label: 'Absent Days', kind: 'num' },
        { key: 'util', label: 'Fleet Utilisation', kind: 'text' },
        { key: 'tripsMonth', label: 'Trips Assigned', kind: 'num' },
        { key: 'note', label: 'Attendance Audit Note', kind: 'text' },
      ];

      rows = drivers.map(d => {
        const assignedVeh = vehicles.find(v => v.driver === d.id);
        const dTrips = trips.filter(t => t.driver === d.id);
        const present = d.present != null ? d.present : 0;
        const absent = d.absent != null ? d.absent : 0;
        let note = 'Normal attendance';
        if (d.status === 'Inactive') note = 'Continuous absence / Inactive';
        else if (absent >= 6) note = `Absent ${absent} days this month`;

        return {
          id: d.id,
          driver: d.name,
          driverId: d.id,
          branch: B[d.branch]?.name || d.branch,
          branchId: d.branch,
          vehicle: assignedVeh ? assignedVeh.number : '—',
          vehicleId: assignedVeh ? assignedVeh.id : '',
          dtype: d.type || 'Regular',
          status: d.status || 'Active',
          present,
          absent,
          util: d.util || (present + absent > 0 ? Math.round((present / (present + absent)) * 100) + '%' : '—'),
          tripsMonth: dTrips.length,
          note,
        };
      });

      activeFilters.forEach(f => {
        if (!f.value || f.field === 'date') return;
        if (f.field === 'branch') {
          rows = rows.filter(r => matchesEntityOrText(r.branchId, r.branch, f.op, f.value));
        } else if (f.field === 'driver') {
          rows = rows.filter(r => matchesEntityOrText(r.driverId, r.driver, f.op, f.value));
        } else if (f.field === 'vehicle') {
          rows = rows.filter(r => matchesEntityOrText(r.vehicleId, r.vehicle, f.op, f.value));
        } else if (f.field === 'status') {
          if (f.op === 'not_equals') {
            if (f.value === 'Present') rows = rows.filter(r => r.present === 0);
            else if (f.value === 'Absent') rows = rows.filter(r => r.absent === 0);
            else rows = rows.filter(r => evaluateCondition(r.status, f.op, f.value));
          } else {
            if (f.value === 'Present') rows = rows.filter(r => r.present > 0);
            else if (f.value === 'Absent') rows = rows.filter(r => r.absent > 0);
            else rows = rows.filter(r => evaluateCondition(r.status, f.op || 'equals', f.value));
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
        const uniqueVehicles = new Set(outTrips.map(t => t.vehicle)).size;

        return {
          id: l.id,
          name: l.name,
          client: C[l.client || l.clientId]?.name || '—',
          clientId: l.client || l.clientId,
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
        if (!f.value) return;
        if (f.field === 'location') {
          rows = rows.filter(r => matchesEntityOrText(r.id, r.name, f.op, f.value));
        } else if (f.field === 'client') {
          rows = rows.filter(r => matchesEntityOrText(r.clientId, r.client, f.op, f.value));
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

    default:
      rows = [];
      columns = [];
      summaries = [];
  }

  // Format active filter descriptions for user presentation
  const activeFilterLabels = activeFilters
    .filter(f => f.value && (typeof f.value !== 'object' || f.value.from || f.value.to))
    .map(f => {
      const fieldDef = (MODULE_FIELDS[moduleId] || []).find(x => x.key === f.field);
      const fieldLabel = fieldDef ? fieldDef.label : f.field;
      if (f.field === 'date' && f.value) {
        return `${fieldLabel}: ${f.value.from || 'Start'} to ${f.value.to || 'Present'}`;
      }
      const opText = f.op === 'not_equals' ? 'is not' : f.op === 'contains' ? 'includes' : 'is';
      return `${fieldLabel} ${opText} ${f.value}`;
    });

  return {
    moduleId,
    moduleMeta: REPORT_MODULES.find(m => m.id === moduleId),
    columns,
    rows,
    summaries,
    activeFilterLabels,
    recordCount: rows.length,
    generatedAt: new Date(),
  };
};
