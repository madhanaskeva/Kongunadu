import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * Premium custom multi-choice dropdown with checkboxes, live search,
 * select-all/clear shortcuts, and visual counter badges.
 */
export const ReportMultiSelect = ({
  values = [],
  options = [],
  onChange,
  placeholder = 'Select…',
  fieldName = 'Choice',
  style,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  // Normalize selected values to an array
  const selectedList = useMemo(() => {
    if (Array.isArray(values)) return values;
    if (values != null && values !== '') return [values];
    return [];
  }, [values]);

  // Normalize options to [{ value, label }]
  const normalizedOptions = useMemo(() => {
    return options.map(opt =>
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    );
  }, [options]);

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

  // Filter options based on live search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.trim().toLowerCase();
    return normalizedOptions.filter(o =>
      String(o.label).toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchQuery]);

  // Toggle a single option
  const handleToggleOption = (val) => {
    if (selectedList.includes(val)) {
      onChange(selectedList.filter(v => v !== val));
    } else {
      onChange([...selectedList, val]);
    }
  };

  // Select all currently visible/filtered options
  const handleSelectAll = () => {
    const toAdd = filteredOptions.map(o => o.value);
    const combined = Array.from(new Set([...selectedList, ...toAdd]));
    onChange(combined);
  };

  // Clear all selections
  const handleClearAll = (e) => {
    if (e) e.stopPropagation();
    onChange([]);
  };

  // Human-readable trigger summary
  const triggerSummary = useMemo(() => {
    if (selectedList.length === 0) return null;
    const selectedLabels = selectedList
      .map(v => normalizedOptions.find(o => o.value === v)?.label || v)
      .map(l => String(l).replace(/\s*\([^)]*\)$/, '')); // clean off trailing phone/id in trigger for brevity

    if (selectedLabels.length === 1) {
      return { text: selectedLabels[0], count: 1 };
    }
    if (selectedLabels.length === 2) {
      return { text: `${selectedLabels[0]}, ${selectedLabels[1]}`, count: 2 };
    }
    return {
      text: `${selectedLabels[0]} + ${selectedLabels.length - 1} more`,
      count: selectedLabels.length,
    };
  }, [selectedList, normalizedOptions]);

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
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(prev => !prev)}
        style={{
          all: 'unset',
          boxSizing: 'border-box',
          width: '100%',
          height: '36px',
          padding: '0 8px 0 10px',
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
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
          {triggerSummary ? (
            <>
              <span
                style={{
                  fontWeight: 600,
                  color: 'var(--text-heading, #1e293b)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {triggerSummary.text}
              </span>
              {triggerSummary.count > 1 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: 'var(--kr-green-50, #edf8f3)',
                    border: '1px solid var(--kr-green-100, #daf1e7)',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: 'var(--color-brand, #00623f)',
                    flexShrink: 0,
                  }}
                >
                  {triggerSummary.count}
                </span>
              )}
            </>
          ) : (
            <span style={{ color: 'var(--text-muted, #94a3b8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {placeholder}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {selectedList.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              title="Clear selection"
              onClick={handleClearAll}
              onKeyDown={(e) => { if (e.key === 'Enter') handleClearAll(e); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'var(--kr-grey-100, #f1f5f9)',
                color: 'var(--kr-grey-600, #475569)',
                cursor: 'pointer',
                transition: 'background 0.12s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--kr-grey-100, #f1f5f9)'; e.currentTarget.style.color = 'var(--kr-grey-600, #475569)'; }}
            >
              <X size={11} strokeWidth={2.5} />
            </span>
          )}

          <ChevronDown
            size={14}
            style={{
              color: open ? 'var(--color-brand, #00623f)' : 'var(--kr-grey-500, #64748b)',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.18s ease',
            }}
          />
        </div>
      </button>

      {/* Floating Popover Menu */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            minWidth: '260px',
            background: '#ffffff',
            border: '1px solid var(--border-default, #e2e8f0)',
            borderRadius: '8px',
            boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.14), 0 6px 12px -2px rgba(0, 0, 0, 0.08)',
            zIndex: 9999,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search Header */}
          <div
            style={{
              padding: '8px 10px',
              borderBottom: '1px solid var(--border-default, #e2e8f0)',
              background: '#ffffff',
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search
                size={13}
                style={{
                  position: 'absolute',
                  left: '8px',
                  color: 'var(--kr-grey-400, #94a3b8)',
                }}
              />
              <input
                type="text"
                autoFocus
                placeholder={`Search ${fieldName.toLowerCase()}…`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  height: '30px',
                  paddingLeft: '28px',
                  paddingRight: searchQuery ? '24px' : '8px',
                  borderRadius: '5px',
                  border: '1px solid var(--border-strong, #cbd5e1)',
                  fontSize: '12px',
                  outline: 'none',
                  color: 'var(--text-heading, #1e293b)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-brand, #00623f)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong, #cbd5e1)'; }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    all: 'unset',
                    position: 'absolute',
                    right: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--kr-grey-400)',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div
            style={{
              padding: '6px 10px',
              background: 'var(--surface-muted, #f8fafc)',
              borderBottom: '1px solid var(--border-default, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: 'var(--color-brand, #00623f)',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
              >
                Select all
              </button>
              <span style={{ color: 'var(--border-strong, #cbd5e1)' }}>|</span>
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: 'var(--kr-grey-600, #64748b)',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
              >
                Clear all
              </button>
            </div>

            <span style={{ color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
              {selectedList.length} of {normalizedOptions.length}
            </span>
          </div>

          {/* Options List with Checkboxes */}
          <div
            style={{
              maxHeight: '230px',
              overflowY: 'auto',
              padding: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--text-muted, #94a3b8)',
                }}
              >
                No matching {fieldName.toLowerCase()} found.
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isChecked = selectedList.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleToggleOption(opt.value)}
                    style={{
                      padding: '7px 8px',
                      borderRadius: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      cursor: 'pointer',
                      background: isChecked ? 'var(--kr-green-50, #edf8f3)' : 'transparent',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isChecked) e.currentTarget.style.background = 'var(--surface-muted, #f8fafc)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isChecked) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Custom Checkbox Square */}
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        border: `1.5px solid ${isChecked ? 'var(--color-brand, #00623f)' : '#cbd5e1'}`,
                        background: isChecked ? 'var(--color-brand, #00623f)' : '#ffffff',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        transition: 'all 0.14s ease',
                      }}
                    >
                      {isChecked && <Check size={11} strokeWidth={3} style={{ color: '#ffffff' }} />}
                    </div>

                    {/* Option Label */}
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: isChecked ? 600 : 400,
                        color: isChecked ? 'var(--kr-green-900, #003021)' : 'var(--text-body, #334155)',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {opt.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Apply / Close */}
          <div
            style={{
              padding: '6px 10px',
              borderTop: '1px solid var(--border-default, #e2e8f0)',
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '4px 14px',
                borderRadius: '5px',
                background: 'var(--color-brand, #00623f)',
                color: '#ffffff',
                fontSize: '11.5px',
                fontWeight: 700,
                textAlign: 'center',
                boxShadow: '0 1px 2px rgba(0, 98, 63, 0.15)',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReportMultiSelect;
