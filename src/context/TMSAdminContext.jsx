import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TMS, formatPhone, formatImei } from '../utils';
import { isPendingClose, pendingCloseDetail } from '../utils/tripStatus';

const TMSAdminContext = createContext(null);

export const useTMSAdmin = () => {
  const ctx = useContext(TMSAdminContext);
  if (!ctx) throw new Error('useTMSAdmin must be used within a TMSAdminProvider');
  return ctx;
};

export const TMSAdminProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Storage Keys matching HTML prototype
  const REQ_KEY = 'kr-tms-device-approvals';
  const DRV_KEY = 'kr-tms-driver-requests';
  const DRV_APPROVAL_KEY = 'kr-tms-driver-approvals';
  const TANK_KEY = 'kr-tms-vehicle-tanks';
  const MASTER_KEY = 'kr-tms-master-edits';
  const NOTICE_KEY = 'kr-tms-supervisor-notices';
  const DASH_KEY = 'kr-tms-dash-layout-v2';
  const DELETED_KEY = 'kr-tms-deleted';
  const EXC_KEY = 'kr-tms-exception-overrides';
  const DIST_KEY = 'kr-tms-distance-review';
  const VERIFY_KEY = 'kr-tms-trip-verification';
  const DEDUCT_KEY = 'kr-tms-driver-deductions';
  const ST_KEY = 'kr-tms-settings';
  const ADMIN_NOTIF_KEY = 'kr-tms-admin-notifications';
  const ADMIN_NOTIF_READ_KEY = 'kr-tms-admin-notifications-read';

  const SEED_ADMIN_NOTIFICATIONS = [
    {
      id: 'seed-notif-1',
      title: 'Driver Request',
      body: 'Mani requested for diesel allowance for trip #4029.',
      time: 'Just now',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'seed-notif-2',
      title: 'Maintenance Alert',
      body: 'TN 38 AA 1234 is due for its regular service.',
      time: '2 hrs ago',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'seed-notif-3',
      title: 'Trip Update',
      body: 'Trip #4028 has successfully reached destination.',
      time: '4 hrs ago',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'seed-notif-4',
      title: 'System Notice',
      body: 'Scheduled maintenance this weekend.',
      time: '1 day ago',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // State that survives a reload: read once from localStorage, written on every change.
  const usePersisted = (key, init) => {
    const [val, setVal] = useState(() => {
      try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v == null ? init : v; } catch (e) { return init; }
    });
    const set = (next) => setVal(prev => {
      const v = typeof next === 'function' ? next(prev) : next;
      try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {}
      return v;
    });
    return [val, set];
  };

  const DASH_ALL = {
    cards: ['trips', 'enroute', 'exceptions', 'hiddenKm', 'nonBiz', 'attendance', 'longOpen', 'gpsNoFix', 'distance', 'diversions', 'radius', 'fleetRunning', 'driverApprovals', 'deviceApprovals'],
    charts: ['branchTrips', 'tripsTrend', 'gpsHealth', 'excByType', 'vehStatus', 'distVariance'],
    lists: ['openExceptions', 'longOpenTrips', 'distAlerts', 'driverQueue', 'deviceRequests', 'recentTrips']
  };

  const dashItem = (group, src, f = {}) => {
    const base = { uid: src + '-' + Math.random().toString(36).slice(2, 7), src, title: f.title || '' };
    return group === 'cards' ? { ...base, color: f.color || '' } : group === 'charts' ? { ...base, style: f.style || '' } : { ...base, rows: Number(f.rows) || 5 };
  };

  const dashDefault = () => Object.fromEntries(Object.keys(DASH_ALL).map(g => [g, DASH_ALL[g].map(src => ({ ...dashItem(g, src), uid: src }))]));

  // Core State
  const [width, setWidth] = useState(window.innerWidth);
  const [navOpen, setNavOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [globalQ, setGlobalQ] = useState('');
  const [selectedTrip, setSelectedTrip] = useState('T07');
  // `vehicles` holds the ids ticked in the Trips vehicle filter — empty means every vehicle.
  const [tf, setTf] = useState({ branch: '', status: '', type: '', flag: '', q: '', vehicles: [] });
  const [excType, setExcType] = useState('');
  const [excStatus, setExcStatus] = useState('open');
  const [excSel, setExcSel] = useState('X02');
  // Supervisor ids ticked in the exception drawer — the alert goes to each of them.
  const [excAssignees, setExcAssignees] = useState([]);
  const [excNote, setExcNote] = useState('');
  const [excOverrides, setExcOverrides] = usePersisted(EXC_KEY, {});
  // Verification & approval records, keyed by trip id. See utils/tripVerification.js.
  const [tripVerify, setTripVerify] = usePersisted(VERIFY_KEY, {});
  // Salary deductions raised against drivers when an excess is not explained away.
  const [deductions, setDeductions] = usePersisted(DEDUCT_KEY, []);
  const [fleetFilter, setFleetFilter] = useState('all');
  const [masterQ, setMasterQ] = useState('');
  const [attBranch, setAttBranch] = useState('');
  const [anTab, setAnTab] = useState('trips');
  const [range, setRange] = useState('30d');
  const [userTab, setUserTab] = useState('users');
  const [distQ, setDistQ] = useState('');
  const [distReview, setDistReview] = usePersisted(DIST_KEY, {});
  const [drawer, setDrawer] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const ST_DEFAULT = {
    variance: '5', radius: '100', longOpen: '8', idle: '15', gpsFail: '30',
    serial: 'monthly', reasons: 'Maintenance, Internal Movement, Empty Return, Driver Testing',
    session: '12', attReminder: true, excEmail: true
  };
  // Settings are edited live; Save settings / Reset write them to storage.
  const [st, setSt] = useState(() => {
    try { return { ...ST_DEFAULT, ...(JSON.parse(localStorage.getItem(ST_KEY) || '{}') || {}) }; } catch (e) { return ST_DEFAULT; }
  });
  const saveSettings = (next = st) => {
    setSt(next);
    try { localStorage.setItem(ST_KEY, JSON.stringify(next)); } catch (e) {}
  };
  const [approvals, setApprovals] = useState({});
  const [driverApprovalFilter, setDriverApprovalFilter] = useState('');
  // Records deleted from any list (trips, masters, customers…), kept across reloads.
  const [deleted, setDeletedState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DELETED_KEY) || '[]') || []; } catch (e) { return []; }
  });
  const setDeleted = (next) => {
    setDeletedState(prev => {
      const list = typeof next === 'function' ? next(prev) : next;
      try { localStorage.setItem(DELETED_KEY, JSON.stringify(list)); } catch (e) {}
      return list;
    });
  };
  const [drvReqs, setDrvReqs] = useState([]);
  const [rejectReason, setRejectReason] = useState('');
  const [vehTanks, setVehTanks] = useState({});
  const [masterEdits, setMasterEdits] = usePersisted(MASTER_KEY, {});
  const [devReqs, setDevReqs] = useState([]);
  const [devFilter, setDevFilter] = useState('all');
  const BUNK_REQ_KEY = 'kr-tms-bunk-requests';
  const [bunkReqs, setBunkReqs] = usePersisted(BUNK_REQ_KEY, [
    {
      id: 'BR-seed-1',
      bunkName: 'IOC – Salem Highway Hub',
      routeId: 'R01',
      routeName: 'Sriperumbudur → Hyderabad',
      tripId: 'T01',
      tripNumber: 'TN28AQ4521/09/014',
      supervisorName: 'R. Senthil Kumar',
      branch: 'B01',
      status: 'Pending',
      requestedAt: 'Today 09:30',
    },
  ]);
  const [adminNotifOpen, setAdminNotifOpen] = useState(false);
  const [sendNoticeOpen, setSendNoticeOpen] = useState(false);

  const [adminNotifications, setAdminNotifications] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ADMIN_NOTIF_KEY) || 'null');
      if (saved && Array.isArray(saved) && saved.length > 0) return saved;
      localStorage.setItem(ADMIN_NOTIF_KEY, JSON.stringify(SEED_ADMIN_NOTIFICATIONS));
      return SEED_ADMIN_NOTIFICATIONS;
    } catch (e) {
      return SEED_ADMIN_NOTIFICATIONS;
    }
  });

  const [adminNotifRead, setAdminNotifRead] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(ADMIN_NOTIF_READ_KEY) || '[]') || [];
    } catch (e) {
      return [];
    }
  });

  const markAdminNotifsRead = () => {
    const allIds = adminNotifications.map((n) => n.id);
    setAdminNotifRead(allIds);
    try {
      localStorage.setItem(ADMIN_NOTIF_READ_KEY, JSON.stringify(allIds));
    } catch (e) {}
  };

  const pushAdminNotification = (item) => {
    const newItem = {
      id: 'AN' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      time: item.time || 'Just now',
      createdAt: new Date().toISOString(),
      ...item,
    };
    setAdminNotifications((prev) => {
      const next = [newItem, ...prev.filter((x) => x.id !== newItem.id)].slice(0, 50);
      try {
        localStorage.setItem(ADMIN_NOTIF_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    try {
      window.dispatchEvent(new Event('kr-tms-admin-notifications-changed'));
    } catch (e) {}
  };

  // Adds only the items whose `key` is not already in the list, so system-generated
  // alerts (pending closures, etc.) are raised once and survive reloads.
  const pushAdminNotificationsOnce = (items) => {
    if (!items || !items.length) return;
    setAdminNotifications((prev) => {
      const seen = new Set(prev.map((n) => n.key).filter(Boolean));
      const fresh = items
        .filter((i) => i.key && !seen.has(i.key))
        .map((i) => ({
          id: 'AN-' + i.key,
          time: i.time || 'Just now',
          createdAt: new Date().toISOString(),
          ...i,
        }));
      if (!fresh.length) return prev;
      const next = [...fresh, ...prev].slice(0, 50);
      try {
        localStorage.setItem(ADMIN_NOTIF_KEY, JSON.stringify(next));
      } catch (e) {}
      try {
        window.dispatchEvent(new Event('kr-tms-admin-notifications-changed'));
      } catch (e) {}
      return next;
    });
  };

  const unreadAdminNotifCount = useMemo(() => {
    const readSet = new Set(adminNotifRead);
    return adminNotifications.filter((n) => !readSet.has(n.id)).length;
  }, [adminNotifications, adminNotifRead]);

  // Dashboard layout state
  const [dashTab, setDashTab] = useState('cards');
  const [dashCfg, setDashCfg] = useState(null);
  const [dashForm, setDashForm] = useState({ module: '', title: '', fields: [] });
  const [dashFormErr, setDashFormErr] = useState('');

  // Report builder state
  const [rb, setRb] = useState({
    type: 'trip', scope: 'all', cols: {}, ask: '', loading: false, result: null, tab: 'report', cell: null, templatesOpen: false
  });

  const toastTimerRef = useRef(null);

  // Helper functions
  // Seed data with the admin's saved adds / edits (masterEdits) applied and deleted records removed,
  // so every page, dropdown and lookup map sees the same records.
  const editsObj = typeof masterEdits !== 'undefined' && masterEdits ? masterEdits : {};
  const tmsView = useMemo(() => {
    const base = (typeof window !== 'undefined' && window.TMS) || TMS;
    const gone = new Set(deleted);
    const merge = (key) => {
      const e = editsObj[key] || {}, ed = e.edited || {};
      return [...(e.added || []), ...(base[key] || []).map(r => (ed[r.id] ? { ...r, ...ed[r.id] } : r))].filter(r => !gone.has(r.id));
    };
    const by = a => Object.fromEntries(a.map(r => [r.id, r]));
    const out = { ...base };
    [['branches', 'B'], ['supervisors', 'S'], ['vehicles', 'V'], ['drivers', 'D'], ['clients', 'C'], ['customers', 'U'],
     ['locations', 'L'], ['routes', 'R'], ['bunks', 'F'], ['trips', 'T'], ['users', null]].forEach(([key, map]) => {
      out[key] = merge(key);
      if (map) out[map] = { ...base[map], ...by(out[key]) };
    });
    // Distance comparison is derived from closed trips so every row links to a real trip.
    out.distanceChecks = out.trips
      .filter(t => t.status === 'Closed' && Number(t.fixedKm) > 0)
      .map(t => ({
        id: t.id,
        trip: t.id,
        number: t.number,
        vehicle: t.vehicle,
        branch: t.branch,
        route: ((out.L[t.loading] || {}).name || t.loading || '—') + ' → ' + (t.unloading || '—'),
        fixedKm: Number(t.fixedKm),
        gpsKm: t.gpsKm ?? null,
        odoKm: t.odoKm ?? null,
        closed: t.closed,
        review: t.distReview || null,
      }));
    return out;
  }, [editsObj, deleted]);
  const T = () => tmsView;

  // Trips that reached the customer but were never closed. Head Office is told once
  // per trip; the supervisor app raises the matching alert on its own side.
  useEffect(() => {
    const gone = new Set(deleted);
    const pending = (tmsView.trips || []).filter(t => !gone.has(t.id) && isPendingClose(t));
    pushAdminNotificationsOnce(pending.map(t => {
      const veh = (tmsView.V[t.vehicle] || {}).number || '—';
      const sup = (tmsView.S[t.supervisor] || {}).name || 'the supervisor';
      return {
        key: 'pending-close-' + t.id,
        title: 'Trip pending closure',
        body: `${t.number} (${veh}) has completed but is not closed — ${pendingCloseDetail(t)}. Ask ${sup} to file the closing entry.`,
      };
    }));
  }, [tmsView, deleted]);

  const fmtPhone = (d) => formatPhone(d);
  const fmtImei = (d) => formatImei(d);
  const stampNow = () => {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  const showToast = (tone, title, message) => {
    clearTimeout(toastTimerRef.current);
    setToast({ tone, title, message });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  // Sync dev reqs
  const readReqs = () => {
    try { return JSON.parse(localStorage.getItem(REQ_KEY) || '[]') || []; } catch (e) { return devReqs; }
  };
  const writeReqs = (list) => {
    try { localStorage.setItem(REQ_KEY, JSON.stringify(list)); } catch (e) {}
    setDevReqs(list);
  };

  const readDrvReqs = () => {
    try { return JSON.parse(localStorage.getItem(DRV_KEY) || '[]') || []; } catch (e) { return drvReqs; }
  };
  const writeDrvReqs = (list) => {
    try { localStorage.setItem(DRV_KEY, JSON.stringify(list)); } catch (e) {}
    setDrvReqs(list);
  };

  const pushNotice = (n) => {
    let list = [];
    try { list = JSON.parse(localStorage.getItem(NOTICE_KEY) || '[]') || []; } catch (e) { list = []; }
    const d = new Date(), p = x => String(x).padStart(2, '0');
    const sort = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    list = [{ id: 'HN' + d.getTime(), from: 'Head Office Admin', sort, ...n }, ...list].slice(0, 50);
    try { localStorage.setItem(NOTICE_KEY, JSON.stringify(list)); } catch (e) {}
  };

  const setSeedApproval = (id, approval) => {
    const next = { ...approvals, [id]: approval };
    setApprovals(next);
    try { localStorage.setItem(DRV_APPROVAL_KEY, JSON.stringify(next)); } catch (e) {}
  };

  const decideDriver = (id, approval, reason = '') => {
    const tms = T(), req = drvReqs.find(r => r.id === id), d = req || (tms.drivers || []).find(x => x.id === id);
    if (!d) return;
    const ok = approval === 'Approved', bname = (tms.B[d.branch] || {}).name || 'branch';
    if (req) {
      writeDrvReqs(readDrvReqs().map(r => r.id === id ? { ...r, status: ok ? 'Approved' : 'Rejected', decidedAt: stampNow(), reason } : r));
    } else {
      setSeedApproval(id, approval);
    }
    setDrawer(null);
    setRejectReason('');
    showToast(ok ? 'success' : 'warning', ok ? 'Driver approved' : 'Request rejected', ok ? `${d.name} is now available to ${bname} supervisors.` : `${bname} supervisors have been notified.`);
    pushNotice({
      kind: 'action', branch: d.branch, title: ok ? `Driver approved · ${d.name}` : `Driver request rejected · ${d.name}`,
      body: ok ? `Your request to add ${d.name} is approved. The driver is in the driver list and can be assigned to trips.` : `Head Office rejected the request to add ${d.name}.${reason ? ' Reason: ' + reason + '.' : ''} The driver cannot be assigned to trips.`,
      rows: [['Driver', d.name], ['Licence', d.licence], ['Mobile', '+91 ' + fmtPhone(d.phone)], ['Action taken', ok ? 'Approved' : 'Rejected'], ...(reason ? [['Reason', reason]] : [])]
    });
  };

  const requestNewBunk = ({ bunkName, routeId, routeName, tripId, tripNumber, supervisorName, branch }) => {
    if (!bunkName || !bunkName.trim()) return null;
    const cleanName = bunkName.trim();

    const existingReq = (bunkReqs || []).find(r => r.bunkName.toLowerCase() === cleanName.toLowerCase() && (r.routeId === routeId || r.routeName === routeName));
    if (existingReq) return existingReq;

    const newReq = {
      id: 'BR' + Date.now().toString(36),
      bunkName: cleanName,
      routeId: routeId || '',
      routeName: routeName || '',
      tripId: tripId || '',
      tripNumber: tripNumber || '',
      supervisorName: supervisorName || 'Supervisor',
      branch: branch || 'B01',
      status: 'Pending',
      requestedAt: stampNow(),
    };

    setBunkReqs(prev => [newReq, ...(prev || [])]);

    pushAdminNotification({
      title: 'New Bunk Approval Request',
      body: `Supervisor requested new bunk "${cleanName}" for route "${routeName || 'Route'}" (${tripNumber || 'Close Trip'}).`,
      time: 'Just now',
      bunkRequestId: newReq.id,
      bunkName: cleanName,
      routeId,
      routeName,
      kind: 'bunkApproval',
    });

    return newReq;
  };

  const decideBunkRequest = (id, approval) => {
    const ok = approval === 'Approved';
    const req = (bunkReqs || []).find(r => r.id === id);
    if (!req) return;

    setBunkReqs(prev => (prev || []).map(r => r.id === id ? { ...r, status: ok ? 'Approved' : 'Rejected', decidedAt: stampNow() } : r));

    if (ok) {
      const tms = tmsView;
      let existingBunk = (tms.bunks || []).find(b => b.name.toLowerCase() === req.bunkName.trim().toLowerCase());
      let bunkId = existingBunk?.id;

      if (!existingBunk) {
        bunkId = 'F' + Date.now().toString(36).slice(-4).toUpperCase();
        const newBunk = {
          id: bunkId,
          name: req.bunkName,
          branch: req.branch || 'B01',
          rate: 95.0,
          status: 'Active',
        };
        saveMaster('bunks', newBunk, true);
      }

      const route = (tms.routes || []).find(rt => rt.id === req.routeId || rt.name === req.routeName);
      if (route) {
        const curAuth = route.authorizedBunks || [];
        if (!curAuth.includes(bunkId) && !curAuth.includes(req.bunkName)) {
          const nextAuth = [...curAuth, bunkId];
          saveMaster('routes', { ...route, authorizedBunks: nextAuth }, false);
        }
      }

      showToast('success', 'Bunk approved & authorized', `"${req.bunkName}" approved and added to authorized bunks for ${req.routeName || 'route'}.`);
      pushNotice({
        kind: 'action',
        branch: req.branch || 'B01',
        title: `Bunk approved · ${req.bunkName}`,
        body: `Head Office approved bunk "${req.bunkName}". It is now authorized for route ${req.routeName || ''}.`,
        rows: [['Bunk', req.bunkName], ['Route', req.routeName || '—'], ['Status', 'Authorized']]
      });
    } else {
      showToast('warning', 'Bunk request rejected', `Request for "${req.bunkName}" was rejected.`);
    }
  };

  // Save one or many records of a collection. items: [{ rec, isNew }]
  const saveMasterMany = (route, items) => {
    setMasterEdits(all => {
      let cur = all[route] || { added: [], edited: {} };
      items.forEach(({ rec, isNew }) => {
        const added = cur.added || [];
        cur = isNew
          ? { ...cur, added: [rec, ...added] }
          : added.some(r => r.id === rec.id)
          ? { ...cur, added: added.map(r => r.id === rec.id ? { ...r, ...rec } : r) }
          : { ...cur, edited: { ...(cur.edited || {}), [rec.id]: { ...((cur.edited || {})[rec.id] || {}), ...rec } } };
      });
      const next = { ...all, [route]: cur };
      try { localStorage.setItem(MASTER_KEY, JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };
  const saveMaster = (route, rec, isNew) => saveMasterMany(route, [{ rec, isNew }]);

  const setVehTank = (id, litres) => {
    const next = { ...vehTanks, [id]: litres };
    setVehTanks(next);
    try { localStorage.setItem(TANK_KEY, JSON.stringify(next)); } catch (e) {}
  };

  const normalizeRecord = (route, formObj, isNew) => {
    const tms = T(), f = { ...formObj }, dg = x => String(x || '').replace(/\D/g, '');
    const num = k => { if (f[k] !== undefined && f[k] !== '') f[k] = Number(String(f[k]).replace(/[^\d.-]/g, '')) || 0; };
    if (isNew) f.id = route.slice(0, 2).toUpperCase() + 'X' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const dflt = (k, v) => { if (f[k] === undefined || f[k] === '' || f[k] === null) f[k] = v; };
    if (route === 'vehicles') {
      num('odometer'); num('tank');
      if (!Array.isArray(f.clients)) f.clients = [];
      if (!f.driver) f.driver = null;
      if (isNew) { dflt('odometer', 0); dflt('status', 'Idle'); dflt('gps', 'Pending'); }
    }
    if (route === 'drivers') {
      f.phone = fmtPhone(dg(f.phone));
      if (isNew) { f.approval = 'Approved'; dflt('status', 'Active'); dflt('type', 'Regular'); f.present = 0; f.absent = 0; f.util = '—'; }
    }
    if (route === 'branches' && isNew) { f.vehicles = 0; f.supervisors = 0; dflt('status', 'Active'); }
    if (route === 'supervisors') {
      f.phone = fmtPhone(dg(f.phone));
      if (isNew) { f.lastLogin = 'Never'; dflt('status', 'Active'); }
      const allClients = tms.clients || [];
      if (Array.isArray(f.clients)) {
        const ids = [];
        const names = [];
        f.clients.forEach(val => {
          const match = allClients.find(c => c.id === val || c.name.toLowerCase() === String(val).toLowerCase());
          if (match) {
            ids.push(match.id);
            names.push(match.name);
          } else if (val) {
            ids.push(val);
            names.push(val);
          }
        });
        f.clientIds = ids;
        f.clients = names.join(', ');
      } else if (typeof f.clients === 'string' && f.clients.trim()) {
        const names = f.clients.split(',').map(s => s.trim()).filter(Boolean);
        const ids = names.map(n => {
          const match = allClients.find(c => c.name.toLowerCase() === n.toLowerCase() || c.id === n);
          return match ? match.id : n;
        });
        f.clientIds = ids;
        f.clients = names.join(', ');
      }
    }
    if (route === 'clients' && isNew) { f.customers = 0; dflt('status', 'Active'); }
    if (route === 'customers') { dflt('status', 'Active'); dflt('billing', 'Per trip'); }
    if (route === 'locations') { num('radius'); num('lat'); num('lng'); dflt('radius', 100); dflt('status', 'Active'); }
    if (route === 'trips') {
      num('startKm'); num('closeKm'); num('rate');
      if (f.closeKm && f.startKm && f.closeKm >= f.startKm) f.odoKm = f.closeKm - f.startKm;
      if (f.advance !== undefined) f.advance = String(f.advance).trim() ? '₹' + String(f.advance).replace(/[₹\s]/g, '') : null;
      if (f.diesel !== undefined) f.diesel = String(f.diesel).trim() ? String(f.diesel).replace(/\s*L$/i, '') + ' L' : null;
      if (f.totalExpense !== undefined) f.totalExpense = String(f.totalExpense).trim() ? '₹' + String(f.totalExpense).replace(/[₹\s]/g, '') : null;
      if (f.type === 'Business') f.reason = '';
      ['invoice', 'lr', 'closeKm', 'bunk', 'remarks', 'closeRemarks'].forEach(k => { if (f[k] === '') f[k] = null; });
    }
    if (route === 'users') {
      if (f.branch !== undefined) f.branch = f.branch === 'all' || !f.branch ? 'All branches' : ((tms.B[f.branch] || {}).name || f.branch);
      if (f.email !== undefined) f.email = String(f.email).trim().toLowerCase();
      // Admin sets the password, so the account is ready to sign in straight away
      if (isNew) { dflt('role', 'Administrator'); f.status = 'Active'; f.last = 'Never'; }
    }
    if (route === 'routes') { num('km'); num('hours'); f.name = `${(tms.L[f.from] || {}).name || '—'} → ${f.to || '—'}`; dflt('status', 'Active'); }
    return f;
  };

  // Shrink image helper
  const shrinkImage = (file) => {
    return new Promise(done => {
      const src = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1000 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(src);
        done(c.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => { URL.revokeObjectURL(src); done(''); };
      img.src = src;
    });
  };

  // Initial loading from storage
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    try { setDevReqs(JSON.parse(localStorage.getItem(REQ_KEY) || '[]') || []); } catch (e) {}
    try { setDrvReqs(JSON.parse(localStorage.getItem(DRV_KEY) || '[]') || []); } catch (e) {}
    try { setApprovals(JSON.parse(localStorage.getItem(DRV_APPROVAL_KEY) || '{}') || {}); } catch (e) {}
    try { setMasterEdits(JSON.parse(localStorage.getItem(MASTER_KEY) || '{}') || {}); } catch (e) {}
    try { setVehTanks(JSON.parse(localStorage.getItem(TANK_KEY) || '{}') || {}); } catch (e) {}

    // Supervisor App runs in another tab: pick up its join requests and master updates live
    const handleStorage = (e) => {
      const read = (fallback) => { try { return JSON.parse(e.newValue || 'null') || fallback; } catch (err) { return fallback; } };
      if (e.key === REQ_KEY) setDevReqs(read([]));
      if (e.key === DRV_KEY) setDrvReqs(read([]));
      if (e.key === MASTER_KEY) setMasterEdits(read({}));
      if (e.key === ADMIN_NOTIF_KEY) setAdminNotifications(read(SEED_ADMIN_NOTIFICATIONS));
    };
    window.addEventListener('storage', handleStorage);

    const handleCustomNotif = () => {
      try {
        const list = JSON.parse(localStorage.getItem(ADMIN_NOTIF_KEY) || 'null');
        if (list && Array.isArray(list)) {
          setAdminNotifications(list);
        }
      } catch (err) {}
    };
    window.addEventListener('kr-tms-admin-notifications-changed', handleCustomNotif);

    const handleMasterCustom = () => {
      try { setMasterEdits(JSON.parse(localStorage.getItem(MASTER_KEY) || '{}') || {}); } catch (e) {}
    };
    window.addEventListener('tms-master-change', handleMasterCustom);

    const notifPoll = setInterval(handleCustomNotif, 1500);

    let cfg = dashDefault();
    try {
      const saved = JSON.parse(localStorage.getItem(DASH_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        cfg = Object.fromEntries(Object.keys(DASH_ALL).map(g => [g, Array.isArray(saved[g]) ? saved[g] : cfg[g]]));
      }
    } catch (e) {}
    setDashCfg(cfg);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('kr-tms-admin-notifications-changed', handleCustomNotif);
      window.removeEventListener('tms-master-change', handleMasterCustom);
      clearInterval(notifPoll);
      clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Save dash config
  const saveDash = (cfg) => {
    try { localStorage.setItem(DASH_KEY, JSON.stringify(cfg)); } catch (e) {}
    setDashCfg(cfg);
  };

  // Navigation router sync
  const navTo = (r, extra = {}) => {
    setNavOpen(false);
    setGlobalQ('');
    setDrawer(null);
    if (extra.selectedTrip) setSelectedTrip(extra.selectedTrip);
    if (extra.adminNotifOpen !== undefined) setAdminNotifOpen(extra.adminNotifOpen);
    if (extra.devFilter) setDevFilter(extra.devFilter);

    // Map route string to react router URL
    const routeMap = {
      dashboard: '/admin/dashboard',
      trips: '/admin/trips',
      trip: `/admin/trips/${extra.selectedTrip || selectedTrip}`,
      exceptions: '/admin/exceptions',
      fleet: '/admin/fleet',
      distance: '/admin/distance',
      attendance: '/admin/attendance',
      branches: '/admin/masters/branches',
      supervisors: '/admin/masters/supervisors',
      vehicles: '/admin/masters/vehicles',
      drivers: '/admin/masters/drivers',
      clients: '/admin/masters/clients',
      locations: '/admin/masters/locations',
      routes: '/admin/masters/routes',
      analytics: '/admin/analytics',
      reports: '/admin/reports',
      deviceApprovals: '/admin/device-approvals',
      users: '/admin/users',
      settings: '/admin/settings',
      login: '/login',
    };
    navigate(routeMap[r] || `/admin/${r}`);
  };

  return (
    <TMSAdminContext.Provider
      value={{
        T,
        width,
        navOpen, setNavOpen,
        loading, setLoading,
        toast, showToast,
        globalQ, setGlobalQ,
        selectedTrip, setSelectedTrip,
        tf, setTf,
        excType, setExcType,
        excStatus, setExcStatus,
        excSel, setExcSel,
        excAssignees, setExcAssignees,
        excNote, setExcNote,
        excOverrides, setExcOverrides,
        tripVerify, setTripVerify,
        deductions, setDeductions,
        fleetFilter, setFleetFilter,
        masterQ, setMasterQ,
        attBranch, setAttBranch,
        anTab, setAnTab,
        range, setRange,
        userTab, setUserTab,
        distQ, setDistQ,
        distReview, setDistReview,
        drawer, setDrawer,
        form, setForm,
        formError, setFormError,
        confirm, setConfirm,
        st, setSt, saveSettings, ST_DEFAULT,
        approvals, setApprovals,
        driverApprovalFilter, setDriverApprovalFilter,
        deleted, setDeleted,
        drvReqs, setDrvReqs,
        rejectReason, setRejectReason,
        vehTanks, setVehTanks,
        masterEdits, setMasterEdits,
        devReqs, setDevReqs,
        devFilter, setDevFilter,
        adminNotifOpen, setAdminNotifOpen,
        sendNoticeOpen, setSendNoticeOpen,
        adminNotifications, setAdminNotifications,
        adminNotifRead,
        unreadAdminNotifCount,
        markAdminNotifsRead,
        pushAdminNotification,
        pushAdminNotificationsOnce,
        dashTab, setDashTab,
        dashCfg: dashCfg || dashDefault(),
        saveDash,
        dashDefault,
        dashForm, setDashForm,
        dashFormErr, setDashFormErr,
        rb, setRb,
        fmtPhone, fmtImei, stampNow,
        pushNotice, decideDriver, requestNewBunk, decideBunkRequest, bunkReqs, setBunkReqs, saveMaster, saveMasterMany, setVehTank, normalizeRecord,
        shrinkImage, readReqs, writeReqs, navTo,
      }}
    >
      {children}
    </TMSAdminContext.Provider>
  );
};

export default TMSAdminContext;

