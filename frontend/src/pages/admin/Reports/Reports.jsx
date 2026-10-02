import React, { useState, useEffect, useMemo } from 'react';
import { Card, Col, Flex, Row } from 'antd';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { downloadXlsx, fileDate } from '../../../utils/spreadsheet';
import {
  REPORT_MODULES,
  MODULE_FIELDS,
  ALL_MODULE_ID,
  generateReportData,
} from './reportEngine';
// Step 1 module picker temporarily hidden — see the commented block in the render below.
// import { ReportModuleSelector } from './components/ReportModuleSelector';
import { ReportFilterBuilder } from './components/ReportFilterBuilder';
import { ReportResultView } from './components/ReportResultView';
import '../../../styles/reports.css';
import {
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
} from 'lucide-react';
import { FILE_TRANSFER_ENABLED } from '../../../utils/featureFlags';

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

  // Active module state. While Step 1 is hidden this is the combined report
  // (all modules' filters & columns together). Restore 'driver' with Step 1.
  const [activeModuleId, setActiveModuleId] = useState(ALL_MODULE_ID);

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
    <Flex vertical gap={22}>
      {/* Step 1 & Step 2: Two-Column Responsive Grid Layout */}
      <Row gutter={[20, 16]} align="stretch">
        {/* Column 1: Step 1 - Module Selector (Scrollable) — temporarily hidden */}
        {/* <Col xs={24} lg={11}>
          <Card className="reports-grid-col">
            <ReportModuleSelector
              activeModuleId={activeModuleId}
              onSelectModule={handleSelectModule}
            />
          </Card>
        </Col> */}

        {/* Column 2: Step 2 - Dynamic Filter Engine (Scrollable)
            Full width while Step 1 is hidden; restore lg={13} with Step 1. */}
        <Col xs={24} lg={24}>
          <Card className="reports-grid-col">
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
          </Card>
        </Col>
      </Row>

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
      {/* <Card
        title={
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Ready-Made Standard Reports ({readyReports.length})
            </Typography.Title>
            <Typography.Text type="secondary">
              Download standard preconfigured reports with one click.
            </Typography.Text>
          </div>
        }
        extra={
          <Button
            type="link"
            onClick={() => setTemplatesOpen(!templatesOpen)}
            icon={templatesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            iconPlacement="end"
          >
            {templatesOpen ? 'Hide Standard Reports' : 'Show Standard Reports'}
          </Button>
        }
        styles={{ body: templatesOpen ? undefined : { display: 'none' } }}
      >
        {templatesOpen && (
          <Row gutter={[14, 14]}>
            {readyReports.map((item, idx) => (
              <Col key={idx} xs={24} sm={12} xl={8}>
                <Card size="small" style={{ height: '100%' }}>
                  <Typography.Text strong>{item.name}</Typography.Text>
                  <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: '4px 0 0' }}>
                    {item.desc}
                  </Typography.Paragraph>
                  <Flex justify="space-between" align="center" style={{ marginTop: 10 }}>
                    <Tag color="success" variant="filled">{item.type.toUpperCase()}</Tag>
                    <Button
                      type="primary"
                      size="small"
                      icon={<Download size={13} />}
                      onClick={() => FILE_TRANSFER_ENABLED && handleExportLegacyTemplate(item)}
                    >
                      Download Report
                    </Button>
                  </Flex>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card> */}
    </Flex>
  );
};

export default Reports;
