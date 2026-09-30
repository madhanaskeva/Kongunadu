import React from 'react';
import { Select } from 'antd';

/**
 * Compact single-select dropdown for the report filter rows (antd Select).
 * The popup is portalled by antd so the report panels never clip it.
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

  return (
    <Select
      value={value === '' ? undefined : value}
      options={normalizedOptions}
      onChange={(v) => onChange && onChange(v)}
      placeholder={placeholder}
      disabled={disabled}
      listHeight={264}
      style={{ width: '100%', ...style, ...buttonStyle }}
    />
  );
};

export default ReportCustomSelect;
