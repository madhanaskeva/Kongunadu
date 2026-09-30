import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Edit3, FileText, MapPin, Phone, Plus, UserCheck, Pencil, Trash2, Search } from 'lucide-react';
import { Avatar, Button, Card, Col, Empty, Flex, Input, Row, Space, Statistic, Table, Tag, Tooltip, Typography } from 'antd';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { ENROUTE_LABEL_LOWER } from '../../../utils/tripStatus';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { matchesSearch } from '../../../utils/search';
import { useDebounce } from '../../../utils/debounce';

// Seed rows merged with admin additions/edits (same rule as MasterManager)
const mergeEdits = (edits, seed) => {
  // Seed lists from T() already include saved adds; only overlay edits here.
  const ed = (edits || {}).edited || {};
  return seed.map(r => (ed[r.id] ? { ...r, ...ed[r.id] } : r));
};

// Status → antd Tag preset colour (green / amber / grey).
const badgeTone = v =>
  /Active/.test(v)
    ? 'success'
    : /hold|review/i.test(v)
    ? 'warning'
    : 'default';

export const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { T, masterEdits, deleted, setDeleted, setDrawer, setForm, setFormError, setConfirm, showToast } = useTMSAdmin();
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);
  const { can } = useModuleAccess();
  const tms = T();

  const clientEdits = (masterEdits || {}).clients;
  const customerEdits = (masterEdits || {}).customers;
  const delList = deleted || [];
  const client = mergeEdits(clientEdits, tms.clients || []).find(c => c.id === id);
  const customers = mergeEdits(customerEdits, tms.customers || []).filter(u => u.client === id && !delList.includes(u.id));
  const routeName = rid => (tms.R[rid] || {}).name || rid || '—';
  const rows = customers.filter(u => matchesSearch(debouncedQ, u.name, u.city, routeName(u.route), u.billing, u.status));
  // Table paging: jump back to page 1 when the client or the search changes.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => { setPage(1); }, [id, debouncedQ]);

  if (!client || deleted.includes(id)) {
    return (
      <Card>
        <Empty
          description={
            <Flex vertical gap={4}>
              <Typography.Title level={4} style={{ margin: 0 }}>Client not found</Typography.Title>
              <Typography.Text type="secondary">It may have been deleted. Go back to the client list.</Typography.Text>
            </Flex>
          }
        >
          <Button type="primary" onClick={() => navigate('/admin/masters/clients')}>Back to clients</Button>
        </Empty>
      </Card>
    );
  }

  const vehicles = (tms.vehicles || []).filter(v => (v.clients || []).includes(id));
  const trips = (tms.trips || []).filter(t => t.client === id);
  const supervisors = (tms.supervisors || []).filter(s =>
    (s.clientIds || []).includes(id) ||
    (client.supervisorIds || []).includes(s.id) ||
    (s.clients && typeof s.clients === 'string' && s.clients.toLowerCase().includes(client.name.toLowerCase())) ||
    (client.supervisors && typeof client.supervisors === 'string' && client.supervisors.toLowerCase().includes(s.name.toLowerCase()))
  );
  const activeCust = customers.filter(u => u.status === 'Active').length;

  const branchOpts = (tms.branches || []).map(b => ({ value: b.id, label: b.name }));
  const getSupervisorOptions = (selectedBranch) => {
    const sups = (tms.supervisors || []).filter(s => s.status !== 'Inactive' && s.status !== 'Suspended');
    const sorted = [...sups].sort((a, b) => {
      if (selectedBranch) {
        if (a.branch === selectedBranch && b.branch !== selectedBranch) return -1;
        if (a.branch !== selectedBranch && b.branch === selectedBranch) return 1;
      }
      return (a.name || '').localeCompare(b.name || '');
    });
    return sorted.map(s => {
      const bName = (tms.B[s.branch] || {}).name || s.branch;
      const isPrimary = selectedBranch && s.branch === selectedBranch;
      return {
        value: s.id,
        label: `${s.name} (${bName}${isPrimary ? ' · Primary' : ''})`,
      };
    });
  };

  const openEditClientForm = () => {
    const initialSupervisors = supervisors.map(s => s.id);
    setDrawer({
      isForm: true,
      isMaster: true,
      masterKey: 'clients',
      kicker: 'Edit client',
      title: client.name,
      saveLabel: 'Save changes',
      required: ['name', 'gst', 'branch', 'phone', 'supervisors', 'status'],
      fields: [
        ['name', 'Client name', null, 'e.g. Linde India or INOX Air Products'],
        ['gst', 'GSTIN', null, '33AAACL0123M1Z2', { clean: 'gstin', hint: '15-character GST identification number' }],
        ['branch', 'Branch', branchOpts],
        ['phone', 'Client phone number', null, '98410 11220', { clean: 'phone', prefix: '+91', hint: 'Primary contact or dispatch phone' }],
        ['contact', 'Contact person / desk', null, 'e.g. Cryogenic desk, Sriperumbudur'],
        ['supervisors', 'Supervisor assignment', 'checkbox-select', 'Select supervisors', {
          options: (f) => getSupervisorOptions(f?.branch),
          itemNoun: 'supervisor',
          searchPlaceholder: 'Search supervisors...',
        }],
        ['status', 'Status', ['Active', 'On hold']],
      ],
      validate: (f) => {
        const errs = {};
        const dg = x => String(x || '').replace(/\D/g, '');
        const norm = s => String(s || '').trim().toLowerCase();
        const cleanGst = s => String(s || '').replace(/[\s-]/g, '').toUpperCase();
        const others = (tms.clients || []).filter(c => c.id !== client.id && !delList.includes(c.id));

        if (!f.name || !String(f.name).trim()) {
          errs.name = 'Enter the client name.';
        } else if (others.some(c => norm(c.name) === norm(f.name))) {
          errs.name = 'Client name already exists.';
        }

        const rawGst = cleanGst(f.gst);
        if (!rawGst) {
          errs.gst = 'Enter the GSTIN.';
        } else if (rawGst.length !== 15) {
          errs.gst = 'GSTIN must be 15 characters.';
        } else if (others.some(c => cleanGst(c.gst) === rawGst)) {
          errs.gst = 'GSTIN already exists.';
        }

        if (!f.branch) errs.branch = 'Select a branch for this client.';
        if (!f.phone || dg(f.phone).length !== 10) errs.phone = 'Enter a 10-digit mobile number.';

        const sups = Array.isArray(f.supervisors) ? f.supervisors : String(f.supervisors || '').split(',').map(s => s.trim()).filter(Boolean);
        if (!sups || sups.length === 0) errs.supervisors = 'Select at least one supervisor.';

        if (!f.status) errs.status = 'Select the status.';

        return errs;
      },
    });
    setForm({
      ...client,
      supervisors: initialSupervisors,
      phone: client.phone ? String(client.phone).replace(/\D/g, '').slice(-10) : '',
    });
    setFormError('');
  };

  const customerFields = [
    ['name', 'Customer name', null, 'e.g. Apollo Hospitals LMO Bank – Chennai'],
    ['city', 'City'],
    ['route', 'Route', (tms.routes || []).map(r => ({ value: r.id, label: r.name }))],
    ['billing', 'Billing rule', ['Per trip', 'Per km']],
    ['status', 'Status', ['Active', 'Inactive']],
  ];

  const openCustomerForm = rec => {
    setDrawer({
      isForm: true,
      isMaster: true,
      masterKey: 'customers',
      kicker: rec ? 'Edit customer' : `New customer · ${client.name}`,
      title: rec ? rec.name : 'Add customer',
      saveLabel: rec ? 'Save changes' : 'Create customer',
      required: ['name', 'city'],
      fields: customerFields,
    });
    setForm(rec ? { ...rec } : { client: id, billing: 'Per trip', status: 'Active' });
    setFormError('');
  };

  const deleteCustomer = rec =>
    setConfirm({
      title: `Delete ${rec.name}?`,
      body: 'Historic trips keep their data. Supervisors will no longer see this customer when unloading.',
      okLabel: 'Delete',
      danger: true,
      onOk: () => {
        setDeleted([...deleted, rec.id]);
        setConfirm(null);
        showToast('danger', 'Customer deleted', `${rec.name} removed from ${client.name}.`);
      },
    });

  const initials = String(client.name || '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const facts = [
    [FileText, 'GSTIN', client.gst],
    [Building2, 'Branch', (tms.B[client.branch] || {}).name],
    [Phone, 'Phone', client.phone ? (String(client.phone).startsWith('+91') ? client.phone : `+91 ${client.phone}`) : '—'],
    [UserCheck, 'Contact person', client.contact || '—'],
    [MapPin, 'Supervisors', supervisors.map(s => s.name).join(', ') || 'None mapped'],
  ];

  const stats = [
    ['Customers', customers.length, `${activeCust} active`],
    ['Vehicles mapped', vehicles.length, vehicles.slice(0, 2).map(v => v.number).join(', ') || 'None'],
    ['Trips', trips.length, `${trips.filter(t => t.status === 'Enroute').length} ${ENROUTE_LABEL_LOWER} now`],
  ];

  const nowrap = { whiteSpace: 'nowrap' };
  const customerColumns = [
    { title: 'Customer', dataIndex: 'name', key: 'name', render: v => <Typography.Text strong>{v}</Typography.Text> },
    { title: 'City', dataIndex: 'city', key: 'city', onCell: () => ({ style: nowrap }), render: v => v || '—' },
    { title: 'Route', dataIndex: 'route', key: 'route', onCell: () => ({ style: nowrap }), render: v => routeName(v) },
    { title: 'Billing', dataIndex: 'billing', key: 'billing', onCell: () => ({ style: nowrap }), render: v => v || '—' },
    { title: 'Status', dataIndex: 'status', key: 'status', onCell: () => ({ style: nowrap }), render: v => <Tag color={badgeTone(v)}>{v || '—'}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      onCell: () => ({ style: nowrap }),
      render: (_, u) => (
        <Space size={8} onClick={e => e.stopPropagation()} aria-label={`Actions for ${u.name}`}>
          {can('clients', 'edit') && (
            <Tooltip title="Edit customer">
              <Button type="text" size="small" className="tms-row-action" icon={<Pencil size={16} strokeWidth={2} />} aria-label="Edit customer" onClick={() => openCustomerForm(u)} />
            </Tooltip>
          )}
          {can('clients', 'delete') && (
            <Tooltip title="Delete customer">
              <Button type="text" size="small" className="tms-row-action" danger icon={<Trash2 size={16} strokeWidth={2} />} aria-label="Delete customer" onClick={() => deleteCustomer(u)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Flex vertical gap={20}>
      <Flex>
        <Button type="link" icon={<ArrowLeft size={16} />} onClick={() => navigate('/admin/masters/clients')} style={{ paddingInline: 0, fontWeight: 700 }}>
          All clients
        </Button>
      </Flex>

      {/* Profile card — brand accent strip on top */}
      <Card style={{ borderTop: '4px solid var(--color-brand)' }}>
        <Flex vertical gap={18}>
          <Flex align="center" gap={16} wrap>
            <Avatar shape="square" size={56} style={{ background: 'var(--color-brand-soft)', color: 'var(--color-brand)', fontWeight: 800, fontSize: 20 }}>
              {initials}
            </Avatar>
            <Flex justify="space-between" align="flex-start" wrap gap={10} style={{ flex: 1, minWidth: 0 }}>
              <div>
                <Flex align="center" gap={10} wrap>
                  <Typography.Title level={3} style={{ margin: 0 }}>{client.name}</Typography.Title>
                  <Tag color={badgeTone(client.status)}>{client.status || '—'}</Tag>
                </Flex>
                <Typography.Text type="secondary">Client ID {client.id}</Typography.Text>
              </div>
              {can('clients', 'edit') && (
                <Button icon={<Edit3 size={15} />} onClick={openEditClientForm}>
                  Edit client
                </Button>
              )}
            </Flex>
          </Flex>

          <Row gutter={[14, 14]}>
            {facts.map(([Icon, label, value]) => (
              <Col key={label} xs={24} sm={12} lg={8}>
                <Flex gap={10} align="flex-start">
                  <Icon size={18} color="var(--kr-grey-700)" style={{ flex: 'none', marginTop: 2 }} />
                  <Flex vertical style={{ minWidth: 0 }}>
                    <Typography.Text type="secondary" strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</Typography.Text>
                    <Typography.Text strong>{value || '—'}</Typography.Text>
                  </Flex>
                </Flex>
              </Col>
            ))}
          </Row>

          <Row gutter={[12, 12]}>
            {stats.map(([label, value, sub]) => (
              <Col key={label} xs={24} sm={12} lg={8}>
                <Card size="small" variant="borderless" style={{ background: 'var(--color-brand-tint)' }}>
                  <Statistic title={label} value={value} />
                  <Typography.Text type="secondary" ellipsis={{ tooltip: sub }} style={{ fontSize: 12 }}>{sub}</Typography.Text>
                </Card>
              </Col>
            ))}
          </Row>
        </Flex>
      </Card>

      {/* Supervisors section */}
      <Card>
        <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 14 }}>
          <div>
            <Typography.Title level={5} style={{ margin: 0, textTransform: 'uppercase' }}>
              Assigned Supervisors · {supervisors.length}
            </Typography.Title>
            <Typography.Text type="secondary">
              Branch supervisors authorized to manage, open, and close trips for {client.name}.
            </Typography.Text>
          </div>
          {can('clients', 'edit') && (
            <Button icon={<UserCheck size={15} />} onClick={openEditClientForm}>
              Reassign supervisors
            </Button>
          )}
        </Flex>

        {supervisors.length > 0 ? (
          <Row gutter={[12, 12]}>
            {supervisors.map(s => (
              <Col key={s.id} xs={24} md={12} xl={8}>
                <Card size="small">
                  <Flex align="center" gap={12}>
                    <Avatar size={38} style={{ background: 'var(--color-brand-soft)', color: 'var(--color-brand)', fontWeight: 700, flexShrink: 0 }}>
                      {s.name ? s.name.charAt(0) : 'S'}
                    </Avatar>
                    <Flex vertical style={{ flex: 1, minWidth: 0 }}>
                      <Typography.Text strong>{s.name}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {(tms.B[s.branch] || {}).name || s.branch} {s.phone ? `· +91 ${s.phone}` : ''}
                      </Typography.Text>
                    </Flex>
                    <Tag color={badgeTone(s.status)}>{s.status || '—'}</Tag>
                  </Flex>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={`No supervisors currently assigned to ${client.name}. Reassign to grant supervisors trip access.`}
          >
            {can('clients', 'edit') && (
              <Button type="primary" icon={<UserCheck size={15} />} onClick={openEditClientForm}>
                Assign supervisors
              </Button>
            )}
          </Empty>
        )}
      </Card>

      {/* Customers table */}
      <Card styles={{ body: { padding: 0 } }}>
        <Flex justify="space-between" align="center" gap={12} wrap style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-default)' }}>
          <Flex gap={12} align="center" wrap>
            <Typography.Title level={5} style={{ margin: 0, textTransform: 'uppercase' }}>
              Customers · {customers.length}
            </Typography.Title>
            <Input
              className="tms-search"
              prefix={<Search size={16} strokeWidth={2} />}
              allowClear
              placeholder="Search customer or city"
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{ width: 240, maxWidth: '100%' }}
            />
          </Flex>
          {can('clients', 'add') && (
            <Button icon={<Plus size={16} />} onClick={() => openCustomerForm(null)}>
              Add customer
            </Button>
          )}
        </Flex>

        <Table
          columns={customerColumns}
          dataSource={rows}
          rowKey="id"
          tableLayout="auto"
          scroll={{ x: 760 }}
          pagination={{
            current: page,
            pageSize,
            onChange: (p, size) => {
              if (size !== pageSize) { setPageSize(size); setPage(1); } else setPage(p);
            },
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (total, [from, to]) => `Showing ${from} to ${to} of ${total} customers`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Flex vertical gap={4}>
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      {customers.length ? 'No customers match' : 'No customers yet'}
                    </Typography.Title>
                    <Typography.Text type="secondary">
                      {customers.length
                        ? `Nothing matches “${q}”.`
                        : `Add the delivery points for ${client.name}. Supervisors pick from this list when unloading.`}
                    </Typography.Text>
                  </Flex>
                }
              >
                {!customers.length && can('clients', 'add') && (
                  <Button type="primary" icon={<Plus size={16} />} onClick={() => openCustomerForm(null)}>
                    Add customer
                  </Button>
                )}
              </Empty>
            ),
          }}
        />
      </Card>
    </Flex>
  );
};

export default ClientProfile;
