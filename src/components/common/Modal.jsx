import React from 'react';
import { Modal as AntModal } from 'antd';

/**
 * Modal — antd-backed drop-in replacement.
 *
 * Props interface identical to original:
 *   isOpen, onClose, title, subtitle, children, maxWidth, footer
 *
 * Visual output exactly matches original:
 *   - Centered overlay with blur backdrop
 *   - borderRadius: 12px (radius-lg)
 *   - shadow-xl
 *   - Header: subtitle label + h3 title + X close button
 *   - Content: 24px padding, scrollable
 *   - Footer: surface-muted bg, border-top, flex end
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '540px',
  footer,
}) => {
  return (
    <AntModal
      open={isOpen}
      onCancel={onClose}
      width={maxWidth}
      footer={null}
      destroyOnClose
      centered
      maskClosable
      styles={{
        mask: {
          backdropFilter: 'blur(3px)',
          backgroundColor: 'rgba(20, 32, 43, 0.55)',
        },
        content: {
          borderRadius: '12px',
          boxShadow: 'var(--shadow-xl)',
          padding: 0,
          overflow: 'hidden',
        },
        header: {
          display: 'none',   // we render our own header inside body
        },
        body: {
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        },
      }}
      closeIcon={null}  // we render our own close button
    >
      {/* Custom header — matches original exactly */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          {subtitle && (
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-brand)',
                marginBottom: '2px',
              }}
            >
              {subtitle}
            </div>
          )}
          <h3
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 800,
              color: 'var(--text-heading)',
            }}
          >
            {title}
          </h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            transition: 'background var(--dur-fast), color var(--dur-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--surface-muted)';
            e.currentTarget.style.color = 'var(--text-heading)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          {/* X icon — inline SVG so no extra import needed */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: 'var(--surface-muted)',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          {footer}
        </div>
      )}
    </AntModal>
  );
};

export default Modal;
