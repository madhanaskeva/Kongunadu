import React, { useState } from 'react';
import { Card, Flex, Typography } from 'antd';
import { fmtMetric } from '../../../../utils/analyticsCompare';
import { TabButtons } from '../../../../components/common/TabButtons';
import { BarChart, MAX_SERIES, RankBars } from './BarChart';
import ChartPdfButton from './ChartPdfButton';

// One metric's chart card:
//   Compare  — a bar per selected entity in every period (colour = entity)
//   Combined — the selection added up, one bar per period
//   Totals   — the range total for each entity, ranked
// context: { section, scope, period } — printed on the PDF download.
export const MetricChart = ({ metric, comparison, colorOf, context = {} }) => {
  const multi = comparison.rows.length > 1;
  const [view, setView] = useState('compare');
  const mode = multi ? view : 'combined';
  const fmt = v => fmtMetric(metric.kind, v);
  const categories = comparison.buckets.map(b => ({ key: b.key, label: b.label }));
  const shown = comparison.rows.slice(0, MAX_SERIES);
  const rankItems = comparison.rows.map(r => ({ key: r.key, label: r.label, value: r.total[metric.key], color: colorOf(r.key) }));
  const seriesRows = mode === 'compare' ? shown : [comparison.all];
  const series = seriesRows.map(r => ({
    key: r.key || 'all',
    label: r.label,
    color: mode === 'compare' ? colorOf(r.key) : 'var(--color-brand)',
    values: r.byPeriod.map(p => p[metric.key]),
  }));

  const body = mode === 'totals' ? (
    <RankBars items={rankItems} format={fmt} />
  ) : (
    <BarChart categories={categories} format={fmt} integer={metric.kind === 'count'} series={series} />
  );

  const viewLabel = { compare: 'Compare', combined: 'Combined', totals: 'Totals' }[mode];
  const pdfSpec = () => ({
    section: context.section,
    title: metric.label,
    scope: context.scope,
    notes: [
      `View: ${viewLabel}${mode !== 'totals' && context.period ? ` · ${context.period}` : ''} · Total ${fmt(comparison.all.total[metric.key])}`,
      mode === 'compare' && comparison.rows.length > MAX_SERIES ? `Showing the first ${MAX_SERIES} of ${comparison.rows.length}.` : '',
    ],
    chart: mode === 'totals'
      ? { type: 'rank', items: rankItems }
      : { type: 'bars', categories, series, integer: metric.kind === 'count' },
    // Totals row only where adding the periods up means something.
    totals: mode !== 'totals' && ['count', 'km'].includes(metric.kind) ? seriesRows.map(r => r.total[metric.key]) : null,
    format: fmt,
  });

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
      extra={
        <Flex gap={8} align="center" wrap>
          {multi && (
            <TabButtons
              size="small"
              ariaLabel="Chart view"
              value={mode}
              onChange={setView}
              items={[
                { value: 'compare', label: 'Compare' },
                { value: 'combined', label: 'Combined' },
                { value: 'totals', label: 'Totals' },
              ]}
            />
          )}
          <ChartPdfButton label={metric.label} getSpec={pdfSpec} />
        </Flex>
      }
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
