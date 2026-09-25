// Trip verification & approval workflow.
//
// A closed trip carries money — diesel, advance, expenses — so it passes a
// verification layer before Head Office processes it for billing:
//
//   Supervisor closes  →  Level 1 (Verification Team)  →  Level 2 (Administrator)
//
// The diesel gate is the authorized limit Head Office sets per route in the
// Route Master, compared against the quantity the supervisor filed at close.
//
// Level 1 approves any trip whose diesel is inside that limit. Diesel above it
// cannot be approved at Level 1: the trip is escalated with the driver's
// explanation attached. Level 2 accepts the explanation and approves, or rejects
// it and raises a salary deduction against the driver for the excess.
//
// The remaining checks are context for the verifier, not a gate.
//
// Once a trip is approved the record is frozen: no further edits, at any level.

export const VERIFY_STATUS = {
  NOT_READY: 'Not ready',          // trip still open; expenses are filled at close
  PENDING: 'Pending verification', // waiting on Level 1
  ESCALATED: 'Escalated',          // Level 1 sent it to Level 2 with a reason
  APPROVED: 'Approved',            // signed off; record locked
  DEDUCTED: 'Deduction raised',    // Level 2 rejected the explanation
};

export const VERIFY_LEVEL_1 = 'Verification Team';
export const VERIFY_LEVEL_2 = 'Administrator';

const num = (v) => {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return isNaN(v) ? null : v;
  const n = Number(String(v).replace(/[^\d.-]/g, ''));
  return isNaN(n) ? null : n;
};

export const dieselLitresOf = (t) =>
  t.dieselLitres != null ? num(t.dieselLitres) : num(t.diesel);

export const dieselRateOf = (t) => num(t.rate);

export const dieselAmountOf = (t) => {
  if (t.dieselTotal != null) return num(t.dieselTotal);
  const l = dieselLitresOf(t), r = dieselRateOf(t);
  return l != null && r != null ? Math.round(l * r) : null;
};

// The routes a trip runs. Each customer on the trip carries the route id for its
// own drop, so a multi-drop trip legitimately runs more than one route.
export const routesOfTrip = (t, tms) => {
  if (!t || !tms) return [];
  const seen = new Set();
  return (t.customers || [])
    .map(cid => ((tms.U || {})[cid] || {}).route)
    .filter(rid => rid && !seen.has(rid) && seen.add(rid))
    .map(rid => (tms.R || {})[rid])
    .filter(Boolean);
};

export const routeOfTrip = (t, tms) => routesOfTrip(t, tms)[0] || null;

// Litres Head Office authorizes for this trip: the sum of the limits on every
// route it runs, so a two-drop trip gets both legs' budget. null when no route
// carries a limit. A limit stored on the trip itself wins, so a one-off
// authorization can override the route default.
export const routeDieselLimit = (t, tms) => {
  if (t && t.dieselLimit != null && t.dieselLimit !== '') return num(t.dieselLimit);
  const limits = routesOfTrip(t, tms)
    .map(r => num(r.dieselLimit))
    .filter(n => n != null);
  return limits.length ? limits.reduce((a, b) => a + b, 0) : null;
};

// Litres booked beyond the route's authorized limit; 0 when inside it, null when
// there is nothing to compare.
export const overLimitLitres = (t, limit) => {
  const litres = dieselLitresOf(t);
  if (litres == null || limit == null || limit <= 0) return null;
  return litres > limit ? Math.round((litres - limit) * 100) / 100 : 0;
};

// Money value of that excess, used to pre-fill a salary deduction.
export const overLimitValue = (t, limit) => {
  const over = overLimitLitres(t, limit);
  const rate = dieselRateOf(t);
  return over && rate ? Math.round(over * rate) : null;
};

/**
 * The checks a trip must pass before Level 1 can approve it outright.
 * Returns [{ key, label, ok, detail }]; `ok: null` means "nothing to check".
 */
export const runChecks = (t, { variancePct = null, varianceThreshold = 5, dieselLimit = null } = {}) => {
  const litres = dieselLitresOf(t);
  const overLimit = overLimitLitres(t, dieselLimit);
  const fmtL = (n) => `${Number(n).toLocaleString('en-IN')} L`;

  const checks = [
    {
      key: 'dieselLimit',
      label: 'Diesel within authorized route limit',
      ok: overLimit == null ? null : overLimit === 0,
      detail:
        overLimit == null
          ? litres == null
            ? 'No diesel quantity recorded'
            : 'No authorized limit set on this route'
          : overLimit === 0
          ? `${fmtL(litres)} against an authorized ${fmtL(dieselLimit)}`
          : `${fmtL(litres)} against an authorized ${fmtL(dieselLimit)} — ${fmtL(overLimit)} over the limit`,
    },
    {
      key: 'rate',
      label: 'Diesel rate recorded',
      ok: dieselRateOf(t) != null,
      detail: dieselRateOf(t) != null ? `₹${dieselRateOf(t).toFixed(2)} per litre` : 'No rate entered at close',
    },
    {
      key: 'expense',
      label: 'Total expense recorded',
      ok: num(t.totalExpense) != null,
      detail: num(t.totalExpense) != null ? `₹${num(t.totalExpense).toLocaleString('en-IN')}` : 'No total expense entered',
    },
    {
      key: 'closeKm',
      label: 'Closing odometer recorded',
      ok: t.closeKm != null,
      detail: t.closeKm != null ? `${Number(t.closeKm).toLocaleString('en-IN')} km` : 'Supervisor did not enter a closing reading',
    },
    {
      key: 'variance',
      label: 'Distance within threshold',
      ok: variancePct == null ? null : variancePct <= varianceThreshold,
      detail:
        variancePct == null
          ? 'No fixed route to compare against'
          : `${variancePct.toFixed(1)}% against a ${varianceThreshold}% threshold`,
    },
  ];

  return checks;
};

export const failedChecks = (checks) => checks.filter(c => c.ok === false);

// A trip only reaches the verification queue once the supervisor has closed it.
export const isVerifiable = (t) => !!t && t.status === 'Closed';

/**
 * Current workflow state for a trip, merging the stored record with the rules.
 * `record` is what the verifiers have saved so far, or undefined.
 */
export const verifyState = (t, record, checks) => {
  if (!isVerifiable(t)) {
    return { status: VERIFY_STATUS.NOT_READY, locked: false, canApproveL1: false, canEscalate: false, canDecideL2: false, failed: [], overLimit: false };
  }
  const failed = failedChecks(checks);
  const status = (record && record.status) || VERIFY_STATUS.PENDING;
  const settled = status === VERIFY_STATUS.APPROVED || status === VERIFY_STATUS.DEDUCTED;
  // Only the authorized diesel limit decides whether Level 1 may sign off. The
  // other checks stay on the Validation panel as context for the verifier, but
  // they do not take the Approve & lock button away.
  const overLimit = (checks || []).some(c => c.key === 'dieselLimit' && c.ok === false);

  return {
    status,
    failed,
    overLimit,
    // An approved or deducted trip is closed for good — the record is frozen.
    locked: settled,
    // Level 1 signs off any trip inside its authorized diesel limit.
    canApproveL1: status === VERIFY_STATUS.PENDING && !overLimit,
    // Diesel above the authorized limit leaves Level 1 only by going up, with a reason.
    canEscalate: status === VERIFY_STATUS.PENDING && overLimit,
    // Level 2 rules on an escalated trip.
    canDecideL2: status === VERIFY_STATUS.ESCALATED,
  };
};

export default {
  VERIFY_STATUS,
  VERIFY_LEVEL_1,
  VERIFY_LEVEL_2,
  runChecks,
  verifyState,
  routeOfTrip,
  routesOfTrip,
  routeDieselLimit,
  overLimitLitres,
  overLimitValue,
  dieselLitresOf,
  dieselRateOf,
  dieselAmountOf,
  isVerifiable,
};
