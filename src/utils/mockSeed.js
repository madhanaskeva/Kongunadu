// Mock records for the workflow stores the Admin Portal and Supervisor App share
// through localStorage (device approvals, driver requests, verification, attendance…).
// Those stores start empty, so without this most queues and approval states have
// nothing to show until someone walks the whole flow by hand.
//
// Seeding is additive and runs once per SEED_VERSION: a record is only added when
// its id (or day, for attendance) is not in the store yet, so nothing a user has
// created, approved or rejected is ever overwritten. Clear site data to reseed.
import { TMS } from './tms-data';

const SEED_VERSION = 'v2';
const SEED_FLAG = 'kr-tms-mock-seed';

const KEYS = {
  devices: 'kr-tms-device-approvals',
  driverRequests: 'kr-tms-driver-requests',
  verify: 'kr-tms-trip-verification',
  deductions: 'kr-tms-driver-deductions',
  distReview: 'kr-tms-distance-review',
  excOverrides: 'kr-tms-exception-overrides',
  bunkRequests: 'kr-tms-bunk-requests',
  notices: 'kr-tms-supervisor-notices',
  adminNotifications: 'kr-tms-admin-notifications',
  attendance: 'kr-tms-attendance',
  master: 'kr-tms-master-edits',
};

const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

const doc = (name, size) => ({ name, size, url: '' });

// Supervisor phones asking to register · one per status on the Device Approvals page.
const DEVICE_REQUESTS = [
  { id: 'AR-seed-1', name: 'K. Muthukumar', phone: '9003145678', imei: '356938035643809', device: 'Android phone', branchId: '', branch: '', requestedAt: '15 Sep 08:42', status: 'Pending', otp: '' },
  { id: 'AR-seed-2', name: 'S. Revathi', phone: '9840056123', imei: '352099001761481', device: 'Android phone', branchId: '', branch: '', requestedAt: '14 Sep 17:15', status: 'Pending', otp: '' },
  { id: 'AR-seed-3', name: 'V. Harish', phone: '9677012345', imei: '359881030314356', device: 'Android phone', branchId: 'B04', branch: 'Bengaluru', requestedAt: '14 Sep 11:05', status: 'Approved', otp: '4829', decidedAt: '14 Sep 11:20' },
  { id: 'AR-seed-4', name: 'A. Deshmukh', phone: '9820065430', imei: '354826090212748', device: 'Android phone', branchId: 'B05', branch: 'Mumbai', requestedAt: '13 Sep 09:30', status: 'Verified', otp: '7310', decidedAt: '13 Sep 09:48', verifiedAt: '13 Sep 09:52' },
  { id: 'AR-seed-5', name: 'K. Vijayalakshmi', phone: '9940087621', imei: '351756051523999', device: 'Android phone', branchId: 'B01', branch: 'Chennai HO', requestedAt: '12 Sep 18:02', status: 'Registered', otp: '2651', decidedAt: '12 Sep 18:15', verifiedAt: '12 Sep 18:17', registeredAt: '12 Sep 18:19' },
  { id: 'AR-seed-6', name: 'T. Rajesh', phone: '9500011223', imei: '490154203237518', device: 'Android phone', branchId: '', branch: '', requestedAt: '12 Sep 22:40', status: 'Rejected', otp: '', decidedAt: '13 Sep 08:05' },
];

// Approving a phone adds it to the Supervisor Master (DeviceApprovals › addToSupervisorMaster).
// AR-seed-3 is approved but new, so its supervisor row is seeded the same way.
const APPROVED_DEVICE_SUPERVISORS = [
  { id: 'SUAR-seed-3', name: 'V. Harish', phone: '96770 12345', branch: 'B04', clients: '', clientIds: [], status: 'Active', lastLogin: 'Never', deviceImei: '359881030314356', joinedVia: 'App request' },
];

// New-driver requests from the Supervisor App · pending, approved and rejected.
const DRIVER_REQUESTS = [
  { id: 'DR-seed-1', status: 'Pending', branch: 'B01', supervisor: 'S01', supervisorName: 'R. Senthil Kumar', requestedAt: '15 Sep 09:10', vehicle: 'TN 28 AR 7712',
    name: 'Balaji S.', licence: 'TN2820230004512', phone: '9003198765', licImg: doc('balaji-licence.jpg', '412 KB'), aadhaarImg: doc('balaji-aadhaar.jpg', '388 KB'),
    holder: 'Balaji S', account: '50100234567891', ifsc: 'HDFC0001234', family: '9003112233', reference: 'Referred by Murugan S., worked 3 years on Ashok Leyland tippers' },
  { id: 'DR-seed-2', status: 'Pending', branch: 'B02', supervisor: 'S02', supervisorName: 'M. Arunachalam', requestedAt: '14 Sep 16:25', vehicle: '',
    name: 'Ramasamy P.', licence: 'TN3420190006210', phone: '9790062100', licImg: doc('ramasamy-licence.jpg', '356 KB'), aadhaarImg: doc('ramasamy-aadhaar.jpg', '301 KB'),
    holder: 'P Ramasamy', account: '31245678901', ifsc: 'SBIN0000932', family: '9790062111', reference: '' },
  { id: 'DR-seed-3', status: 'Approved', branch: 'B01', supervisor: 'S01', supervisorName: 'R. Senthil Kumar', requestedAt: '12 Sep 10:40', decidedAt: '12 Sep 15:05', reason: '', vehicle: '',
    name: 'Vignesh R.', licence: 'TN2820210008834', phone: '9003188340', licImg: doc('vignesh-licence.jpg', '420 KB'), aadhaarImg: doc('vignesh-aadhaar.jpg', '395 KB'),
    holder: 'Vignesh R', account: '918010045672310', ifsc: 'UTIB0000123', family: '9003188355', reference: 'Ex-driver at Linde India contractor' },
  { id: 'DR-seed-4', status: 'Rejected', branch: 'B01', supervisor: 'S01', supervisorName: 'R. Senthil Kumar', requestedAt: '11 Sep 08:55', decidedAt: '11 Sep 13:30', reason: 'Licence expired in June 2026', vehicle: '',
    name: 'Suresh M.', licence: 'TN2820120003377', phone: '9003133770', licImg: doc('suresh-licence.jpg', '298 KB'), aadhaarImg: doc('suresh-aadhaar.jpg', '310 KB'),
    holder: 'Suresh M', account: '20145566778', ifsc: 'IOBA0000456', family: '9003133781', reference: '' },
];

// Verification records for closed trips. Trips left out stay "Pending verification":
// T07/T10/T15 inside or without a limit, T09 non-business, T11 over the limit (ready to escalate).
const TRIP_VERIFICATION = {
  T06: { status: 'Approved', level: 'Verification Team', approvedBy: 'Verification Team', approvedAt: '13 Sep 2026, 10:20 am' },
  T08: { status: 'Approved', level: 'Verification Team', approvedBy: 'Verification Team', approvedAt: '14 Sep 2026, 09:05 am' },
  T12: {
    status: 'Deduction raised', level: 'Administrator',
    reason: 'Driver says the second fill at Dindigul was needed after long reefer idling at the hospital gate',
    escalatedBy: 'Verification Team', escalatedAt: '17 Sep 2026, 11:10 am',
    decidedBy: 'Administrator', decidedAt: '17 Sep 2026, 04:45 pm', explanationAccepted: false,
    deduction: { amount: 5236, note: 'No slip photo for the Dindigul fill and reefer idling is not billable', driver: 'D02', at: '17 Sep 2026, 04:45 pm' },
  },
  T13: {
    status: 'Escalated', level: 'Verification Team',
    reason: 'Driver says the tanker ran heavy through the ghats and needed two bunk fills (Solapur and Pune)',
    escalatedBy: 'Verification Team', escalatedAt: '16 Sep 2026, 12:30 pm',
  },
  T14: {
    status: 'Approved', level: 'Administrator',
    reason: 'NH48 bridge closure at Hosur forced a detour; traffic police notice attached by the supervisor',
    escalatedBy: 'Verification Team', escalatedAt: '13 Sep 2026, 09:40 am',
    approvedBy: 'Administrator', approvedAt: '13 Sep 2026, 02:15 pm', explanationAccepted: true,
  },
};

const DEDUCTIONS = [
  { id: 'SD-seed-1', trip: 'T12', tripNumber: 'TN28BC1180/09/026', driver: 'D02', driverName: 'Karthik R.', branch: 'B01', litres: 55, amount: 5236,
    note: 'No slip photo for the Dindigul fill and reefer idling is not billable', raisedBy: 'Administrator', raisedAt: '17 Sep 2026, 04:45 pm', status: 'Pending payroll' },
];

// Distance review on flagged closed trips; T07 stays Open.
const DISTANCE_REVIEW = { T08: 'Reviewed', T10: 'Under review' };

// X01 dispatched to R. Senthil Kumar from the exception drawer (matches notice N02).
const EXCEPTION_OVERRIDES = {
  X01: { status: 'Under review', assignee: 'R. Senthil Kumar', assigneeIds: ['S01'], note: 'Explain the 55 km gap or share the repair or fuel bill.', alertedAt: '13 Sep, 06:40 pm' },
};

const BUNK_REQUESTS = [
  { id: 'BR-seed-1', bunkName: 'IOC – Salem Highway Hub', routeId: 'R01', routeName: 'Sriperumbudur → Hyderabad', tripId: 'T01', tripNumber: 'TN28AQ4521/09/014', supervisorName: 'R. Senthil Kumar', branch: 'B01', status: 'Pending', requestedAt: 'Today 09:30' },
  { id: 'BR-seed-2', bunkName: 'BPCL – Dindigul Bypass', routeId: 'R07', routeName: 'Ambattur → Madurai', tripId: 'T12', tripNumber: 'TN28BC1180/09/026', supervisorName: 'K. Vijayalakshmi', branch: 'B01', status: 'Approved', requestedAt: '13 Sep 14:20', decidedAt: '13 Sep 16:10' },
  { id: 'BR-seed-3', bunkName: 'Sri Balaji Fuels – Ongole', routeId: 'R05', routeName: 'Ambattur → Vijayawada', tripId: 'T07', tripNumber: 'TN28BC1180/09/008', supervisorName: 'K. Vijayalakshmi', branch: 'B01', status: 'Rejected', requestedAt: '11 Sep 07:15', decidedAt: '11 Sep 10:40' },
];

// Notices Head Office pushed to supervisors as the workflows above were decided.
const NOTICES = [
  { id: 'HN-seed-1', kind: 'action', priority: 'Urgent', branch: 'B01', from: 'Head Office Admin', sort: '2026-09-17 16:45:00',
    title: 'Salary deduction · Karthik R.',
    body: 'The explanation for excess diesel on TN28BC1180/09/026 was not accepted. ₹5,236 will be recovered through payroll.',
    rows: [['Trip', 'TN28BC1180/09/026'], ['Driver', 'Karthik R.'], ['Excess diesel', '55 L'], ['Deduction', '₹5,236'], ['Reason', 'No slip photo for the Dindigul fill and reefer idling is not billable']],
    link: { trip: 'T12' }, linkLabel: 'View trip' },
  { id: 'HN-seed-2', kind: 'action', priority: 'Urgent', to: ['S01'], branch: 'B01', from: 'Head Office Admin', sort: '2026-09-13 18:40:30',
    title: 'Hidden kilometres · action needed',
    body: '55 km unaccounted on TN 28 AQ 8890 between trips /09/018 and /09/019.',
    rows: [['Exception', 'X01 · High severity'], ['Vehicle', 'TN 28 AQ 8890'], ['Trip', 'TN28AQ8890/09/019'], ['Note', 'Explain the 55 km gap or share the repair or fuel bill.']],
    link: { trip: 'T10' }, linkLabel: 'View trip' },
  { id: 'HN-seed-3', kind: 'action', branch: 'B01', from: 'Head Office Admin', sort: '2026-09-12 15:05:00',
    title: 'Driver approved · Vignesh R.',
    body: 'Your request to add Vignesh R. is approved. The driver is in the driver list and can be assigned to trips.',
    rows: [['Driver', 'Vignesh R.'], ['Licence', 'TN2820210008834'], ['Mobile', '+91 90031 88340'], ['Action taken', 'Approved']] },
  { id: 'HN-seed-4', kind: 'action', branch: 'B01', from: 'Head Office Admin', sort: '2026-09-11 13:30:00',
    title: 'Driver request rejected · Suresh M.',
    body: 'Head Office rejected the request to add Suresh M.. Reason: Licence expired in June 2026. The driver cannot be assigned to trips.',
    rows: [['Driver', 'Suresh M.'], ['Licence', 'TN2820120003377'], ['Mobile', '+91 90031 33770'], ['Action taken', 'Rejected'], ['Reason', 'Licence expired in June 2026']] },
];

// Admin bell · requests and alerts raised by supervisors and the system.
export const MOCK_ADMIN_NOTIFICATIONS = [
  { id: 'seed-an-1', title: 'Device approval request', body: 'K. Muthukumar (+91 90031 45678) requested device login approval.', time: 'Just now', createdAt: hoursAgo(0) },
  { id: 'seed-an-2', title: 'Driver Request', body: 'Balaji S. requested as driver for Chennai HO (TN 28 AR 7712).', time: '35 min ago', createdAt: hoursAgo(0.6) },
  { id: 'seed-an-3', title: 'New Bunk Approval Request', body: 'Supervisor requested new bunk "IOC – Salem Highway Hub" for route "Sriperumbudur → Hyderabad" (TN28AQ4521/09/014).',
    time: '1 hr ago', createdAt: hoursAgo(1), kind: 'bunkApproval', bunkRequestId: 'BR-seed-1', bunkName: 'IOC – Salem Highway Hub', routeId: 'R01', routeName: 'Sriperumbudur → Hyderabad' },
  { id: 'seed-an-4', title: 'Trip escalated to Level 2', body: 'TS09UB3344/09/014 booked 372 L against 285 L authorized. Verification Team escalated it with the driver’s explanation.', time: '3 hrs ago', createdAt: hoursAgo(3) },
  { id: 'seed-an-5', title: 'GPS failure', body: 'TS 09 UB 3344 has had no GPS fix for 2 h 14 min on trip TS09UB3344/09/009.', time: '5 hrs ago', createdAt: hoursAgo(5) },
  { id: 'seed-an-6', title: 'Attendance overdue', body: 'Bengaluru has not marked driver attendance for 3 days this month.', time: '1 day ago', createdAt: hoursAgo(24) },
];

// Saved daily attendance per branch for the last three weeks, so the admin register,
// the supervisor's saved days and monthly view all have history. Today is left
// unmarked for Bengaluru so marking it (and the 11:00 overdue alert)
// can still be walked through; a few past days are skipped as "missing attendance".
const buildAttendance = () => {
  const pad = (n) => String(n).padStart(2, '0');
  const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const skip = { B01: [4], B02: [3, 9], B04: [2, 6, 11] };
  const markedToday = ['B02', 'B03', 'B05']; // B01 today comes from seedTodayAttendance; B04 stays unmarked
  const vehicleOf = Object.fromEntries(TMS.vehicles.filter((v) => v.driver).map((v) => [v.driver, v]));
  const store = {};

  for (let ago = 0; ago <= 21; ago++) {
    const d = new Date();
    d.setDate(d.getDate() - ago);
    const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const label = `${DAY[d.getDay()]}, ${pad(d.getDate())} ${MON[d.getMonth()]} ${d.getFullYear()}`;

    TMS.branches.filter((b) => b.status === 'Active').forEach((b) => {
      if (ago === 0 && !markedToday.includes(b.id)) return;
      if ((skip[b.id] || []).includes(ago)) return;
      const drivers = TMS.drivers.filter((x) => x.branch === b.id && x.approval === 'Approved');
      if (!drivers.length) return;
      const entries = {};
      drivers.forEach((x, i) => {
        // Inactive drivers are absent; everyone else misses roughly one day in eight.
        const absent = x.status !== 'Active' || (ago * 7 + i * 3) % 8 === 0;
        const v = vehicleOf[x.id];
        entries[x.id] = absent ? ['A', '', ''] : ['P', v ? v.id : '', v && v.status === 'Running' ? 'On trip' : 'Idle'];
      });
      store[b.id] = store[b.id] || {};
      store[b.id][iso] = { label, savedAt: `${17 + (ago % 2)}:${pad((ago * 13) % 60)}`, entries };
    });
  }

  return store;
};

const read = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || 'null');
    return v == null ? fallback : v;
  } catch (e) {
    return fallback;
  }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
};

// Existing records first, then any seed record whose id is not there yet.
const mergeList = (key, seed) => {
  const cur = read(key, []);
  const list = Array.isArray(cur) ? cur : [];
  const have = new Set(list.map((r) => r && r.id));
  const add = seed.filter((r) => !have.has(r.id));
  if (add.length) write(key, [...list, ...add]);
};

// Keys the user already has win over the seed.
const mergeMap = (key, seed) => {
  const cur = read(key, {});
  write(key, { ...seed, ...(cur && typeof cur === 'object' && !Array.isArray(cur) ? cur : {}) });
};

const mergeAttendance = () => {
  const cur = read(KEYS.attendance, {});
  const seed = buildAttendance();
  const next = { ...cur };
  Object.keys(seed).forEach((br) => { next[br] = { ...seed[br], ...(cur[br] || {}) }; });
  write(KEYS.attendance, next);
};

const mergeMasterSupervisors = () => {
  const m = read(KEYS.master, {});
  const cur = m.supervisors || { added: [], edited: {} };
  const added = cur.added || [];
  const add = APPROVED_DEVICE_SUPERVISORS.filter((s) => !added.some((a) => a.id === s.id));
  if (!add.length) return;
  write(KEYS.master, { ...m, supervisors: { ...cur, added: [...added, ...add] } });
};

export const seedMockData = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    if (localStorage.getItem(SEED_FLAG) === SEED_VERSION) return;
  } catch (e) {
    return;
  }
  mergeList(KEYS.devices, DEVICE_REQUESTS);
  mergeList(KEYS.driverRequests, DRIVER_REQUESTS);
  mergeMap(KEYS.verify, TRIP_VERIFICATION);
  mergeList(KEYS.deductions, DEDUCTIONS);
  mergeMap(KEYS.distReview, DISTANCE_REVIEW);
  mergeMap(KEYS.excOverrides, EXCEPTION_OVERRIDES);
  mergeList(KEYS.bunkRequests, BUNK_REQUESTS);
  mergeList(KEYS.notices, NOTICES);
  mergeList(KEYS.adminNotifications, MOCK_ADMIN_NOTIFICATIONS);
  mergeAttendance();
  mergeMasterSupervisors();
  try { localStorage.setItem(SEED_FLAG, SEED_VERSION); } catch (e) {}
};

// Chennai HO attendance for *today*, so Open Trip suggests a driver from attendance when an
// idle vehicle is picked (log in as R. Senthil Kumar, client Linde India):
//   TN 28 AR 7712 (V04, no mapped driver)        → Gopal R. present on it, suggested
//   TN 28 BC 1180 (V02, mapped to Karthik R.)    → Saravanan K. present on it, suggested over the mapping
//   TN 28 AQ 8890 (V10, mapped driver inactive)  → Vignesh R., a newly approved request driver, suggested
//   TN 28 BD 2209 / TN 28 DM 0187 (V08, V16)     → nobody present: "Choose driver" + Request new driver
// Karthik R. is left unmarked (free in the picker, keeps the "attendance pending" alert);
// Ravi T. is absent, so he is kept out of the picker.
// Applied once per calendar day, driver by driver: a driver the supervisor already marked today,
// or a vehicle someone is already present on, is left as the supervisor saved it.
const TODAY_B01 = {
  D10: ['P', 'V04', 'Idle'],
  D11: ['P', 'V02', 'Idle'],
  'DR-seed-3': ['P', 'V10', 'Idle'],
  D01: ['P', 'V01', 'On trip'],
  D12: ['P', 'V11', 'On trip'],
  D13: ['P', 'V12', 'On trip'],
  D14: ['P', 'V13', 'On trip'],
  D15: ['P', 'V14', 'On trip'],
  D16: ['P', 'V15', 'On trip'],
  D09: ['A', '', ''],
};
const TODAY_FLAG = 'kr-tms-mock-att-day';

export const seedTodayAttendance = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  const pad = (n) => String(n).padStart(2, '0');
  const d = new Date();
  const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  try {
    if (localStorage.getItem(TODAY_FLAG) === iso) return;
  } catch (e) {
    return;
  }
  const store = read(KEYS.attendance, {});
  const branch = store.B01 || {};
  const day = branch[iso] || {
    label: `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]}, ${pad(d.getDate())} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]} ${d.getFullYear()}`,
    savedAt: '08:15',
    entries: {},
  };
  const entries = { ...(day.entries || {}) };
  const taken = new Set(Object.values(entries).filter((e) => e && e[0] === 'P' && e[1]).map((e) => e[1]));
  Object.entries(TODAY_B01).forEach(([id, e]) => {
    if (entries[id] || (e[0] === 'P' && taken.has(e[1]))) return;
    entries[id] = e;
    if (e[0] === 'P') taken.add(e[1]);
  });
  write(KEYS.attendance, { ...store, B01: { ...branch, [iso]: { ...day, entries } } });
  try { localStorage.setItem(TODAY_FLAG, iso); } catch (e) {}
};

seedMockData();
seedTodayAttendance();

export default seedMockData;
