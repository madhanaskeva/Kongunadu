/* Report builder engine for the Admin Portal Reports page.
 *
 * Pure functions, no UI:
 *   TMSReports.TYPES                        report types and their fields
 *   TMSReports.dataset(type, T)             rows for a report type, built from window.TMS
 *   TMSReports.inferType(text)              report type a typed condition is about, or ''
 *   TMSReports.parse(text, type, T)         typed condition -> { clauses, notes, understood }
 *   TMSReports.run(spec, T)                 { type, quick, conditions } -> rows
 *   TMSReports.xlsx(sheets)                 [{ name, columns, rows }] -> Blob (.xlsx)
 *
 * A parsed clause is plain JSON ({ field, op, value, label }) so a backend can later
 * receive the same structure and run it as a database query instead of run().
 */
// "Today" in the prototype data set; the portal header shows the same date.
var NOW = new Date(2026, 8, 14, 11, 32).getTime();
  var DAY = 86400000;
  var MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  function stamp(txt) {
    var p = String(txt || '').split(' '), m = MONTHS.indexOf(String(p[1] || '').slice(0, 3).toLowerCase());
    if (m < 0) return null;
    var hm = String(p[3] || '00:00').split(':');
    return new Date(+p[2], m, +p[0], +hm[0] || 0, +hm[1] || 0).getTime();
  }
  function num(v) { if (v == null || v === '') return null; if (typeof v === 'number') return v; var m = /-?[\d,]+(\.\d+)?/.exec(String(v)); return m ? parseFloat(m[0].replace(/,/g, '')) : null; }
  function nm(map, id) { return (map[id] || {}).name || ''; }
  function squash(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

  // ---- report types -------------------------------------------------------------------------
  // kind: text | num | date. def: shown by default. unit: appended in the preview.
  var TYPES = {
    trip: { label: 'Trip Report', noun: 'trips', fields: [
      { key: 'number', label: 'Trip Number', kind: 'text', def: true },
      { key: 'date', label: 'Date', kind: 'date', def: true },
      { key: 'vehicle', label: 'Vehicle Number', kind: 'text', def: true },
      { key: 'driver', label: 'Driver Name', kind: 'text', def: true },
      { key: 'branch', label: 'Branch', kind: 'text', def: true },
      { key: 'client', label: 'Client', kind: 'text' },
      { key: 'customer', label: 'Customer', kind: 'text' },
      { key: 'from', label: 'Loading Location', kind: 'text' },
      { key: 'supervisor', label: 'Supervisor', kind: 'text' },
      { key: 'type', label: 'Trip Type', kind: 'text', def: true },
      { key: 'reason', label: 'Non-business Reason', kind: 'text' },
      { key: 'startKm', label: 'Start KM', kind: 'num' },
      { key: 'closeKm', label: 'Closing KM', kind: 'num' },
      { key: 'distance', label: 'Distance', kind: 'num', unit: 'km', def: true },
      { key: 'fixedKm', label: 'Fixed KM', kind: 'num', unit: 'km' },
      { key: 'gpsKm', label: 'GPS KM', kind: 'num', unit: 'km' },
      { key: 'odoKm', label: 'Odometer KM', kind: 'num', unit: 'km' },
      { key: 'variance', label: 'Variance', kind: 'num', unit: '%' },
      { key: 'diesel', label: 'Diesel', kind: 'num', unit: 'L' },
      { key: 'hoursOpen', label: 'Hours Open', kind: 'num', unit: 'h' },
      { key: 'status', label: 'Status', kind: 'text', def: true },
      { key: 'flags', label: 'Flags', kind: 'text' }
    ] },
    vehicle: { label: 'Vehicle Report', noun: 'vehicles', fields: [
      { key: 'vehicle', label: 'Vehicle Number', kind: 'text', def: true },
      { key: 'vtype', label: 'Vehicle Type', kind: 'text', def: true },
      { key: 'branch', label: 'Branch', kind: 'text', def: true },
      { key: 'driver', label: 'Driver Name', kind: 'text', def: true },
      { key: 'client', label: 'Client', kind: 'text' },
      { key: 'status', label: 'Status', kind: 'text', def: true },
      { key: 'gps', label: 'GPS', kind: 'text', def: true },
      { key: 'odometer', label: 'Odometer KM', kind: 'num', unit: 'km', def: true },
      { key: 'trips', label: 'Trips', kind: 'num' },
      { key: 'distance', label: 'Distance', kind: 'num', unit: 'km' },
      { key: 'diesel', label: 'Diesel', kind: 'num', unit: 'L' },
      { key: 'lastSeen', label: 'Last Seen', kind: 'text' },
      { key: 'route', label: 'Route', kind: 'text' }
    ] },
    driver: { label: 'Driver Report', noun: 'drivers', fields: [
      { key: 'driver', label: 'Driver Name', kind: 'text', def: true },
      { key: 'licence', label: 'Licence', kind: 'text' },
      { key: 'phone', label: 'Mobile', kind: 'text' },
      { key: 'branch', label: 'Branch', kind: 'text', def: true },
      { key: 'dtype', label: 'Driver Type', kind: 'text', def: true },
      { key: 'vehicle', label: 'Vehicle Number', kind: 'text', def: true },
      { key: 'approval', label: 'Approval', kind: 'text' },
      { key: 'status', label: 'Status', kind: 'text', def: true },
      { key: 'present', label: 'Present Days', kind: 'num' },
      { key: 'absent', label: 'Absent Days', kind: 'num', def: true },
      { key: 'util', label: 'Utilisation', kind: 'num', unit: '%' },
      { key: 'trips', label: 'Trips', kind: 'num', def: true },
      { key: 'distance', label: 'Distance', kind: 'num', unit: 'km' }
    ] },
    attendance: { label: 'Attendance Report', noun: 'drivers', fields: [
      { key: 'driver', label: 'Driver Name', kind: 'text', def: true },
      { key: 'branch', label: 'Branch', kind: 'text', def: true },
      { key: 'dtype', label: 'Driver Type', kind: 'text', def: true },
      { key: 'vehicle', label: 'Vehicle Number', kind: 'text' },
      { key: 'present', label: 'Present Days', kind: 'num', def: true },
      { key: 'absent', label: 'Absent Days', kind: 'num', def: true },
      { key: 'util', label: 'Utilisation', kind: 'num', unit: '%', def: true },
      { key: 'status', label: 'Status', kind: 'text', def: true },
      { key: 'note', label: 'Note', kind: 'text' }
    ] },
    gps: { label: 'GPS Report', noun: 'vehicles', fields: [
      { key: 'vehicle', label: 'Vehicle Number', kind: 'text', def: true },
      { key: 'branch', label: 'Branch', kind: 'text', def: true },
      { key: 'driver', label: 'Driver Name', kind: 'text' },
      { key: 'gps', label: 'GPS Status', kind: 'text', def: true },
      { key: 'lastSeen', label: 'Last Seen', kind: 'text', def: true },
      { key: 'openTrip', label: 'Open Trip', kind: 'text', def: true },
      { key: 'gpsKm', label: 'GPS KM', kind: 'num', unit: 'km' },
      { key: 'odometer', label: 'Odometer KM', kind: 'num', unit: 'km' },
      { key: 'issues', label: 'GPS Issues', kind: 'num', def: true },
      { key: 'route', label: 'Route', kind: 'text' }
    ] },
    exception: { label: 'Exception Report', noun: 'exceptions', fields: [
      { key: 'date', label: 'Raised', kind: 'date', def: true },
      { key: 'etype', label: 'Exception Type', kind: 'text', def: true },
      { key: 'severity', label: 'Severity', kind: 'text', def: true },
      { key: 'vehicle', label: 'Vehicle Number', kind: 'text', def: true },
      { key: 'trip', label: 'Trip Number', kind: 'text' },
      { key: 'branch', label: 'Branch', kind: 'text', def: true },
      { key: 'status', label: 'Status', kind: 'text', def: true },
      { key: 'assignee', label: 'Assignee', kind: 'text' },
      { key: 'detail', label: 'Detail', kind: 'text' }
    ] }
  };
  // Quick filters each report type can use (the rest are shown as not applicable)
  var QUICK = {
    trip: ['branch', 'vehicle', 'driver', 'client', 'customer', 'date', 'tripType'],
    vehicle: ['branch', 'vehicle', 'driver', 'client'],
    driver: ['branch', 'vehicle', 'driver'],
    attendance: ['branch', 'vehicle', 'driver'],
    gps: ['branch', 'vehicle', 'driver'],
    exception: ['branch', 'vehicle', 'date']
  };

  // ---- datasets -----------------------------------------------------------------------------
  function tripStatus(t) {
    var flags = t.flags || [];
    if (t.status === 'Closed') return flags.length ? 'Closed · flagged' : 'Closed';
    if (t.hoursOpen > 24) return 'Long open';
    if (flags.some(function (f) { return /gps/i.test(f); })) return 'GPS issue';
    return 'Enroute';
  }
  function tripDistance(t) { return t.closeKm != null && t.startKm != null ? t.closeKm - t.startKm : t.gpsKm != null ? t.gpsKm : null; }
  function dataset(type, T) {
    var trips = T.trips || [];
    if (type === 'trip') return trips.map(function (t) {
      var gv = t.fixedKm && t.gpsKm != null ? Math.abs(t.gpsKm - t.fixedKm) / t.fixedKm * 100 : 0;
      var ov = t.fixedKm && t.odoKm != null ? Math.abs(t.odoKm - t.fixedKm) / t.fixedKm * 100 : 0;
      return { _id: t.id, _branch: t.branch, _vehicle: t.vehicle, _driver: t.driver, _client: t.client, _customers: t.customers || [], _ts: stamp(t.opened), _type: t.type, _open: t.status !== 'Closed',
        number: t.number, date: t.opened, vehicle: nm2(T.V, t.vehicle, 'number'), driver: nm(T.D, t.driver), branch: nm(T.B, t.branch), client: nm(T.C, t.client),
        customer: t.unloading || (t.customers || []).map(function (u) { return nm(T.U, u); }).join(', '), from: nm(T.L, t.loading), supervisor: nm(T.S, t.supervisor),
        type: t.type, reason: t.reason || '', startKm: t.startKm, closeKm: t.closeKm, distance: tripDistance(t), fixedKm: t.fixedKm || null, gpsKm: t.gpsKm, odoKm: t.odoKm,
        variance: t.status === 'Closed' && t.fixedKm ? Math.round(Math.max(gv, ov) * 10) / 10 : null, diesel: num(t.diesel), hoursOpen: t.status === 'Closed' ? null : t.hoursOpen,
        status: tripStatus(t), flags: (t.flags || []).join(', ') };
    });
    if (type === 'vehicle' || type === 'gps') return (T.vehicles || []).map(function (v) {
      var vt = trips.filter(function (t) { return t.vehicle === v.id; }), open = vt.find(function (t) { return t.status !== 'Closed'; });
      var issues = vt.filter(function (t) { return (t.flags || []).some(function (f) { return /gps/i.test(f); }); }).length + (T.exceptions || []).filter(function (x) { return x.vehicle === v.id && /gps|both sources/i.test(x.type); }).length;
      var base = { _id: v.id, _branch: v.branch, _vehicle: v.id, _driver: v.driver, _clients: v.clients || [], vehicle: v.number, branch: nm(T.B, v.branch), driver: v.driver ? nm(T.D, v.driver) : 'No driver', route: v.route || '', lastSeen: v.lastSeen || '', odometer: v.odometer };
      if (type === 'gps') return Object.assign(base, { gps: v.gps, openTrip: open ? open.number : '', gpsKm: open ? open.gpsKm : null, issues: issues });
      return Object.assign(base, { vtype: v.type, client: (v.clients || []).map(function (c) { return nm(T.C, c); }).join(', '), status: v.status, gps: v.gps, trips: vt.length,
        distance: vt.reduce(function (a, t) { return a + (tripDistance(t) || 0); }, 0), diesel: vt.reduce(function (a, t) { return a + (num(t.diesel) || 0); }, 0) });
    });
    if (type === 'driver' || type === 'attendance') return (T.drivers || []).filter(function (d) { return type === 'driver' || d.approval === 'Approved'; }).map(function (d) {
      var dt = trips.filter(function (t) { return t.driver === d.id; }), veh = (T.vehicles || []).find(function (v) { return v.driver === d.id; });
      var base = { _id: d.id, _branch: d.branch, _vehicle: veh ? veh.id : '', _driver: d.id, driver: d.name, branch: nm(T.B, d.branch), dtype: d.type, vehicle: veh ? veh.number : '',
        status: d.status, present: d.present != null ? d.present : null, absent: d.absent != null ? d.absent : null, util: num(d.util) };
      if (type === 'attendance') return Object.assign(base, { note: d.status === 'Inactive' ? 'Continuous absence' : d.absent >= 6 ? 'Absent ' + d.absent + ' days this month' : '' });
      return Object.assign(base, { licence: d.licence || '', phone: d.phone || '', approval: d.approval || '', trips: dt.length, distance: dt.reduce(function (a, t) { return a + (tripDistance(t) || 0); }, 0) });
    });
    if (type === 'exception') return (T.exceptions || []).map(function (x) {
      return { _id: x.id, _branch: x.branch, _vehicle: x.vehicle, _ts: stamp(x.raised), _trip: x.trip, date: x.raised, etype: x.type, severity: x.severity, vehicle: nm2(T.V, x.vehicle, 'number'),
        trip: (T.T[x.trip] || {}).number || '', branch: nm(T.B, x.branch), status: x.status, assignee: x.assignee, detail: x.detail };
    });
    return [];
  }
  function nm2(map, id, key) { return (map[id] || {})[key] || ''; }
  function fieldOf(type, key) { return (TYPES[type].fields.filter(function (f) { return f.key === key; })[0]) || null; }

  // ---- natural-language conditions ----------------------------------------------------------
  // Which report a condition is about, from its subject words. '' when it could be any.
  function inferType(text) {
    var t = ' ' + String(text || '').toLowerCase() + ' ';
    if (/absent|present|attendance/.test(t)) return 'attendance';
    if (/exception|hidden k|diversion|radius breach|severity/.test(t)) return 'exception';
    if (/variance|diesel|fuel/.test(t)) return 'trip';
    if (/gps (health|status|fix|report)|no fix|weak signal|gps signal/.test(t)) return 'gps';
    if (/^\s*(show|list|find|all|get|give)?\s*(me\s+)?(all\s+)?(the\s+)?drivers?\b/.test(t)) return 'driver';
    if (/^\s*(show|list|find|all|get|give)?\s*(me\s+)?(all\s+)?(the\s+)?vehicles?\b/.test(t)) return 'vehicle';
    if (/\btrips?\b|diesel|business/.test(t)) return 'trip';
    if (/\bvehicles?\b|\bfleet\b|\bodometer\b/.test(t)) return 'vehicle';
    if (/\bdrivers?\b/.test(t)) return 'driver';
    return '';
  }

  var OPS = [
    [/(?:more than|greater than|above|over|exceeding|higher than|>)\s*/, 'gt', 'above'],
    [/(?:at least|minimum of|min\.?|>=)\s*/, 'gte', 'at least'],
    [/(?:less than|fewer than|below|under|lower than|<)\s*/, 'lt', 'below'],
    [/(?:at most|maximum of|max\.?|up to|<=)\s*/, 'lte', 'at most']
  ];
  var UNIT = '(%|kilomet(?:er|re)s?|kms|km|litres?|liters?|ltrs?|l|days?|hours?|hrs?|h|trips?)?(?![a-z])';

  // Pick the numeric field a number refers to, from its unit and the words around it
  function numField(type, unit, t) {
    var has = function (k) { return !!fieldOf(type, k); };
    var pick = function () { for (var i = 0; i < arguments.length; i++) if (has(arguments[i])) return arguments[i]; return ''; };
    unit = (unit || '').toLowerCase();
    if (/^(l|ltrs?|litres?|liters?)$/.test(unit) || /diesel|litre|liter|fuel/.test(t)) return pick('diesel');
    if (/absent/.test(t)) return pick('absent');
    if (/present/.test(t)) return pick('present');
    if (/utili[sz]ation|utilised|utilized/.test(t)) return pick('util');
    if (/variance|deviation/.test(t) || (unit === '%' && has('variance'))) return pick('variance');
    if (unit === '%') return pick('util', 'variance');
    if (/^(hours?|hrs?|h)$/.test(unit) || /hours? open|open for/.test(t)) return pick('hoursOpen');
    if (/^trips?$/.test(unit) || /\bmore than \d+ trips|\btrips? (above|over|more)/.test(t)) return pick('trips');
    if (/gps (issue|gap|failure)s?/.test(t) && !unit) return pick('issues');
    if (/start(ing)? km|start km/.test(t)) return pick('startKm');
    if (/clos(ing|e) km/.test(t)) return pick('closeKm');
    if (/fixed/.test(t)) return pick('fixedKm');
    if (/gps km|gps distance/.test(t)) return pick('gpsKm', 'distance');
    if (/odometer|odo\b/.test(t)) return pick('odoKm', 'odometer');
    if (/distance|travel|run\b|ran\b|covered/.test(t)) return pick('distance', 'odometer');
    if (/^(km|kms|kilomet)/.test(unit) || /\bkm\b|kilomet/.test(t)) return type === 'vehicle' || type === 'gps' ? pick('odometer') : pick('distance', 'odometer');
    if (/^days?$/.test(unit)) return pick('absent', 'hoursOpen');
    return { trip: 'distance', vehicle: 'odometer', gps: 'odometer', driver: 'absent', attendance: 'absent', exception: '' }[type] || '';
  }
  function fmt(n) { return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 1 }); }
  function range(from, to, label) { return { field: 'date', op: 'between', value: [from, to], label: 'Date ' + label }; }

  function parse(text, type, T) {
    var raw = String(text || '').trim(), t = ' ' + raw.toLowerCase().replace(/\s+/g, ' ') + ' ', clauses = [], notes = [];
    if (!raw) return { clauses: [], notes: [], understood: false };
    var add = function (c) { clauses.push(c); };
    var has = function (k) { return !!fieldOf(type, k); };

    // numbers: "between 100 and 200 km", "above 5000 km", "more than 3 days"
    var used = [];
    var between = new RegExp('between\\s+(\\d[\\d,]*(?:\\.\\d+)?)\\s*(?:and|to|-)\\s*(\\d[\\d,]*(?:\\.\\d+)?)\\s*' + UNIT, 'g'), m;
    while ((m = between.exec(t))) {
      var bf = numField(type, m[3], t); used.push(m.index);
      if (bf) add({ field: bf, op: 'between', value: [num(m[1]), num(m[2])], label: fieldOf(type, bf).label + ' between ' + fmt(num(m[1])) + ' and ' + fmt(num(m[2])) + unitOf(type, bf) });
    }
    OPS.forEach(function (o) {
      var re = new RegExp(o[0].source + '(\\d[\\d,]*(?:\\.\\d+)?)\\s*' + UNIT, 'g'), mm;
      while ((mm = re.exec(t))) {
        var f = numField(type, mm[2], t), v = num(mm[1]);
        if (!f) { notes.push('No number column in ' + TYPES[type].label + ' for "' + mm[0].trim() + '"'); continue; }
        add({ field: f, op: o[1], value: v, label: fieldOf(type, f).label + ' ' + o[2] + ' ' + fmt(v) + unitOf(type, f) });
      }
    });

    // presets that stand for a known rule
    if (/long[- ]open/.test(t)) {
      if (type === 'trip') { add({ field: 'status', op: 'eq', value: 'Long open', label: 'Status is Long open (open over 24 h)' }); }
      else if (type === 'exception') add({ field: 'etype', op: 'eq', value: 'Long open trip', label: 'Type is Long open trip' });
    }
    if (/gps (fail|failure|failed|issue|problem|lost)|no gps|without gps|no fix/.test(t)) {
      if (type === 'trip') add({ field: 'flags', op: 'contains', value: 'gps', label: 'Flags mention GPS' });
      else if (type === 'vehicle' || type === 'gps') add({ field: 'gps', op: 'in', value: ['Failed'], label: 'GPS is Failed' });
      else if (type === 'exception') add({ field: 'etype', op: 'contains', value: 'gps', label: 'Type is a GPS failure' });
    }
    if (/weak (gps|signal)|gps weak/.test(t) && (type === 'vehicle' || type === 'gps')) add({ field: 'gps', op: 'in', value: ['Weak'], label: 'GPS is Weak' });
    if (/non[- ]?business|non[- ]?billable/.test(t) && has('type')) add({ field: 'type', op: 'eq', value: 'Non-Business', label: 'Trip type is Non-Business' });
    else if (/\bbusiness\b|\bbillable\b/.test(t) && has('type')) add({ field: 'type', op: 'eq', value: 'Business', label: 'Trip type is Business' });
    if (type === 'trip') {
      if (/\b(open|enroute|en route|running|ongoing|in transit)\b/.test(t) && !/long[- ]open/.test(t)) add({ field: '_open', op: 'eq', value: true, label: 'Trip is open (enroute)' });
      if (/\bclosed\b|\bcompleted\b/.test(t)) add({ field: '_open', op: 'eq', value: false, label: 'Trip is closed' });
      if (/\bflagged\b/.test(t)) add({ field: 'flags', op: 'filled', value: true, label: 'Trip has flags' });
      if (/maintenance|empty return|internal movement|driver testing/.test(t)) { var rs = /maintenance|empty return|internal movement|driver testing/.exec(t)[0]; add({ field: 'reason', op: 'contains', value: rs, label: 'Reason is ' + cap(rs) }); }
    }
    if (type === 'vehicle') {
      ['running', 'idle', 'maintenance'].forEach(function (st) { if (new RegExp('\\b' + st + '\\b').test(t)) add({ field: 'status', op: 'eq', value: cap(st), label: 'Status is ' + cap(st) }); });
      if (/no driver|without (a )?driver/.test(t)) add({ field: 'driver', op: 'eq', value: 'No driver', label: 'No driver assigned' });
    }
    if (type === 'driver' || type === 'attendance') {
      if (/\binactive\b/.test(t)) add({ field: 'status', op: 'eq', value: 'Inactive', label: 'Status is Inactive' });
      else if (/\bactive\b/.test(t)) add({ field: 'status', op: 'eq', value: 'Active', label: 'Status is Active' });
      if (/supporting/.test(t)) add({ field: 'dtype', op: 'eq', value: 'Supporting', label: 'Driver type is Supporting' });
      if (/\bregular\b/.test(t)) add({ field: 'dtype', op: 'eq', value: 'Regular', label: 'Driver type is Regular' });
      if (/pending/.test(t) && has('approval')) add({ field: 'approval', op: 'contains', value: 'pending', label: 'Approval is pending' });
    }
    if (type === 'exception') {
      ['high', 'medium', 'low'].forEach(function (sv) { if (new RegExp('\\b' + sv + '\\b').test(t)) add({ field: 'severity', op: 'eq', value: cap(sv), label: 'Severity is ' + cap(sv) }); });
      [['hidden k', 'Hidden kilometres'], ['variance', 'Distance variance'], ['diversion', 'Route diversion'], ['radius', 'Radius breach'], ['both sources', 'Both sources failed'], ['missing attendance', 'Missing attendance'], ['idle', 'Idle vehicles']].forEach(function (p) {
        if (t.indexOf(p[0]) >= 0 && !clauses.some(function (c) { return c.field === 'etype'; })) add({ field: 'etype', op: 'eq', value: p[1], label: 'Type is ' + p[1] });
      });
      if (/unassigned/.test(t)) add({ field: 'assignee', op: 'eq', value: 'Unassigned', label: 'Not assigned' });
      if (/\bresolved\b/.test(t)) add({ field: 'status', op: 'eq', value: 'Resolved', label: 'Status is Resolved' });
      else if (/under review/.test(t)) add({ field: 'status', op: 'eq', value: 'Under review', label: 'Status is Under review' });
      else if (/\bopen\b|unresolved/.test(t)) add({ field: 'status', op: 'eq', value: 'Open', label: 'Status is Open' });
    }

    // people, places and things from the masters
    var names = [];
    (T.branches || []).forEach(function (b) {
      var keys = [b.name.toLowerCase(), b.name.toLowerCase().split(' ')[0]].concat(b.name === 'Bengaluru' ? ['bangalore'] : b.name === 'Visakhapatnam' ? ['vizag'] : []);
      if (keys.some(function (k) { return new RegExp('\\b' + k + '\\b').test(t); })) { names.push(b.name.toLowerCase().split(' ')[0]); add({ field: '_branch', op: 'eq', value: b.id, label: 'Branch is ' + b.name }); }
    });
    // "branch is Madurai" for a branch that is not in the master
    var bm = /\bbranch\s*(?:is|=|:|of)?\s*([a-z]{3,})/.exec(t);
    if (bm && has('branch') && !clauses.some(function (c) { return c.field === '_branch'; }) && !/^(is|of|and|wise|report)$/.test(bm[1])) { names.push(bm[1]); add({ field: 'branch', op: 'contains', value: bm[1], label: 'Branch is ' + cap(bm[1]) }); }
    var sup = /(?:supervisor|handled by|managed by|opened by)\s+((?:supervisor\s+)?[a-z.]+(?:\s+[a-z.]+)?)/.exec(t);
    if (sup && has('supervisor')) {
      var sn = sup[1].replace(/^supervisor\s+/, '').replace(/\b(in|on|for|from|during|this|last|with)\b.*$/, '').trim(), s = (T.supervisors || []).filter(function (x) { return x.name.toLowerCase().indexOf(sn.split(' ')[0]) >= 0; })[0];
      names.push(sn.split(' ')[0]);
      add({ field: 'supervisor', op: 'contains', value: s ? s.name : sn, label: 'Supervisor is ' + (s ? s.name : cap(sn)) });
    } else if (sup) notes.push(TYPES[type].label + ' has no supervisor column');
    (T.drivers || []).forEach(function (d) {
      var first = d.name.toLowerCase().split(/[ .]/)[0];
      if (first.length >= 4 && names.indexOf(first) < 0 && new RegExp('\\b' + first + '\\b').test(t) && !new RegExp('(supervisor|handled by|managed by)\\s+' + first).test(t) && has('driver')) {
        names.push(first); add({ field: 'driver', op: 'contains', value: d.name, label: 'Driver is ' + d.name });
      }
    });
    var vm = /\b([a-z]{2})\s*(\d{2})\s*([a-z]{1,3})\s*(\d{3,4})\b/.exec(t);
    if (vm && has('vehicle')) add({ field: 'vehicle', op: 'squash', value: squash(vm[0]), label: 'Vehicle is ' + vm[0].toUpperCase() });
    (T.clients || []).forEach(function (c) {
      var keys = [c.name.toLowerCase(), c.name.toLowerCase().split(' ')[0]].concat(/bharat/i.test(c.name) ? ['bpcl'] : /hindustan/i.test(c.name) ? ['hpcl'] : []);
      if (has('client') && keys.some(function (k) { return k.length >= 4 && new RegExp('\\b' + k + '\\b').test(t); })) add({ field: 'client', op: 'contains', value: c.name, label: 'Client is ' + c.name });
    });

    // places not in the branch master: "from Madurai", "to Salem", "between Madurai and Salem"
    var placeRe = /(?:between\s+([a-z][a-z ]*?)\s+and\s+([a-z][a-z]*)|\bfrom\s+([a-z][a-z]*)|\bto\s+([a-z][a-z]*)|\bin\s+([a-z][a-z]*))/g, pm, stop = /^(the|a|an|all|this|last|next|today|yesterday|week|month|september|october|august|july|june|may|april|march|february|january|november|december|sep|oct|aug|jul|jun|apr|mar|feb|jan|nov|dec|business|non|km|trips?|vehicles?|drivers?|branch|supervisor|litres?|days?|than|gps)$/;
    while ((pm = placeRe.exec(t))) {
      [pm[1], pm[2], pm[3], pm[4], pm[5]].forEach(function (p) {
        if (!p) return; p = p.trim(); var w = p.split(' ')[0];
        if (!p || stop.test(w) || /\d/.test(p) || names.indexOf(w) >= 0) return;
        if (type === 'trip' || type === 'vehicle' || type === 'gps') { names.push(w); add({ field: '*place', op: 'contains', value: p, label: 'Route mentions ' + cap(p) }); }
      });
    }

    // time: today, yesterday, this week, last N days, month names
    if (has('date')) {
      var d0 = new Date(NOW); d0.setHours(0, 0, 0, 0); var today = d0.getTime();
      if (/\btoday\b/.test(t)) add(range(today, today + DAY - 1, 'is today'));
      else if (/\byesterday\b/.test(t)) add(range(today - DAY, today - 1, 'is yesterday'));
      else if (/this week/.test(t)) { var dow = (new Date(today).getDay() + 6) % 7; add(range(today - dow * DAY, today + DAY - 1, 'is this week')); }
      else if (/last week/.test(t)) { var dw = (new Date(today).getDay() + 6) % 7; add(range(today - (dw + 7) * DAY, today - dw * DAY - 1, 'is last week')); }
      else if ((m = /(?:last|past)\s+(\d+)\s+days?/.exec(t))) add(range(today - (+m[1] - 1) * DAY, today + DAY - 1, 'in the last ' + m[1] + ' days'));
      else if (/this month/.test(t)) { var ms = new Date(today); ms.setDate(1); add(range(ms.getTime(), today + DAY - 1, 'is this month')); }
      else {
        var full = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        full.forEach(function (mn, i) {
          if (new RegExp('\\b(' + mn + '|' + mn.slice(0, 3) + ')\\b').test(t) && !(mn === 'may' && !/\bmay\s+\d|\bin may\b|\bduring may\b/.test(t))) {
            var yr = new Date(NOW).getFullYear(), a = new Date(yr, i, 1).getTime(), b = new Date(yr, i + 1, 1).getTime() - 1;
            add(range(a, b, 'is in ' + cap(mn)));
          }
        });
      }
    } else if (/today|yesterday|this week|last week|this month|last \d+ days/.test(t)) notes.push(TYPES[type].label + ' has no date column; the date words were ignored');

    // nothing recognised: search the words in every column
    if (!clauses.length) {
      var words = raw.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(' ').filter(function (w) {
        return w.length >= 3 && !/^(show|list|find|all|the|and|with|for|from|get|give|me|report|trips?|vehicles?|drivers?|exceptions?|records?|data|details|which|that|have|has|are|were|was|who|this|those|these|please|branch|client|customer|supervisor)$/.test(w);
      });
      if (words.length) { add({ field: '*any', op: 'contains', value: words.join(' '), label: 'Search "' + words.join(' ') + '" in every column' }); notes.push('No rule matched, so this searches the words in every column'); }
    }
    return { clauses: clauses, notes: notes, understood: clauses.length > 0 };
  }
  function cap(s) { return String(s).replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
  function unitOf(type, key) { var f = fieldOf(type, key); return f && f.unit ? (f.unit === '%' ? '%' : ' ' + f.unit) : ''; }

  // ---- evaluation ---------------------------------------------------------------------------
  function textOf(row) { return Object.keys(row).filter(function (k) { return k[0] !== '_'; }).map(function (k) { return row[k] == null ? '' : String(row[k]); }).join(' ').toLowerCase(); }
  function test(row, c) {
    if (c.field === '*any') return c.value.split(' ').every(function (w) { return textOf(row).indexOf(w) >= 0; });
    if (c.field === '*place') return [row.from, row.customer, row.route, row.branch, row.client].join(' ').toLowerCase().indexOf(c.value) >= 0;
    if (c.field === 'date') return row._ts != null && row._ts >= c.value[0] && row._ts <= c.value[1];
    var v = row[c.field];
    switch (c.op) {
      case 'gt': return v != null && v > c.value;
      case 'gte': return v != null && v >= c.value;
      case 'lt': return v != null && v < c.value;
      case 'lte': return v != null && v <= c.value;
      case 'between': return v != null && v >= Math.min(c.value[0], c.value[1]) && v <= Math.max(c.value[0], c.value[1]);
      case 'eq': return typeof c.value === 'boolean' ? v === c.value : String(v == null ? '' : v).toLowerCase() === String(c.value).toLowerCase();
      case 'in': return c.value.indexOf(v) >= 0;
      case 'contains': return String(v == null ? '' : v).toLowerCase().indexOf(String(c.value).toLowerCase()) >= 0;
      case 'filled': return !!String(v == null ? '' : v).trim();
      case 'squash': return squash(v) === c.value;
    }
    return true;
  }
  // Quick filters: { branch, vehicle, driver, client, customer, from, to, tripType }
  function quickTest(row, q, type) {
    var ok = QUICK[type];
    if (q.branch && ok.indexOf('branch') >= 0 && row._branch !== q.branch) return false;
    if (q.vehicle && ok.indexOf('vehicle') >= 0 && row._vehicle !== q.vehicle) return false;
    if (q.driver && ok.indexOf('driver') >= 0 && row._driver !== q.driver) return false;
    if (q.client && ok.indexOf('client') >= 0 && row._client !== q.client && (row._clients || []).indexOf(q.client) < 0) return false;
    if (q.customer && ok.indexOf('customer') >= 0 && (row._customers || []).indexOf(q.customer) < 0) return false;
    if (q.tripType && ok.indexOf('tripType') >= 0 && row._type !== q.tripType) return false;
    if (ok.indexOf('date') >= 0 && (q.from || q.to)) {
      var a = q.from ? new Date(q.from + 'T00:00').getTime() : -Infinity, b = q.to ? new Date(q.to + 'T23:59:59').getTime() : Infinity;
      if (row._ts == null || row._ts < a || row._ts > b) return false;
    }
    return true;
  }
  // spec: { type, quick, conditions: [{ text, join: 'and' | 'or' }] }
  function run(spec, T) {
    var parsed = spec.conditions.filter(function (c) { return String(c.text || '').trim(); }).map(function (c) { return { join: c.join || 'and', p: parse(c.text, spec.type, T) }; }).filter(function (x) { return x.p.understood; });
    return dataset(spec.type, T).filter(function (row) {
      if (!quickTest(row, spec.quick || {}, spec.type)) return false;
      var acc = null;
      parsed.forEach(function (x) {
        var hit = x.p.clauses.every(function (c) { return test(row, c); });
        acc = acc === null ? hit : x.join === 'or' ? (acc || hit) : (acc && hit);
      });
      return acc === null ? true : acc;
    });
  }

  // ---- .xlsx writer (no library: a stored zip of SpreadsheetML parts) -----------------------
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(bytes) { var c = 0xFFFFFFFF; for (var i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    var u16 = function (v) { return [v & 255, (v >>> 8) & 255]; }, u32 = function (v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; };
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = enc.encode(f.data), crc = crc32(data);
      var head = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
      parts.push(new Uint8Array(head), name, data);
      central.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset))), name);
      offset += head.length + name.length + data.length;
    });
    var size = central.reduce(function (a, b) { return a + b.length; }, 0);
    var end = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(size), u32(offset), u16(0)));
    return new Blob(parts.concat(central, [end]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[ --]/g, ''); }
  function colName(i) { var s = ''; i++; while (i) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function sheetXml(columns, rows) {
    var widths = columns.map(function (c, i) { return Math.min(60, Math.max(10, String(c).length + 2, rows.reduce(function (m, r) { return Math.max(m, String(r[i] == null ? '' : r[i]).length + 2); }, 0))); });
    var cell = function (v, ref, style) {
      if (v == null || v === '') return '';
      if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '"' + (style ? ' s="' + style + '"' : '') + '><v>' + v + '</v></c>';
      return '<c r="' + ref + '" t="inlineStr"' + (style ? ' s="' + style + '"' : '') + '><is><t xml:space="preserve">' + esc(v) + '</t></is></c>';
    };
    var body = '<row r="1">' + columns.map(function (c, i) { return cell(c, colName(i) + '1', 1); }).join('') + '</row>' +
      rows.map(function (r, ri) { return '<row r="' + (ri + 2) + '">' + r.map(function (v, i) { return cell(v, colName(i) + (ri + 2), 0); }).join('') + '</row>'; }).join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      '<cols>' + widths.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>' +
      '<sheetData>' + body + '</sheetData></worksheet>';
  }
  // sheets: [{ name, columns: [header], rows: [[value]] }]
  function xlsx(sheets) {
    var ws = sheets.map(function (s, i) { return { name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: sheetXml(s.columns, s.rows) }; });
    return zip([
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + ws.map(function (w) { return '<Override PartName="/' + w.name + '" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheets.map(function (s, i) { return '<sheet name="' + esc(String(s.name).replace(/[\\\/?*\[\]:]/g, ' ').slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + ws.map(function (w, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') + '<Relationship Id="rId' + (ws.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF00633F"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>' }
    ].concat(ws));
  }
  export const TMSReports = {
    TYPES: TYPES,
    QUICK: QUICK,
    NOW: NOW,
    dataset: dataset,
    inferType: inferType,
    parse: parse,
    run: run,
    xlsx: xlsx,
    field: fieldOf,
  };

  if (typeof window !== 'undefined') {
    window.TMSReports = TMSReports;
  }

  export {
    TYPES,
    QUICK,
    NOW,
    dataset,
    inferType,
    parse,
    run,
    xlsx,
    fieldOf as field,
  };

  export default TMSReports;

