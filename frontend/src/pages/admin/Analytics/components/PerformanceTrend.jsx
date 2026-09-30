import React, { useState } from 'react';
import { Card, Col, Row, Select, Typography } from 'antd';
import { buildTrend, fmtKm, fmtPct, monthLabel, totalsOf } from '../../../../utils/vehiclePerformance';
import { BarChart, MAX_SERIES, SERIES_COLORS } from './BarChart';

const TARGET_COLOR = 'var(--kr-grey-300)';
const ACTUAL_COLOR = 'var(--color-brand)';

const ChartTitle = ({ title, sub }) => (
  <div style={{ padding: '4px 0' }}>
    <div style={{ fontSize: 14 }}>{title}</div>
    <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>{sub}</Typography.Text>
  </div>
);

// Vehicle charts: Target vs Actual KM per month (all selected or one vehicle),
// and Performance % per month with a bar for each vehicle.
export const PerformanceTrend = ({ stats, months }) => {
  const [focus, setFocus] = useState('all');
  const focusId = focus === 'all' || stats.some(s => s.vehicle === focus) ? focus : 'all';
  const trend = buildTrend(stats, months, focusId);
  const categories = months.map(k => ({ key: k, label: months.length > 12 ? monthLabel(k) : monthLabel(k, true) }));
  const focusTotal = totalsOf(trend.map(t => ({ targetKm: t.targetKm, actualKm: t.actualKm })).filter(t => t.targetKm != null));
  const shown = stats.slice(0, MAX_SERIES);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={12}>
        <Card
          size="small"
          className="an-chart-card"
          style={{ height: '100%' }}
          title={<ChartTitle title="Target vs Actual KM" sub={`Actual ${fmtKm(focusTotal.actualKm)} of ${fmtKm(focusTotal.targetKm)} · ${fmtPct(focusTotal.pct)}`} />}
          extra={stats.length > 1 && (
            <Select
              size="small"
              value={focusId}
              onChange={setFocus}
              popupMatchSelectWidth={false}
              style={{ minWidth: 170 }}
              options={[
                { value: 'all', label: `All ${stats.length} vehicles` },
                ...stats.map(s => ({ value: s.vehicle, label: s.vehicleNumber })),
              ]}
            />
          )}
        >
          <BarChart
            categories={categories}
            format={v => fmtKm(v)}
            series={[
              { key: 'target', label: 'Target KM', color: TARGET_COLOR, values: trend.map(t => t.targetKm) },
              { key: 'actual', label: 'Actual KM', color: ACTUAL_COLOR, values: trend.map(t => t.actualKm) },
            ]}
          />
        </Card>
      </Col>

      <Col xs={24} xl={12}>
        <Card
          size="small"
          className="an-chart-card"
          style={{ height: '100%' }}
          title={<ChartTitle title="Performance %" sub={stats.length > 1 ? 'One bar per vehicle · 100% is on target' : '100% is on target'} />}
        >
          <BarChart
            categories={categories}
            format={v => fmtPct(v)}
            series={shown.map((s, i) => ({
              key: s.vehicle,
              label: s.vehicleNumber,
              color: stats.length > 1 ? SERIES_COLORS[i] : ACTUAL_COLOR,
              values: s.byMonth.map(f => f.pct),
            }))}
          />
          {stats.length > MAX_SERIES && (
            <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 8 }}>
              Showing the first {MAX_SERIES} of {stats.length} vehicles. The table lists all of them.
            </Typography.Text>
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default PerformanceTrend;
