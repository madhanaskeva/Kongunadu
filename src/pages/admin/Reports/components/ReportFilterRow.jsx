import React from 'react';
import { Trash2 } from 'lucide-react';
import { MODULE_FIELDS, getDependentOptions } from '../reportEngine';

export const ReportFilterRow = ({
  filter,
  index,
  moduleId,
  filters,
  tms,
  onUpdateFilter,
  onRemoveFilter,
}) => {
  const fields = MODULE_FIELDS[moduleId] || [];
  const currentFieldDef = fields.find(f => f.key === filter.field) || fields[0];

  const fieldKey = filter.field || (fields[0] ? fields[0].key : '');
  const operator = filter.op || 'equals';
  const val = filter.value;

  // Resolve options dynamically using relationship awareness
  const availableOptions = getDependentOptions(moduleId, fieldKey, filters, tms);

  const handleFieldChange = (newField) => {
    const nextDef = fields.find(f => f.key === newField);
    let defaultVal = '';
    let defaultOp = 'equals';

    if (nextDef?.type === 'dateRange') {
      defaultVal = { from: '', to: '' };
      defaultOp = 'between';
    }

    onUpdateFilter(index, {
      field: newField,
      op: defaultOp,
      value: defaultVal,
    });
  };

  const handleOpChange = (newOp) => {
    onUpdateFilter(index, { ...filter, op: newOp });
  };

  const handleValueChange = (newVal) => {
    onUpdateFilter(index, { ...filter, value: newVal });
  };

  const isDateRange = currentFieldDef?.type === 'dateRange' || filter.op === 'between';

  return (
    <div className="report-filter-row-container">
      {/* 1. Field Selector */}
      <select
        value={fieldKey}
        onChange={(e) => handleFieldChange(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          height: '36px',
          padding: '0 8px',
          borderRadius: '6px',
          border: '1px solid var(--border-strong, #cbd5e1)',
          background: '#ffffff',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--text-heading, #1e293b)',
          outline: 'none',
        }}
      >
        {fields.map(f => (
          <option key={f.key} value={f.key}>
            {f.label}
          </option>
        ))}
      </select>

      {/* 2. Operator Selector */}
      <select
        value={operator}
        onChange={(e) => handleOpChange(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          height: '36px',
          padding: '0 8px',
          borderRadius: '6px',
          border: '1px solid var(--border-strong, #cbd5e1)',
          background: 'var(--surface-muted, #f8fafc)',
          fontSize: '12px',
          color: 'var(--text-body, #334155)',
          outline: 'none',
        }}
      >
        {isDateRange ? (
          <option value="between">between</option>
        ) : (
          <>
            <option value="equals">equals</option>
            <option value="not_equals">not equals</option>
            <option value="contains">contains</option>
          </>
        )}
      </select>

      {/* 3. Value Selector */}
      <div style={{ minWidth: 0, width: '100%' }}>
        {isDateRange ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="date"
              value={val?.from || ''}
              onChange={(e) => handleValueChange({ ...(val || {}), from: e.target.value })}
              style={{
                flex: 1,
                minWidth: 0,
                boxSizing: 'border-box',
                height: '36px',
                padding: '0 6px',
                borderRadius: '6px',
                border: '1px solid var(--border-strong, #cbd5e1)',
                fontSize: '11px',
                color: 'var(--text-heading, #1e293b)',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>–</span>
            <input
              type="date"
              value={val?.to || ''}
              onChange={(e) => handleValueChange({ ...(val || {}), to: e.target.value })}
              style={{
                flex: 1,
                minWidth: 0,
                boxSizing: 'border-box',
                height: '36px',
                padding: '0 6px',
                borderRadius: '6px',
                border: '1px solid var(--border-strong, #cbd5e1)',
                fontSize: '11px',
                color: 'var(--text-heading, #1e293b)',
                outline: 'none',
              }}
            />
          </div>
        ) : availableOptions.length > 0 ? (
          <select
            value={val || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              height: '36px',
              padding: '0 8px',
              borderRadius: '6px',
              border: '1px solid var(--border-strong, #cbd5e1)',
              background: '#ffffff',
              fontSize: '12px',
              color: 'var(--text-heading, #1e293b)',
              outline: 'none',
            }}
          >
            <option value="">— Select {currentFieldDef?.label || 'Option'} —</option>
            {availableOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            placeholder={`Enter ${currentFieldDef?.label || 'value'}...`}
            value={val || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              height: '36px',
              padding: '0 8px',
              borderRadius: '6px',
              border: '1px solid var(--border-strong, #cbd5e1)',
              fontSize: '12px',
              color: 'var(--text-heading, #1e293b)',
              outline: 'none',
            }}
          />
        )}
      </div>

      {/* 4. Remove Button */}
      <button
        type="button"
        title="Remove condition"
        onClick={() => onRemoveFilter(index)}
        style={{
          all: 'unset',
          cursor: 'pointer',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          color: 'var(--kr-grey-500, #94a3b8)',
          background: 'var(--kr-grey-50, #f8fafc)',
          transition: 'all 0.15s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#dc2626';
          e.currentTarget.style.background = '#fee2e2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--kr-grey-500, #94a3b8)';
          e.currentTarget.style.background = 'var(--kr-grey-50, #f8fafc)';
        }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
};

export default ReportFilterRow;
