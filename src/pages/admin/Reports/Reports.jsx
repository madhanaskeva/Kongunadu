import React, { useState, useEffect, useMemo } from 'react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { downloadXlsx, fileDate } from '../../../utils/spreadsheet';
import {
  REPORT_MODULES,
  MODULE_FIELDS,
  generateReportData,
} from './reportEngine';
import { ReportModuleSelector } from './components/ReportModuleSelector';
import { ReportFilterBuilder } from './components/ReportFilterBuilder';
import { ReportResultView } from './components/ReportResultView';
import './reports.css';
import {
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
} from 'lucide-react';

const ATT_KEY = 'kr-tms-attendance';
const readAttStore = () => {
  try {
    return JSON.parse(localStorage.getItem(ATT_KEY) || '{}') || {};
  } catch (e) {
    return {};
  }
};

export const Reports = () => {
  const { T, showToast } = useTMSAdmin();
  const { can } = useModuleAccess();
  const tms = T();

  // Active module state (Default: 'driver' as requested in prompt workflow)
  const [activeModuleId, setActiveModuleId] = useState('driver');

  // Dynamic filter conditions state: [{ field, op, value }]
  const [filters, setFilters] = useState([]);

  // Loading state during report computation
  const [loading, setLoading] = useState(false);

  // Generated report result state
  const [reportResult, setReportResult] = useState(null);

  // Collapsible toggle for standard ready-made templates
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // Read attendance store for driver attendance integration
  const attStore = useMemo(() => readAttStore(), []);

  // Handler: Select a new report module
  const handleSelectModule = (modId) => {
    setActiveModuleId(modId);
    setFilters([]); // Reset filters when changing module to avoid cross-module key collisions
    setReportResult(null); // Clear previous results
  };

  // Handler: Add new filter row
  const handleAddFilter = (newCondition) => {
    setFilters(prev => [...prev, newCondition]);
  };

  // Handler: Update specific filter row
  const handleUpdateFilter = (index, updatedCondition) => {
    setFilters(prev => {
      const next = [...prev];
      next[index] = updatedCondition;
      return next;
    });
  };

  // Handler: Remove specific filter row
  const handleRemoveFilter = (index) => {
    setFilters(prev => prev.filter((_, idx) => idx !== index));
  };

  // Handler: Reset all filters
  const handleResetFilters = () => {
    setFilters([]);
    // Regenerate unfiltered
    const res = generateReportData(activeModuleId, [], tms, attStore);
    setReportResult(res);
    showToast('info', 'Choices Cleared', `Showing all records for ${res.moduleMeta?.label || activeModuleId}.`);
  };

  // Handler: Remove filter chip from results view
  const handleRemoveFilterChip = (index) => {
    const nextFilters = filters.filter((_, idx) => idx !== index);
    setFilters(nextFilters);
    const res = generateReportData(activeModuleId, nextFilters, tms, attStore);
    setReportResult(res);
  };

  // Handler: Generate Report with active filters
  const handleGenerateReport = () => {
    setLoading(true);
    setTimeout(() => {
      try {
        const res = generateReportData(activeModuleId, filters, tms, attStore);
        setReportResult(res);
        setLoading(false);
        showToast(
          'success',
          'Report Ready',
          `${res.recordCount} records ready for ${res.moduleMeta?.label || activeModuleId}.`
        );
      } catch (err) {
        console.error('Error generating report:', err);
        setLoading(false);
        showToast('warning', 'Notice', 'Could not load report. Please verify your selected choices.');
      }
    }, 280);
  };

  // Auto-generate initial report when module changes or on initial load
  useEffect(() => {
    const res = generateReportData(activeModuleId, filters, tms, attStore);
    setReportResult(res);
  }, [activeModuleId]);

  // 12 Standard Legacy Reports for backward compatibility & quick exports
  const readyReports = [
    { name: 'Daily Trip Register', type: 'trip', desc: 'All trips opened and closed by branch.', defaultCols: ['number', 'date', 'vehicle', 'driver', 'branch', 'type', 'distance', 'status'] },
    { name: 'Billing-Ready Trips', type: 'trip', filter: t => t.status === 'Closed' && t.type === 'Business', desc: 'Closed business trips with invoice, LR, and verified distance.' },
    { name: 'Non-Business Movements', type: 'trip', filter: t => t.type === 'Non-Business', desc: 'All non-business movements with reason and distance.' },
    { name: 'Route Variance & Diversion Audit', type: 'deviation', desc: 'Diversions, corridor departures and distance variances exceeding 5% threshold.' },
    { name: 'Driver Duty & Utilisation', type: 'driver', desc: 'Driver profiles, vehicle mapping, trips, distance, and attendance record.' },
    { name: 'Vehicle Fleet History', type: 'vehicle', desc: 'Registration, branch, mapped driver, odometer KM, running status & GPS.' },
    { name: 'Fuel Consumption & Bunk Register', type: 'diesel', desc: 'Fuel filled, authorized bunk slips, rate per litre, cost and mileage.' },
    { name: 'Trip Advance Settlements', type: 'advance', desc: 'Advances disbursed, driver bata, cleaner bata, and total expense breakdown.' },
    { name: 'Branch Performance Aggregation', type: 'branch', desc: 'Fleet count, driver roster, active trips, fuel cost and advances per branch.' },
    { name: 'Client Movement Register', type: 'client', desc: 'Dispatches, dedicated fleet allotments, customer delivery points per client.' },
    { name: 'Attendance Register', type: 'attendance', desc: 'Daily driver presence, duty status, monthly present/absent days and utilisation.' },
    { name: 'Loading Hub Operations', type: 'location', desc: 'Cryogenic hubs, client terminals, radius geofence and outbound dispatches.' },
  ];

  const handleExportLegacyTemplate = (item) => {
    const res = generateReportData(item.type, [], tms, attStore);
    let exportRows = res.rows;
    if (item.filter) {
      exportRows = exportRows.filter(item.filter);
    }
    const filename = `${item.name.replace(/[^A-Za-z0-9]+/g, '_')}_${fileDate()}.xlsx`;
    const colHeaders = res.columns.map(c => c.label + (c.unit ? ` (${c.unit})` : ''));
    const dataRows = exportRows.map(r => res.columns.map(c => (r[c.key] == null ? '' : r[c.key])));

    if (!exportRows.length) {
      showToast('warning', 'Nothing to export', `${item.name} has no rows right now.`);
      return;
    }
    try {
      downloadXlsx(filename, [
        {
          name: item.name,
          columns: colHeaders,
          rows: dataRows,
        },
      ]);
      showToast('success', 'Report Downloaded', `${filename} (${exportRows.length} rows)`);
    } catch (e) {
      showToast('warning', 'Export failed', (e && e.message) || 'Could not create the Excel file.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Step 1 & Step 2: Two-Column Responsive Grid Layout */}
      <div className="reports-two-col-grid">
        {/* Column 1: Step 1 - Module Selector (Scrollable) */}
        <div className="reports-grid-col">
          <ReportModuleSelector
            activeModuleId={activeModuleId}
            onSelectModule={handleSelectModule}
          />
        </div>

        {/* Column 2: Step 2 - Dynamic Filter Engine (Scrollable) */}
        <div className="reports-grid-col">
          <ReportFilterBuilder
            moduleId={activeModuleId}
            filters={filters}
            tms={tms}
            loading={loading}
            onAddFilter={handleAddFilter}
            onUpdateFilter={handleUpdateFilter}
            onRemoveFilter={handleRemoveFilter}
            onResetFilters={handleResetFilters}
            onGenerateReport={handleGenerateReport}
          />
        </div>
      </div>

      {/* Step 3: Generated Report Results View */}
      {reportResult && (
        <section>
          <ReportResultView
            result={reportResult}
            onResetFilters={handleResetFilters}
            onRemoveFilterChip={handleRemoveFilterChip}
          />
        </section>
      )}

      {/* Ready-Made Standard Reports Drawer (Bottom) */}
      <section
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-default, #e2e8f0)',
          borderRadius: 'var(--radius-lg, 12px)',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <button
          type="button"
          onClick={() => setTemplatesOpen(!templatesOpen)}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            boxSizing: 'border-box',
            padding: '16px 20px',
            background: templatesOpen ? 'var(--surface-muted, #f8fafc)' : '#ffffff',
            transition: 'background 0.15s ease',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-display, sans-serif)', fontWeight: 800, fontSize: '15px', color: 'var(--text-heading, #1e293b)' }}>
              Ready-Made Standard Reports ({readyReports.length})
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
              Download standard preconfigured reports with one click.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--color-brand, #00623f)' }}>
            <span>{templatesOpen ? 'Hide Standard Reports' : 'Show Standard Reports'}</span>
            {templatesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {templatesOpen && (
          <div
            style={{
              padding: '20px',
              borderTop: '1px solid var(--border-default, #e2e8f0)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '14px',
            }}
          >
            {readyReports.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-default, #e2e8f0)',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading, #1e293b)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px', lineHeight: 1.4 }}>
                    {item.desc}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-brand, #00623f)' }}>
                    {item.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleExportLegacyTemplate(item)}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      height: '30px',
                      padding: '0 12px',
                      borderRadius: '5px',
                      background: 'var(--color-brand, #00623f)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    <Download size={13} />
                    Download Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Reports;
