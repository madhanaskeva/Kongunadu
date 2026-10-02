// Driver–helper combination: the crew a branch puts on each vehicle.
// Set per branch in Branch Master; the Supervisor App's attendance reads it to
// cap how many drivers and helpers can be marked present on one vehicle.

export const CREW_COMBOS = [
  { value: '1D', label: '1 Driver', drivers: 1, helpers: 0 },
  { value: '2D', label: '2 Drivers', drivers: 2, helpers: 0 },
  { value: '1D1H', label: '1 Driver + 1 Helper', drivers: 1, helpers: 1 },
  { value: '1D2H', label: '1 Driver + 2 Helpers', drivers: 1, helpers: 2 },
  { value: '2D1H', label: '2 Drivers + 1 Helper', drivers: 2, helpers: 1 },
];

// A branch saved before the field existed works as a single-driver crew with one helper.
export const DEFAULT_CREW = '1D1H';

export const crewOf = (branch) =>
  CREW_COMBOS.find(c => c.value === (branch && branch.crew)) || CREW_COMBOS.find(c => c.value === DEFAULT_CREW);

// Helpers sit in the Driver Master with type "Helper"; everyone else drives.
export const isHelper = (d) => !!d && d.type === 'Helper';

// How many supervisors a branch is set up for (at least one).
export const supervisorSeats = (branch) => Math.max(1, Number(branch && branch.supervisorCount) || 1);

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
export const crewLimitText = (c) =>
  c.helpers ? `${plural(c.drivers, 'driver', 'drivers')} and ${plural(c.helpers, 'helper', 'helpers')}` : plural(c.drivers, 'driver', 'drivers');
