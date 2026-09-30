import React, { useState } from 'react';
import { Button, Card, Col, Empty, Flex, Form, Input, Row, Segmented, Select, Space, Tabs, Tag, Tooltip, Typography } from 'antd';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { CHART_TYPES, CHART_LABELS } from '../../../components/charts';

export const Settings = () => {
  const {
    st,
    setSt,
    dashTab,
    setDashTab,
    dashCfg,
    saveDash,
    dashDefault,
    dashForm,
    setDashForm,
    dashFormErr,
    setDashFormErr,
    showToast,
    navTo,
    T,
    saveSettings,
    ST_DEFAULT,
  } = useTMSAdmin();
  const tms = T();

  // Dashboard Modules Catalog
  const dt = dashTab || 'cards';
  const df = dashForm || { module: '', title: '', fields: [], chartType: 'bar' };
  const dtItems = (dashCfg && dashCfg[dt]) || [];

  const modulesList = [
    { id: 'trips', label: 'Trips', cols: ['Trip number', 'Branch', 'Vehicle', 'Driver', 'Client · unloading', 'Type', 'Opened', 'Status', 'Flags'] },
    { id: 'exceptions', label: 'Exceptions', cols: ['Severity', 'Type', 'Vehicle / trip', 'Detail', 'Branch', 'Raised', 'Assignee', 'Status'] },
    { id: 'fleet', label: 'Fleet & GPS', cols: ['Vehicle', 'Type', 'Branch', 'Driver', 'Status', 'GPS', 'Odometer', 'Last seen', 'Route'] },
    { id: 'attendance', label: 'Attendance', cols: ['Driver', 'Branch', 'Type', 'Present', 'Absent', 'Utilisation', 'Status'] },
    { id: 'branches', label: 'Branches', cols: ['Code', 'Branch', 'State', 'Vehicles', 'Supervisor', 'Status'] },
    { id: 'supervisors', label: 'Supervisors', cols: ['Name', 'Phone', 'Branch', 'Clients handled', 'Last login', 'Status'] },
    { id: 'vehicles', label: 'Vehicles', cols: ['Registration', 'Type', 'Branch', 'Odometer', 'Tank', 'GPS', 'Status'] },
    { id: 'drivers', label: 'Drivers', cols: ['Name', 'Licence', 'Phone', 'Branch', 'Type', 'Approval', 'Status'] },
    { id: 'clients', label: 'Clients', cols: ['Client', 'GSTIN', 'Branch', 'Customers', 'Contact'] },
    { id: 'locations', label: 'Loading locations', cols: ['Location', 'Branch', 'Address', 'Safe radius', 'Coordinates'] },
    { id: 'routes', label: 'Routes', cols: ['Route', 'From', 'To', 'Fixed KM', 'Duration', 'Toll'] },
    { id: 'analytics', label: 'Analytics', cols: ['Area', 'KPI', 'Value', 'Note'] },
    { id: 'reports', label: 'Reports', cols: ['Report', 'Description', 'Last run', 'Rows'] },
    { id: 'deviceApprovals', label: 'Device approvals', cols: ['Mobile number', 'IMEI', 'Device', 'Branch', 'Requested', 'Status'] },
    { id: 'users', label: 'Users & roles', cols: ['Name', 'Email', 'Role', 'Branch scope', 'Status', 'Last active'] },
  ];

  const modById = Object.fromEntries(modulesList.map(m => [m.id, m]));
  const fm = modById[df.module] || null;

  const dashTabs = [
    { value: 'cards', label: 'Card view' },
    { value: 'charts', label: 'Chart view' },
    { value: 'lists', label: 'List view' },
  ];
  const dashNoun = { cards: 'card', charts: 'chart', lists: 'list' }[dt];

  const handleAddDashItem = () => {
    if (!fm) {
      setDashFormErr('Choose a module.');
      return;
    }
    if (!df.fields || !df.fields.length) {
      setDashFormErr(`Select at least one heading from ${fm.label}.`);
      return;
    }
    const item = {
      uid: fm.id + '-' + Math.random().toString(36).slice(2, 7),
      module: fm.id,
      title: (df.title || '').trim(),
      fields: fm.cols.filter(h => df.fields.includes(h)),
      ...(dt === 'charts' ? { chartType: df.chartType || 'bar' } : {}),
    };
    saveDash({ ...dashCfg, [dt]: [...dtItems, item] });
    setDashForm({ module: '', title: '', fields: [], chartType: 'bar' });
    setDashFormErr('');
    showToast('success', 'Added to dashboard', `${item.title || fm.label} · ${item.fields.length} headings from ${fm.label}.`);
  };

  const handleUpdateChartType = (uid, chartType) => {
    const next = dtItems.map(item => item.uid === uid ? { ...item, chartType } : item);
    saveDash({ ...dashCfg, charts: next });
    const it = dtItems.find(x => x.uid === uid);
    const itemLabel = it?.title || (it?.module ? modById[it.module]?.label : it?.src) || uid;
    showToast('info', 'Chart view updated', `${itemLabel}: changed to ${CHART_LABELS[chartType] || chartType}.`);
  };

  const removeDashItem = (uid) => {
    const it = dtItems.find(x => x.uid === uid);
    saveDash({ ...dashCfg, [dt]: dtItems.filter(x => x.uid !== uid) });
    if (it) showToast('info', 'Removed from dashboard', it.title || (it.module ? modById[it.module]?.label : uid));
  };

  const moveDashItem = (uid, dir) => {
    const i = dtItems.findIndex(x => x.uid === uid);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= dtItems.length) return;
    const next = [...dtItems];
    [next[i], next[j]] = [next[j], next[i]];
    saveDash({ ...dashCfg, [dt]: next });
  };

  const handleRestoreAll = () => {
    saveDash(dashDefault());
    setDashForm({ module: '', title: '', fields: [], chartType: 'bar' });
    setDashFormErr('');
    showToast('info', 'Dashboard restored', 'Every metric is back on the dashboard.');
  };

  const handleSaveSettings = () => {
    saveSettings(st);
    showToast('success', 'Settings saved', `Variance ${st.variance}%, radius ${st.radius} m, long open ${st.longOpen} h.`);
  };

  const handleResetSettings = () => {
    saveSettings(ST_DEFAULT);
    showToast('info', 'Settings reset', 'Restored system thresholds to defaults.');
  };

  // Section heading: title + one-line description (wraps inside the Card header)
  const sectionTitle = (title, sub) => (
    <div style={{ whiteSpace: 'normal', paddingBlock: 12 }}>
      <Typography.Title level={5} style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        {title}
      </Typography.Title>
      <Typography.Text type="secondary" style={{ fontWeight: 400 }}>{sub}</Typography.Text>
    </div>
  );

  const subTitle = text => (
    <Typography.Title level={5} style={{ margin: 0, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {text}
    </Typography.Title>
  );

  return (
    <Flex vertical gap={24}>
      {/* Dashboard Layout Customizer Section */}
      <Card
        title={sectionTitle(
          'Dashboard layout',
          'Add a card, chart or list with the form. Its values are fetched automatically and it appears on the dashboard straight away.'
        )}
        extra={
          <Space size={8} wrap>
            <Button type="text" onClick={handleRestoreAll}>
              Restore defaults
            </Button>
            <Button type="link" onClick={() => navTo('dashboard')}>
              View dashboard &rarr;
            </Button>
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        {/* View Tabs */}
        <Tabs
          activeKey={dt}
          onChange={key => {
            setDashTab(key);
            setDashFormErr('');
          }}
          items={dashTabs.map(t => ({ key: t.value, label: t.label }))}
          tabBarStyle={{ paddingInline: 18, marginBottom: 0 }}
        />

        <Row>
          {/* Add Form Column (muted panel) */}
          <Col xs={24} lg={8} style={{ padding: 18, background: 'var(--surface-muted)', borderRight: '1px solid var(--border-default)' }}>
            <Form layout="vertical" component="div">
              <Flex vertical gap={14}>
                {subTitle(`Add a ${dashNoun}`)}

                {/* Module Select */}
                <Form.Item label="Module" style={{ marginBottom: 0 }}>
                  <Select
                    value={df.module || undefined}
                    onChange={(v) => setDashForm({ ...df, module: v, fields: [] })}
                    options={modulesList.map(m => ({ value: m.id, label: m.label }))}
                    placeholder="Choose a module…"
                    aria-label="Module"
                  />
                </Form.Item>

                {/* Title Input */}
                <Form.Item
                  label="Label name"
                  extra="Shown as the heading on the dashboard. Blank uses the module name."
                  style={{ marginBottom: 0 }}
                >
                  <Input
                    placeholder={fm ? fm.label : 'e.g. Trips this week'}
                    value={df.title || ''}
                    onChange={(e) => setDashForm({ ...df, title: e.target.value.slice(0, 60) })}
                  />
                </Form.Item>

                {/* Chart Type Select (Only for Chart view) */}
                {dt === 'charts' && (
                  <Form.Item label="Chart view type" style={{ marginBottom: 0 }}>
                    <Row gutter={[8, 8]}>
                      {CHART_TYPES.map((ct) => {
                        const Icon = ct.icon;
                        const isSelected = (df.chartType || 'bar') === ct.value;
                        return (
                          <Col key={ct.value} span={12}>
                            <Button
                              block
                              type={isSelected ? 'primary' : 'default'}
                              ghost={isSelected}
                              icon={<Icon size={16} strokeWidth={isSelected ? 2.5 : 2} />}
                              onClick={() => setDashForm({ ...df, chartType: ct.value })}
                              style={{ justifyContent: 'flex-start' }}
                            >
                              {ct.label}
                            </Button>
                          </Col>
                        );
                      })}
                    </Row>
                  </Form.Item>
                )}

                {/* Headings Selection */}
                <Flex vertical gap={8}>
                  <Flex justify="space-between" align="baseline" gap={8} wrap>
                    <Typography.Text strong>Headings</Typography.Text>
                    {fm && (
                      <Space size={4} align="baseline">
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {df.fields.length} of {fm.cols.length} selected
                        </Typography.Text>
                        <Button type="link" size="small" onClick={() => setDashForm({ ...df, fields: [...fm.cols] })}>
                          All
                        </Button>
                        <Button type="text" size="small" onClick={() => setDashForm({ ...df, fields: [] })}>
                          None
                        </Button>
                      </Space>
                    )}
                  </Flex>

                  {!fm && (
                    <Card size="small" style={{ borderStyle: 'dashed' }}>
                      <Typography.Text type="secondary">Choose a module to see its headings.</Typography.Text>
                    </Card>
                  )}

                  {fm && (
                    <Flex wrap gap={8}>
                      {fm.cols.map(h => {
                        const on = (df.fields || []).includes(h);
                        return (
                          <Tag.CheckableTag
                            key={h}
                            checked={on}
                            onChange={() => {
                              const cur = df.fields || [];
                              const next = cur.includes(h) ? cur.filter(x => x !== h) : [...cur, h];
                              setDashForm({ ...df, fields: next });
                            }}
                          >
                            {on && '✓ '}
                            {h}
                          </Tag.CheckableTag>
                        );
                      })}
                    </Flex>
                  )}

                  {dashFormErr && <Typography.Text type="danger" strong>{dashFormErr}</Typography.Text>}
                </Flex>

                {/* Add Button */}
                <Button type="primary" block onClick={handleAddDashItem}>
                  Add to dashboard
                </Button>
              </Flex>
            </Form>
          </Col>

          {/* On the Dashboard Column */}
          <Col xs={24} lg={16} style={{ padding: 18 }}>
            <Flex vertical gap={14}>
              <div>
                {subTitle(`On the dashboard (${dtItems.length})`)}
                <Typography.Text type="secondary">Shown in this order. Changes apply immediately.</Typography.Text>
              </div>

              {dtItems.length === 0 && (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`Nothing here yet. Add a ${dashNoun} with the form.`} />
              )}

              <Row gutter={[14, 14]}>
                {dtItems.map((w, i) => {
                  const itemLabel = w.title || (w.module ? modById[w.module]?.label : w.src) || w.uid;
                  return (
                    <Col key={w.uid || i} xs={24} sm={12} xxl={8}>
                      <Card
                        size="small"
                        style={{ height: '100%' }}
                        actions={[
                          <Tooltip key="left" title="Move left">
                            <Button type="text" size="small" aria-label="Move left" disabled={i === 0} onClick={() => moveDashItem(w.uid, -1)}>
                              &larr;
                            </Button>
                          </Tooltip>,
                          <Tooltip key="right" title="Move right">
                            <Button type="text" size="small" aria-label="Move right" disabled={i === dtItems.length - 1} onClick={() => moveDashItem(w.uid, 1)}>
                              &rarr;
                            </Button>
                          </Tooltip>,
                          <Button key="remove" type="text" size="small" danger onClick={() => removeDashItem(w.uid)}>
                            Remove
                          </Button>,
                        ]}
                      >
                        <Flex vertical gap={6}>
                          {/* Brand accent bar */}
                          <span style={{ display: 'block', height: 4, width: 36, borderRadius: 2, background: 'var(--color-brand)' }} />
                          <Typography.Text strong style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                            {itemLabel}
                          </Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {w.fields ? `${w.fields.length} headings` : 'Standard metric'}
                          </Typography.Text>
                          {dt === 'charts' && (
                            <Flex vertical gap={4} style={{ marginTop: 8 }}>
                              <Typography.Text type="secondary" strong style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                Chart View
                              </Typography.Text>
                              <Segmented
                                block
                                size="small"
                                value={w.chartType || 'bar'}
                                onChange={v => handleUpdateChartType(w.uid, v)}
                                options={CHART_TYPES.map(ct => {
                                  const Icon = ct.icon;
                                  const isActive = (w.chartType || 'bar') === ct.value;
                                  return {
                                    value: ct.value,
                                    label: (
                                      <Tooltip title={ct.label}>
                                        <Flex align="center" justify="center" style={{ height: 24 }} aria-label={ct.label}>
                                          <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                                        </Flex>
                                      </Tooltip>
                                    ),
                                  };
                                })}
                              />
                            </Flex>
                          )}
                        </Flex>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Flex>
          </Col>
        </Row>
      </Card>

      {/* Thresholds & Security Sections */}
      <Row gutter={[24, 24]} align="top">
        {/* Validation Thresholds */}
        <Col xs={24} lg={12}>
          <Card title={sectionTitle('Validation thresholds', 'Applied to every trip at close.')}>
            <Form layout="vertical" component="div">
              <Form.Item label="Distance variance flag (%)" extra="Fixed vs GPS vs odometer. Trips above this are flagged.">
                <Input type="number" value={st.variance || '5'} onChange={(e) => setSt({ ...st, variance: e.target.value })} />
              </Form.Item>
              <Form.Item label="Default safe radius (m)" extra="Loading and unloading locations. Per-location override in Loading Locations.">
                <Input type="number" value={st.radius || '100'} onChange={(e) => setSt({ ...st, radius: e.target.value })} />
              </Form.Item>
              <Form.Item label="Long open trip alert (h)" extra="Hours beyond route duration before an alert is raised.">
                <Input type="number" value={st.longOpen || '8'} onChange={(e) => setSt({ ...st, longOpen: e.target.value })} />
              </Form.Item>
              <Form.Item label="Idle detection (min)">
                <Input type="number" value={st.idle || '15'} onChange={(e) => setSt({ ...st, idle: e.target.value })} />
              </Form.Item>
              <Form.Item label="GPS failure after (min)" extra="No fix for this long switches distance source to odometer." style={{ marginBottom: 0 }}>
                <Input type="number" value={st.gpsFail || '30'} onChange={(e) => setSt({ ...st, gpsFail: e.target.value })} />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Non-business trip purposes */}
        <Col xs={24} lg={12}>
          <Card title={sectionTitle('Non-business trips', 'Purposes a supervisor may pick when the trip is not billable.')}>
            <Form layout="vertical" component="div">
              <Form.Item
                label="Non-business reasons"
                extra="Comma separated. Shown to supervisors when trip type is Non-Business."
                style={{ marginBottom: 0 }}
              >
                <Input value={st.reasons || ''} onChange={(e) => setSt({ ...st, reasons: e.target.value })} />
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* Footer Save & Reset Buttons */}
      <Flex gap={8} justify="flex-end" wrap>
        <Button type="text" onClick={handleResetSettings}>
          Reset
        </Button>
        <Button type="primary" onClick={handleSaveSettings}>
          Save settings
        </Button>
      </Flex>
    </Flex>
  );
};

export default Settings;
