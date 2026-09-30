import React from 'react';
import { Badge, Tag } from 'antd';
import { priorityLabel } from '../../../utils/notificationUtils';

const SEVERITY = { high: ['red', 'High'], medium: ['orange', 'Medium'], low: ['default', 'Low'] };
const PRIORITY = { urgent: 'red', important: 'orange', normal: 'default' };

export const SeverityTag = ({ value }) => {
  const [color, label] = SEVERITY[value] || SEVERITY.low;
  return <Tag color={color} variant="filled" style={{ fontWeight: 600 }}>{label}</Tag>;
};

export const PriorityTag = ({ value }) => (
  <Tag color={PRIORITY[value] || 'default'} variant="filled" style={{ fontWeight: 600 }}>{priorityLabel(value)}</Tag>
);

export const StatusBadge = ({ value }) => (
  value === 'read'
    ? <Badge status="default" text="Read" />
    : <Badge status="processing" text={<strong>Unread</strong>} />
);
