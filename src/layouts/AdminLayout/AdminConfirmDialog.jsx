import React from 'react';
import { Modal, notification } from 'antd';
import { useTMSAdmin } from '../../context/TMSAdminContext';

/* ─────────────────────────────────────────────────────────────────
   AdminConfirmDialog — antd Modal-backed drop-in replacement.

   Visual output exactly matches original:
     - Dark overlay (rgba(20,32,43,.5))
     - White 440px card, radius-lg, shadow-xl
     - h3 title, p body, Cancel + Confirm buttons
     - Confirm button: brand-green (default) or red (danger:true)
───────────────────────────────────────────────────────────────── */
export const AdminConfirmDialog = () => {
  const { confirm, setConfirm } = useTMSAdmin();

  const handleCancel = () => setConfirm(null);
  const handleOk = () => {
    if (confirm?.onOk) confirm.onOk();
    setConfirm(null);
  };

  return (
    <Modal
      open={!!confirm}
      onCancel={handleCancel}
      onOk={handleOk}
      width={440}
      centered
      mask={{ closable: true }}
      title={null}
      closable={false}
      okText={confirm?.okLabel || 'Confirm'}
      cancelText="Cancel"
      okButtonProps={{
        danger: !!confirm?.danger,
        style: {
          height: '36px',
          padding: '0 16px',
          borderRadius: 'var(--radius-md)',
          fontSize: '14px',
          fontWeight: 700,
          backgroundColor: confirm?.danger ? 'var(--kr-red-600)' : 'var(--color-brand)',
          borderColor: confirm?.danger ? 'var(--kr-red-600)' : 'var(--color-brand)',
          color: '#fff',
        },
      }}
      cancelButtonProps={{
        type: 'text',
        style: {
          height: '36px',
          padding: '0 14px',
          borderRadius: 'var(--radius-md)',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-heading)',
        },
      }}
      styles={{
        mask: { backgroundColor: 'rgba(20,32,43,.5)' },
        content: {
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          padding: '24px',
        },
        footer: {
          marginTop: '8px',
          borderTop: 'none',
          padding: 0,
        },
        body: { padding: 0 },
      }}
    >
      {confirm && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)' }}>
            {confirm.title}
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.5 }}>
            {confirm.body}
          </p>
        </div>
      )}
    </Modal>
  );
};

/* ─────────────────────────────────────────────────────────────────
   AdminToast — antd notification-backed drop-in replacement.

   Visual output exactly matches original:
     - Fixed bottom-right position
     - Bg: brand-green (success) | steel-900 (info) | saffron (warning) | red (danger)
     - Title (800, 14px) + optional message (13px, opacity 0.9)
     - Slide-in animation (handled by antd notification)
───────────────────────────────────────────────────────────────── */
export const AdminToast = () => {
  const { toast } = useTMSAdmin();
  if (!toast) return null;

  const bg =
    toast.tone === 'success'
      ? 'var(--color-brand)'
      : toast.tone === 'warning'
      ? '#7A4300'
      : toast.tone === 'danger'
      ? 'var(--kr-red-600)'
      : 'var(--kr-steel-900)';

  /* Rendered as a fixed-position div — identical to original */
  return (
    <div
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        zIndex: 100,
        backgroundColor: bg,
        color: '#ffffff',
        padding: '14px 20px',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        maxWidth: '380px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        animation: 'tmsSlideIn 0.25s ease-out',
      }}
    >
      <div style={{ fontWeight: 800, fontSize: '14px' }}>{toast.title}</div>
      {toast.message && (
        <div style={{ fontSize: '13px', opacity: 0.9 }}>{toast.message}</div>
      )}
    </div>
  );
};
