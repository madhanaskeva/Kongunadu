// Vehicle performance analytics — month keys, Target vs Actual KM maths and
// performance status. Pure functions; the Analytics › Vehicle tab builds on them.

// Status bands. Change the numbers here, nowhere else.
export const PERFORMANCE_THRESHOLDS = { above: 100, near: 90 };

export const PERFORMANCE_STATUS = {
  ABOVE: { key: 'above', label: 'Above Target', tag: 'success', color: 'var(--kr-green-700)' },
  NEAR: { key: 'near', label: 'Near Target', tag: 'warning', color: '#7A4300' },
  BELOW: { key: 'below', label: 'Below Target', tag: 'error', color: 'var(--kr-red-700)' },
};

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ------------------------------------------------------------------ */
/* Months                                                              */
/* ------------------------------------------------------------------ */

// 'YYYY-MM-DD' | Date | dayjs → 'YYYY-MM'
export const monthKeyOf = (d) => {
  if (!d) return '';
  if (typeof d === 'string') return d.slice(0, 7);
  const date = typeof d.toDate === 'function' ? d.toDate() : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const shiftMonth = (key, n) => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return monthKeyOf(d);
};

// Every calendar month the range touches, oldest first. 01 Apr → 30 Sep gives
// Apr…Sep; 15 Apr → 10 May gives Apr, May. Empty when from is after to.
export const monthsInRange = (from, to) => {
  const a = monthKeyOf(from);
  const b = monthKeyOf(to);
  if (!a || !b || a > b) return [];
  const out = [];
  for (let k = a; k <= b; k = shiftMonth(k, 1)) out.push(k);
  return out;
};

// '2026-09' → 'Sep 2026' (or 'Sep' when short).
export const monthLabel = (key, short = false) => {
  const [y, m] = key.split('-').map(Number);
  return short ? MONTHS_SHORT[m - 1] : `${MONTHS_SHORT[m - 1]} ${y}`;
};

/* ------------------------------------------------------------------ */
/* Maths                                                               */
/* ------------------------------------------------------------------ */

// (Actual / Target) × 100, or null when there is no target to measure against.
export const performancePct = (actualKm, targetKm) =>
  targetKm > 0 && actualKm != null ? (actualKm / targetKm) * 100 : null;

export const varianceKm = (actualKm, targetKm) =>
  actualKm != null && targetKm != null ? actualKm - targetKm : null;

export const performanceStatus = (pct) => {
  if (pct == null) return null;
  if (pct >= PERFORMANCE_THRESHOLDS.above) return PERFORMANCE_STATUS.ABOVE;
  if (pct >= PERFORMANCE_THRESHOLDS.near) return PERFORMANCE_STATUS.NEAR;
  return PERFORMANCE_STATUS.BELOW;
};

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const round1 = (n) => Math.round(n * 10) / 10;

// 106 → '106%', 92.5 → '92.5%', 115.49 → '115.5%'
export const fmtPct = (pct) => (pct == null ? '—' : `${round1(pct).toLocaleString('en-IN')}%`);
export const fmtKm = (km) => (km == null ? '—' : `${Math.round(km).toLocaleString('en-IN')} KM`);
export const fmtNum = (n) => (n == null ? '—' : Math.round(n).toLocaleString('en-IN'));
// +310 / −120 / 0
export const fmtSigned = (n, unit = '') => {
  if (n == null) return '—';
  const r = unit === ' pts' ? round1(n) : Math.round(n);
  const sign = r > 0 ? '+' : r < 0 ? '−' : '';
  return `${sign}${Math.abs(r).toLocaleString('en-IN')}${unit}`;
};

/* ------------------------------------------------------------------ */
/* Building the views                                                  */
/* ------------------------------------------------------------------ */

// One month's figures for a vehicle; every field null when no record exists.
export const monthFigures = (record, key) => {
  const m = record && record.monthlyPerformance ? record.monthlyPerformance[key] : null;
  if (!m) return { month: key, targetKm: null, actualKm: null, pct: null, variance: null, status: null };
  const pct = performancePct(m.actualKm, m.targetKm);
  return {
    month: key,
    targetKm: m.targetKm,
    actualKm: m.actualKm,
    pct,
    variance: varianceKm(m.actualKm, m.targetKm),
    status: performanceStatus(pct),
  };
};

// Totals over a set of month figures, ignoring months with no record.
export const totalsOf = (figures) => {
  const have = figures.filter(f => f.targetKm != null);
  const targetKm = have.reduce((a, f) => a + f.targetKm, 0);
  const actualKm = have.reduce((a, f) => a + f.actualKm, 0);
  const pct = performancePct(actualKm, targetKm);
  return {
    targetKm: have.length ? targetKm : null,
    actualKm: have.length ? actualKm : null,
    pct,
    variance: have.length ? actualKm - targetKm : null,
    status: performanceStatus(pct),
    months: have.length,
  };
};

// For each selected vehicle: its month-by-month figures and the range total.
export const buildVehicleStats = (records, vehicleIds, months) =>
  vehicleIds
    .map(id => records.find(r => r.vehicle === id))
    .filter(Boolean)
    .map(r => {
      const byMonth = months.map(k => monthFigures(r, k));
      return { vehicle: r.vehicle, vehicleNumber: r.vehicleNumber, byMonth, total: totalsOf(byMonth) };
    });

// Summary across every selected vehicle and month. Average performance is
// weighted: total actual ÷ total target, so a big-target vehicle counts more.
export const buildSummary = (stats) => {
  const all = totalsOf(stats.flatMap(s => s.byMonth));
  return { ...all, vehicles: stats.length };
};

// Month-on-month: the range's last month against the month before it.
export const buildMonthOnMonth = (records, vehicleIds, currentMonth) => {
  if (!currentMonth) return { previousMonth: null, currentMonth: null, rows: [] };
  const previousMonth = shiftMonth(currentMonth, -1);
  const rows = vehicleIds
    .map(id => records.find(r => r.vehicle === id))
    .filter(Boolean)
    .map(r => {
      const prev = monthFigures(r, previousMonth);
      const cur = monthFigures(r, currentMonth);
      return {
        vehicle: r.vehicle,
        vehicleNumber: r.vehicleNumber,
        prev,
        cur,
        kmChange: prev.actualKm != null && cur.actualKm != null ? cur.actualKm - prev.actualKm : null,
        pctChange: prev.pct != null && cur.pct != null ? cur.pct - prev.pct : null,
      };
    });
  return { previousMonth, currentMonth, rows };
};

// Target vs Actual per month for the trend chart — one vehicle, or the
// selected vehicles summed.
export const buildTrend = (stats, months, vehicleId = 'all') => {
  const pick = vehicleId === 'all' ? stats : stats.filter(s => s.vehicle === vehicleId);
  return months.map((k, i) => {
    const t = totalsOf(pick.map(s => s.byMonth[i]));
    return { month: k, targetKm: t.targetKm, actualKm: t.actualKm, pct: t.pct };
  });
};
