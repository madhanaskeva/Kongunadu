// What each Analytics tab compares, and the metrics it offers. Every metric is
// computed from the app's own trips and exceptions (the same records the Trips,
// Fleet and Reports pages use) for whatever entities, branch and period are picked.

const count = (list, test = () => true) => list.filter(test).length;
const sum = (list, get) => list.reduce((a, x) => a + (Number(get(x)) || 0), 0);
const isClosed = (t) => t.status === 'Closed';
const avg = (list, get) => (list.length ? sum(list, get) / list.length : null);
const GPS_TYPES = ['GPS failure', 'Both sources failed'];
const NO_CLIENT = '__none';

// Trips with both a fixed route and a GPS reading — the basis of distance variance.
const measured = (trips) => trips.filter(t => isClosed(t) && t.fixedKm && t.gpsKm != null);
const variancePct = (trips) => {
  const m = measured(trips);
  const fixed = sum(m, t => t.fixedKm);
  return fixed ? ((sum(m, t => t.gpsKm) - fixed) / fixed) * 100 : null;
};

const tripSource = (tms, entity) => ({
  list: tms.trips || [],
  date: t => t.opened,
  entity,
  branch: t => t.branch,
});
const exceptionSource = (tms, entity) => ({
  list: tms.exceptions || [],
  date: x => x.raised,
  entity,
  branch: x => x.branch,
});

export const ANALYTICS_TABS = {
  trips: {
    title: 'Trip Statistics',
    entityLabel: 'Client',
    entityPlural: 'clients',
    branchFilter: true,
    // Non-business movements carry no client; they get their own row so every trip is counted.
    entities: tms => [
      ...(tms.clients || []).map(c => ({ value: c.id, label: c.name, branch: c.branch })),
      { value: NO_CLIENT, label: 'No client · non-business' },
    ],
    sources: tms => ({ trips: tripSource(tms, t => t.client || NO_CLIENT) }),
    metrics: [
      { key: 'trips', label: 'Trips', kind: 'count', value: s => s.trips.length },
      { key: 'business', label: 'Business trips', kind: 'count', value: s => count(s.trips, t => t.type === 'Business') },
      { key: 'nonbusiness', label: 'Non-business trips', kind: 'count', value: s => count(s.trips, t => t.type === 'Non-Business') },
      { key: 'closed', label: 'Closed trips', kind: 'count', value: s => count(s.trips, isClosed) },
      { key: 'gpsKm', label: 'GPS distance', kind: 'km', value: s => sum(s.trips, t => t.gpsKm) },
      { key: 'closeHours', label: 'Avg close time', kind: 'hours', value: s => avg(s.trips.filter(isClosed), t => t.hoursOpen) },
    ],
  },

  gps: {
    title: 'GPS Statistics',
    entityLabel: 'Vehicle',
    entityPlural: 'vehicles',
    branchFilter: true,
    entities: tms => (tms.vehicles || []).map(v => ({ value: v.id, label: v.number, branch: v.branch })),
    sources: tms => ({
      trips: tripSource(tms, t => t.vehicle),
      exceptions: exceptionSource(tms, x => x.vehicle),
    }),
    metrics: [
      { key: 'gpsKm', label: 'GPS distance', kind: 'km', value: s => sum(s.trips, t => t.gpsKm) },
      { key: 'fixedKm', label: 'Fixed route distance', kind: 'km', value: s => sum(s.trips, t => t.fixedKm) },
      { key: 'variance', label: 'Distance variance', kind: 'pct', value: s => variancePct(s.trips) },
      { key: 'diversions', label: 'Route diversions', kind: 'count', value: s => count(s.trips, t => !!t.diversion) },
      { key: 'offKm', label: 'Off-route distance', kind: 'km', value: s => sum(s.trips.filter(t => t.diversion), t => t.diversion.offKm) },
      { key: 'gpsFaults', label: 'GPS faults', kind: 'count', value: s => count(s.exceptions, x => GPS_TYPES.includes(x.type)) },
    ],
  },

  drivers: {
    title: 'Driver Statistics',
    entityLabel: 'Driver',
    entityPlural: 'drivers',
    branchFilter: true,
    entities: tms => (tms.drivers || []).map(d => ({ value: d.id, label: d.name, branch: d.branch })),
    sources: tms => ({ trips: tripSource(tms, t => t.driver) }),
    metrics: [
      { key: 'trips', label: 'Trips', kind: 'count', value: s => s.trips.length },
      { key: 'business', label: 'Business trips', kind: 'count', value: s => count(s.trips, t => t.type === 'Business') },
      { key: 'gpsKm', label: 'GPS distance', kind: 'km', value: s => sum(s.trips, t => t.gpsKm) },
      { key: 'flagged', label: 'Flagged trips', kind: 'count', value: s => count(s.trips, t => (t.flags || []).length > 0) },
      { key: 'diversions', label: 'Route diversions', kind: 'count', value: s => count(s.trips, t => !!t.diversion) },
      { key: 'closeHours', label: 'Avg close time', kind: 'hours', value: s => avg(s.trips.filter(isClosed), t => t.hoursOpen) },
    ],
  },

  branches: {
    title: 'Branch Statistics',
    entityLabel: 'Branch',
    entityPlural: 'branches',
    branchFilter: false,
    entities: tms => (tms.branches || []).map(b => ({ value: b.id, label: b.name })),
    sources: tms => ({
      trips: tripSource(tms, t => t.branch),
      exceptions: exceptionSource(tms, x => x.branch),
    }),
    metrics: [
      { key: 'trips', label: 'Trips', kind: 'count', value: s => s.trips.length },
      { key: 'business', label: 'Business trips', kind: 'count', value: s => count(s.trips, t => t.type === 'Business') },
      { key: 'gpsKm', label: 'GPS distance', kind: 'km', value: s => sum(s.trips, t => t.gpsKm) },
      { key: 'exceptions', label: 'Exceptions', kind: 'count', value: s => s.exceptions.length },
      { key: 'per100', label: 'Exceptions per 100 trips', kind: 'ratio', value: s => (s.trips.length ? (s.exceptions.length / s.trips.length) * 100 : null) },
      { key: 'high', label: 'High-severity exceptions', kind: 'count', value: s => count(s.exceptions, x => x.severity === 'High') },
    ],
  },

  irregularities: {
    title: 'Irregularity Statistics',
    entityLabel: 'Irregularity type',
    entityPlural: 'types',
    branchFilter: true,
    entities: tms => [...new Set((tms.exceptions || []).map(x => x.type))].sort().map(t => ({ value: t, label: t })),
    sources: tms => ({ exceptions: exceptionSource(tms, x => x.type) }),
    metrics: [
      { key: 'raised', label: 'Raised', kind: 'count', value: s => s.exceptions.length },
      { key: 'high', label: 'High severity', kind: 'count', value: s => count(s.exceptions, x => x.severity === 'High') },
      { key: 'open', label: 'Open', kind: 'count', value: s => count(s.exceptions, x => x.status === 'Open') },
      { key: 'review', label: 'Under review', kind: 'count', value: s => count(s.exceptions, x => x.status === 'Under review') },
      { key: 'resolved', label: 'Resolved', kind: 'count', value: s => count(s.exceptions, x => x.status === 'Resolved') },
    ],
  },
};
