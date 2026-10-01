// Vehicle activity timeline — Running / Idle / No GPS spans derived from GPS pings.
//
// Two layers:
//   1. getGpsPings(vehicle, fromMs, toMs) — the GPS source. Until the live GPS
//      feed is connected it simulates the tracker: one ping every 5 minutes with
//      speed and odometer, deterministic per vehicle and day, and consistent with
//      the vehicle's current status. Swap this one function for the real feed.
//   2. activitySegments(pings, fromMs, toMs) — the rules that turn pings into a
//      timeline, independent of where the pings come from.

export const PING_MIN = 5;          // tracker reporting interval
export const IDLE_SPEED_KMH = 5;    // at or below this the vehicle counts as Idle
export const GPS_GAP_MIN = 15;      // no ping for longer than this → No GPS

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const ACTIVITY = { RUNNING: 'Running', IDLE: 'Idle', NO_GPS: 'No GPS' };

/* ------------------------------------------------------------------ */
/* 1. GPS source (simulated until the live feed is connected)          */
/* ------------------------------------------------------------------ */

const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
const rng = (seed) => () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const startOfDay = (ms) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };

// "2 h 14 min ago" / "18 min ago" / "just now" → minutes.
export const minutesAgo = (txt) => {
  const s = String(txt || '');
  if (/just now/i.test(s)) return 0;
  const h = /(\d+)\s*h/.exec(s);
  const m = /(\d+)\s*min/.exec(s);
  if (!h && !m) return null;
  return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
};

// A day's driving pattern: alternating moving / stopped blocks in 5-minute steps.
// Nights are mostly parked; maintenance vehicles never move.
const dayBlocks = (v, dayStart) => {
  const r = rng(hash(`${v.id}|${dayStart}`));
  const blocks = [];
  let t = dayStart;
  const end = dayStart + DAY;
  const step = PING_MIN * MIN;
  while (t < end) {
    const hour = new Date(t).getHours();
    const night = hour >= 22 || hour < 5;
    const moving = v.status === 'Maintenance' ? false
      : night ? r() < 0.12
      : r() < (v.status === 'Running' ? 0.68 : 0.42);
    const mins = moving ? 40 + r() * 110 : night ? 60 + r() * 180 : 15 + r() * 75;
    const len = Math.max(step, Math.round((mins * MIN) / step) * step);
    blocks.push({ start: t, end: Math.min(end, t + len), moving, speed: 35 + r() * 30 });
    t += len;
  }
  return blocks;
};

// Weak-signal trackers drop out now and then: ~20% of hours lose a 25-minute window.
const weakDrop = (v, t) => {
  const hourStart = t - (t % HOUR);
  const r = rng(hash(`${v.id}|weak|${hourStart}`));
  if (r() >= 0.2) return false;
  const off = t - hourStart;
  return off >= 10 * MIN && off < 35 * MIN;
};

export const getGpsPings = (v, fromMs, toMs, now = Date.now()) => {
  const step = PING_MIN * MIN;
  const end = Math.min(toMs, now);
  if (!v || end <= fromMs) return [];

  const lastFixAgo = v.gps === 'Failed' ? minutesAgo(v.lastSeen) : null;
  const lastFix = lastFixAgo != null ? now - lastFixAgo * MIN : null;
  // The live card says how long an idle vehicle has been standing; honour it.
  // A GPS idle report (v.gpsIdle) means the tracker has seen it stationary for that long.
  const idleSince = v.gpsIdle ? now - v.gpsIdle.minutes * MIN
    : v.status === 'Idle' && v.idleHours ? now - v.idleHours * HOUR : null;
  const runningSince = !v.gpsIdle && v.status === 'Running' ? now - 25 * MIN : null;
  if (v.gps === 'Pending') return [];

  const pings = [];
  const cache = new Map();
  let km = 0;
  for (let t = Math.ceil(fromMs / step) * step; t <= end; t += step) {
    if (lastFix != null && t > lastFix) break;
    if (v.gps === 'Weak' && weakDrop(v, t)) continue;
    const ds = startOfDay(t);
    if (!cache.has(ds)) cache.set(ds, dayBlocks(v, ds));
    const b = cache.get(ds).find(x => t >= x.start && t < x.end) || { moving: false, speed: 0 };
    let moving = b.moving;
    if (idleSince != null && t >= idleSince) moving = false;
    else if (runningSince != null && t >= runningSince) moving = true;
    const speed = moving ? Math.round(b.speed + ((t / step) % 7) - 3) : ((t / step) % 5 === 0 ? 2 : 0);
    // Stationary jitter (a couple of km/h while parked) is not distance travelled.
    if (speed > IDLE_SPEED_KMH) km += (speed * PING_MIN) / 60;
    pings.push({ t, speed, km: Math.round(km * 10) / 10 });
  }
  return pings;
};

/* ------------------------------------------------------------------ */
/* 2. Pings → timeline                                                 */
/* ------------------------------------------------------------------ */

export const activitySegments = (pings, fromMs, toMs, now = Date.now()) => {
  const end = Math.min(toMs, now);
  if (end <= fromMs) return [];
  const gap = GPS_GAP_MIN * MIN;
  const segs = [];
  const push = (state, start, stop, km = 0) => {
    if (stop <= start) return;
    const last = segs[segs.length - 1];
    if (last && last.state === state && last.end === start) { last.end = stop; last.km += km; return; }
    segs.push({ state, start, end: stop, km });
  };

  if (!pings.length) { push(ACTIVITY.NO_GPS, fromMs, end); return finish(segs); }

  // Before the first ping.
  if (pings[0].t - fromMs > gap) push(ACTIVITY.NO_GPS, fromMs, pings[0].t);
  const firstStart = pings[0].t - fromMs > gap ? pings[0].t : fromMs;

  for (let i = 0; i < pings.length; i++) {
    const p = pings[i];
    const next = pings[i + 1];
    const state = p.speed > IDLE_SPEED_KMH ? ACTIVITY.RUNNING : ACTIVITY.IDLE;
    const start = i === 0 ? firstStart : p.t;
    if (next) {
      if (next.t - p.t > gap) {
        // Signal lost: the vehicle's state holds for one interval, then it's unknown.
        const held = p.t + PING_MIN * MIN;
        push(state, start, held);
        push(ACTIVITY.NO_GPS, held, next.t);
      } else {
        push(state, start, next.t, Math.max(0, next.km - p.km));
      }
    } else if (end - p.t > gap) {
      const held = p.t + PING_MIN * MIN;
      push(state, start, held);
      push(ACTIVITY.NO_GPS, held, end);
    } else {
      push(state, start, end);
    }
  }
  return finish(segs);
};

const finish = (segs) => segs.map(s => ({ ...s, km: Math.round(s.km), minutes: Math.round((s.end - s.start) / MIN) }));

export const activitySummary = (segs) => {
  const sum = (st) => segs.filter(s => s.state === st).reduce((a, s) => a + s.minutes, 0);
  const idles = segs.filter(s => s.state === ACTIVITY.IDLE);
  return {
    running: sum(ACTIVITY.RUNNING),
    idle: sum(ACTIVITY.IDLE),
    noGps: sum(ACTIVITY.NO_GPS),
    km: segs.reduce((a, s) => a + (s.km || 0), 0),
    longestIdle: idles.reduce((a, s) => Math.max(a, s.minutes), 0),
    idleStops: idles.length,
  };
};

export const vehicleActivity = (v, fromMs, toMs, now = Date.now()) => {
  const segs = activitySegments(getGpsPings(v, fromMs, toMs, now), fromMs, toMs, now);
  return { segments: segs, summary: activitySummary(segs) };
};

// 125 → "2 h 5 min", 45 → "45 min", 120 → "2 h".
export const fmtDuration = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
};

/* ------------------------------------------------------------------ */
/* 3. Where each idle span happened                                    */
/* ------------------------------------------------------------------ */

// Until the live feed sends positions, an idle span is placed at a real place
// from the masters, picked by how long and when the vehicle stood:
//   still standing now / overnight → its yard (the parked place on its card)
//   in maintenance                 → its service bay
//   under 15 min                   → a short stop on the road
//   15–45 min                      → a fuel bunk of its branch
//   45 min – 3 h                   → a loading point of one of its clients
//   longer                         → its yard
// With the live feed, replace this with the place nearest the idle GPS fix.
export const IDLE_PLACE_KIND = {
  yard: 'Yard',
  service: 'Service bay',
  bunk: 'Fuel bunk',
  loading: 'Loading point',
  stop: 'Short stop',
};

const homeOf = (v, tms) => {
  const text = String(v.route || '');
  const parked = /^(Parked at|Service bay,)\s*/i.test(text) ? text.replace(/^Parked at\s*/i, '') : '';
  if (parked) return parked;
  const loc = (tms.locations || []).find(l => l.branch === v.branch && (v.clients || []).includes(l.clientId || l.client));
  return loc ? loc.name : `${((tms.B || {})[v.branch] || {}).name || 'Branch'} yard`;
};

// The GPS fix for a place: loading points and bunks carry their own; a yard or
// service bay uses the loading point of the same name, else one of its branch.
const fixOf = (name, tms, branch) => {
  const all = [...(tms.locations || []), ...(tms.bunks || [])];
  const hit = all.find(x => x.lat && name && (x.name === name || String(name).toLowerCase().includes(String(x.name).split(' ')[0].toLowerCase())))
    || (tms.locations || []).find(l => l.lat && l.branch === branch);
  return hit ? { lat: hit.lat, lng: hit.lng } : {};
};

const placeOf = (v, seg, tms, now) => {
  const home = homeOf(v, tms);
  const standingNow = now - seg.end < PING_MIN * MIN * 2;
  // A tracker report for the stop it is in right now names the place exactly.
  if (standingNow && v.gpsIdle) {
    const r = v.gpsIdle;
    const ref = [...(tms.bunks || []), ...(tms.locations || [])].find(x => x.id === r.place);
    return { kind: r.kind, name: ref ? ref.name : r.place, lat: r.lat, lng: r.lng, limitMin: r.limitMin, note: r.note, reported: true };
  }
  if (v.status === 'Maintenance') return { kind: 'service', name: /^Service bay/i.test(v.route || '') ? v.route : home };
  const h = new Date(seg.start).getHours();
  const overnight = h >= 21 || h < 5;
  if ((standingNow && v.status === 'Idle') || overnight || seg.minutes > 180) return { kind: 'yard', name: home };
  if (seg.minutes < 15) return { kind: 'stop', name: 'Short stop on the road' };
  const pick = (list) => list[hash(`${v.id}|${seg.start}`) % list.length];
  const bunks = (tms.bunks || []).filter(b => b.branch === v.branch && b.status !== 'Inactive');
  const loads = (tms.locations || []).filter(l => (v.clients || []).includes(l.clientId || l.client) && l.status !== 'Inactive');
  if (seg.minutes <= 45 && bunks.length) return { kind: 'bunk', name: pick(bunks).name };
  if (loads.length) return { kind: 'loading', name: pick(loads).name };
  if (bunks.length) return { kind: 'bunk', name: pick(bunks).name };
  return { kind: 'yard', name: home };
};

export const idlePlaceFor = (v, seg, tms, now = Date.now()) => {
  const p = placeOf(v, seg, tms, now);
  return p.lat ? p : { ...p, ...fixOf(p.name, tms, v.branch) };
};

// Why the vehicle stood still, as the tracker would report it: the reason and
// whether the ignition was on. Follows the place and the vehicle's own record
// (no driver → "Waiting for driver", the Idle · no driver tile; no trip → no business).
export const IDLE_REASON = {
  night: { label: 'Night halt', tone: 'default' },
  noDriver: { label: 'Waiting for driver', tone: 'error' },
  noBusiness: { label: 'No trip assigned', tone: 'warning' },
  refuel: { label: 'Refuelling', tone: 'processing' },
  fuelHalt: { label: 'Fuel halt over limit', tone: 'error' },
  loading: { label: 'Loading / unloading', tone: 'processing' },
  maintenance: { label: 'Under maintenance', tone: 'default' },
  traffic: { label: 'Traffic / signal stop', tone: 'default' },
  rest: { label: 'Driver rest break', tone: 'default' },
};

export const idleReasonFor = (v, seg, place, now = Date.now()) => {
  const h = new Date(seg.start).getHours();
  const overnight = h >= 21 || h < 5;
  const standingNow = now - seg.end < PING_MIN * MIN * 2;
  switch (place.kind) {
    case 'service': return { key: 'maintenance', ignition: false };
    // Standing at a bunk longer than the allowed fuel halt is flagged.
    case 'bunk': return { key: place.limitMin && seg.minutes > place.limitMin ? 'fuelHalt' : 'refuel', ignition: false };
    case 'loading': return { key: 'loading', ignition: false };
    // Engine left running in traffic: the tracker sees ignition on at 0 km/h.
    case 'stop': return { key: 'traffic', ignition: true };
    default:
      if (overnight && !standingNow) return { key: 'night', ignition: false };
      if (!v.driver) return { key: 'noDriver', ignition: false };
      if (standingNow || seg.minutes > 180) return { key: 'noBusiness', ignition: false };
      return { key: 'rest', ignition: false };
  }
};

// The same segments, each Idle one carrying `place: { kind, name }`.
// Each idle one also carries `reason: { key, label, tone, ignition }`.
export const withIdlePlaces = (segments, v, tms, now = Date.now()) =>
  segments.map(s => {
    if (s.state !== ACTIVITY.IDLE) return s;
    const place = idlePlaceFor(v, s, tms, now);
    const r = idleReasonFor(v, s, place, now);
    return { ...s, place, reason: { ...r, ...IDLE_REASON[r.key] } };
  });
