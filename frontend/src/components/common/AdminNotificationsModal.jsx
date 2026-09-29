import React from 'react';
import { useNavigate } from 'react-router-dom';
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
// How many of the newest notifications the popup shows; "View all" opens the full page.
const PREVIEW_COUNT = 4;

export const AdminNotificationsModal = ({ isOpen, onClose }) => {
  const { adminNotifications, markAdminNotifsRead, decideBunkRequest } = useTMSAdmin();
  const navigate = useNavigate();

  const handleClose = () => {
    if (markAdminNotifsRead) {
      markAdminNotifsRead();
    }
    onClose();
  };

  const list = adminNotifications && adminNotifications.length > 0 ? adminNotifications : [];
  const shown = list.slice(0, PREVIEW_COUNT);

  // Close without marking read, so the full page still highlights what is new.
  const viewAll = () => {
    onClose();
    navigate('/admin/notifications');
  };

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
        {shown.map((item) => (
          <NotificationCard
            key={item.id}
            title={item.title}
            body={item.body}
            time={item.time}
            unread={item.unread}
            actions={
              item.kind === 'bunkApproval' && item.bunkRequestId ? (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => decideBunkRequest(item.bunkRequestId, 'Approved')}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      background: 'var(--color-brand)',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    Approve Bunk
                  </button>
                  <button
                    type="button"
                    onClick={() => decideBunkRequest(item.bunkRequestId, 'Rejected')}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--kr-red-600)',
                      color: 'var(--kr-red-600)',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    Reject
                  </button>
                </div>
              ) : null
            }
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

        <Button
          variant="outline"
          onClick={viewAll}
          style={{ alignSelf: 'center', fontWeight: 700, borderRadius: '8px', padding: '0 20px' }}
        >
          {list.length > PREVIEW_COUNT ? `View all (${list.length})` : 'View all'}
        </Button>
      </div>
    </Modal>
  );
};

export default AdminNotificationsModal;

