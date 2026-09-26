import React from 'react';
import { Plus, RotateCcw, Play, Filter } from 'lucide-react';
import { ReportFilterRow } from './ReportFilterRow';
import { MODULE_FIELDS } from '../reportEngine';

export const ReportFilterBuilder = ({
  moduleId,
  filters,
  tms,
  loading,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  onResetFilters,
  onGenerateReport,
}) => {
  const fields = MODULE_FIELDS[moduleId] || [];

  const handleAddDefaultFilter = () => {
    const usedFields = new Set(filters.map(f => f.field));
    const nextField = fields.find(f => !usedFields.has(f.key)) || fields[0];

    let defaultVal = '';
    let defaultOp = 'equals';
    if (nextField?.type === 'dateRange') {
      defaultVal = { from: '', to: '' };
      defaultOp = 'between';
    }

    onAddFilter({
      field: nextField ? nextField.key : 'branch',
      op: defaultOp,
      value: defaultVal,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Column 2 Header */}
      <div className="reports-col-header">
        <div>
          <span className="reports-col-kicker">Step 2 · Refine Your Report</span>
          <h3 className="reports-col-title">
            <Filter size={18} color="var(--color-brand, #00623f)" />
            Choose the details you want
          </h3>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
            Add one or more choices to narrow down your report.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {filters.length > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              title="Clear all choices"
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted, #64748b)',
                background: 'var(--kr-grey-100, #f1f5f9)',
              }}
            >
              <RotateCcw size={12} />
              Clear all
            </button>
          )}

          <button
            type="button"
            onClick={handleAddDefaultFilter}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--color-brand, #00623f)',
              border: '1px solid var(--color-brand, #00623f)',
              background: '#ffffff',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={13} />
            + Add another choice
          </button>
        </div>
      </div>

      {/* Scrollable Column Body */}
      <div className="reports-col-scrollable">
        {filters.length === 0 ? (
          <div
            style={{
              margin: 'auto 0',
              padding: '24px 16px',
              textAlign: 'center',
              background: 'var(--kr-grey-50, #f8fafc)',
              border: '1px dashed var(--kr-grey-300, #cbd5e1)',
              borderRadius: 'var(--radius-md, 8px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--kr-grey-100, #f1f5f9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--kr-grey-500, #94a3b8)',
              }}
            >
              <Filter size={18} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading, #1e293b)' }}>
              No choices selected yet
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', maxWidth: '340px', lineHeight: 1.4 }}>
              Click <strong>+ Add another choice</strong> to pick specific details (like Branch or Vehicle), or click <strong>Show Report</strong> to see all information.
            </div>
            <button
              type="button"
              onClick={handleAddDefaultFilter}
              style={{
                all: 'unset',
                cursor: 'pointer',
                marginTop: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#ffffff',
                background: 'var(--color-brand, #00623f)',
              }}
            >
              <Plus size={13} />
              + Add a choice
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filters.map((f, idx) => (
              <ReportFilterRow
                key={idx}
                filter={f}
                index={idx}
                moduleId={moduleId}
                filters={filters}
                tms={tms}
                onUpdateFilter={onUpdateFilter}
                onRemoveFilter={onRemoveFilter}
              />
            ))}
          </div>
        )}
      </div>

      {/* Column Footer with Generate Action */}
      <div className="reports-col-footer">
        <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
          {filters.length > 0 ? (
            <span>
              <strong>{filters.length}</strong> {filters.length === 1 ? 'choice' : 'choices'} selected
            </span>
          ) : (
            <span>Showing all records</span>
          )}
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={onGenerateReport}
          style={{
            all: 'unset',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            height: '38px',
            padding: '0 20px',
            borderRadius: 'var(--radius-md, 8px)',
            background: loading ? 'var(--kr-grey-400, #94a3b8)' : 'var(--color-brand, #00623f)',
            color: '#ffffff',
            fontFamily: 'var(--font-display, sans-serif)',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.02em',
            boxShadow: '0 2px 6px rgba(0, 98, 63, 0.25)',
            transition: 'background 0.15s ease',
          }}
        >
          {loading ? (
            <span>Loading report…</span>
          ) : (
            <>
              <Play size={14} fill="#ffffff" />
              <span>Show Report</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReportFilterBuilder;
