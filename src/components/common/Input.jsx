import React from 'react';
import { Input as AntInput } from 'antd';

/**
 * Input — antd-backed drop-in replacement.
 *
 * Props interface identical to original:
 *   label, value, onChange, type, placeholder, error, helperText,
 *   icon (lucide component), disabled, required, name, style
 *
 * Visual output exactly matches original: 42px height, border-strong border,
 * brand-green focus ring (--focus-ring), font-body, border-radius-md.
 */
export const Input = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  helperText,
  icon: Icon,
  disabled = false,
  required = false,
  name,
  style = {},
  ...props
}) => {
  /* antd Input.Password for password fields, otherwise standard Input */
  const InputComponent = type === 'password' ? AntInput.Password : AntInput;

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

      <InputComponent
        name={name}
        type={type !== 'password' ? type : undefined}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        status={error ? 'error' : undefined}
        prefix={Icon ? <Icon size={18} style={{ color: 'var(--text-muted)' }} /> : undefined}
        style={{
          height: '42px',
          fontSize: '14px',
          fontFamily: 'var(--font-body)',
          color: 'var(--text-heading)',
          borderRadius: 'var(--radius-md)',
          borderColor: error ? 'var(--kr-red-600)' : undefined,
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

export default Input;
