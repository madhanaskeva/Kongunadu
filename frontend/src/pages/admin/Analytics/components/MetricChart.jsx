import React, { useState } from 'react';
import { Card, Segmented, Typography } from 'antd';
import { fmtMetric } from '../../../../utils/analyticsCompare';
import { BarChart, MAX_SERIES, RankBars } from './BarChart';

// One metric's chart card:
//   Compare  — a bar per selected entity in every period (colour = entity)
//   Combined — the selection added up, one bar per period
//   Totals   — the range total for each entity, ranked
export const MetricChart = ({ metric, comparison, colorOf }) => {
  const multi = comparison.rows.length > 1;
  const [view, setView] = useState('compare');
  const mode = multi ? view : 'combined';
  const fmt = v => fmtMetric(metric.kind, v);
  const categories = comparison.buckets.map(b => ({ key: b.key, label: b.label }));
  const shown = comparison.rows.slice(0, MAX_SERIES);

  const body = mode === 'totals' ? (
    <RankBars
      items={comparison.rows.map(r => ({ key: r.key, label: r.label, value: r.total[metric.key], color: colorOf(r.key) }))}
      format={fmt}
    />
  ) : (
    <BarChart
      categories={categories}
      format={fmt}
      integer={metric.kind === 'count'}
      series={mode === 'compare'
        ? shown.map(r => ({ key: r.key, label: r.label, color: colorOf(r.key), values: r.byPeriod.map(p => p[metric.key]) }))
        : [{ key: 'all', label: comparison.all.label, color: 'var(--color-brand)', values: comparison.all.byPeriod.map(p => p[metric.key]) }]}
    />
  );

  return (
    <Card
      size="small"
      className="an-chart-card"
      title={
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontSize: 14 }}>{metric.label}</div>
          <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
            Total {fmt(comparison.all.total[metric.key])}
          </Typography.Text>
        </div>
      }
      extra={multi && (
        <Segmented
          size="small"
          value={mode}
          onChange={setView}
          options={[
            { value: 'compare', label: 'Compare' },
            { value: 'combined', label: 'Combined' },
            { value: 'totals', label: 'Totals' },
          ]}
        />
      )}
      style={{ height: '100%' }}
    >
      {body}
      {mode === 'compare' && comparison.rows.length > MAX_SERIES && (
        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 8 }}>
          Showing the first {MAX_SERIES} of {comparison.rows.length}. Use Totals or the table for all.
        </Typography.Text>
      )}
    </Card>
  );
};

export default MetricChart;
