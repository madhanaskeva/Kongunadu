import React, { useMemo, useState } from 'react';
import { Badge, Card, Flex, Tabs } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { useAuth } from '../../../hooks/useAuth';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import {
  createNotification, getAutomaticAlerts, getNotifications, getSupervisors, resendNotification, setAlertStatus, shareAlert,
} from '../../../utils/notificationUtils';
import { AutomaticAlerts } from './AutomaticAlerts';
import { ManualNotifications } from './ManualNotifications';
import { HeadOfficeInbox } from './HeadOfficeInbox';
import '../../../styles/notifications.css';

const TABS = ['automatic', 'manual', 'inbox'];

// Notifications: system-generated alerts, notices the admin sent to supervisors, and the Head Office inbox.
export const Notifications = () => {
  const { T, showToast, adminNotifications, adminNotifRead } = useTMSAdmin();
  const { user } = useAuth();
  const { can } = useModuleAccess();
  const tms = T();
  const adminName = user?.name || 'Head Office Admin';
  const canSend = can('notifications', 'add');

  // Tab lives in the URL (?tab=) so a reload or a shared link lands on the same list.
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'automatic';
  const setTab = key => setParams(p => { p.set('tab', key); return p; }, { replace: true });

  // Bumped after a read/unread change so the derived alert list re-reads its stored status.
  const [statusRev, setStatusRev] = useState(0);
  const alerts = useMemo(() => getAutomaticAlerts(tms), [tms, statusRev]);
  const [notifications, setNotifications] = useState(getNotifications);
  const supervisors = useMemo(() => getSupervisors(tms), [tms]);

  const unreadAlerts = alerts.filter(a => a.status === 'unread').length;
  const readSet = new Set(adminNotifRead || []);
  const unreadInbox = (adminNotifications || []).filter(n => !readSet.has(n.id)).length;

  const handleSetStatus = (keys, status) => {
    if (!keys.length) return;
    setAlertStatus(keys, status);
    setStatusRev(r => r + 1);
  };

  const handleSend = ({ title, message, priority, recipients }) => {
    try {
      setNotifications(createNotification({ title, message, priority, recipients, createdBy: adminName }));
      showToast('success', 'Notification sent', `"${title.trim()}" sent to ${recipients.length} ${recipients.length === 1 ? 'supervisor' : 'supervisors'}.`);
      return true;
    } catch (e) {
      showToast('danger', 'Could not send', 'The notification could not be saved. Please try again.');
      return false;
    }
  };

  const handleShareAlert = (alert, recipients) => {
    try {
      shareAlert(alert, { recipients, sentBy: adminName });
      setStatusRev(r => r + 1);
      showToast('success', 'Alert shared', `${alert.id} sent to ${recipients.map(r => r.name).join(', ')}.`);
    } catch (e) {
      showToast('danger', 'Could not share', 'The alert could not be shared. Please try again.');
    }
  };

  const handleResend = (id, recipients) => {
    try {
      setNotifications(resendNotification(id, { recipients, sentBy: adminName }));
      showToast('success', 'Reminder resent', `Sent again to ${recipients.map(r => r.name).join(', ')}.`);
    } catch (e) {
      showToast('danger', 'Could not resend', 'The reminder could not be saved. Please try again.');
    }
  };

  const label = (text, count) => (
    <Flex align="center" gap={8}>
      {text}
      {count > 0 && <Badge count={count} size="small" color="var(--color-brand)" />}
    </Flex>
  );

  const items = [
    {
      key: 'automatic',
      label: label('Automatically Generated Alerts', unreadAlerts),
      children: <AutomaticAlerts alerts={alerts} onSetStatus={handleSetStatus} supervisors={supervisors} canSend={canSend} onShare={handleShareAlert} />,
    },
    {
      key: 'manual',
      label: label('Manually Sent Alerts', 0),
      children: (
        <ManualNotifications
          notifications={notifications}
          supervisors={supervisors}
          canSend={canSend}
          onSend={handleSend}
          onResend={handleResend}
        />
      ),
    },
    {
      key: 'inbox',
      label: label('Head Office Inbox', unreadInbox),
      children: <HeadOfficeInbox />,
    },
  ];

  return (
    <Flex vertical gap={20} className="ntf-page">
      <Card styles={{ body: { padding: '0 18px' } }}>
        <Tabs activeKey={tab} onChange={setTab} items={items.map(({ key, label: l }) => ({ key, label: l }))} tabBarStyle={{ marginBottom: 0 }} />
      </Card>
      {items.find(i => i.key === tab).children}
    </Flex>
  );
};

export default Notifications;
