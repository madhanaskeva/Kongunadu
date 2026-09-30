import React from 'react';
import { Button, Empty, Flex, Typography } from 'antd';
import { Plus, RotateCcw, Play, Filter } from 'lucide-react';
import { ReportFilterRow } from './ReportFilterRow';
import { MODULE_FIELDS } from '../reportEngine';

export const ReportFilterBuilder = ({
  moduleId,
  filters,
  tms,
  loading,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  onResetFilters,
  onGenerateReport,
}) => {
  const fields = MODULE_FIELDS[moduleId] || [];

  const handleAddDefaultFilter = () => {
    const usedFields = new Set(filters.map(f => f.field));
    const nextField = fields.find(f => !usedFields.has(f.key)) || fields[0];

    let defaultVal = [];
    let defaultOp = 'equals';
    if (nextField?.type === 'dateRange') {
      defaultVal = { from: '', to: '' };
      defaultOp = 'between';
    }

    onAddFilter({
      field: nextField ? nextField.key : 'branch',
      op: defaultOp,
      value: defaultVal,
    });
  };

  return (
    <Flex vertical style={{ height: '100%', minHeight: 0 }}>
      {/* Column 2 Header */}
      <Flex className="reports-col-header" justify="space-between" align="flex-start" wrap gap={8}>
        <div>
          <Typography.Text className="reports-col-kicker">Step 2 · Refine Your Report</Typography.Text>
          <Typography.Title level={5} className="reports-col-title">
            <Flex align="center" gap={8}>
              <Filter size={18} color="var(--color-brand, #00623f)" />
              Choose the details you want
            </Flex>
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Add one or more choices to narrow down your report.
          </Typography.Text>
        </div>

        <Flex align="center" gap={8} wrap>
          {filters.length > 0 && (
            <Button
              size="small"
              onClick={onResetFilters}
              title="Clear all choices"
              icon={<RotateCcw size={12} />}
            >
              Clear all
            </Button>
          )}

          <Button
            size="small"
            color="primary"
            variant="outlined"
            onClick={handleAddDefaultFilter}
            icon={<Plus size={13} />}
          >
            Add another choice
          </Button>
        </Flex>
      </Flex>

      {/* Scrollable Column Body */}
      <div className="reports-col-scrollable">
        {filters.length === 0 ? (
          <Empty
            style={{ margin: 'auto 0' }}
            image={<Filter size={28} strokeWidth={1.5} />}
            styles={{ image: { height: 'auto', color: 'var(--kr-grey-500, #94a3b8)' } }}
            description={
              <>
                <Typography.Text strong>No choices selected yet</Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Click <strong>+ Add another choice</strong> to pick specific details (like Branch or Vehicle), or click <strong>Show Report</strong> to see all information.
                </Typography.Text>
              </>
            }
          >
            <Button type="primary" size="small" onClick={handleAddDefaultFilter} icon={<Plus size={13} />}>
              Add a choice
            </Button>
          </Empty>
        ) : (
          <Flex vertical gap={8}>
            {filters.map((f, idx) => (
              <ReportFilterRow
                key={idx}
                filter={f}
                index={idx}
                moduleId={moduleId}
                filters={filters}
                tms={tms}
                onUpdateFilter={onUpdateFilter}
                onRemoveFilter={onRemoveFilter}
              />
            ))}
          </Flex>
        )}
      </div>

      {/* Column Footer with Generate Action */}
      <Flex className="reports-col-footer" justify="space-between" align="center" wrap gap={10}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {filters.length > 0 ? (
            <span>
              <strong>{filters.length}</strong> {filters.length === 1 ? 'choice' : 'choices'} selected
            </span>
          ) : (
            <span>Showing all records</span>
          )}
        </Typography.Text>

        <Button
          type="primary"
          disabled={loading}
          loading={loading}
          onClick={onGenerateReport}
          icon={loading ? undefined : <Play size={14} fill="#ffffff" />}
        >
          {loading ? 'Loading report…' : 'Show Report'}
        </Button>
      </Flex>
    </Flex>
  );
};

export default ReportFilterBuilder;
