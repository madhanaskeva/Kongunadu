// Trip advances and the carry-forward balance a vehicle takes from one closed trip to the next.
// Money is held as whole rupees (integers), like every other amount on the close form,
// so adding and subtracting never picks up floating-point noise.

// One advance over ₹10 lakh is treated as a typing mistake.
export const MAX_ADVANCE = 1000000;

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// '₹2,500', '2500', 2500 → 2500. Anything unreadable is 0.
export const toRupees = v => {
  if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v) : 0;
  const n = Number(String(v == null ? '' : v).replace(/[₹,\s]/g, ''));
  return Number.isFinite(n) ? Math.round(n) : 0;
};

// 2000 → '₹2,000', -2000 → '-₹2,000', 0 → '₹0'. The sign is never dropped.
export const moneySigned = n => {
  const r = toRupees(n);
  return (r < 0 ? '-₹' : '₹') + Math.abs(r).toLocaleString('en-IN');
};

// 'positive' | 'zero' | 'negative', for colouring a balance.
export const balanceTone = n => { const r = toRupees(n); return r > 0 ? 'positive' : r < 0 ? 'negative' : 'zero'; };

// '2026-10-30' → '30 Oct 2026'
export const advanceDateText = iso => {
  const [y, m, d] = String(iso || '').split('-');
  return y && m && d ? `${Number(d)} ${MON[Number(m) - 1]} ${y}` : '—';
};

// Errors for one advance entry, keyed by field. `today` is 'YYYY-MM-DD'.
export const validateAdvance = (entry, { today } = {}) => {
  const raw = String((entry || {}).amount == null ? '' : entry.amount).trim();
  const amount = toRupees(raw), date = String((entry || {}).date || '');
  const err = {};
  if (!raw) err.amount = 'Enter the advance amount.';
  else if (!/^\d+$/.test(raw.replace(/[₹,\s]/g, ''))) err.amount = 'Enter the amount in whole rupees.';
  else if (!(amount > 0)) err.amount = 'Advance must be more than ₹0.';
  else if (amount > MAX_ADVANCE) err.amount = `More than ${moneySigned(MAX_ADVANCE)} for one advance. Check the amount.`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) err.date = 'Pick the date the advance was given.';
  else if (today && date > today) err.date = 'The date cannot be in the future.';
  return err;
};

// The advances as they are saved: whole rupees, a date, oldest first. Throws if any entry is invalid,
// so a bad row can never reach the stored balance.
export const cleanAdvances = (list, opts) => (list || []).map((x, i) => {
  const err = validateAdvance(x, opts);
  if (err.amount || err.date) throw new Error(`Advance ${i + 1}: ${err.amount || err.date}`);
  return { id: x.id || `ADV${Date.now()}-${i}`, amount: toRupees(x.amount), date: x.date, ...(x.stage ? { stage: x.stage } : {}) };
}).sort((a, b) => a.date.localeCompare(b.date));

export const sumAdvances = list => (list || []).reduce((a, x) => a + toRupees(x.amount), 0);

// Final carry forward = previous carry forward + new advances − trip expenses.
export const calcCarryForward = ({ previous = 0, advances = 0, expense = 0 }) => {
  const prev = toRupees(previous), adv = toRupees(advances), exp = toRupees(expense);
  return { previous: prev, advances: adv, available: prev + adv, expense: exp, carryForward: prev + adv - exp };
};

// Sortable key for when a trip closed: the exact ISO stamp when saved by this app,
// else the '22 Sep 2026 14:05' text the seed data and Admin Portal use.
export const closedSortKey = t => {
  if (t.closedAtIso) return String(t.closedAtIso);
  const [d, m, y, hm = '00:00'] = String(t.closed || '').split(' ');
  const mi = MON.indexOf(m);
  return mi < 0 ? '' : `${y}-${String(mi + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}T${hm}`;
};

// The balance a vehicle carries into its next trip: the carry forward stored on that vehicle's
// latest closed trip. `isClosed` decides what counts as closed; `excludeId` leaves out the trip
// being closed now. A vehicle with no closed trip, or whose last trip was closed before
// carry-forward existed, starts from ₹0.
export const previousCarryForward = (trips, vehicleId, { excludeId, isClosed = t => t.status === 'Closed' } = {}) => {
  if (!vehicleId) return { amount: 0, trip: null, recorded: false };
  const seen = new Set();
  const closed = (trips || []).filter(t => {
    if (!t || t.vehicle !== vehicleId || t.id === excludeId || seen.has(t.id) || !isClosed(t)) return false;
    seen.add(t.id);
    return true;
  }).sort((a, b) => closedSortKey(b).localeCompare(closedSortKey(a)));
  const last = closed[0];
  if (!last) return { amount: 0, trip: null, recorded: false };
  const recorded = last.carryForward !== undefined && last.carryForward !== null && last.carryForward !== '';
  return { amount: recorded ? toRupees(last.carryForward) : 0, trip: last, recorded };
};
