import React from 'react';
import { Empty } from 'antd';
import { Inbox } from 'lucide-react';
import Button from './Button';

/**
 * EmptyState — antd Empty-backed drop-in replacement.
 *
 * Props interface identical to original:
 *   icon (lucide component), title, message, actionLabel, onAction
 *
 * Visual output exactly matches original:
 *   - Icon in a 56px circle (surface-muted bg)
 *   - h4 title (17px, 800 weight, text-heading)
 *   - p message (14px, text-muted, max-width 380px)
 *   - Optional action Button
 *   - White card with border-default, radius-lg, 48px padding
 */
export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No items found',
  message = 'There is no data to show for this section yet.',
  actionLabel,
  onAction,
}) => {
  return (
    <Empty
      image={
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--surface-muted)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--text-muted)',
            margin: '0 auto',
          }}
        >
          <Icon size={28} />
        </div>
      }
      imageStyle={{ height: 'auto', marginBottom: 0 }}
      description={
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <h4
            style={{
              margin: '12px 0 0',
              fontSize: '17px',
              fontWeight: 800,
              color: 'var(--text-heading)',
            }}
          >
            {title}
          </h4>
          <p
            style={{
              margin: '0 0 4px',
              fontSize: '14px',
              color: 'var(--text-muted)',
              maxWidth: '380px',
              textAlign: 'center',
            }}
          >
            {message}
          </p>
        </div>
      }
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
      }}
    >
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Empty>
  );
};

export default EmptyState;
