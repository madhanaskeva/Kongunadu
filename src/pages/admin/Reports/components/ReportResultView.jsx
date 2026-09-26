import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  X,
  Calendar,
  Check,
} from 'lucide-react';
import { Pagination, usePagination } from '../../../../components/common/Pagination';
import { downloadXlsx, fileDate } from '../../../../utils/spreadsheet';
import { ReportEmptyState } from './ReportEmptyState';

export const ReportResultView = ({
  result,
  onResetFilters,
  onRemoveFilterChip,
}) => {
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

  // Local search filter within result set
  const [searchQ, setSearchQ] = useState('');

  // Column visibility
  const [visibleColKeys, setVisibleColKeys] = useState(() => columns.map(c => c.key));
  const [colDropdownOpen, setColDropdownOpen] = useState(false);

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
    let list = [...rows];

    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
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
  }, [rows, searchQ, sortConfig]);

  const pagination = usePagination(processedRows, [processedRows]);

  const activeColumns = useMemo(() => {
    return columns.filter(c => visibleColKeys.includes(c.key));
  }, [columns, visibleColKeys]);

  const toggleColumn = (key) => {
    setVisibleColKeys(prev =>
      prev.includes(key) ? (prev.length > 1 ? prev.filter(k => k !== key) : prev) : [...prev, key]
    );
  };

  // Export to Excel (.xlsx)
  const handleExportXlsx = () => {
    if (!processedRows.length) return;
    const name = `${(moduleMeta?.label || 'Report').replace(/[^a-zA-Z0-9]/g, '_')}_${fileDate()}.xlsx`;
    const colHeaders = activeColumns.map(c => c.label + (c.unit ? ` (${c.unit})` : ''));
    const dataRows = processedRows.map(r => activeColumns.map(c => (r[c.key] == null ? '' : r[c.key])));

    downloadXlsx(name, [
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
    ]);
  };

  const getStatusBadgeStyle = (val) => {
    const s = String(val || '').toLowerCase();
    if (s.includes('active') || s.includes('closed') || s.includes('ok') || s.includes('running') || s.includes('present') || s.includes('approved')) {
      return { background: 'var(--kr-green-50, #edf8f3)', color: 'var(--kr-green-800, #004a31)', border: '1px solid var(--kr-green-100, #daf1e7)' };
    }
    if (s.includes('failed') || s.includes('inactive') || s.includes('high') || s.includes('absent') || s.includes('rejected')) {
      return { background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2' };
    }
    if (s.includes('enroute') || s.includes('on road') || s.includes('idle') || s.includes('weak') || s.includes('medium') || s.includes('review') || s.includes('pending')) {
      return { background: 'var(--kr-saffron-100, #fdebd3)', color: 'var(--kr-saffron-600, #d97b00)', border: '1px solid #fed7aa' };
    }
    return { background: 'var(--kr-grey-100, #f1f5f9)', color: 'var(--kr-grey-700, #334155)', border: '1px solid #e2e8f0' };
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border-default, #e2e8f0)',
        borderRadius: 'var(--radius-lg, 12px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      {/* Header & Meta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-brand, #00623f)' }}>
              Report View
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
              · {generatedAt ? generatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>

          <h2 style={{ margin: '4px 0 2px', fontSize: '20px', fontWeight: 800, color: 'var(--text-heading, #1e293b)' }}>
            {moduleMeta?.label || 'Generated'} Report
          </h2>

          <div style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
            Your report is based on the choices you selected (showing <strong>{processedRows.length}</strong> of <strong>{recordCount}</strong> records).
          </div>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportXlsx}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '36px',
              padding: '0 14px',
              borderRadius: '6px',
              background: 'var(--color-brand, #00623f)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 1px 3px rgba(0, 98, 63, 0.2)',
            }}
          >
            <FileSpreadsheet size={15} />
            Download Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterLabels.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '10px 14px', background: 'var(--surface-muted, #f8fafc)', borderRadius: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kr-grey-700, #334155)' }}>
            Selected choices:
          </span>
          {activeFilterLabels.map((lbl, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                padding: '3px 10px',
                borderRadius: '12px',
                background: '#ffffff',
                border: '1px solid var(--border-default, #e2e8f0)',
                color: 'var(--kr-green-900, #003021)',
                fontWeight: 600,
              }}
            >
              {lbl}
              {onRemoveFilterChip && (
                <button
                  type="button"
                  onClick={() => onRemoveFilterChip(idx)}
                  style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <X size={12} style={{ color: 'var(--kr-grey-500)' }} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Table Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '6px' }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--kr-grey-400, #94a3b8)' }} />
          <input
            type="text"
            placeholder="Search in this report…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              height: '36px',
              paddingLeft: '32px',
              paddingRight: '12px',
              borderRadius: '6px',
              border: '1px solid var(--border-strong, #cbd5e1)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        {/* Column Visibility Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setColDropdownOpen(!colDropdownOpen)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '36px',
              padding: '0 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-strong, #cbd5e1)',
              background: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-body, #334155)',
            }}
          >
            <SlidersHorizontal size={14} />
            <span>Columns ({activeColumns.length}/{columns.length})</span>
          </button>

          {colDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '42px',
                zIndex: 40,
                width: '220px',
                background: '#ffffff',
                border: '1px solid var(--border-default, #e2e8f0)',
                borderRadius: '8px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                padding: '8px',
                maxHeight: '280px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', padding: '4px 6px', color: 'var(--text-muted)' }}>
                Toggle Columns
              </div>
              {columns.map(c => {
                const on = visibleColKeys.includes(c.key);
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => toggleColumn(c.key)}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: on ? 'var(--text-heading)' : 'var(--text-muted)',
                      background: on ? 'var(--surface-muted)' : 'transparent',
                    }}
                  >
                    <span>{c.label}</span>
                    {on && <Check size={14} color="var(--color-brand)" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
      {processedRows.length === 0 ? (
        <ReportEmptyState activeFilterLabels={activeFilterLabels} onResetFilters={onResetFilters} />
      ) : (
        <div
          style={{
            border: '1px solid var(--border-default, #e2e8f0)',
            borderRadius: 'var(--radius-md, 8px)',
            background: '#ffffff',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-muted, #f8fafc)', borderBottom: '1px solid var(--border-default, #e2e8f0)' }}>
                  {activeColumns.map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      style={{
                        padding: '10px 14px',
                        textAlign: col.kind === 'num' ? 'right' : 'left',
                        fontFamily: 'var(--font-display, sans-serif)',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--kr-grey-700, #475569)',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>{col.label} {col.unit ? `(${col.unit})` : ''}</span>
                        <ArrowUpDown size={12} style={{ opacity: sortConfig.key === col.key ? 1 : 0.4 }} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagination.rows.map((row, rIdx) => (
                  <tr
                    key={row.id || rIdx}
                    style={{
                      borderTop: '1px solid var(--border-default, #e2e8f0)',
                      background: rIdx % 2 === 0 ? '#ffffff' : 'var(--kr-grey-50, #fcfcfb)',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--kr-green-50, #edf8f3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = rIdx % 2 === 0 ? '#ffffff' : 'var(--kr-grey-50, #fcfcfb)'; }}
                  >
                    {activeColumns.map(col => {
                      const rawVal = row[col.key];

                      return (
                        <td
                          key={col.key}
                          style={{
                            padding: '10px 14px',
                            textAlign: col.kind === 'num' ? 'right' : 'left',
                            color: 'var(--text-body, #334155)',
                            whiteSpace: 'nowrap',
                            maxWidth: '280px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontWeight: col.key === activeColumns[0].key ? 700 : 400,
                          }}
                        >
                          {col.kind === 'badge' ? (
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                ...getStatusBadgeStyle(rawVal),
                              }}
                            >
                              {rawVal || '—'}
                            </span>
                          ) : col.kind === 'num' ? (
                            <span>
                              {rawVal == null || rawVal === '' || rawVal === '—'
                                ? '—'
                                : typeof rawVal === 'number'
                                ? rawVal.toLocaleString('en-IN')
                                : rawVal}
                            </span>
                          ) : (
                            <span>{rawVal == null || rawVal === '' ? '—' : String(rawVal)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination (stable outside the horizontal scrolling table) */}
          <Pagination
            {...pagination}
            noun="records"
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-default, #e2e8f0)',
              background: '#ffffff',
            }}
          />
        </div>
      )}
    </div>
  );
};
export default ReportResultView;
