import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';

/**
 * useListbox — the one designed option list shared by the hand-built dropdowns
 * (Supervisor app `Select`, Reports `ReportCustomSelect`).
 *
 * A native <select> hands its open list to the OS (plain list, blue highlight),
 * so this draws the list itself. The panel is portalled to <body> with fixed
 * positioning, so an `overflow: auto` drawer, modal or phone frame can never
 * clip it, and its z-index sits above drawers and modals.
 *
 * Visuals live in global.css (`.kr-listbox*`), so every list looks the same:
 * white card, border + soft shadow, 40px rows (44px with `touch`), brand-tint
 * hover, selected row in brand tint with a check mark.
 *
 * Keyboard (focus stays on the trigger, a combobox):
 *   ArrowDown / ArrowUp / Enter / Space open; arrows, Home, End, PageUp,
 *   PageDown move; Enter / Space pick; Escape / Tab close; typing a letter
 *   jumps to the next option starting with it.
 *
 * Returns { open, setOpen, triggerProps, popover, selected }: spread
 * `triggerProps` on a <button>, render `popover` anywhere.
 */
export function useListbox({
  options = [],
  value,
  onSelect,
  disabled = false,
  touch = false,
  maxHeight = 288,
  minWidth = 0,
  labelledBy,
  emptyText = 'Nothing to choose',
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const listId = useId();

  const same = (a, b) => a === b || (a != null && b != null && b !== '' && String(a) === String(b));
  const selectedIndex = options.findIndex(o => same(o.value, value));
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const gap = 6;
    const below = vh - r.bottom - gap - 8;
    const above = r.top - gap - 8;
    const up = below < Math.min(maxHeight, 220) && above > below;
    const room = Math.max(120, Math.min(maxHeight, up ? above : below));
    const width = Math.min(Math.max(r.width, minWidth), vw - 16);
    const left = Math.min(Math.max(8, r.left), vw - width - 8);
    setPos(up
      ? { left, width, maxHeight: room, bottom: vh - r.top + gap }
      : { left, width, maxHeight: room, top: r.bottom + gap });
  }, [maxHeight, minWidth]);

  const firstEnabled = (from, step) => {
    const n = options.length;
    for (let k = 0, i = from; k < n; k += 1, i += step) {
      if (i < 0 || i >= n) return -1;
      if (!options[i].disabled) return i;
    }
    return -1;
  };

  const openList = () => {
    if (disabled) return;
    setActive(selectedIndex >= 0 ? selectedIndex : firstEnabled(0, 1));
    setOpen(true);
  };

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const pick = (i) => {
    const o = options[i];
    if (!o || o.disabled) return;
    close();
    if (onSelect) onSelect(o, i);
  };

  useLayoutEffect(() => {
    if (open) place();
    else setPos(null);
  }, [open, place]);

  // Outside tap closes; scrolling or resizing the page re-anchors the panel.
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (triggerRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onScroll = (e) => {
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      place();
    };
    document.addEventListener('pointerdown', onPointer, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  // Keep the highlighted row in view while moving through a long list.
  useEffect(() => {
    if (!open || active < 0 || !panelRef.current) return;
    const row = panelRef.current.querySelector(`[data-index="${active}"]`);
    if (row) row.scrollIntoView({ block: 'nearest' });
  }, [open, active, pos]);

  // Closing the list if the control becomes disabled underneath it.
  useEffect(() => { if (disabled && open) setOpen(false); }, [disabled, open]);

  const onKeyDown = (e) => {
    if (disabled) return;
    const k = e.key;
    if (!open) {
      if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') {
        e.preventDefault();
        openList();
      }
      return;
    }
    const last = options.length - 1;
    if (k === 'ArrowDown') { e.preventDefault(); const n = firstEnabled(active + 1, 1); if (n >= 0) setActive(n); }
    else if (k === 'ArrowUp') { e.preventDefault(); const n = firstEnabled(active - 1, -1); if (n >= 0) setActive(n); }
    else if (k === 'Home') { e.preventDefault(); setActive(firstEnabled(0, 1)); }
    else if (k === 'End') { e.preventDefault(); setActive(firstEnabled(last, -1)); }
    else if (k === 'PageDown') { e.preventDefault(); const n = firstEnabled(Math.min(last, active + 6), 1); setActive(n >= 0 ? n : firstEnabled(last, -1)); }
    else if (k === 'PageUp') { e.preventDefault(); const n = firstEnabled(Math.max(0, active - 6), -1); setActive(n >= 0 ? n : firstEnabled(0, 1)); }
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); if (active >= 0) pick(active); }
    else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (k === 'Tab') { setOpen(false); }
    else if (k.length === 1 && /\S/.test(k)) {
      const ch = k.toLowerCase();
      const n = options.length;
      for (let s = 1; s <= n; s += 1) {
        const i = (Math.max(active, 0) + s) % n;
        if (!options[i].disabled && String(options[i].label ?? '').trim().toLowerCase().startsWith(ch)) { setActive(i); break; }
      }
    }
  };

  const triggerProps = {
    ref: triggerRef,
    type: 'button',
    role: 'combobox',
    disabled,
    'aria-haspopup': 'listbox',
    'aria-expanded': open,
    'aria-controls': open ? listId : undefined,
    'aria-activedescendant': open && active >= 0 ? `${listId}-o${active}` : undefined,
    'aria-labelledby': labelledBy,
    onClick: () => (open ? close(false) : openList()),
    onKeyDown,
  };

  const popover = open && pos && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={panelRef}
          id={listId}
          role="listbox"
          aria-labelledby={labelledBy}
          className={`kr-listbox${touch ? ' kr-listbox--touch' : ''}`}
          style={{ position: 'fixed', zIndex: 10050, ...pos }}
        >
          {options.length === 0 && <div className="kr-listbox-empty">{emptyText}</div>}
          {options.map((o, i) => {
            const isSel = i === selectedIndex;
            return (
              <div
                key={`${o.value}-${i}`}
                id={`${listId}-o${i}`}
                data-index={i}
                role="option"
                aria-selected={isSel}
                aria-disabled={o.disabled || undefined}
                className={`kr-listbox-option${isSel ? ' is-selected' : ''}${i === active ? ' is-active' : ''}${o.disabled ? ' is-disabled' : ''}`}
                onMouseDown={e => e.preventDefault()}
                onMouseMove={() => { if (active !== i && !o.disabled) setActive(i); }}
                onClick={() => pick(i)}
              >
                <span className="kr-listbox-label">{o.label}</span>
                {isSel && <Check size={16} strokeWidth={2.5} className="kr-listbox-check" aria-hidden="true" />}
              </div>
            );
          })}
        </div>,
        document.body,
      )
    : null;

  return { open, setOpen, triggerProps, popover, selected };
}

export default useListbox;
