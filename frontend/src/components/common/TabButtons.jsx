import React from 'react';
import { Button, Flex } from 'antd';

// A row of round buttons used in place of tabs and segmented switches:
// the active one is filled, the rest outlined. Wraps onto more lines on wide
// screens; on phones it stays one row that scrolls sideways (.tms-scroll-row),
// unless scroll is false (a few long labels read better wrapped).
// items: [{ value, label, icon?, disabled? }]
export const TabButtons = ({ items, value, onChange, size = 'middle', ariaLabel, scroll = true, className = '', style }) => (
  <Flex gap={8} wrap align="center" role="tablist" aria-label={ariaLabel} className={`tms-tab-buttons${scroll ? ' tms-scroll-row' : ''} ${className}`} style={style}>
    {items.map(item => {
      const on = item.value === value;
      return (
        <Button
          key={item.value}
          role="tab"
          aria-selected={on}
          shape="round"
          size={size}
          type={on ? 'primary' : 'default'}
          icon={item.icon}
          disabled={item.disabled}
          onClick={() => { if (!on) onChange(item.value); }}
        >
          {item.label}
        </Button>
      );
    })}
  </Flex>
);

export default TabButtons;
