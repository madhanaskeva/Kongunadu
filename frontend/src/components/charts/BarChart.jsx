import React, { useState } from 'react';

export const BarChart = ({
  data = [],
  title,
  height = 200,
  barColor = 'var(--color-brand, #00623F)',
  valueSuffix = '',
  orientation = 'vertical', // 'vertical' | 'horizontal'
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const validData = (data || []).filter((d) => d && typeof d.value === 'number');

  if (validData.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px',
        }}
      >
        No data available to display
      </div>
    );
  }

  const maxValue = Math.max(...validData.map((d) => d.value || 0), 1);

  if (orientation === 'horizontal') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
        }}
      >
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-heading)' }}>
              {title}
            </h4>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {validData.map((item, index) => {
            const widthPercent = Math.max(4, (item.value / maxValue) * 100);
            const isHovered = hoveredIdx === index;
            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(90px, 140px) 1fr minmax(50px, auto)',
                  gap: '12px',
                  alignItems: 'center',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    color: isHovered ? 'var(--text-brand)' : 'var(--text-heading)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={item.label}
                >
                  {item.label}
                </span>
                <div
                  style={{
                    height: '14px',
                    background: 'var(--kr-grey-100, #ecece8)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${widthPercent}%`,
                      backgroundColor: item.color || barColor,
                      borderRadius: '3px',
                      transition: 'width 0.4s ease, filter 0.2s ease',
                      filter: isHovered ? 'brightness(1.1)' : 'none',
                    }}
                  />
                </div>
                <span
                  style={{
                    textAlign: 'right',
                    fontWeight: 700,
                    color: 'var(--text-heading)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.value.toLocaleString('en-IN')}{item.valueSuffix || valueSuffix}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical column view
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
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
          gap: validData.length > 8 ? '6px' : '12px',
          height: `${height}px`,
          paddingTop: '20px',
          paddingBottom: '4px',
          borderBottom: '1px solid var(--border-default, #ecece8)',
        }}
      >
        {validData.map((item, index) => {
          const heightPercent = Math.max(6, (item.value / maxValue) * 100);
          const isHovered = hoveredIdx === index;
          return (
            <div
              key={index}
              onMouseEnter={() => setHoveredIdx(index)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                height: '100%',
                justifyContent: 'flex-end',
                minWidth: 0,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isHovered ? 'var(--text-brand)' : 'var(--text-heading)',
                  whiteSpace: 'nowrap',
                  transform: validData.length > 10 ? 'scale(0.85)' : 'none',
                }}
              >
                {item.value}
                {item.valueSuffix || valueSuffix}
              </span>
              <div
                style={{
                  width: '100%',
                  maxWidth: '36px',
                  height: `${heightPercent}%`,
                  backgroundColor: item.color || barColor,
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.4s ease, filter 0.2s ease, transform 0.2s ease',
                  filter: isHovered ? 'brightness(1.15)' : 'none',
                  transform: isHovered ? 'scaleY(1.02)' : 'none',
                  transformOrigin: 'bottom',
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  color: isHovered ? 'var(--text-heading)' : 'var(--text-muted)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                  textAlign: 'center',
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
