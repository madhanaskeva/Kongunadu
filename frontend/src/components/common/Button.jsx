import React from 'react';
import { Button as AntButton } from 'antd';

/**
 * Button — antd-backed, drop-in replacement for the custom Button.
 *
 * Props interface is identical to the original:
 *   variant: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
 *   size:    'sm' | 'md' | 'lg'
 *   fullWidth, disabled, loading, onClick, type, icon (lucide component), className, style
 *
 * Visual output exactly matches the original — sizes, colours, fonts, radii.
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  icon: Icon,
  className = '',
  style = {},
}) => {
  /* ── antd type / danger mapping ── */
  const antType = variant === 'primary' || variant === 'danger'
    ? 'primary'
    : variant === 'ghost'
    ? 'text'
    : 'default';

  const isDanger = variant === 'danger';

  /* ── antd size mapping ── */
  const antSize = size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'middle';

  /* ── Per-variant overrides that antd theme tokens don't fully cover ── */
  const variantStyle = (() => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: 'var(--color-brand-tint)',
          color: 'var(--kr-green-900)',
          borderColor: 'var(--kr-green-100)',
        };
      case 'outline':
        return {
          backgroundColor: '#ffffff',
          color: 'var(--text-heading)',
          borderColor: 'var(--border-strong)',
        };
      default:
        return {};
    }
  })();

  /* ── Exact size heights to match original (32 / 40 / 48 px) ── */
  const sizeStyle = (() => {
    switch (size) {
      case 'sm': return { height: '32px', padding: '0 10px', fontSize: '13px' };
      case 'lg': return { height: '48px', padding: '0 24px', fontSize: '16px' };
      default:   return { height: '40px', padding: '0 16px', fontSize: '14px' };
    }
  })();

  return (
    <AntButton
      type={antType}
      danger={isDanger}
      size={antSize}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      htmlType={type}
      className={className}
      icon={!loading && Icon ? <Icon size={size === 'sm' ? 14 : 18} /> : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 700,
        fontFamily: 'var(--font-display)',
        borderRadius: 'var(--radius-md)',
        width: fullWidth ? '100%' : 'auto',
        transition: 'all var(--dur-fast)',
        ...sizeStyle,
        ...variantStyle,
        ...style,
      }}
    >
      {children}
    </AntButton>
  );
};

export default Button;
