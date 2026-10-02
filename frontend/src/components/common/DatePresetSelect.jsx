import React from 'react';
import dayjs from 'dayjs';
import { Select } from 'antd';
import { CalendarRange } from 'lucide-react';

// Quick periods for an admin From / To filter. Each ends today and counts today
// in, so "Last 7 days" is today and the six days before it.
export const DATE_PRESETS = [
  { value: '7d', label: 'Last 7 days', n: 7, unit: 'day' },
  { value: '14d', label: 'Last 14 days', n: 14, unit: 'day' },
  { value: '30d', label: 'Last 30 days', n: 30, unit: 'day' },
  { value: '2m', label: 'Last 2 months', n: 2, unit: 'month' },
  { value: '3m', label: 'Last 3 months', n: 3, unit: 'month' },
  { value: '4m', label: 'Last 4 months', n: 4, unit: 'month' },
  { value: '5m', label: 'Last 5 months', n: 5, unit: 'month' },
  { value: '6m', label: 'Last 6 months', n: 6, unit: 'month' },
];

// The { from, to } days of a preset, as dayjs at the start of each day.
export const presetRange = (value) => {
  const p = DATE_PRESETS.find(x => x.value === value);
  if (!p) return null;
  const to = dayjs().startOf('day');
  const from = p.unit === 'day' ? to.subtract(p.n - 1, 'day') : to.subtract(p.n, 'month').add(1, 'day');
  return { from, to };
};

// Which preset the current From / To matches; 'custom' for any other range.
export const matchPreset = (from, to) => {
  if (!from && !to) return undefined;
  const f = from ? dayjs(from) : null;
  const t = to ? dayjs(to) : null;
  const hit = DATE_PRESETS.find(p => {
    const r = presetRange(p.value);
    return f && t && f.isSame(r.from, 'day') && t.isSame(r.to, 'day');
  });
  return hit ? hit.value : 'custom';
};

// "Period" select that fills a From / To pair. `from` / `to` may be dayjs, a
// date string or empty; `onChange(from, to)` gets dayjs (or nulls when cleared).
export const DatePresetSelect = ({ from, to, onChange, allowClear = true, placeholder = 'Any period', style, ...rest }) => (
  <Select
    prefix={<CalendarRange size={16} />}
    value={matchPreset(from, to)}
    placeholder={placeholder}
    allowClear={allowClear}
    popupMatchSelectWidth={false}
    options={[
      ...DATE_PRESETS.map(({ value, label }) => ({ value, label })),
      { value: 'custom', label: 'Custom range', disabled: true },
    ]}
    onChange={v => {
      if (!v) { onChange(null, null); return; }
      const r = presetRange(v);
      if (r) onChange(r.from, r.to);
    }}
    aria-label="Period"
    style={{ width: '100%', ...style }}
    {...rest}
  />
);

export default DatePresetSelect;
