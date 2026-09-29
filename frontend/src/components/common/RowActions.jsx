import React from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Tooltip } from 'antd';

/**
 * RowActions — Reusable action button component for table rows and list items.
 *
 * Renders the action icons (View, Edit, Delete, or custom actions) directly
 * inline — no three-dot menu. Hovering over any icon displays an informative
 * tooltip.
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
 * - disabled: Disable all action buttons
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
  disabled = false,
  style = {},
}) => {
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

  return (
    <div
      role="group"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        whiteSpace: 'nowrap',
        ...style,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {actionList.map((act) => {
        const Icon = act.icon;
        const isDanger = act.danger;
        const isDisabled = disabled || act.disabled;
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
              disabled={isDisabled}
              aria-label={act.label}
              onClick={(e) => {
                e.stopPropagation();
                if (act.onClick) act.onClick(e);
              }}
              style={{
                all: 'unset',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.4 : 1,
                width: '30px',
                height: '30px',
                display: 'inline-grid',
                placeItems: 'center',
                borderRadius: '6px',
                color: defaultColor,
                background: 'transparent',
                transition: 'background var(--dur-fast, 0.15s), color var(--dur-fast, 0.15s)',
              }}
              onMouseEnter={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.background = hoverBg;
                  e.currentTarget.style.color = hoverColor;
                }
              }}
              onMouseLeave={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = defaultColor;
                }
              }}
            >
              <Icon size={16} strokeWidth={2.2} />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
};

export const ActionMenu = RowActions;
export default RowActions;
