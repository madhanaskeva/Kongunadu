import React, { useState } from 'react';

const DEFAULT_COLORS = [
  '#00623F', // Brand green
  '#F29A1F', // Saffron / Warning
  '#D91619', // Red / Danger
  '#2F7DB5', // Blue / Info
  '#7A4300', // Amber / Brown
  '#5B52D4', // Indigo / Purple
  '#0B7E52', // Emerald
  '#0B6B5C', // Teal
  '#4A4A46', // Slate
];

// Helper to convert polar coordinates to Cartesian
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

// Generate SVG path for a pie slice
function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', x, y,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'Z',
  ].join(' ');
}

export const PieChart = ({
  data = [],
  title,
  height = 240,
  colors = DEFAULT_COLORS,
  valueSuffix = '',
  showLegend = true,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const validData = (data || []).filter((d) => d && typeof d.value === 'number' && d.value >= 0);
  const total = validData.reduce((acc, curr) => acc + (curr.value || 0), 0);

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 76;

  // Build slices
  let accumulatedAngle = 0;
  const slices = validData.map((item, idx) => {
    const fraction = total > 0 ? item.value / total : 0;
    const sliceAngle = fraction * 360;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + sliceAngle;
    accumulatedAngle += sliceAngle;

    const color = item.color || colors[idx % colors.length];
    const pct = total > 0 ? (fraction * 100).toFixed(1) : '0';
    const isFullCircle = fraction >= 0.9999;
    const path = isFullCircle ? null : describeArc(cx, cy, radius, startAngle, endAngle);

    return {
      ...item,
      idx,
      fraction,
      startAngle,
      endAngle,
      color,
      pct,
      path,
      isFullCircle,
    };
  });

  const activeItem = hoveredIdx != null ? slices[hoveredIdx] : null;

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

      {validData.length === 0 || total === 0 ? (
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
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            padding: '8px 0',
          }}
        >
          {/* Pie SVG */}
          <div
            style={{
              position: 'relative',
              width: `${Math.min(height, 180)}px`,
              height: `${Math.min(height, 180)}px`,
              flexShrink: 0,
            }}
          >
            <svg
              viewBox={`0 0 ${size} ${size}`}
              style={{
                width: '100%',
                height: '100%',
                overflow: 'visible',
              }}
            >
              {slices.map((slice) => {
                const isHovered = hoveredIdx === slice.idx;
                if (slice.isFullCircle) {
                  return (
                    <circle
                      key={slice.idx}
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={slice.color}
                      stroke="#ffffff"
                      strokeWidth="2"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredIdx(slice.idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    />
                  );
                }

                return (
                  <path
                    key={slice.idx}
                    d={slice.path}
                    fill={slice.color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    style={{
                      transition: 'opacity 0.2s ease, transform 0.2s ease',
                      cursor: 'pointer',
                      opacity: hoveredIdx != null && !isHovered ? 0.6 : 1,
                      transformOrigin: `${cx}px ${cy}px`,
                      transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                    }}
                    onMouseEnter={() => setHoveredIdx(slice.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}
            </svg>
          </div>

          {/* Legend and stats */}
          {showLegend && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                flex: '1 1 140px',
                minWidth: '130px',
                maxHeight: '180px',
                overflowY: 'auto',
              }}
            >
              {slices.map((slice) => {
                const isHovered = hoveredIdx === slice.idx;
                return (
                  <div
                    key={slice.idx}
                    onMouseEnter={() => setHoveredIdx(slice.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: '4px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: isHovered ? 'var(--surface-muted)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: slice.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          color: isHovered ? 'var(--text-heading)' : 'var(--text-body)',
                          fontWeight: isHovered ? 700 : 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={slice.label}
                      >
                        {slice.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                        {slice.value}
                        {slice.valueSuffix || valueSuffix}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ({slice.pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeItem && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-heading)',
            textAlign: 'center',
            padding: '4px 8px',
            background: 'var(--surface-muted)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
          }}
        >
          {activeItem.label}: <strong>{activeItem.value}{activeItem.valueSuffix || valueSuffix}</strong> ({activeItem.pct}%)
        </div>
      )}
    </div>
  );
};

export default PieChart;
