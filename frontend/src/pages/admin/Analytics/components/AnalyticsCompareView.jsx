import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Card, Col, Empty, Flex, Row, Statistic, Typography } from 'antd';
import {
  GRAINS, autoGrain, buildComparison, fmtChange, fmtMetric, prepareSources, rankEntities,
} from '../../../../utils/analyticsCompare';
import CompareFilters from './CompareFilters';
import MetricChart from './MetricChart';
import CompareTable from './CompareTable';
import SectionHeader from './SectionHeader';
import { SERIES_COLORS } from './BarChart';
import '../../../../styles/analytics.css';

const DEFAULT_DAYS = 30;
const DEFAULT_ENTITY_COUNT = 5;

// One Analytics tab: filters → summary cards → a bar chart per metric → the
// period-by-period comparison table. What is compared comes from `config`.
export const AnalyticsCompareView = ({ config, tms }) => {
  const prepared = useMemo(() => prepareSources({ sources: config.sources(tms) }), [config, tms]);
  const allEntities = useMemo(() => config.entities(tms), [config, tms]);
  const entityName = (id) => (allEntities.find(e => e.value === id) || {}).label || id;
  const branchOptions = config.branchFilter
    ? (tms.branches || []).map(b => ({ value: b.id, label: b.name }))
    : null;

  // Default: the last 30 days, the busiest few entities in them, every metric.
  const initial = useMemo(() => {
    const to = dayjs().endOf('day');
    const from = to.subtract(DEFAULT_DAYS - 1, 'day').startOf('day');
    const ranked = rankEntities(prepared, allEntities.map(e => e.value), { start: from.valueOf(), end: to.valueOf() });
    const busy = ranked.filter(r => r.n > 0).map(r => r.id);
    return {
      branch: '',
      entities: (busy.length ? busy : allEntities.map(e => e.value)).slice(0, DEFAULT_ENTITY_COUNT),
      metrics: config.metrics.map(m => m.key),
      from,
      to,
      grain: '',
    };
  }, [prepared, allEntities, config]);

  const [draft, setDraft] = useState(initial);
  const [applied, setApplied] = useState(initial);

  // The entity list follows the branch; a branch change drops entities it doesn't own.
  const entityOptions = allEntities.filter(e => !draft.branch || !e.branch || e.branch === draft.branch);
  const onChange = (patch) => setDraft(d => {
    const next = { ...d, ...patch };
    if ('branch' in patch) {
      const ok = new Set(allEntities.filter(e => !next.branch || !e.branch || e.branch === next.branch).map(e => e.value));
      next.entities = next.entities.filter(id => ok.has(id));
    }
    return next;
  });

  const key = (s) => [s.branch, s.entities.join(), s.metrics.join(), s.from.format('YYYYMMDD'), s.to.format('YYYYMMDD'), s.grain].join('|');
  const dirty = key(draft) !== key(applied);

  const grain = applied.grain || autoGrain(applied.from, applied.to);
  const metrics = config.metrics.filter(m => applied.metrics.includes(m.key));
  // Table and charts follow the picker's order, not the click order.
  const orderedIds = allEntities.map(e => e.value).filter(id => applied.entities.includes(id));

  const comparison = useMemo(
    () => (orderedIds.length ? buildComparison({
      prepared,
      metrics,
      entities: orderedIds,
      entityName,
      branch: applied.branch,
      from: applied.from,
      to: applied.to,
      grain,
    }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prepared, applied, grain],
  );

  // Colour follows the entity's place in the applied selection.
  const colorOf = (id) => SERIES_COLORS[orderedIds.indexOf(id)] || 'var(--kr-grey-500)';
  const periodWord = { day: 'Daily', week: 'Weekly', month: 'Monthly' }[grain];
  const scope = `${applied.from.format('DD MMM YYYY')} – ${applied.to.format('DD MMM YYYY')} · ${orderedIds.length} ${
    orderedIds.length === 1 ? config.entityLabel.toLowerCase() : config.entityPlural}${
    applied.branch ? ` · ${(tms.B[applied.branch] || {}).name || ''}` : ''}`;

  return (
    <Flex vertical gap={28}>
      <CompareFilters
        entityLabel={config.entityLabel}
        entityNoun={config.entityPlural}
        entityOptions={entityOptions}
        branchOptions={branchOptions}
        metricOptions={config.metrics.map(m => ({ value: m.key, label: m.label }))}
        grainOptions={GRAINS}
        autoGrainValue={autoGrain(draft.from, draft.to)}
        draft={draft}
        dirty={dirty}
        onChange={onChange}
        onApply={() => setApplied(draft)}
      />

      {!comparison || !metrics.length ? (
        <Card>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`Select ${config.entityPlural} and metrics, then press Compare.`} />
        </Card>
      ) : (
        <>
          {/* 1 · Overview — every selected metric, the selection combined, vs the same length of time before */}
          <section className="an-section">
            <SectionHeader step={1} title="Overview" sub={`${scope} · compared with the previous ${comparison.days} day${comparison.days !== 1 ? 's' : ''}`} />
            <Row gutter={[16, 16]}>
              {metrics.map(m => {
                const cur = comparison.all.total[m.key];
                const ch = fmtChange(m.kind, cur, comparison.previous[m.key]);
                return (
                  <Col key={m.key} xs={24} sm={12} lg={8} xxl={metrics.length > 4 ? 4 : 6}>
                    <Card className="tms-kpi" style={{ height: '100%', '--kpi': 'var(--color-brand)' }}>
                      <Statistic title={<span className="tms-kpi-label">{m.label}</span>} value={fmtMetric(m.kind, cur)} formatter={v => v} />
                      <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12.5, marginTop: 6 }}>
                        {ch ? `${ch.text} vs previous period` : 'No earlier figures'}
                      </Typography.Text>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </section>

          {/* 2 · Charts — a bar chart per selected metric */}
          <section className="an-section">
            <SectionHeader
              step={2}
              title="Charts"
              sub={orderedIds.length > 1
                ? `Each colour is one of the ${orderedIds.length} ${config.entityPlural} · hover a bar for its value`
                : 'Hover a bar for its value'}
            />
            <Row gutter={[16, 16]}>
              {metrics.map(m => (
                <Col key={m.key} xs={24} xl={12}>
                  <MetricChart metric={m} comparison={comparison} colorOf={colorOf} />
                </Col>
              ))}
            </Row>
          </section>

          {/* 3 · Statistics — the same figures as numbers */}
          <section className="an-section">
            <SectionHeader step={3} title="Statistics" sub={`One metric at a time, or all metrics together · ${periodWord} columns`} />
            <CompareTable
              title={config.title}
              entityLabel={config.entityLabel}
              comparison={comparison}
              metrics={metrics}
              colorOf={colorOf}
            />
          </section>
        </>
      )}
    </Flex>
  );
};

export default AnalyticsCompareView;
