import React from 'react';
import { Table as AntTable } from 'antd';
import Loader from './Loader';
import EmptyState from './EmptyState';

/**
 * Table — antd-backed drop-in replacement.
 *
 * Props interface identical to original:
 *   columns: [{ key, label, render, headerStyle, cellStyle }]
 *   data, loading, emptyTitle, emptyMessage, onRowClick
 *
 * Maps the existing columns API (label/key/render) to antd format
 * (title/dataIndex/render) and preserves exact visual styling:
 *   - Header: surface-muted bg, 11px uppercase font-display, text-muted
 *   - Cell: 14px, text-body, 14px 16px padding
 *   - Row hover: surface-muted bg
 *   - Outer border: border-default, radius-lg
 */
export const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = 'No records found',
  emptyMessage = 'There are no items matching your criteria.',
  onRowClick,
}) => {
  if (loading) {
    return <Loader message="Fetching table records…" />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  /* Convert our columns format → antd columns format */
  const antColumns = columns.map((col, idx) => ({
    key: col.key || idx,
    dataIndex: col.key,
    title: (
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
          ...col.headerStyle,
        }}
      >
        {col.label}
      </span>
    ),
    render: col.render
      ? (val, row) => col.render(val, row)
      : (val) => (
          <span style={{ color: 'var(--text-body)', ...col.cellStyle }}>
            {val ?? '—'}
          </span>
        ),
    onCell: () => ({
      style: {
        padding: '14px 16px',
        color: 'var(--text-body)',
        verticalAlign: 'middle',
        ...col.cellStyle,
      },
    }),
  }));

  return (
    <AntTable
      columns={antColumns}
      dataSource={data.map((row, i) => ({ ...row, _rowKey: row.id ?? i }))}
      rowKey="_rowKey"
      pagination={false}
      showSorterTooltip={false}
      onRow={(row) => ({
        onClick: () => onRowClick && onRowClick(row),
        style: { cursor: onRowClick ? 'pointer' : 'default' },
      })}
      style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        overflow: 'hidden',
      }}
      styles={{
        header: {
          backgroundColor: 'var(--surface-muted)',
          borderBottom: '1px solid var(--border-default)',
        },
      }}
    />
  );
};

export default Table;
