import React, { useState } from 'react';
import { Alert, Button, Form, Input, Modal, Select, Typography } from 'antd';
import { useTMSAdmin } from '../../context/TMSAdminContext';
import { useAuth } from '../../hooks/useAuth';
import { createNotification } from '../../utils/notificationUtils';
import { NOTICE_LIMIT } from '../../utils/notificationUtils';

/**
 * SendNoticeModal — antd Modal for sending notices to branch supervisors.
 *
 * Props:
 *   isOpen: boolean
 *   onClose: function
 */
export const SendNoticeModal = ({ isOpen, onClose }) => {
  const { T, showToast } = useTMSAdmin();
  const { user } = useAuth();
  const tms = T();

  const [sendTo, setSendTo] = useState('B01'); // Default: Chennai HO supervisors
  const [priority, setPriority] = useState('Normal'); // Default: Normal
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  // Build branch supervisor options matching TMS branches
  const branches = tms?.branches || [];
  const branchOptions = [
    { value: 'B01', label: 'Chennai HO supervisors' },
    { value: 'all', label: 'All supervisors' },
    ...branches
      .filter((b) => b.id !== 'B01')
      .map((b) => ({
        value: b.id,
        label: `${b.name} supervisors`,
      })),
  ];

  const priorityOptions = [
    { value: 'Normal', label: 'Normal' },
    { value: 'Important', label: 'Important' },
    { value: 'Urgent', label: 'Urgent' },
  ];

  const resetForm = () => {
    setSendTo('B01');
    setPriority('Normal');
    setSubject('');
    setMessage('');
    setErrors({});
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  // Active supervisors the chosen "Send to" option reaches.
  const recipientsFor = (target) => (tms?.supervisors || [])
    .filter((s) => s.status !== 'Suspended' && (target === 'all' || s.branch === target))
    .map((s) => ({ id: s.id, name: s.name }));

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const newErrors = {};
    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!message.trim()) {
      newErrors.message = 'Message is required';
    }
    const recipients = recipientsFor(sendTo);
    if (!recipients.length) {
      newErrors.sendTo = 'No active supervisor in this branch. Choose another branch.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const targetOpt = branchOptions.find((o) => o.value === sendTo) || { label: 'Chennai HO supervisors' };

    // Same path as Notifications › Manually Sent Alerts: the notice reaches each supervisor's
    // app and is kept in the sent history there, where it can be viewed and resent.
    createNotification({
      title: subject,
      message,
      priority: priority.toLowerCase(),
      recipients,
      createdBy: user?.name || 'Head Office Admin',
    });

    if (showToast) {
      showToast('success', 'Notice sent', `Sent to ${targetOpt.label} (${recipients.map((r) => r.name).join(', ')}).`);
    }

    resetForm();
    onClose();
  };

  return (
    <Modal
      open={!!isOpen}
      onCancel={handleCancel}
      width={560}
      centered
      destroyOnHidden
      title={
        <div>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}
          >
            NOTIFY SUPERVISORS
          </Typography.Text>
          <div>Send notice</div>
        </div>
      }
      footer={
        <>
          <Button type="text" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            Send notice
          </Button>
        </>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit()} requiredMark={false}>
        <Alert
          type="success"
          style={{ marginBottom: 16 }}
          title="Supervisors see this on the Notifications page of the mobile app with your name and the time sent. Urgent notices also pop up on screen. A copy is kept under Notifications › Manually Sent Alerts, where you can resend it."
        />

        {/* Send to dropdown */}
        <Form.Item label="Send to" validateStatus={errors.sendTo ? 'error' : undefined} help={errors.sendTo || undefined}>
          <Select
            aria-label="Send to"
            value={sendTo}
            onChange={(v) => { setSendTo(v); if (errors.sendTo) setErrors((prev) => ({ ...prev, sendTo: null })); }}
            options={branchOptions}
          />
        </Form.Item>

        {/* Priority dropdown */}
        <Form.Item label="Priority">
          <Select aria-label="Priority" value={priority} onChange={setPriority} options={priorityOptions} />
        </Form.Item>

        {/* Subject input */}
        <Form.Item
          label="Subject"
          validateStatus={errors.subject ? 'error' : undefined}
          help={errors.subject || undefined}
        >
          <Input
            name="subject"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (errors.subject) setErrors((prev) => ({ ...prev, subject: null }));
            }}
            placeholder="e.g. Photograph every diesel slip"
          />
        </Form.Item>

        {/* Message textarea */}
        <Form.Item
          label="Message"
          style={{ marginBottom: 0 }}
          validateStatus={errors.message ? 'error' : undefined}
          help={errors.message || undefined}
        >
          <Input.TextArea
            name="message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (errors.message) setErrors((prev) => ({ ...prev, message: null }));
            }}
            placeholder="What should supervisors know or do?"
            rows={4}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SendNoticeModal;
