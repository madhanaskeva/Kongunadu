import React from 'react';
import { Badge, Button, Typography } from 'antd';
import { Send } from 'lucide-react';

// Card title for a tickable list: "73 alerts · 5 unread", or "2 selected · Clear" while rows are ticked.
export const SelectionTitle = ({ count, noun, extra, selected, onClear }) => (
  <Typography.Text type="secondary" style={{ fontWeight: 400 }}>
    <Typography.Text strong>{count}</Typography.Text> {count === 1 ? noun : `${noun}s`}
    {extra ? ` · ${extra}` : ''}
    {selected > 0 && (
      <>
        {' · '}
        <Typography.Text strong style={{ color: 'var(--color-brand)' }}>{selected} selected</Typography.Text>
        <Button type="link" size="small" onClick={onClear} style={{ paddingInline: 6 }}>Clear</Button>
      </>
    )}
  </Typography.Text>
);

// The one Share button for a list: disabled until something is ticked.
export const ShareButton = ({ count, onClick, label = 'Share' }) => (
  <Button
    type="primary"
    icon={<Send size={16} />}
    disabled={!count}
    onClick={onClick}
    title={count ? undefined : 'Tick one or more rows to share them'}
  >
    {label}
    {count > 0 && <Badge count={count} size="small" color="#ffffff" style={{ color: 'var(--color-brand)', boxShadow: 'none', marginInlineStart: 6 }} />}
  </Button>
);
