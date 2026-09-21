import React from 'react';

export const BarChart = ({
  data = [],
  title,
  height = 200,
  barColor = 'var(--color-brand)',
  valueSuffix = '',
}) => {
  const maxValue = Math.max(...data.map((d) => d.value || 0), 1);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-heading)' }}>
            {title}
          </h4>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '12px',
          height: `${height}px`,
          paddingTop: '16px',
        }}
      >
        {data.map((item, index) => {
          const heightPercent = Math.max(8, (item.value / maxValue) * 100);
          return (
            <div
              key={index}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                height: '100%',
                justifyContent: 'flex-end',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-heading)' }}>
                {item.value}
                {valueSuffix}
              </span>
              <div
                style={{
                  width: '100%',
                  maxWidth: '36px',
                  height: `${heightPercent}%`,
                  backgroundColor: item.color || barColor,
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.4s ease',
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
                title={item.label}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarChart;

