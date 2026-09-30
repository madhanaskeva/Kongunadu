import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Card, Empty, Flex } from 'antd';
import {
  buildMonthOnMonth, buildSummary, buildVehicleStats, monthsInRange,
} from '../../../../utils/vehiclePerformance';
import { Truck } from 'lucide-react';
import CompareFilters from './CompareFilters';
import VehiclePerformanceSummary from './VehiclePerformanceSummary';
import VehiclePerformanceTable from './VehiclePerformanceTable';
import MonthComparison from './MonthComparison';
import PerformanceTrend from './PerformanceTrend';
import SectionHeader from './SectionHeader';
import '../../../../styles/analytics.css';

const DEFAULT_VEHICLE_COUNT = 4;

// Analytics › Vehicle: pick vehicles and a date range, then compare Target KM,
// Actual KM and Performance month by month.
export const VehiclePerformance = ({ tms }) => {
  const records = tms.vehiclePerformance || [];
  const vehicleOptions = useMemo(
    () => records
      .map(r => ({ value: r.vehicle, label: (tms.V[r.vehicle] || {}).number || r.vehicleNumber }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [records, tms.V],
  );

  // Default: the last six months up to today, the first few vehicles.
  const initial = useMemo(() => ({
    entities: records.slice(0, DEFAULT_VEHICLE_COUNT).map(r => r.vehicle),
    from: dayjs().subtract(5, 'month').startOf('month'),
    to: dayjs().endOf('month'),
  }), [records]);

  const [draft, setDraft] = useState(initial);
  const [applied, setApplied] = useState(initial);
  const dirty =
    draft.entities.join() !== applied.entities.join() ||
    !draft.from.isSame(applied.from, 'day') ||
    !draft.to.isSame(applied.to, 'day');

  const months = useMemo(() => monthsInRange(applied.from, applied.to), [applied]);
  // Keep the table in the order the vehicles are listed in the picker.
  const orderedIds = useMemo(
    () => vehicleOptions.map(o => o.value).filter(id => applied.entities.includes(id)),
    [vehicleOptions, applied.entities],
  );
  const stats = useMemo(() => buildVehicleStats(records, orderedIds, months), [records, orderedIds, months]);
  const summary = useMemo(() => buildSummary(stats), [stats]);
  const mom = useMemo(() => buildMonthOnMonth(records, orderedIds, months[months.length - 1]), [records, orderedIds, months]);

  return (
    <Flex vertical gap={28}>
      <CompareFilters
        entityLabel="Vehicle Number"
        entityNoun="vehicles"
        entityIcon={<Truck size={16} />}
        entityOptions={vehicleOptions}
        applyLabel="Compare Performance"
        draft={draft}
        dirty={dirty}
        onChange={patch => setDraft(d => ({ ...d, ...patch }))}
        onApply={() => setApplied(draft)}
      />

      {stats.length === 0 ? (
        <Card>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select vehicles and press Compare Performance." />
        </Card>
      ) : (
        <>
          {/* Same three steps as every other Analytics tab */}
          <section className="an-section">
            <SectionHeader
              step={1}
              title="Overview"
              sub={`${applied.from.format('DD MMM YYYY')} – ${applied.to.format('DD MMM YYYY')} · ${months.length} month${months.length !== 1 ? 's' : ''} · ${stats.length} vehicle${stats.length !== 1 ? 's' : ''}`}
            />
            <VehiclePerformanceSummary summary={summary} monthCount={months.length} />
          </section>

          <section className="an-section">
            <SectionHeader step={2} title="Charts" sub="Hover a bar for its value" />
            <PerformanceTrend stats={stats} months={months} />
          </section>

          <section className="an-section">
            <SectionHeader step={3} title="Statistics" sub="Month by month, then the latest month against the one before" />
            <VehiclePerformanceTable stats={stats} months={months} />
            <MonthComparison mom={mom} />
          </section>
        </>
      )}
    </Flex>
  );
};

export default VehiclePerformance;
