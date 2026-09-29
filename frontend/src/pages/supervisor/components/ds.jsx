import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useListbox } from '../../../components/common/Listbox';

// Form and feedback controls from the Kongunadu Road Lines design system, as used by the Supervisor App prototype.

const BUTTON_SIZES = {
  sm: { h: 32, px: 12, fs: 14 },
  md: { h: 40, px: 18, fs: 15 },
  lg: { h: 48, px: 24, fs: 16 },
};

const BUTTON_VARIANTS = {
  primary: { bg: 'var(--color-brand)', fg: 'var(--text-on-brand)', bd: 'var(--color-brand)', hbg: 'var(--color-brand-strong)' },
  accent: { bg: 'var(--color-accent)', fg: '#fff', bd: 'var(--color-accent)', hbg: 'var(--color-accent-strong)' },
  secondary: { bg: 'transparent', fg: 'var(--color-brand)', bd: 'var(--color-brand)', hbg: 'var(--color-brand-tint)' },
  ghost: { bg: 'transparent', fg: 'var(--text-heading)', bd: 'transparent', hbg: 'var(--surface-muted)' },
  inverse: { bg: '#fff', fg: 'var(--color-brand)', bd: '#fff', hbg: 'var(--kr-grey-100)' },
};

export const Button = ({ variant = 'primary', size = 'md', icon, iconRight, fullWidth, disabled, children, style, ...rest }) => {
  const [hov, setHov] = useState(false);
  const [act, setAct] = useState(false);
  const s = BUTTON_SIZES[size] || BUTTON_SIZES.md;
  const v = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary;
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setAct(false); }}
      onMouseDown={() => setAct(true)}
      onMouseUp={() => setAct(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: s.h,
        padding: `0 ${s.px}px`,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: s.fs,
        letterSpacing: '0.01em',
        textTransform: 'uppercase',
        color: v.fg,
        background: hov && !disabled ? v.hbg : v.bg,
        border: `2px solid ${hov && !disabled && variant !== 'secondary' ? v.hbg : v.bd}`,
        borderRadius: 'var(--radius-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        width: fullWidth ? '100%' : undefined,
        transform: act && !disabled ? 'translateY(1px)' : 'none',
        transition: 'background var(--dur-fast) var(--ease-out),border-color var(--dur-fast)',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
};

const fieldLabel = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-heading)',
};

export const Input = ({ label, hint, error, prefix, suffix, size = 'md', disabled, style, value, type, ...rest }) => {
  const [focused, setFocused] = useState(false);
  // Password fields carry a show/hide toggle inside the field on the right.
  const isPassword = type === 'password';
  const [reveal, setReveal] = useState(false);
  const h = size === 'sm' ? 36 : 44;
  const bd = error ? 'var(--status-danger)' : focused ? 'var(--color-brand)' : 'var(--border-strong)';
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-body)', ...style }}>
      {label && <span style={fieldLabel}>{label}</span>}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          height: h,
          border: `2px solid ${bd}`,
          borderRadius: 'var(--radius-md)',
          background: disabled ? 'var(--surface-muted)' : '#fff',
          boxShadow: focused ? 'var(--focus-ring)' : 'none',
          transition: 'box-shadow var(--dur-fast),border-color var(--dur-fast)',
        }}
      >
        {prefix && <span style={{ padding: '0 0 0 12px', color: 'var(--text-muted)', display: 'flex' }}>{prefix}</span>}
        <input
          disabled={disabled}
          type={isPassword ? (reveal ? 'text' : 'password') : type}
          value={value ?? ''}
          readOnly={!rest.onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            border: 0,
            outline: 0,
            background: 'transparent',
            padding: '0 12px',
            fontSize: 16,
            fontFamily: 'inherit',
            color: 'var(--text-heading)',
          }}
          {...rest}
        />
        {suffix && <span style={{ padding: '0 12px 0 0', color: 'var(--text-muted)', display: 'flex' }}>{suffix}</span>}
        {isPassword && (
          <button
            type="button"
            className="tms-pw-toggle"
            onClick={() => setReveal(r => !r)}
            aria-label={reveal ? 'Hide password' : 'Show password'}
            aria-pressed={reveal}
            disabled={disabled}
            style={{ marginRight: 4 }}
          >
            {reveal ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </span>
      {(error || hint) && (
        <span style={{ fontSize: 13, color: error ? 'var(--status-danger)' : 'var(--text-muted)' }}>{error || hint}</span>
      )}
    </label>
  );
};

export const Select = ({ label, options = [], placeholder, emptyLabel, value, onChange, disabled, error, hint, name, id, style }) => {
  // A designed list instead of the native <select>, whose open list is drawn by
  // the OS (plain list, blue highlight). Same contract as before: options are
  // [{ value, label }], and onChange receives an event-like object so callers
  // keep reading e.target.value (always a string, as a native select gave).
  const isEmpty = !options.length;
  // With nothing to choose, the control showed only its placeholder and looked broken.
  const locked = disabled || isEmpty;
  const [focused, setFocused] = useState(false);
  const autoId = useId();
  const triggerId = id || `${autoId}-trigger`;
  const labelId = `${autoId}-label`;
  const lb = useListbox({
    options,
    value,
    disabled: locked,
    touch: true,
    labelledBy: label ? labelId : undefined,
    onSelect: (o) => {
      if (!onChange) return;
      const target = { value: o.value == null ? '' : String(o.value), name };
      onChange({ target, currentTarget: target, preventDefault() {}, stopPropagation() {}, persist() {} });
    },
  });
  const active = focused || lb.open;
  const bd = error ? 'var(--status-danger)' : active ? 'var(--color-brand)' : 'var(--border-strong)';
  const text = isEmpty ? (emptyLabel || 'None available') : lb.selected ? lb.selected.label : placeholder || 'Select';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-body)', ...style }}>
      {label && <label id={labelId} htmlFor={triggerId} style={fieldLabel}>{label}</label>}
      <button
        {...lb.triggerProps}
        id={triggerId}
        aria-invalid={error ? true : undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          height: 44,
          boxSizing: 'border-box',
          margin: 0,
          padding: '0 12px',
          fontSize: 16,
          fontFamily: 'inherit',
          textAlign: 'left',
          color: lb.selected ? 'var(--text-heading)' : 'var(--text-muted)',
          fontWeight: lb.selected ? 600 : 400,
          background: locked ? 'var(--surface-muted)' : '#fff',
          border: `2px solid ${bd}`,
          borderRadius: 'var(--radius-md)',
          outline: 0,
          boxShadow: active && !locked ? 'var(--focus-ring)' : 'none',
          cursor: locked ? 'not-allowed' : 'pointer',
          transition: 'box-shadow var(--dur-fast),border-color var(--dur-fast)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
          style={{
            flex: 'none',
            color: locked ? 'var(--text-muted)' : 'var(--text-heading)',
            transform: lb.open ? 'rotate(180deg)' : 'none',
            transition: 'transform var(--dur-fast)',
          }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {lb.popover}
      {(error || hint) && (
        <span style={{ fontSize: 13, color: error ? 'var(--status-danger)' : 'var(--text-muted)' }}>{error || hint}</span>
      )}
    </div>
  );
};

export const Checkbox = ({ label, checked, onChange, disabled, description, style }) => {
  const [hov, setHov] = useState(false);
  return (
    <label
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'flex-start',
        gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'var(--font-body)',
        ...style,
      }}
    >
      <input
        type="checkbox"
        checked={!!checked}
        disabled={disabled}
        onChange={e => onChange && onChange(e.target.checked)}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
      />
      <span
        style={{
          flex: 'none',
          width: 20,
          height: 20,
          marginTop: 1,
          borderRadius: 'var(--radius-sm)',
          border: `2px solid ${checked ? 'var(--color-brand)' : hov ? 'var(--text-muted)' : 'var(--border-strong)'}`,
          background: checked ? 'var(--color-brand)' : '#fff',
          display: 'grid',
          placeItems: 'center',
          transition: 'all var(--dur-fast)',
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5">
            <path d="m5 12 5 5L20 7" />
          </svg>
        )}
      </span>
      <span>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', lineHeight: '22px' }}>{label}</span>
        {description && <span style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)' }}>{description}</span>}
      </span>
    </label>
  );
};

const TOAST_TONES = {
  success: 'var(--status-success)',
  danger: 'var(--status-danger)',
  warning: 'var(--status-warning)',
  info: 'var(--status-info)',
};

export const Toast = ({ tone = 'success', title, message, onDismiss, style }) => (
  <div
    role="status"
    style={{
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      width: 360,
      padding: '12px 14px',
      background: 'var(--surface-inverse)',
      color: 'var(--text-on-inverse)',
      borderLeft: `4px solid ${TOAST_TONES[tone]}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      fontFamily: 'var(--font-body)',
      boxSizing: 'border-box',
      ...style,
    }}
  >
    <div style={{ flex: 1 }}>
      {title && (
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {title}
        </div>
      )}
      {message && <div style={{ fontSize: 14, opacity: 0.85, marginTop: 2 }}>{message}</div>}
    </div>
    {onDismiss && (
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{ all: 'unset', cursor: 'pointer', fontSize: 18, lineHeight: 1, opacity: 0.7 }}
      >
        ×
      </button>
    )}
  </div>
);
