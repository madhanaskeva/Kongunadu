// Trip verification & approval workflow.
//
// A closed trip carries money — diesel, advance, expenses — so it passes a
// verification layer before Head Office processes it for billing:
//
//   Supervisor closes  →  Level 1 (Verification Team)  →  Level 2 (Administrator)
//
// Level 1 approves a trip whose checks all pass. A trip that fails a check
// cannot be approved at Level 1; it is either escalated with a reason, or the
// verifier records the driver's explanation and sends it up. Level 2 accepts
// the explanation and approves, or rejects it and raises a salary deduction
// against the driver for the excess.
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

// Tank capacity comes from the Vehicle Master, with any size Head Office has
// corrected since (kept in the vehicle-tanks store) taking priority.
export const tankOf = (vehicle, vehTanks = {}) => {
  if (!vehicle) return null;
  const override = num(vehTanks[vehicle.id]);
  return override != null ? override : num(vehicle.tank);
};

// Litres taken beyond what the tank physically holds, or null when not checkable.
export const excessLitres = (t, vehicle, vehTanks) => {
  const litres = dieselLitresOf(t);
  const tank = tankOf(vehicle, vehTanks);
  if (litres == null || tank == null || tank <= 0) return null;
  return litres > tank ? Math.round((litres - tank) * 100) / 100 : 0;
};

// Money value of that excess, used to pre-fill a salary deduction.
export const excessValue = (t, vehicle, vehTanks) => {
  const over = excessLitres(t, vehicle, vehTanks);
  const rate = dieselRateOf(t);
  return over && rate ? Math.round(over * rate) : null;
};

/**
 * The checks a trip must pass before Level 1 can approve it outright.
 * Returns [{ key, label, ok, detail }]; `ok: null` means "nothing to check".
 */
export const runChecks = (t, { vehicle, vehTanks = {}, variancePct = null, varianceThreshold = 5 } = {}) => {
  const litres = dieselLitresOf(t);
  const tank = tankOf(vehicle, vehTanks);
  const over = excessLitres(t, vehicle, vehTanks);
  const fmtL = (n) => `${Number(n).toLocaleString('en-IN')} L`;

  const checks = [
    {
      key: 'tank',
      label: 'Diesel within tank capacity',
      ok: over == null ? null : over === 0,
      detail:
        over == null
          ? litres == null
            ? 'No diesel quantity recorded'
            : 'Tank capacity not set on this vehicle'
          : over === 0
          ? `${fmtL(litres)} into a ${fmtL(tank)} tank`
          : `${fmtL(litres)} into a ${fmtL(tank)} tank — ${fmtL(over)} more than it holds`,
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
    return { status: VERIFY_STATUS.NOT_READY, locked: false, canApproveL1: false, canEscalate: false, canDecideL2: false, failed: [] };
  }
  const failed = failedChecks(checks);
  const status = (record && record.status) || VERIFY_STATUS.PENDING;
  const settled = status === VERIFY_STATUS.APPROVED || status === VERIFY_STATUS.DEDUCTED;

  return {
    status,
    failed,
    // An approved or deducted trip is closed for good — the record is frozen.
    locked: settled,
    // Level 1 signs off only a clean trip that nobody has settled yet.
    canApproveL1: status === VERIFY_STATUS.PENDING && failed.length === 0,
    // A trip that failed a check leaves Level 1 only by going up, with a reason.
    canEscalate: status === VERIFY_STATUS.PENDING && failed.length > 0,
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
  excessLitres,
  excessValue,
  tankOf,
  dieselLitresOf,
  dieselRateOf,
  dieselAmountOf,
  isVerifiable,
};
