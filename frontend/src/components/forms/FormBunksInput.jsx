import React, { useState } from 'react';
import { Plus, X, Fuel } from 'lucide-react';

export const FormBunksInput = ({
  label = 'Authorized fuel bunks',
  value = [],
  onChange,
  placeholder = 'Type bunk name manually (e.g. IOC – Salem Highway Hub)',
}) => {
  const [inputValue, setInputValue] = useState('');

  const bunksList = Array.isArray(value)
    ? value
    : typeof value === 'string' && value
    ? value.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (bunksList.some((b) => b.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue('');
      return;
    }
    const next = [...bunksList, trimmed];
    if (onChange) {
      onChange(next);
    }
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (indexToRemove) => {
    const next = bunksList.filter((_, idx) => idx !== indexToRemove);
    if (onChange) {
      onChange(next);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--text-heading)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span>{label}</span>
        {bunksList.length > 0 && (
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-brand)' }}>
            {bunksList.length} bunk{bunksList.length > 1 ? 's' : ''} authorized
          </span>
        )}
      </label>

      {/* Manual Input Container with Right-Corner Add Button */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            width: '100%',
            height: '42px',
            padding: '0 96px 0 12px',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--border-strong)',
            fontSize: '14px',
            fontFamily: 'inherit',
            color: 'var(--text-heading)',
            outline: 'none',
            boxSizing: 'border-box',
            background: '#fff',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--color-brand)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          style={{
            position: 'absolute',
            right: '4px',
            height: '34px',
            padding: '0 12px',
            background: inputValue.trim() ? 'var(--color-brand)' : 'var(--kr-grey-300)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-display)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
          }}
        >
          <Plus size={16} />
          <span>Add</span>
        </button>
      </div>

      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        Type a bunk name above and click <strong>+ Add</strong> (or press Enter) to authorize it for this route.
      </span>

      {/* Added Bunks Tag List */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '2px' }}>
        {bunksList.length === 0 ? (
          <div
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px dashed var(--border-default)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-muted)',
              fontSize: '13px',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}
          >
            No authorized bunks added for this route.
          </div>
        ) : (
          bunksList.map((bunkName, idx) => (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-brand-tint)',
                border: '1px solid rgba(0, 98, 63, 0.25)',
                color: 'var(--kr-green-900)',
                fontSize: '13px',
                fontWeight: 600,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <Fuel size={14} style={{ color: 'var(--color-brand)', flex: 'none' }} />
              <span>{bunkName}</span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                aria-label={`Remove ${bunkName}`}
                title={`Remove ${bunkName}`}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'rgba(217, 45, 32, 0.12)',
                  color: 'var(--kr-red-600)',
                  fontWeight: 700,
                  fontSize: '12px',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(217, 45, 32, 0.25)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(217, 45, 32, 0.12)')}
              >
                <X size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FormBunksInput;
