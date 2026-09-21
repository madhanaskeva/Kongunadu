import React, { useEffect, useRef, useState } from 'react';
import { Ellipsis, Eye, Pencil, Trash2 } from 'lucide-react';
import { Tooltip } from 'antd';

/**
 * RowActions — Reusable action button component for table rows and list items.
 *
 * Displays a three-dot button that, when clicked, opens a compact popover
 * showing action icons (View, Edit, Delete, or custom actions).
 * Hovering over any icon displays an informative tooltip.
 *
 * Props:
 * - actions: Array of action objects:
 *     [{ key, icon: IconComponent, label: string, onClick: (e) => void, danger?: boolean, color?: string, bgHover?: string, disabled?: boolean }]
 * - onView: Shorthand function for view action (renders Eye icon)
 * - onEdit: Shorthand function for edit action (renders Pencil icon)
 * - onDelete: Shorthand function for delete action (renders Trash2 icon with danger styling)
 * - viewLabel: Custom tooltip text for view action (default: 'View details')
 * - editLabel: Custom tooltip text for edit action (default: 'Edit')
 * - deleteLabel: Custom tooltip text for delete action (default: 'Delete')
 * - isOpen: Optional controlled open state
 * - onToggle: Optional callback when open state changes (isOpen: boolean) => void
 * - placement: Popover position relative to button ('left' | 'right' | 'bottom' | 'top', default: 'left')
 * - buttonAriaLabel: Aria label for the three-dot button (default: 'Actions')
 * - disabled: Disable the actions button
 * - style: Additional style for the wrapper
 */
export const RowActions = ({
  actions,
  onView,
  onEdit,
  onDelete,
  viewLabel = 'View details',
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  isOpen: controlledOpen,
  onToggle,
  placement = 'left',
  buttonAriaLabel = 'Actions',
  disabled = false,
  style = {},
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const menuRef = useRef(null);

  const setOpen = (val) => {
    if (!isControlled) {
      setUncontrolledOpen(val);
    }
    if (onToggle) {
      onToggle(val);
    }
  };

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, isControlled]);

  // Build list of actions from shorthand props + actions array
  const actionList = [];

  if (onView) {
    actionList.push({
      key: 'view',
      icon: Eye,
      label: viewLabel,
      onClick: onView,
      type: 'view',
      colorHover: 'var(--kr-green-800, #004a31)',
      bgHover: 'var(--kr-green-100, #daf1e7)',
    });
  }

  if (onEdit) {
    actionList.push({
      key: 'edit',
      icon: Pencil,
      label: editLabel,
      onClick: onEdit,
      type: 'edit',
      colorHover: '#1677ff',
      bgHover: '#e6f4ff',
    });
  }

  if (onDelete) {
    actionList.push({
      key: 'delete',
      icon: Trash2,
      label: deleteLabel,
      onClick: onDelete,
      type: 'delete',
      danger: true,
      colorHover: 'var(--kr-red-600, #d91619)',
      bgHover: 'var(--kr-red-100, #fbe0e0)',
    });
  }

  if (Array.isArray(actions)) {
    actions.forEach((act, idx) => {
      actionList.push({
        key: act.key || `custom-act-${idx}`,
        ...act,
      });
    });
  }

  if (actionList.length === 0) return null;

  // Placement styles for the floating popover
  const popoverPlacementStyle = (() => {
    switch (placement) {
      case 'right':
        return {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '6px',
        };
      case 'bottom':
        return {
          top: '100%',
          right: 0,
          marginTop: '6px',
        };
      case 'top':
        return {
          bottom: '100%',
          right: 0,
          marginBottom: '6px',
        };
      case 'left':
      default:
        return {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: '6px',
        };
    }
  })();

  return (
    <div
      ref={menuRef}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Floating Action Icons Popover */}
      {open && (
        <div
          role="menu"
          aria-orientation="horizontal"
          style={{
            position: 'absolute',
            zIndex: 50,
            background: '#ffffff',
            border: '1px solid #d5dfda',
            borderRadius: '8px',
            boxShadow: '0 4px 14px rgba(20, 32, 43, 0.12)',
            padding: '3px 4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
            ...popoverPlacementStyle,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {actionList.map((act) => {
            const Icon = act.icon;
            const isDanger = act.danger;
            const defaultColor = isDanger
              ? 'var(--kr-red-600, #d91619)'
              : 'var(--kr-grey-700, #4a4a46)';
            const hoverColor = act.colorHover || (isDanger ? '#b31114' : 'var(--kr-green-800, #004a31)');
            const hoverBg = act.bgHover || (isDanger ? 'var(--kr-red-100, #fbe0e0)' : 'var(--kr-green-100, #daf1e7)');

            return (
              <Tooltip
                key={act.key}
                title={act.label}
                placement="top"
                arrow={{ pointAtCenter: true }}
              >
                <button
                  type="button"
                  disabled={act.disabled}
                  aria-label={act.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    if (act.onClick) act.onClick(e);
                  }}
                  style={{
                    all: 'unset',
                    cursor: act.disabled ? 'not-allowed' : 'pointer',
                    opacity: act.disabled ? 0.4 : 1,
                    width: '28px',
                    height: '28px',
                    display: 'inline-grid',
                    placeItems: 'center',
                    borderRadius: '6px',
                    color: defaultColor,
                    background: 'transparent',
                    transition: 'background var(--dur-fast, 0.15s), color var(--dur-fast, 0.15s)',
                  }}
                  onMouseEnter={(e) => {
                    if (!act.disabled) {
                      e.currentTarget.style.background = hoverBg;
                      e.currentTarget.style.color = hoverColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!act.disabled) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = defaultColor;
                    }
                  }}
                >
                  <Icon size={15} strokeWidth={2.2} />
                </button>
              </Tooltip>
            );
          })}
        </div>
      )}

      {/* Trigger: Three-dot Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        aria-label={buttonAriaLabel}
        aria-haspopup="true"
        aria-expanded={open}
        title={buttonAriaLabel}
        style={{
          all: 'unset',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          width: '32px',
          height: '32px',
          display: 'inline-grid',
          placeItems: 'center',
          borderRadius: '8px',
          color: open ? 'var(--kr-green-700, #00623f)' : 'var(--kr-grey-700, #4a4a46)',
          background: open ? 'var(--kr-green-100, #daf1e7)' : 'transparent',
          transition: 'background var(--dur-fast, 0.15s), color var(--dur-fast, 0.15s)',
        }}
        onMouseEnter={(e) => {
          if (!disabled && !open) {
            e.currentTarget.style.background = 'var(--kr-green-100, #daf1e7)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !open) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        <Ellipsis size={20} />
      </button>
    </div>
  );
};

export const ActionMenu = RowActions;
export default RowActions;

