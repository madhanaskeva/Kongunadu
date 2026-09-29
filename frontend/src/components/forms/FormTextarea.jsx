import React from 'react';
import { Input as AntInput } from 'antd';

const { TextArea: AntTextArea } = AntInput;

/**
 * FormTextarea — antd TextArea-backed reusable form component.
 *
 * Props interface matching FormInput and FormSelect:
 *   label, name, value, onChange, placeholder, error, helperText,
 *   disabled, required, rows, style
 */
export const FormTextarea = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  disabled = false,
  required = false,
  rows = 4,
  style = {},
  ...props
}) => {
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

      <AntTextArea
        name={name}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        status={error ? 'error' : undefined}
        style={{
          fontSize: '14px',
          fontFamily: 'var(--font-body)',
          color: 'var(--text-heading)',
          borderRadius: 'var(--radius-md)',
          borderColor: error ? 'var(--kr-red-600)' : undefined,
          resize: 'vertical',
          padding: '10px 14px',
        }}
        {...props}
      />

      {error && (
        <span style={{ fontSize: '12px', color: 'var(--kr-red-600)', fontWeight: 600 }}>
          {error}
        </span>
      )}
      {helperText && !error && (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{helperText}</span>
      )}
    </div>
  );
};

export default FormTextarea;

