import React from 'react';
import Modal from './Modal';
import Button from './Button';
import NotificationCard from './NotificationCard';
import { useTMSAdmin } from '../../context/TMSAdminContext';

/**
 * AdminNotificationsModal — Exact popup modal from Image 3 showing "All Messages".
 *
 * Props:
 *   isOpen: boolean
 *   onClose: function
 */
export const AdminNotificationsModal = ({ isOpen, onClose }) => {
  const { adminNotifications, markAdminNotifsRead } = useTMSAdmin();

  const handleClose = () => {
    if (markAdminNotifsRead) {
      markAdminNotifsRead();
    }
    onClose();
  };

  const list = adminNotifications && adminNotifications.length > 0 ? adminNotifications : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      subtitle="NOTIFICATIONS"
      title="All Messages"
      maxWidth="560px"
      footerStyle={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        padding: '16px 24px',
      }}
      bodyStyle={{
        maxHeight: '70vh',
      }}
      footer={
        <Button
          variant="primary"
          onClick={handleClose}
          style={{
            backgroundColor: 'var(--kr-green-800, #00462a)',
            borderColor: 'var(--kr-green-800, #00462a)',
            color: '#ffffff',
            fontWeight: 700,
            padding: '0 24px',
            borderRadius: '8px',
          }}
        >
          Close
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {list.map((item) => (
          <NotificationCard
            key={item.id}
            title={item.title}
            body={item.body}
            time={item.time}
            unread={item.unread}
          />
        ))}

        {list.length === 0 && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}
          >
            No notifications yet
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AdminNotificationsModal;

