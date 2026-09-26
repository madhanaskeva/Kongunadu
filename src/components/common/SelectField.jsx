import React from 'react';
import { Select } from 'antd';
import { ChevronDown } from 'lucide-react';

/**
 * SelectField — the app's one dropdown.
 *
 * A native <select> draws its option list with the operating system, so it
 * cannot be styled: you get the OS blue highlight and a plain list, which is
 * what every filter bar looked like before. This wraps antd's Select, whose
 * popup is real DOM, so the list picks up the brand tokens set in AntdProvider.
 *
 * Props:
 * - value / onChange(value)   plain value in, plain value out
 * - options                   ['A', 'B'] or [{ value, label }]
 * - placeholder               shown when nothing is picked
 * - allLabel                  adds a leading "clear" option with value ''
 * - icon                      lucide icon component rendered inside the control
 * - label / hint / error      optional field chrome; omit for a bare control
 * - height                    control height, default 44 (filter bars use 44, forms 40)
 */
export const SelectField = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select',
  allLabel,
  icon: Icon,
  label,
  hint,
  error,
  disabled = false,
  height = 44,
  width,
  style = {},
  ariaLabel,
}) => {
  const items = [
    ...(allLabel ? [{ value: '', label: allLabel }] : []),
    ...options.map(o => (typeof o === 'object' ? { value: o.value, label: o.label } : { value: o, label: o })),
  ];

  const control = (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
      {Icon && (
        <Icon
          size={17}
          style={{ position: 'absolute', left: '12px', zIndex: 1, pointerEvents: 'none', color: 'var(--kr-grey-700)' }}
        />
      )}
      <Select
        value={value === '' || value == null ? undefined : value}
        onChange={(v) => onChange && onChange(v === undefined ? '' : v)}
        options={items}
        placeholder={allLabel || placeholder}
        disabled={disabled}
        aria-label={ariaLabel || label}
        status={error ? 'error' : undefined}
        popupMatchSelectWidth={false}
        optionFilterProp="label"
        suffixIcon={<ChevronDown size={17} style={{ color: 'var(--kr-grey-700)' }} />}
        // antd v6 derives its vertical padding from --ant-select-height, so the
        // height is set through the variable to keep the text vertically centred.
        style={{ width: '100%', height: `${height}px`, '--ant-select-height': `${height}px` }}
        classNames={{ popup: { root: 'tms-select-popup' } }}
        className={['tms-select', Icon && 'tms-select-has-icon', height >= 44 && 'tms-select--bar', allLabel && 'tms-select--all'].filter(Boolean).join(' ')}
      />
    </div>
  );

  if (!label && !hint && !error) {
    return <div style={{ width: width || '100%', flex: width ? 'none' : undefined, ...style }}>{control}</div>;
  }

  return (
    <div style={{ width: width || '100%', flex: width ? 'none' : undefined, ...style }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-heading)',
          }}
        >
          {label}
        </label>
      )}
      {control}
      {error ? (
        <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: 'var(--kr-red-700)' }}>{error}</span>
      ) : hint ? (
        <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>{hint}</span>
      ) : null}
    </div>
  );
};

export default SelectField;
