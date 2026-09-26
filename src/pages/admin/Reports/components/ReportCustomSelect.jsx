import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useListbox } from '../../../../components/common/Listbox';

/**
 * Compact single-select dropdown for the report filter rows.
 * The open list is the shared designed list box (components/common/Listbox):
 * portalled so the report panels never clip it, 40px rows, brand-tint hover,
 * selected row with a check mark, full keyboard support.
 *
 * Props (unchanged): value, options ([string] | [{ value, label }]),
 * onChange(value), placeholder, style, buttonStyle, disabled.
 */
export const ReportCustomSelect = ({
  value,
  options = [],
  onChange,
  placeholder = 'Select…',
  style,
  buttonStyle,
  disabled = false,
}) => {
  // Normalize options to [{ value, label }]
  const normalizedOptions = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const lb = useListbox({
    options: normalizedOptions,
    value,
    disabled,
    minWidth: 200,
    maxHeight: 264,
    onSelect: (o) => onChange && onChange(o.value),
  });
  const selectedOption = normalizedOptions.find(o => o.value === value);

  return (
    <div style={{ position: 'relative', width: '100%', userSelect: 'none', ...style }}>
      <button
        {...lb.triggerProps}
        className="kr-select-trigger"
        style={{
          all: 'unset',
          boxSizing: 'border-box',
          width: '100%',
          height: '36px',
          padding: '0 10px',
          background: disabled ? 'var(--surface-muted)' : '#ffffff',
          border: `1px solid ${lb.open ? 'var(--color-brand, #00623f)' : 'var(--border-strong, #c2c2bb)'}`,
          borderRadius: 'var(--radius-md, 8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: lb.open ? 'var(--focus-ring)' : 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          fontSize: '13px',
          fontWeight: selectedOption ? 600 : 400,
          color: selectedOption ? 'var(--text-heading, #1c1c1a)' : 'var(--text-muted, #7c7c76)',
          ...buttonStyle,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          style={{
            flexShrink: 0,
            color: lb.open ? 'var(--color-brand, #00623f)' : 'var(--kr-grey-700, #4a4a46)',
            transform: lb.open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s ease',
          }}
        />
      </button>
      {lb.popover}
    </div>
  );
};

export default ReportCustomSelect;
