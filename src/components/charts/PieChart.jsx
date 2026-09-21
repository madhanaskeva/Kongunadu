import React from 'react';

export const PieChart = ({
  data = [],
  title,
  colors = ['var(--color-brand)', 'var(--kr-saffron-500)', 'var(--kr-red-600)', 'var(--status-info)', 'var(--kr-grey-500)'],
}) => {
  const total = data.reduce((acc, curr) => acc + (curr.value || 0), 0) || 1;

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', height: '14px', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
          {data.map((item, idx) => {
            const pct = (item.value / total) * 100;
            const color = item.color || colors[idx % colors.length];
            return (
              <div
                key={idx}
                style={{
                  width: `${pct}%`,
                  backgroundColor: color,
                  transition: 'width 0.4s ease',
                }}
                title={`${item.label}: ${item.value}`}
              />
            );
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '8px' }}>
          {data.map((item, idx) => {
            const color = item.color || colors[idx % colors.length];
            const pct = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
                <span style={{ color: 'var(--text-heading)', fontWeight: 600 }}>{item.label}:</span>
                <span style={{ color: 'var(--text-muted)' }}>{item.value} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PieChart;








