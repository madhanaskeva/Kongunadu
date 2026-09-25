import React, { useState } from 'react';
import { Plus, X, MapPin } from 'lucide-react';

/**
 * FormLocationsInput — add a client's loading locations while creating or editing
 * the client. Each name typed here becomes a record in the Loading Location Master,
 * owned by this client; the address, safe radius and GPS coordinates are filled in
 * from that module afterwards.
 */
export const FormLocationsInput = ({
  label = 'Loading locations',
  value = [],
  onChange,
  placeholder = 'Type a loading location (e.g. Sriperumbudur Cryogenic Hub)',
  hint,
}) => {
  const [inputValue, setInputValue] = useState('');

  const list = Array.isArray(value)
    ? value.filter(Boolean)
    : typeof value === 'string' && value
    ? value.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (list.some((l) => l.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue('');
      return;
    }
    if (onChange) onChange([...list, trimmed]);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (indexToRemove) => {
    if (onChange) onChange(list.filter((_, idx) => idx !== indexToRemove));
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
        {list.length > 0 && (
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-brand)' }}>
            {list.length} location{list.length > 1 ? 's' : ''}
          </span>
        )}
      </label>

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
        {hint || (
          <>
            Type a location and click <strong>+ Add</strong> (or press Enter). Each one is saved to the
            Loading Location Master under this client, where you can set its address, safe radius and GPS.
          </>
        )}
      </span>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '2px' }}>
        {list.length === 0 ? (
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
            No loading location added for this client.
          </div>
        ) : (
          list.map((locName, idx) => (
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
              <MapPin size={14} style={{ color: 'var(--color-brand)', flex: 'none' }} />
              <span>{locName}</span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                aria-label={`Remove ${locName}`}
                title={`Remove ${locName}`}
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

export default FormLocationsInput;
