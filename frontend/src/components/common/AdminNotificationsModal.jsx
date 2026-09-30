import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Empty, Flex, Modal, Space, Typography } from 'antd';
import NotificationCard from './NotificationCard';
import { useTMSAdmin } from '../../context/TMSAdminContext';

/**
 * AdminNotificationsModal — "All Messages" popup opened from the header bell.
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
      open={!!isOpen}
      onCancel={handleClose}
      width={560}
      centered
      title={
        <div>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}
          >
            NOTIFICATIONS
          </Typography.Text>
          <div>All Messages</div>
        </div>
      }
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      footer={
        <Button type="primary" onClick={handleClose}>
          Close
        </Button>
      }
    >
      <Flex vertical gap={14}>
        {shown.map((item) => (
          <NotificationCard
            key={item.id}
            title={item.title}
            body={item.body}
            time={item.time}
            unread={item.unread}
            actions={
              item.kind === 'bunkApproval' && item.bunkRequestId ? (
                <Space size={8}>
                  <Button type="primary" size="small" onClick={() => decideBunkRequest(item.bunkRequestId, 'Approved')}>
                    Approve Bunk
                  </Button>
                  <Button danger size="small" onClick={() => decideBunkRequest(item.bunkRequestId, 'Rejected')}>
                    Reject
                  </Button>
                </Space>
              ) : null
            }
          />
        ))}

        {list.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notifications yet" />}

        <Flex justify="center">
          <Button onClick={viewAll}>
            {list.length > PREVIEW_COUNT ? `View all (${list.length})` : 'View all'}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default AdminNotificationsModal;
