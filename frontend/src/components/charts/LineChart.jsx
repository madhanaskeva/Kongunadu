import React, { useState } from 'react';

export const LineChart = ({
  data = [],
  title,
  height = 220,
  lineColor = 'var(--color-brand, #00623F)',
  valueSuffix = '',
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

  const values = validData.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // Chart coordinates
  const svgWidth = 460;
  const svgHeight = height;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 25;
  const padBottom = 35;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const points = validData.map((item, idx) => {
    const x = padLeft + (validData.length === 1 ? plotW / 2 : (idx / (validData.length - 1)) * plotW);
    const y = padTop + plotH - ((item.value - minVal) / range) * plotH;
    return { ...item, idx, x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Gradient area path
  const areaPath = points.length > 0
    ? `M ${points[0].x},${padTop + plotH} L ${polylinePoints} L ${points[points.length - 1].x},${padTop + plotH} Z`
    : '';

  const activePoint = hoveredIdx != null ? points[hoveredIdx] : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        position: 'relative',
      }}
    >
      {title && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-heading)' }}>
            {title}
          </h4>
        </div>
      )}

      <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={svgWidth - padRight}
            y2={padTop}
            stroke="var(--border-default, #ecece8)"
            strokeDasharray="4 4"
          />
          <line
            x1={padLeft}
            y1={padTop + plotH / 2}
            x2={svgWidth - padRight}
            y2={padTop + plotH / 2}
            stroke="var(--border-default, #ecece8)"
            strokeDasharray="4 4"
          />
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={svgWidth - padRight}
            y2={padTop + plotH}
            stroke="var(--border-default, #ecece8)"
          />

          {/* Y Axis labels */}
          <text
            x={padLeft - 8}
            y={padTop + 4}
            textAnchor="end"
            fontSize="10"
            fontWeight="600"
            fill="var(--text-muted, #7c7c76)"
          >
            {maxVal.toLocaleString('en-IN')}{valueSuffix}
          </text>
          <text
            x={padLeft - 8}
            y={padTop + plotH / 2 + 4}
            textAnchor="end"
            fontSize="10"
            fontWeight="600"
            fill="var(--text-muted, #7c7c76)"
          >
            {Math.round((maxVal + minVal) / 2).toLocaleString('en-IN')}{valueSuffix}
          </text>
          <text
            x={padLeft - 8}
            y={padTop + plotH + 4}
            textAnchor="end"
            fontSize="10"
            fontWeight="600"
            fill="var(--text-muted, #7c7c76)"
          >
            {minVal.toLocaleString('en-IN')}{valueSuffix}
          </text>

          {/* Area fill */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#lineGrad)"
            />
          )}

          {/* Trend line */}
          <polyline
            fill="none"
            stroke={lineColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Data point dots */}
          {points.map((p) => {
            const isHovered = hoveredIdx === p.idx;
            return (
              <g key={p.idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill="#ffffff"
                  stroke={p.color || lineColor}
                  strokeWidth={isHovered ? 3 : 2}
                  style={{
                    cursor: 'pointer',
                    transition: 'r 0.15s ease, stroke-width 0.15s ease',
                  }}
                  onMouseEnter={() => setHoveredIdx(p.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
                {/* Invisible hover area for easier interaction */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={14}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIdx(p.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              </g>
            );
          })}

          {/* X Axis labels */}
          {points.map((p, idx) => {
            // Sample labels if too many
            const step = Math.ceil(points.length / 7);
            const isVisible = idx % step === 0 || idx === points.length - 1;
            if (!isVisible) return null;

            return (
              <text
                key={p.idx}
                x={p.x}
                y={padTop + plotH + 18}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="var(--text-muted, #7c7c76)"
              >
                {p.label}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {activePoint && (
          <div
            style={{
              position: 'absolute',
              top: `${(activePoint.y / svgHeight) * 100}%`,
              left: `${(activePoint.x / svgWidth) * 100}%`,
              transform: 'translate(-50%, -120%)',
              background: 'var(--kr-grey-900, #1c1c1a)',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm, 4px)',
              fontSize: '11px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 10,
            }}
          >
            <div>{activePoint.label}</div>
            <div style={{ color: 'var(--kr-saffron-500, #f29a1f)' }}>
              {activePoint.value.toLocaleString('en-IN')}{activePoint.valueSuffix || valueSuffix}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LineChart;
