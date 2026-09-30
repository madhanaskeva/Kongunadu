import React, { useEffect } from 'react';
import { App, Modal, Typography } from 'antd';
import { useTMSAdmin } from '../../context/TMSAdminContext';

/* ─────────────────────────────────────────────────────────────────
   AdminConfirmDialog — antd Modal driven by the context's `confirm`
   state: { title, body, okLabel, danger, onOk }.
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
      closable={false}
      title={confirm?.title}
      okText={confirm?.okLabel || 'Confirm'}
      cancelText="Cancel"
      okButtonProps={{ danger: !!confirm?.danger }}
      cancelButtonProps={{ type: 'text' }}
      styles={{ mask: { backgroundColor: 'rgba(20,32,43,.5)' } }}
    >
      {confirm?.body && <Typography.Paragraph style={{ margin: 0 }}>{confirm.body}</Typography.Paragraph>}
    </Modal>
  );
};

/* ─────────────────────────────────────────────────────────────────
   AdminToast — shows the context's `toast` ({ tone, title, message })
   as an antd notification. showToast() in TMSAdminContext still owns
   the timing (clears after 3.5 s); this only renders it.
───────────────────────────────────────────────────────────────── */
const TONE_TYPE = { success: 'success', warning: 'warning', danger: 'error', info: 'info' };

export const AdminToast = () => {
  const { toast } = useTMSAdmin();
  const { notification } = App.useApp();

  useEffect(() => {
    if (!toast) {
      notification.destroy('tms-toast');
      return;
    }
    notification.open({
      key: 'tms-toast',
      type: TONE_TYPE[toast.tone] || 'info',
      title: toast.title,
      description: toast.message,
      placement: 'bottomRight',
      duration: false, // closed by the context timer above
    });
  }, [toast, notification]);

  return null;
};
