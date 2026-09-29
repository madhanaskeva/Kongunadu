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

export const DonutChart = ({
  data = [],
  title,
  height = 240,
  colors = DEFAULT_COLORS,
  centerLabel = 'Total',
  centerValue,
  valueSuffix = '',
  showLegend = true,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Filter valid data items
  const validData = (data || []).filter((d) => d && typeof d.value === 'number' && d.value >= 0);
  const total = validData.reduce((acc, curr) => acc + (curr.value || 0), 0);

  // SVG dimensions
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke dash segments
  let accumulatedPercent = 0;
  const segments = validData.map((item, idx) => {
    const fraction = total > 0 ? item.value / total : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += fraction;

    const color = item.color || colors[idx % colors.length];
    const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';

    return {
      ...item,
      idx,
      fraction,
      pct,
      color,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeItem = hoveredIdx != null ? segments[hoveredIdx] : null;
  const displayVal = activeItem
    ? `${activeItem.value.toLocaleString('en-IN')}${activeItem.valueSuffix || valueSuffix}`
    : centerValue != null
    ? `${centerValue.toLocaleString ? centerValue.toLocaleString('en-IN') : centerValue}${valueSuffix}`
    : `${total.toLocaleString('en-IN')}${valueSuffix}`;

  const displayLbl = activeItem ? activeItem.label : centerLabel;

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
          {/* Donut SVG */}
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
                transform: 'rotate(-90deg)',
                overflow: 'visible',
              }}
            >
              {/* Background ring */}
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="var(--kr-grey-100, #ecece8)"
                strokeWidth={strokeWidth}
              />

              {/* Segments */}
              {segments.map((seg) => {
                const isHovered = hoveredIdx === seg.idx;
                return (
                  <circle
                    key={seg.idx}
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    style={{
                      transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                      cursor: 'pointer',
                      opacity: hoveredIdx != null && !isHovered ? 0.6 : 1,
                    }}
                    onMouseEnter={() => setHoveredIdx(seg.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}
            </svg>

            {/* Center Label in Donut Hole */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                textAlign: 'center',
                padding: '12px',
                boxSizing: 'border-box',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: activeItem ? activeItem.color : 'var(--text-heading)',
                  transition: 'color 0.2s ease',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayVal}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginTop: '2px',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayLbl}
              </span>
              {activeItem && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-body)',
                    marginTop: '2px',
                  }}
                >
                  {activeItem.pct}%
                </span>
              )}
            </div>
          </div>

          {/* Legend */}
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
              {segments.map((seg) => {
                const isHovered = hoveredIdx === seg.idx;
                return (
                  <div
                    key={seg.idx}
                    onMouseEnter={() => setHoveredIdx(seg.idx)}
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
                          backgroundColor: seg.color,
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
                        title={seg.label}
                      >
                        {seg.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                        {seg.value}
                        {seg.valueSuffix || valueSuffix}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ({seg.pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DonutChart;
