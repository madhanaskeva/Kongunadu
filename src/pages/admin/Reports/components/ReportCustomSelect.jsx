import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Modern, attractive, compact custom single-select dropdown.
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
  const [open, setOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open]);

  // Toggle open and auto-detect if menu should open upwards or downwards
  const handleToggleOpen = () => {
    if (disabled) return;
    if (!open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 200px space below, flip upwards
      setOpenUpwards(spaceBelow < 200 && rect.top > 180);
    }
    setOpen(prev => !prev);
  };

  // Normalize options to [{ value, label }]
  const normalizedOptions = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find(o => o.value === value);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggleOpen}
        style={{
          all: 'unset',
          boxSizing: 'border-box',
          width: '100%',
          height: '36px',
          padding: '0 10px',
          background: '#ffffff',
          border: `1px solid ${open ? 'var(--color-brand, #00623f)' : 'var(--border-strong, #cbd5e1)'}`,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: open ? '0 0 0 3px rgba(0, 98, 63, 0.12)' : 'none',
          transition: 'all 0.15s ease',
          fontSize: '12px',
          fontWeight: 600,
          color: selectedOption ? 'var(--text-heading, #1e293b)' : 'var(--text-muted, #94a3b8)',
          ...buttonStyle,
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          style={{
            flexShrink: 0,
            color: open ? 'var(--color-brand, #00623f)' : 'var(--kr-grey-500, #64748b)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s ease',
          }}
        />
      </button>

      {/* Floating Menu Popover (Compact & Auto-Positioned) */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: openUpwards ? 'auto' : 'calc(100% + 4px)',
            bottom: openUpwards ? 'calc(100% + 4px)' : 'auto',
            left: 0,
            minWidth: '100%',
            width: 'max-content',
            maxWidth: '280px',
            background: '#ffffff',
            border: '1px solid var(--border-default, #e2e8f0)',
            borderRadius: '8px',
            boxShadow: '0 10px 24px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.06)',
            padding: '3px',
            zIndex: 9999,
            maxHeight: '160px',
            overflowY: 'auto',
          }}
        >
          {normalizedOptions.map(opt => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  padding: '5px 8px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? 'var(--color-brand, #00623f)' : 'var(--text-body, #334155)',
                  background: isSelected ? 'var(--kr-green-50, #edf8f3)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--surface-muted, #f8fafc)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={13} style={{ color: 'var(--color-brand, #00623f)', flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReportCustomSelect;
