// Idle vehicles grouped by where they are standing, for Fleet & GPS › Idle.
//
// Two sources decide the group:
//   - the GPS tracker's report of the stop it is in now (tms.gpsIdleReports), and
//   - the vehicle's open trip as the supervisor app keeps it: its loading point,
//     its unloading point and the stage it has reached.
// A tracker report wins (it names the exact place); otherwise the trip stage
// puts the vehicle at its loading or unloading point; any other open trip that
// is standing is stopped on the road, and no open trip means parked in the yard.
// A vehicle under maintenance always stands in its own group.

import { isPendingClose, isTripOpen } from './tripStatus.js';

export const IDLE_CATEGORIES = [
  { key: 'loading', label: 'Idle-loading', hint: 'Open trip · waiting at the loading point' },
  { key: 'unloading', label: 'Idle-unloading', hint: 'Reached the customer · unloading' },
  { key: 'onroad', label: 'On road', hint: 'Open trip · stopped on the way' },
  { key: 'bunk', label: 'Fuel bunk', hint: 'Standing at a diesel / petrol bunk' },
  { key: 'yard', label: 'Yard · no trip', hint: 'Parked with no open trip' },
  { key: 'maintenance', label: 'Maintenance', hint: 'In the service bay · under repair' },
];

// Minutes a trip-stage stop has lasted, steady per trip until the live feed sends it.
const stageMinutes = (trip) => {
  let h = 0;
  for (const ch of String(trip.id)) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return 20 + (h % 90);
};

export const openTripOf = (v, trips) => {
  if (v.status === 'Idle-without driver' || v.driverAvailability === 'Not available') return null;
  return (trips || []).find(t => t.vehicle === v.id && isTripOpen(t)) || null;
};

// The stop the supervisor's trip puts the vehicle in, shaped like a GPS idle report:
// at the unloading point once the trip has reached the customer, at the loading
// point while it is still loading. Null while the trip is on the road.
export const tripStopFor = (v, trip, tms) => {
  if (!trip || v.status === 'Idle-without driver' || v.driverAvailability === 'Not available') return null;
  const route = String(v.route || '');
  const atUnload = isPendingClose(trip) || /^(unloading|arrived) at/i.test(route);
  const atLoad = !atUnload && (trip.stage === 'Loading' || /^loading at/i.test(route));
  if (!atUnload && !atLoad) return null;
  const minutes = stageMinutes(trip);
  const note = `Trip ${trip.number} · the supervisor app shows the vehicle at its ${atLoad ? 'loading' : 'unloading'} point.`;
  if (atLoad) {
    const loc = (tms.L || {})[trip.loading] || {};
    return { vehicle: v.id, kind: 'loading', place: trip.loading || loc.name, minutes, lat: loc.lat, lng: loc.lng, ignition: false, note, fromTrip: true };
  }
  return { vehicle: v.id, kind: 'unloading', place: trip.unloading || 'Customer unloading point', minutes, ignition: false, note, fromTrip: true };
};

// Which idle group a vehicle belongs to, or null when it is not standing now.
export const idleCategoryOf = (v, trip) => {
  if (v.status === 'Maintenance') return 'maintenance';
  if (v.status === 'Idle-loading') return 'loading';
  if (v.status === 'Idle-unloading') return 'unloading';
  if (v.status === 'Idle-without driver' || v.driverAvailability === 'Not available' || (!v.driver && (v.status === 'Idle' || v.status?.startsWith?.('Idle')))) {
    return 'without-driver';
  }
  const r = v.gpsIdle;
  if (r && (r.kind === 'bunk' || r.kind === 'loading' || r.kind === 'unloading')) return r.kind;
  if (!r && v.status !== 'Idle' && !v.status?.startsWith?.('Idle')) return null;
  return trip ? 'onroad' : 'yard';
};
