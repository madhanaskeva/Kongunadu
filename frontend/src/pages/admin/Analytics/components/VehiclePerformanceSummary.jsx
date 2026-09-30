import React from 'react';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import { fmtKm, fmtPct, fmtSigned } from '../../../../utils/vehiclePerformance';

// Four summary cards in the shared .tms-kpi style, all derived from the applied selection.
export const VehiclePerformanceSummary = ({ summary, monthCount }) => {
  const cards = [
    ['Total Target KM', fmtKm(summary.targetKm), `${monthCount} month${monthCount !== 1 ? 's' : ''} in range`, 'var(--color-brand)'],
    [
      'Total Actual KM',
      fmtKm(summary.actualKm),
      summary.variance == null ? 'No data in range' : `${fmtSigned(summary.variance, ' KM')} vs target`,
      'var(--color-brand)',
    ],
    [
      'Average Performance',
      fmtPct(summary.pct),
      summary.status ? summary.status.label : 'No data in range',
      summary.status ? summary.status.color : 'var(--color-brand)',
    ],
    ['Vehicles Selected', String(summary.vehicles), 'Compared side by side', 'var(--color-brand)'],
  ];

  return (
    <Row gutter={[16, 16]}>
      {cards.map(([label, value, sub, color]) => (
        <Col key={label} xs={24} sm={12} lg={6}>
          <Card className="tms-kpi" style={{ height: '100%', '--kpi': color }}>
            <Statistic title={<span className="tms-kpi-label">{label}</span>} value={value} formatter={v => v} />
            <Typography.Text style={{ display: 'block', fontSize: 13, marginTop: 6, color: label === 'Average Performance' ? color : 'var(--text-muted)' }}>
              {sub}
            </Typography.Text>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default VehiclePerformanceSummary;
