import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TMS, formatPhone, formatImei } from '../utils';

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
  const [tf, setTf] = useState({ branch: '', status: '', type: '', flag: '', q: '' });
  const [excType, setExcType] = useState('');
  const [excStatus, setExcStatus] = useState('open');
  const [excSel, setExcSel] = useState('X02');
  const [excAssignee, setExcAssignee] = useState('');
  const [excNote, setExcNote] = useState('');
  const [excOverrides, setExcOverrides] = useState({});
  const [fleetFilter, setFleetFilter] = useState('all');
  const [masterQ, setMasterQ] = useState('');
  const [attBranch, setAttBranch] = useState('');
  const [anTab, setAnTab] = useState('trips');
  const [range, setRange] = useState('30d');
  const [userTab, setUserTab] = useState('users');
  const [distQ, setDistQ] = useState('');
  const [distReview, setDistReview] = useState({});
  const [drawer, setDrawer] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [st, setSt] = useState({
    variance: '5', radius: '100', longOpen: '8', idle: '15', gpsFail: '30',
    serial: 'monthly', reasons: 'Maintenance, Internal Movement, Empty Return, Driver Testing',
    session: '12', attReminder: true, excEmail: true
  });
  const [approvals, setApprovals] = useState({});
  const [driverApprovalFilter, setDriverApprovalFilter] = useState('');
  const [deleted, setDeleted] = useState([]);
  const [drvReqs, setDrvReqs] = useState([]);
  const [rejectReason, setRejectReason] = useState('');
  const [vehTanks, setVehTanks] = useState({});
  const [masterEdits, setMasterEdits] = useState({});
  const [devReqs, setDevReqs] = useState([]);
  const [devFilter, setDevFilter] = useState('all');
  const [adminNotifOpen, setAdminNotifOpen] = useState(false);

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
  const T = () => (typeof window !== 'undefined' && window.TMS) || TMS;

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

  const saveMaster = (route, rec, isNew) => {
    const all = masterEdits, cur = all[route] || { added: [], edited: {} }, added = cur.added || [];
    const next = {
      ...all,
      [route]: isNew
        ? { ...cur, added: [rec, ...added] }
        : added.some(r => r.id === rec.id)
        ? { ...cur, added: added.map(r => r.id === rec.id ? rec : r) }
        : { ...cur, edited: { ...(cur.edited || {}), [rec.id]: rec } }
    };
    setMasterEdits(next);
    try { localStorage.setItem(MASTER_KEY, JSON.stringify(next)); } catch (e) {}
  };

  const setVehTank = (id, litres) => {
    const next = { ...vehTanks, [id]: litres };
    setVehTanks(next);
    try { localStorage.setItem(TANK_KEY, JSON.stringify(next)); } catch (e) {}
  };

  const normalizeRecord = (route, formObj, isNew) => {
    const tms = T(), f = { ...formObj }, dg = x => String(x || '').replace(/\D/g, '');
    const num = k => { if (f[k] !== undefined && f[k] !== '') f[k] = Number(String(f[k]).replace(/[^\d.-]/g, '')) || 0; };
    if (isNew) f.id = route.slice(0, 2).toUpperCase() + 'X' + Date.now();
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
    if (route === 'supervisors') { f.phone = fmtPhone(dg(f.phone)); if (isNew) { f.lastLogin = 'Never'; dflt('status', 'Active'); } }
    if (route === 'clients' && isNew) { f.customers = 0; dflt('status', 'Active'); }
    if (route === 'locations') { num('radius'); num('lat'); num('lng'); dflt('radius', 100); dflt('status', 'Active'); }
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
        excAssignee, setExcAssignee,
        excNote, setExcNote,
        excOverrides, setExcOverrides,
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
        st, setSt,
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
        dashTab, setDashTab,
        dashCfg: dashCfg || dashDefault(),
        saveDash,
        dashDefault,
        dashForm, setDashForm,
        dashFormErr, setDashFormErr,
        rb, setRb,
        fmtPhone, fmtImei, stampNow,
        pushNotice, decideDriver, saveMaster, setVehTank, normalizeRecord,
        shrinkImage, readReqs, writeReqs, navTo,
      }}
    >
      {children}
    </TMSAdminContext.Provider>
  );
};

export default TMSAdminContext;

