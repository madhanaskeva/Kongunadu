import React from 'react';
import { Avatar, Card, Col, Flex, Row, Tag, Typography } from 'antd';
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
  Award,
} from 'lucide-react';

const MODULE_ICONS = {
  driver: Users,
  driverPerformance: Award,
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

const BRAND = 'var(--color-brand, #275e74)';

export const ReportModuleSelector = ({ activeModuleId, onSelectModule }) => {
  const activeModules = REPORT_MODULES.filter(m => m.available);
  const unavailableModules = REPORT_MODULES.filter(m => !m.available);

  return (
    <Flex vertical style={{ height: '100%', minHeight: 0 }}>
      {/* Column 1 Header */}
      <Flex className="reports-col-header" justify="space-between" align="flex-start" wrap gap={8}>
        <div>
          <Typography.Text className="reports-col-kicker">Step 1 · Choose Report</Typography.Text>
          <Typography.Title level={5} className="reports-col-title">
            <Flex align="center" gap={8}>
              <Layers size={18} color={BRAND} />
              What would you like to see?
            </Flex>
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Choose the type of information you want to see.
          </Typography.Text>
        </div>
        <Tag color="success">{activeModules.length} Reports</Tag>
      </Flex>

      {/* Scrollable Column Body */}
      <div className="reports-col-scrollable">
        <Row gutter={[10, 10]}>
          {activeModules.map(m => {
            const Icon = MODULE_ICONS[m.id] || Navigation;
            const isSelected = activeModuleId === m.id;

            return (
              <Col key={m.id} xs={12} sm={8} lg={12} xl={8}>
                <Card
                  hoverable
                  size="small"
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  className={`reports-module-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectModule(m.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectModule(m.id); }
                  }}
                  styles={{ body: { padding: '12px 10px' } }}
                >
                  <Flex vertical gap={6}>
                    <Flex justify="space-between" align="center">
                      <Avatar
                        shape="square"
                        size={28}
                        icon={<Icon size={15} />}
                        style={{
                          background: isSelected ? BRAND : 'var(--kr-grey-100, #f1f5f9)',
                          color: isSelected ? '#ffffff' : 'var(--kr-grey-700, #475569)',
                        }}
                      />
                      <Tag
                        bordered={false}
                        color={isSelected ? '#275e74' : undefined}
                        style={{ marginInlineEnd: 0, fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}
                      >
                        {m.category}
                      </Tag>
                    </Flex>

                    <div>
                      <Typography.Text strong style={{ fontSize: 13, color: isSelected ? BRAND : undefined }}>
                        {m.label}
                      </Typography.Text>
                      <Typography.Paragraph
                        type="secondary"
                        ellipsis={{ rows: 2 }}
                        style={{ fontSize: 11, lineHeight: 1.25, margin: '2px 0 0' }}
                      >
                        {m.description}
                      </Typography.Paragraph>
                    </div>
                  </Flex>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Unavailable Modules Banner at bottom of scrollable area */}
        {/* <Alert
          type="info"
          showIcon
          icon={<Lock size={12} />}
          title="Modules without live project data:"
          description={
            <Flex wrap gap={6}>
              {unavailableModules.map(um => (
                <Tooltip key={um.id} title={um.unavailableReason}>
                  <Tag>
                    <Typography.Text delete type="secondary">{um.label}</Typography.Text>{' '}
                    <Tag color="error" variant="filled">No Data</Tag>
                  </Tag>
                </Tooltip>
              ))}
            </Flex>
          }
        /> */}
      </div>
    </Flex>
  );
};

export default ReportModuleSelector;
