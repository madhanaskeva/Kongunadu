import React from 'react';
import { useParams } from 'react-router-dom';
import { CircleCheck, Fuel, Lock, ShieldCheck, TriangleAlert, Eye } from 'lucide-react';
import {
  Alert, Badge, Button, Card, Col, Descriptions, Empty, Flex, Progress, Row, Space, Table, Tag, Timeline, Tooltip, Typography,
} from 'antd';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { ENROUTE_LABEL } from '../../../utils/tripStatus';
import {
  VERIFY_STATUS, VERIFY_LEVEL_1, VERIFY_LEVEL_2,
  runChecks, verifyState,
  routeDieselLimit, overLimitLitres, overLimitValue, routesOfTrip,
} from '../../../utils/tripVerification';
import '../../../styles/tripDetail.css';

// Tag colour, left-edge colour and the line explaining what is expected next, per workflow state.
const VERIFY_VIEW = {
  [VERIFY_STATUS.NOT_READY]: {
    tag: 'default', edge: 'var(--kr-grey-300)',
    hint: 'Expenses are filed when the supervisor closes the trip.',
  },
  [VERIFY_STATUS.PENDING]: {
    tag: 'warning', edge: 'var(--kr-saffron-500)',
    hint: 'Waiting on Level 1 · Verification Team.',
    hintOver: 'Diesel is above the authorized limit — Level 1 cannot sign this off.',
  },
  [VERIFY_STATUS.ESCALATED]: {
    tag: 'error', edge: 'var(--kr-red-600)',
    hint: 'Level 1 could not approve this. Waiting on a Level 2 decision.',
  },
  [VERIFY_STATUS.APPROVED]: {
    tag: 'success', edge: 'var(--color-brand)',
    hint: 'Approved and locked.',
  },
  [VERIFY_STATUS.DEDUCTED]: {
    tag: 'error', edge: 'var(--kr-red-600)',
    hint: 'Deduction raised and sent to payroll.',
  },
};

// Exception severity → Tag preset.
const SEV_TAG = {
  High: 'error',
  Medium: 'warning',
  Low: 'default',
};

// Trip-record pill tone → Tag preset.
const TONE_TAG = {
  bad: 'error',
  good: 'success',
  neutral: 'default',
};

export const TripDetail = () => {
  const { id } = useParams();
  const {
    T,
    selectedTrip,
    st,
    setDrawer,
    setForm,
    setConfirm,
    deleted,
    setDeleted,
    showToast,
    navTo,
    excOverrides,
    setExcSel,
    setExcAssignees,
    setExcNote,
    tripVerify,
    setTripVerify,
    deductions,
    setDeductions,
    pushNotice,
  } = useTMSAdmin();
  const { can } = useModuleAccess();

  const tms = T();
  const currentTripId = id || selectedTrip || 'T07';
  // A trip opened by URL must exist (deleted trips stay gone); otherwise fall back to the first trip.
  const rawTrip = (tms.trips || []).find(t => t.id === currentTripId) || (id ? null : (tms.trips || [])[0]);

  if (!rawTrip) return <Empty description="Trip not found" />;

  const v = tms.V[rawTrip.vehicle];
  const d = tms.D[rawTrip.driver];
  const tripDriverIds = Array.isArray(rawTrip.drivers) && rawTrip.drivers.length > 0
    ? rawTrip.drivers
    : (rawTrip.driver ? [rawTrip.driver] : []);
  const tripDrivers = tripDriverIds.map(dId => tms.D[dId]).filter(Boolean);
  const tripDriverNames = tripDrivers.length > 0
    ? tripDrivers.map(dr => dr.name).join(', ')
    : (rawTrip.driverNames || (d || {}).name || rawTrip.driverName || '—');
  const c = tms.C[rawTrip.client];
  const b = tms.B[rawTrip.branch];
  const s = tms.S[rawTrip.supervisor];

  const isClosed = rawTrip.status === 'Closed';

  const fmtKm = n => (n != null && n !== '' ? Number(n).toLocaleString('en-IN') + ' km' : null);
  const fmtMoney = n => {
    if (!n && n !== 0) return null;
    const str = String(n).trim();
    if (str.startsWith('₹')) return str;
    const num = Number(str.replace(/[^\d.]/g, ''));
    return isNaN(num) ? str : '₹' + num.toLocaleString('en-IN');
  };
  // "₹34,500" / 34500 / "" → 34500 / null
  const moneyOf = (val) => {
    if (val == null || val === '') return null;
    const n = Number(String(val).replace(/[^\d.-]/g, ''));
    return isNaN(n) ? null : n;
  };

  const computedOdo =
    rawTrip.odoKm != null
      ? rawTrip.odoKm
      : rawTrip.closeKm != null && rawTrip.startKm != null && rawTrip.closeKm >= rawTrip.startKm
      ? rawTrip.closeKm - rawTrip.startKm
      : null;

  /* --------------------------------------------------------------------- */
  /* Distance variation (fixed route vs GPS vs odometer km) for this trip, */
  /* so the percentage shown here and there can never disagree.             */
  /* --------------------------------------------------------------------- */
  const thr = Number(st.variance) || 5;
  const fixedKm = Number(rawTrip.fixedKm) || 0;
  // Trips opened from the supervisor app start with gpsKm: 0 and keep it when no
  // device track ever arrives. Once the odometer shows the truck actually moved, a
  // zero GPS figure means "no GPS track", not "drove 0 km" — reading it as a
  // measurement produced a phantom −100% that swamped the real odometer variance.
  const gpsKm =
    rawTrip.gpsKm == null || (Number(rawTrip.gpsKm) === 0 && computedOdo > 0)
      ? null
      : Number(rawTrip.gpsKm);
  const hasBaseline = fixedKm > 0;

  const delta = km => (!hasBaseline || km == null ? null : Math.round(((km - fixedKm) / fixedKm) * 1000) / 10);
  const gpsDelta = delta(gpsKm);
  const odoDelta = delta(computedOdo);
  const pct = Math.max(Math.abs(gpsDelta ?? 0), Math.abs(odoDelta ?? 0));
  // Verification runs at close: an enroute trip has not covered its route yet,
  // so it is never flagged — it reads as pending until the supervisor closes it.
  const flagged = isClosed && hasBaseline && pct > thr;

  const [srcName, srcKm] =
    Math.abs(odoDelta ?? 0) >= Math.abs(gpsDelta ?? 0) ? ['Odometer', computedOdo] : ['GPS', gpsKm];
  const srcDiff = hasBaseline && srcKm != null ? srcKm - fixedKm : null;
  // Signed variance of the source that sets the headline (e.g. −95.4%), for the
  // trip record — `pct` above is the unsigned magnitude used for the threshold.
  const srcDelta = srcName === 'Odometer' ? odoDelta : gpsDelta;
  const fmtDelta = dl => (dl == null ? null : `${dl > 0 ? '+' : dl < 0 ? '−' : ''}${Math.abs(dl).toFixed(1)}%`);

  const maxKm = Math.max(1, fixedKm, gpsKm || 0, computedOdo || 0);
  const distBars = [
    ['Fixed · Maps', 'Billing reference', fixedKm || null, 'var(--kr-grey-700)', null],
    ['GPS', 'Device track', gpsKm, 'var(--color-brand)', gpsDelta],
    ['Odometer', 'Closing − opening', computedOdo, 'var(--kr-saffron-500)', odoDelta],
  ];

  // The edge colour reports the measurement itself, not a review workflow:
  // red over the threshold, green inside it, grey when there is nothing to compare yet.
  const distEdge = flagged
    ? 'var(--kr-red-600)'
    : !hasBaseline || !isClosed
    ? 'var(--kr-grey-300)'
    : 'var(--color-brand)';

  const distNote = !isClosed
    ? 'Verification runs at close. GPS distance is compared live against the fixed route.'
    : !hasBaseline
    ? 'Non-business movement. No billing reference; GPS and odometer are recorded for the audit trail.'
    : flagged
    ? `${srcName} is ${srcDiff > 0 ? '+' : ''}${srcDiff} km against the ${fixedKm.toLocaleString('en-IN')} km fixed route — over the ${thr}% threshold.`
    : `Both sources agree with the ${fixedKm.toLocaleString('en-IN')} km fixed route inside the ${thr}% threshold.`;

  const distFallback =
    gpsKm == null
      ? 'GPS missing, odometer used for distance.'
      : computedOdo == null
      ? 'Odometer not captured, GPS used for distance.'
      : 'Both sources present, odometer merged with GPS.';

  /* --------------------------------------------------------------------- */
  /* Exceptions raised against this trip                                    */
  /* --------------------------------------------------------------------- */
  const allExceptions = (tms.exceptions || []).map(x => ({ ...x, ...(excOverrides[x.id] || {}) }));
  const statusRank = { Open: 0, 'Under review': 1, Resolved: 2 };
  const tripExceptions = allExceptions
    .filter(x => x.trip === rawTrip.id)
    .sort((a, b) => (statusRank[a.status] ?? 3) - (statusRank[b.status] ?? 3));
  const openExcCount = tripExceptions.filter(x => x.status !== 'Resolved').length;

  const openException = (x) => {
    setExcSel(x.id);
    setExcAssignees(x.assigneeIds || []);
    setExcNote('');
    setDrawer({ isException: true, kicker: 'Exception ' + x.id, title: x.type });
  };

  const badge =
    rawTrip.status === 'Closed'
      ? (rawTrip.flags || []).length
        ? 'Closed · flagged'
        : 'Closed'
      : rawTrip.hoursOpen > 24
      ? 'Long open'
      : rawTrip.stage || ENROUTE_LABEL;
  const badgeBg = rawTrip.status === 'Closed' ? 'var(--st-closed-bg)' : 'var(--st-enroute-bg)';
  const badgeFg = rawTrip.status === 'Closed' ? 'var(--st-closed-fg)' : 'var(--st-enroute-fg)';

  const editTrip = () => {
    setDrawer({
      isForm: true,
      isTripEdit: true,
      isMaster: true,
      masterKey: 'trips',
      kicker: 'Edit trip record',
      title: rawTrip.number,
      saveLabel: 'Save changes',
      required: ['startKm'],
      fields: [
        ['invoice', 'Loading invoice number'],
        ['lr', 'LR number'],
        ['startKm', 'Start KM'],
        ['closeKm', 'Closing odometer'],
        ['advance', 'Advance given (₹)'],
        ['bunk', 'Bunk name'],
        ['rate', 'Diesel rate (₹/L)'],
        ['diesel', 'Diesel quantity (L)'],
        ['totalExpense', 'Total expense (₹)'],
        ['qtyLoad', 'Loading qty'],
        ['qtyUnload', 'Unloading qty'],
        ['remarks', 'Open remarks'],
        ['closeRemarks', 'Close remarks'],
        ['type', 'Trip type', ['Business', 'Non-Business']],
        ['reason', 'Non-business reason', ['Maintenance', 'Internal Movement', 'Empty Return', 'Driver Testing']],
      ],
    });
    setForm({
      id: rawTrip.id,
      invoice: rawTrip.invoice || '',
      lr: rawTrip.lr || '',
      startKm: rawTrip.startKm,
      closeKm: rawTrip.closeKm || '',
      advance: (rawTrip.advance || '').replace(/[₹\s]/g, ''),
      bunk: rawTrip.bunk || '',
      rate: rawTrip.rate || '',
      diesel: (rawTrip.diesel || '').replace(/\s*L$/i, '').trim(),
      totalExpense: (rawTrip.totalExpense || '').replace(/[₹\s]/g, ''),
      qtyLoad: rawTrip.qtyLoad || '',
      qtyUnload: rawTrip.qtyUnload || '',
      remarks: rawTrip.remarks || '',
      closeRemarks: rawTrip.closeRemarks || '',
      type: rawTrip.type,
      reason: rawTrip.reason || '',
    });
  };

  /* --------------------------------------------------------------------- */
  /* Verification actions                                                   */
  /* --------------------------------------------------------------------- */
  const stamp = () => new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const saveVerify = (patch) =>
    setTripVerify(prev => ({ ...prev, [rawTrip.id]: { ...(prev[rawTrip.id] || {}), ...patch } }));

  // Level 1 signs off a trip whose checks all passed. Nothing may edit it after this.
  const approveL1 = () => {
    setConfirm({
      title: `Approve ${rawTrip.number}?`,
      body: 'All expense checks passed. Approving sends the trip to Head Office for processing and locks the record — it cannot be edited again by anyone.',
      okLabel: 'Approve and lock',
      onOk: () => {
        saveVerify({ status: VERIFY_STATUS.APPROVED, level: VERIFY_LEVEL_1, approvedBy: VERIFY_LEVEL_1, approvedAt: stamp() });
        showToast('success', 'Trip approved', `${rawTrip.number} is locked and ready for processing.`);
      },
    });
  };

  // Diesel above the authorized limit cannot be signed off at Level 1. The
  // escalation form carries the trip's own facts, the reason for the excess, and
  // the one decision that settles it: recover the money from the driver, or not.
  const escalate = () => {
    setDrawer({
      isForm: true,
      kicker: `Escalate ${rawTrip.number}`,
      title: 'Diesel above authorized limit',
      details: [
        ['Driver', tripDriverNames || (d || {}).name || rawTrip.driverName || '—'],
        ['Vehicle', (v || {}).number || rawTrip.vehicleNumber || '—'],
        ['Route', routeLine || '—'],
        ['Authorized limit', dieselLimit != null ? `${dieselLimit.toLocaleString('en-IN')} L` : '—'],
        ['Diesel booked', dieselLitres != null ? `${dieselLitres.toLocaleString('en-IN')} L` : '—'],
        [
          'Exceeded by',
          `${(overLimit || 0).toLocaleString('en-IN')} L${overValue != null ? ` · ${fmtMoney(overValue)}` : ''}`,
          'bad',
        ],
      ],
      fields: [
        ['reason', 'Reason for the excess', 'textarea', "Record the driver's explanation for the extra diesel."],
        ['deduct', 'Deduct from salary?', ['No', 'Yes'], 'Yes recovers the excess through payroll. No writes it off and approves the trip.'],
        [
          'amount',
          'Amount to deduct (₹)',
          null,
          '0',
          { when: (f) => f.deduct === 'Yes' },
        ],
      ],
      required: (f) => (f.deduct === 'Yes' ? ['reason', 'deduct', 'amount'] : ['reason', 'deduct']),
      validate: (f) => ({
        reason: !String(f.reason || '').trim() ? 'Record why the diesel went over the limit.' : undefined,
        deduct: !f.deduct ? 'Choose whether to deduct this from the driver.' : undefined,
        amount:
          f.deduct === 'Yes' && !(Number(String(f.amount || '').replace(/[^\d.]/g, '')) > 0)
            ? 'Enter the amount to recover.'
            : undefined,
      }),
      saveLabel: (f) => (f.deduct === 'Yes' ? 'Raise deduction' : 'Approve & lock'),
      onSave: (f) => {
        const note = (f.reason || '').trim();

        // Written off: the trip is approved and the record locks.
        if (f.deduct !== 'Yes') {
          saveVerify({
            status: VERIFY_STATUS.APPROVED,
            level: VERIFY_LEVEL_2,
            reason: note,
            escalatedBy: VERIFY_LEVEL_1,
            escalatedAt: stamp(),
            approvedBy: VERIFY_LEVEL_2,
            approvedAt: stamp(),
            explanationAccepted: true,
          });
          showToast('success', 'Excess written off', `${rawTrip.number} approved and locked.`);
          return;
        }

        // Recovered: the excess goes to payroll against the driver.
        const amount = Number(String(f.amount || '').replace(/[^\d.]/g, '')) || 0;
        saveVerify({
          status: VERIFY_STATUS.DEDUCTED,
          level: VERIFY_LEVEL_2,
          reason: note,
          escalatedBy: VERIFY_LEVEL_1,
          escalatedAt: stamp(),
          decidedBy: VERIFY_LEVEL_2,
          decidedAt: stamp(),
          explanationAccepted: false,
          deduction: { amount, note, driver: rawTrip.driver, at: stamp() },
        });
        setDeductions([
          {
            id: 'SD' + Date.now(),
            trip: rawTrip.id,
            tripNumber: rawTrip.number,
            driver: rawTrip.driver,
            driverName: (d || {}).name || '—',
            branch: rawTrip.branch,
            litres: overLimit || 0,
            amount,
            note,
            raisedBy: VERIFY_LEVEL_2,
            raisedAt: stamp(),
            status: 'Pending payroll',
          },
          ...deductions,
        ]);
        showToast('danger', 'Deduction raised', `₹${amount.toLocaleString('en-IN')} to recover from ${(d || {}).name || 'the driver'}.`);
        pushNotice({
          kind: 'action',
          priority: 'Urgent',
          branch: rawTrip.branch,
          title: `Salary deduction · ${(d || {}).name || 'Driver'}`,
          body: `Diesel on ${rawTrip.number} was ${overLimit || 0} L above the authorized limit. ₹${amount.toLocaleString('en-IN')} will be recovered through payroll.`,
          rows: [
            ['Trip', rawTrip.number],
            ['Driver', (d || {}).name || '—'],
            ['Route', routeLine || '—'],
            ['Excess diesel', `${overLimit || 0} L`],
            ['Deduction', `₹${amount.toLocaleString('en-IN')}`],
            ['Reason', note],
          ],
          link: { trip: rawTrip.id },
          linkLabel: 'View trip',
        });
      },
    });
    setForm({ reason: '', deduct: 'No', amount: '' });
  };

  // Level 2 accepts the explanation: the excess is written off and the trip locks.
  const acceptExplanation = () => {
    setConfirm({
      title: `Accept the explanation for ${rawTrip.number}?`,
      body: `The excess of ${overLimit || 0} L is written off and the trip is approved for processing. The record locks permanently.`,
      okLabel: 'Accept and approve',
      onOk: () => {
        saveVerify({ status: VERIFY_STATUS.APPROVED, level: VERIFY_LEVEL_2, approvedBy: VERIFY_LEVEL_2, approvedAt: stamp(), explanationAccepted: true });
        showToast('success', 'Explanation accepted', `${rawTrip.number} approved and locked.`);
      },
    });
  };

  // Level 2 rejects it: the excess is recovered from the driver's salary.
  const rejectExplanation = () => {
    setDrawer({
      isForm: true,
      kicker: `Reject explanation · ${rawTrip.number}`,
      title: 'Raise salary deduction',
      saveLabel: 'Confirm deduction',
      required: ['amount', 'note'],
      intro: `${overLimit || 0} L over the ${dieselLimit || 0} L authorized for this route, at ₹${(dieselRate || 0).toFixed(2)}/L. The amount is pre-filled from that excess and can be changed before confirming.`,
      fields: [
        ['amount', 'Deduction amount (₹)'],
        ['note', 'Why the explanation was not accepted'],
      ],
      onSave: (f) => {
        const amount = Number(String(f.amount).replace(/[^\d.]/g, '')) || 0;
        const note = (f.note || '').trim();
        saveVerify({
          status: VERIFY_STATUS.DEDUCTED,
          level: VERIFY_LEVEL_2,
          decidedBy: VERIFY_LEVEL_2,
          decidedAt: stamp(),
          explanationAccepted: false,
          deduction: { amount, note, driver: rawTrip.driver, at: stamp() },
        });
        setDeductions([
          {
            id: 'SD' + Date.now(),
            trip: rawTrip.id,
            tripNumber: rawTrip.number,
            driver: rawTrip.driver,
            driverName: tripDriverNames || (d || {}).name || '—',
            branch: rawTrip.branch,
            litres: overLimit || 0,
            amount,
            note,
            raisedBy: VERIFY_LEVEL_2,
            raisedAt: stamp(),
            status: 'Pending payroll',
          },
          ...deductions,
        ]);
        showToast('danger', 'Deduction raised', `₹${amount.toLocaleString('en-IN')} to recover from ${(d || {}).name || 'the driver'}.`);
        pushNotice({
          kind: 'action',
          priority: 'Urgent',
          branch: rawTrip.branch,
          title: `Salary deduction · ${tripDriverNames || (d || {}).name || 'Driver'}`,
          body: `The explanation for excess diesel on ${rawTrip.number} was not accepted. ₹${amount.toLocaleString('en-IN')} will be recovered through payroll.`,
          rows: [
            ['Trip', rawTrip.number],
            ['Driver', tripDriverNames || (d || {}).name || '—'],
            ['Excess diesel', `${overLimit || 0} L`],
            ['Deduction', `₹${amount.toLocaleString('en-IN')}`],
            ['Reason', note],
          ],
          link: { trip: rawTrip.id },
          linkLabel: 'View trip',
        });
      },
    });
    setForm({ amount: overValue != null ? String(overValue) : '', note: '' });
  };

  // Expenses are signed off on their own, apart from the diesel check. The popup
  // lists every expense the supervisor filed, takes a reason, and settles whether
  // any of it is recovered from the driver's salary.
  const approveExpenses = () => {
    setDrawer({
      isForm: true,
      kicker: `Expenses · ${rawTrip.number}`,
      title: 'Approve trip expenses',
      details: [
        ['Driver', (d || {}).name || rawTrip.driverName || '—'],
        ['Vehicle', (v || {}).number || rawTrip.vehicleNumber || '—'],
        ...expenseRows.map(([label, val, , fallback]) => [label, val != null ? val : fallback]),
        ...otherExpenses.map(x => [`· ${x.name || 'Unnamed'}`, fmtMoney(Number(x.amount) || 0)]),
        ['Total expense', fmtMoney(filedTotal > 0 ? filedTotal : statedTotal || 0)],
      ],
      fields: [
        ['reason', 'Reason', 'textarea', 'Record the reason for approving these expenses.'],
        ['deduct', 'Deduct from salary?', ['No', 'Yes'], 'Yes recovers an amount through payroll. No approves the expenses as filed.'],
        ['amount', 'Amount to deduct (₹)', null, '0', { when: (f) => f.deduct === 'Yes' }],
      ],
      required: (f) => (f.deduct === 'Yes' ? ['reason', 'deduct', 'amount'] : ['reason', 'deduct']),
      validate: (f) => ({
        reason: !String(f.reason || '').trim() ? 'Record a reason.' : undefined,
        deduct: !f.deduct ? 'Choose whether to deduct from the driver.' : undefined,
        amount:
          f.deduct === 'Yes' && !(Number(String(f.amount || '').replace(/[^\d.]/g, '')) > 0)
            ? 'Enter the amount to deduct.'
            : undefined,
      }),
      saveLabel: (f) => (f.deduct === 'Yes' ? 'Raise deduction' : 'Approve expenses'),
      onSave: (f) => {
        const note = (f.reason || '').trim();
        const amount = f.deduct === 'Yes' ? Number(String(f.amount || '').replace(/[^\d.]/g, '')) || 0 : 0;
        saveVerify({ expense: { approvedBy: VERIFY_LEVEL_1, approvedAt: stamp(), reason: note, deductAmount: amount } });

        if (!amount) {
          showToast('success', 'Expenses approved', `Expenses on ${rawTrip.number} approved as filed.`);
          return;
        }

        setDeductions([
          {
            id: 'SD' + Date.now(),
            trip: rawTrip.id,
            tripNumber: rawTrip.number,
            driver: rawTrip.driver,
            driverName: tripDriverNames || (d || {}).name || '—',
            branch: rawTrip.branch,
            litres: 0,
            amount,
            note,
            raisedBy: VERIFY_LEVEL_1,
            raisedAt: stamp(),
            status: 'Pending payroll',
          },
          ...deductions,
        ]);
        showToast('danger', 'Deduction raised', `₹${amount.toLocaleString('en-IN')} to recover from ${(d || {}).name || 'the driver'}.`);
        pushNotice({
          kind: 'action',
          priority: 'Urgent',
          branch: rawTrip.branch,
          title: `Salary deduction · ${tripDriverNames || (d || {}).name || 'Driver'}`,
          body: `Expenses on ${rawTrip.number} were approved with ₹${amount.toLocaleString('en-IN')} to be recovered through payroll.`,
          rows: [
            ['Trip', rawTrip.number],
            ['Driver', tripDriverNames || (d || {}).name || '—'],
            ['Deduction', `₹${amount.toLocaleString('en-IN')}`],
            ['Reason', note],
          ],
          link: { trip: rawTrip.id },
          linkLabel: 'View trip',
        });
      },
    });
    setForm({ reason: '', deduct: 'No', amount: '' });
  };

  const askDeleteTrip = () => {
    setConfirm({
      title: `Delete trip ${rawTrip.number}?`,
      body: 'The record is removed from billing and analytics. Deletion is logged with your user and the vehicle movement remains in the GPS audit log, so no movement disappears.',
      okLabel: 'Delete trip',
      danger: true,
      onOk: () => {
        setDeleted([...deleted, rawTrip.id]);
        navTo('trips');
        showToast('danger', 'Trip deleted', `${rawTrip.number} removed. Logged in the audit trail.`);
      },
    });
  };

  const tripDist = computedOdo != null ? computedOdo : null;

  const dieselLitres =
    rawTrip.dieselLitres != null
      ? Number(rawTrip.dieselLitres)
      : rawTrip.diesel
      ? Number(String(rawTrip.diesel).replace(/[^\d.]/g, ''))
      : null;

  const dieselRate = rawTrip.rate ? Number(rawTrip.rate) : null;
  const dieselAmount =
    rawTrip.dieselTotal != null
      ? Number(rawTrip.dieselTotal)
      : dieselRate && dieselLitres
      ? Math.round(dieselRate * dieselLitres)
      : null;

  /* --------------------------------------------------------------------- */
  /* Trip expense & verification                                            */
  /* --------------------------------------------------------------------- */
  // The only diesel gate: what Head Office authorized for this trip's route in
  // the Route Master, against what the supervisor filed when closing the trip.
  const dieselLimit = routeDieselLimit(rawTrip, tms);
  // "Sriperumbudur Cryogenic Hub → Bengaluru", one leg per drop on the trip.
  const routeLine = routesOfTrip(rawTrip, tms)
    .map(r => `${(tms.L[r.from] || {}).name || r.from || '—'} → ${r.to || '—'}`)
    .join(', ')
    || ((tms.L[rawTrip.loading] || {}).name || rawTrip.loading || '—') + ' → ' + (rawTrip.unloading || '—');
  const overLimit = overLimitLitres(rawTrip, dieselLimit);
  const overValue = overLimitValue(rawTrip, dieselLimit);
  const limitSignal = overLimit == null ? null : overLimit > 0 ? 'bad' : 'good';

  const checks = runChecks(rawTrip, {
    variancePct: hasBaseline && isClosed ? pct : null,
    varianceThreshold: thr,
    dieselLimit,
  });
  const verifyRecord = tripVerify[rawTrip.id];
  const vState = verifyState(rawTrip, verifyRecord, checks);
  const canVerify = can('trips', 'verify');
  const canDecideEscalation = can('trips', 'edit') && can('trips', 'verify');
  // The record locks only once both sign-offs are in: the diesel verification
  // and the separate expense approval. Either one alone leaves it editable.
  const expenseApproved = !!verifyRecord?.expense;
  const recordLocked = vState.locked && expenseApproved;

  const vv = VERIFY_VIEW[vState.status] || VERIFY_VIEW[VERIFY_STATUS.PENDING];

  // What the supervisor filed on the close form, item by item.
  const expBreakdown = rawTrip.expBreakdown || {};
  const tollCash = expBreakdown.toll != null && expBreakdown.toll !== '' ? Number(expBreakdown.toll) : null;
  const otherExpenses = (rawTrip.otherExpenses || []).filter(x => x && (x.name || x.amount));
  const otherTotal = otherExpenses.reduce((a, x) => a + (Number(x.amount) || 0), 0);

  // The named expense boxes on the supervisor's close form: FASTag, Driver bata, Cleaner bata, RTO, Toll, Weighment.
  const hasMultipleDrivers = (Array.isArray(rawTrip.drivers) && rawTrip.drivers.length > 1) ||
    (expBreakdown.driverBatas && Object.keys(expBreakdown.driverBatas).length > 1);

  const driverBataRows = hasMultipleDrivers
    ? ((Array.isArray(rawTrip.drivers) && rawTrip.drivers.length > 0)
        ? rawTrip.drivers
        : Object.keys(expBreakdown.driverBatas || {})
      ).map((dId, idx) => {
        const dObj = tms.D[dId];
        const dName = dObj ? dObj.name : dId;
        const raw = expBreakdown.driverBatas?.[dId] ?? (idx === 0 ? expBreakdown.driverBata : null);
        const val = raw == null || raw === '' ? null : Number(raw);
        return [`Driver bata ${idx + 1} (${dName})`, val != null ? fmtMoney(val) : null, null, isClosed ? '₹0' : 'Pending'];
      })
    : [
        ['Driver bata', (() => {
          const raw = expBreakdown.driverBata;
          const val = raw == null || raw === '' ? null : Number(raw);
          return val != null ? fmtMoney(val) : null;
        })(), null, isClosed ? '₹0' : 'Pending']
      ];

  const fastagVal = expBreakdown.fastag != null && expBreakdown.fastag !== ''
    ? Number(expBreakdown.fastag)
    : expBreakdown.dieselCash != null && expBreakdown.dieselCash !== ''
    ? Number(expBreakdown.dieselCash)
    : null;

  const otherBoxRows = [
    ['Cleaner bata', 'cleanerBata'],
    ['R.T.O. & P.C. expense', 'rto'],
    ['Toll cash expense', 'toll'],
    ['Weighment expense', 'weighment'],
  ].map(([label, key]) => {
    const raw = expBreakdown[key];
    const val = raw == null || raw === '' ? null : Number(raw);
    return [label, val != null ? fmtMoney(val) : null, null, isClosed ? '₹0' : 'Pending'];
  });

  const breakdownRows = [
    ['FASTag', fastagVal != null ? fmtMoney(fastagVal) : null, null, isClosed ? '₹0' : 'Pending'],
    ...driverBataRows,
    ...otherBoxRows,
  ];

  // What the boxes and the other-expense rows add up to, which is what the
  // supervisor's "Total expense" is built from on the close form.
  let drvBataSum = 0;
  if (expBreakdown.driverBatas && Object.keys(expBreakdown.driverBatas).length > 0) {
    drvBataSum = Object.values(expBreakdown.driverBatas).reduce((a, x) => a + (Number(x) || 0), 0);
  } else {
    drvBataSum = Number(expBreakdown.driverBata) || 0;
  }
  const fastagSum = Number(expBreakdown.fastag ?? expBreakdown.dieselCash) || 0;
  const otherBoxesSum = ['cleanerBata', 'rto', 'toll', 'weighment'].reduce(
    (a, k) => a + (Number(expBreakdown[k]) || 0),
    0
  );
  const breakdownTotal = fastagSum + drvBataSum + otherBoxesSum;
  // Diesel drawn at the bunks is part of what was spent, so it is part of the total.
  const filedTotal = (dieselAmount || 0) + breakdownTotal + otherTotal;
  // Trips closed on the current form cannot disagree — the total IS this sum.
  // Older records were totalled by hand, so only a material gap is worth raising;
  // small rounding differences would otherwise flag every legacy trip.
  const statedTotal = moneyOf(rawTrip.totalExpense);
  const totalGap = statedTotal != null ? Math.abs(statedTotal - filedTotal) : 0;
  const totalMismatch =
    statedTotal != null && filedTotal > 0 && totalGap > Math.max(100, statedTotal * 0.05);

  const dieselRows = [
    [
      'Authorized limit',
      dieselLimit != null ? `${dieselLimit.toLocaleString('en-IN')} L` : null,
      null,
      dieselLimit == null ? 'Not set on this route' : null,
    ],
    [
      'Supervisor noted',
      dieselLitres != null ? `${dieselLitres.toLocaleString('en-IN')} L` : null,
      limitSignal,
    ],
    ['Diesel rate', dieselRate != null ? `₹${dieselRate.toFixed(2)} / L` : null, null],
    ['Diesel amount', dieselAmount != null ? fmtMoney(dieselAmount) : null, null],
  ];

  const expenseRows = [
    ...breakdownRows,
    [
      'Other expenses',
      otherExpenses.length ? fmtMoney(otherTotal) : null,
      null,
      isClosed ? 'None recorded' : 'Pending',
    ],
  ];

  // One stat line: label left, value right, with the limit dot when it applies.
  const statRow = ([label, val, tone, fallback], i) => (
    <Flex key={i} justify="space-between" gap={12} className="td-stat-row">
      <Typography.Text>{label}</Typography.Text>
      <Typography.Text
        strong
        className={`td-stat-value${tone === 'bad' ? ' td-stat-value--bad' : tone === 'good' ? ' td-stat-value--good' : val == null ? ' td-stat-value--empty' : ''}`}
      >
        {/* Red over the authorized limit, green inside it */}
        {val != null && (tone === 'bad' || tone === 'good') && (
          <Badge
            status={tone === 'bad' ? 'error' : 'success'}
            aria-label={tone === 'bad' ? 'Over the authorized limit' : 'Within the authorized limit'}
            title={tone === 'bad' ? 'Over the authorized limit' : 'Within the authorized limit'}
          />
        )}
        {val == null ? (fallback || (isClosed ? '—' : 'Pending')) : val}
      </Typography.Text>
    </Flex>
  );

  // Trip record, grouped the way the trip is lived: who it is for, what ran it,
  // when and how far, the paperwork, the money, and the closing notes.
  // Each row: [label, value, tone?, wide?]. A tone renders the value as a pill.
  const pending = isClosed ? '—' : 'Pending';
  const verificationText =
    rawTrip.status === 'Closed'
      ? flagged
        ? 'Variance flagged'
        : 'Within threshold'
      : rawTrip.status === 'Enroute' ? ENROUTE_LABEL : rawTrip.status || ENROUTE_LABEL;
  const recordGroups = [
    {
      title: 'Trip & client',
      rows: [
        ['Branch', (b || {}).name || rawTrip.branchName || '—'],
        ['Supervisor', (s || {}).name || rawTrip.supervisorName || '—'],
        ['Client', (c || {}).name || rawTrip.clientName || '—'],
        ['Trip type', rawTrip.type + (rawTrip.reason ? ' · ' + rawTrip.reason : '')],
        [
          'Customer(s)',
          rawTrip.unloading ||
            (Array.isArray(rawTrip.customers)
              ? rawTrip.customers.map(cid => (tms.U[cid] || {}).name).filter(Boolean).join(', ')
              : '—'),
          null,
          true,
        ],
        ['Loading location', (tms.L[rawTrip.loading] || {}).name || rawTrip.loading || '—', null, true],
      ],
    },
    {
      title: 'Vehicle & crew',
      rows: [
        ['Vehicle', (v || {}).number || rawTrip.vehicleNumber || rawTrip.vehicle || '—'],
        ['Vehicle type', (v || {}).type || rawTrip.vehicleType || '—'],
        [tripDrivers.length > 1 ? 'Drivers' : 'Driver', tripDriverNames, null, true],
      ],
    },
    {
      title: 'Timeline & distance',
      rows: [
        ['Opened at', rawTrip.opened || '—'],
        ['Closed at', rawTrip.closed || pending],
        ['Start KM', rawTrip.startKm != null ? fmtKm(rawTrip.startKm) : '—'],
        ['Closing KM', rawTrip.closeKm != null ? fmtKm(rawTrip.closeKm) : pending],
        ['Trip distance', tripDist != null ? fmtKm(tripDist) : pending],
        [
          'Variance vs fixed',
          !hasBaseline
            ? 'Not applicable'
            : !isClosed
            ? 'Pending verification at close'
            : fmtDelta(srcDelta) || '—',
          hasBaseline && isClosed && srcDelta != null ? (flagged ? 'bad' : 'good') : null,
        ],
      ],
    },
    {
      title: 'Documents & quantities',
      rows: [
        ['Loading invoice', rawTrip.invoice || pending],
        ['LR number', rawTrip.lr || '—'],
        ['Loading qty', rawTrip.qtyLoad || '—'],
        ['Unloading qty', rawTrip.qtyUnload || pending],
      ],
    },
    {
      title: 'Diesel & expense',
      rows: [
        ['Advance given', fmtMoney(rawTrip.advance) || pending],
        ['Bunk name', rawTrip.bunk || pending],
        ['Diesel rate', dieselRate ? '₹' + dieselRate.toFixed(2) + '/L' : pending],
        [
          'Diesel quantity',
          dieselLitres ? dieselLitres.toLocaleString('en-IN') + ' L' : rawTrip.diesel || pending,
        ],
        ['Diesel amount', dieselAmount ? fmtMoney(dieselAmount) : pending],
        ['Total expense', fmtMoney(rawTrip.totalExpense) || pending],
      ],
    },
    {
      title: 'Remarks & verification',
      rows: [
        ['Open remarks', rawTrip.remarks || '—', null, true],
        ['Close remarks', rawTrip.closeRemarks || pending, null, true],
        [
          'Verification status',
          verificationText,
          rawTrip.status === 'Closed' ? (flagged ? 'bad' : 'good') : 'neutral',
          true,
        ],
      ],
    },
  ];

  const lifecycle = [
    ['Loaded', (rawTrip.opened || '').split(' ').slice(0, 3).join(' '), true],
    [`Opened · ${ENROUTE_LABEL}`, `${rawTrip.opened} · Trip ID generated on save`, true],
    ['GPS monitoring', rawTrip.status === 'Enroute' ? 'Live · last fix 2 min ago' : 'Complete · 410 fixes stored', true],
    ['Closed', rawTrip.closed || 'Pending unloading', rawTrip.status === 'Closed'],
    ['Billing', rawTrip.type === 'Non-Business' ? 'Not applicable · reason recorded' : rawTrip.status === 'Closed' ? 'Ready · ' + (rawTrip.invoice || '') : 'After close', rawTrip.status === 'Closed'],
  ];

  const gpsLogs = tms.gpsLog || [];

  const scrollToExceptions = () => {
    const el = document.getElementById('trip-exceptions');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const exceptionColumns = [
    { title: 'Severity', dataIndex: 'severity', key: 'severity', render: sev => <Tag color={SEV_TAG[sev] || SEV_TAG.Low} className="td-caps-tag">{sev}</Tag> },
    { title: 'Type', dataIndex: 'type', key: 'type', onCell: () => ({ style: { whiteSpace: 'nowrap' } }), render: v => <Typography.Text strong>{v}</Typography.Text> },
    { title: 'Detail', dataIndex: 'detail', key: 'detail', onCell: () => ({ style: { minWidth: 260, maxWidth: 400 } }) },
    { title: 'Raised', dataIndex: 'raised', key: 'raised', onCell: () => ({ style: { whiteSpace: 'nowrap' } }), render: v => <Typography.Text type="secondary">{v}</Typography.Text> },
    { title: 'Assignee', dataIndex: 'assignee', key: 'assignee', onCell: () => ({ style: { whiteSpace: 'nowrap' } }) },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, x) => (
        <Tooltip title={`View and resolve ${x.type}`}>
          <Button type="text" size="small" className="tms-row-action tms-row-action--view" icon={<Eye size={16} strokeWidth={2} />} aria-label={`View and resolve ${x.type}`} onClick={() => openException(x)} />
        </Tooltip>
      ),
    },
  ];

  const gpsColumns = [
    { title: 'Time', dataIndex: 't', key: 't', render: v => <Typography.Text type="secondary" className="td-mono">{v}</Typography.Text> },
    { title: 'Event', dataIndex: 'ev', key: 'ev', render: v => <Typography.Text className="td-heading-text">{v}</Typography.Text> },
    { title: 'KM', dataIndex: 'km', key: 'km', align: 'right' },
    { title: 'Speed', dataIndex: 'speed', key: 'speed', align: 'right', onCell: () => ({ style: { whiteSpace: 'nowrap' } }), render: v => <Typography.Text type="secondary">{v} km/h</Typography.Text> },
  ];

  return (
    <Flex vertical gap={24}>
      {/* Top action row */}
      <Flex justify="space-between" align="flex-start" gap={16} wrap>
        <div>
          <Button type="link" size="small" className="td-back" onClick={() => navTo('trips')}>
            ← All trips
          </Button>
          <Flex align="center" gap={12} wrap className="td-title-row">
            <Typography.Text className="td-trip-number">{rawTrip.number}</Typography.Text>
            {/* Trip states carry their own palette (var(--st-*)), which no preset colour matches. */}
            <Tag variant="filled" className="td-caps-tag" style={{ background: badgeBg, color: badgeFg }}>
              {badge}
            </Tag>
            <Typography.Text type="secondary">
              {rawTrip.type} · {(b || {}).name} · opened by {(s || {}).name}
            </Typography.Text>
          </Flex>
        </div>
        <Space size={8} wrap>
          {recordLocked && (
            <Typography.Text strong>
              <Space size={6}><Lock size={14} /> Locked after approval</Space>
            </Typography.Text>
          )}
          {can('trips', 'edit') && !recordLocked && (
            <Button size="small" color="primary" variant="outlined" onClick={editTrip}>
              Edit record
            </Button>
          )}
          {can('trips', 'delete') && !recordLocked && (
            <Button size="small" type="text" danger onClick={askDeleteTrip}>
              Delete
            </Button>
          )}
        </Space>
      </Flex>

      {/* Attention banner: variance over threshold and / or open exceptions */}
      {(flagged || openExcCount > 0) && (
        <Alert
          type="warning"
          showIcon
          icon={<TriangleAlert size={18} />}
          className="td-attention"
          title={
            <Space size={12} wrap>
              <Typography.Text strong className="td-caps">Needs attention</Typography.Text>
              <span>
                {[
                  flagged ? `Distance variance ${pct.toFixed(1)}% exceeds the ${thr}% threshold` : null,
                  openExcCount ? `${openExcCount} open exception${openExcCount > 1 ? 's' : ''} on this trip` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </Space>
          }
          action={
            <Button type="link" size="small" className="td-attention-link" onClick={scrollToExceptions}>
              Review below ↓
            </Button>
          }
        />
      )}

      {/* Distance variation beside the status lifecycle */}
      <Row gutter={[24, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Distance variation"
            className="td-card td-card--edge"
            style={{ '--td-edge': distEdge, height: '100%' }}
          >
            {/* Three sources on one muted panel, as on the Distance Variation alerts */}
            <Flex vertical gap={8} className="td-muted-panel">
              {distBars.map(([label, role, km, color, dl], i) => (
                <div key={i} className="td-dist-row" title={role}>
                  <Typography.Text ellipsis className="td-small">{label}</Typography.Text>
                  <Progress
                    percent={km == null ? 0 : Math.round((km / maxKm) * 100)}
                    showInfo={false}
                    strokeColor={color}
                    railColor="#fff"
                    strokeLinecap="square"
                    size={{ height: 10 }}
                  />
                  <span className="td-dist-value">
                    <Typography.Text strong className="td-small">
                      {km == null ? '—' : fmtKm(km)}
                    </Typography.Text>
                    {dl != null && (
                      <Typography.Text type={Math.abs(dl) > thr ? 'danger' : undefined} className="td-dist-delta">
                        {dl > 0 ? '+' : ''}{dl.toFixed(1)}%
                      </Typography.Text>
                    )}
                  </span>
                </div>
              ))}
            </Flex>

            {/* Verdict: the headline number and what set it */}
            <Flex justify="space-between" align="center" gap={12} wrap className="td-verdict">
              {!hasBaseline ? (
                <Typography.Text strong className="td-heading-text">
                  No fixed route on this movement
                </Typography.Text>
              ) : (
                <Flex align="baseline" gap={8} wrap>
                  <span className={`td-verdict-pct${flagged ? ' td-verdict-pct--bad' : isClosed ? ' td-verdict-pct--good' : ''}`}>
                    {pct.toFixed(1)}%
                  </span>
                  <Typography.Text className="td-small">
                    {srcDiff == null
                      ? 'no reading yet'
                      : `${srcName} ${srcDiff > 0 ? '+' : ''}${srcDiff} km vs fixed${isClosed ? '' : ' so far'}`}
                  </Typography.Text>
                </Flex>
              )}
              <Button type="link" size="small" className="td-link-sm" onClick={() => navTo('settings')}>
                Threshold {thr}% · Settings →
              </Button>
            </Flex>

            <Typography.Paragraph className="td-note">
              {distNote} {distFallback}
            </Typography.Paragraph>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Status lifecycle" className="td-card" style={{ height: '100%' }}>
            <Timeline
              className="td-lifecycle"
              items={lifecycle.map(([label, meta, done]) => ({
                color: done ? 'var(--color-brand)' : 'gray',
                content: (
                  <Flex vertical>
                    <Typography.Text strong type={done ? undefined : 'secondary'} className={done ? 'td-heading-text' : undefined}>
                      {label}
                    </Typography.Text>
                    <Typography.Text type="secondary" className="td-small">{meta}</Typography.Text>
                  </Flex>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* Exceptions raised on this trip */}
      {can('exceptions', 'view') && (
        <Card
          id="trip-exceptions"
          className="td-card td-scroll-target"
          styles={{ body: { padding: 0 } }}
          title={
            <Space size={8} wrap>
              Exceptions
              {tripExceptions.length > 0 && (
                <Typography.Text type="secondary" className="td-head-count">
                  {openExcCount} open of {tripExceptions.length}
                </Typography.Text>
              )}
            </Space>
          }
        >
          {tripExceptions.length === 0 ? (
            <Empty
              className="td-empty"
              image={<CircleCheck size={26} color="var(--color-brand)" />}
              description={
                <Flex vertical gap={4} align="center">
                  <Typography.Text strong className="td-empty-title">No exceptions on this trip</Typography.Text>
                  <Typography.Text type="secondary">Nothing has been flagged against {rawTrip.number}.</Typography.Text>
                </Flex>
              }
            />
          ) : (
            <Table
              columns={exceptionColumns}
              dataSource={tripExceptions}
              rowKey="id"
              tableLayout="auto"
              scroll={{ x: 780 }}
              pagination={false}
            />
          )}
        </Card>
      )}

      {/* Full-width trip record: grouped panels, 3 across on desktop, 2 on tablet, 1 on mobile */}
      <Card title="Trip record" className="td-card" styles={{ body: { padding: 0 } }}>
        <div className="td-rec-groups">
          {recordGroups.map(group => (
            <div key={group.title} className="td-rec-group">
              <Descriptions
                title={<span className="td-verify-head">{group.title}</span>}
                layout="vertical"
                colon={false}
                size="small"
                column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 }}
                className="td-rec-fields"
                items={group.rows.map(([k, val, tone, wide]) => ({
                  key: k,
                  label: k,
                  span: wide ? 'filled' : 1,
                  children: tone ? (
                    <Tag color={TONE_TAG[tone]} className="td-rec-pill">{val || '—'}</Tag>
                  ) : (
                    val || '—'
                  ),
                }))}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Trip expense & verification — the approval layer before Head Office processes the trip */}
      <Card
        title="Trip expense & verification"
        className="td-card td-card--edge"
        style={{ '--td-edge': vv.edge }}
        styles={{ body: { padding: 0 } }}
        extra={
          <Tag color={vv.tag} icon={recordLocked ? <Lock size={12} /> : null} className="td-caps-tag">
            {vState.status}
          </Tag>
        }
      >
        <div className="td-verify-grid">
          {/* Left — the diesel decision: the limit, what was booked, the verdict */}
          <div className="td-verify-pane">
            <h3 className="td-verify-head">Diesel</h3>
            <Flex vertical>
              {dieselRows.map(statRow)}
            </Flex>

            <Flex vertical gap={10} className="td-verify-after">
              {!isClosed ? (
                <Typography.Paragraph className="td-note td-note--flush">
                  The diesel check runs once the supervisor closes the trip and files the diesel entry.
                </Typography.Paragraph>
              ) : dieselLimit == null ? (
                <Typography.Paragraph className="td-note td-note--flush">
                  No authorized diesel limit is set on this trip&rsquo;s route. Set one in the Route Master to check it.
                </Typography.Paragraph>
              ) : (
                <Alert
                  type={overLimit > 0 ? 'error' : 'success'}
                  showIcon
                  icon={<Fuel size={20} />}
                  className="td-verdict-alert"
                  title={
                    <span className="td-verdict-alert-title">
                      {overLimit > 0
                        ? `${overLimit.toLocaleString('en-IN')} L over the limit`
                        : 'Within the authorized limit'}
                    </span>
                  }
                  description={
                    <>
                      {dieselLitres.toLocaleString('en-IN')} L booked against an authorized{' '}
                      {dieselLimit.toLocaleString('en-IN')} L
                      {overLimit > 0 && overValue != null ? ` — ${fmtMoney(overValue)} at ₹${dieselRate.toFixed(2)}/L` : ''}.
                    </>
                  }
                />
              )}

              {/* Driver's explanation banner moved below diesel over limit message */}
              {isClosed && verifyRecord?.reason && (
                <Alert
                  type="warning"
                  showIcon
                  icon={<TriangleAlert size={20} />}
                  className="td-verdict-alert"
                  title={<span className="td-verdict-alert-title td-verdict-alert-title--sm">Driver&rsquo;s explanation</span>}
                  description={
                    <>
                      {verifyRecord.reason}
                      {verifyRecord.escalatedBy && (
                        <span className="td-escalated">
                          Escalated by {verifyRecord.escalatedBy} · {verifyRecord.escalatedAt}
                        </span>
                      )}
                    </>
                  }
                />
              )}
            </Flex>
          </div>

          {/* Right — what the trip cost, as the supervisor filed it box by box */}
          <div className="td-verify-pane">
            <h3 className="td-verify-head">Expenses filed at close</h3>
            <Flex vertical>
              {expenseRows.map(statRow)}
            </Flex>

            {/* The itemised extras behind the "Other expenses" total */}
            {otherExpenses.length > 0 && (
              <div className="td-muted-panel td-other-exp">
                <Typography.Text strong className="td-caps td-other-exp-head">
                  Other expenses, itemised
                </Typography.Text>
                {otherExpenses.map((x, i) => (
                  <Flex key={i} justify="space-between" gap={12} className="td-other-exp-row">
                    <Typography.Text ellipsis>{x.name || 'Unnamed'}</Typography.Text>
                    <Typography.Text strong className="td-nowrap">{fmtMoney(Number(x.amount) || 0)}</Typography.Text>
                  </Flex>
                ))}
              </div>
            )}

            {/* Total expense — diesel plus every box above, as the close form added it up */}
            <Flex justify="space-between" align="center" gap={12} className="td-total">
              <span className="td-total-label">Total expense</span>
              <strong className="td-total-value">
                {isClosed ? fmtMoney(filedTotal > 0 ? filedTotal : statedTotal || 0) : 'Pending'}
              </strong>
            </Flex>

            {/* Older trips were closed before the itemised boxes existed, so the
                figure the supervisor typed can differ from what the boxes add to. */}
            {totalMismatch && (
              <Typography.Paragraph className="td-mismatch">
                The supervisor filed {fmtMoney(statedTotal)} as the total, but the itemised boxes add up to {fmtMoney(filedTotal)}.
              </Typography.Paragraph>
            )}

            {/* Expense sign-off, separate from the diesel decision on the left. */}
            {isClosed && (verifyRecord?.expense ? (
              <Alert
                type={verifyRecord.expense.deductAmount ? 'error' : 'success'}
                showIcon
                className="td-verify-after"
                title={verifyRecord.expense.deductAmount
                  ? `Expenses approved · ${fmtMoney(verifyRecord.expense.deductAmount)} to deduct from salary`
                  : 'Expenses approved'}
                description={`${verifyRecord.expense.reason} — ${verifyRecord.expense.approvedBy} · ${verifyRecord.expense.approvedAt}`}
              />
            ) : canVerify && (
              <Flex justify="flex-end" className="td-verify-after">
                <Button type="primary" icon={<ShieldCheck size={15} />} onClick={approveExpenses}>
                  Approve expenses
                </Button>
              </Flex>
            ))}
          </div>
        </div>

        {/* Workflow trail + the actions available at this level */}
        {isClosed && (
          <div className="td-verify-foot">
            {verifyRecord?.deduction && (
              <Alert
                type="error"
                className="td-deduction"
                title={
                  <>
                    <strong>{fmtMoney(verifyRecord.deduction.amount)} to recover from {tripDriverNames || (d || {}).name || 'the driver'}.</strong>{' '}
                    {verifyRecord.deduction.note}
                  </>
                }
                description={`Raised by ${verifyRecord.decidedBy} · ${verifyRecord.decidedAt} · sent to payroll`}
              />
            )}

            {vState.locked ? (
              <Flex align="center" gap={8}>
                {recordLocked && <Lock size={15} className="td-flex-none" />}
                <Typography.Text>
                  {verifyRecord?.approvedAt
                    ? `Diesel approved by ${verifyRecord.approvedBy} on ${verifyRecord.approvedAt}. `
                    : ''}
                  {recordLocked
                    ? 'Expenses approved too — this record is locked and can no longer be edited or deleted.'
                    : 'The record locks once the expenses are approved as well.'}
                </Typography.Text>
              </Flex>
            ) : (
              <Flex align="center" gap={10} wrap>
                {vState.canApproveL1 && canVerify && (
                  <Button type="primary" icon={<ShieldCheck size={15} />} onClick={approveL1}>
                    Approve &amp; lock
                  </Button>
                )}
                {vState.canEscalate && canVerify && (
                  <Button onClick={escalate}>
                    Escalate to {VERIFY_LEVEL_2}
                  </Button>
                )}
                {vState.canDecideL2 && canDecideEscalation && (
                  <>
                    <Button type="primary" icon={<ShieldCheck size={15} />} onClick={acceptExplanation}>
                      Accept &amp; approve
                    </Button>
                    <Button danger onClick={rejectExplanation}>
                      Reject &middot; deduct from salary
                    </Button>
                  </>
                )}
                <Typography.Text type={vState.overLimit ? 'danger' : undefined} className="td-hint">
                  {(vState.overLimit && vv.hintOver) || vv.hint}
                </Typography.Text>
              </Flex>
            )}
          </div>
        )}
      </Card>

      <Card
        title="GPS log"
        className="td-card"
        styles={{ body: { padding: 0 } }}
        extra={<Typography.Text type="secondary" className="td-small">Stored separately for route replay</Typography.Text>}
      >
        <Table
          columns={gpsColumns}
          dataSource={gpsLogs.map((g, i) => ({ ...g, _key: i }))}
          rowKey="_key"
          tableLayout="auto"
          scroll={{ x: 480 }}
          pagination={gpsLogs.length > 0 ? {
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (total, [from, to]) => `Showing ${from} to ${to} of ${total} GPS events`,
          } : false}
        />
      </Card>
    </Flex>
  );
};

export default TripDetail;
