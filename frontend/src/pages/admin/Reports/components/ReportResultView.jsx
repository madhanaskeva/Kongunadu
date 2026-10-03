import React, { useState, useMemo, useEffect } from 'react';
import { Button, Card, Dropdown, Flex, Input, Table, Tag, Typography } from 'antd';
import {
  FileSpreadsheet,
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  Check,
} from 'lucide-react';
import { downloadXlsx, fileDate } from '../../../../utils/spreadsheet';
import { ReportEmptyState } from './ReportEmptyState';
import { useTMSAdmin } from '../../../../context/TMSAdminContext';
import { useDebounce } from '../../../../utils/debounce';
import { TabButtons } from '../../../../components/common/TabButtons';
import { FILE_TRANSFER_ENABLED } from '../../../../utils/featureFlags';

// A Total row adds up every figure column where a sum means something — litres, km, ₹, counts.
// Rates, percentages, mileage, readings and capacities are left blank.
const NO_TOTAL_UNITS = ['%', 'km/L', 'm'];
const NO_TOTAL_KEYS = ['rate', 'odometer', 'tank', 'radius', 'actualMileage', 'expectedMileage', 'mileage'];
const isTotalled = col => col.kind === 'num' && !NO_TOTAL_UNITS.includes(col.unit) && !NO_TOTAL_KEYS.includes(col.key);
const toFigure = v => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = parseFloat(String(v == null ? '' : v).replace(/[₹,\s]/g, ''));
  return Number.isFinite(n) ? n : null;
};
// One entry per column: the sum (rounded to 2 decimals so litres never show float noise), or null.
export const columnTotals = (cols, rows) => cols.map(col => {
  if (!isTotalled(col)) return null;
  const sum = rows.reduce((a, r) => a + (toFigure(r[col.key]) || 0), 0);
  return Math.round(sum * 100) / 100;
});
// The Total row as spreadsheet cells: 'Total' in the first column unless that column has a figure.
const totalRowCells = (cols, rows) => {
  const t = columnTotals(cols, rows);
  return t.map((v, i) => (v != null ? v : i === 0 ? 'Total' : ''));
};

export const ReportResultView = ({
  result,
  onResetFilters,
  onRemoveFilterChip,
}) => {
  const { showToast } = useTMSAdmin();
  if (!result) return null;

  const {
    moduleId,
    moduleMeta,
    columns = [],
    rows = [],
    summaries = [],
    activeFilterLabels = [],
    recordCount,
    generatedAt,
  } = result;

  // Driver performance sub-level view toggle ('trips' | 'vehicles')
  const [perfViewMode, setPerfViewMode] = useState('trips');

  const isDriverPerf = moduleId === 'driverPerformance' && Array.isArray(result.vehicleRows);
  const isVehView = isDriverPerf && perfViewMode === 'vehicles';

  const baseColumns = isVehView ? (result.vehicleColumns || columns) : columns;
  const baseRows = isVehView ? (result.vehicleRows || rows) : rows;

  // Local search filter within result set
  const [searchQ, setSearchQ] = useState('');
  const debouncedSearchQ = useDebounce(searchQ, 300);

  // Column visibility
  // Columns flagged defaultHidden start off but stay available in the Columns picker
  const defaultColKeys = cols => cols.filter(c => !c.defaultHidden).map(c => c.key);
  const [visibleColKeys, setVisibleColKeys] = useState(() => defaultColKeys(baseColumns));
  const [colDropdownOpen, setColDropdownOpen] = useState(false);

  useEffect(() => {
    setVisibleColKeys(defaultColKeys(baseColumns));
  }, [baseColumns]);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Filtered & Sorted Rows
  const processedRows = useMemo(() => {
    let list = [...baseRows];

    if (debouncedSearchQ.trim()) {
      const q = debouncedSearchQ.trim().toLowerCase();
      list = list.filter(row =>
        Object.values(row).some(val => val != null && String(val).toLowerCase().includes(q))
      );
    }

    if (sortConfig.key) {
      list.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA == null) return 1;
        if (valB == null) return -1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        return sortConfig.direction === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return list;
  }, [baseRows, debouncedSearchQ, sortConfig]);

  // Pagination (antd Table built-in, controlled so it resets to page 1
  // whenever the processed rows or page size change — same as usePagination)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => { setPage(1); }, [processedRows, pageSize]);

  // Stable row keys (row.id, falling back to the row's position)
  const tableRows = useMemo(
    () => processedRows.map((row, idx) => ({ row, rowKey: row.id || `__row_${idx}` })),
    [processedRows]
  );

  const activeColumns = useMemo(() => {
    return baseColumns.filter(c => visibleColKeys.includes(c.key));
  }, [baseColumns, visibleColKeys]);

  const toggleColumn = (key) => {
    setVisibleColKeys(prev =>
      prev.includes(key) ? (prev.length > 1 ? prev.filter(k => k !== key) : prev) : [...prev, key]
    );
  };

  // Export to Excel (.xlsx)
  const handleExportXlsx = () => {
    if (!processedRows.length && !rows.length) {
      showToast('warning', 'Nothing to export', 'No rows match the current choices and search.');
      return;
    }
    const name = `${(moduleMeta?.label || 'Report').replace(/[^a-zA-Z0-9]/g, '_')}_${fileDate()}.xlsx`;

    let sheets = [];

    if (moduleId === 'driverPerformance') {
      // 1. Trip Performance Sheet
      const tripColHeaders = columns.map(c => c.label + (c.unit ? ` (${c.unit})` : ''));
      const tripDataRows = [...rows.map(r => columns.map(c => (r[c.key] == null ? '' : r[c.key]))), totalRowCells(columns, rows)];
      sheets.push({
        name: 'Trip Performance',
        columns: tripColHeaders,
        rows: tripDataRows,
      });

      // 2. Vehicle Performance Sheet
      if (result.vehicleColumns && result.vehicleRows) {
        const vehColHeaders = result.vehicleColumns.map(c => c.label + (c.unit ? ` (${c.unit})` : ''));
        const vehDataRows = [...result.vehicleRows.map(r => result.vehicleColumns.map(c => (r[c.key] == null ? '' : r[c.key]))), totalRowCells(result.vehicleColumns, result.vehicleRows)];
        sheets.push({
          name: 'Vehicle Performance',
          columns: vehColHeaders,
          rows: vehDataRows,
        });
      }

      // 3. Driver Summary & Compliance Sheet
      if (summaries && summaries.length > 0) {
        sheets.push({
          name: 'Driver Summary & Compliance',
          columns: ['Metric', 'Value', 'Unit'],
          rows: summaries.map(s => [s.label, String(s.value ?? ''), s.unit || '']),
        });
      }

      // 4. Report Metadata Sheet
      sheets.push({
        name: 'Report Metadata',
        columns: ['Property', 'Value'],
        rows: [
          ['Module', moduleMeta?.label || moduleId],
          ['Generated At', generatedAt ? generatedAt.toLocaleString('en-IN') : new Date().toLocaleString('en-IN')],
          ['Active Filters', activeFilterLabels.join('; ') || 'None (All Records)'],
          ['Total Trips', String(rows.length)],
          ['Vehicles Handled', String(result.vehicleRows?.length || 0)],
        ],
      });
    } else {
      // Existing export behavior for standard modules
      const colHeaders = activeColumns.map(c => c.label + (c.unit ? ` (${c.unit})` : ''));
      const dataRows = [...processedRows.map(r => activeColumns.map(c => (r[c.key] == null ? '' : r[c.key]))), totalRowCells(activeColumns, processedRows)];

      sheets = [
        {
          name: moduleMeta?.label || 'Report',
          columns: colHeaders,
          rows: dataRows,
        },
        {
          name: 'Report Metadata',
          columns: ['Property', 'Value'],
          rows: [
            ['Module', moduleMeta?.label || moduleId],
            ['Generated At', generatedAt ? generatedAt.toLocaleString('en-IN') : new Date().toLocaleString('en-IN')],
            ['Active Filters', activeFilterLabels.join('; ') || 'None (All Records)'],
            ['Total Rows', String(processedRows.length)],
          ],
        },
      ];
    }

    try {
      downloadXlsx(name, sheets);
      showToast('success', 'Report Downloaded', `${name} (${processedRows.length} rows)`);
    } catch (e) {
      showToast('warning', 'Export failed', (e && e.message) || 'Could not create the Excel file.');
    }
  };

  // Status tone -> antd Tag preset colour (green / red / saffron / grey)
  const getStatusBadgeStyle = (val) => {
    const s = String(val || '').toLowerCase();
    if (s.includes('active') || s.includes('closed') || s.includes('ok') || s.includes('running') || s.includes('present') || s.includes('approved') || s.includes('compliant') || s.includes('above')) {
      return 'success';
    }
    if (s.includes('failed') || s.includes('inactive') || s.includes('high') || s.includes('absent') || s.includes('rejected') || s.includes('exceeded') || s.includes('below')) {
      return 'error';
    }
    if (s.includes('enroute') || s.includes('on road') || s.includes('idle') || s.includes('weak') || s.includes('medium') || s.includes('review') || s.includes('pending') || s.includes('near')) {
      return 'warning';
    }
    return 'default';
  };

  // Figures line up on the right: numeric columns, plus text columns whose every
  // value is a number or percentage (e.g. Utilisation "88%").
  // A space between digits (phone numbers) keeps a column as text.
  const NUMERIC_TEXT = /^[-+]?₹?\s?[\d.,]+%?$/;
  const isRightAligned = col => col.kind === 'num' || (
    col.kind !== 'badge' &&
    baseRows.some(r => r[col.key] != null && r[col.key] !== '' && r[col.key] !== '—') &&
    baseRows.every(r => r[col.key] == null || r[col.key] === '' || r[col.key] === '—' || NUMERIC_TEXT.test(String(r[col.key])))
  );

  const tableColumns = activeColumns.map(col => {
    const right = isRightAligned(col);
    return {
    key: col.key,
    align: right ? 'right' : 'left',
    // The heading sits over its values: right-aligned headings for figure columns.
    title: (
      <Flex align="center" justify={right ? 'flex-end' : 'flex-start'} gap={4} style={{ width: '100%' }}>
        <span>{col.label} {col.unit ? `(${col.unit})` : ''}</span>
        <ArrowUpDown size={12} opacity={sortConfig.key === col.key ? 1 : 0.4} />
      </Flex>
    ),
    onHeaderCell: () => ({
      onClick: () => handleSort(col.key),
      className: 'reports-result-th',
    }),
    onCell: () => ({
      className: `reports-result-cell${col.key === activeColumns[0].key ? ' reports-result-cell-first' : ''}`,
    }),
    render: (_, { row }) => {
      const rawVal = row[col.key];
      if (col.kind === 'badge') {
        return <Tag color={getStatusBadgeStyle(rawVal)}>{rawVal || '—'}</Tag>;
      }
      if (col.kind === 'num') {
        return (
          <span>
            {rawVal == null || rawVal === '' || rawVal === '—'
              ? '—'
              : typeof rawVal === 'number'
              ? rawVal.toLocaleString('en-IN')
              : rawVal}
          </span>
        );
      }
      return <span>{rawVal == null || rawVal === '' ? '—' : String(rawVal)}</span>;
    },
  };
  });

  // Totals over every row that matches (all pages), shown as the table's last row.
  const totals = useMemo(() => columnTotals(activeColumns, processedRows), [activeColumns, processedRows]);
  const renderTotalRow = () => (
    <Table.Summary fixed="bottom">
      <Table.Summary.Row className="reports-result-total">
        {activeColumns.map((col, i) => (
          <Table.Summary.Cell key={col.key} index={i} align={totals[i] != null || isRightAligned(col) ? 'right' : 'left'}>
            <strong>{totals[i] != null ? totals[i].toLocaleString('en-IN') : i === 0 ? 'Total' : ''}</strong>
          </Table.Summary.Cell>
        ))}
      </Table.Summary.Row>
    </Table.Summary>
  );

  const columnMenuItems = [
    {
      type: 'group',
      key: 'customize',
      label: 'Customize Column',
      children: baseColumns.map(c => ({
        key: c.key,
        label: (
          <Flex justify="space-between" align="center" gap={8}>
            <span>{c.label}</span>
            {visibleColKeys.includes(c.key) && <Check size={14} color="var(--color-brand)" />}
          </Flex>
        ),
      })),
    },
  ];

  return (
    <Card>
      <Flex vertical gap={16}>
        {/* Header & Meta */}
        <Flex justify="space-between" align="flex-start" wrap gap={14}>
          <div>
            <Flex align="center" gap={8}>
              <Typography.Text className="reports-result-kicker">Report View</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                · {generatedAt ? generatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
              </Typography.Text>
            </Flex>

            <Typography.Title level={4} style={{ margin: '4px 0 2px' }}>
              {moduleMeta?.label || 'Generated'} Report
            </Typography.Title>

            <Typography.Text type="secondary">
              Your report is based on the choices you selected (showing <strong>{processedRows.length}</strong> of <strong>{recordCount}</strong> records).
            </Typography.Text>
          </div>

          {/* Export Buttons */}
          <Flex align="center" gap={8} wrap>
            <Button
              type="primary"
              icon={<FileSpreadsheet size={15} />}
              onClick={FILE_TRANSFER_ENABLED ? handleExportXlsx : undefined}
            >
              Download Excel (.xlsx)
            </Button>
          </Flex>
        </Flex>

        {/* Active Filter Chips */}
        {activeFilterLabels.length > 0 && (
          <Flex align="center" gap={8} wrap className="reports-chip-bar">
            <Typography.Text strong style={{ fontSize: 12 }}>
              Selected choices:
            </Typography.Text>
            {activeFilterLabels.map((lbl, idx) => (
              <Tag
                key={idx}
                closable={!!onRemoveFilterChip}
                onClose={(e) => {
                  e.preventDefault();
                  onRemoveFilterChip(idx);
                }}
                style={{ marginInlineEnd: 0 }}
              >
                {lbl}
              </Tag>
            ))}
          </Flex>
        )}

        {/* Driver Performance Sub-view Selector */}
        {isDriverPerf && (
          <Flex align="center" gap={10} style={{ margin: '2px 0 0' }}>
            <Typography.Text strong style={{ fontSize: 13 }}>
              Performance Level:
            </Typography.Text>
            <TabButtons
              ariaLabel="Performance level"
              value={perfViewMode}
              onChange={(val) => {
                setPerfViewMode(val);
                setPage(1);
              }}
              items={[
                { label: `Trip-Level Performance (${rows.length})`, value: 'trips' },
                { label: `Vehicle-Level Performance (${result.vehicleRows?.length || 0})`, value: 'vehicles' },
              ]}
            />
          </Flex>
        )}

        {/* Table Toolbar */}
        <Flex justify="space-between" align="center" wrap gap={10}>
          {/* Search */}
          <Input
            className="tms-search"
            prefix={<Search size={16} strokeWidth={2} />}
            allowClear
            placeholder="Search in this report…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            style={{ width: 'clamp(220px, 24vw, 300px)', maxWidth: '100%' }}
          />

          {/* Column Visibility Dropdown */}
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            open={colDropdownOpen}
            onOpenChange={(nextOpen, info) => {
              // keep the menu open while toggling columns; close on trigger / outside click
              if (!info || info.source === 'trigger') setColDropdownOpen(nextOpen);
            }}
            menu={{
              items: columnMenuItems,
              selectable: true,
              multiple: true,
              selectedKeys: visibleColKeys,
              onClick: ({ key }) => toggleColumn(key),
              style: { maxHeight: 280, overflowY: 'auto', width: 220 },
            }}
          >
            <Button icon={<SlidersHorizontal size={14} />}>
              Columns ({activeColumns.length}/{baseColumns.length})
            </Button>
          </Dropdown>
        </Flex>

        {/* Main Table */}
        {processedRows.length === 0 ? (
          <ReportEmptyState activeFilterLabels={activeFilterLabels} onResetFilters={onResetFilters} />
        ) : (
          <Table
            columns={tableColumns}
            dataSource={tableRows}
            rowKey="rowKey"
            size="middle"
            bordered
            tableLayout="auto"
            scroll={{ x: 'max-content' }}
            summary={renderTotalRow}
            pagination={{
              current: page,
              pageSize,
              onChange: (p, s) => { setPage(p); setPageSize(s); },
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (t, [a, b]) => `Showing ${a} to ${b} of ${t} records`,
            }}
          />
        )}
      </Flex>
    </Card>
  );
};
export default ReportResultView;
