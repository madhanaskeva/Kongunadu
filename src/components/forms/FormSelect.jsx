import React from 'react';
import { Select } from 'antd';

/**
 * FormSelect — antd Select-backed drop-in replacement.
 *
 * Props interface identical to original:
 *   label, name, value, onChange, options, placeholder, error, required, disabled, style
 *
 * Visual output exactly matches original:
 *   - 42px height, font-body, border-strong, radius-md
 *   - Brand-green focus border + ring (from ConfigProvider)
 *   - Same label/error wrapper
 *
 * NOTE: antd Select's onChange passes the value directly (not an event).
 * We wrap it to produce a synthetic event-like object so call-sites that
 * do `onChange(e) => { const v = e.target.value; }` still work.
 */
export const FormSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select option',
  error,
  required = false,
  disabled = false,
  style = {},
}) => {
  /* Build antd option format from existing string|{value,label} format */
  const antOptions = options.map((opt) => {
    const val = typeof opt === 'object' ? opt.value : opt;
    const lbl = typeof opt === 'object' ? opt.label : opt;
    return { value: val, label: lbl };
  });

  /* Wrap antd onChange to emit a synthetic event so call-sites don't change */
  const handleChange = (val) => {
    if (onChange) {
      onChange({ target: { name, value: val } });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', ...style }}>
      {label && (
        <label
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-heading)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--kr-red-600)' }}>*</span>}
        </label>
      )}

      <Select
        value={value || undefined}
        onChange={handleChange}
        options={antOptions}
        placeholder={placeholder}
        disabled={disabled}
        status={error ? 'error' : undefined}
        allowClear={false}
        style={{
          width: '100%',
          height: '42px',
          fontSize: '14px',
          fontFamily: 'var(--font-body)',
          borderRadius: 'var(--radius-md)',
        }}
        popupMatchSelectWidth={true}
      />

      {error && (
        <span style={{ fontSize: '12px', color: 'var(--kr-red-600)', fontWeight: 600 }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default FormSelect;
