// Dashboard Custom Widgets Engine
// Calculates live module datasets and statistics for custom cards, charts, and lists.

import { ENROUTE_LABEL } from './tripStatus';

export const txtOf = (v) => (v == null ? '' : String(v).trim() === '—' ? '' : String(v).trim());

export const numOf = (v) => {
  if (typeof v === 'number') return v;
  const m = /^\s*₹?\s*(-?[\d,]+(?:\.\d+)?)\s*(km|%|h|m|min|l|days?)?\s*$/i.exec(txtOf(v));
  return m ? parseFloat(m[1].replace(/,/g, '')) : null;
};

export const unitOf = (vals) => {
  const m = vals.map(v => /(km|%|h|min|days?)\s*$/i.exec(txtOf(v))).find(Boolean);
  return m ? m[1] : '';
};

export const fmtN = (n) =>
  Number.isInteger(n) ? n.toLocaleString('en-IN') : n.toLocaleString('en-IN', { maximumFractionDigits: 1 });

export const headingStat = (m, h) => {
  const vals = m.rows.map(r => r[h]).filter(v => txtOf(v) !== '');
  const nums = vals.map(numOf);
  const counts = {};
  vals.forEach(v => {
    const k = txtOf(v);
    counts[k] = (counts[k] || 0) + 1;
  });
  const groups = Object.entries(counts).sort((x, y) => y[1] - x[1]);
  const distinct = groups.length;

  if (vals.length && nums.every(n => n != null)) {
    const u = unitOf(vals);
    const sfx = u ? (u === '%' ? '%' : ' ' + u) : '';
    const total = nums.reduce((x, y) => x + y, 0);
    const avg = total / nums.length;
    const max = Math.max(...nums);
    return {
      kind: 'number',
      text: (u === '%' ? '' : 'Total ' + fmtN(total) + sfx + ' · ') + 'avg ' + fmtN(avg) + sfx + ' · max ' + fmtN(max) + sfx,
      nums: m.rows.map(r => [r, numOf(r[h])]).filter(([, n]) => n != null),
      sfx,
    };
  }

  if (!vals.length) return { kind: 'empty', text: 'No values yet', groups: [] };

  if (distinct <= 15 && distinct < vals.length) {
    return {
      kind: 'category',
      text: groups.slice(0, 3).map(([k, n]) => k + ' ' + n).join(' · ') + (distinct > 3 ? ' · +' + (distinct - 3) + ' more' : ''),
      groups,
    };
  }

  return {
    kind: 'text',
    text: vals.length + ' filled · ' + distinct + ' unique',
    groups,
  };
};

export const DEFAULT_PALETTE = [
  'var(--color-brand)',
  'var(--kr-saffron-500)',
  'var(--kr-red-600)',
  'var(--kr-green-100)',
  'var(--kr-grey-500)',
  '#2F7DB5',
];

export const getDashModules = (tms = {}, ctx = {}) => {
  const deleted = ctx.deleted || [];
  const excOverrides = ctx.excOverrides || {};
  const masterEdits = ctx.masterEdits || {};
  const vehTanks = ctx.vehTanks || {};
  const drvReqs = ctx.drvReqs || [];
  const approvals = ctx.approvals || {};
  const devReqs = ctx.devReqs || [];
  const distReview = ctx.distReview || {};
  const st = ctx.st || {};
  const fmtPhone = ctx.fmtPhone || (d => { d = String(d || ''); return d.length === 10 ? d.slice(0, 5) + ' ' + d.slice(5) : d; });
  const fmtImei = ctx.fmtImei || (d => { d = String(d || ''); return d.length === 15 ? `${d.slice(0, 2)} ${d.slice(2, 8)} ${d.slice(8, 14)} ${d.slice(14)}` : d; });

  // 1. Trips
  const tripsRows = (tms.trips || []).filter(t => !deleted.includes(t.id)).map(t => {
    const v = (tms.V && tms.V[t.vehicle]) || {};
    const d = (tms.D && tms.D[t.driver]) || {};
    const c = (tms.C && tms.C[t.client]) || {};
    const b = (tms.B && tms.B[t.branch]) || {};
    const long = t.status === 'Enroute' && t.hoursOpen > 24;
    const gpsBad = (t.flags || []).some(f => /GPS/i.test(f));
    const badge = t.status === 'Closed'
      ? ((t.flags || []).length ? 'Closed · flagged' : 'Closed')
      : (long ? 'Long open' : (gpsBad ? 'GPS issue' : t.stage || ENROUTE_LABEL));
    const flags = (t.flags || []).join(', ') || '—';
    const clientUnload = [c.name, t.unloading].filter(Boolean).join(' · ') || '—';
    return {
      _id: t.id,
      'Trip number': t.number || '—',
      'Branch': b.name || t.branch || '—',
      'Vehicle': v.number || t.vehicle || '—',
      'Driver': d.name || t.driver || '—',
      'Client · unloading': clientUnload,
      'Type': t.type + (t.reason ? ' · ' + t.reason : ''),
      'Opened': t.opened || '—',
      'Status': badge,
      'Flags': flags,
    };
  });

  // 2. Exceptions
  const exceptionsRows = (tms.exceptions || []).map(x => {
    const o = excOverrides[x.id] || {};
    const xx = { ...x, ...o };
    const v = (tms.V && tms.V[xx.vehicle]) || {};
    const tr = (tms.T && tms.T[xx.trip]) || {};
    const vehTrip = [v.number, tr.number].filter(Boolean).join(' · ') || '—';
    return {
      _id: xx.id,
      'Severity': xx.severity || '—',
      'Type': xx.type || '—',
      'Vehicle / trip': vehTrip,
      'Detail': xx.detail || '—',
      'Branch': (tms.B && tms.B[xx.branch] ? tms.B[xx.branch].name : xx.branch) || '—',
      'Raised': xx.raised || '—',
      'Assignee': xx.assignee || 'Unassigned',
      'Status': xx.status || 'Open',
    };
  });

  // 3. Fleet & GPS
  const fleetRows = (tms.vehicles || []).map(v => {
    const d = v.driver && tms.D && tms.D[v.driver] ? tms.D[v.driver].name : 'No driver';
    return {
      _id: v.id,
      'Vehicle': v.number || '—',
      'Type': v.type || '—',
      'Branch': (tms.B && tms.B[v.branch] ? tms.B[v.branch].name : v.branch) || '—',
      'Driver': d,
      'Status': v.status || '—',
      'GPS': v.gps || '—',
      'Odometer': v.odometer != null ? Number(v.odometer).toLocaleString('en-IN') + ' km' : '—',
      'Last seen': v.lastSeen || '—',
      'Route': v.route || '—',
    };
  });

  // 4. Distance variation
  const distThr = Number(st.variance) || 5;
  const distanceRows = (tms.distanceChecks || []).map(d => {
    const delta = km => km == null ? null : Math.round((km - d.fixedKm) / d.fixedKm * 1000) / 10;
    const g = delta(d.gpsKm), o = delta(d.odoKm);
    const pct = Math.max(Math.abs(g || 0), Math.abs(o || 0));
    const flagged = pct > distThr;
    const review = flagged ? (distReview[d.id] || d.review || 'Open') : 'Within ' + distThr + '%';
    const v = (tms.V && tms.V[d.vehicle]) || {};
    const tr = d.trip && tms.T && tms.T[d.trip] ? tms.T[d.trip].number : d.number || '—';
    return {
      _id: d.id,
      'Trip': tr,
      'Vehicle': v.number || d.number || '—',
      'Route': d.route || '—',
      'Branch': (tms.B && tms.B[d.branch] ? tms.B[d.branch].name : d.branch) || '—',
      'Fixed KM': d.fixedKm != null ? d.fixedKm.toLocaleString('en-IN') + ' km' : '—',
      'GPS KM': d.gpsKm != null ? d.gpsKm.toLocaleString('en-IN') + ' km' : '—',
      'Odometer KM': d.odoKm != null ? d.odoKm.toLocaleString('en-IN') + ' km' : '—',
      'Variance': pct.toFixed(1) + '%',
      'Review': review,
    };
  });

  // 5. Attendance
  const attendanceRows = (tms.drivers || [])
    .filter(d => (d.approval === 'Approved' || d.approval == null))
    .map(d => ({
      _id: d.id,
      'Driver': d.name || '—',
      'Branch': (tms.B && tms.B[d.branch] ? tms.B[d.branch].name : d.branch) || '—',
      'Type': d.type || '—',
      'Present': d.present != null ? d.present : '—',
      'Absent': d.absent != null ? d.absent : '—',
      'Utilisation': d.util || '—',
      'Status': d.status || '—',
    }));

  // 6. Branches
  const branchesRows = (tms.branches || []).filter(b => !deleted.includes(b.id)).map(b => ({
    _id: b.id,
    'Code': b.code || '—',
    'Branch': b.name || '—',
    'State': b.state || '—',
    'Vehicles': b.vehicles != null ? b.vehicles : '—',
    'Supervisors': b.supervisors != null ? b.supervisors : '—',
    'Status': b.status || '—',
  }));

  // 7. Supervisors
  const supervisorsRows = (tms.supervisors || []).filter(s => !deleted.includes(s.id)).map(s => ({
    _id: s.id,
    'Name': s.name || '—',
    'Phone': s.phone || '—',
    'Branch': (tms.B && tms.B[s.branch] ? tms.B[s.branch].name : s.branch) || '—',
    'Clients handled': s.clients || '—',
    'Last login': s.lastLogin || '—',
    'Status': s.status || '—',
  }));

  // 8. Vehicles
  const vehiclesRows = (tms.vehicles || []).filter(v => !deleted.includes(v.id)).map(v => ({
    _id: v.id,
    'Registration': v.number || '—',
    'Type': v.type || '—',
    'Branch': (tms.B && tms.B[v.branch] ? tms.B[v.branch].name : v.branch) || '—',
    'Odometer': v.odometer != null ? Number(v.odometer).toLocaleString('en-IN') + ' km' : '—',
    'Tank': (vehTanks[v.id] || v.tank) ? Number(vehTanks[v.id] || v.tank).toLocaleString('en-IN') + ' L' : '—',
    'GPS': v.gps || '—',
    'Status': v.status || '—',
  }));

  // 9. Drivers
  const combinedDrivers = [
    ...drvReqs.map(r => ({
      id: r.id,
      name: r.name,
      licence: r.licence,
      phone: fmtPhone(r.phone),
      branch: r.branch,
      type: 'New',
      status: 'Active',
      approval: r.status === 'Pending' ? 'Pending approval' : r.status,
    })),
    ...(tms.drivers || []),
  ];
  const driversRows = combinedDrivers.filter(d => !deleted.includes(d.id)).map(d => ({
    _id: d.id,
    'Name': d.name || '—',
    'Licence': d.licence || '—',
    'Phone': fmtPhone(d.phone) || '—',
    'Branch': (tms.B && tms.B[d.branch] ? tms.B[d.branch].name : d.branch) || '—',
    'Type': d.type || '—',
    'Approval': approvals[d.id] || d.approval || 'Approved',
    'Status': d.status || '—',
  }));

  // 10. Clients
  const clientsRows = (tms.clients || []).filter(c => !deleted.includes(c.id)).map(c => ({
    _id: c.id,
    'Client': c.name || '—',
    'GSTIN': c.gst || '—',
    'Branch': (tms.B && tms.B[c.branch] ? tms.B[c.branch].name : c.branch) || '—',
    'Phone': c.phone ? (String(c.phone).startsWith('+91') ? c.phone : `+91 ${c.phone}`) : '—',
    'Supervisors': c.supervisors || ((tms.supervisors || []).filter(s => (s.clientIds || []).includes(c.id)).map(s => s.name).join(', ')) || '—',
    'Customers': c.customers != null ? c.customers : '—',
    'Contact': c.contact || '—',
  }));

  // 11. Locations
  const locationsRows = (tms.locations || []).filter(l => !deleted.includes(l.id)).map(l => ({
    _id: l.id,
    'Location': l.name || '—',
    'Branch': (tms.B && tms.B[l.branch] ? tms.B[l.branch].name : l.branch) || '—',
    'Address': l.address || '—',
    'Safe radius': l.radius != null ? l.radius + ' m' : '—',
    'Coordinates': `${l.lat || ''}, ${l.lng || ''}`,
  }));

  // 12. Routes
  const routesRows = (tms.routes || []).filter(r => !deleted.includes(r.id)).map(r => ({
    _id: r.id,
    'Route': r.name || '—',
    'From': (tms.L && tms.L[r.from] ? tms.L[r.from].name : r.from) || '—',
    'To': r.to || '—',
    'Fixed KM': r.km != null ? r.km + ' km' : '—',
    'Duration': r.hours != null ? r.hours + ' h' : '—',
    'Toll': r.toll || '—',
  }));

  // 13. Analytics
  const anDefs = [
    { area: 'Trip', kpi: 'Total trips', value: '4,218', note: '+6.2% vs previous period' },
    { area: 'Trip', kpi: 'Business', value: '3,796', note: '90% of movements' },
    { area: 'Trip', kpi: 'Non-business', value: '422', note: 'Maintenance 41% · Empty return 38%' },
    { area: 'Trip', kpi: 'Avg close time', value: '19.4 h', note: 'Target under 24 h' },
    { area: 'GPS', kpi: 'Fix rate', value: '96.8%', note: 'Target 98%' },
    { area: 'GPS', kpi: 'Route diversions', value: '23', note: '4 over 20 km' },
    { area: 'GPS', kpi: 'Idle events', value: '318', note: 'Over 15 min' },
    { area: 'GPS', kpi: 'Radius breaches', value: '11', note: 'Without an open trip' },
    { area: 'Vehicle', kpi: 'Utilisation', value: '61%', note: '+3 pts vs last month' },
    { area: 'Vehicle', kpi: 'Idle · no driver', value: '88', note: '12% of fleet' },
    { area: 'Vehicle', kpi: 'Avg km per vehicle', value: '312', note: 'per running day' },
    { area: 'Vehicle', kpi: 'Hidden km', value: '412', note: 'Unaccounted this month' },
    { area: 'Driver', kpi: 'Attendance', value: '86%', note: '3 branches incomplete today' },
    { area: 'Driver', kpi: 'Absent today', value: '14', note: '2 relief drivers assigned' },
    { area: 'Driver', kpi: 'Top utilisation', value: '92%', note: 'Selvam P. · Namakkal' },
    { area: 'Driver', kpi: 'Missing days', value: '3 branches', note: 'B02, B03, B04 incomplete' },
  ];
  const analyticsRows = anDefs.map((a, i) => ({
    _id: 'AN' + i,
    'Area': a.area,
    'KPI': a.kpi,
    'Value': a.value,
    'Note': a.note,
  }));

  // 14. Reports
  const reportsList = [
    { name: 'Daily trip register', desc: 'All trips opened and closed, by branch. Replaces the Excel trip sheet.', last: 'Today 06:00', rows: '312' },
    { name: 'Billing-ready trips', desc: 'Closed business trips with invoice, LR, customer and verified distance.', last: 'Yesterday 21:00', rows: '288' },
    { name: 'Non-business movements', desc: 'Every movement without billing, with reason and distance.', last: 'Yesterday 21:00', rows: '34' },
    { name: 'Exception report', desc: 'Hidden km, variance over threshold, GPS failures, manual exceptions.', last: 'Today 06:00', rows: '19' },
    { name: 'Hidden kilometre audit', desc: 'Odometer gaps between consecutive trips per vehicle.', last: '12 Sep', rows: '6' },
    { name: 'Driver attendance', desc: 'Present, absent, utilisation and continuous absence per driver.', last: '13 Sep', rows: '604' },
    { name: 'Vehicle utilisation', desc: 'Running, idle by cause and maintenance days per vehicle.', last: '13 Sep', rows: '722' },
    { name: 'GPS health', desc: 'Fix rate, gaps and device status per vehicle.', last: 'Today 06:00', rows: '722' },
    { name: 'Branch report', desc: 'Trips, distance, exceptions and vehicle count summarised per branch.', last: 'Today 06:00', rows: '14' },
    { name: 'Distance report', desc: 'Opening and closing odometer, GPS distance and variance per trip and vehicle.', last: 'Today 06:00', rows: '312' },
    { name: 'Diesel report', desc: 'Fuel filled, litres consumed and mileage (km/l) per vehicle and driver.', last: 'Yesterday 21:00', rows: '186' },
    { name: 'Vehicle report', desc: 'Registration, type, branch, status, documents due and total km per vehicle.', last: 'Today 06:00', rows: '722' },
  ];
  const reportsRows = reportsList.map((r, i) => ({
    _id: 'REP' + i,
    'Report': r.name,
    'Description': r.desc,
    'Last run': r.last,
    'Rows': r.rows,
  }));

  // 15. Device approvals
  const deviceApprovalsRows = (devReqs || []).map(r => ({
    _id: r.id,
    'Mobile number': '+91 ' + fmtPhone(r.phone),
    'IMEI': fmtImei(r.imei),
    'Device': r.device || 'Android phone',
    'Branch': (tms.B && tms.B[r.branch] ? tms.B[r.branch].name : r.branch) || '—',
    'Requested': r.requestedAt || 'Pending',
    'Status': r.status || '—',
  }));

  // 16. Users & roles
  const usersRows = (tms.users || []).map(u => ({
    _id: u.id,
    'Name': u.name || '—',
    'Email': u.email || '—',
    'Role': u.role || '—',
    'Branch scope': u.branch || '—',
    'Status': u.status || '—',
    'Last active': u.last || '—',
  }));

  const modules = [
    { id: 'trips', label: 'Trips', route: 'trips', kind: 'trip', cols: ['Trip number', 'Branch', 'Vehicle', 'Driver', 'Client · unloading', 'Type', 'Opened', 'Status', 'Flags'], rows: tripsRows },
    { id: 'exceptions', label: 'Exceptions', route: 'exceptions', kind: 'exc', cols: ['Severity', 'Type', 'Vehicle / trip', 'Detail', 'Branch', 'Raised', 'Assignee', 'Status'], rows: exceptionsRows },
    { id: 'fleet', label: 'Fleet & GPS', route: 'fleet', kind: 'route', cols: ['Vehicle', 'Type', 'Branch', 'Driver', 'Status', 'GPS', 'Odometer', 'Last seen', 'Route'], rows: fleetRows },
    { id: 'distance', label: 'Distance variation', route: 'distance', kind: 'route', cols: ['Trip', 'Vehicle', 'Route', 'Branch', 'Fixed KM', 'GPS KM', 'Odometer KM', 'Variance', 'Review'], rows: distanceRows },
    { id: 'attendance', label: 'Attendance', route: 'attendance', kind: 'drv', cols: ['Driver', 'Branch', 'Type', 'Present', 'Absent', 'Utilisation', 'Status'], rows: attendanceRows },
    { id: 'branches', label: 'Branches', route: 'branches', kind: 'route', cols: ['Code', 'Branch', 'State', 'Vehicles', 'Supervisors', 'Status'], rows: branchesRows },
    { id: 'supervisors', label: 'Supervisors', route: 'supervisors', kind: 'route', cols: ['Name', 'Phone', 'Branch', 'Clients handled', 'Last login', 'Status'], rows: supervisorsRows },
    { id: 'vehicles', label: 'Vehicles', route: 'vehicles', kind: 'route', cols: ['Registration', 'Type', 'Branch', 'Odometer', 'Tank', 'GPS', 'Status'], rows: vehiclesRows },
    { id: 'drivers', label: 'Drivers', route: 'drivers', kind: 'drv', cols: ['Name', 'Licence', 'Phone', 'Branch', 'Type', 'Approval', 'Status'], rows: driversRows },
    { id: 'clients', label: 'Clients', route: 'clients', kind: 'route', cols: ['Client', 'GSTIN', 'Branch', 'Phone', 'Supervisors', 'Customers', 'Contact'], rows: clientsRows },
    { id: 'locations', label: 'Loading locations', route: 'locations', kind: 'route', cols: ['Location', 'Branch', 'Address', 'Safe radius', 'Coordinates'], rows: locationsRows },
    { id: 'routes', label: 'Routes', route: 'routes', kind: 'route', cols: ['Route', 'From', 'To', 'Fixed KM', 'Duration', 'Toll'], rows: routesRows },
    { id: 'analytics', label: 'Analytics', route: 'analytics', kind: 'route', cols: ['Area', 'KPI', 'Value', 'Note'], rows: analyticsRows },
    { id: 'reports', label: 'Reports', route: 'reports', kind: 'route', cols: ['Report', 'Description', 'Last run', 'Rows'], rows: reportsRows },
    { id: 'deviceApprovals', label: 'Device approvals', route: 'deviceApprovals', kind: 'route', cols: ['Mobile number', 'IMEI', 'Device', 'Branch', 'Requested', 'Status'], rows: deviceApprovalsRows },
    { id: 'users', label: 'Users & roles', route: 'users', kind: 'route', cols: ['Name', 'Email', 'Role', 'Branch scope', 'Status', 'Last active'], rows: usersRows },
  ];

  return Object.fromEntries(modules.map(m => [m.id, m]));
};

export const buildCustomWidget = {
  cards: (it, m) => {
    const fields = (it.fields || []).filter(h => m.cols.includes(h));
    const title = (it.title || '').trim() || m.label;
    const count = m.rows.length;
    return {
      uid: it.uid,
      module: it.module,
      fields: it.fields,
      label: title,
      value: count,
      sub: count === 1 ? '1 record in ' + m.label : count + ' records in ' + m.label,
      subColor: 'var(--text-muted)',
      edge: 'var(--color-brand)',
      route: m.route,
      stats: fields.map(h => ({ h, text: headingStat(m, h).text })),
      hasStats: fields.length > 0,
    };
  },

  charts: (it, m, hbar, palette = DEFAULT_PALETTE) => {
    const fields = (it.fields && it.fields.length ? it.fields : m.cols.slice(0, 2)).filter(h => m.cols.includes(h));
    const keyCol = m.cols[0];
    const title = (it.title || '').trim() || m.label;
    const groups = fields.map(h => {
      const st = headingStat(m, h);
      if (st.kind === 'number') {
        const top = [...st.nums].sort((x, y) => y[1] - x[1]).slice(0, 6);
        const mx = Math.max(1, ...top.map(x => x[1]));
        return {
          h,
          sub: 'Highest by ' + h.toLowerCase(),
          note: '',
          hasNote: false,
          rows: hbar(top.map(([r, n]) => [txtOf(r[keyCol]) || '—', [[n, 'var(--color-brand)']], fmtN(n) + st.sfx]), mx),
        };
      }
      if (st.kind === 'category') {
        const mx = Math.max(1, ...st.groups.map(g => g[1]));
        return {
          h,
          sub: 'Records per value',
          note: '',
          hasNote: false,
          rows: hbar(st.groups.slice(0, 6).map(([k, n], i) => [k, [[n, palette[i % palette.length]]], n]), mx),
        };
      }
      return {
        h,
        sub: '',
        note: st.kind === 'empty' ? 'No values yet.' : 'Every record has its own value (' + st.text + '), so there is nothing to chart.',
        hasNote: true,
        rows: [],
      };
    });

    return {
      uid: it.uid,
      module: it.module,
      fields: it.fields,
      title,
      meta: m.rows.length + ' records',
      route: m.route,
      isGroups: true,
      isHbar: false,
      isColumn: false,
      isStat: false,
      hasLegend: false,
      hasNote: false,
      legend: [],
      rows: [],
      bars: [],
      stats: [],
      groups,
    };
  },

  lists: (it, m) => {
    const fields = (it.fields && it.fields.length ? it.fields : m.cols.slice(0, 4)).filter(h => m.cols.includes(h));
    const shown = m.rows.slice(0, 8);
    const title = (it.title || '').trim() || m.label;
    return {
      uid: it.uid,
      module: it.module,
      fields: it.fields,
      title,
      linkLabel: 'Open ' + m.label + ' →',
      route: m.route,
      isTable: true,
      items: [],
      empty: 'No records in ' + m.label + ' yet.',
      isEmpty: !m.rows.length,
      cols: fields,
      tRows: shown.map(r => ({
        kind: m.kind || 'route',
        id: r._id,
        route: m.route,
        cells: fields.map((h, i) => ({
          v: txtOf(r[h]) || '—',
          weight: i === 0 ? 700 : 400,
          color: i === 0 ? 'var(--text-heading)' : 'var(--text-body)',
        })),
      })),
    };
  },
};
