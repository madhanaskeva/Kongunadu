import React from 'react';
import { Card, Grid, Table, Typography } from 'antd';
import { fmtNum, fmtSigned, monthLabel } from '../../../../utils/vehiclePerformance';
import PerformanceValue from './PerformanceValue';

const dash = <Typography.Text type="secondary">—</Typography.Text>;
const signedTone = n => (n == null || n === 0 ? 'var(--text-muted)' : n > 0 ? 'var(--kr-green-700)' : 'var(--kr-red-700)');

// Previous month vs current month (the range's last month) for every selected vehicle.
export const MonthComparison = ({ mom }) => {
  const { previousMonth, currentMonth, rows } = mom;
  // Phones: the pinned column would cover most of the screen, so the whole table scrolls instead.
  const pin = Grid.useBreakpoint().md ? 'left' : false;
  if (!currentMonth) return null;

  const monthGroup = (key, label) => ({
    title: label,
    align: 'center',
    children: [
      { title: 'Target KM', key: `${key}-t`, align: 'right', width: 100, render: (_, r) => (r[key].targetKm == null ? dash : fmtNum(r[key].targetKm)) },
      { title: 'Actual KM', key: `${key}-a`, align: 'right', width: 100, render: (_, r) => (r[key].actualKm == null ? dash : <Typography.Text strong>{fmtNum(r[key].actualKm)}</Typography.Text>) },
      { title: 'Performance', key: `${key}-p`, align: 'right', width: 120, render: (_, r) => <PerformanceValue pct={r[key].pct} status={r[key].status} /> },
    ],
  });

  const columns = [
    {
      title: 'Vehicle No',
      key: 'vehicle',
      fixed: pin,
      width: 150,
      render: (_, r) => <Typography.Text strong style={{ color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>{r.vehicleNumber}</Typography.Text>,
    },
    monthGroup('prev', `Previous · ${monthLabel(previousMonth)}`),
    monthGroup('cur', `Current · ${monthLabel(currentMonth)}`),
    {
      title: 'Change',
      align: 'center',
      children: [
        {
          title: 'KM Change',
          key: 'km',
          align: 'right',
          width: 110,
          render: (_, r) => (r.kmChange == null ? dash : (
            <Typography.Text strong style={{ color: signedTone(r.kmChange) }}>{fmtSigned(r.kmChange, ' KM')}</Typography.Text>
          )),
        },
        {
          title: 'Performance Change',
          key: 'pts',
          align: 'right',
          width: 150,
          render: (_, r) => (r.pctChange == null ? dash : (
            <Typography.Text strong style={{ color: signedTone(r.pctChange) }}>{fmtSigned(r.pctChange, ' pts')}</Typography.Text>
          )),
        },
      ],
    },
  ];

  return (
    <Card
      title="Month-on-Month Performance"
      extra={
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {monthLabel(previousMonth)} → {monthLabel(currentMonth)}
        </Typography.Text>
      }
      styles={{ body: { padding: 0 } }}
    >
      <Table
        className="vp-stats-table"
        size="middle"
        bordered
        columns={columns}
        dataSource={rows}
        rowKey="vehicle"
        pagination={false}
        scroll={{ x: 150 + 2 * 320 + 260 }}
      />
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: 0, padding: '12px 18px' }}>
        Current month is the last month of the selected range; previous month is the one before it, even when that falls
        outside the range. Performance change is in percentage points.
      </Typography.Paragraph>
    </Card>
  );
};

export default MonthComparison;
