import React, { useState } from 'react';
import { Input as AntInput } from 'antd';
import { Eye, EyeOff } from 'lucide-react';

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
  /* Password fields get a real show/hide button (lucide Eye / EyeOff) in the
     suffix slot, so it sits inside the field on the right, vertically centred,
     and the affix wrapper reserves room for it so typed text never runs under it. */
  const isPassword = type === 'password';
  const [reveal, setReveal] = useState(false);
  const eyeToggle = isPassword ? (
    <button
      type="button"
      className="tms-pw-toggle"
      onClick={() => setReveal(r => !r)}
      aria-label={reveal ? 'Hide password' : 'Show password'}
      aria-pressed={reveal}
      disabled={disabled}
    >
      {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  ) : undefined;

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

      <AntInput
        name={name}
        type={isPassword ? (reveal ? 'text' : 'password') : type}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        status={error ? 'error' : undefined}
        prefix={Icon ? <Icon size={18} style={{ color: 'var(--text-muted)' }} /> : undefined}
        suffix={eyeToggle}
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
