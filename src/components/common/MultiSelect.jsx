import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { matchesSearch } from '../../utils/search';

/**
 * MultiSelect — tick-list picker for a field that holds several values at once.
 *
 * The list scrolls and carries its own search box, so it stays usable whether
 * there are six options or six hundred.
 *
 * Two layouts:
 * - overlay (default): the panel floats over the page, like a native select.
 * - inline: the panel expands in the document flow. Use this inside a drawer,
 *   modal or anything with `overflow: auto`, where a floating panel gets clipped.
 *
 * options: [{ value, label, sub?, count? }]
 */
export const MultiSelect = ({
  options = [],
  value = [],
  onChange,
  allLabel = 'All',
  noun = 'item',
  icon: Icon,
  inline = false,
  searchable = true,
  maxListHeight = 268,
  triggerHeight = 44,
  labelledBy,
  invalid = false,
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const wrapRef = useRef(null);
  const searchRef = useRef(null);

  // An overlay panel closes on an outside click; an inline one is part of the
  // form, so only Escape collapses it.
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (!inline && wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, inline]);

  // Opening lands the caret in the search box so a long list can be typed down.
  useEffect(() => { if (open && searchable) searchRef.current?.focus(); if (!open) setQ(''); }, [open, searchable]);

  const shown = options.filter(o => matchesSearch(q, o.label, o.sub));
  const shownValues = shown.map(o => o.value);
  const allShownOn = shownValues.length > 0 && shownValues.every(v => value.includes(v));

  const toggle = (v) => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  const toggleAllShown = () =>
    onChange(allShownOn ? value.filter(v => !shownValues.includes(v)) : [...new Set([...value, ...shownValues])]);

  // Everything ticked narrows nothing, so it reads the same as nothing ticked.
  const narrowing = value.length > 0 && value.length < options.length;
  const triggerText = value.length === 0
    ? allLabel
    : value.length === options.length && options.length > 1
    ? allLabel
    : value.length === 1
    ? (options.find(o => o.value === value[0]) || {}).label || `1 ${noun}`
    : `${value.length} ${noun}s`;

  const borderColor = invalid
    ? 'var(--kr-red-600)'
    : narrowing || (inline && value.length)
    ? 'var(--kr-green-700)'
    : '#d5dfda';

  const panel = (
    <div
      role="listbox"
      aria-multiselectable="true"
      style={{
        ...(inline
          ? { marginTop: '8px', border: '1px solid #d5dfda', borderRadius: '10px' }
          : {
              position: 'absolute',
              zIndex: 40,
              top: 'calc(100% + 6px)',
              left: 0,
              width: 'max(100%, 280px)',
              border: '1px solid #d5dfda',
              borderRadius: '10px',
              boxShadow: 'var(--shadow-lg)',
            }),
        background: '#fff',
        overflow: 'hidden',
      }}
    >
      {searchable && (
        <div style={{ padding: '10px', borderBottom: '1px solid #edf1ef' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', pointerEvents: 'none', color: 'var(--kr-grey-700)' }} />
            <input
              ref={searchRef}
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${noun}...`}
              style={{
                width: '100%',
                height: '36px',
                boxSizing: 'border-box',
                padding: '0 10px 0 32px',
                borderRadius: '8px',
                border: '1px solid #d5dfda',
                fontSize: '13px',
                outline: 'none',
                color: 'var(--text-heading)',
              }}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '8px 12px', borderBottom: '1px solid #edf1ef', background: '#f7faf9' }}>
        <button
          type="button"
          onClick={toggleAllShown}
          disabled={shown.length === 0}
          style={{ all: 'unset', cursor: shown.length ? 'pointer' : 'not-allowed', opacity: shown.length ? 1 : 0.5, fontSize: '12.5px', fontWeight: 700, color: 'var(--kr-green-800)' }}
        >
          {allShownOn ? 'Clear these' : q ? `Select these ${shown.length}` : 'Select all'}
        </button>
        <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--kr-grey-700)' }}>
          {value.length} selected
        </span>
      </div>

      <div style={{ maxHeight: `${maxListHeight}px`, overflowY: 'auto', overscrollBehavior: 'contain' }}>
        {shown.length === 0 && (
          <div style={{ padding: '22px 14px', textAlign: 'center', fontSize: '13px', color: 'var(--kr-grey-700)' }}>
            No {noun} matches “{q}”.
          </div>
        )}
        {shown.map(o => {
          const on = value.includes(o.value);
          return (
            <label
              key={o.value}
              role="option"
              aria-selected={on}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f2f5f4' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f5faf7')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(o.value)}
                style={{ width: '16px', height: '16px', flex: 'none', accentColor: 'var(--kr-green-700)', cursor: 'pointer' }}
              />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: 'block', fontSize: '13.5px', fontWeight: on ? 700 : 600, color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {o.label}
                </span>
                {o.sub && (
                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--kr-grey-700)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {o.sub}
                  </span>
                )}
              </span>
              {o.count != null && (
                <span style={{ flex: 'none', fontSize: '12px', fontWeight: 700, color: 'var(--kr-grey-700)' }}>
                  {o.count}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <div ref={wrapRef} style={{ position: inline ? 'static' : 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && <Icon size={17} style={{ position: 'absolute', left: '12px', pointerEvents: 'none', color: 'var(--kr-grey-700)' }} />}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={labelledBy}
          style={{
            all: 'unset',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            height: `${triggerHeight}px`,
            padding: Icon ? '0 34px 0 38px' : '0 34px 0 12px',
            borderRadius: '10px',
            border: `1px solid ${borderColor}`,
            background: '#fff',
            fontSize: '14px',
            fontWeight: value.length ? 700 : 400,
            color: 'var(--text-heading)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {triggerText}
        </button>
        <ChevronDown
          size={17}
          style={{
            position: 'absolute',
            right: '12px',
            pointerEvents: 'none',
            color: 'var(--kr-grey-700)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform var(--dur-fast)',
          }}
        />
      </div>
      {open && panel}
    </div>
  );
};

export default MultiSelect;
