import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';

export const ReportSummaryCards = ({ summaries = [] }) => {
  if (!summaries || summaries.length === 0) return null;

  return (
    <Row gutter={[12, 12]}>
      {summaries.map((item, idx) => (
        <Col key={idx} xs={12} sm={8} md={6} xl={4}>
          <Card size="small" className="tms-kpi" style={{ height: '100%', '--kpi': 'var(--color-brand)' }}>
            <Statistic
              title={<span className="tms-kpi-label">{item.label}</span>}
              value={item.value}
              suffix={item.unit || undefined}
              styles={{ content: { fontSize: 22 } }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
};
export default ReportSummaryCards;
