import React, { useState } from 'react';
import { Card, Flex, Segmented, Table, Typography } from 'antd';
import { LayoutGrid } from 'lucide-react';
import { fmtCell, unitOf } from '../../../../utils/analyticsCompare';

const dash = <Typography.Text type="secondary">—</Typography.Text>;
const cellOf = (m, v) => {
  if (v == null || Number.isNaN(v)) return dash;
  // A zero is faded so the periods with activity stand out.
  if (v === 0) return <Typography.Text style={{ color: 'var(--kr-grey-300)' }}>0</Typography.Text>;
  return <Typography.Text style={{ color: 'var(--text-heading)' }}>{fmtCell(m.kind, v)}</Typography.Text>;
};
const unitLabel = (m) => (unitOf(m.kind) && m.kind !== 'pct' ? ` (${unitOf(m.kind)})` : '');
// Counts and distances add up, so a share of the whole means something; rates don't.
const additive = (m) => m.kind === 'count' || m.kind === 'km';

const Swatch = ({ color }) => (
  <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: color, flex: 'none', display: 'inline-block' }} />
);

// One metric: a row per entity (plus the combined row), a column per period.
const MetricSheet = ({ metric, comparison, entityLabel, colorOf }) => {
  const { buckets, rows, all } = comparison;
  const list = rows.length > 1 ? [all, ...rows] : rows;
  const whole = all.total[metric.key] || 0;

  const columns = [
    {
      title: entityLabel,
      key: 'entity',
      fixed: 'left',
      width: 200,
      render: (_, r) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {!r.combined && <Swatch color={colorOf(r.key)} />}
          <Typography.Text strong style={{ color: r.combined ? 'var(--text-brand)' : 'var(--text-heading)', whiteSpace: 'nowrap' }}>
            {r.label}
          </Typography.Text>
        </span>
      ),
    },
    ...buckets.map((b, i) => ({
      title: b.label,
      key: b.key,
      align: 'right',
      width: 96,
      render: (_, r) => cellOf(metric, r.byPeriod[i][metric.key]),
    })),
    {
      title: `Total${unitLabel(metric)}`,
      key: 'total',
      align: 'right',
      width: 110,
      className: 'vp-total-col',
      render: (_, r) => <Typography.Text strong>{cellOf(metric, r.total[metric.key])}</Typography.Text>,
    },
    ...(additive(metric) && rows.length > 1 ? [{
      title: 'Share',
      key: 'share',
      width: 150,
      render: (_, r) => {
        if (r.combined) return <Typography.Text type="secondary">100%</Typography.Text>;
        const pct = whole ? ((r.total[metric.key] || 0) / whole) * 100 : 0;
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, height: 8, background: 'var(--kr-grey-100)', borderRadius: 4, overflow: 'hidden' }}>
              <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: colorOf(r.key), borderRadius: 4 }} />
            </span>
            <Typography.Text type="secondary" style={{ width: 40, textAlign: 'right', fontSize: 12 }}>{Math.round(pct)}%</Typography.Text>
          </span>
        );
      },
    }] : []),
  ];

  return (
    <Table
      className="vp-stats-table"
      size="middle"
      columns={columns}
      dataSource={list}
      rowKey="key"
      rowClassName={r => (r.combined ? 'vp-band-all' : '')}
      pagination={false}
      scroll={{ x: 200 + buckets.length * 96 + 110 + 150 }}
    />
  );
};

// Every metric at once: a block of metric rows per entity.
const FullSheet = ({ metrics, comparison, entityLabel, colorOf }) => {
  const { buckets, rows, all } = comparison;
  const blocks = rows.length > 1 ? [all, ...rows] : rows;
  const dataSource = blocks.flatMap((b, bi) =>
    metrics.map((m, mi) => ({ key: `${b.key}-${m.key}`, b, m, first: mi === 0, band: b.combined ? 'all' : bi % 2 })));

  const columns = [
    {
      title: entityLabel,
      key: 'entity',
      fixed: 'left',
      width: 180,
      onCell: r => ({ rowSpan: r.first ? metrics.length : 0, className: 'vp-vehicle-cell' }),
      render: (_, r) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {!r.b.combined && <Swatch color={colorOf(r.b.key)} />}
          <Typography.Text strong style={{ color: r.b.combined ? 'var(--text-brand)' : 'var(--text-heading)' }}>{r.b.label}</Typography.Text>
        </span>
      ),
    },
    {
      title: 'Metric',
      key: 'metric',
      fixed: 'left',
      width: 180,
      render: (_, r) => <Typography.Text style={{ whiteSpace: 'nowrap', color: 'var(--text-heading)', fontWeight: 500 }}>{r.m.label}{unitLabel(r.m)}</Typography.Text>,
    },
    ...buckets.map((bk, i) => ({
      title: bk.label, key: bk.key, align: 'right', width: 96,
      render: (_, r) => cellOf(r.m, r.b.byPeriod[i][r.m.key]),
    })),
    {
      title: 'Total', key: 'total', align: 'right', width: 104, className: 'vp-total-col',
      render: (_, r) => <Typography.Text strong>{cellOf(r.m, r.b.total[r.m.key])}</Typography.Text>,
    },
  ];

  return (
    <Table
      className="vp-stats-table"
      size="middle"
      bordered
      columns={columns}
      dataSource={dataSource}
      rowClassName={r => `vp-band-${r.band}${r.first ? ' vp-group-start' : ''}`}
      pagination={false}
      scroll={{ x: 360 + buckets.length * 96 + 104 }}
    />
  );
};

// The statistics card: a tab per metric, then "All metrics" for the full sheet.
export const CompareTable = ({ title, entityLabel, comparison, metrics, colorOf }) => {
  const [tab, setTab] = useState(metrics[0].key);
  const active = tab === '__all' || metrics.some(m => m.key === tab) ? tab : metrics[0].key;
  const current = metrics.find(m => m.key === active);

  return (
    <Card styles={{ body: { padding: 0 } }} className="an-table-card">
      {/* Header: title + what the table shows, then the metric switch on its own toolbar row. */}
      <Flex vertical gap={12} className="an-metric-bar">
        <Flex vertical gap={2}>
          <Typography.Text strong style={{ fontSize: 16, color: 'var(--text-heading)' }}>{title}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {active === '__all' ? 'Every metric, grouped by ' + entityLabel.toLowerCase() : `${current.label}${unitLabel(current)} by ${entityLabel.toLowerCase()} and period`}
          </Typography.Text>
        </Flex>
        <div className="an-metric-scroll">
          <Segmented
            value={active}
            onChange={setTab}
            options={[
              ...metrics.map(m => ({ value: m.key, label: m.label })),
              { value: '__all', label: <Flex align="center" gap={6}><LayoutGrid size={14} strokeWidth={2.2} />All metrics</Flex> },
            ]}
          />
        </div>
      </Flex>
      {active === '__all' ? (
        <FullSheet metrics={metrics} comparison={comparison} entityLabel={entityLabel} colorOf={colorOf} />
      ) : (
        <MetricSheet metric={current} comparison={comparison} entityLabel={entityLabel} colorOf={colorOf} />
      )}
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: 0, padding: '12px 18px' }}>
        Worked out from trip and exception records. Averages and rates are recalculated for each period and the total,
        not added up. — means nothing to measure in that period.
      </Typography.Paragraph>
    </Card>
  );
};

export default CompareTable;
