import React, { useState } from 'react';
import { Button, Form, Input, Modal, Segmented, Typography } from 'antd';
import { PRIORITIES } from '../../../utils/notificationUtils';
import { SupervisorSelector } from './SupervisorSelector';

export const ModalTitle = ({ kicker, title }) => (
  <div>
    <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
      {kicker}
    </Typography.Text>
    <div>{title}</div>
  </div>
);

const EMPTY = { title: '', message: '', priority: 'normal', ids: [] };

// Compose a new notification and send it to one, several or all supervisors.
export const SendNotificationModal = ({ open, onClose, onSend, supervisors }) => {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const set = (key, v) => {
    setForm(f => ({ ...f, [key]: v }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
  };

  const close = () => { setForm(EMPTY); setErrors({}); setSending(false); onClose(); };

  const submit = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Notification title is required';
    if (!form.message.trim()) next.message = 'Message is required';
    if (!form.ids.length) next.ids = 'Select at least one supervisor';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSending(true);
    const recipients = supervisors.filter(s => form.ids.includes(s.id)).map(s => ({ id: s.id, name: s.name }));
    const ok = onSend({ title: form.title, message: form.message, priority: form.priority, recipients });
    if (ok === false) { setSending(false); return; }
    close();
  };

  return (
    <Modal
      open={open}
      onCancel={close}
      width={600}
      centered
      destroyOnHidden
      title={<ModalTitle kicker="Notify supervisors" title="Send notification" />}
      footer={
        <>
          <Button type="text" onClick={close}>Cancel</Button>
          <Button type="primary" onClick={submit} loading={sending}>Send Notification</Button>
        </>
      }
    >
      <Form layout="vertical" requiredMark onFinish={submit}>
        <Form.Item label="Notification title" required validateStatus={errors.title ? 'error' : undefined} help={errors.title}>
          <Input value={form.title} maxLength={120} onChange={e => set('title', e.target.value)} placeholder="e.g. GPS Issue Reminder" />
        </Form.Item>
        <Form.Item label="Message" required validateStatus={errors.message ? 'error' : undefined} help={errors.message}>
          <Input.TextArea value={form.message} rows={4} maxLength={1000} showCount onChange={e => set('message', e.target.value)} placeholder="What should supervisors know or do?" />
        </Form.Item>
        <Form.Item label="Priority">
          <Segmented value={form.priority} options={PRIORITIES} onChange={v => set('priority', v)} />
        </Form.Item>
        <Form.Item label="Select supervisors" required style={{ marginBottom: 0 }}>
          <SupervisorSelector supervisors={supervisors} value={form.ids} onChange={v => set('ids', v)} error={errors.ids} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SendNotificationModal;
