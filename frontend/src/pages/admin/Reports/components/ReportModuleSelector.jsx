import React from 'react';
import { REPORT_MODULES } from '../reportEngine';
import {
  Users,
  Truck,
  MapPin,
  Building2,
  Fuel,
  CreditCard,
  Briefcase,
  AlertTriangle,
  CalendarCheck,
  Navigation,
  Disc3,
  BatteryCharging,
  Wrench,
  Gauge,
  Lock,
  Layers,
} from 'lucide-react';

const MODULE_ICONS = {
  driver: Users,
  vehicle: Truck,
  trip: Navigation,
  branch: Building2,
  diesel: Fuel,
  advance: CreditCard,
  client: Briefcase,
  deviation: AlertTriangle,
  attendance: CalendarCheck,
  location: MapPin,
  tyre: Disc3,
  battery: BatteryCharging,
  maintenance: Wrench,
  mileage: Gauge,
};

export const ReportModuleSelector = ({ activeModuleId, onSelectModule }) => {
  const activeModules = REPORT_MODULES.filter(m => m.available);
  const unavailableModules = REPORT_MODULES.filter(m => !m.available);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Column 1 Header */}
      <div className="reports-col-header">
        <div>
          <span className="reports-col-kicker">Step 1 · Choose Report</span>
          <h3 className="reports-col-title">
            <Layers size={18} color="var(--color-brand, #00623f)" />
            What would you like to see?
          </h3>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
            Choose the type of information you want to see.
          </div>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            background: 'var(--kr-green-50, #edf8f3)',
            color: 'var(--kr-green-800, #004a31)',
            padding: '3px 8px',
            borderRadius: '4px',
            border: '1px solid var(--kr-green-100, #daf1e7)',
          }}
        >
          {activeModules.length} Reports
        </span>
      </div>

      {/* Scrollable Column Body */}
      <div className="reports-col-scrollable">
        <div className="reports-module-grid">
          {activeModules.map(m => {
            const Icon = MODULE_ICONS[m.id] || Navigation;
            const isSelected = activeModuleId === m.id;

            return (
              <button
                key={m.id}
                type="button"
                className={`reports-module-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectModule(m.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? 'var(--color-brand, #00623f)' : 'var(--kr-grey-100, #f1f5f9)',
                      color: isSelected ? '#ffffff' : 'var(--kr-grey-700, #475569)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={15} />
                  </div>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      padding: '2px 5px',
                      borderRadius: '3px',
                      background: isSelected ? 'var(--color-brand, #00623f)' : 'var(--kr-grey-100, #f1f5f9)',
                      color: isSelected ? '#ffffff' : 'var(--text-muted, #64748b)',
                    }}
                  >
                    {m.category}
                  </span>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: isSelected ? 'var(--color-brand, #00623f)' : 'var(--text-heading, #1e293b)',
                    }}
                  >
                    {m.label}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted, #64748b)',
                      marginTop: '2px',
                      lineHeight: '1.25',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {m.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Unavailable Modules Banner at bottom of scrollable area */}
        {/* <div
          style={{
            marginTop: '6px',
            padding: '10px 12px',
            background: 'var(--kr-grey-50, #f8fafc)',
            border: '1px dashed var(--kr-grey-300, #cbd5e1)',
            borderRadius: 'var(--radius-md, 8px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--kr-grey-700, #475569)',
            }}
          >
            <Lock size={12} style={{ color: 'var(--kr-grey-500)' }} />
            <span>Modules without live project data:</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {unavailableModules.map(um => (
              <span
                key={um.id}
                title={um.unavailableReason}
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  background: '#ffffff',
                  border: '1px solid var(--border-default, #e2e8f0)',
                  color: 'var(--kr-grey-500, #94a3b8)',
                  cursor: 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ textDecoration: 'line-through' }}>{um.label}</span>
                <span style={{ fontSize: '8px', background: '#fee2e2', color: '#991b1b', padding: '1px 3px', borderRadius: '2px' }}>
                  No Data
                </span>
              </span>
            ))}
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default ReportModuleSelector;
