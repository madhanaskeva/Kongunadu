import React, { useState } from 'react';
import { Button, Descriptions, Flex, Modal, Popconfirm, Typography } from 'antd';
import { formatDateTime, recipientNames } from '../../../utils/notificationUtils';
import { SupervisorSelector } from './SupervisorSelector';
import { ModalTitle } from './SendNotificationModal';
import { PriorityTag } from './NotificationTags';

// Share / resend a notification (or an automatic alert) to a new set of supervisors.
// The original is left untouched; a history entry is added by the caller.
// `details` overrides the summary rows; `markIds` labels supervisors who already received it.
export const ResendNotificationModal = ({
  notification, onClose, onResend, supervisors,
  heading = 'Share notification', submitLabel = 'Resend Reminder', details, summary, markIds, markLabel = 'Original recipient',
}) => {
  const [ids, setIds] = useState([]);
  const [error, setError] = useState(null);
  const n = notification;

  const close = () => { setIds([]); setError(null); onClose(); };

  const recipients = supervisors.filter(s => ids.includes(s.id)).map(s => ({ id: s.id, name: s.name }));

  const validate = () => {
    if (!ids.length) { setError('Select at least one supervisor'); return false; }
    return true;
  };

  const confirmResend = () => {
    if (!validate()) return;
    onResend(n.id, recipients);
    close();
  };

  return (
    <Modal
      open={!!n}
      onCancel={close}
      width={600}
      centered
      destroyOnHidden
      title={<ModalTitle kicker="Share / resend" title={heading} />}
      footer={
        <>
          <Button type="text" onClick={close}>Cancel</Button>
          <Popconfirm
            title={`${submitLabel}?`}
            description={`It will be sent to ${recipients.length} ${recipients.length === 1 ? 'supervisor' : 'supervisors'}.`}
            okText="Send"
            onConfirm={confirmResend}
            disabled={!ids.length}
          >
            <Button type="primary" onClick={() => validate()}>{submitLabel}</Button>
          </Popconfirm>
        </>
      }
    >
      {n && (
        <Flex vertical gap={18}>
          <div className="ntf-original">
            <Flex justify="space-between" align="flex-start" gap={8}>
              <Typography.Text strong style={{ fontSize: 15 }}>{n.title}</Typography.Text>
              <PriorityTag value={n.priority} />
            </Flex>
            <Typography.Paragraph style={{ margin: '6px 0 10px', whiteSpace: 'pre-wrap' }}>{n.message}</Typography.Paragraph>
            {summary || <Descriptions size="small" column={1} items={details || [
              { key: 'd', label: 'Original sent date', children: formatDateTime(n.createdAt) },
              { key: 'r', label: 'Original recipients', children: recipientNames(n.recipients) },
            ]} />}
          </div>

          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Select supervisors</Typography.Text>
            <SupervisorSelector
              supervisors={supervisors}
              value={ids}
              onChange={v => { setIds(v); if (v.length) setError(null); }}
              error={error}
              markIds={markIds || (n.recipients || []).map(r => r.id)}
              markLabel={markLabel}
            />
          </div>
        </Flex>
      )}
    </Modal>
  );
};

export default ResendNotificationModal;
