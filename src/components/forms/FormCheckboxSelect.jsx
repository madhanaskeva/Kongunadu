import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * FormCheckboxSelect — Reusable Multi-Select Dropdown with Checkboxes.
 * 
 * Props:
 *   label: string (field label)
 *   name: string (field name)
 *   value: array of selected values/IDs OR comma-separated string
 *   onChange: ({ target: { name, value, labels, string } }) => void
 *   options: Array<{ value, label }> | Array<{ id, name }> | string[]
 *   placeholder: string
 *   error: string
 *   required: boolean
 *   disabled: boolean
 *   style: object
 *   hint: string
 */
export const FormCheckboxSelect = ({
  label,
  name = 'clients',
  value,
  onChange,
  options = [],
  placeholder = 'Select options',
  error,
  required = false,
  disabled = false,
  style = {},
  hint,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Normalize options to { value: string, label: string }
  const normalizedOptions = useMemo(() => {
    return (options || []).map((opt) => {
      if (typeof opt === 'string') return { value: opt, label: opt };
      return {
        value: String(opt.value ?? opt.id ?? opt.name ?? ''),
        label: String(opt.label ?? opt.name ?? opt.value ?? ''),
      };
    });
  }, [options]);

  // Normalize incoming value into an array of string values
  const selectedValues = useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(v => String(v));
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [String(value)];
  }, [value]);

  // Determine checked state for an option: matches either value (ID) or label (name)
  const isOptionSelected = (opt) => {
    return (
      selectedValues.includes(opt.value) ||
      selectedValues.includes(opt.label) ||
      selectedValues.some(v => v.toLowerCase() === opt.label.toLowerCase() || v.toLowerCase() === opt.value.toLowerCase())
    );
  };

  // Filtered options based on search input
  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [normalizedOptions, search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Dispatch change
  const emitChange = (nextValues) => {
    // Map selected IDs/values to labels
    const selectedLabels = normalizedOptions
      .filter((opt) => nextValues.includes(opt.value) || nextValues.includes(opt.label))
      .map((opt) => opt.label);

    if (onChange) {
      onChange({
        target: {
          name,
          value: nextValues,
          labels: selectedLabels,
          string: selectedLabels.join(', '),
        },
      });
    }
  };

  const handleToggle = (opt) => {
    if (disabled) return;
    const checked = isOptionSelected(opt);
    let next;
    if (checked) {
      next = selectedValues.filter(
        (v) =>
          v !== opt.value &&
          v !== opt.label &&
          v.toLowerCase() !== opt.value.toLowerCase() &&
          v.toLowerCase() !== opt.label.toLowerCase()
      );
    } else {
      next = [...selectedValues, opt.value];
    }
    emitChange(next);
  };

  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (disabled) return;
    const allFilteredVals = filteredOptions.map((o) => o.value);
    const combined = Array.from(new Set([...selectedValues, ...allFilteredVals]));
    emitChange(combined);
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    if (disabled) return;
    emitChange([]);
  };

  // Selected labels for summary display
  const selectedLabels = useMemo(() => {
    return normalizedOptions
      .filter((opt) => isOptionSelected(opt))
      .map((opt) => opt.label);
  }, [normalizedOptions, selectedValues]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: '100%',
        position: 'relative',
        ...style,
      }}
    >
      {/* Label */}
      {label && (
        <label
          style={{
            fontFamily: 'var(--font-display, inherit)',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-heading, #1e293b)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--kr-red-600, #dc2626)' }}>*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        style={{
          boxSizing: 'border-box',
          width: '100%',
          minHeight: '42px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-md, 8px)',
          border: `1px solid ${
            error
              ? 'var(--kr-red-600, #dc2626)'
              : isOpen
              ? 'var(--color-brand, #00623f)'
              : 'var(--border-strong, #cbd5e1)'
          }`,
          boxShadow: isOpen
            ? '0 0 0 2px rgba(0, 98, 63, 0.18)'
            : 'none',
          background: disabled ? 'var(--surface-muted, #f8fafc)' : '#ffffff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          transition: 'all 0.15s ease',
          outline: 'none',
        }}
      >
        {/* Value Display */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {selectedLabels.length === 0 ? (
            <span
              style={{
                color: 'var(--text-muted, #94a3b8)',
                fontSize: '14px',
                fontFamily: 'var(--font-body, inherit)',
              }}
            >
              {placeholder}
            </span>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                width: '100%',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  background: 'var(--color-brand-soft, #e6f4ea)',
                  color: 'var(--kr-green-800, #00623f)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {selectedLabels.length} {selectedLabels.length === 1 ? 'client' : 'clients'}
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-heading, #1e293b)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-body, inherit)',
                }}
                title={selectedLabels.join(', ')}
              >
                {selectedLabels.join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {selectedLabels.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClearAll}
              title="Clear all"
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'var(--surface-muted, #e2e8f0)',
                color: 'var(--text-muted, #64748b)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#cbd5e1')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-muted, #e2e8f0)')}
            >
              <X size={12} />
            </button>
          )}
          <ChevronDown
            size={16}
            style={{
              color: 'var(--text-muted, #64748b)',
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'rotate(180deg)' : 'none',
            }}
          />
        </div>
      </div>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1100,
            background: '#ffffff',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--border-default, #e2e8f0)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'tmsFadeIn 0.15s ease',
          }}
        >
          {/* Search Header */}
          <div
            style={{
              padding: '8px 10px',
              borderBottom: '1px solid var(--border-default, #e2e8f0)',
              background: 'var(--surface-muted, #f8fafc)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Search size={15} style={{ color: 'var(--text-muted, #94a3b8)', flexShrink: 0 }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              autoFocus
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '13px',
                color: 'var(--text-heading, #1e293b)',
                fontFamily: 'inherit',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  color: 'var(--text-muted, #94a3b8)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Actions Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              borderBottom: '1px solid var(--border-default, #f1f5f9)',
              background: '#ffffff',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <span style={{ color: 'var(--text-muted, #64748b)' }}>
              {filteredOptions.length} available
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  color: 'var(--color-brand, #00623f)',
                  fontWeight: 700,
                }}
              >
                Select all
              </button>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  color: 'var(--text-muted, #64748b)',
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Option List */}
          <div
            style={{
              maxHeight: '210px',
              overflowY: 'auto',
              padding: '4px 0',
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'var(--text-muted, #94a3b8)',
                }}
              >
                No matching clients found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = isOptionSelected(opt);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleToggle(opt)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--color-brand-tint, rgba(0, 98, 63, 0.05))' : 'transparent',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--surface-muted, #f8fafc)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Custom Checkbox */}
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: `2px solid ${
                          isSelected ? 'var(--color-brand, #00623f)' : 'var(--border-strong, #cbd5e1)'
                        }`,
                        background: isSelected ? 'var(--color-brand, #00623f)' : '#ffffff',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected && <Check size={13} color="#ffffff" strokeWidth={3} />}
                    </div>

                    {/* Option Label */}
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? 'var(--color-brand, #00623f)' : 'var(--text-heading, #1e293b)',
                        lineHeight: 1.4,
                      }}
                    >
                      {opt.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Error or Hint */}
      {error ? (
        <span style={{ fontSize: '12px', color: 'var(--kr-red-600, #dc2626)', fontWeight: 600 }}>
          {error}
        </span>
      ) : hint ? (
        <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>{hint}</span>
      ) : null}
    </div>
  );
};

export default FormCheckboxSelect;

