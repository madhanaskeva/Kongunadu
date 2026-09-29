import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { FormInput, FormSelect, FormTextarea } from '../forms';
import { useTMSAdmin } from '../../context/TMSAdminContext';
import { useAuth } from '../../hooks/useAuth';

/**
 * SendNoticeModal — Exact popup modal from Image 2 for sending notices to branch supervisors.
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
        const updated = [{ id: 'HN' + Date.now(), sort, ...noticeData }, ...list].slice(0, 50);
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
      isOpen={isOpen}
      onClose={handleCancel}
      subtitle="NOTIFY SUPERVISORS"
      title="Send notice"
      maxWidth="560px"
      footerStyle={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        padding: '16px 24px',
      }}
      footer={
        <>
          <Button
            variant="outline"
            onClick={handleCancel}
            style={{
              borderColor: 'transparent',
              color: '#111827',
              fontWeight: 600,
              padding: '0 18px',
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            style={{
              backgroundColor: 'var(--kr-green-800, #00462a)',
              borderColor: 'var(--kr-green-800, #00462a)',
              color: '#ffffff',
              fontWeight: 700,
              padding: '0 22px',
              borderRadius: '8px',
            }}
          >
            Send notice
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Info Banner matching Image 2 */}
        <div
          style={{
            backgroundColor: '#ebf7f2',
            border: '1px solid #c6ebd6',
            borderRadius: '10px',
            padding: '14px 16px',
            fontSize: '13.5px',
            color: '#164e3d',
            lineHeight: '1.45',
            fontFamily: 'var(--font-body)',
          }}
        >
          Supervisors see this on the Notifications page of the mobile app with your name and the time sent. Urgent
          notices also pop up on screen.
        </div>

        {/* Send to dropdown */}
        <FormSelect
          label="Send to"
          name="sendTo"
          value={sendTo}
          onChange={(e) => setSendTo(e.target.value)}
          options={branchOptions}
        />

        {/* Priority dropdown */}
        <FormSelect
          label="Priority"
          name="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          options={priorityOptions}
        />

        {/* Subject input */}
        <FormInput
          label="Subject"
          name="subject"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            if (errors.subject) setErrors((prev) => ({ ...prev, subject: null }));
          }}
          placeholder="e.g. Photograph every diesel slip"
          error={errors.subject}
        />

        {/* Message textarea */}
        <FormTextarea
          label="Message"
          name="message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (errors.message) setErrors((prev) => ({ ...prev, message: null }));
          }}
          placeholder="What should supervisors know or do?"
          rows={4}
          error={errors.message}
        />
      </form>
    </Modal>
  );
};

export default SendNoticeModal;

