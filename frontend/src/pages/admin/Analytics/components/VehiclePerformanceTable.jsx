import React from 'react';
import { Card, Table, Tag, Typography } from 'antd';
import { fmtNum, fmtSigned, monthLabel, PERFORMANCE_STATUS, PERFORMANCE_THRESHOLDS } from '../../../../utils/vehiclePerformance';
import PerformanceValue from './PerformanceValue';

// Metric rows shown for every vehicle, in order.
const METRICS = [
  { key: 'target', label: 'Target KM' },
  { key: 'actual', label: 'Actual KM' },
  { key: 'variance', label: 'Variance KM' },
  { key: 'pct', label: 'Performance' },
];

const cellFor = (metric, f) => {
  if (f.targetKm == null) return <Typography.Text type="secondary">—</Typography.Text>;
  switch (metric) {
    case 'target': return fmtNum(f.targetKm);
    case 'actual': return <Typography.Text strong>{fmtNum(f.actualKm)}</Typography.Text>;
    case 'variance':
      return (
        <Typography.Text style={{ color: f.variance < 0 ? 'var(--kr-red-700)' : 'var(--text-muted)' }}>
          {fmtSigned(f.variance)}
        </Typography.Text>
      );
    default: return <PerformanceValue pct={f.pct} status={f.status} />;
  }
};

// The statistics sheet: one block of metric rows per vehicle, one column per month,
// and a range total at the end — read across to follow a vehicle month by month.
export const VehiclePerformanceTable = ({ stats, months }) => {
  const multiYear = months.length && months[0].slice(0, 4) !== months[months.length - 1].slice(0, 4);

  const dataSource = stats.flatMap((s, vi) =>
    METRICS.map((m, mi) => ({ key: `${s.vehicle}-${m.key}`, s, m, first: mi === 0, band: vi % 2 })));

  const columns = [
    {
      title: 'Vehicle No',
      key: 'vehicle',
      fixed: 'left',
      width: 150,
      onCell: r => ({ rowSpan: r.first ? METRICS.length : 0, className: 'vp-vehicle-cell' }),
      render: (_, r) => (
        <div>
          <Typography.Text strong style={{ display: 'block', color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
            {r.s.vehicleNumber}
          </Typography.Text>
          {r.s.total.status && (
            <Tag color={r.s.total.status.tag} style={{ marginTop: 6, marginInlineEnd: 0, fontSize: 11 }}>
              {r.s.total.status.label}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Metric',
      key: 'metric',
      fixed: 'left',
      width: 120,
      render: (_, r) => <Typography.Text style={{ whiteSpace: 'nowrap', color: 'var(--text-heading)', fontWeight: 500 }}>{r.m.label}</Typography.Text>,
    },
    ...months.map((k, i) => ({
      title: multiYear ? monthLabel(k) : monthLabel(k, true),
      key: k,
      align: 'right',
      width: 104,
      render: (_, r) => cellFor(r.m.key, r.s.byMonth[i]),
    })),
    {
      title: 'Total',
      key: 'total',
      align: 'right',
      width: 116,
      className: 'vp-total-col',
      render: (_, r) => cellFor(r.m.key, r.s.total),
    },
  ];

  return (
    <Card
      title="Vehicle Performance Statistics"
      extra={
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {months.length ? `${monthLabel(months[0])} – ${monthLabel(months[months.length - 1])}` : ''}
        </Typography.Text>
      }
      styles={{ body: { padding: 0 } }}
    >
      <Table
        className="vp-stats-table"
        size="middle"
        bordered
        columns={columns}
        dataSource={dataSource}
        rowClassName={r => `vp-band-${r.band}${r.first ? ' vp-group-start' : ''}`}
        pagination={false}
        scroll={{ x: 270 + months.length * 104 + 116 }}
      />
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: 0, padding: '12px 18px' }}>
        Performance = Actual KM ÷ Target KM × 100. {PERFORMANCE_STATUS.ABOVE.label} at {PERFORMANCE_THRESHOLDS.above}% or more,{' '}
        {PERFORMANCE_STATUS.NEAR.label} from {PERFORMANCE_THRESHOLDS.near}%, {PERFORMANCE_STATUS.BELOW.label} under {PERFORMANCE_THRESHOLDS.near}%.
        Months are counted whole; — means no record for that month. Total is the whole range for that vehicle.
      </Typography.Paragraph>
    </Card>
  );
};

export default VehiclePerformanceTable;
