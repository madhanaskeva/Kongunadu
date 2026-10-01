// Notifications module: automatic system alerts (derived from GPS / trip / exception data)
// and manual notices the admin sends to supervisors, with their resend history.
// Everything is frontend-only and persisted in localStorage, like the rest of the portal.
import dayjs from 'dayjs';
import { isPendingClose } from './tripStatus';

const MANUAL_KEY = 'kr-tms-manual-notifications';
const ALERT_STATUS_KEY = 'kr-tms-auto-alert-status';
const ALERT_SHARE_KEY = 'kr-tms-auto-alert-shares';
// Alert keys already sent to supervisors automatically, so each goes out once.
const ALERT_DELIVERED_KEY = 'kr-tms-auto-alert-delivered';
// The Supervisor App reads this feed and shows notices addressed to its supervisor id.
const NOTICE_KEY = 'kr-tms-supervisor-notices';
// How many notices the Supervisor App feed keeps. Large enough that nothing Head
// Office sends (messages, actions, every automatic alert) is pushed out unread.
export const NOTICE_LIMIT = 500;

export const DISPLAY_FMT = 'DD MMM YYYY, hh:mm A';
export const formatDateTime = iso => (iso ? dayjs(iso).format(DISPLAY_FMT) : '—');

const readJson = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch (e) { return fallback; }
};
const writeJson = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
};

// Local ISO timestamp without the timezone suffix, e.g. 2026-09-30T10:30:00
const nowIso = () => dayjs().format('YYYY-MM-DDTHH:mm:ss');

// ---------------------------------------------------------------------------
// Supervisors
// ---------------------------------------------------------------------------

// Selectable supervisors: [{ id, name, branchName, disabled }]; suspended ones can't be picked.
export const getSupervisors = tms =>
  (tms.supervisors || []).map(s => ({
    id: s.id,
    name: s.name,
    branchName: (tms.B[s.branch] || {}).name || '',
    disabled: s.status === 'Suspended',
  }));

export const recipientNames = recipients => (recipients || []).map(r => r.name).join(', ') || '—';

// ---------------------------------------------------------------------------
// Manual notifications
// ---------------------------------------------------------------------------

export const PRIORITIES = [
  { value: 'normal', label: 'Normal' },
  { value: 'important', label: 'Important' },
  { value: 'urgent', label: 'Urgent' },
];
export const priorityLabel = p => (PRIORITIES.find(x => x.value === p) || PRIORITIES[0]).label;

const today = dayjs().format('YYYY-MM-DD');
const SEED_MANUAL = [
  {
    id: 'NOT-001',
    category: 'manual',
    title: 'GPS Issue Reminder',
    message: 'Please verify the GPS status of the assigned vehicle before the trip starts.',
    priority: 'important',
    createdBy: 'Head Office Admin',
    recipients: [{ id: 'S01', name: 'R. Senthil Kumar' }, { id: 'S02', name: 'M. Arunachalam' }],
    createdAt: `${today}T09:30:00`,
    resendHistory: [
      { id: 'RES-001', recipients: [{ id: 'S04', name: 'P. Ramesh Babu' }], sentBy: 'Head Office Admin', sentAt: `${today}T10:45:00` },
    ],
  },
  {
    id: 'NOT-002',
    category: 'manual',
    title: 'Photograph every diesel slip',
    message: 'Upload a clear photo of each diesel slip at the time of filling. Trips without slips will not be verified.',
    priority: 'normal',
    createdBy: 'Head Office Admin',
    recipients: [{ id: 'S01', name: 'R. Senthil Kumar' }, { id: 'S02', name: 'M. Arunachalam' }, { id: 'S04', name: 'P. Ramesh Babu' }, { id: 'S06', name: 'A. Deshmukh' }],
    createdAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD') + 'T16:10:00',
    resendHistory: [],
  },
];

// All manual notifications, newest first. Seeds the store on first use.
export const getNotifications = () => {
  const saved = readJson(MANUAL_KEY, null);
  if (Array.isArray(saved)) return saved;
  writeJson(MANUAL_KEY, SEED_MANUAL);
  return SEED_MANUAL;
};

export const MANUAL_CHANGED_EVENT = 'kr-tms-manual-notifications-changed';
// Saves and tells any open Notifications page (e.g. a notice sent from the header) to reload.
export const saveNotifications = list => {
  writeJson(MANUAL_KEY, list);
  try { window.dispatchEvent(new Event(MANUAL_CHANGED_EVENT)); } catch (e) {}
};

export const getNotificationById = id => getNotifications().find(n => n.id === id) || null;

const nextId = (prefix, ids) => {
  const max = ids.reduce((m, id) => Math.max(m, parseInt(String(id).replace(/\D/g, ''), 10) || 0), 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
};

// Deliver a notice to the Supervisor App feed, addressed to specific supervisors.
const deliverToSupervisors = ({ title, message, priority, sentBy, recipients, resend }) => {
  const list = readJson(NOTICE_KEY, []);
  const d = dayjs();
  const label = priorityLabel(priority);
  const notice = {
    id: 'HN' + d.valueOf() + Math.floor(Math.random() * 1000),
    kind: 'message',
    to: recipients.map(r => r.id),
    // The Supervisor App pops "Urgent" notices on screen.
    priority: label,
    title: resend ? `Reminder: ${title}` : title,
    body: message,
    from: sentBy,
    sort: d.format('YYYY-MM-DD HH:mm:ss'),
    rows: [['Priority', label], ['Sent to', recipientNames(recipients)]],
  };
  writeJson(NOTICE_KEY, [notice, ...list].slice(0, NOTICE_LIMIT));
  try { window.dispatchEvent(new Event('kr-tms-supervisor-notices-changed')); } catch (e) {}
};

// Create and send a new notification; returns the updated list.
export const createNotification = ({ title, message, priority, recipients, createdBy }) => {
  const list = getNotifications();
  const item = {
    id: nextId('NOT', list.map(n => n.id)),
    category: 'manual',
    title: title.trim(),
    message: message.trim(),
    priority,
    createdBy,
    recipients,
    createdAt: nowIso(),
    resendHistory: [],
  };
  const next = [item, ...list];
  saveNotifications(next);
  deliverToSupervisors({ title: item.title, message: item.message, priority, sentBy: createdBy, recipients });
  return next;
};

// Resend an existing notification to a new set of supervisors. The original
// notification (and its recipients) stays as it was; only a history entry is added.
export const resendNotification = (id, opts) => resendNotifications([id], opts);

// Resend several notifications to the same supervisors: one resend-history entry and
// one Supervisor App notice per notification. Returns the updated list.
export const resendNotifications = (ids, { recipients, sentBy }) => {
  const list = getNotifications();
  const allResendIds = list.flatMap(n => (n.resendHistory || []).map(r => r.id));
  const sentAt = nowIso();
  const next = list.map(n => {
    if (!ids.includes(n.id)) return n;
    const id = nextId('RES', allResendIds);
    allResendIds.push(id);
    return { ...n, resendHistory: [...(n.resendHistory || []), { id, recipients, sentBy, sentAt }] };
  });
  saveNotifications(next);
  next.filter(n => ids.includes(n.id)).forEach(original => {
    deliverToSupervisors({ title: original.title, message: original.message, priority: original.priority, sentBy, recipients, resend: true });
  });
  return next;
};

// ---------------------------------------------------------------------------
// Head Office inbox: forward messages that reached Head Office to supervisors
// ---------------------------------------------------------------------------

const INBOX_SHARE_KEY = 'kr-tms-inbox-shares';
export const getInboxShares = () => readJson(INBOX_SHARE_KEY, {});

export const shareInboxItems = (items, { recipients, sentBy }) => {
  const map = getInboxShares();
  const sentAt = nowIso();
  items.forEach(item => {
    map[item.id] = [...(map[item.id] || []), { recipients, sentBy, sentAt }];
    deliverToSupervisors({ title: `Fwd: ${item.title}`, message: item.body || '', priority: 'normal', sentBy, recipients });
  });
  writeJson(INBOX_SHARE_KEY, map);
  return map;
};

// ---------------------------------------------------------------------------
// Automatic alerts
// ---------------------------------------------------------------------------

export const ALERT_TYPES = {
  GPS_DISCONNECTED: 'GPS disconnected',
  GPS_ISSUE: 'GPS issue',
  ROUTE_DIVERSION: 'Route diversion',
  RADIUS_VIOLATION: 'Radius violation',
  VEHICLE_STOPPED: 'Vehicle stopped too long',
  TRIP_VALIDATION: 'Trip validation failure',
  UNCLOSED_TRIP: 'Unclosed trip',
  LONG_OPEN: 'Long open trip',
};
export const ALERT_SOURCES = ['GPS', 'System', 'Operational'];
export const SEVERITIES = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

// '14 Sep 2026 05:40' → ISO
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const parseDataDate = s => {
  const m = /^(\d{1,2}) (\w{3}) (\d{4})(?: (\d{2}):(\d{2}))?/.exec(s || '');
  const mon = m ? MONTHS.indexOf(m[2]) : -1;
  if (mon < 0) return nowIso();
  const p = x => String(x).padStart(2, '0');
  return `${m[3]}-${p(mon + 1)}-${p(m[1])}T${m[4] || '00'}:${m[5] || '00'}:00`;
};
// '11:05' → today at that time
const todayAt = hhmm => `${today}T${hhmm || '00:00'}:00`;
// '18 min ago' → ISO
const agoToIso = s => {
  const m = /(\d+)\s*min/.exec(s || '');
  return dayjs().subtract(m ? +m[1] : 0, 'minute').format('YYYY-MM-DDTHH:mm:ss');
};

const readAlertStatus = () => readJson(ALERT_STATUS_KEY, {});
const readAlertShares = () => readJson(ALERT_SHARE_KEY, {});

// Priority a shared alert carries to supervisors, from its severity.
export const severityPriority = sev => (sev === 'high' ? 'urgent' : sev === 'medium' ? 'important' : 'normal');
export const alertTitle = a => `${ALERT_TYPES[a.alertType]} · ${a.vehicleNo}`;

// Share an automatic alert with supervisors. The alert itself is unchanged;
// each share is kept in its share history (keyed by the alert's stable key).
export const shareAlert = (alert, opts) => shareAlerts([alert], opts);

// Share several alerts with the same supervisors in one go. Each alert gets its own
// share-history entry and reaches the supervisor app as its own notice (with its own priority).
export const shareAlerts = (list, { recipients, sentBy }) => {
  const map = readAlertShares();
  const allIds = Object.values(map).flat().map(h => h.id);
  const sentAt = nowIso();
  list.forEach(alert => {
    const id = nextId('SHR', allIds);
    allIds.push(id);
    map[alert.key] = [...(map[alert.key] || []), { id, recipients, sentBy, sentAt }];
  });
  writeJson(ALERT_SHARE_KEY, map);
  list.forEach(alert => {
    const msg = alert.tripId ? `${alert.message} (Trip ${alert.tripId})` : alert.message;
    deliverToSupervisors({ title: `Alert: ${alertTitle(alert)}`, message: msg, priority: severityPriority(alert.severity), sentBy, recipients });
  });
};

export const setAlertStatus = (ids, status) => {
  const map = readAlertStatus();
  [].concat(ids).forEach(id => { map[id] = status; });
  writeJson(ALERT_STATUS_KEY, map);
};

// Builds alerts from the live portal data (tms = T() from the admin context).
// Ids are derived from the source record, so read/unread state survives reloads.
export const getAutomaticAlerts = tms => {
  const out = [];
  const vehNo = id => (tms.V[id] || {}).number || '—';
  const vehBranch = id => (tms.V[id] || {}).branch || null;
  const tripNo = id => (tms.T[id] || {}).number || null;
  const locName = id => (tms.L[id] || {}).name || id;

  (tms.vehicles || []).forEach(v => {
    if (v.gps === 'Failed') {
      out.push({ key: `gps-${v.id}`, branch: v.branch, source: 'GPS', alertType: 'GPS_DISCONNECTED', vehicleNo: v.number, message: `GPS signal lost. Last position received ${v.lastSeen}.`, severity: 'high', createdAt: agoToIso(v.lastSeen) });
    } else if (v.gps === 'Weak') {
      out.push({ key: `gps-${v.id}`, branch: v.branch, source: 'GPS', alertType: 'GPS_ISSUE', vehicleNo: v.number, message: `Weak GPS signal. Position updates are delayed (last seen ${v.lastSeen}).`, severity: 'medium', createdAt: agoToIso(v.lastSeen) });
    }
  });

  (tms.trips || []).forEach(t => {
    const base = { vehicleNo: vehNo(t.vehicle), tripId: t.number, branch: t.branch };
    if (t.diversion) {
      out.push({ ...base, key: `div-${t.id}`, source: 'GPS', alertType: 'ROUTE_DIVERSION', message: `Diverted ${t.diversion.offKm} km off the expected route (${t.diversion.expected}) at ${t.diversion.at}.`, severity: 'high', createdAt: parseDataDate(t.diversion.detected) });
    }
    if (isPendingClose(t)) {
      out.push({ ...base, key: `unclosed-${t.id}`, source: 'System', alertType: 'UNCLOSED_TRIP', message: 'Trip has reached its destination but has not been closed by the supervisor.', severity: 'medium', createdAt: parseDataDate(t.opened) });
    } else if (t.status === 'Enroute' && t.hoursOpen > 24) {
      out.push({ ...base, key: `long-${t.id}`, source: 'Operational', alertType: 'LONG_OPEN', message: `Trip has been open for ${t.hoursOpen} hours, beyond the 24-hour limit.`, severity: 'medium', createdAt: parseDataDate(t.opened) });
    }
  });

  (tms.exceptions || []).forEach(x => {
    const type = /diversion/i.test(x.type) ? 'ROUTE_DIVERSION' : /idle|stop/i.test(x.type) ? 'VEHICLE_STOPPED' : 'TRIP_VALIDATION';
    out.push({ key: `exc-${x.id}`, branch: x.branch || vehBranch(x.vehicle), source: type === 'TRIP_VALIDATION' ? 'System' : 'GPS', alertType: type, vehicleNo: vehNo(x.vehicle), tripId: tripNo(x.trip), message: `${x.type}: ${x.detail}`, severity: String(x.severity || 'low').toLowerCase(), createdAt: parseDataDate(x.raised) });
  });

  (tms.radiusAlerts || []).filter(r => r.kind === 'vehicle').forEach(r => {
    out.push({ key: `rad-${r.id}`, branch: vehBranch(r.ref), source: 'GPS', alertType: 'RADIUS_VIOLATION', vehicleNo: vehNo(r.ref), message: `Left the safe radius of ${locName(r.location)} — ${r.awayM >= 1000 ? (r.awayM / 1000).toFixed(1) + ' km' : r.awayM + ' m'} away.`, severity: r.awayM >= 1000 ? 'high' : 'low', createdAt: todayAt(r.left) });
  });

  const status = readAlertStatus();
  const shares = readAlertShares();
  return out
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((a, i, arr) => ({
      ...a,
      id: `ALT-${String(arr.length - i).padStart(3, '0')}`,
      category: 'automatic',
      tripId: a.tripId || null,
      status: status[a.key] || 'unread',
      shareHistory: shares[a.key] || [],
    }));
};

// Send every automatic alert to the supervisors of its branch, once. New alerts
// go out the next time this runs; alerts already sent (automatically or with the
// Share button) are not sent again by it. Each delivery is recorded in the alert's
// share history, so the admin can see it went out. Returns how many were sent.
export const deliverAutomaticAlerts = (tms, sentBy = 'Automatic') => {
  const alerts = getAutomaticAlerts(tms);
  const delivered = new Set(readJson(ALERT_DELIVERED_KEY, []));
  const fresh = alerts.filter(a => !delivered.has(a.key) && a.branch);
  if (!fresh.length) return 0;

  const shares = readAlertShares();
  const allIds = Object.values(shares).flat().map(h => h.id);
  const feed = readJson(NOTICE_KEY, []);
  const stamp = nowIso();
  const notices = fresh.map((a, i) => {
    const branchName = (tms.B[a.branch] || {}).name || a.branch;
    const recipients = [{ id: `branch:${a.branch}`, name: `${branchName} supervisors` }];
    const shareId = nextId('SHR', allIds);
    allIds.push(shareId);
    shares[a.key] = [...(shares[a.key] || []), { id: shareId, recipients, sentBy, sentAt: stamp, auto: true }];
    delivered.add(a.key);
    const label = priorityLabel(severityPriority(a.severity));
    return {
      id: `HA-${a.key}-${dayjs().valueOf()}-${i}`,
      kind: 'alert',
      // Branch-wide: every supervisor of the vehicle's branch receives it.
      branch: a.branch,
      priority: label,
      title: alertTitle(a),
      body: a.message,
      from: 'Head Office · automatic alert',
      // Placed in the feed at the time the alert was raised.
      sort: a.createdAt.replace('T', ' '),
      rows: [
        ['Vehicle', a.vehicleNo],
        ...(a.tripId ? [['Trip', a.tripId]] : []),
        ['Severity', (SEVERITIES.find(x => x.value === a.severity) || {}).label || a.severity],
        ['Source', a.source],
      ],
    };
  });

  writeJson(ALERT_SHARE_KEY, shares);
  writeJson(ALERT_DELIVERED_KEY, [...delivered]);
  writeJson(NOTICE_KEY, [...notices, ...feed].slice(0, NOTICE_LIMIT));
  try { window.dispatchEvent(new Event('kr-tms-supervisor-notices-changed')); } catch (e) {}
  return notices.length;
};
