import React from 'react';
import { Card, Flex } from 'antd';
import { TabButtons } from '../../../components/common/TabButtons';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import VehiclePerformance from './components/VehiclePerformance';
import AnalyticsCompareView from './components/AnalyticsCompareView';
import { ANALYTICS_TABS } from './analyticsTabs';

const TABS = [
  { value: 'trips', label: 'Trip' },
  { value: 'gps', label: 'GPS' },
  { value: 'vehicles', label: 'Vehicle' },
  { value: 'drivers', label: 'Driver' },
  { value: 'branches', label: 'Branch' },
  { value: 'irregularities', label: 'Irregularities' },
];

// Every tab has the same shape — filters, summary, bar charts, comparison table.
// Vehicle compares monthly Target vs Actual KM; the others compare trip and
// exception figures for the clients, vehicles, drivers, branches or types picked.
export const Analytics = () => {
  const { anTab = 'trips', setAnTab, T } = useTMSAdmin();
  const tms = T ? T() : {};
  const tab = TABS.some(t => t.value === anTab) ? anTab : 'trips';

  return (
    <Flex vertical gap={20}>
      <Card styles={{ body: { padding: '12px 16px' } }}>
        <TabButtons ariaLabel="Analytics view" value={tab} onChange={setAnTab} items={TABS} />
      </Card>

      {tab === 'vehicles' ? (
        <VehiclePerformance tms={tms} />
      ) : (
        // Keyed by tab so each one opens on its own defaults.
        <AnalyticsCompareView key={tab} config={ANALYTICS_TABS[tab]} tms={tms} />
      )}
    </Flex>
  );
};

export default Analytics;
