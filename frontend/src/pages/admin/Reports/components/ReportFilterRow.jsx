import React from 'react';
import { Button, Card, Col, DatePicker, Input, Row, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { Trash2 } from 'lucide-react';
import { MODULE_FIELDS, getDependentOptions } from '../reportEngine';
import { ReportCustomSelect } from './ReportCustomSelect';
import { ReportMultiSelect } from './ReportMultiSelect';

const DATE_FMT = 'YYYY-MM-DD';
const DISPLAY_FMT = 'DD MMM YYYY';

export const ReportFilterRow = ({
  filter,
  index,
  moduleId,
  filters,
  tms,
  onUpdateFilter,
  onRemoveFilter,
}) => {
  const fields = MODULE_FIELDS[moduleId] || [];
  const currentFieldDef = fields.find(f => f.key === filter.field) || fields[0];

  const fieldKey = filter.field || (fields[0] ? fields[0].key : '');
  const val = filter.value;

  // Resolve options dynamically using relationship awareness
  const availableOptions = getDependentOptions(moduleId, fieldKey, filters, tms);

  const handleFieldChange = (newField) => {
    const nextDef = fields.find(f => f.key === newField);
    let defaultVal = [];
    let defaultOp = nextDef?.type === 'dateRange' ? 'between' : 'equals';

    if (nextDef?.type === 'dateRange') {
      defaultVal = { from: '', to: '' };
    }

    onUpdateFilter(index, {
      field: newField,
      op: defaultOp,
      value: defaultVal,
    });
  };

  const handleValueChange = (newVal) => {
    const isDate = currentFieldDef?.type === 'dateRange';
    onUpdateFilter(index, {
      ...filter,
      op: isDate ? 'between' : 'equals',
      value: newVal,
    });
  };

  const isDateRange = currentFieldDef?.type === 'dateRange' || filter.op === 'between';

  // Field options for custom dropdown
  const fieldSelectOptions = fields.map(f => ({
    value: f.key,
    label: f.label,
  }));

  // dayjs <-> 'YYYY-MM-DD' string (same shape as the former <input type="date">)
  const toDay = (s) => (s ? dayjs(s) : null);
  const toStr = (d) => (d ? d.format(DATE_FMT) : '');

  return (
    <Card size="small" styles={{ body: { padding: '8px 10px' } }}>
      <Row gutter={[8, 8]} align="middle">
        {/* 1. Field Selector */}
        <Col xs={24} sm={{ flex: '150px' }} xl={{ flex: '160px' }}>
          <ReportCustomSelect
            value={fieldKey}
            options={fieldSelectOptions}
            onChange={handleFieldChange}
            placeholder="Select Field"
          />
        </Col>

        {/* 2. Direct Value / Multi-Select Selector (without intermediate operator) */}
        <Col flex="auto" style={{ minWidth: 0 }}>
          {isDateRange ? (
            /* Separate From / To pickers: one calendar each, either end optional,
               and neither can be set past the other. Value shape is unchanged. */
            <Row gutter={8}>
              <Col span={12}>
                <DatePicker
                  value={toDay(val?.from)}
                  format={DISPLAY_FMT}
                  placeholder="From date"
                  disabledDate={d => !!val?.to && d.isAfter(dayjs(val.to), 'day')}
                  onChange={d => handleValueChange({ ...(val || {}), from: toStr(d) })}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={12}>
                <DatePicker
                  value={toDay(val?.to)}
                  format={DISPLAY_FMT}
                  placeholder="To date"
                  disabledDate={d => !!val?.from && d.isBefore(dayjs(val.from), 'day')}
                  onChange={d => handleValueChange({ ...(val || {}), to: toStr(d) })}
                  style={{ width: '100%' }}
                />
              </Col>
            </Row>
          ) : availableOptions.length > 0 ? (
            /* Multi-Select with Live Search & Select All */
            <ReportMultiSelect
              values={val}
              options={availableOptions}
              onChange={handleValueChange}
              placeholder={`— Select ${currentFieldDef?.label || 'Choice'}(s) —`}
              fieldName={currentFieldDef?.label || 'Choice'}
            />
          ) : (
            /* Text input fallback for free-form fields */
            <Input
              placeholder={`Enter ${currentFieldDef?.label || ''}…`}
              value={typeof val === 'string' ? val : (Array.isArray(val) ? val.join(', ') : '')}
              onChange={(e) => handleValueChange(e.target.value)}
            />
          )}
        </Col>

        {/* 3. Remove Button */}
        <Col flex="none">
          <Tooltip title="Remove">
            <Button
              type="text"
              danger
              aria-label="Remove"
              icon={<Trash2 size={15} />}
              onClick={() => onRemoveFilter(index)}
            />
          </Tooltip>
        </Col>
      </Row>
    </Card>
  );
};

export default ReportFilterRow;
