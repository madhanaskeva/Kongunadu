import React from 'react';
import SupervisorScreens from './SupervisorScreens';
import { TMS, formatPhone } from '../../utils';
import { isPendingClose, pendingCloseDetail, ENROUTE_LABEL } from '../../utils/tripStatus';
import './supervisorStates.css';
import './supervisorApp.css';

// Supervisor App · mobile field operations for branch supervisors.
// Ported from the "TMS Supervisor App" prototype. All screen state lives here; renderVals() builds
// the values and handlers each screen reads through its `v` prop.
// Device approvals, driver requests, notices and master edits are shared with the Admin Portal
// through localStorage on the same origin, polled once a second.
export class SupervisorApp extends React.Component {
  state = {
    screen: 'approval', loginState: 'idle', loginPhone: null, loginPassword: null, loginErr: '', supId: '', branchId: '',
    ob: { name: '', phone: '', otp: ['', '', '', ''], expected: '', shared: false, requestedAt: '' }, obStatus: 'idle', obReqId: '', obShowErr: false, obOtpErr: '',
    reg: { name: '', password: '' }, regShowErr: false, regSaving: false, account: null, notifOpen: false, discardOpen: false, toast: null, saving: false,
    gpsGranted: true, unclosedFilter: 'all', forceEmpty: false,
    form: this.blankForm(),
    showErrors: false, drvPickOpen: false, reqFromOpen: false,
    newLoc: { open: false, name: '' }, showNewLocErr: false, addedLocations: [],
    drvReqs: [], seedApprovals: {}, vehTanks: {}, masterEdits: {},
    cf: this.blankClose(), showCloseErrors: false,
    rf: this.blankRf(), showReqErrors: false,
    selected: 'T01', history: [], histSel: '', closedData: {}, forceEmptyHist: false,
    notifFilter: 'all', notifSel: '', notifRead: ['N05', 'N06'], activity: [], adminNotices: [],
    hf: { vehicle: '', from: '', to: '' }, hfDraft: { from: '', to: '' }, hfCalOpen: false, hfErr: '',
    localTrips: [], closedIds: [],
    att: { D01: 'P', D02: '', D07: '', D09: '' }, attVeh: { D01: 'V01' }, attVehStatus: {}, attTab: 'mark', attSaved: this.seedAttSaved(), attOpenDay: '',
    am: { vehicle: '', driver: '', status: '' },
    idle: this.seedIdle(), idleFilter: 'all', showIdleErrors: false
  };
  // The signed-in supervisor and their branch, set at login from the Supervisor Master.
  get SUP() { return (this.state && this.state.supId) || 'S01'; }
  get BR() { return (this.state && this.state.branchId) || 'B01'; }
  me() { const T = this.T(), sup = T.S[this.SUP] || {}; return { name: sup.name || 'Supervisor', branch: (T.B[this.BR] || {}).name || 'Branch' }; }
  // Seeded supervisors have no password of their own yet; they use the demo password until they register.
  DEMO_PASSWORD = 'password';
  findSupervisorByPhone(digits) { return (this.T().supervisors || []).find(r => String(r.phone || '').replace(/\D/g, '') === digits); }
  // Device approval is shared with the Admin Portal through localStorage (same origin), polled once a second.
  REQ_KEY = 'kr-tms-device-approvals'; IMEI_KEY = 'kr-tms-device-imei'; NOTICE_KEY = 'kr-tms-supervisor-notices';
  // New-driver requests go to the Admin Portal the same way; its approve/reject decisions come back on the same keys.
  DRV_KEY = 'kr-tms-driver-requests'; DRV_APPROVAL_KEY = 'kr-tms-driver-approvals';
  // Tank sizes Head Office sets in the Vehicle Master override the seed data.
  TANK_KEY = 'kr-tms-vehicle-tanks';
  // Saved daily attendance, shared with the Admin Portal: { [branch]: { [YYYY-MM-DD]: { label, savedAt, entries } } }.
  ATT_KEY = 'kr-tms-attendance';
  ADMIN_NOTIF_KEY = 'kr-tms-admin-notifications';
  pushAdminNotif(item) {
    try {
      const existing = JSON.parse(localStorage.getItem(this.ADMIN_NOTIF_KEY) || 'null') || [];
      const notif = {
        id: 'AN' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        time: item.time || 'Just now',
        createdAt: new Date().toISOString(),
        ...item
      };
      const updated = [notif, ...existing.filter(x => x.id !== notif.id)].slice(0, 50);
      localStorage.setItem(this.ADMIN_NOTIF_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('kr-tms-admin-notifications-changed'));
    } catch (e) {}
  }
  readAttStore() { try { return JSON.parse(localStorage.getItem(this.ATT_KEY) || '{}') || {}; } catch (e) { return {}; } }
  loadAttSaved() { const mine = this.readAttStore()[this.BR] || {}; const days = Object.keys(mine); if (!days.length) return; this.setState(st => ({ attSaved: [...days.map(day => ({ day, ...mine[day] })), ...st.attSaved.filter(r => !mine[r.day])] })); }
  writeAttDay(rec) { const store = this.readAttStore(), { day, ...rest } = rec; store[this.BR] = { ...(store[this.BR] || {}), [day]: rest }; try { localStorage.setItem(this.ATT_KEY, JSON.stringify(store)); } catch (e) { /* storage blocked: kept on this device only */ } }
  syncTanks() { let m; try { m = JSON.parse(localStorage.getItem(this.TANK_KEY) || '{}') || {}; } catch (e) { return; } const json = JSON.stringify(m); if (json === this._tankJson) return; this._tankJson = json; this.setState({ vehTanks: m }); }
  tankOf(vehicleId) { return Number(this.state.vehTanks[vehicleId] || (this.T().V[vehicleId] || {}).tank) || 0; }
  readDrvReqs() { try { return JSON.parse(localStorage.getItem(this.DRV_KEY) || '[]') || []; } catch (e) { return this.state.drvReqs; } }
  syncDriverReqs() {
    let list, seed;
    try { list = JSON.parse(localStorage.getItem(this.DRV_KEY) || '[]') || []; seed = JSON.parse(localStorage.getItem(this.DRV_APPROVAL_KEY) || '{}') || {}; } catch (e) { return; }
    const json = JSON.stringify([list, seed]);
    if (json === this._drvJson) return;
    this._drvJson = json;
    const mine = list.filter(r => r.branch === this.BR);
    // A driver already picked on the Open Trip form who is now rejected has to be replaced.
    const f = this.state.form, gone = mine.find(r => r.id === f.driver && r.status === 'Rejected');
    this.setState(st => ({ drvReqs: mine, seedApprovals: seed, ...(gone ? { form: { ...st.form, driver: '', driverOk: false } } : {}) }));
    if (gone) this.toast('warning', `Driver rejected · ${gone.name}`, 'Head Office rejected this driver. Choose another driver for the trip.');
  }
  // Branch driver master with Head Office decisions applied, plus drivers requested from this app.
  branchDrivers() {
    const s = this.state, T = this.T();
    const seed = T.drivers.filter(d => d.branch === this.BR).map(d => { const ap = s.seedApprovals[d.id]; return ap ? { ...d, approval: ap, status: ap === 'Approved' && d.status === 'Pending' ? 'Active' : ap === 'Rejected' ? 'Inactive' : d.status } : d; });
    const req = s.drvReqs.map(r => ({ id: r.id, name: r.name, licence: r.licence, phone: this.fmtPhone(r.phone), branch: r.branch, type: 'New', status: r.status === 'Rejected' ? 'Inactive' : 'Active', approval: r.status === 'Pending' ? 'Pending approval' : r.status, requested: true }));
    return [...seed, ...req];
  }
  fmtPhone(d) { return formatPhone(d); }
  // Notices the Admin Portal sends (messages and admin actions) for this branch.
  syncNotices() {
    let list;
    try { list = JSON.parse(localStorage.getItem(this.NOTICE_KEY) || '[]') || []; } catch (e) { return; }
    const json = JSON.stringify(list);
    if (json === this._noticeJson) return;
    const first = this._noticeJson === undefined; this._noticeJson = json;
    // A notice addressed to named supervisors (`to`) reaches only them;
    // everything else is branch-wide as before.
    const mine = list.filter(n => (Array.isArray(n.to) && n.to.length)
      ? n.to.includes(this.SUP)
      : (n.branch === this.BR || n.branch === 'all'));
    const fresh = first ? [] : mine.filter(n => !this.state.adminNotices.some(o => o.id === n.id));
    this.setState({ adminNotices: mine });
    if (fresh.length && !['approval', 'otp', 'register', 'login'].includes(this.state.screen)) this.toast(fresh[0].priority === 'Urgent' ? 'warning' : 'info', fresh[0].kind === 'message' ? 'New message from Head Office' : 'Update from Head Office', fresh[0].title);
  }
  // Your own actions this session, kept as read items in the Notifications page.
  logActivity(n) { this.setState(st => ({ activity: [{ id: 'ACT' + Date.now() + '-' + st.activity.length, kind: 'activity', from: 'You · ' + this.me().name, sort: this.sortStamp(), ...n }, ...st.activity] })); }
  // Re-render when Head Office deletes a record (T() reads the deleted list itself).
  syncDeleted() { let j = '[]'; try { j = localStorage.getItem('kr-tms-deleted') || '[]'; } catch (e) { return; } if (j === this._delJson) return; const first = this._delJson === undefined; this._delJson = j; if (!first) this.forceUpdate(); }
  componentDidMount() {
    this.syncNotices(); this.syncDriverReqs(); this.syncTanks(); this.syncMaster(); this.loadAttSaved();
    this._poll = setInterval(() => { this.syncApproval(); this.syncNotices(); this.syncDriverReqs(); this.syncTanks(); this.syncMaster(); this.syncDeleted(); }, 1000);
    this._onStorage = e => { if (e.key === this.REQ_KEY) this.syncApproval(); if (e.key === this.NOTICE_KEY) this.syncNotices(); if (e.key === this.DRV_KEY || e.key === this.DRV_APPROVAL_KEY) this.syncDriverReqs(); if (e.key === this.TANK_KEY) this.syncTanks(); if (e.key === this.MASTER_KEY) this.syncMaster(); };
    window.addEventListener('storage', this._onStorage);
    const mine = this.readReqs().find(r => r.imei === this.deviceImei() && r.status === 'Pending');
    if (mine && this.state.screen === 'approval') this.setState({ obStatus: 'waiting', obReqId: mine.id, ob: { ...this.state.ob, name: mine.name || '', phone: mine.phone, requestedAt: mine.requestedAt } });
  }
  componentWillUnmount() { clearInterval(this._poll); clearTimeout(this._tt); window.removeEventListener('storage', this._onStorage); }
  readReqs() { try { return JSON.parse(localStorage.getItem(this.REQ_KEY) || '[]') || []; } catch (e) { return []; } }
  writeReqs(list) { try { localStorage.setItem(this.REQ_KEY, JSON.stringify(list)); } catch (e) { /* storage blocked: the request stays local */ } }
  // Keep the Supervisor Master row (created when Head Office approved this phone) in step with registration
  updateSupervisorRecord(phoneDigits, patch) {
    let m; try { m = JSON.parse(localStorage.getItem(this.MASTER_KEY) || '{}') || {}; } catch (e) { return; }
    const cur = m.supervisors || { added: [], edited: {} }, added = cur.added || [];
    const same = r => String(r.phone || '').replace(/\D/g, '') === phoneDigits;
    if (added.some(same)) m.supervisors = { ...cur, added: added.map(r => (same(r) ? { ...r, ...patch } : r)) };
    else {
      // A seeded supervisor: keep the change as an edit on top of the seed row.
      const seed = (this.T().supervisors || []).find(same);
      if (!seed) return;
      const edited = cur.edited || {};
      m.supervisors = { ...cur, added, edited: { ...edited, [seed.id]: { ...(edited[seed.id] || {}), ...patch } } };
    }
    try { localStorage.setItem(this.MASTER_KEY, JSON.stringify(m)); } catch (e) { return; }
    this.syncMaster();
  }
  patchReq(id, patch) { this.writeReqs(this.readReqs().map(r => r.id === id ? { ...r, ...patch } : r)); }
  deviceImei() {
    if (this._imei) return this._imei;
    try { this._imei = localStorage.getItem(this.IMEI_KEY) || ''; } catch (e) { this._imei = ''; }
    if (!/^\d{15}$/.test(this._imei)) {
      const d = '35' + Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
      let sum = 0; for (let i = 0; i < 14; i++) { let n = +d[i]; if (i % 2) { n *= 2; if (n > 9) n -= 9; } sum += n; }
      this._imei = d + (10 - sum % 10) % 10;
      try { localStorage.setItem(this.IMEI_KEY, this._imei); } catch (e) { /* keep for this session */ }
    }
    return this._imei;
  }
  nowText() { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]} ${p(d.getHours())}:${p(d.getMinutes())}`; }
  // '22 Sep 2026 14:05', the format trips are stored with and the Admin Portal reads.
  stampText() { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]} ${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`; }
  // '2026-09-22 14:05:09', used to sort notifications.
  sortStamp() { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; }
  syncApproval() {
    const s = this.state;
    if (s.screen !== 'approval' || s.obStatus !== 'waiting' || !s.obReqId) return;
    const r = this.readReqs().find(x => x.id === s.obReqId);
    if (!r) return;
    if (r.status === 'Approved' && r.otp) {
      this.setState({ screen: 'otp', history: [], railVariant: '', obOtpErr: '', ob: { ...s.ob, otp: r.otp.split(''), expected: r.otp, shared: true } });
      this.toast('success', 'Approved by Head Office', 'OTP received. Verify it to continue.');
    } else if (r.status === 'Rejected') this.setState({ obStatus: 'rejected', obReqId: '' });
  }
  // Seed data plus vehicles, drivers and loading locations Head Office added or edited in the Admin Portal masters.
  T() {
    const base = (typeof window !== 'undefined' && window.TMS) || TMS, e = (this.state && this.state.masterEdits) || {};
    // Records Head Office deleted in the Admin Portal drop out of the supervisor's lists.
    let delJson = '[]'; try { delJson = localStorage.getItem('kr-tms-deleted') || '[]'; } catch (err) { /* storage blocked */ }
    if (!Object.keys(e).length && delJson === '[]') return base;
    const key = this._masterJson + '|' + delJson;
    if (this._t && this._tKey === key) return this._t;
    let gone; try { gone = new Set(JSON.parse(delJson)); } catch (err) { gone = new Set(); }
    const merge = (route, seed) => { const x = e[route] || {}, ed = x.edited || {}; return [...seed.map(r => ed[r.id] ? { ...r, ...ed[r.id] } : r), ...(x.added || [])].filter(r => !gone.has(r.id)); };
    const by = a => Object.fromEntries(a.map(r => [r.id, r]));
    const vehicles = merge('vehicles', base.vehicles), drivers = merge('drivers', base.drivers), locations = merge('locations', base.locations), trips = merge('trips', base.trips), clients = merge('clients', base.clients || []), supervisors = merge('supervisors', base.supervisors || []), customers = merge('customers', base.customers || []), bunks = merge('bunks', base.bunks || []);
    this._t = { ...base, vehicles, V: { ...base.V, ...by(vehicles) }, drivers, D: { ...base.D, ...by(drivers) }, locations, L: { ...base.L, ...by(locations) }, trips, T: { ...base.T, ...by(trips) }, clients, C: { ...base.C, ...by(clients) }, supervisors, S: { ...base.S, ...by(supervisors) }, customers, U: { ...base.U, ...by(customers) }, bunks, F: { ...base.F, ...by(bunks) } }; this._tKey = key;
    return this._t;
  }
  MASTER_KEY = 'kr-tms-master-edits';
  syncMaster() { let m; try { m = JSON.parse(localStorage.getItem(this.MASTER_KEY) || '{}') || {}; } catch (e) { return; } const json = JSON.stringify(m); if (json === this._masterJson) return; this._masterJson = json; this.setState({ masterEdits: m }); }
  go(screen, extra = {}) { this.setState(s => ({ screen, notifOpen: false, history: [...s.history, s.screen], ...extra })); }
  set(path, v) { this.setState(s => ({ [path[0]]: { ...s[path[0]], [path[1]]: v } })); }
  toast(tone, title, message) { clearTimeout(this._tt); this.setState({ toast: { tone, title, message } }); this._tt = setTimeout(() => this.setState({ toast: null }), 3200); }
  allTrips() { const T = this.T(); return [...T.trips, ...this.state.localTrips]; }
  drv(id) { return this.branchDrivers().find(d => d.id === id) || this.T().D[id] || null; }
  loc(id) { return this.T().L[id] || this.state.addedLocations.find(l => l.id === id) || null; }
  toggleCustomer(id) { this.setState(s => { const cur = s.form.unloading || []; return { form: { ...s.form, unloading: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] } }; }); }
  active() { return this.allTrips().filter(t => t.branch === this.BR && t.status === 'Enroute' && !this.state.closedIds.includes(t.id)); }
  // Badge colours per status label → [background, text, edge], from the --st-* palette in <helmet>.
  statusTone(label) {
    const k = { [ENROUTE_LABEL]: 'enroute', 'Enroute': 'enroute', 'Loading': 'loading', 'Unloading': 'unloading', 'Delayed': 'delayed', 'On trip': 'enroute', 'Running': 'enroute', 'Verified': 'enroute', 'Long open': 'long', 'Idle': 'long', 'Pending': 'long', 'GPS issue': 'gps', 'Rejected': 'gps', 'Closed': 'closed', 'Present': 'closed', 'Approved': 'closed', 'Closed · flagged': 'flagged', 'Absent': 'absent' }[label] || 'neutral';
    return [`var(--st-${k}-bg)`, `var(--st-${k}-fg)`, `var(--st-${k}-edge)`];
  }
  decorate(t) {
    const T = this.T(); const v = T.V[t.vehicle], d = this.drv(t.driver), c = T.C[t.client];
    const long = t.hoursOpen > 24, gpsBad = (t.flags || []).some(f => /GPS/.test(f));
    const badge = long ? 'Long open' : gpsBad ? 'GPS issue' : t.stage || t.status;
    const tone = this.statusTone(badge);
    const fixed = t.fixedKm || 0, prog = fixed ? Math.min(100, Math.round((t.gpsKm || 0) / fixed * 100)) : 0;
    const vNum = v ? v.number : '—', locName = (this.loc(t.loading) || {}).name || '—';
    const crewLine = d ? `${vNum} · ${d.name}` : vNum, routeLine = c ? `${c.name} → ${t.unloading}` : t.from ? `${t.from} → ${t.unloading} · ${t.nbKm} km · ${t.reason}` : `From ${locName} · ${t.type}${t.reason ? ' · ' + t.reason : ''}`;
    return { ...t, vehicleNumber: vNum, driverName: d ? d.name : '—', clientName: c ? c.name : '—', crewLine, routeLine, partyName: c ? c.name : locName, badge, badgeBg: tone[0], badgeFg: tone[1], edge: tone[2], progress: prog + '%', gpsKm: t.gpsKm == null ? '—' : t.gpsKm, expectedHours: (T.R[(T.U[(t.customers || [])[0]] || {}).route] || {}).hours || 12, startKm: t.startKm.toLocaleString('en-IN') };
  }
  renderVals() {
    const T = this.T(); const s = this.state, f = s.form;
    const is = {}; is[s.screen] = true;
    const isLogin = s.screen === 'login', isAuth = ['approval', 'otp', 'register', 'login'].includes(s.screen), isApp = !isAuth;
    // Onboarding · approval → OTP → register
    const ob = s.ob, obDigits = ob.phone.replace(/\D/g, ''), obPhoneText = obDigits.length === 10 ? obDigits.slice(0, 5) + ' ' + obDigits.slice(5) : ob.phone;
    const obStepIdx = { approval: 0, otp: 1, register: 2 }[s.screen] || 0;
    const otpBad = !!s.obOtpErr;
    const regBad = { name: !s.reg.name.trim() ? 'Enter your full name.' : undefined, password: s.reg.password.length < 6 ? 'Use at least 6 characters.' : undefined };
    const titles = { home: 'Kongunadu Road Lines', open: 'Open Trip', openReview: 'Review trip', openDone: 'Trip opened', closeList: 'Close Trip', close: 'Close Trip', closeReview: 'Review close', closeDone: 'Trip closed', unclosed: 'Unclosed Trips', history: 'Trip history', histTrip: 'Closed trip', trip: 'Trip detail', notifications: 'Notifications', notifDetail: 'Notification', attMark: 'Attendance', attendance: 'Daily attendance', attMonth: 'Monthly attendance', reqDriver: 'Request new driver', reqDone: 'Request sent', idle: 'Vehicle idle status', gpsPerm: 'Location access', offline: 'Connection lost' };
    // Open trip options
    const activeVeh = new Set(this.active().map(t => t.vehicle)), activeDrv = new Set(this.active().map(t => t.driver));
    const sup = T.S[this.SUP] || {}, me = this.me();
    // Live date for everything the screens show and the records sent to Head Office.
    const TD = new Date(), pd = n => String(n).padStart(2, '0');
    const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const todayIso = `${TD.getFullYear()}-${pd(TD.getMonth() + 1)}-${pd(TD.getDate())}`;
    const todayDM = `${TD.getDate()} ${MONTH_FULL[TD.getMonth()]}`, todayShort = `${TD.getDate()} ${MONTH_FULL[TD.getMonth()].slice(0, 3)}`;
    const todayLong = `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][TD.getDay()]}, ${todayDM} ${TD.getFullYear()}`;
    const isoDaysAgo = n => { const d = new Date(TD); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${pd(d.getMonth() + 1)}-${pd(d.getDate())}`; };
    const loginPhone = s.loginPhone ?? (s.account ? s.account.phone.slice(0, 5) + ' ' + s.account.phone.slice(5) : '98410 22314');
    const loginPassword = s.loginPassword ?? (s.account ? '' : this.DEMO_PASSWORD);
    const myClients = T.clients.filter(c => {
      const idMatch = (sup.clientIds || []).includes(c.id);
      const nameMatch = (sup.clientIds || []).includes(c.name) ||
        (typeof sup.clients === 'string' && sup.clients.toLowerCase().includes(c.name.toLowerCase())) ||
        (Array.isArray(sup.clients) && (sup.clients.includes(c.name) || sup.clients.includes(c.id)));
      const branchMatch = c.branch === this.BR;
      return idMatch || nameMatch || branchMatch;
    });
    const clientOptions = myClients.map(c => ({ value: c.id, label: c.name + (c.status === 'Active' ? '' : ' · ' + c.status) }));
    const branchVeh = T.vehicles.filter(v => v.branch === this.BR);
    const forClient = (v, c) => !(v.clients || []).length || v.clients.includes(c);
    const mappedVeh = f.client ? branchVeh.filter(v => forClient(v, f.client)) : branchVeh;
    // A 'Running' vehicle whose trip was closed in this session is free again.
    const availVeh = mappedVeh.filter(v => (v.status === 'Idle' || v.status === 'Running') && !activeVeh.has(v.id));
    const onTripVeh = mappedVeh.filter(v => activeVeh.has(v.id));
    const vehicleOptions = [...availVeh.map(v => ({ value: v.id, label: `${v.number} · ${v.type}` })), ...onTripVeh.map(v => ({ value: v.id, label: `${v.number} · unclosed trip` }))];
    const busyVeh = mappedVeh.filter(v => !availVeh.includes(v) && !onTripVeh.includes(v)).map(v => `${v.number} (${v.status.toLowerCase()})`);
    // Closing KM from a trip closed in this session beats the master odometer.
    const lastKm = v => Math.max(Number(v.odometer) || 0, ...this.allTrips().filter(t => t.vehicle === v.id && s.closedData[t.id]).map(t => Number(s.closedData[t.id].closeKm) || 0));
    const allBranchDrv = this.branchDrivers(), branchDrv = allBranchDrv.filter(d => !d.requested || d.approval === 'Approved');
    const locationOptions = [...T.locations.filter(l => l.branch === this.BR && l.status === 'Active'), ...s.addedLocations]
      .map(l => ({ value: l.id, label: l.name })).concat([{ value: '__add', label: '+ Add loading location (GPS)' }]);
    const veh = T.V[f.vehicle]; const firstTrip = f.vehicle === 'V04';
    // Unloading — customers predefined against the selected client
    const clientCust = f.client ? T.customers.filter(u => u.client === f.client && u.status === 'Active') : [];
    const picked = (f.unloading || []).filter(id => clientCust.some(u => u.id === id));
    const customerOptions = clientCust.map(u => { const r = T.R[u.route] || {}; const on = picked.includes(u.id); return { id: u.id, name: u.name, sub: `${u.city} · ${r.km ? r.km + ' km fixed route' : 'route not fixed'} · ${u.billing}`, on, bg: on ? 'var(--color-brand-tint)' : '#fff', divider: 'var(--border-default)', toggle: () => this.toggleCustomer(u.id) }; });
    const pickedCust = picked.map(id => T.U[id]).filter(Boolean);
    const unloadMode = f.unloadMode === 'multiple' ? 'multiple' : 'single';
    const routeKm = pickedCust.reduce((a, u) => a + ((T.R[u.route] || {}).km || 0), 0);
    const routeHours = pickedCust.reduce((a, u) => a + ((T.R[u.route] || {}).hours || 0), 0);
    const routeSummary = pickedCust.length === 1 ? `${(T.R[pickedCust[0].route] || {}).name || pickedCust[0].city} · ${routeKm.toLocaleString('en-IN')} km fixed · about ${routeHours} h.` : `${pickedCust.map(u => u.city).join(' → ')} · ${routeKm.toLocaleString('en-IN')} km fixed across ${pickedCust.length} drops · about ${routeHours} h.`;
    // Driver — the vehicle's mapped driver is suggested for a tick/cross confirm; the picker lists only drivers free today
    // (active, approved, not on an open trip, not marked absent), plus anyone requested here for approval.
    const freeDrv = branchDrv.filter(d => d.status === 'Active' && d.approval === 'Approved' && !activeDrv.has(d.id) && s.att[d.id] !== 'A');
    const drvList = [...freeDrv, ...allBranchDrv.filter(d => d.requested && d.approval === 'Pending approval' && !activeDrv.has(d.id))];
    const mappedDrv = veh && veh.driver ? this.drv(veh.driver) : null;
    const driverVal = !veh ? '' : f.driver || (mappedDrv && drvList.some(d => d.id === mappedDrv.id) ? mappedDrv.id : '');
    const drvSel = drvList.find(d => d.id === driverVal);
    const drvOk = !!drvSel && !!f.driverOk, drvPending = !!drvSel && drvSel.approval !== 'Approved';
    const initials = n => String(n || '').replace(/[^A-Za-z ]/g, ' ').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const drvSub = d => `${d.type} · +91 ${d.phone}`;
    const mappedWhy = d => activeDrv.has(d.id) ? 'on another trip' : s.att[d.id] === 'A' ? 'marked absent today' : d.status === 'Inactive' ? 'inactive' : 'not approved yet';
    const startKmLocked = !!veh && !firstTrip;
    const startKmHint = !veh ? 'Select a vehicle first.' : firstTrip ? 'First recorded trip for this vehicle. Enter the reading manually.' : `Carried from previous closing KM (${lastKm(veh).toLocaleString('en-IN')}).`;
    const startKmVal = veh ? (firstTrip ? f.startKm : String(lastKm(veh))) : '';
    const needsLoad = f.type !== 'Non-Business';
    const openBad = needsLoad ? { client: !f.client, vehicle: !f.vehicle, loading: !f.loading, unloading: !picked.length, startKm: firstTrip && !f.startKm, driver: !drvOk }
      : { from: !(f.from || '').trim(), to: !(f.to || '').trim(), km: !(Number(f.km) > 0), reason: !f.reason, vehicle: !f.vehicle, driver: !drvOk };
    const err = s.showErrors ? openBad : {};
    const dcState = !veh ? 'none' : !drvSel ? 'empty' : drvOk ? 'ok' : 'ask';
    const dc = {
      none: dcState === 'none', ask: dcState === 'ask', ok: dcState === 'ok', empty: dcState === 'empty', has: dcState === 'ask' || dcState === 'ok',
      tag: { none: 'Mapped per vehicle', ask: 'Confirm driver', ok: drvPending ? 'Pending approval' : 'Confirmed', empty: 'Not set' }[dcState],
      name: drvSel ? drvSel.name : '', initials: drvSel ? initials(drvSel.name) : '', sub: drvSel ? drvSub(drvSel) : '',
      status: dcState === 'ask' ? `Mapped to ${veh.number}` : drvPending ? 'Confirmed · pending approval' : 'Confirmed',
      statusFg: dcState === 'ask' ? 'var(--text-muted)' : drvPending ? '#7A4300' : 'var(--kr-green-800)',
      border: err.driver ? 'var(--status-danger)' : dcState === 'ok' ? 'var(--color-brand)' : 'var(--border-strong)',
      bg: dcState === 'ok' ? 'var(--color-brand-tint)' : '#fff',
      avatarBg: dcState === 'ok' ? 'var(--color-brand)' : 'var(--surface-muted)', avatarFg: dcState === 'ok' ? '#fff' : 'var(--text-heading)',
      emptyText: !veh ? '' : mappedDrv ? `${mappedDrv.name} is mapped to ${veh.number} but is ${mappedWhy(mappedDrv)}. Choose a free driver for this trip.` : `${veh.number} has no driver mapped. Choose a free driver for this trip.`,
      hint: dcState === 'none' ? 'From the branch driver master. A new driver needs Head Office approval.'
        : dcState === 'ask' ? 'Tap ✓ if this driver is taking the trip, or ✕ to choose another.'
        : dcState === 'empty' ? `${drvList.length} ${drvList.length === 1 ? 'driver is' : 'drivers are'} free today.`
        : drvPending ? `${drvSel.name} is pending Head Office approval. The trip still opens.`
        : mappedDrv && drvSel.id === mappedDrv.id ? `Mapped driver for ${veh.number}.` : `Assigned for this trip only. ${veh.number} stays mapped to ${mappedDrv ? mappedDrv.name : 'no driver'}.`
    };
    const driverErrText = !veh ? 'Select a vehicle, then confirm its driver.' : dcState === 'ask' ? 'Confirm the driver with ✓, or tap ✕ to choose another.' : 'Choose the driver taking this trip.';
    const pickList = drvList.map(d => { const on = drvOk && d.id === driverVal, mapped = !!mappedDrv && d.id === mappedDrv.id, pending = d.approval !== 'Approved';
      return { id: d.id, name: d.name, initials: initials(d.name), sub: drvSub(d), on: on ? 'true' : 'false', hasTag: mapped || pending, tag: pending ? 'Pending approval' : 'Mapped',
        tagBg: pending ? 'var(--color-hazard-soft)' : 'var(--color-brand-tint)', tagFg: pending ? '#7A4300' : 'var(--kr-green-800)',
        bg: on ? 'var(--color-brand-tint)' : '#fff', ring: on ? 'var(--color-brand)' : 'var(--border-strong)', dot: on ? 'var(--color-brand)' : 'transparent',
        avatarBg: on ? 'var(--color-brand)' : 'var(--surface-muted)', avatarFg: on ? '#fff' : 'var(--text-heading)' }; });
    const pickSub = `${drvList.length} ${drvList.length === 1 ? 'driver' : 'drivers'} free today${veh ? ' for ' + veh.number : ''} · not on a trip or marked absent.`;
    // Driver request — every field is checked before it goes to Head Office
    const rf = s.rf, digits = x => String(x || '').replace(/\D/g, '');
    const rfBad = {
      name: !rf.name.trim() ? 'Enter the name as on the licence.' : undefined,
      licence: rf.licence.replace(/\s/g, '').length < 10 ? 'Enter the full licence number.' : undefined,
      phone: digits(rf.phone).length !== 10 ? 'Enter a 10-digit mobile number.' : undefined,
      licImg: !rf.licImg ? 'Upload a clear photo of the driving licence.' : undefined,
      aadhaarImg: !rf.aadhaarImg ? 'Upload a clear photo of the Aadhaar card.' : undefined,
      holder: !rf.holder.trim() ? 'Enter the account holder name.' : undefined,
      account: !/^\d{9,18}$/.test(digits(rf.account)) ? 'Enter a 9 to 18 digit account number.' : undefined,
      ifsc: !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(rf.ifsc) ? 'Enter a valid IFSC, e.g. SBIN0001234.' : undefined,
      family: digits(rf.family).length !== 10 ? 'Enter a 10-digit family contact number.' : digits(rf.family) === digits(rf.phone) ? 'Use a family member’s number, not the driver’s.' : undefined
    };
    const rerr = s.showReqErrors ? rfBad : {};
    const reqErrorCount = Object.values(rerr).filter(Boolean).length;
    const uploads = [['licImg', 'Licence image', 'Front side'], ['aadhaarImg', 'Aadhaar image', 'Front side · number visible']].map(([key, label, note]) => {
      const file = rf[key], bad = !!rerr[key];
      return { key, label, note, empty: !file, set: !!file, name: file ? file.name : '', size: file ? file.size : '', url: file && file.url || '', noPreview: !!file && !file.url,
        border: bad ? 'var(--status-danger)' : 'var(--border-strong)', err: bad, errText: rerr[key] || '', removeLabel: `Remove ${label.toLowerCase()}` };
    });
    const openErrorCount = Object.values(err).filter(Boolean).length;
    const nextSerial = v => String(this.allTrips().filter(t => t.vehicle === v.id).reduce((m, t) => Math.max(m, Number(String(t.number || '').split('/')[2]) || 0), 0) + 1).padStart(3, '0');
    const tripNum = v => `${v.number.replace(/\s/g, '')}/${pd(TD.getMonth() + 1)}/${nextSerial(v)}`;
    const sampleVeh = availVeh[0] || branchVeh[0];
    const tripNumberPreview = veh ? tripNum(veh) : sampleVeh ? tripNum(sampleVeh) : `TN28BC1180/${pd(TD.getMonth() + 1)}/009`;
    const tripNumberNote = veh ? `${veh.number} · ${MONTH_FULL[TD.getMonth()]} · serial ${nextSerial(veh)}` : 'Example · VEH NO / MM / SNO, branch wise';
    const reviewRows = !veh ? [] : (needsLoad
      ? [['Trip number', tripNumberPreview], ['Trip type', 'Business'], ['Client', (T.C[f.client] || {}).name], ['Vehicle number', veh.number], ['Vehicle type', veh.type], ['Loading location', (this.loc(f.loading) || {}).name], ['Unloading', pickedCust.map(u => u.name).join(', ')], ['Start KM', startKmVal ? Number(startKmVal).toLocaleString('en-IN') + ' km' : ''], ['Driver', drvSel ? drvSel.name + (drvSel.approval === 'Approved' ? '' : ' · pending approval') : ''], ['Remarks', f.remarks]]
      : [['Trip number', tripNumberPreview], ['Trip type', 'Non-Business'], ['From', f.from], ['To', f.to], ['KM', f.km ? Number(f.km).toLocaleString('en-IN') + ' km' : ''], ['Purpose', f.reason], ['Vehicle number', veh.number], ['Driver', drvSel ? drvSel.name : '']]
    ).map(([k, v]) => ({ k, v: v || '—' }));
    // Trip history — every closed trip for this branch, with the closing details kept
    const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
    const closedTrips = this.allTrips().filter(t => t.branch === this.BR && (t.status === 'Closed' || s.closedIds.includes(t.id)));
    const closeInfo = t => {
      const cd = s.closedData[t.id];
      const rate = cd ? Number(cd.rate) || 0 : t.rate || 0;
      const litres = cd ? Number(cd.litres) || 0 : Number(String(t.diesel || '').replace(/[^\d.]/g, '')) || 0;
      const closeKm = cd ? Number(cd.closeKm) || 0 : t.closeKm || 0;
      return { closedAt: (cd ? cd.closedAt : t.closed) || '—', closeKm,
        odo: closeKm > t.startKm ? closeKm - t.startKm : (t.odoKm || 0),
        invoice: (cd ? cd.invoice : t.invoice) || '—', lr: (cd ? cd.lr : t.lr) || '—',
        advance: cd ? (cd.advance ? money(cd.advance) : '—') : (t.advance || '—'),
        bunk: (cd ? cd.bunk : t.bunk) || '—', rate, litres,
        qtyLoad: (cd ? cd.qtyLoad : t.qtyLoad) || '—', qtyUnload: (cd ? cd.qtyUnload : t.qtyUnload) || '—',
        totalExpense: cd && cd.totalExpense ? money(cd.totalExpense) : t.totalExpense ? (String(t.totalExpense).startsWith('₹') ? t.totalExpense : money(t.totalExpense)) : '—',
        closeRemarks: (cd && cd.remarks) || t.closeRemarks || '—',
        thisSession: !!cd };
    };
    // '12 Sep 2026 19:45' → '2026-09-12' so it compares with <input type="date"> values
    const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayKey = txt => { const [d, m, y, hm = '00:00'] = String(txt || '').split(' '); const mi = MON.indexOf(m); return mi < 0 ? { day: '', stamp: '' } : { day: `${y}-${String(mi + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, stamp: `${y}-${String(mi + 1).padStart(2, '0')}-${String(d).padStart(2, '0')} ${hm}` }; };
    const prettyDay = iso => { const [y, m, d] = String(iso || '').split('-'); return iso ? `${Number(d)} ${MON[Number(m) - 1]} ${y}` : ''; };
    const histList = closedTrips.map(t => {
      const v = T.V[t.vehicle], d = this.drv(t.driver), c = T.C[t.client], i = closeInfo(t);
      const flags = t.flags || [], flagged = flags.length > 0, when = dayKey(i.closedAt);
      return { id: t.id, number: t.number, vehicle: t.vehicle, closedDay: when.day, sort: when.stamp,
        crewLine: (v ? v.number : '—') + (d ? ' · ' + d.name : ''),
        routeLine: c ? `${c.name} → ${t.unloading}` : t.from ? `${t.from} → ${t.unloading} · ${t.reason}` : `${(this.loc(t.loading) || {}).name || '—'} · ${t.type}${t.reason ? ' · ' + t.reason : ''}`,
        badge: flagged ? 'Closed · flagged' : 'Closed', flagged, flagLine: flags.join(' · '),
        badgeBg: this.statusTone(flagged ? 'Closed · flagged' : 'Closed')[0], badgeFg: this.statusTone(flagged ? 'Closed · flagged' : 'Closed')[1],
        edge: this.statusTone(flagged ? 'Closed · flagged' : 'Closed')[2],
        closedAt: i.closedAt, distance: i.odo ? i.odo.toLocaleString('en-IN') + ' km' : '—' };
    }).sort((a, b) => b.sort.localeCompare(a.sort));
    // Trip history filters · vehicle and closed-date range, applied together
    const hf = s.hf;
    const histVehicles = [...new Set(histList.map(t => t.vehicle))].map(id => T.V[id]).filter(Boolean).sort((a, b) => a.number.localeCompare(b.number));
    const hfVehicleOptions = [{ value: '__all', label: `All vehicles (${histList.length})` }, ...histVehicles.map(v => { const n = histList.filter(t => t.vehicle === v.id).length; return { value: v.id, label: `${v.number} · ${n} ${n === 1 ? 'trip' : 'trips'}` }; })];
    const histFiltered = histList.filter(t => (!hf.vehicle || t.vehicle === hf.vehicle) && (!hf.from || t.closedDay >= hf.from) && (!hf.to || t.closedDay <= hf.to));
    const hfHasRange = !!(hf.from || hf.to), hfAnyFilter = hfHasRange || !!hf.vehicle;
    const hfRangeLabel = hf.from && hf.to ? (hf.from === hf.to ? prettyDay(hf.from) : `${prettyDay(hf.from)} – ${prettyDay(hf.to)}`) : hf.from ? `From ${prettyDay(hf.from)}` : hf.to ? `Up to ${prettyDay(hf.to)}` : '';
    const TODAY = todayIso;
    const hfPresets = [['Today', TODAY, TODAY], ['Last 7 days', isoDaysAgo(6), TODAY], ['This month', todayIso.slice(0, 8) + '01', TODAY]].map(([label, from, to]) => { const on = s.hfDraft.from === from && s.hfDraft.to === to; return { label, from, to, border: on ? 'var(--color-brand)' : 'var(--border-strong)', bg: on ? 'var(--color-brand)' : '#fff', color: on ? '#fff' : 'var(--text-heading)' }; });
    const histShown = s.forceEmptyHist ? [] : histFiltered;
    const histSel = closedTrips.find(t => t.id === s.histSel) || closedTrips[0];
    let hist = { number: '', openRows: [], closeRows: [] };
    if (histSel) {
      const t = histSel, i = closeInfo(t), v = T.V[t.vehicle], d = this.drv(t.driver), c = T.C[t.client];
      const flags = t.flags || [], flagged = flags.length > 0;
      const fixed = t.fixedKm || 0, gps = t.gpsKm || 0;
      const pct = fixed ? Math.round(Math.abs(Math.max(i.odo, gps) - fixed) / fixed * 1000) / 10 : 0;
      const over = fixed && pct > 5;
      const cust = (t.customers || []).map(id => (T.U[id] || {}).name).filter(Boolean).join(', ') || t.unloading || '—';
      hist = {
        number: t.number, badge: flagged ? 'Closed · flagged' : 'Closed',
        badgeBg: this.statusTone(flagged ? 'Closed · flagged' : 'Closed')[0], badgeFg: this.statusTone(flagged ? 'Closed · flagged' : 'Closed')[1],
        fixedKm: fixed ? fixed.toLocaleString('en-IN') : '—', gpsKm: gps ? gps.toLocaleString('en-IN') : '—',
        odoKm: i.odo ? i.odo.toLocaleString('en-IN') : '—',
        verifyBg: !fixed ? 'var(--surface-muted)' : over ? 'var(--color-hazard-soft)' : 'var(--color-brand-tint)',
        verifyFg: !fixed ? 'var(--text-body)' : over ? '#7A4300' : 'var(--kr-green-900)',
        verifyText: !fixed ? 'Non-business movement. No fixed route to verify against.' : over ? `Distance variance ${pct}% against the ${fixed.toLocaleString('en-IN')} km fixed route. Above the 5% limit, so Head Office reviewed it.` : `Distance verified within ${pct}% of the ${fixed.toLocaleString('en-IN')} km fixed route.`,
        openedAt: t.opened, closedAt: i.closedAt, flagged, flagLine: flags.join(' · '),
        openRows: [['Client', c ? c.name : '—'], ['Unloading customer', cust], ['Vehicle', v ? v.number : '—'], ['Vehicle type', v ? v.type : '—'], ['Driver', d ? d.name : '—'],
          ['Loading location', (this.loc(t.loading) || {}).name || '—'], ['Start KM', t.startKm.toLocaleString('en-IN') + ' km'],
          ['Trip type', t.type + (t.reason ? ' · ' + t.reason : '')], ['Supervisor', (T.S[t.supervisor] || {}).name || '—'],
          ['Remarks', t.remarks || '—']].map(([k, v2]) => ({ k, v: v2 })),
        closeRows: [['Loading invoice', i.invoice], ['LR number', i.lr], ['Closing odometer', i.closeKm ? i.closeKm.toLocaleString('en-IN') + ' km' : '—'],
          ['Trip distance', i.odo ? i.odo.toLocaleString('en-IN') + ' km' : '—'],
          ['Variance vs fixed', fixed ? pct + '%' : 'Not applicable'],
          ['Advance given', i.advance], ['Bunk name', i.bunk],
          ['Diesel rate', i.rate ? '₹' + i.rate.toFixed(2) + '/L' : '—'],
          ['Diesel quantity', i.litres ? i.litres.toLocaleString('en-IN') + ' L' : '—'],
          ['Diesel amount', i.rate && i.litres ? money(Math.round(i.rate * i.litres)) : '—'],
          ['Loading qty', i.qtyLoad], ['Unloading qty', i.qtyUnload], ['Total expense', i.totalExpense], ['Close remarks', i.closeRemarks]].map(([k, v2]) => ({ k, v: v2,
            bg: k === 'Variance vs fixed' && over ? 'var(--color-hazard-soft)' : 'transparent',
            color: k === 'Variance vs fixed' && over ? '#7A4300' : 'var(--text-heading)' }))
      };
    }
    // Selected trip
    const selTrip = this.allTrips().find(t => t.id === s.selected) || this.allTrips()[0];
    const selD = this.decorate(selTrip);
    const selRows = [...(selTrip.client ? [['Client', selD.clientName], ['Customer', selTrip.unloading]] : []), ['Vehicle', selD.vehicleNumber], ...(selTrip.driver ? [['Driver', selD.driverName]] : []),['Loading location', (this.loc(selTrip.loading) || {}).name], ['Trip type', selTrip.type + (selTrip.reason ? ' · ' + selTrip.reason : '')], ['Opened', selTrip.opened], ['Supervisor', (T.S[selTrip.supervisor] || {}).name], ...(selTrip.remarks ? [['Remarks', selTrip.remarks]] : [])].map(([k, v]) => ({ k, v: v || '—' }));
    // Close form
    const cf = s.cf, startNum = selTrip.startKm, km = n => Number(n || 0).toLocaleString('en-IN');
    const legs = cf.legs || [], fills = cf.fills || [];
    const points = this.tripPoints(selTrip), pointOptions = points.map(x => ({ value: x, label: x }));
    // Odometer — readings climb leg by leg; one leg over 2,500 km is treated as a typing mistake.
    const LEG_MAX = 2500, legPrev = i => i > 0 ? Number(legs[i - 1].reading) : startNum;
    const legEditing = cf.legEdit >= 0, di = legEditing ? cf.legEdit : legs.length, legEditorOpen = cf.legOpen || !legs.length;
    const defFrom = di > 0 ? legs[di - 1].to : points[0], defTo = points[points.indexOf(defFrom) + 1] || '';
    const ld = { ...cf.legDraft, from: cf.legDraft.from || defFrom, to: cf.legDraft.to || defTo };
    const ldNum = Number(ld.reading), ldPrev = legPrev(di), ldNext = legEditing && di < legs.length - 1 ? Number(legs[di + 1].reading) : null;
    const legBad = { route: !ld.from || !ld.to ? 'Select both From and To points.' : ld.from === ld.to ? 'From and To must be different points.' : undefined,
      reading: !ld.reading ? 'Enter the odometer reading.' : !(ldNum > ldPrev) ? `Must be more than ${km(ldPrev)} km.` : ldNext != null && ldNum >= ldNext ? `Must be less than the next reading (${km(ldNext)} km).` : ldNum - ldPrev > LEG_MAX ? `That is ${km(ldNum - ldPrev)} km for one leg. Check the reading.` : undefined,
      photo: !ld.photo ? 'Take a photo of the odometer.' : undefined };
    const legErr = cf.legTried ? legBad : {};
    const closeNum = legs.length ? Number(legs[legs.length - 1].reading) : 0;
    // Diesel — authorized bunks for this route
    const selRoute = (T.routes || []).find(r => r.id === selTrip.route || r.name === selTrip.route) || (T.routes || []).find(r => r.from === selTrip.loading && r.to === selTrip.unloading);
    const routeAuthIds = selRoute?.authorizedBunks || [];
    const bunkList = T.bunks.filter(b => b.branch === this.BR && b.status === 'Active');
    const routeAuthBunks = routeAuthIds.length > 0
      ? [
          ...T.bunks.filter(b => routeAuthIds.includes(b.id) || routeAuthIds.some(a => String(a).toLowerCase() === String(b.name).toLowerCase())),
          ...routeAuthIds.filter(a => !T.bunks.some(b => b.id === a || String(b.name).toLowerCase() === String(a).toLowerCase())).map(name => ({ name }))
        ]
      : bunkList;
    const authorizedBunkOptions = [
      ...routeAuthBunks.map(b => ({ value: b.name, label: `${b.name} (Authorized)` })),
      { value: 'NEW_BUNK', label: '+ Enter new bunk (Request Admin approval)' },
    ];

    const fillEditing = cf.fillEdit >= 0, fillEditorOpen = cf.fillOpen || !fills.length, fd = cf.fillDraft;
    const fdBunkName = fd.bunkChoice === 'NEW_BUNK' ? (fd.customBunk || '').trim() : (fd.bunkChoice || fd.bunk).trim();
    const fdL = Number(fd.litres) || 0, fdR = Number(fd.rate) || 0, fdRef = bunkList.find(b => b.name.toLowerCase() === fdBunkName.toLowerCase());
    const tank = this.tankOf(selTrip.vehicle), overTank = l => tank > 0 && Number(l) > tank, tankMsg = `More than the ${km(tank)} L tank.`;
    const fillBad = { bunk: !fdBunkName ? 'Enter or select the bunk name.' : undefined, litres: !(fdL > 0) ? 'Required.' : overTank(fdL) ? tankMsg : undefined, rate: !(fdR > 0) ? 'Required.' : undefined };
    // Over-tank shows straight away, not only after tapping Add bunk
    const fillErr = cf.fillTried ? fillBad : overTank(fdL) ? { litres: tankMsg } : {};
    const overFill = (cf.fills || []).findIndex(x => overTank(x.litres));
    const dieselLitres = fills.reduce((a, x) => a + (Number(x.litres) || 0), 0), dieselTotal = fills.reduce((a, x) => a + (Number(x.litres) || 0) * (Number(x.rate) || 0), 0);
    const money0 = n => '₹' + Math.round(n).toLocaleString('en-IN');
    const legDirty = legEditorOpen && !!(cf.legDraft.reading || cf.legDraft.photo), fillDirty = fillEditorOpen && !!(fd.bunk.trim() || fd.litres || fd.rate);
    const closeBad = { invoice: !cf.invoice ? 'Required for billing.' : undefined,
      legs: legDirty ? 'Tap Add reading to save the reading you entered, or cancel it.' : !legs.length ? 'Add at least one odometer reading with its photo.' : undefined,
      fills: fillDirty ? 'Tap Add bunk to save the bunk you entered, or cancel it.' : !fills.length ? 'Add the bunk where diesel was filled.' : overFill >= 0 ? `Bunk ${overFill + 1} is more than the ${km(tank)} L tank. Edit the quantity.` : undefined,
      totalExpense: !(Number(cf.totalExpense) > 0) ? 'Enter the total expense for this trip.' : undefined,
      qtyLoad: !cf.qtyLoad ? 'Required.' : undefined, qtyUnload: !cf.qtyUnload ? 'Required.' : undefined };
    const cerr = s.showCloseErrors ? closeBad : {};
    const odo = closeNum > startNum ? closeNum - startNum : (selTrip.odoKm || 0), gps = selTrip.gpsKm || 0, fixed = selTrip.fixedKm || 0;
    const pct = fixed ? Math.round(Math.abs(Math.max(odo, gps) - fixed) / fixed * 1000) / 10 : 0; const flagged = fixed && pct > 5;
    const verify = { fixed: fixed ? km(fixed) + ' km' : '—', gps: gps ? km(gps) + ' km' : '—', odo: odo ? km(odo) + ' km' : '—', pct: fixed ? pct + '%' : 'n/a', label: !fixed ? 'Non-business' : flagged ? 'Flagged for review' : 'Within 5%', bg: flagged ? 'var(--color-hazard-soft)' : 'var(--color-brand-tint)', fg: flagged ? '#7A4300' : 'var(--kr-green-900)' };
    // Trip closed page — everything captured, laid out like the Open Trip review
        const sumSec = (title, rows) => ({ title, rows: rows.map(([k, v, hi]) => ({ k, v: v || '—', bg: hi ? 'var(--color-hazard-soft)' : 'transparent' })) });
    const closeSummary = [
      sumSec('Trip', [['Trip number', selD.number], ['Vehicle', selD.vehicleNumber], ['Driver', selD.driverName], ['Client', selD.clientName], ['Unloading', selTrip.unloading], ['Trip type', selTrip.type + (selTrip.reason ? ' · ' + selTrip.reason : '')]]),
      sumSec('Odometer', [['Start KM', km(startNum) + ' km'], ...legs.map((l, i) => [`${i + 1}. ${l.from} → ${l.to}`, `${km(l.reading)} km · +${km(l.reading - legPrev(i))} km`]), ['Closing odometer', closeNum ? km(closeNum) + ' km' : ''], ['Trip distance', odo ? km(odo) + ' km' : ''], ['Variance vs fixed', fixed ? pct + '%' : 'Not applicable', flagged]]),
      sumSec('Billing', [['Loading invoice', cf.invoice], ['LR number', cf.lr], ['Loading qty', cf.qtyLoad], ['Unloading qty', cf.qtyUnload]]),
      sumSec('Diesel', [...fills.map(x => [x.bunk, `${km(x.litres)} L × ₹${Number(x.rate).toFixed(2)} = ${money0(x.litres * x.rate)}`]), ['Total diesel', dieselLitres ? `${km(dieselLitres)} L · ${money0(dieselTotal)}` : '']]),
      sumSec('Expenses', [['Total expense', cf.totalExpense ? money0(Number(cf.totalExpense)) : ''], ['Remarks', (cf.remarks || '').trim()]])
    ];
    const closePhotos = legs.filter(l => l.photo).map((l, i) => ({ caption: `${i + 1}. ${l.to} · ${km(l.reading)} km`, url: l.photo.url || '' }));
    // Unclosed
    const activeD = this.active().map(t => this.decorate(t));
    const unclosedList = s.forceEmpty ? [] : activeD;
    // Attendance
    const attDrivers = branchDrv.filter(d => d.approval === 'Approved').map(d => { const v = s.att[d.id] || ''; const onTrip = activeDrv.has(d.id); return { id: d.id, name: d.name, sub: onTrip ? 'On trip · marked present automatically' : d.type + (d.status === 'Inactive' ? ' · inactive' : ''), pBorder: v === 'P' ? 'var(--color-brand)' : 'var(--border-strong)', pBg: v === 'P' ? 'var(--color-brand)' : '#fff', pFg: v === 'P' ? '#fff' : 'var(--text-heading)', aBorder: v === 'A' ? 'var(--kr-red-600)' : 'var(--border-strong)', aBg: v === 'A' ? 'var(--kr-red-600)' : '#fff', aFg: v === 'A' ? '#fff' : 'var(--text-heading)' }; });
    const attendanceMarked = attDrivers.filter(d => s.att[d.id]).length, attendanceTotal = attDrivers.length;
    // Attendance · mark by vehicle — vehicle and driver lists come from the admin masters
    const am = s.am, amVeh = T.V[am.vehicle], amDrv = this.drv(am.driver);
    const amDriverList = branchDrv.filter(d => d.approval === 'Approved');
    const amUsedVeh = new Set(amDriverList.filter(d => s.att[d.id] === 'P' && s.attVeh[d.id]).map(d => s.attVeh[d.id]));
    const amFreeVeh = branchVeh.filter(v => !amUsedVeh.has(v.id) || v.id === am.vehicle);
    const amVehicleOptions = amFreeVeh.map(v => ({ value: v.id, label: `${v.number} · ${v.type}` }));
    const amDriverOptions = amDriverList.filter(d => !s.att[d.id] || d.id === am.driver).map(d => ({ value: d.id, label: `${d.name} · ${d.type}${d.status === 'Inactive' ? ' · inactive' : ''}` }));
    const amMappedDrv = amVeh && amVeh.driver ? this.drv(amVeh.driver) : null;
    const amVehicleHint = amVeh ? `${amVeh.type} · ${amVeh.status === 'Running' ? 'on trip' : String(amVeh.status || '').toLowerCase()}${amVeh.route ? ' · ' + amVeh.route : ''}.` : amUsedVeh.size ? `${amFreeVeh.length} of ${branchVeh.length} ${me.branch} vehicles free. ${amUsedVeh.size} already marked today are hidden.` : `${branchVeh.length} ${me.branch} vehicles from the admin vehicle master.`;
    // Vehicle status: Idle or Maintenance; a vehicle that is on a trip can also be recorded as On trip
    // Same vehicle statuses as the Admin Portal Vehicle Master.
    const amStatusOptions = ['Idle', 'Running', 'Maintenance', 'Inactive'].map(x => ({ value: x, label: x }));
    const amStatusHint = amVeh && amDrv ? `Choose the status of ${amVeh.number} to add ${amDrv.name} to today’s attendance.` : 'Idle, running, under maintenance or inactive. The driver is added once vehicle, driver and status are chosen.';
    const vehStatusOf = id => s.attVehStatus[id] || ((T.V[s.attVeh[id]] || {}).status === 'Running' ? 'On trip' : 'Not set');
    const amDriverHint = amVeh && !amDrv ? `Pick the driver for ${amVeh.number}${amMappedDrv ? ` (mapped: ${amMappedDrv.name})` : ''}, then the vehicle status.`
      : amVeh && amDrv ? `${amDrv.name} will be marked present on ${amVeh.number} once you choose the vehicle status.`
      : amDrv && !amVeh ? `Pick the vehicle for ${amDrv.name} to mark them present.`
      : `${amDriverOptions.length} of ${amDriverList.length} approved ${me.branch} drivers not marked yet. Pick a vehicle, driver and vehicle status to mark the driver present.`;
    // Marked attendance tab · saved days, newest first
    const now = new Date(), p2 = n => String(n).padStart(2, '0');
    const TODAY_DAY = `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())}`;
    const todayLabel = `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()]}, ${p2(now.getDate())} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()]} ${now.getFullYear()}`;
    const todayEntries = Object.fromEntries(amDriverList.filter(d => s.att[d.id]).map(d => [d.id, [s.att[d.id], s.att[d.id] === 'P' ? (s.attVeh[d.id] || '') : '', s.att[d.id] === 'P' ? (s.attVehStatus[d.id] || '') : '']]));
    const savedToday = s.attSaved.find(r => r.day === TODAY_DAY);
    const attUnsaved = Object.keys(todayEntries).length > 0 && JSON.stringify(todayEntries) !== JSON.stringify(savedToday ? savedToday.entries : null);
    const savedSorted = [...s.attSaved].sort((a, b) => b.day.localeCompare(a.day));
    const openDay = s.attOpenDay === undefined || s.attOpenDay === '' ? (savedSorted[0] || {}).day : s.attOpenDay;
    const savedDays = savedSorted.map(r => {
      const rows = amDriverList.map(d => { const [st = '', veh = ''] = r.entries[d.id] || []; return { name: d.name, vehicle: veh ? (T.V[veh] || {}).number : st === 'P' ? 'No vehicle' : '—', badge: st === 'P' ? 'Present' : st === 'A' ? 'Absent' : 'Not marked', badgeBg: this.statusTone(st === 'P' ? 'Present' : st === 'A' ? 'Absent' : 'Not marked')[0], badgeFg: this.statusTone(st === 'P' ? 'Present' : st === 'A' ? 'Absent' : 'Not marked')[1] }; });
      const present = rows.filter(x => x.badge === 'Present').length, absent = rows.filter(x => x.badge === 'Absent').length, unmarked = rows.length - present - absent;
      const open = openDay === r.day, isToday = r.day === TODAY_DAY;
      return { day: r.day, label: r.label, isToday, savedLine: `Saved at ${r.savedAt} by ${me.name}`, present, absent, unmarked: unmarked || false, rows, open, expanded: open ? 'true' : 'false', rot: open ? '180deg' : '0deg', edge: unmarked ? 'var(--color-hazard)' : 'var(--color-brand)' };
    });
    const amRows = amDriverList.filter(d => s.att[d.id]).map((d, i) => { const v = s.att[d.id], vn = (T.V[s.attVeh[d.id]] || {}).number;
      const vs = vehStatusOf(d.id), [vsBg, vsFg] = this.statusTone(vs);
      return { id: d.id, sno: i + 1, name: d.name, vehicle: vn || (v === 'A' ? '—' : 'No vehicle'), vehStatus: vs, vsBg, vsFg, badge: v === 'P' ? 'Present' : 'Absent', badgeBg: this.statusTone(v === 'P' ? 'Present' : 'Absent')[0], badgeFg: this.statusTone(v === 'P' ? 'Present' : 'Absent')[1], bg: v === 'P' ? 'var(--color-brand-tint)' : '#fff', removeLabel: `Remove ${d.name}` }; });
    // Vehicle idle status
    const activeByVeh = Object.fromEntries(this.active().map(t => [t.vehicle, t]));
    const idleRows = branchVeh.map(v => {
      const trip = activeByVeh[v.id], running = !!trip, r = s.idle[v.id] || {}, on = !running && !!r.on;
      const missingReason = on && (!r.reason || (r.reason === 'Other' && !r.note));
      const over = on && r.hours > 24;
      const setIdle = patch => this.setState(st => ({ idle: { ...st.idle, [v.id]: { ...(st.idle[v.id] || {}), ...patch } } }));
      return { id: v.id, number: v.number, running, on, canMark: !running, missingReason,
        sub: running ? `${v.type} · ${trip.number}` : `${v.type} · ${v.route}`,
        reason: r.reason || '', note: r.note || '', isOther: r.reason === 'Other',
        reasonErr: s.showIdleErrors && on && !r.reason, noteErr: s.showIdleErrors && on && r.reason === 'Other' && !r.note ? 'Required when the reason is Other.' : undefined,
        sinceText: r.since ? `Idle since ${r.since} · ${r.hours} h` + (over ? ' · over the 24 h idle limit' : '') : `Idle from ${pd(TD.getHours())}:${pd(TD.getMinutes())} once saved`,
        sinceColor: over ? '#7A4300' : 'var(--text-muted)',
        edge: running ? 'var(--st-enroute-edge)' : on ? 'var(--st-long-edge)' : 'var(--border-default)', bg: running ? 'var(--surface-muted)' : '#fff',
        tLabel: on ? 'Idle' : 'Mark idle', tBorder: on ? 'var(--color-hazard)' : 'var(--border-strong)', tBg: on ? 'var(--color-hazard)' : '#fff', tFg: on ? 'var(--kr-steel-900)' : 'var(--text-heading)',
        setReason: e => setIdle({ reason: e.target.value }), setNote: e => setIdle({ note: e.target.value }) };
    });
    const idleStats = { idle: idleRows.filter(v => v.on).length, running: idleRows.filter(v => v.running).length, ready: idleRows.filter(v => !v.on && !v.running).length };
    const idleMissing = idleRows.filter(v => v.missingReason).length;
    const idleFilt = s.idleFilter;
    const idleVehicles = idleRows.filter(v => idleFilt === 'all' || (idleFilt === 'idle' && v.on) || (idleFilt === 'missing' && v.missingReason));
    const idleFilters = [['all', `All (${idleRows.length})`], ['idle', `Idle (${idleStats.idle})`], ['missing', `Reason missing (${idleMissing})`]].map(([id, label]) => { const a = id === idleFilt; return { id, label, border: a ? 'var(--color-brand)' : 'var(--border-strong)', bg: a ? 'var(--color-brand)' : '#fff', color: a ? '#fff' : 'var(--text-heading)' }; });
    const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    const missing = [2, 7, 9]; const monthCells = [];
    for (let i = 0; i < 1; i++) monthCells.push({ day: 0, label: '', bg: 'transparent', fg: 'transparent', border: 'transparent', cursor: 'default' });
    for (let d = 1; d <= 30; d++) { const past = d < 14, today = d === 14, miss = missing.includes(d); monthCells.push({ day: d, label: String(d), cursor: d <= 14 ? 'pointer' : 'default', bg: today ? '#fff' : miss ? 'var(--color-hazard)' : past ? 'var(--color-brand)' : 'var(--kr-grey-100)', fg: today ? 'var(--color-brand)' : past ? '#fff' : 'var(--text-muted)', border: today ? 'var(--color-brand)' : 'transparent' }); }
    const gpsState = s.gpsGranted ? (selTrip.flags || []).includes('GPS failed') && s.screen === 'trip' ? ['GPS failed', 'var(--kr-red-600)'] : ['GPS on', 'var(--kr-green-600)'] : ['GPS off', 'var(--kr-red-600)'];
    // Notifications page · Head Office messages and actions, system alerts, and your own activity
    const NK = {
      message: { label: 'Head Office message', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', bg: 'var(--color-brand-tint)', fg: 'var(--kr-green-800)', edge: 'var(--color-brand)' },
      action: { label: 'Head Office action', icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11', bg: 'var(--kr-grey-100)', fg: 'var(--kr-grey-700)', edge: 'var(--kr-grey-500)' },
      alert: { label: 'Alert', icon: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01', bg: 'var(--color-hazard-soft)', fg: '#7A4300', edge: 'var(--color-hazard)' },
      activity: { label: 'Your activity', icon: 'M22 12h-4l-3 9L9 3l-3 9H2', bg: 'var(--surface-muted)', fg: 'var(--text-muted)', edge: 'var(--border-default)' }
    };
    const noticeAt = sort => { const [d, hm = ''] = String(sort || '').split(' '); const [y, m, dd] = d.split('-'); return m ? `${Number(dd)} ${MON[Number(m) - 1]} ${hm.slice(0, 5)}` : ''; };
    const noticeAtLong = sort => { const [d, hm = ''] = String(sort || '').split(' '); const [y, m, dd] = d.split('-'); return m ? `${Number(dd)} ${MON[Number(m) - 1]} ${y}, ${hm.slice(0, 5)}` : ''; };
    const alertItems = [
      ...activeD.filter(t => isPendingClose(t)).map(t => ({ id: `al-pendclose-${t.id}`, kind: 'alert', from: 'TMS alerts', sort: todayIso + ' 09:45', title: `Trip completed · not closed · ${t.vehicleNumber}`, body: `${t.number} has reached the customer but is still open — ${pendingCloseDetail(t)}. File the closing entry so Head Office can bill the trip.`, rows: [['Trip', t.number], ['Vehicle', t.vehicleNumber], ['Driver', t.driverName], ['Route', t.routeLine], ['Opened', t.opened], ['Why', pendingCloseDetail(t)]], link: { trip: t.id }, linkLabel: 'Close trip' })),
      ...activeD.filter(t => t.hoursOpen > 24 && !isPendingClose(t)).map(t => ({ id: `al-long-${t.id}`, kind: 'alert', from: 'TMS alerts', sort: todayIso + ' 09:30', title: `Long open trip · ${t.vehicleNumber}`, body: `${t.number} has been open ${t.hoursOpen} h against an expected ${t.expectedHours} h. Close it once unloading is done, or Head Office is alerted.`, rows: [['Trip', t.number], ['Vehicle', t.vehicleNumber], ['Driver', t.driverName], ['Route', t.routeLine], ['Opened', t.opened], ['Open for', `${t.hoursOpen} h · expected ${t.expectedHours} h`]], link: { trip: t.id }, linkLabel: 'View trip' })),
      ...(attendanceMarked < attendanceTotal ? [{ id: 'al-att-' + todayIso, kind: 'alert', from: 'TMS alerts', sort: todayIso + ' 09:00', title: 'Attendance pending for today', body: `${attendanceTotal - attendanceMarked} of ${attendanceTotal} drivers are not marked for ${todayDM}. Missing attendance is reported to Head Office after 48 hours.`, rows: [['Marked', attDrivers.filter(d => s.att[d.id]).map(d => d.name).join(', ') || 'None yet'], ['Not marked', attDrivers.filter(d => !s.att[d.id]).map(d => d.name).join(', ')], ['Date', prettyDay(todayIso)]], link: { screen: 'attMark' }, linkLabel: 'Mark attendance' }] : []),
      ...(idleMissing ? [{ id: 'al-idle-' + todayIso, kind: 'alert', from: 'TMS alerts', sort: todayIso + ' 08:30', title: 'Idle reason missing', body: `${idleMissing} idle ${idleMissing === 1 ? 'vehicle has' : 'vehicles have'} no reason recorded. Head Office uses the reason to plan loads and maintenance.`, rows: idleRows.filter(v => v.missingReason).map(v => [v.number, v.sinceText]), link: { screen: 'idle' }, linkLabel: 'Record idle reasons' }] : [])
    ];
    const notifAll = [...(T.supervisorNotices || []).filter(n => n.branch === this.BR || n.branch === 'all'), ...s.adminNotices, ...alertItems, ...s.activity]
      .map(n => { const k = NK[n.kind] || NK.message, unread = n.kind !== 'activity' && !s.notifRead.includes(n.id);
        return { ...n, kindLabel: k.label, icon: k.icon, iconBg: k.bg, iconFg: k.fg, unread, edge: unread ? k.edge : 'var(--border-default)', bg: '#fff', weight: unread ? 800 : 600,
          from: n.from || 'Head Office Admin', at: noticeAt(n.sort), atLong: noticeAtLong(n.sort), urgent: n.priority === 'Urgent',
          rowList: (n.rows || []).map(([k2, v]) => ({ k: k2, v: v || '—' })), hasRows: !!(n.rows && n.rows.length), hasNote: !!n.note, hasLink: !!n.link, canUnread: n.kind !== 'activity' }; })
      .sort((a, b) => String(b.sort).localeCompare(String(a.sort)));
    const notifGroups = { all: () => true, office: n => n.kind === 'message' || n.kind === 'action', alert: n => n.kind === 'alert', activity: n => n.kind === 'activity' };
    const notifShown = notifAll.filter(notifGroups[s.notifFilter] || notifGroups.all);
    const notifUnread = notifAll.filter(n => n.unread).length;
    const nd = notifAll.find(n => n.id === s.notifSel) || notifAll[0] || { rowList: [], title: '', body: '', icon: '' };
    const goOpen = () => s.gpsGranted ? this.go('open', { showErrors: false, form: this.blankForm(), railVariant: '', resumeOpen: null, unclosedAlert: null }) : this.go('gpsPerm');
    // Temporarily hidden attendance tabs — remove ids from this list to bring them back.
    const HIDDEN_ATT_TABS = ['marked'];
    // Temporarily hidden: Month view link on attendance — set to true to bring it back.
    const SHOW_ATT_MONTH = false;
    return {
      isLogin, isApp, is, authToast: isAuth && s.toast,
      obSteps: [0, 1, 2].map(i => ({ bg: i <= obStepIdx ? 'var(--color-brand)' : 'var(--kr-grey-200)' })),
      ob, obPhoneText, 
      obEditable: s.obStatus === 'idle' || s.obStatus === 'rejected', obSending: s.obStatus === 'sending', obWaiting: s.obStatus === 'waiting', obRejected: s.obStatus === 'rejected',
      obRequestedAt: ob.requestedAt || '—', obPhoneErr: s.obShowErr && obDigits.length !== 10 ? 'Enter a 10-digit mobile number.' : undefined,
      obNameErr: s.obShowErr && !ob.name.trim() ? 'Enter your full name.' : undefined,
      setObName: e => { const v = e.target.value.slice(0, 60); this.setState(st => ({ ob: { ...st.ob, name: v } })); },
      setObPhone: e => { const v = e.target.value.replace(/[^\d ]/g, '').slice(0, 11); this.setState(st => ({ ob: { ...st.ob, phone: v } })); },
      requestApproval: () => {
        if (obDigits.length !== 10 || !ob.name.trim()) { this.setState({ obShowErr: true, railVariant: 'error' }); return; }
        this.setState({ obStatus: 'sending', obShowErr: false });
        setTimeout(() => {
          const imei = this.deviceImei(), requestedAt = this.nowText();
          const req = { id: 'AR' + Date.now(), name: ob.name.trim(), phone: obDigits, imei, device: 'Android phone', branchId: '', branch: '', requestedAt, status: 'Pending', otp: '' };
          this.writeReqs([req, ...this.readReqs().filter(r => !(r.imei === imei && r.status === 'Pending'))]);
          this.pushAdminNotif({
            title: 'Driver Request',
            body: `${ob.name.trim()} (+91 ${obPhoneText}) requested device login approval.`,
            time: 'Just now'
          });
          this.setState(st => ({ obStatus: 'waiting', obReqId: req.id, railVariant: '', ob: { ...st.ob, requestedAt } }));
          this.toast('success', 'Approval requested', 'Head Office has been notified. You will get an OTP once approved.');
        }, 900);
      },
      cancelApproval: () => { if (s.obReqId) this.writeReqs(this.readReqs().filter(r => r.id !== s.obReqId)); this.setState({ obStatus: 'idle', obReqId: '', railVariant: '' }); },
      restartApproval: () => { if (s.obReqId && s.obStatus === 'waiting') this.writeReqs(this.readReqs().filter(r => r.id !== s.obReqId)); this.setState({ screen: 'approval', history: [], obStatus: 'idle', obReqId: '', obShowErr: false, obOtpErr: '', railVariant: '', ob: { ...s.ob, otp: ['', '', '', ''], expected: '', shared: false } }); },
      goLogin: () => this.setState({ screen: 'login', history: [], loginState: 'idle', railVariant: '' }),
      obOtpShared: ob.shared, obOtpErr: s.obOtpErr,
      otpBoxes: ob.otp.map((v, i) => ({ i, v, label: `OTP digit ${i + 1}`, border: otpBad ? 'var(--status-danger)' : v ? 'var(--color-brand)' : 'var(--border-strong)', bg: v && !otpBad ? 'var(--color-brand-tint)' : '#fff' })),
      selectAll: e => e.target.select(),
      setOtpDigit: e => {
        const i = Number(e.target.dataset.i), raw = e.target.value.replace(/\D/g, '');
        const inputs = e.target.closest('[data-otp-group]').querySelectorAll('input');
        const otp = [...this.state.ob.otp];
        if (raw.length > 1) { raw.slice(0, 4 - i).split('').forEach((c, k) => { otp[i + k] = c; }); } else otp[i] = raw;
        this.setState(st => ({ ob: { ...st.ob, otp, shared: false }, obOtpErr: '' }));
        const next = raw ? Math.min(3, i + Math.max(1, raw.length)) : i;
        if (raw && inputs[next] && next !== i) inputs[next].focus();
      },
      otpKey: e => { const i = Number(e.target.dataset.i); if (e.key === 'Backspace' && !e.target.value && i > 0) e.target.closest('[data-otp-group]').querySelectorAll('input')[i - 1].focus(); },
      verifyOtp: () => {
        const code = ob.otp.join('');
        if (code.length < 4) { this.setState({ obOtpErr: 'Enter all 4 digits of the OTP.', railVariant: 'error' }); return; }
        const live = s.obReqId ? (this.readReqs().find(r => r.id === s.obReqId) || {}).otp : '';
        if (code !== (live || ob.expected)) { this.setState({ obOtpErr: 'That OTP does not match. Check the code Head Office shared.', railVariant: 'error' }); return; }
        if (s.obReqId) this.patchReq(s.obReqId, { status: 'Verified', verifiedAt: this.nowText() });
        this.setState({ screen: 'register', history: [], obOtpErr: '', railVariant: '', regShowErr: false, reg: { name: ob.name || '', password: '' } });
        this.toast('success', 'OTP verified', 'Create your account to finish.');
      },
      reg: s.reg, regErr: s.regShowErr ? regBad : {}, regSaving: s.regSaving, regIdle: !s.regSaving,
      regPasswordHint: s.reg.password && s.reg.password.length < 6 ? `${6 - s.reg.password.length} more characters needed.` : 'At least 6 characters.',
      setRegName: e => this.set(['reg', 'name'], e.target.value), setRegPassword: e => this.set(['reg', 'password'], e.target.value),
      doRegister: () => {
        if (regBad.name || regBad.password) { this.setState({ regShowErr: true, railVariant: 'errors' }); return; }
        this.setState({ regSaving: true });
        setTimeout(() => {
          const account = { name: s.reg.name.trim(), phone: obDigits };
          if (s.obReqId) this.patchReq(s.obReqId, { status: 'Registered', name: account.name, registeredAt: this.nowText() });
          this.updateSupervisorRecord(obDigits, { name: account.name, password: s.reg.password, lastLogin: 'Just registered' });
          this.setState({ regSaving: false, account, screen: 'login', history: [], loginState: 'idle', loginPhone: null, loginPassword: null, loginErr: '', railVariant: '', obStatus: 'idle', obReqId: '', reg: { name: '', password: '' } });
          this.toast('success', 'Registration complete', `Welcome, ${account.name}. Sign in with +91 ${obPhoneText}.`);
        }, 900);
      },
      supName: me.name, branchName: me.branch, todayLong, todayDM, monthLabel: `${MONTH_FULL[TD.getMonth()]} ${TD.getFullYear()}`, nowHM: `${pd(TD.getHours())}:${pd(TD.getMinutes())}`, loginPhone, loginPassword,
      setLoginPhone: e => { const d = e.target.value.replace(/\D/g, '').slice(0, 10); this.setState({ loginPhone: d.length > 5 ? d.slice(0, 5) + ' ' + d.slice(5) : d, loginErr: '' }); },
      setLoginPassword: e => this.setState({ loginPassword: e.target.value, loginErr: '' }),
      title: titles[s.screen] || '', showBack: s.screen !== 'home',
      loginError: !!s.loginErr, loginErrText: s.loginErr, loginLoading: s.loginState === 'loading', loginIdle: s.loginState !== 'loading',
      doLogin: () => {
        const phone = loginPhone.replace(/\D/g, '');
        if (phone.length !== 10) { this.setState({ loginErr: 'Enter your 10 digit mobile number.' }); return; }
        if (!loginPassword) { this.setState({ loginErr: 'Enter your password.' }); return; }
        this.setState({ loginState: 'loading', loginErr: '' });
        setTimeout(() => {
          const sup = this.findSupervisorByPhone(phone);
          const err = !sup ? 'This mobile number is not a registered supervisor. Request device approval first.'
            : sup.status === 'Inactive' ? 'This supervisor account is inactive. Contact Head Office.'
            : loginPassword !== (sup.password || this.DEMO_PASSWORD) ? 'Incorrect mobile number or password.' : '';
          if (err) { this.setState({ loginState: 'idle', loginErr: err }); return; }
          this.updateSupervisorRecord(phone, { lastLogin: this.nowText() });
          // Branch-scoped data was loaded for the previous branch; reload it for this supervisor's branch.
          this._drvJson = undefined; this._noticeJson = undefined;
          this.setState({ loginState: 'idle', loginErr: '', loginPassword: null, supId: sup.id, branchId: sup.branch || 'B01', screen: 'home', history: [], activity: [] },
            () => { this.syncDriverReqs(); this.syncNotices(); this.loadAttSaved(); });
        }, 900);
      },
      loginFail: () => this.toast('info', 'Forgot password', 'Ask Head Office to reset your password, then sign in again.'),
      gpsLabel: gpsState[0], gpsColor: gpsState[1],
      bigBtn: { height: 56, fontSize: 17 }, selNarrow: { width: 170 }, toastStyle: { width: '100%' },
      activeCount: activeD.length, tripWord: activeD.length === 1 ? 'trip' : 'trips', unclosedHint: activeD.some(t => t.hoursOpen > 24) ? 'One trip has been open more than 24 h.' : 'Trips waiting to be closed.', unclosedCountColor: activeD.some(t => t.hoursOpen > 24) ? 'var(--kr-saffron-600)' : 'var(--color-brand)',
      attendanceTotal, attendanceMarked, attendancePct: Math.round(attendanceMarked / Math.max(1, attendanceTotal) * 100) + '%',
      goHome: () => this.setState({ screen: 'home', history: [], notifOpen: false, railVariant: '' }), goOpen, goCloseList: () => this.go('closeList', { railVariant: '' }), goUnclosed: () => this.go('unclosed', { forceEmpty: false, railVariant: '' }), goAttendance: () => this.go('attendance', { railVariant: '' }), goAttMonth: () => this.go('attMonth', { railVariant: '' }), goAttMark: () => this.go('attMark', { railVariant: '', am: { vehicle: '', driver: '', status: '' }, attTab: 'mark', attOpenDay: '' }),
      back: () => this.setState(st => { const h = [...st.history]; const prev = h.pop() || 'home'; return { screen: prev, history: h, railVariant: '' }; }),
      stop: e => e.stopPropagation(),
      notifShown, notifTotal: notifAll.length, notifUnread, notifHasUnread: notifUnread > 0, nd,
      bellLabel: notifUnread ? `Notifications, ${notifUnread} unread` : 'Notifications', bellBg: ['notifications', 'notifDetail'].includes(s.screen) ? 'var(--surface-muted)' : 'transparent',
      notifShownEmpty: !notifShown.length,
      notifEmptyTitle: s.notifFilter === 'activity' ? 'No activity yet' : s.notifFilter === 'alert' ? 'No alerts' : 'Nothing here yet',
      notifEmptyText: s.notifFilter === 'activity' ? 'Trips you open or close, attendance and idle status you save appear here.' : s.notifFilter === 'alert' ? 'Long open trips, pending attendance and missing idle reasons show up here.' : 'Messages and updates from Head Office appear here.',
      notifFilters: [['all', 'All', notifAll.length], ['office', 'Head Office', notifAll.filter(notifGroups.office).length], ['alert', 'Alerts', notifAll.filter(notifGroups.alert).length], ['activity', 'My activity', notifAll.filter(notifGroups.activity).length]].map(([id, label, n]) => { const on = s.notifFilter === id; return { id, label: `${label} (${n})`, on: on ? 'true' : 'false', border: on ? 'var(--color-brand)' : 'var(--border-strong)', bg: on ? 'var(--color-brand)' : '#fff', color: on ? '#fff' : 'var(--text-heading)' }; }),
      goNotifications: () => (s.screen === 'notifications' ? null : this.go('notifications', { railVariant: '' })),
      setNotifFilter: e => this.setState({ notifFilter: e.currentTarget.dataset.f, railVariant: '' }),
      openNotif: e => { const id = e.currentTarget.dataset.id; this.setState(st => ({ notifRead: st.notifRead.includes(id) ? st.notifRead : [...st.notifRead, id] })); this.go('notifDetail', { notifSel: id, railVariant: '' }); },
      markAllRead: () => this.setState(st => ({ notifRead: [...new Set([...st.notifRead, ...notifAll.map(n => n.id)])] })),
      markNotifUnread: () => { this.setState(st => { const h = [...st.history]; const prev = h.pop() || 'notifications'; return { notifRead: st.notifRead.filter(x => x !== nd.id), screen: prev, history: h, railVariant: '' }; }); },
      openNotifLink: () => {
        const l = nd.link || {};
        if (l.trip) { const tr = this.allTrips().find(x => x.id === l.trip); const closed = tr && (tr.status === 'Closed' || s.closedIds.includes(tr.id)); return closed ? this.go('histTrip', { histSel: l.trip, railVariant: '' }) : this.go('trip', { selected: l.trip, railVariant: '' }); }
        if (l.screen === 'attMark') return this.go('attMark', { railVariant: '', am: { vehicle: '', driver: '', status: '' }, attTab: 'mark' });
        if (l.screen === 'idle') return this.go('idle', { railVariant: '', showIdleErrors: false });
        if (l.screen) this.go(l.screen, { railVariant: '' });
      },
      // open trip
      form: { ...f, startKm: startKmVal, driver: driverVal }, clientOptions, vehicleOptions, locationOptions, remarksCount: (f.remarks || '').length,
      clientHint: !needsLoad ? 'Non-business movement has no client, so this list is empty.' : f.client ? `${clientCust.length} predefined ${clientCust.length === 1 ? 'customer' : 'customers'} · ${mappedVeh.length} ${me.branch} ${mappedVeh.length === 1 ? 'vehicle' : 'vehicles'} mapped to this client.` : `${myClients.length} clients are mapped to you. One vehicle can run for several clients.`,
      vehicleHint: veh && (s.idle[veh.id] || {}).on ? `Marked idle${s.idle[veh.id].reason ? ': ' + s.idle[veh.id].reason : ''}. Opening this trip clears the idle record.` : (f.client ? `${availVeh.length} of ${mappedVeh.length} vehicles mapped to ${(T.C[f.client] || {}).name} are idle.` : `${availVeh.length} of ${branchVeh.length} ${me.branch} vehicles available.`) + (onTripVeh.length ? ` ${onTripVeh.map(v => v.number).join(', ')} ${onTripVeh.length === 1 ? 'has an unclosed trip' : 'have unclosed trips'}.` : '') + (busyVeh.length ? ` Hidden: ${busyVeh.join(', ')}.` : ''),
      loadingHint: 'Predefined points are geofenced to 100 m. Add a new point from where you are standing if it is missing.',
      dc, driverErrText, pickList, pickSub, pickEmpty: !pickList.length, drvPickOpen: s.drvPickOpen, customerOptions, hasCustomers: customerOptions.length > 0, noCustomers: !customerOptions.length,
      unloadCountLabel: !needsLoad ? 'Not needed' : !f.client ? 'Predefined per client' : unloadMode === 'single' ? `${clientCust.length} available` : picked.length ? `${picked.length} of ${clientCust.length} selected` : `Tick one or more · ${clientCust.length} available`,
      routeKnown: picked.length > 0, routeSummary, fullRow: { width: '100%' },
      // Unloading — Single: one customer from a dropdown. Multiple: tick several drops.
      unloadSingle: customerOptions.length > 0 && unloadMode === 'single', unloadMulti: customerOptions.length > 0 && unloadMode === 'multiple',
      unloadModeTabs: [['single', 'Single', 'One drop'], ['multiple', 'Multiple', 'Several drops']].map(([value, label, sub]) => { const on = unloadMode === value; return { value, label, sub, on: on ? 'true' : 'false', border: on ? 'var(--color-brand)' : 'var(--border-strong)', bg: on ? 'var(--color-brand)' : '#fff', fg: on ? '#fff' : 'var(--text-heading)' }; }),
      setUnloadMode: e => { const mode = e.currentTarget.dataset.v; this.setState(st => ({ form: { ...st.form, unloadMode: mode, unloading: mode === 'single' ? (st.form.unloading || []).slice(0, 1) : st.form.unloading } })); },
      singleCustOptions: customerOptions.map(c => ({ value: c.id, label: c.name })), singleCust: picked[0] || '',
      setSingleCust: e => this.set(['form', 'unloading'], e.target.value ? [e.target.value] : []),
      singleCustInfo: unloadMode === 'single' && picked[0] ? (customerOptions.find(c => c.id === picked[0]) || {}).sub : '',
      unloadErrText: unloadMode === 'single' ? 'Select the unloading customer.' : 'Tick at least one unloading customer.',
      setClient: e => { const client = e.target.value; this.setState(st => { const vv = T.V[st.form.vehicle] || {}, drop = client && st.form.vehicle && (vv.clients || []).length > 0 && !vv.clients.includes(client); return { form: { ...st.form, client, unloading: [], ...(drop ? { vehicle: '', driver: '', driverOk: false } : {}) } }; }); },
      setVehicle: e => { const vid = e.target.value, open = this.active().find(t => t.vehicle === vid); if (open) { this.setState({ unclosedAlert: { vehicle: vid, trip: open.id } }); return; } this.setState(st => ({ form: { ...st.form, vehicle: vid, driver: '', driverOk: false } })); }, setRemarks: e => this.set(['form', 'remarks'], e.target.value.slice(0, 250)), setStartKm: e => this.set(['form', 'startKm'], e.target.value), setReason: e => this.set(['form', 'reason'], e.target.value),
      setLoading: e => { if (e.target.value === '__add') { this.setState({ newLoc: { open: true, name: '' }, showNewLocErr: false }); return; } this.set(['form', 'loading'], e.target.value); },
      acceptDriver: () => this.setState(st => ({ form: { ...st.form, driver: driverVal, driverOk: true } })),
      rejectDriver: () => this.setState({ drvPickOpen: true }), openDrvPick: () => this.setState({ drvPickOpen: true }), closeDrvPick: () => this.setState({ drvPickOpen: false }),
      pickDriver: e => { const id = e.currentTarget.dataset.id; this.setState(st => ({ drvPickOpen: false, form: { ...st.form, driver: id, driverOk: true } })); },
      goReqDriverFromOpen: () => this.go('reqDriver', { drvPickOpen: false, reqFromOpen: true, rf: this.blankRf(), showReqErrors: false, railVariant: '' }),
      addLocOpen: s.newLoc.open, newLoc: s.newLoc, newLocErr: s.showNewLocErr && !s.newLoc.name.trim() ? 'Name the point so it can be reused.' : undefined,
      setNewLocName: e => this.set(['newLoc', 'name'], e.target.value),
      cancelNewLoc: () => this.setState({ newLoc: { open: false, name: '' }, showNewLocErr: false }),
      saveNewLoc: () => { const name = s.newLoc.name.trim(); if (!name) { this.setState({ showNewLocErr: true }); return; } const id = 'LX' + (s.addedLocations.length + 1); this.setState(st => ({ addedLocations: [...st.addedLocations, { id, name, branch: this.BR, address: 'GPS 13.0827, 80.2707', radius: 100, status: 'Active' }], form: { ...st.form, loading: id }, newLoc: { open: false, name: '' }, showNewLocErr: false })); this.toast('success', 'Loading point added', `${name} saved at 13.0827, 80.2707 with a 100 m radius.`); },
      setType: e => { const type = e.currentTarget.dataset.v; this.setState(st => ({ form: type === st.form.type ? st.form : { ...this.blankForm(), type }, showErrors: false, newLoc: { open: false, name: '' }, drvPickOpen: false })); },
      tripTypeTabs: ['Business', 'Non-Business'].map(x => { const on = f.type === x; return { value: x, label: x, on: on ? 'true' : 'false', border: on ? 'var(--color-brand)' : 'var(--border-strong)', bg: on ? 'var(--color-brand)' : '#fff', fg: on ? '#fff' : 'var(--text-heading)' }; }),
      clientOptionsShown: needsLoad ? clientOptions : [], clientPlaceholder: needsLoad ? 'Select client' : 'No client · non-business',
      unloadEmptyText: needsLoad ? 'Select a client first. Only that client’s predefined customers can be unloaded on this trip.' : 'No unloading for non-business movement.',
      startKmLocked, startKmHint, err, openHasErrors: openErrorCount > 0, openErrorCount, tripNumberPreview, tripNumberNote,
      tripNumberColor: veh ? 'var(--text-heading)' : 'var(--text-muted)',
      reviewNote: needsLoad ? 'Vehicle is idle with no active trip and is mapped to this client, the driver is free, loading and unloading points are geofenced, and start KM matches the last closing reading.' : 'Vehicle is idle with no active trip and the driver is free. No billing; GPS tracks the movement against the km entered.',
      isNonBusiness: f.type === 'Non-Business', isBusiness: f.type !== 'Non-Business',
      nbVehicleHint: veh ? `${veh.type} · last closing KM ${lastKm(veh).toLocaleString('en-IN')}.` : `${availVeh.length} of ${branchVeh.length} ${me.branch} vehicles from the admin vehicle master are free.`,
      setFrom: e => this.set(['form', 'from'], e.target.value), setTo: e => this.set(['form', 'to'], e.target.value), setKm: e => this.set(['form', 'km'], e.target.value.replace(/[^\d.]/g, '')),
      typeHint: f.type === 'Business' ? 'Billable movement. Invoice details are captured when the trip closes.' : f.type === 'Non-Business' ? 'No billing. Record where the vehicle is going and why.' : 'Every vehicle movement is recorded, billable or not.',
      reasonOptions: ['Maintenance', 'Internal Movement', 'Empty Return', 'Driver Testing'].map(x => ({ value: x, label: x })),
      reviewOpen: () => { const bad = Object.values(openBad).some(Boolean); if (bad) { this.setState({ showErrors: true, railVariant: 'errors' }); return; } this.go('openReview'); },
      askDiscard: () => this.setState({ discardOpen: true }), cancelDiscard: () => this.setState({ discardOpen: false }), confirmDiscard: () => this.setState({ discardOpen: false, screen: 'home', history: [], form: this.blankForm(), showErrors: false }),
      discardOpen: s.discardOpen, reviewRows, saving: s.saving, notSaving: !s.saving,
      confirmOpen: () => {
        this.setState({ saving: true });
        setTimeout(() => {
          const num = tripNumberPreview.replace(/\s/g, '');
          const t = { id: 'TN' + Date.now(), number: num, branch: this.BR, client: f.client, customers: picked, vehicle: f.vehicle, driver: driverVal, loading: needsLoad ? f.loading : '', unloading: needsLoad ? pickedCust.map(u => u.name).join(', ') : f.to, from: needsLoad ? '' : f.from, startKm: Number(startKmVal) || 0, type: f.type, reason: f.reason, remarks: needsLoad ? f.remarks : '', status: 'Enroute', opened: this.stampText(), supervisor: this.SUP, fixedKm: needsLoad ? routeKm : 0, nbKm: needsLoad ? 0 : Number(f.km) || 0, gpsKm: 0, hoursOpen: 0, flags: [] };
          try {
            const m = JSON.parse(localStorage.getItem(this.MASTER_KEY) || '{}') || {};
            const cur = m.trips || { added: [], edited: {} };
            m.trips = { ...cur, added: [t, ...(cur.added || [])] };
            localStorage.setItem(this.MASTER_KEY, JSON.stringify(m));
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new CustomEvent('tms-master-change', { detail: { key: 'trips' } }));
          } catch (e) {}
          this.setState(st => ({ saving: false, screen: 'openDone', localTrips: [...st.localTrips, t], newTrip: t, form: this.blankForm(), showErrors: false, idle: { ...st.idle, [f.vehicle]: { on: false, reason: '', note: '' } } }));
          this.toast('success', 'Trip saved', num + ' is enroute. GPS monitoring started.');
          this.logActivity({ title: `Trip opened · ${num}`, body: f.type === 'Non-Business' ? `${f.from} → ${f.to} · ${f.km} km · ${f.reason}. GPS monitoring started.` : `${(T.C[f.client] || {}).name} → ${pickedCust.map(u => u.name).join(', ')}. GPS monitoring started.`, rows: [['Trip', num], ['Trip type', f.type], ['Vehicle', (T.V[f.vehicle] || {}).number], ['Driver', (this.drv(driverVal) || {}).name], ['Status', ENROUTE_LABEL]], link: { trip: t.id }, linkLabel: 'View trip' });
          this.pushAdminNotif({ title: 'Trip Update', body: `Trip #${num} has been opened by ${me.name} (${me.branch}).`, time: 'Just now' });
        }, 1200);
      },
      newTripNumber: (s.newTrip || {}).number || tripNumberPreview, newTripVehicle: s.newTrip ? T.V[s.newTrip.vehicle].number : '',
      // close
      activeTrips: activeD, noActive: !activeD.length, pickClose: e => this.go('close', { selected: e.currentTarget.dataset.id, showCloseErrors: false, cf: this.blankClose() }),
      sel: selD, selLongOpen: selD.hoursOpen > 24, selRows, gpsLog: T.gpsLog,
      cf: { ...cf, legDraft: ld }, setCf: this.bind('cf', ['invoice', 'lr', 'qtyLoad', 'qtyUnload']), cerr,
      closeHasErrors: Object.values(cerr).some(Boolean), closeManualException: (selTrip.flags || []).includes('GPS weak') || (selTrip.flags || []).includes('GPS failed'),
      // odometer readings
      pointOptions, legErr, legBox: { border: cerr.legs ? 'var(--status-danger)' : 'var(--border-default)' },
      legCards: legs.map((l, i) => ({ i, title: `Reading ${i + 1}`, route: `${l.from} → ${l.to}`, reading: `${km(l.reading)} km`, km: `+${km(l.reading - legPrev(i))} km`, url: (l.photo && l.photo.url) || '', noPhoto: !(l.photo && l.photo.url), bg: legEditing && cf.legEdit === i ? 'var(--color-brand-tint)' : '#fff' })),
      legSummary: legs.length ? { close: km(closeNum) + ' km', dist: `Trip distance ${km(closeNum - startNum)} km from start ${km(startNum)}` } : false,
      legEditorOpen, legAddShown: !legEditorOpen, legCanCancel: legs.length > 0, legEditorTitle: legEditing ? `Edit reading ${cf.legEdit + 1}` : `Reading ${legs.length + 1}`, legSaveLabel: legEditing ? 'Save changes' : 'Add reading',
      legPrevText: km(ldPrev), legReadingHint: ld.reading && !legBad.reading ? `+${km(ldNum - ldPrev)} km on this leg.` : `Previous reading ${km(ldPrev)} km${di === 0 ? ' (start KM)' : ''}.`,
      legPhotoEmpty: !ld.photo, legPhotoSet: !!ld.photo, legPhoto: ld.photo || {}, legPhotoBorder: legErr.photo ? 'var(--status-danger)' : 'var(--border-strong)',
      setLegFrom: e => this.patchCf({ legDraft: { ...ld, from: e.target.value } }), setLegTo: e => this.patchCf({ legDraft: { ...ld, to: e.target.value } }),
      setLegReading: e => this.patchCf({ legDraft: { ...ld, reading: e.target.value.replace(/\D/g, '').slice(0, 9) } }),
      pickLegPhoto: e => { const file = e.target.files && e.target.files[0]; e.target.value = ''; if (!file) return; if (!/^image\//.test(file.type)) { this.toast('warning', 'Not an image', 'Take a photo of the odometer.'); return; }
        const kb = file.size / 1024, size = kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(kb)) + ' KB';
        this.shrinkImage(file).then(url => this.setState(st => ({ cf: { ...st.cf, legDraft: { ...st.cf.legDraft, from: st.cf.legDraft.from || ld.from, to: st.cf.legDraft.to || ld.to, photo: { name: file.name, size, url } } } }))); },
      clearLegPhoto: () => this.patchCf({ legDraft: { ...ld, photo: null } }),
      saveLeg: () => { if (Object.values(legBad).some(Boolean)) { this.patchCf({ legTried: true }); return; } const leg = { from: ld.from, to: ld.to, reading: String(ldNum), photo: ld.photo };
        this.patchCf({ legs: legEditing ? legs.map((x, j) => j === cf.legEdit ? leg : x) : [...legs, leg], legDraft: this.blankLeg(), legEdit: -1, legOpen: false, legTried: false }); },
      cancelLeg: () => this.patchCf({ legDraft: this.blankLeg(), legEdit: -1, legOpen: false, legTried: false }),
      openLegEditor: () => this.patchCf({ legDraft: this.blankLeg(), legEdit: -1, legOpen: true, legTried: false }),
      editLeg: e => { const i = Number(e.currentTarget.dataset.i); this.patchCf({ legDraft: { ...legs[i] }, legEdit: i, legOpen: true, legTried: false }); },
      removeLeg: e => { const i = Number(e.currentTarget.dataset.i); this.patchCf({ legs: legs.filter((_, j) => j !== i), legDraft: this.blankLeg(), legEdit: -1, legOpen: false, legTried: false }); },
      // diesel bunks
      fillErr, fillBox: { border: cerr.fills ? 'var(--status-danger)' : 'var(--border-default)' },
      fillCards: fills.map((x, i) => ({ i, n: i + 1, bunk: x.bunk, line: `${km(x.litres)} L × ₹${Number(x.rate).toFixed(2)}/L = ${money0(x.litres * x.rate)}`, bg: overTank(x.litres) ? 'var(--kr-red-100)' : fillEditing && cf.fillEdit === i ? 'var(--color-brand-tint)' : '#fff', lineColor: overTank(x.litres) ? 'var(--kr-red-800)' : 'var(--text-body)' })),
      tankLabel: tank ? km(tank) + ' L' : '—', qtyHint: tank ? `Tank holds ${km(tank)} L` : undefined,
      fillEditorOpen, fillAddShown: !fillEditorOpen, fillCanCancel: fills.length > 0, fillEditorTitle: fillEditing ? `Edit bunk ${cf.fillEdit + 1}` : `Bunk ${fills.length + 1}`, fillSaveLabel: fillEditing ? 'Save changes' : 'Add bunk',
      authorizedBunkOptions,
      selectedBunkChoice: fd.bunkChoice || (routeAuthBunks.some(b => b.name === fd.bunk) ? fd.bunk : fd.bunk ? 'NEW_BUNK' : ''),
      selectBunkChoice: e => {
        const choice = e.target.value;
        if (choice === 'NEW_BUNK') {
          this.patchCf({ fillDraft: { ...fd, bunkChoice: 'NEW_BUNK', bunk: fd.customBunk || '' } });
        } else {
          const ref = routeAuthBunks.find(b => b.name === choice);
          this.patchCf({ fillDraft: { ...fd, bunkChoice: choice, bunk: choice, rate: ref && !fd.rate ? ref.rate.toFixed(2) : fd.rate } });
        }
      },
      setCustomBunkName: e => {
        const val = e.target.value;
        this.patchCf({ fillDraft: { ...fd, bunkChoice: 'NEW_BUNK', customBunk: val, bunk: val } });
      },
      fillBunkHint: fdRef ? `Authorized bunk · rate on record ₹${fdRef.rate.toFixed(2)}/L.` : 'Select from authorized bunks or request a new bunk.',
      fillDraftAmount: fdL && fdR ? money0(fdL * fdR) : '—',
      setFillBunk: e => { const bunk = e.target.value, ref = bunkList.find(b => b.name.toLowerCase() === bunk.trim().toLowerCase()); this.patchCf({ fillDraft: { ...fd, bunk, rate: ref && !fd.rate ? ref.rate.toFixed(2) : fd.rate } }); },
      setFillLitres: e => this.patchCf({ fillDraft: { ...fd, litres: e.target.value.replace(/[^\d.]/g, '') } }), setFillRate: e => this.patchCf({ fillDraft: { ...fd, rate: e.target.value.replace(/[^\d.]/g, '') } }),
      saveFill: () => {
        const finalBunkName = fd.bunkChoice === 'NEW_BUNK' ? (fd.customBunk || '').trim() : (fd.bunkChoice || fd.bunk).trim();
        if (Object.values(fillBad).some(Boolean) || !finalBunkName) { this.patchCf({ fillTried: true }); return; }
        
        const isCustom = fd.bunkChoice === 'NEW_BUNK' || !routeAuthBunks.some(b => b.name.toLowerCase() === finalBunkName.toLowerCase());
        if (isCustom && this.ctx?.requestNewBunk) {
          this.ctx.requestNewBunk({
            bunkName: finalBunkName,
            routeId: selRoute?.id,
            routeName: selRoute?.name || 'Route',
            tripId: selTrip.id,
            tripNumber: selD.number,
            supervisorName: (T.S[selTrip.supervisor] || {}).name || 'Supervisor',
            branch: selTrip.branch,
          });
        }

        const x = { bunk: finalBunkName, litres: String(fdL), rate: fdR.toFixed(2), isNewBunk: isCustom };
        this.patchCf({ fills: fillEditing ? fills.map((y, j) => j === cf.fillEdit ? x : y) : [...fills, x], fillDraft: this.blankFill(), fillEdit: -1, fillOpen: false, fillTried: false });
      },
      cancelFill: () => this.patchCf({ fillDraft: this.blankFill(), fillEdit: -1, fillOpen: false, fillTried: false }),
      openFillEditor: () => this.patchCf({ fillDraft: this.blankFill(), fillEdit: -1, fillOpen: true, fillTried: false }),
      editFill: e => { const i = Number(e.currentTarget.dataset.i); this.patchCf({ fillDraft: { ...fills[i] }, fillEdit: i, fillOpen: true, fillTried: false }); },
      removeFill: e => { const i = Number(e.currentTarget.dataset.i); this.patchCf({ fills: fills.filter((_, j) => j !== i), fillDraft: this.blankFill(), fillEdit: -1, fillOpen: false, fillTried: false }); },
      dieselAmount: dieselTotal ? money0(dieselTotal) : '—', dieselTotalLabel: fills.length > 1 ? `Diesel total · ${fills.length} bunks · ${km(dieselLitres)} L` : 'Diesel amount',
      // expense and remarks
      setTotalExpense: e => this.patchCf({ totalExpense: e.target.value.replace(/\D/g, '').slice(0, 8) }),
      totalExpenseHint: `Everything spent on this trip: diesel${dieselTotal ? ' (' + money0(dieselTotal) + ')' : ''}, toll, driver bata, loading charges.`,
      setCloseRemarks: e => this.patchCf({ remarks: e.target.value.slice(0, 250) }), closeRemarksCount: (cf.remarks || '').length,
      closeSummary, closePhotos, hasClosePhotos: closePhotos.length > 0,
      closeReviewHead: flagged ? `Variance ${pct}% will be flagged.` : 'Validation passed.',
      closeReviewNote: flagged ? `The odometer distance is outside 5% of the ${km(fixed)} km fixed route, so Head Office reviews it after you close.` : fixed ? `Odometer distance is within 5% of the ${km(fixed)} km fixed route.` : 'Non-business movement. No fixed route to check against.',
      submitClose: () => { if (Object.values(closeBad).some(Boolean)) { this.setState({ showCloseErrors: true, railVariant: 'errors' }); return; } this.go('closeReview', { railVariant: '' }); },
      confirmClose: () => {
        const rec = { invoice: cf.invoice, lr: cf.lr, closeKm: String(closeNum), bunk: fills.map(x => x.bunk).join(', '), litres: String(dieselLitres), rate: dieselLitres ? (dieselTotal / dieselLitres).toFixed(2) : '', fills, legs, totalExpense: cf.totalExpense, remarks: (cf.remarks || '').trim(), qtyLoad: cf.qtyLoad, qtyUnload: cf.qtyUnload, closedAt: this.stampText() };
        try {
          const m = JSON.parse(localStorage.getItem(this.MASTER_KEY) || '{}') || {};
          const cur = m.trips || { added: [], edited: {} };
          const closeNumVal = Number(rec.closeKm) || 0;
          const startNumVal = Number(selTrip.startKm) || 0;
          const odoDist = closeNumVal > startNumVal ? closeNumVal - startNumVal : (selTrip.odoKm || 0);
          const tripPatch = {
            status: 'Closed',
            closeKm: closeNumVal || selTrip.closeKm,
            odoKm: odoDist,
            invoice: rec.invoice || selTrip.invoice,
            lr: rec.lr || selTrip.lr,
            bunk: rec.bunk || selTrip.bunk,
            rate: Number(rec.rate) || selTrip.rate,
            diesel: rec.litres ? `${rec.litres} L` : selTrip.diesel,
            dieselLitres: Number(rec.litres) || selTrip.dieselLitres,
            dieselTotal: dieselTotal || selTrip.dieselTotal,
            totalExpense: rec.totalExpense ? `₹${Number(rec.totalExpense).toLocaleString('en-IN')}` : selTrip.totalExpense,
            closeRemarks: rec.remarks || selTrip.closeRemarks,
            qtyLoad: rec.qtyLoad || selTrip.qtyLoad,
            qtyUnload: rec.qtyUnload || selTrip.qtyUnload,
            closed: rec.closedAt,
            flags: flagged ? [...(selTrip.flags || []).filter(f => !f.startsWith('Variance')), `Variance ${pct}%`] : (selTrip.flags || []),
          };
          const isAdded = (cur.added || []).some(x => x.id === selTrip.id);
          if (isAdded) {
            cur.added = cur.added.map(x => (x.id === selTrip.id ? { ...x, ...tripPatch } : x));
          } else {
            cur.edited = { ...(cur.edited || {}), [selTrip.id]: { ...(cur.edited?.[selTrip.id] || {}), ...tripPatch } };
          }
          m.trips = cur;
          localStorage.setItem(this.MASTER_KEY, JSON.stringify(m));
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('tms-master-change', { detail: { key: 'trips' } }));
        } catch (e) {}
        this.setState(st => ({ closedIds: [...st.closedIds, selTrip.id], closedData: { ...st.closedData, [selTrip.id]: rec } }));
        const resume = s.resumeOpen && s.resumeOpen.trip === selTrip.id;
        if (resume) {
          this.setState(st => ({ screen: 'open', history: ['home'], resumeOpen: null, railVariant: '', showErrors: false, form: { ...st.form, vehicle: s.resumeOpen.vehicle, startKm: '', driver: '', driverOk: false } }));
          this.toast(flagged ? 'warning' : 'success', 'Trip closed · back to Open Trip', `${selD.vehicleNumber} is free now. Finish opening the new trip.${flagged ? ` Variance ${pct}% sent to admin exceptions.` : ''}`);
        } else {
          this.go('closeDone');
          this.toast(flagged ? 'warning' : 'success', flagged ? 'Closed with flag' : 'Trip closed', flagged ? `Variance ${pct}% sent to admin exceptions.` : `${selD.vehicleNumber} is available again.`);
        }
        this.logActivity({ title: `Trip closed · ${selD.number}`, body: flagged ? `Closed with a ${pct}% distance variance. It was sent to Head Office exceptions for review.` : `${selD.vehicleNumber} is available again. Distance is within the 5% limit.`, rows: [['Trip', selD.number], ['Vehicle', selD.vehicleNumber], ['Invoice', cf.invoice], ['Closing odometer', km(closeNum) + ' km'], ['Diesel', `${km(dieselLitres)} L · ${fills.length} ${fills.length === 1 ? 'bunk' : 'bunks'} · ${money0(dieselTotal)}`], ['Total expense', money0(Number(cf.totalExpense))], ['Variance', fixed ? pct + '%' : 'Not applicable']], link: { trip: selTrip.id }, linkLabel: 'View closed trip' });
        this.pushAdminNotif({ title: 'Trip Update', body: `Trip #${selD.number} closed by ${me.name}. ${flagged ? `Variance ${pct}% flagged.` : 'Successfully reached destination.'}`, time: 'Just now' });
      },
      verify,
      // trip history
      histList: histShown, histCount: histShown.length, histWord: histShown.length === 1 ? 'trip' : 'trips', histEmpty: !histShown.length, hist,
      histHomeHint: `${histList.length} closed ${histList.length === 1 ? 'trip' : 'trips'}. Filter by vehicle or date.`,
      histCountLine: hfAnyFilter && !s.forceEmptyHist ? `${histShown.length} of ${histList.length} closed ${histList.length === 1 ? 'trip' : 'trips'}` : `${histShown.length} closed ${histShown.length === 1 ? 'trip' : 'trips'} · ${me.branch}`,
      histEmptyTitle: hfAnyFilter && !s.forceEmptyHist ? 'No trips match these filters' : 'No closed trips yet',
      histEmptyText: hfAnyFilter && !s.forceEmptyHist ? `Nothing closed${hf.vehicle ? ' for ' + (T.V[hf.vehicle] || {}).number : ''}${hfHasRange ? ' in ' + hfRangeLabel : ''}. Try another vehicle or date range.` : 'Trips you close appear here with the full closing details, newest first.',
      hfVehicleOptions, hfVehicleValue: hf.vehicle || '__all', hfHasRange, hfAnyFilter, hfNoFilter: !hfAnyFilter, hfRangeLabel, hfPresets, hfMaxDay: TODAY,
      hfCalOpen: s.hfCalOpen, hfDraft: s.hfDraft, hfErr: s.hfErr,
      hfCalBorder: s.hfCalOpen || hfHasRange ? 'var(--color-brand)' : 'var(--border-strong)', hfCalBg: hfHasRange ? 'var(--color-brand)' : s.hfCalOpen ? 'var(--color-brand-tint)' : '#fff', hfCalFg: hfHasRange ? '#fff' : 'var(--text-heading)',
      hfDateBorder: s.hfErr ? 'var(--status-danger)' : 'var(--border-strong)',
      setHfVehicle: e => { const v = e.target.value; this.setState(st => ({ hf: { ...st.hf, vehicle: v === '__all' ? '' : v } })); },
      toggleHfCal: () => this.setState(st => ({ hfCalOpen: !st.hfCalOpen, hfDraft: { from: st.hf.from, to: st.hf.to }, hfErr: '' })),
      setHfFrom: e => { const from = e.target.value; this.setState(st => ({ hfDraft: { from, to: st.hfDraft.to && from && st.hfDraft.to < from ? '' : st.hfDraft.to }, hfErr: '' })); },
      setHfTo: e => { const to = e.target.value; this.setState(st => ({ hfDraft: { ...st.hfDraft, to }, hfErr: '' })); },
      pickHfPreset: e => { const { from, to } = e.currentTarget.dataset; this.setState({ hfDraft: { from, to }, hfErr: '' }); },
      applyHfRange: () => {
        const { from, to } = s.hfDraft;
        if (!from && !to) { this.setState({ hfErr: 'Pick a from date, a to date, or both.' }); return; }
        if (from && to && to < from) { this.setState({ hfErr: 'To date must be on or after the from date.' }); return; }
        this.setState(st => ({ hf: { ...st.hf, from, to }, hfCalOpen: false, hfErr: '', railVariant: '' }));
      },
      clearHfRange: () => this.setState(st => ({ hf: { ...st.hf, from: '', to: '' }, hfDraft: { from: '', to: '' }, hfCalOpen: false, hfErr: '' })),
      clearHfAll: () => this.setState({ hf: { vehicle: '', from: '', to: '' }, hfDraft: { from: '', to: '' }, hfCalOpen: false, hfErr: '', railVariant: '' }),
      openHistTrip: e => this.go('histTrip', { histSel: e.currentTarget.dataset.id, railVariant: '' }),
      goHistory: () => this.go('history', { railVariant: '', forceEmptyHist: false, hf: { vehicle: '', from: '', to: '' }, hfDraft: { from: '', to: '' }, hfCalOpen: false, hfErr: '' }),
      // unclosed
      unclosedList,
      unclosedAlertOpen: !!s.unclosedAlert,
      ua: (() => { const a = s.unclosedAlert; const tr = a && this.allTrips().find(x => x.id === a.trip); if (!tr) return { vehicle: '', number: '', route: '', opened: '', hoursOpen: '' }; const d = this.decorate(tr); return { vehicle: d.vehicleNumber, number: d.number, route: d.routeLine, opened: d.opened, hoursOpen: d.hoursOpen }; })(),
      ackUnclosedAlert: () => { const a = s.unclosedAlert; if (!a) return; this.go('trip', { selected: a.trip, unclosedAlert: null, resumeOpen: { vehicle: a.vehicle, trip: a.trip }, railVariant: '' }); },
      resumeHere: !!(s.resumeOpen && s.resumeOpen.trip === s.selected && ['trip', 'close'].includes(s.screen)), resumeVehicle: s.resumeOpen ? (T.V[s.resumeOpen.vehicle] || {}).number : '', unclosedEmpty: !unclosedList.length,
      openTripDetail: e => this.go('trip', { selected: e.currentTarget.dataset.id, railVariant: '' }), closeFromDetail: () => this.go('close', { showCloseErrors: false, cf: this.blankClose() }),
      // attendance
      attDrivers, idleSummary: idleStats.idle ? `${idleStats.idle} ${idleStats.idle === 1 ? 'vehicle' : 'vehicles'} idle` + (idleMissing ? ` · ${idleMissing} without reason` : ' · reasons recorded') : 'No vehicles marked idle', goIdle: () => this.go('idle', { railVariant: '', showIdleErrors: false }),
      // vehicle idle status
      idleStats, idleVehicles, idleFilters, idleListEmpty: !idleVehicles.length, idleReasonOptions: ['No business / no load', 'No driver assigned', 'Driver on leave', 'Under maintenance', 'Breakdown / repair', 'Waiting for loading', 'Documents / permit pending', 'Other'].map(x => ({ value: x, label: x })),
      idleEmptyTitle: idleFilt === 'missing' ? 'Every idle vehicle has a reason' : 'No idle vehicles', idleEmptyText: idleFilt === 'missing' ? 'Nothing is waiting for a reason.' : 'Mark a vehicle idle from the All tab when it is standing without a trip.',
      setIdleFilter: e => this.setState({ idleFilter: e.currentTarget.dataset.f }),
      toggleIdle: e => { const id = e.currentTarget.dataset.id; this.setState(st => ({ idle: { ...st.idle, [id]: (st.idle[id] || {}).on ? { on: false, reason: '', note: '' } : { on: true, reason: '', note: '' } } })); },
      idleHasErrors: s.showIdleErrors && idleMissing > 0, idleErrorText: `${idleMissing} idle ${idleMissing === 1 ? 'vehicle needs' : 'vehicles need'} a reason before saving.`,
      saveIdle: () => { if (idleMissing) { this.setState({ showIdleErrors: true, railVariant: 'errors' }); return; } this.setState(st => ({ showIdleErrors: false, idle: Object.fromEntries(Object.entries(st.idle).map(([id, r]) => [id, r.on && !r.since ? { ...r, since: this.nowText(), hours: 0 } : r])) })); this.toast('success', 'Idle status saved', `${idleStats.idle} idle · ${idleStats.running} on trip · ${idleStats.ready} ready. Shared with Head Office.`); this.logActivity({ title: 'Vehicle idle status saved', body: `${idleStats.idle} idle · ${idleStats.running} on trip · ${idleStats.ready} ready. Shared with Head Office.`, rows: idleRows.filter(v => v.on).map(v => [v.number, v.reason + (v.note ? ' · ' + v.note : '')]), link: { screen: 'idle' }, linkLabel: 'Open idle status' }); this.pushAdminNotif({ title: 'Maintenance Alert', body: `Vehicle idle status updated: ${idleStats.idle} vehicles marked idle.`, time: 'Just now' }); this.go('home'); },
      am, amVehicleOptions, amDriverOptions, amVehicleHint, amDriverHint, amRows, amRowCount: amRows.length, amRowsEmpty: !amRows.length,
      showAttMonth: SHOW_ATT_MONTH,
      attTabs: [['mark', 'Mark new attendance'], ['marked', 'Marked attendance']].filter(([id]) => !HIDDEN_ATT_TABS.includes(id)).map(([id, label]) => { const on = s.attTab === id; return { id, label, selected: on ? 'true' : 'false', color: on ? 'var(--text-brand)' : 'var(--text-muted)', bar: on ? 'var(--color-brand)' : 'transparent' }; }),
      attTabMark: s.attTab !== 'marked' || HIDDEN_ATT_TABS.includes('marked'), attTabMarked: s.attTab === 'marked' && !HIDDEN_ATT_TABS.includes('marked'),
      setAttTab: e => this.setState({ attTab: e.currentTarget.dataset.tab, railVariant: '' }),
      savedDays, savedDayCount: savedDays.length, savedDaysEmpty: !savedDays.length, attUnsaved,
      attUnsavedText: savedToday ? "Today's attendance has changed since you saved it." : `Today's attendance is not saved yet · ${Object.keys(todayEntries).length} marked.`,
      toggleAttDay: e => { const day = e.currentTarget.dataset.day; this.setState({ attOpenDay: openDay === day ? 'none' : day }); },
      setAmVehicle: e => this.pickAm({ vehicle: e.target.value }),
      setAmDriver: e => this.pickAm({ driver: e.target.value }),
      amStatusOptions, amStatusHint, setAmStatus: e => this.pickAm({ status: e.target.value }),
      removeAm: e => { const id = e.currentTarget.dataset.id, d = this.drv(id), vn = (T.V[s.attVeh[id]] || {}).number; this.setState(st => { const attVeh = { ...st.attVeh }, attVehStatus = { ...st.attVehStatus }; delete attVeh[id]; delete attVehStatus[id]; return { att: { ...st.att, [id]: '' }, attVeh, attVehStatus }; }); this.toast('warning', 'Removed', `${d ? d.name : 'Driver'}${vn ? ' · ' + vn : ''} removed from today’s attendance.`); },
      saveAmEntry: () => { if (!Object.keys(todayEntries).length) { this.toast('warning', 'Nothing to save', 'Pick a vehicle and driver to mark someone present first.'); return; } const rec = { day: TODAY_DAY, label: todayLabel, savedAt: `${p2(now.getHours())}:${p2(now.getMinutes())}`, entries: todayEntries }; this.writeAttDay(rec); this.setState(st => ({ attSaved: [rec, ...st.attSaved.filter(r => r.day !== TODAY_DAY)], attTab: 'marked', attOpenDay: TODAY_DAY, railVariant: '' })); this.toast(attendanceMarked < attendanceTotal ? 'warning' : 'success', attendanceMarked < attendanceTotal ? 'Saved · incomplete' : 'Attendance saved', `${attendanceMarked} of ${attendanceTotal} drivers marked for ${todayLabel}.`); this.logActivity({ title: `Attendance saved · ${todayLabel}`, body: `${attendanceMarked} of ${attendanceTotal} drivers marked${attendanceMarked < attendanceTotal ? ', some still unmarked' : ''}.`, rows: attDrivers.map(d => [d.name, s.att[d.id] === 'P' ? 'Present' + (s.attVeh[d.id] ? ' · ' + (T.V[s.attVeh[d.id]] || {}).number : '') : s.att[d.id] === 'A' ? 'Absent' : 'Not marked']), link: { screen: 'attMark' }, linkLabel: 'Open attendance' }); this.pushAdminNotif({ title: 'Attendance Update', body: `Daily attendance saved for ${attendanceMarked} drivers by ${me.name} (${me.branch}).`, time: 'Just now' }); },
      markDriver: e => this.set(['att', e.currentTarget.dataset.id], e.currentTarget.dataset.v),
      saveAttendance: () => { this.toast(attendanceMarked < attendanceTotal ? 'warning' : 'success', attendanceMarked < attendanceTotal ? 'Saved · incomplete' : 'Attendance saved', `${attendanceMarked} of ${attendanceTotal} drivers marked for ${todayDM}.`); this.logActivity({ title: `Attendance saved · ${todayShort}`, body: `${attendanceMarked} of ${attendanceTotal} drivers marked${attendanceMarked < attendanceTotal ? ', some still unmarked' : ''}.`, rows: attDrivers.map(d => [d.name, s.att[d.id] === 'P' ? 'Present' + (s.attVeh[d.id] ? ' · ' + (T.V[s.attVeh[d.id]] || {}).number : '') : s.att[d.id] === 'A' ? 'Absent' : 'Not marked']), link: { screen: 'attMark' }, linkLabel: 'Open attendance' }); this.pushAdminNotif({ title: 'Attendance Update', body: `Daily attendance marked for ${attendanceMarked} drivers for ${todayDM}.`, time: 'Just now' }); this.go('home'); },
      weekdays, monthCells, pickDay: e => { const d = Number(e.currentTarget.dataset.day); if (d && d <= TD.getDate()) this.go('attendance'); },
      // driver request
      reqSent: (() => { const r = s.drvReqs.find(x => x.id === s.reqSentId) || { status: 'Pending', name: rf.name }; const t = { Pending: ['Pending approval', 'var(--color-hazard-soft)', '#7A4300', 'Waiting for Head Office. This updates here as soon as they decide.'], Approved: ['Approved', 'var(--kr-green-100)', 'var(--kr-green-800)', `${r.name} is in the ${me.branch} driver list and can be assigned to trips.`], Rejected: ['Rejected', 'var(--kr-red-100)', 'var(--kr-red-800)', `Head Office rejected the request${r.reason ? ': ' + r.reason : '.'}`] }[r.status] || []; return { label: t[0], bg: t[1], fg: t[2], note: t[3], when: r.decidedAt ? 'Decided ' + r.decidedAt : r.requestedAt ? 'Sent ' + r.requestedAt : 'Sent just now' }; })(),
      rf, setRf: this.bind('rf', ['name', 'holder']), rerr, uploads, reqFromOpen: s.reqFromOpen,
      reqHasErrors: reqErrorCount > 0, reqErrorCount, reqErrorWord: reqErrorCount === 1 ? 'field' : 'fields', refCount: (rf.reference || '').length,
      reqIntro: s.reqFromOpen && veh ? `For ${veh.number}. The trip can open with this driver now; the driver stays Pending approval until Head Office clears the request.` : 'New drivers need Head Office approval before they join the driver master. The request goes to Head Office.',
      setRfLicence: e => this.set(['rf', 'licence'], e.target.value.toUpperCase().slice(0, 20)),
      setRfPhone: e => this.set(['rf', 'phone'], digits(e.target.value).slice(0, 10)), setRfFamily: e => this.set(['rf', 'family'], digits(e.target.value).slice(0, 10)),
      setRfAccount: e => this.set(['rf', 'account'], digits(e.target.value).slice(0, 18)), setRfIfsc: e => this.set(['rf', 'ifsc'], e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11)),
      setRfReference: e => this.set(['rf', 'reference'], e.target.value.slice(0, 250)),
      pickUpload: e => { const key = e.currentTarget.dataset.k, file = e.target.files && e.target.files[0]; e.target.value = ''; if (!file) return;
        if (!/^image\//.test(file.type)) { this.toast('warning', 'Not an image', 'Upload a JPG or PNG photo of the document.'); return; }
        if (file.size > 5 * 1024 * 1024) { this.toast('warning', 'File too large', 'Keep the photo under 5 MB.'); return; }
        const kb = file.size / 1024, size = kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(kb)) + ' KB';
        this.shrinkImage(file).then(url => this.set(['rf', key], { name: file.name, size, url })); },
      clearUpload: e => this.set(['rf', e.currentTarget.dataset.k], null),
      submitDriver: () => {
        if (Object.values(rfBad).some(Boolean)) { this.setState({ showReqErrors: true, railVariant: 'errors' }); return; }
        const name = rf.name.trim(), acct = digits(rf.account), id = 'DR' + Date.now(), vehNo = s.reqFromOpen && veh ? veh.number : '';
        const doc = x => x ? { name: x.name, size: x.size, url: x.url || '' } : null;
        const req = { id, status: 'Pending', branch: this.BR, supervisor: this.SUP, supervisorName: (T.S[this.SUP] || {}).name || 'Supervisor', requestedAt: this.nowText(), vehicle: vehNo,
          name, licence: rf.licence, phone: digits(rf.phone), licImg: doc(rf.licImg), aadhaarImg: doc(rf.aadhaarImg), holder: rf.holder.trim(), account: acct, ifsc: rf.ifsc, family: digits(rf.family), reference: rf.reference.trim() };
        const list = [req, ...this.readDrvReqs().filter(r => r.id !== id)];
        try { localStorage.setItem(this.DRV_KEY, JSON.stringify(list)); } catch (e) {
          // Photos can overflow storage; send the request without them rather than lose it.
          try { localStorage.setItem(this.DRV_KEY, JSON.stringify([{ ...req, licImg: req.licImg && { ...req.licImg, url: '' }, aadhaarImg: req.aadhaarImg && { ...req.aadhaarImg, url: '' } }, ...list.slice(1)])); } catch (e2) { /* storage blocked: kept on this device only */ }
        }
        this.setState(st => ({ drvReqs: [req, ...st.drvReqs.filter(r => r.id !== id)], reqSentId: id }));
        this.logActivity({ title: `Driver request sent · ${name}`, body: `${name} was sent to Head Office for approval${vehNo ? ` and assigned to the trip being opened on ${vehNo}` : ''}.`, rows: [['Driver', name], ['Licence', rf.licence], ['Mobile', '+91 ' + rf.phone], ['Documents', 'Licence and Aadhaar images attached'], ['Bank', `${rf.holder.trim()} · A/c ••••${acct.slice(-4)} · ${rf.ifsc}`], ['Family contact', '+91 ' + rf.family], ...(rf.reference.trim() ? [['Reference', rf.reference.trim()]] : []), ['Status', 'Pending approval']] });
        this.pushAdminNotif({ title: 'Driver Request', body: `${name} requested as driver for ${me.branch}${vehNo ? ` (${vehNo})` : ''}.`, time: 'Just now' });
        if (!s.reqFromOpen) { this.go('reqDone'); return; }
        this.setState(st => { const h = [...st.history]; const prev = h.pop() || 'open'; return { form: { ...st.form, driver: id, driverOk: true }, screen: prev, history: h, reqFromOpen: false, showReqErrors: false, railVariant: '' }; });
        this.toast('warning', 'Sent for approval', `${name} is set as the driver. Head Office must approve the driver record.`);
      },
      grantGps: () => { this.setState({ gpsGranted: true }); this.go('open'); },
      notifOpen: s.notifOpen, toast: s.toast, hideToast: () => this.setState({ toast: null })
    };
  }
  pickAm(patch) {
    const am = { ...this.state.am, ...patch };
    if (patch.vehicle !== undefined && patch.vehicle !== this.state.am.vehicle) am.status = '';
    if (!am.vehicle || !am.driver || !am.status) { this.setState({ am }); return; }
    const T = this.T(), d = this.drv(am.driver), v = T.V[am.vehicle];
    const taken = Object.keys(this.state.attVeh).find(id => id !== am.driver && this.state.att[id] === 'P' && this.state.attVeh[id] === am.vehicle);
    if (taken) { this.setState({ am: { ...am, vehicle: '', status: '' } }); this.toast('warning', 'Vehicle already marked', `${v.number} is already on today’s list with ${(this.drv(taken) || {}).name || 'another driver'}. Pick another vehicle.`); return; }
    this.setState(st => ({ att: { ...st.att, [am.driver]: 'P' }, attVeh: { ...st.attVeh, [am.driver]: am.vehicle }, attVehStatus: { ...st.attVehStatus, [am.driver]: am.status }, am: { vehicle: '', driver: '', status: '' } }));
    this.toast('success', 'Marked present', `${d.name} · ${v.number} · ${am.status} · 14 September.`);
  }
  bind(key, fields) { const o = {}; fields.forEach(k => o[k] = e => this.set([key, k], e.target.value)); return o; }
  blankForm() { return { client: '', vehicle: '', loading: '', unloading: [], unloadMode: 'single', startKm: '', driver: '', driverOk: false, type: 'Business', reason: '', remarks: '', from: '', to: '', km: '' }; }
  // Longest side 1000 px, JPEG ~0.7: a readable document photo at roughly 100 KB, small enough for localStorage.
  shrinkImage(file) {
    return new Promise(done => {
      const src = URL.createObjectURL(file), img = new Image();
      img.onload = () => { const k = Math.min(1, 1000 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(src); done(c.toDataURL('image/jpeg', 0.7)); };
      img.onerror = () => { URL.revokeObjectURL(src); done(''); };
      img.src = src;
    });
  }
  blankRf() { return { name: '', licence: '', phone: '', licImg: null, aadhaarImg: null, holder: '', account: '', ifsc: '', family: '', reference: '' }; }
  seedIdle() { return { V02: { on: true, reason: 'No business / no load', note: '', since: '13 Sep 18:40', hours: 15 }, V04: { on: true, reason: 'No driver assigned', note: '', since: '12 Sep 05:40', hours: 52 }, V08: { on: false, reason: '', note: '' }, V10: { on: false, reason: '', note: '' } }; }
  // Attendance already saved on earlier days (status, vehicle) per driver. Today's is added when the supervisor saves.
  seedAttSaved() {
    return [
      { day: '2026-09-13', label: 'Sat, 13 Sep 2026', savedAt: '18:05', entries: { D01: ['P', 'V01'], D02: ['P', 'V02'], D09: ['A', ''], D10: ['P', 'V04'], D11: ['A', ''] } },
      { day: '2026-09-12', label: 'Fri, 12 Sep 2026', savedAt: '17:52', entries: { D01: ['P', 'V01'], D02: ['A', ''], D09: ['A', ''], D10: ['P', 'V10'], D11: ['P', 'V08'] } },
      { day: '2026-09-11', label: 'Thu, 11 Sep 2026', savedAt: '18:20', entries: { D01: ['P', 'V01'], D02: ['P', 'V02'], D09: ['A', ''], D10: ['P', 'V04'], D11: ['P', 'V08'] } }
    ];
  }
  blankClose() { return { invoice: '', lr: '', qtyLoad: '', qtyUnload: '', totalExpense: '', remarks: '',
    legs: [], legDraft: this.blankLeg(), legEdit: -1, legOpen: false, legTried: false,
    fills: [], fillDraft: this.blankFill(), fillEdit: -1, fillOpen: false, fillTried: false }; }
  blankLeg() { return { from: '', to: '', reading: '', photo: null }; }
  blankFill() { return { bunk: '', litres: '', rate: '' }; }
  patchCf(patch) { this.setState(st => ({ cf: { ...st.cf, ...patch } })); }
  // Points an odometer reading can be taken between: loading point, each unloading customer, then the branch yard.
  tripPoints(t) {
    const T = this.T(), yard = ((T.B[t.branch] || {}).name || 'Branch') + ' yard';
    const pts = t.type === 'Non-Business' || !t.loading ? [t.from, t.unloading] : [(this.loc(t.loading) || {}).name, ...(t.customers || []).map(id => (T.U[id] || {}).name)];
    return [...new Set([...pts.filter(Boolean), yard])];
  }

  render() {
    return (
      <div className="sv-app">
        <div className="sv-device">
          <SupervisorScreens v={this.renderVals()} />
        </div>
      </div>
    );
  }
}

export default SupervisorApp;
