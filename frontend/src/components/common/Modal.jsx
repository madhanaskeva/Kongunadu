import React from 'react';
import { Modal as AntModal, Typography } from 'antd';

/**
 * Modal — antd Modal with the portal's header style.
 *
 * Props (unchanged, so every caller keeps working):
 *   isOpen, onClose, title, subtitle, children, maxWidth, footer, footerStyle, bodyStyle
 *
 * antd draws the title, close button and footer; the only custom piece is
 * the small uppercase `subtitle` kicker above the title.
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '540px',
  footer,
  footerStyle = {},
  bodyStyle = {},
}) => (
  <AntModal
    open={isOpen}
    onCancel={onClose}
    width={maxWidth}
    footer={footer || null}
    destroyOnHidden
    centered
    mask={{ closable: true }}
    className="tms-modal"
    title={
      <div>
        {subtitle && <div className="tms-kicker">{subtitle}</div>}
        <Typography.Title level={4} style={{ margin: 0 }}>{title}</Typography.Title>
      </div>
    }
    styles={{
      mask: { backdropFilter: 'blur(3px)', backgroundColor: 'rgba(20, 32, 43, 0.55)' },
      // Padding lives on header/body/footer (not the container) so callers can
      // run content edge to edge with bodyStyle={{ padding: 0 }} (fleet map).
      container: { padding: 0, overflow: 'hidden' },
      header: { padding: '20px 56px 16px 24px', margin: 0, borderBottom: '1px solid var(--border-default)' },
      body: { padding: 24, maxHeight: '75vh', overflowY: 'auto', ...bodyStyle },
      footer: {
        margin: 0,
        padding: '16px 24px',
        background: 'var(--surface-muted)',
        borderTop: '1px solid var(--border-default)',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 12,
        ...footerStyle,
      },
    }}
  >
    {children}
  </AntModal>
);

export default Modal;
