import React from 'react';
import { Trash2 } from 'lucide-react';
import { MODULE_FIELDS, getDependentOptions } from '../reportEngine';
import { ReportCustomSelect } from './ReportCustomSelect';
import { ReportMultiSelect } from './ReportMultiSelect';

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
    let defaultVal = [];
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

  // Field options for custom dropdown
  const fieldSelectOptions = fields.map(f => ({
    value: f.key,
    label: f.label,
  }));

  // Operator options for custom dropdown
  const operatorSelectOptions = isDateRange
    ? [{ value: 'between', label: 'between' }]
    : [
        { value: 'equals', label: 'is' },
        { value: 'not_equals', label: 'is not' },
        { value: 'contains', label: 'includes' },
      ];

  return (
    <div
      className="report-filter-row-container"
      style={{
        position: 'relative',
        zIndex: (filters.length - index) * 10 + 5,
      }}
    >
      {/* 1. Field Selector */}
      <ReportCustomSelect
        value={fieldKey}
        options={fieldSelectOptions}
        onChange={handleFieldChange}
        placeholder="Select Field"
      />

      {/* 2. Operator Selector */}
      <ReportCustomSelect
        value={operator}
        options={operatorSelectOptions}
        onChange={handleOpChange}
        placeholder="Rule"
        buttonStyle={{ background: 'var(--surface-muted, #f8fafc)' }}
      />

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
                padding: '0 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-strong, #cbd5e1)',
                fontSize: '11.5px',
                color: 'var(--text-heading, #1e293b)',
                outline: 'none',
                background: '#ffffff',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-brand, #00623f)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong, #cbd5e1)'; }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>–</span>
            <input
              type="date"
              value={val?.to || ''}
              onChange={(e) => handleValueChange({ ...(val || {}), to: e.target.value })}
              style={{
                flex: 1,
                minWidth: 0,
                boxSizing: 'border-box',
                height: '36px',
                padding: '0 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-strong, #cbd5e1)',
                fontSize: '11.5px',
                color: 'var(--text-heading, #1e293b)',
                outline: 'none',
                background: '#ffffff',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-brand, #00623f)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong, #cbd5e1)'; }}
            />
          </div>
        ) : availableOptions.length > 0 ? (
          /* Multi-Select with Checkboxes, Live Search & Select All */
          <ReportMultiSelect
            values={val}
            options={availableOptions}
            onChange={handleValueChange}
            placeholder={`— Select ${currentFieldDef?.label || 'Choice'}(s) —`}
            fieldName={currentFieldDef?.label || 'Choice'}
          />
        ) : (
          /* Text input fallback for free-form fields */
          <input
            type="text"
            placeholder={`Enter ${currentFieldDef?.label || ''}…`}
            value={typeof val === 'string' ? val : (Array.isArray(val) ? val.join(', ') : '')}
            onChange={(e) => handleValueChange(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              height: '36px',
              padding: '0 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-strong, #cbd5e1)',
              fontSize: '12px',
              color: 'var(--text-heading, #1e293b)',
              outline: 'none',
              background: '#ffffff',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-brand, #00623f)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong, #cbd5e1)'; }}
          />
        )}
      </div>

      {/* 4. Remove Button */}
      <button
        type="button"
        title="Remove"
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
