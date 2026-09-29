import React from 'react';

export const ReportSummaryCards = ({ summaries = [] }) => {
  if (!summaries || summaries.length === 0) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
      }}
    >
      {summaries.map((item, idx) => (
        <div
          key={idx}
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-default, #e2e8f0)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted, #64748b)',
            }}
          >
            {item.label}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display, sans-serif)',
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--color-brand, #00623f)',
              }}
            >
              {item.value}
            </span>
            {item.unit && (
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--kr-grey-600, #475569)' }}>
                {item.unit}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
export default ReportSummaryCards;
