import React, { useState } from 'react';
import { Alert, Button, Form, Input, Modal, Select, Typography } from 'antd';
import { useTMSAdmin } from '../../context/TMSAdminContext';
import { useAuth } from '../../hooks/useAuth';
import { NOTICE_LIMIT } from '../../utils/notificationUtils';

/**
 * SendNoticeModal — antd Modal for sending notices to branch supervisors.
 *
 * Props:
 *   isOpen: boolean
 *   onClose: function
 */
export const SendNoticeModal = ({ isOpen, onClose }) => {
  const { T, pushNotice, showToast } = useTMSAdmin();
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

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const newErrors = {};
    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!message.trim()) {
      newErrors.message = 'Message is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const targetOpt = branchOptions.find((o) => o.value === sendTo) || { label: 'Chennai HO supervisors' };
    const branchName = sendTo === 'all' ? 'All branches' : targetOpt.label.replace(/ supervisors$/i, '');

    const noticeData = {
      kind: 'message',
      branch: sendTo,
      priority,
      title: subject.trim(),
      body: message.trim(),
      from: user?.name || 'Head Office Admin',
      rows: [
        ['Applies to', branchName],
        ['Priority', priority],
        ['Sent to', targetOpt.label],
      ],
    };

    if (pushNotice) {
      pushNotice(noticeData);
    } else {
      // Direct fallback to localStorage
      try {
        const key = 'kr-tms-supervisor-notices';
        const list = JSON.parse(localStorage.getItem(key) || '[]') || [];
        const d = new Date(), p = (x) => String(x).padStart(2, '0');
        const sort = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
        const updated = [{ id: 'HN' + Date.now(), sort, ...noticeData }, ...list].slice(0, NOTICE_LIMIT);
        localStorage.setItem(key, JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      } catch (err) {}
    }

    // Notify listeners in same window
    try {
      window.dispatchEvent(new Event('kr-tms-supervisor-notices-changed'));
    } catch (err) {}

    if (showToast) {
      showToast('success', 'Notice sent', `Sent to ${targetOpt.label}.`);
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
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}
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
          title="Supervisors see this on the Notifications page of the mobile app with your name and the time sent. Urgent notices also pop up on screen."
        />

        {/* Send to dropdown */}
        <Form.Item label="Send to">
          <Select aria-label="Send to" value={sendTo} onChange={setSendTo} options={branchOptions} />
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
