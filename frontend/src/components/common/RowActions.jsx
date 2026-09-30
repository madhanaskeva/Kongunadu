import React from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button, Space, Tooltip } from 'antd';

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
 *
 * Built on antd Button (type="text") + Tooltip; delete actions use antd's danger state.
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
    });
  }

  if (onEdit) {
    actionList.push({
      key: 'edit',
      icon: Pencil,
      label: editLabel,
      onClick: onEdit,
      type: 'edit',
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
    <Space size={8} role="group" style={{ whiteSpace: 'nowrap', ...style }} onClick={(e) => e.stopPropagation()}>
      {actionList.map((act) => {
        const Icon = act.icon;
        return (
          <Tooltip key={act.key} title={act.label} placement="top" arrow={{ pointAtCenter: true }}>
            <Button
              type="text"
              size="small"
              danger={!!act.danger}
              disabled={disabled || act.disabled}
              aria-label={act.label}
              className={`tms-row-action${act.type === 'view' ? ' tms-row-action--view' : ''}`}
              icon={<Icon size={16} strokeWidth={2.2} />}
              onClick={(e) => {
                e.stopPropagation();
                if (act.onClick) act.onClick(e);
              }}
            />
          </Tooltip>
        );
      })}
    </Space>
  );
};

export const ActionMenu = RowActions;
export default RowActions;
