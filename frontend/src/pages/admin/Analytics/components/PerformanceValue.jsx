import React from 'react';
import { Tooltip, Typography } from 'antd';
import { fmtPct } from '../../../../utils/vehiclePerformance';

// A performance % with a small status dot; the status name shows on hover.
export const PerformanceValue = ({ pct, status, strong = true }) => {
  if (pct == null) return <Typography.Text type="secondary">—</Typography.Text>;
  return (
    <Tooltip title={status.label}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
        <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: status.color, flex: 'none' }} />
        <Typography.Text strong={strong} style={{ color: status.color }}>
          {fmtPct(pct)}
        </Typography.Text>
        <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {status.label}
        </span>
      </span>
    </Tooltip>
  );
};

export default PerformanceValue;
