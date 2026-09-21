import React from 'react';

export const LineChart = ({
  data = [],
  title,
  height = 200,
  lineColor = 'var(--color-brand)',
}) => {
  const maxValue = Math.max(...data.map((d) => d.value || 0), 1);
  const points = data
    .map((item, idx) => {
      const x = (idx / Math.max(data.length - 1, 1)) * 300;
      const y = height - (item.value / maxValue) * (height - 30) - 15;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {title && (
        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-heading)' }}>
          {title}
        </h4>
      )}
      <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
        <svg
          viewBox={`0 0 300 ${height}`}
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
          preserveAspectRatio="none"
        >
          <polyline
            fill="none"
            stroke={lineColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {data.map((item, idx) => {
            const x = (idx / Math.max(data.length - 1, 1)) * 300;
            const y = height - (item.value / maxValue) * (height - 30) - 15;
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="4.5"
                fill="#ffffff"
                stroke={lineColor}
                strokeWidth="2.5"
              />
            );
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
        {data.map((item, idx) => (
          <span key={idx} style={{ fontWeight: 600 }}>{item.label}</span>
        ))}
      </div>
    </div>
  );
};

export default LineChart;

