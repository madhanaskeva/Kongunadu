import React from 'react';
import { useParams } from 'react-router-dom';
import { CircleCheck, CircleX, Fuel, Lock, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { Pagination, usePagination } from '../../../components/common/Pagination';
import { RowActions } from '../../../components/common/RowActions';
import { ENROUTE_LABEL } from '../../../utils/tripStatus';
import {
  VERIFY_STATUS, VERIFY_LEVEL_1, VERIFY_LEVEL_2,
  runChecks, verifyState,
  routeDieselLimit, overLimitLitres, overLimitValue,
} from '../../../utils/tripVerification';
import './tripDetail.css';

const sectionTitle = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  fontSize: '15px',
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  color: 'var(--text-heading)',
};

const cardStyle = {
  background: '#fff',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
};

const thStyle = (align) => ({
  padding: '10px 16px',
  fontFamily: 'var(--font-display)',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--kr-grey-700)',
  whiteSpace: 'nowrap',
  textAlign: align || 'left',
});

const actionBtn = {
  all: 'unset',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  height: '36px',
  boxSizing: 'border-box',
  padding: '0 16px',
  borderRadius: 'var(--radius-md)',
  fontSize: '13.5px',
  fontWeight: 700,
};
const btnPrimary = { ...actionBtn, background: 'var(--kr-green-700)', color: '#fff' };
const btnOutline = { ...actionBtn, border: '1px solid var(--border-strong)', color: 'var(--text-heading)' };
const btnDanger = { ...actionBtn, border: '1px solid var(--kr-red-600)', color: 'var(--kr-red-700)' };

// Badge colour and the line explaining what is expected next, per workflow state.
const VERIFY_VIEW = {
  [VERIFY_STATUS.NOT_READY]: {
    bg: 'var(--kr-grey-100)', fg: 'var(--kr-grey-700)', edge: 'var(--kr-grey-300)',
    hint: 'Expenses are filed when the supervisor closes the trip.',
  },
  [VERIFY_STATUS.PENDING]: {
    bg: 'var(--color-hazard-soft)', fg: '#7A4300', edge: 'var(--kr-saffron-500)',
    hint: 'Waiting on Level 1 · Verification Team.',
    hintOver: 'Diesel is above the authorized limit — Level 1 cannot sign this off.',
  },
  [VERIFY_STATUS.ESCALATED]: {
    bg: 'var(--kr-red-100)', fg: 'var(--kr-red-800)', edge: 'var(--kr-red-600)',
    hint: 'Level 1 could not approve this. Waiting on a Level 2 decision.',
  },
  [VERIFY_STATUS.APPROVED]: {
    bg: 'var(--kr-green-100)', fg: 'var(--kr-green-800)', edge: 'var(--color-brand)',
    hint: 'Approved and locked.',
  },
  [VERIFY_STATUS.DEDUCTED]: {
    bg: 'var(--kr-red-100)', fg: 'var(--kr-red-800)', edge: 'var(--kr-red-600)',
    hint: 'Deduction raised and sent to payroll.',
  },
};

const SEV_COLORS = {
  High: ['var(--kr-red-100)', 'var(--kr-red-800)'],
  Medium: ['var(--color-hazard-soft)', '#7A4300'],
  Low: ['var(--kr-grey-100)', 'var(--kr-grey-700)'],
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
  const gpsPg = usePagination(tms.gpsLog || []);
  const currentTripId = id || selectedTrip || 'T07';
  // A trip opened by URL must exist (deleted trips stay gone); otherwise fall back to the first trip.
  const rawTrip = (tms.trips || []).find(t => t.id === currentTripId) || (id ? null : (tms.trips || [])[0]);

  if (!rawTrip) return <div style={{ padding: '24px' }}>Trip not found</div>;

  const v = tms.V[rawTrip.vehicle];
  const d = tms.D[rawTrip.driver];
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

  const computedOdo =
    rawTrip.odoKm != null
      ? rawTrip.odoKm
      : rawTrip.closeKm != null && rawTrip.startKm != null && rawTrip.closeKm >= rawTrip.startKm
      ? rawTrip.closeKm - rawTrip.startKm
      : null;

  /* --------------------------------------------------------------------- */
  /* Distance variation — the same maths the fleet-wide Distance page uses, */
  /* so the percentage shown here and there can never disagree.             */
  /* --------------------------------------------------------------------- */
  const thr = Number(st.variance) || 5;
  const fixedKm = Number(rawTrip.fixedKm) || 0;
  const gpsKm = rawTrip.gpsKm;
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
    .map(x => {
      const [sevBg, sevFg] = SEV_COLORS[x.severity] || SEV_COLORS.Low;
      return { ...x, sevBg, sevFg };
    })
    .sort((a, b) => (statusRank[a.status] ?? 3) - (statusRank[b.status] ?? 3));
  const openExcCount = tripExceptions.filter(x => x.status !== 'Resolved').length;
  // Vehicle-level exceptions (idle, radius breach, hidden km between trips) carry no trip id,
  // so they can only be reached from the fleet-wide Exceptions page.
  const vehicleExcCount = allExceptions.filter(
    x => x.vehicle === rawTrip.vehicle && !x.trip && x.status !== 'Resolved'
  ).length;

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

  // A trip that failed a check cannot be signed off at Level 1; it goes up with
  // the driver's explanation attached.
  const escalate = () => {
    setDrawer({
      isForm: true,
      kicker: `Escalate ${rawTrip.number}`,
      title: 'Send to Administrator',
      saveLabel: 'Escalate',
      required: ['reason'],
      intro: `Diesel is ${overLimit || 0} L above the ${dieselLimit || 0} L authorized for this route — ₹${(overValue || 0).toLocaleString('en-IN')} at this trip's rate. Record the driver's explanation for the excess.`,
      fields: [['reason', "Driver's explanation for the excess"]],
      onSave: (f) => {
        saveVerify({
          status: VERIFY_STATUS.ESCALATED,
          level: VERIFY_LEVEL_2,
          reason: (f.reason || '').trim(),
          escalatedBy: VERIFY_LEVEL_1,
          escalatedAt: stamp(),
          failed: vState.failed.map(c => c.label),
        });
        showToast('info', 'Escalated to Administrator', `${rawTrip.number} is waiting on a Level 2 decision.`);
        pushNotice({
          kind: 'action',
          priority: 'Urgent',
          branch: rawTrip.branch,
          title: `Trip escalated · ${rawTrip.number}`,
          body: `Verification found ${vState.failed.length} failed check on this trip. Awaiting a Level 2 decision.`,
          rows: [
            ['Trip', rawTrip.number],
            ['Vehicle', (v || {}).number || '—'],
            ['Driver', (d || {}).name || '—'],
            ['Failed checks', vState.failed.map(c => c.label).join(', ')],
            ["Driver's explanation", (f.reason || '').trim()],
          ],
          link: { trip: rawTrip.id },
          linkLabel: 'View trip',
        });
      },
    });
    setForm({ reason: '' });
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
          body: `The explanation for excess diesel on ${rawTrip.number} was not accepted. ₹${amount.toLocaleString('en-IN')} will be recovered through payroll.`,
          rows: [
            ['Trip', rawTrip.number],
            ['Driver', (d || {}).name || '—'],
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

  const vv = VERIFY_VIEW[vState.status] || VERIFY_VIEW[VERIFY_STATUS.PENDING];

  const expenseRows = [
    [
      'Authorized diesel limit',
      dieselLimit != null ? `${dieselLimit.toLocaleString('en-IN')} L` : null,
      null,
      dieselLimit == null ? 'Not set on this route' : null,
    ],
    [
      'Supervisor noted diesel quantity',
      dieselLitres != null ? `${dieselLitres.toLocaleString('en-IN')} L` : null,
      limitSignal,
    ],
  ];

  const tripRecords = [
    ['Branch', (b || {}).name || rawTrip.branchName || '—'],
    ['Supervisor', (s || {}).name || rawTrip.supervisorName || '—'],
    ['Client', (c || {}).name || rawTrip.clientName || '—'],
    [
      'Customer(s)',
      rawTrip.unloading ||
        (Array.isArray(rawTrip.customers)
          ? rawTrip.customers.map(cid => (tms.U[cid] || {}).name).filter(Boolean).join(', ')
          : '—'),
    ],
    ['Vehicle', (v || {}).number || rawTrip.vehicleNumber || rawTrip.vehicle || '—'],
    ['Vehicle type', (v || {}).type || rawTrip.vehicleType || '—'],
    ['Driver', (d || {}).name || rawTrip.driverName || '—'],
    ['Trip type', rawTrip.type + (rawTrip.reason ? ' · ' + rawTrip.reason : '')],
    ['Loading location', (tms.L[rawTrip.loading] || {}).name || rawTrip.loading || '—'],
    ['Opened at', rawTrip.opened || '—'],
    ['Start KM', rawTrip.startKm != null ? fmtKm(rawTrip.startKm) : '—'],
    ['Closing KM', rawTrip.closeKm != null ? fmtKm(rawTrip.closeKm) : isClosed ? '—' : 'Pending'],
    ['Trip distance', tripDist != null ? fmtKm(tripDist) : isClosed ? '—' : 'Pending'],
    [
      'Variance vs fixed',
      !hasBaseline ? 'Not applicable' : isClosed ? `${pct.toFixed(1)}%` : 'Pending verification at close',
      flagged ? { bg: 'var(--color-hazard-soft)', color: '#7A4300' } : null,
    ],
    ['Loading invoice', rawTrip.invoice || (isClosed ? '—' : 'Pending')],
    ['LR number', rawTrip.lr || '—'],
    ['Advance given', fmtMoney(rawTrip.advance) || (isClosed ? '—' : 'Pending')],
    ['Bunk name', rawTrip.bunk || (isClosed ? '—' : 'Pending')],
    ['Diesel rate', dieselRate ? '₹' + dieselRate.toFixed(2) + '/L' : isClosed ? '—' : 'Pending'],
    [
      'Diesel quantity',
      dieselLitres
        ? dieselLitres.toLocaleString('en-IN') + ' L'
        : rawTrip.diesel || (isClosed ? '—' : 'Pending'),
    ],
    ['Diesel amount', dieselAmount ? fmtMoney(dieselAmount) : isClosed ? '—' : 'Pending'],
    ['Total expense', fmtMoney(rawTrip.totalExpense) || (isClosed ? '—' : 'Pending')],
    ['Loading qty', rawTrip.qtyLoad || '—'],
    ['Unloading qty', rawTrip.qtyUnload || (isClosed ? '—' : 'Pending')],
    ['Open remarks', rawTrip.remarks || '—'],
    ['Close remarks', rawTrip.closeRemarks || (isClosed ? '—' : 'Pending')],
    ['Closed at', rawTrip.closed || (isClosed ? '—' : 'Pending')],
    [
      'Verification status',
      rawTrip.status === 'Closed'
        ? flagged
          ? 'Variance flagged'
          : 'Within threshold'
        : rawTrip.status === 'Enroute' ? ENROUTE_LABEL : rawTrip.status || ENROUTE_LABEL,
      flagged ? { bg: 'var(--color-hazard-soft)', color: '#7A4300' } : null,
    ],
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <button
            onClick={() => navTo('trips')}
            style={{ all: 'unset', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--text-brand)' }}
          >
            ← All trips
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)' }}>
              {rawTrip.number}
            </span>
            <span
              style={{
                display: 'inline-flex',
                fontFamily: 'var(--font-display)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                background: badgeBg,
                color: badgeFg,
              }}
            >
              {badge}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              {rawTrip.type} · {(b || {}).name} · opened by {(s || {}).name}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {vState.locked && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--kr-grey-700)' }}>
              <Lock size={14} /> Locked after approval
            </span>
          )}
          {can('trips', 'edit') && !vState.locked && (
            <button
              onClick={editTrip}
              style={{
                all: 'unset',
                cursor: 'pointer',
                height: '32px',
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--color-brand)',
              }}
            >
              Edit record
            </button>
          )}
          {can('trips', 'delete') && !vState.locked && (
            <button
              onClick={askDeleteTrip}
              style={{
                all: 'unset',
                cursor: 'pointer',
                height: '32px',
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--kr-red-700)',
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Attention banner: variance over threshold and / or open exceptions */}
      {(flagged || openExcCount > 0) && (
        <div
          role="alert"
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'var(--color-hazard-soft)',
            borderRadius: 'var(--radius-md)',
            color: '#7A4300',
            fontSize: '14px',
            flexWrap: 'wrap',
          }}
        >
          <TriangleAlert size={18} style={{ flex: 'none' }} />
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Needs attention
          </strong>
          <span>
            {[
              flagged ? `Distance variance ${pct.toFixed(1)}% exceeds the ${thr}% threshold` : null,
              openExcCount ? `${openExcCount} open exception${openExcCount > 1 ? 's' : ''} on this trip` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
          <button
            onClick={scrollToExceptions}
            style={{ all: 'unset', cursor: 'pointer', marginLeft: 'auto', fontWeight: 700, color: '#7A4300', whiteSpace: 'nowrap' }}
          >
            Review below ↓
          </button>
        </div>
      )}

      {/* Distance variation beside the status lifecycle */}
      <div className="td-summary-grid">
        <section style={{ ...cardStyle, borderLeft: `4px solid ${distEdge}`, padding: '18px' }}>
          <div style={{ marginBottom: '14px' }}>
            <h2 style={sectionTitle}>Distance variation</h2>
          </div>

          {/* Three sources on one muted panel, as on the Distance Variation alerts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)' }}>
            {distBars.map(([label, role, km, color, dl], i) => (
              <div key={i} className="td-dist-row" title={role}>
                <span style={{ fontSize: '13px', color: 'var(--kr-grey-700)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
                <span style={{ height: '10px', background: '#fff', borderRadius: '2px', overflow: 'hidden' }}>
                  <span
                    style={{
                      display: 'block',
                      height: '100%',
                      width: km == null ? '0%' : Math.round((km / maxKm) * 100) + '%',
                      background: color,
                      transition: 'width var(--dur-base)',
                    }}
                  />
                </span>
                <span style={{ textAlign: 'right', minWidth: 0, whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>
                    {km == null ? '—' : fmtKm(km)}
                  </span>
                  {dl != null && (
                    <span style={{ marginLeft: '6px', fontSize: '12px', fontWeight: 600, color: Math.abs(dl) > thr ? 'var(--kr-red-700)' : 'var(--kr-grey-700)' }}>
                      {dl > 0 ? '+' : ''}{dl.toFixed(1)}%
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Verdict: the headline number and what set it */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-default)',
            }}
          >
            {!hasBaseline ? (
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>
                No fixed route on this movement
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '22px',
                    lineHeight: 1,
                    color: flagged ? 'var(--kr-red-700)' : isClosed ? 'var(--kr-green-800)' : 'var(--kr-grey-700)',
                  }}
                >
                  {pct.toFixed(1)}%
                </span>
                <span style={{ fontSize: '13px', color: 'var(--kr-grey-700)' }}>
                  {srcDiff == null
                    ? 'no reading yet'
                    : `${srcName} ${srcDiff > 0 ? '+' : ''}${srcDiff} km vs fixed${isClosed ? '' : ' so far'}`}
                </span>
              </span>
            )}
            <button
              onClick={() => navTo('settings')}
              style={{ all: 'unset', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'var(--text-brand)', whiteSpace: 'nowrap' }}
            >
              Threshold {thr}% · Settings →
            </button>
          </div>

          <p style={{ margin: '10px 0 0', fontSize: '13px', color: 'var(--kr-grey-700)', lineHeight: 1.5 }}>
            {distNote} {distFallback}
          </p>
        </section>

        <section style={{ ...cardStyle, padding: '18px' }}>
          <h2 style={{ ...sectionTitle, marginBottom: '14px' }}>Status lifecycle</h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {lifecycle.map(([label, meta, done], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '16px 1fr', gap: '12px', minHeight: '52px' }}>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: done ? 'var(--color-brand)' : '#fff',
                      border: `2px solid ${done ? 'var(--color-brand)' : 'var(--border-strong)'}`,
                      boxSizing: 'border-box',
                      marginTop: '4px',
                      flex: 'none',
                    }}
                  />
                  {i < lifecycle.length - 1 && <span style={{ flex: 1, width: '2px', background: 'var(--border-default)' }} />}
                </span>
                <span style={{ paddingBottom: '14px' }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: '14px', color: done ? 'var(--text-heading)' : 'var(--text-muted)' }}>
                    {label}
                  </span>
                  <span style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)' }}>{meta}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Exceptions raised on this trip */}
      {can('exceptions', 'view') && (
        <section id="trip-exceptions" style={{ ...cardStyle, overflow: 'hidden', scrollMarginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '14px 18px', borderBottom: '1px solid var(--border-default)' }}>
            <h2 style={sectionTitle}>
              Exceptions
              {tripExceptions.length > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>
                  {openExcCount} open of {tripExceptions.length}
                </span>
              )}
            </h2>
            <button
              onClick={() => navTo('exceptions')}
              style={{ all: 'unset', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--text-brand)', whiteSpace: 'nowrap' }}
            >
              All exceptions →
            </button>
          </div>

          {tripExceptions.length === 0 ? (
            <div style={{ padding: '36px 24px', textAlign: 'center' }}>
              <CircleCheck size={26} style={{ color: 'var(--color-brand)' }} />
              <div style={{ marginTop: '8px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: 'var(--text-heading)' }}>
                No exceptions on this trip
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                Nothing has been flagged against {rawTrip.number}.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '780px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: 'var(--surface-muted)' }}>
                    <th style={thStyle()}>Severity</th>
                    <th style={thStyle()}>Type</th>
                    <th style={thStyle()}>Detail</th>
                    <th style={thStyle()}>Raised</th>
                    <th style={thStyle()}>Assignee</th>
                    <th style={thStyle('center')}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tripExceptions.map(x => (
                    <tr
                      key={x.id}
                      style={{ borderTop: '1px solid var(--border-default)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-muted)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            fontFamily: 'var(--font-display)',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: x.sevBg,
                            color: x.sevFg,
                          }}
                        >
                          {x.severity}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                        {x.type}
                      </td>
                      <td style={{ padding: '12px 16px', minWidth: '260px', maxWidth: '400px', color: 'var(--text-body)' }}>
                        {x.detail}
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{x.raised}</td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{x.assignee}</td>
                      <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                        <RowActions
                          onView={() => openException(x)}
                          viewLabel={`View and resolve ${x.type}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {vehicleExcCount > 0 && (
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-default)', background: 'var(--surface-muted)', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <span>
                {vehicleExcCount} more open exception{vehicleExcCount > 1 ? 's' : ''} on {(v || {}).number || 'this vehicle'}{' '}
                {vehicleExcCount > 1 ? 'are' : 'is'} not linked to a trip.
              </span>
              <button
                onClick={() => navTo('exceptions')}
                style={{ all: 'unset', cursor: 'pointer', fontWeight: 700, color: 'var(--text-brand)', whiteSpace: 'nowrap' }}
              >
                View them →
              </button>
            </div>
          )}
        </section>
      )}

      {/* Full-width trip record: 4 columns on desktop, 2 on tablet, 1 on mobile */}
      <section style={{ ...cardStyle, overflow: 'hidden' }}>
        <h2 style={{ ...sectionTitle, padding: '14px 18px', borderBottom: '1px solid var(--border-default)' }}>
          Trip record
        </h2>
        <div className="td-record-grid">
          {tripRecords.map(([k, val, styleObj], i) => (
            <div key={i} style={{ background: styleObj?.bg || '#fff' }}>
              <div className="td-record-label">{k}</div>
              <div className="td-record-value" style={styleObj?.color ? { color: styleObj.color } : undefined}>
                {val || '—'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trip expense & verification — the approval layer before Head Office processes the trip */}
      <section style={{ ...cardStyle, borderLeft: `4px solid ${vv.edge}`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '14px 18px', borderBottom: '1px solid var(--border-default)' }}>
          <h2 style={sectionTitle}>Trip expense &amp; verification</h2>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '4px 9px',
              borderRadius: 'var(--radius-sm)',
              background: vv.bg,
              color: vv.fg,
              whiteSpace: 'nowrap',
            }}
          >
            {vState.locked && <Lock size={12} />}
            {vState.status}
          </span>
        </div>

        {/* Over the diesel limit Head Office authorized for this route */}
        {overLimit > 0 && (
          <div
            role="alert"
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              padding: '12px 18px',
              background: 'var(--kr-red-100)',
              color: 'var(--kr-red-800)',
              fontSize: '14px',
              lineHeight: 1.5,
            }}
          >
            <Fuel size={18} style={{ flex: 'none', marginTop: '1px' }} />
            <span>
              <strong>Diesel is above the authorized limit for this route.</strong>{' '}
              The supervisor booked {dieselLitres.toLocaleString('en-IN')} L against an authorized{' '}
              {dieselLimit.toLocaleString('en-IN')} L — {overLimit.toLocaleString('en-IN')} L over
              {dieselRate ? `, worth ${fmtMoney(Math.round(overLimit * dieselRate))} at ₹${dieselRate.toFixed(2)}/L` : ''}.
              Approve &amp; lock is withdrawn; escalate it to {VERIFY_LEVEL_2} with the driver&rsquo;s explanation.
            </span>
          </div>
        )}

        <div className="td-verify-grid">
          {/* Expense figures */}
          <div style={{ padding: '16px 18px' }}>
            <h3 className="td-verify-head">Expenses</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {expenseRows.map(([label, val, tone, fallback], i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '9px 0',
                    borderBottom: i === expenseRows.length - 1 ? 'none' : '1px solid var(--border-default)',
                    fontSize: '13.5px',
                  }}
                >
                  <span style={{ color: 'var(--kr-grey-700)' }}>{label}</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      color: tone === 'bad' ? 'var(--kr-red-700)'
                        : tone === 'good' ? 'var(--kr-green-800)'
                        : val == null ? 'var(--kr-grey-500)' : 'var(--text-heading)',
                    }}
                  >
                    {/* Red over the authorized limit, green inside it */}
                    {val != null && (tone === 'bad' || tone === 'good') && (
                      <span
                        aria-label={tone === 'bad' ? 'Over the authorized limit' : 'Within the authorized limit'}
                        title={tone === 'bad' ? 'Over the authorized limit' : 'Within the authorized limit'}
                        style={{
                          flex: 'none',
                          width: '9px',
                          height: '9px',
                          borderRadius: '50%',
                          background: tone === 'bad' ? 'var(--kr-red-600)' : 'var(--kr-green-600)',
                          boxShadow: `0 0 0 3px ${tone === 'bad' ? 'rgba(217,22,25,0.18)' : 'rgba(0,98,63,0.16)'}`,
                        }}
                      />
                    )}
                    {val == null ? (fallback || (isClosed ? '—' : 'Pending')) : val}
                  </span>
                </div>
              ))}
            </div>

          </div>

          {/* Validation results */}
          <div style={{ padding: '16px 18px' }}>
            <h3 className="td-verify-head">Validation</h3>
            {!isClosed ? (
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--kr-grey-700)', lineHeight: 1.55 }}>
                Validation runs once the supervisor closes the trip and files the diesel and expense entries.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {checks.map(chk => {
                  const [Icon, color] =
                    chk.ok === true ? [CircleCheck, 'var(--kr-green-700)']
                      : chk.ok === false ? [CircleX, 'var(--kr-red-600)']
                      : [CircleCheck, 'var(--kr-grey-300)'];
                  return (
                    <div key={chk.key} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <Icon size={17} style={{ flex: 'none', marginTop: '1px', color }} />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: chk.ok === false ? 'var(--kr-red-700)' : 'var(--text-heading)' }}>
                          {chk.label}
                        </span>
                        <span style={{ display: 'block', fontSize: '12.5px', color: 'var(--kr-grey-700)' }}>{chk.detail}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Workflow trail + the actions available at this level */}
        {isClosed && (
          <div style={{ borderTop: '1px solid var(--border-default)', padding: '14px 18px', background: 'var(--surface-muted)' }}>
            {verifyRecord?.reason && (
              <div style={{ marginBottom: '12px', fontSize: '13.5px', lineHeight: 1.55 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>Driver&rsquo;s explanation:</span>{' '}
                <span style={{ color: 'var(--text-body)' }}>{verifyRecord.reason}</span>
                <span style={{ display: 'block', fontSize: '12.5px', color: 'var(--kr-grey-700)', marginTop: '2px' }}>
                  Escalated by {verifyRecord.escalatedBy} · {verifyRecord.escalatedAt}
                </span>
              </div>
            )}

            {verifyRecord?.deduction && (
              <div style={{ marginBottom: '12px', padding: '10px 12px', background: 'var(--kr-red-100)', borderRadius: 'var(--radius-md)', fontSize: '13.5px', color: 'var(--kr-red-800)', lineHeight: 1.55 }}>
                <strong>{fmtMoney(verifyRecord.deduction.amount)} to recover from {(d || {}).name || 'the driver'}.</strong>{' '}
                {verifyRecord.deduction.note}
                <span style={{ display: 'block', fontSize: '12.5px', marginTop: '2px' }}>
                  Raised by {verifyRecord.decidedBy} · {verifyRecord.decidedAt} · sent to payroll
                </span>
              </div>
            )}

            {vState.locked ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: 'var(--kr-grey-700)' }}>
                <Lock size={15} style={{ flex: 'none' }} />
                <span>
                  {verifyRecord?.approvedAt
                    ? `Approved by ${verifyRecord.approvedBy} on ${verifyRecord.approvedAt}. `
                    : ''}
                  This record is locked — it can no longer be edited or deleted.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {vState.canApproveL1 && canVerify && (
                  <button onClick={approveL1} style={btnPrimary}>
                    <ShieldCheck size={15} /> Approve &amp; lock
                  </button>
                )}
                {vState.canEscalate && canVerify && (
                  <button onClick={escalate} style={btnOutline}>
                    Escalate to {VERIFY_LEVEL_2}
                  </button>
                )}
                {vState.canDecideL2 && canDecideEscalation && (
                  <>
                    <button onClick={acceptExplanation} style={btnPrimary}>
                      <ShieldCheck size={15} /> Accept &amp; approve
                    </button>
                    <button onClick={rejectExplanation} style={btnDanger}>
                      Reject &middot; deduct from salary
                    </button>
                  </>
                )}
                <span style={{ fontSize: '12.5px', color: vState.overLimit ? 'var(--kr-red-700)' : 'var(--kr-grey-700)' }}>
                  {(vState.overLimit && vv.hintOver) || vv.hint}
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      <section style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border-default)', gap: '8px', flexWrap: 'wrap' }}>
          <h2 style={sectionTitle}>GPS log</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Stored separately for route replay</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-muted)', textAlign: 'left' }}>
                <th style={thStyle()}>Time</th>
                <th style={thStyle()}>Event</th>
                <th style={thStyle('right')}>KM</th>
                <th style={thStyle('right')}>Speed</th>
              </tr>
            </thead>
            <tbody>
              {gpsPg.rows.map((g, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border-default)' }}>
                  <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{g.t}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-heading)' }}>{g.ev}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>{g.km}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{g.speed} km/h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {gpsLogs.length > 0 && <Pagination {...gpsPg} noun="GPS events" />}
      </section>
    </div>
  );
};

export default TripDetail;
