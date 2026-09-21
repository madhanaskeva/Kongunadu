import React from 'react';
import { Spin } from 'antd';

/**
 * Loader — antd Spin-backed drop-in replacement.
 *
 * Props interface identical to original:
 *   message (string), size ('sm' | 'md' | 'lg')
 *
 * Visual output exactly matches original:
 *   - Centered layout with 48px top/bottom padding
 *   - Brand-green spinner (controlled by ConfigProvider colorPrimary)
 *   - Message text in font-display, 14px, 600 weight, text-muted
 */
export const Loader = ({ message = 'Loading records…', size = 'md' }) => {
  const antSize = size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'default';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: '16px',
        color: 'var(--text-muted)',
      }}
    >
      <Spin size={antSize} />
      {message && (
        <span
          style={{
            fontSize: '14px',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            letterSpacing: '0.02em',
            color: 'var(--text-muted)',
          }}
        >
          {message}
        </span>
      )}
    </div>
  );
};

export default Loader;
