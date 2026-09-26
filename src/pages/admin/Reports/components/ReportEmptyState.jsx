import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';

export const ReportEmptyState = ({ activeFilterLabels = [], onResetFilters }) => {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: '#ffffff',
        border: '1px dashed var(--kr-grey-300, #cbd5e1)',
        borderRadius: 'var(--radius-lg, 12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'var(--kr-grey-100, #f1f5f9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--kr-grey-500, #94a3b8)',
        }}
      >
        <SearchX size={26} />
      </div>

      <div style={{ maxWidth: '520px' }}>
        <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: 'var(--text-heading, #1e293b)' }}>
          No records found for the selected filters
        </h4>
        <div style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', lineHeight: 1.5 }}>
          {activeFilterLabels.length > 0 ? (
            <>
              No data in the current database matches all conditions:{' '}
              <strong style={{ color: 'var(--kr-grey-800, #1e293b)' }}>
                {activeFilterLabels.join(' + ')}
              </strong>
              . Try relaxing one or more filter conditions or expanding the date range.
            </>
          ) : (
            'There are no records in the current database for this module.'
          )}
        </div>
      </div>

      {onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            padding: '8px 16px',
            borderRadius: '6px',
            background: 'var(--kr-grey-100, #f1f5f9)',
            color: 'var(--text-body, #334155)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <RotateCcw size={14} />
          Reset All Filters
        </button>
      )}
    </div>
  );
};
export default ReportEmptyState;
