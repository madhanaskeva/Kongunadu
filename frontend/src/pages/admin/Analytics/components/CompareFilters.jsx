import React from 'react';
import dayjs from 'dayjs';
import { Button, Card, DatePicker, Divider, Flex, Select, Typography } from 'antd';
import { BarChart3, Building2, ListChecks, Users } from 'lucide-react';
import { matchesSearch } from '../../../../utils/search';
import { TabButtons } from '../../../../components/common/TabButtons';
import { DatePresetSelect } from '../../../../components/common/DatePresetSelect';

const DATE_FMT = 'DD MMM YYYY';

// Multi-select with "n of m selected · Select all · Clear" above the list.
const PickMany = ({ value, options, onChange, placeholder, prefix, noun }) => {
  const all = options.map(o => o.value);
  return (
    <Select
      mode="multiple"
      allowClear
      prefix={prefix}
      placeholder={placeholder}
      value={value}
      options={options}
      maxTagCount="responsive"
      showSearch={{ filterOption: (input, o) => matchesSearch(input, o.label) }}
      onChange={onChange}
      // The field can be narrower than this header, so the panel gets its own width.
      popupMatchSelectWidth={false}
      popupRender={menu => (
        <div className="tms-pick-panel">
          <Flex justify="space-between" align="center" gap={8} wrap style={{ padding: '4px 8px' }}>
            <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
              {value.length} of {all.length} {noun} selected
            </Typography.Text>
            <Flex gap={4} style={{ flex: 'none' }}>
              <Button size="small" type="link" disabled={value.length === all.length} onClick={() => onChange(all)}>
                Select all
              </Button>
              <Button size="small" type="link" disabled={!value.length} onClick={() => onChange([])}>
                Clear
              </Button>
            </Flex>
          </Flex>
          <Divider style={{ margin: '4px 0' }} />
          {menu}
        </div>
      )}
      style={{ width: '100%' }}
    />
  );
};

const Label = ({ children }) => (
  <Typography.Text strong style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>{children}</Typography.Text>
);

// The filter card every Analytics tab starts with. Edits are a draft until
// Compare applies them. Branch, metrics and grouping are optional per tab.
export const CompareFilters = ({
  entityLabel, entityNoun, entityIcon, entityOptions,
  branchOptions, metricOptions, grainOptions, autoGrainValue,
  draft, onChange, onApply, dirty, applyLabel = 'Compare',
}) => {
  const missing = !draft.entities.length
    ? `Select at least one ${entityLabel.toLowerCase()} to compare.`
    : metricOptions && !draft.metrics.length
    ? 'Select at least one metric.'
    : '';

  return (
    <Card styles={{ body: { padding: '18px 20px' } }}>
      <div className={`tms-filter-grid${grainOptions ? ' an-filter-row' : ''}`} style={{ '--filter-min': '150px' }}>
        {branchOptions && (
          <div>
            <Label>Branch</Label>
            <Select
              prefix={<Building2 size={16} />}
              value={draft.branch}
              options={[{ value: '', label: 'All branches' }, ...branchOptions]}
              popupMatchSelectWidth={false}
              onChange={v => onChange({ branch: v })}
              style={{ width: '100%' }}
            />
          </div>
        )}
        <div>
          <Label>{entityLabel}</Label>
          <PickMany
            value={draft.entities}
            options={entityOptions}
            onChange={ids => onChange({ entities: ids })}
            placeholder={`Select ${entityNoun}...`}
            prefix={entityIcon || <Users size={16} />}
            noun={entityNoun}
          />
        </div>
        {metricOptions && (
          <div>
            <Label>Metrics</Label>
            <PickMany
              value={draft.metrics}
              options={metricOptions}
              onChange={keys => onChange({ metrics: keys })}
              placeholder="Select metrics..."
              prefix={<ListChecks size={16} />}
              noun="metrics"
            />
          </div>
        )}
        <div>
          <Label>Period</Label>
          <DatePresetSelect
            from={draft.from}
            to={draft.to}
            allowClear={false}
            placeholder="Custom range"
            onChange={(f, t) => onChange({ from: f, to: t })}
          />
        </div>
        <div>
          <Label>From Date</Label>
          <DatePicker
            value={draft.from}
            format={DATE_FMT}
            allowClear={false}
            disabledDate={d => d.isAfter(draft.to, 'day') || d.isAfter(dayjs(), 'day')}
            onChange={d => d && onChange({ from: d })}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <Label>To Date</Label>
          <DatePicker
            value={draft.to}
            format={DATE_FMT}
            allowClear={false}
            disabledDate={d => d.isBefore(draft.from, 'day')}
            onChange={d => d && onChange({ to: d })}
            style={{ width: '100%' }}
          />
        </div>
        {grainOptions && (
          <div className="an-grain-cell">
            <Label>Group by</Label>
            <TabButtons
              ariaLabel="Group by"
              value={draft.grain || autoGrainValue}
              items={grainOptions}
              onChange={v => onChange({ grain: v })}
              className="an-grain"
            />
          </div>
        )}
        <div className="tms-filter-end">
          <Button type="primary" block icon={<BarChart3 size={16} />} disabled={!!missing} onClick={onApply}>
            {applyLabel}
          </Button>
        </div>
      </div>

      {(missing || dirty) && (
        <Flex justify="flex-end" style={{ marginTop: 10 }}>
          <Typography.Text type={missing ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
            {missing || `Filters changed — press ${applyLabel} to update.`}
          </Typography.Text>
        </Flex>
      )}
    </Card>
  );
};

export default CompareFilters;
