// Analytics comparison engine — the Trip, GPS, Driver, Branch and Irregularities
// tabs compare a set of entities (clients, vehicles, drivers…) period by period.
//
// A tab is described by a config (see pages/admin/Analytics/analyticsTabs.js):
//   sources: { name: { list, date(item), entity(item), branch(item) } }
//   metrics: [{ key, label, kind, value(src) }]  where src = { [name]: items[] }
// Metrics are computed from the raw items of each cell, so ratios (per 100 trips,
// variance %) stay correct in every period and in the totals — never averaged.
import dayjs from 'dayjs';
import { parseTimestamp } from '../pages/admin/Reports/reportEngine';

export const GRAINS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

// Readable column counts: days up to two weeks, weeks up to ~3 months, then months.
export const autoGrain = (from, to) => {
  const days = to.diff(from, 'day') + 1;
  return days <= 14 ? 'day' : days <= 92 ? 'week' : 'month';
};

// The periods the range is split into, oldest first. Weeks start on Monday and
// are clipped to the range, so the first and last may be short.
export const periodBuckets = (from, to, grain) => {
  const start = from.startOf('day');
  const end = to.endOf('day');
  if (start.isAfter(end)) return [];
  const out = [];
  let cur = start;
  while (!cur.isAfter(end)) {
    let next;
    if (grain === 'day') next = cur.endOf('day');
    // dayjs: Sunday = 0 … Saturday = 6; a Monday-start week ends on Sunday.
    else if (grain === 'week') next = cur.add(7 - (cur.day() || 7), 'day').endOf('day');
    else next = cur.endOf('month');
    if (next.isAfter(end)) next = end;
    const sameMonth = cur.isSame(next, 'month');
    const label = grain === 'day'
      ? cur.format('DD MMM')
      : grain === 'month'
      ? cur.format('MMM YYYY')
      : cur.isSame(next, 'day')
      ? cur.format('DD MMM')
      : `${cur.format('D')}${sameMonth ? '' : cur.format(' MMM')}–${next.format('D MMM')}`;
    out.push({ key: cur.format('YYYY-MM-DD'), label, start: cur.valueOf(), end: next.valueOf() });
    cur = next.add(1, 'millisecond').startOf('day');
  }
  return out;
};

/* ------------------------------------------------------------------ */
/* Formatting per metric kind                                          */
/* ------------------------------------------------------------------ */

const n0 = (v) => Math.round(v).toLocaleString('en-IN');
const n1 = (v) => (Math.round(v * 10) / 10).toLocaleString('en-IN');

export const fmtMetric = (kind, v) => {
  if (v == null || Number.isNaN(v)) return '—';
  switch (kind) {
    case 'km': return `${n0(v)} KM`;
    case 'pct': return `${n1(v)}%`;
    case 'hours': return `${n1(v)} h`;
    case 'ratio': return n1(v);
    default: return n0(v);
  }
};

// Table cells drop the unit (it is in the row label) to keep columns tight.
export const fmtCell = (kind, v) => {
  if (v == null || Number.isNaN(v)) return '—';
  return kind === 'pct' ? `${n1(v)}%` : kind === 'ratio' || kind === 'hours' ? n1(v) : n0(v);
};

export const unitOf = (kind) => ({ km: 'KM', pct: '%', hours: 'h' }[kind] || '');

// Change vs a previous value: percent for totals, points for percentages.
export const fmtChange = (kind, cur, prev) => {
  if (cur == null || prev == null) return null;
  if (kind === 'pct') {
    const d = cur - prev;
    return { text: `${d > 0 ? '+' : d < 0 ? '−' : ''}${n1(Math.abs(d))} pts`, dir: Math.sign(d) };
  }
  if (!prev) return cur ? { text: 'new', dir: 1 } : { text: 'no change', dir: 0 };
  const p = ((cur - prev) / prev) * 100;
  return { text: `${p > 0 ? '+' : p < 0 ? '−' : ''}${n1(Math.abs(p))}%`, dir: Math.sign(p) };
};

/* ------------------------------------------------------------------ */
/* Selecting items                                                      */
/* ------------------------------------------------------------------ */

// Every source list with its item timestamps worked out once.
export const prepareSources = (config) =>
  Object.fromEntries(Object.entries(config.sources).map(([name, s]) => [
    name,
    { ...s, rows: (s.list || []).map(item => ({ item, ts: parseTimestamp(s.date(item)) })).filter(r => r.ts != null) },
  ]));

// The items of every source for a set of entities, a branch and a time window.
const pick = (prepared, { entities, branch, start, end }) =>
  Object.fromEntries(Object.entries(prepared).map(([name, s]) => [
    name,
    s.rows
      .filter(r => r.ts >= start && r.ts <= end)
      .filter(r => !branch || s.branch(r.item) === branch)
      .filter(r => !entities || entities.includes(s.entity(r.item)))
      .map(r => r.item),
  ]));

const valuesOf = (metrics, src) => Object.fromEntries(metrics.map(m => [m.key, m.value(src)]));

/* ------------------------------------------------------------------ */
/* Building the views                                                  */
/* ------------------------------------------------------------------ */

// Everything the tab shows for one applied selection.
export const buildComparison = ({ prepared, metrics, entities, entityName, branch, from, to, grain }) => {
  const buckets = periodBuckets(from, to, grain);
  const range = { start: from.startOf('day').valueOf(), end: to.endOf('day').valueOf() };
  // The same-length window just before the range, for "vs previous period".
  const days = to.startOf('day').diff(from.startOf('day'), 'day') + 1;
  const prevRange = {
    start: from.subtract(days, 'day').startOf('day').valueOf(),
    end: from.subtract(1, 'day').endOf('day').valueOf(),
  };

  const block = (ids, label, key, combined = false) => {
    const byPeriod = buckets.map(b => valuesOf(metrics, pick(prepared, { entities: ids, branch, ...b })));
    const total = valuesOf(metrics, pick(prepared, { entities: ids, branch, ...range }));
    return { key, label, combined, byPeriod, total };
  };

  const rows = entities.map(id => block([id], entityName(id), id));
  const all = block(entities, entities.length > 1 ? `All ${entities.length} selected` : entityName(entities[0]), '__all', true);
  const previous = valuesOf(metrics, pick(prepared, { entities, branch, ...prevRange }));

  return { buckets, rows, all, previous, days };
};

// Entities ranked by how many items they have in the window — used to pick a
// sensible default selection.
export const rankEntities = (prepared, ids, { branch, start, end }) => {
  const count = (id) => Object.values(pick(prepared, { entities: [id], branch, start, end }))
    .reduce((a, list) => a + list.length, 0);
  return ids.map(id => ({ id, n: count(id) })).sort((a, b) => b.n - a.n);
};
