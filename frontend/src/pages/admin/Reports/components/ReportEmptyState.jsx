import React from 'react';
import { Button, Empty, Typography } from 'antd';
import { SearchX, RotateCcw } from 'lucide-react';

export const ReportEmptyState = ({ activeFilterLabels = [], onResetFilters }) => {
  return (
    <Empty
      className="reports-empty"
      image={<SearchX size={40} strokeWidth={1.5} />}
      styles={{ image: { height: 'auto', color: 'var(--kr-grey-500, #94a3b8)' } }}
      description={
        <>
          <Typography.Title level={5} style={{ margin: '0 0 6px' }}>
            No information found matching your choices
          </Typography.Title>
          <Typography.Text type="secondary">
            {activeFilterLabels.length > 0 ? (
              <>
                No records match your selected choices:{' '}
                <Typography.Text strong>{activeFilterLabels.join(' and ')}</Typography.Text>
                . Try removing one of your choices or choosing a wider time period.
              </>
            ) : (
              'There are currently no records for this report.'
            )}
          </Typography.Text>
        </>
      }
    >
      {onResetFilters && (
        <Button onClick={onResetFilters} icon={<RotateCcw size={14} />}>
          Clear all choices
        </Button>
      )}
    </Empty>
  );
};
export default ReportEmptyState;
