import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  Form,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { TabButtons } from '../../../components/common/TabButtons';
import { supervisorSeats } from '../../../utils/crewCombo';

export const DeviceApprovals = () => {
  const {
    devReqs,
    devFilter,
    setDevFilter,
    readReqs,
    writeReqs,
    showToast,
    fmtPhone,
    fmtImei,
    stampNow,
    T,
    saveMaster,
  } = useTMSAdmin();

  const devCounts = {
    all: devReqs.length,
    Pending: devReqs.filter(r => r.status === 'Pending').length,
    Approved: devReqs.filter(r => r.status === 'Approved').length,
    done: devReqs.filter(r => ['Verified', 'Registered'].includes(r.status)).length,
    Rejected: devReqs.filter(r => r.status === 'Rejected').length,
  };

  const devTiles = [
    { label: 'Waiting for approval', value: devCounts.Pending, edge: 'var(--kr-saffron-500)' },
    { label: 'Approved · OTP shared', value: devCounts.Approved, edge: 'var(--color-brand)' },
    { label: 'Verified / registered', value: devCounts.done, edge: 'var(--st-enroute-edge)' },
    { label: 'Rejected', value: devCounts.Rejected, edge: 'var(--kr-red-600)' },
  ];

  const devFilters = [
    { id: 'all', label: `All (${devCounts.all})` },
    { id: 'Pending', label: `Pending (${devCounts.Pending})` },
    { id: 'Approved', label: `Approved (${devCounts.Approved})` },
    { id: 'Rejected', label: `Rejected (${devCounts.Rejected})` },
  ];

  const devShown = devReqs.filter(r => devFilter === 'all' || r.status === devFilter);
  // Table pagination; back to page 1 whenever the filter or page size changes.
  const [devPage, setDevPage] = useState(1);
  const [devPageSize, setDevPageSize] = useState(10);
  useEffect(() => { setDevPage(1); }, [devFilter, devPageSize]);

  const statusTone = {
    Pending: 'warning',
    Approved: 'success',
    Verified: 'processing',
    Registered: 'success',
    Rejected: 'error',
  };

  const newOtp = () => String(1000 + Math.floor(Math.random() * 9000));

  // Approved phone → supervisor record (matched by mobile number, so re-approving a phone never duplicates)
  const findSupervisor = (r) => {
    const digits = String(r.phone || '').replace(/\D/g, '');
    return (T().supervisors || []).find(sv => String(sv.phone || '').replace(/\D/g, '') === digits);
  };

  const addToSupervisorMaster = (r, branch) => {
    const digits = String(r.phone || '').replace(/\D/g, '');
    const existing = findSupervisor(r);
    if (existing) {
      saveMaster('supervisors', { ...existing, branch, status: 'Active', deviceImei: r.imei }, false);
      return existing.name;
    }
    const name = (r.name || '').trim() || `Supervisor ${fmtPhone(digits)}`;
    saveMaster('supervisors', {
      id: 'SU' + r.id,
      name,
      phone: fmtPhone(digits),
      branch,
      clients: '',
      clientIds: [],
      status: 'Active',
      lastLogin: 'Never',
      deviceImei: r.imei,
      joinedVia: 'App request',
    }, true);
    return name;
  };

  // Approve dialog: Head Office assigns the supervisor's branch before the OTP is issued
  const [approving, setApproving] = useState(null);
  const [approveBranch, setApproveBranch] = useState('');
  const [approveErr, setApproveErr] = useState('');
  const allBranches = T().branches || [];
  const branchOpts = allBranches.length ? allBranches : [];
  // A branch takes only as many supervisors as its "Number of supervisors" in Branch Master.
  const approveBranchOpts = () => (branchOpts.length ? branchOpts : (T().branches || []));
  const seatsUsed = (b, excludeId) => (T().supervisors || [])
    .filter(sv => sv.id !== excludeId && (sv.branch === b.id || sv.branch === b.name)).length;
  // The phone's own supervisor record (if any) keeps its seat in its current branch.
  const branchFull = (b, r) => {
    const own = r && findSupervisor(r);
    if (own && (own.branch === b.id || own.branch === b.name)) return false;
    return seatsUsed(b, own && own.id) >= supervisorSeats(b);
  };

  const openApprove = (r) => {
    const existing = findSupervisor(r);
    setApproving(r);
    const pre = r.branchId || (existing && existing.branch) || '';
    const curBranches = approveBranchOpts();
    const matched = curBranches.find(b => (b.id === pre || b.name === pre) && !branchFull(b, r));
    const firstOpen = curBranches.find(b => !branchFull(b, r));
    setApproveBranch(matched ? matched.id : (firstOpen ? firstOpen.id : ''));
    setApproveErr('');
  };

  const confirmApprove = () => {
    if (!approveBranch) {
      setApproveErr('Choose the branch this supervisor works at.');
      return;
    }
    const b = approveBranchOpts().find(x => x.id === approveBranch);
    if (b && branchFull(b, approving)) {
      const limit = supervisorSeats(b);
      setApproveErr(`${b.name} allows ${limit} supervisor${limit === 1 ? '' : 's'} and is full. Raise "Number of supervisors" in Branch Master or choose another branch.`);
      return;
    }
    approveDevice(approving.id, approveBranch);
    setApproving(null);
  };

  const approveDevice = (id, branchId) => {
    const otp = newOtp();
    const list = readReqs();
    const r = list.find(x => x.id === id);
    const branchName = (T().B[branchId] || {}).name || '';
    const updated = list.map(x => (x.id === id ? { ...x, status: 'Approved', otp, branchId, branch: branchName, decidedAt: stampNow() } : x));
    writeReqs(updated);
    setDevFilter('all');
    const added = r ? addToSupervisorMaster(r, branchId) : null;
    showToast(
      'success',
      `Approved · OTP ${otp}`,
      `Share this code with +91 ${fmtPhone(r && r.phone)}.${added ? ` ${added} is now a ${branchName} supervisor.` : ''}`
    );
  };

  const rejectDevice = (id) => {
    const list = readReqs();
    const r = list.find(x => x.id === id);
    const updated = list.map(x => (x.id === id ? { ...x, status: 'Rejected', otp: '', decidedAt: stampNow() } : x));
    writeReqs(updated);
    setDevFilter('all');
    showToast('warning', 'Request rejected', `+91 ${fmtPhone(r && r.phone)} can request again from the app.`);
  };

  const regenOtp = (id) => {
    const otp = newOtp();
    const list = readReqs();
    const updated = list.map(x => (x.id === id ? { ...x, otp } : x));
    writeReqs(updated);
    showToast('info', `New OTP ${otp}`, 'The previous code no longer works.');
  };

  const nowrap = { whiteSpace: 'nowrap' };
  const devColumns = [
    {
      title: 'Mobile number',
      key: 'phone',
      onCell: () => ({ style: nowrap }),
      render: (_, r) => (
        <Flex vertical>
          <Typography.Text strong>+91 {fmtPhone(r.phone)}</Typography.Text>
          <Typography.Text strong>{r.name || 'Supervisor · not registered yet'}</Typography.Text>
        </Flex>
      ),
    },
    {
      title: 'IMEI',
      key: 'imei',
      onCell: () => ({ style: nowrap }),
      render: (_, r) => <Typography.Text code>{fmtImei(r.imei)}</Typography.Text>,
    },
    {
      title: 'Device',
      key: 'device',
      onCell: () => ({ style: nowrap }),
      render: (_, r) => (
        <Flex vertical>
          <Typography.Text>{r.device || 'Android phone'}</Typography.Text>
          <Typography.Text type={r.branch ? 'secondary' : 'warning'} style={{ fontSize: 12 }}>
            {r.branch || 'Branch assigned on approval'}
          </Typography.Text>
        </Flex>
      ),
    },
    { title: 'Requested', dataIndex: 'requestedAt', key: 'requestedAt', onCell: () => ({ style: nowrap }), render: v => <Typography.Text type="secondary">{v}</Typography.Text> },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: v => <Tag color={statusTone[v] || 'default'}>{v}</Tag>,
    },
    {
      title: 'OTP',
      key: 'otp',
      onCell: () => ({ style: nowrap }),
      render: (_, r) =>
        r.otp ? (
          <Typography.Text
            strong
            type={r.status === 'Approved' ? undefined : 'secondary'}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 20, letterSpacing: '0.2em' }}
          >
            {r.otp}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">&mdash;</Typography.Text>
        ),
    },
    {
      title: 'Action',
      key: 'action',
      onCell: () => ({ style: nowrap }),
      render: (_, r) => {
        const isPending = r.status === 'Pending';
        const isApproved = r.status === 'Approved';
        const isDone = !isPending && !isApproved;
        const doneText = r.status === 'Registered'
          ? `Registered ${r.registeredAt || ''}`
          : r.status === 'Verified'
          ? `OTP verified ${r.verifiedAt || ''}`
          : `Rejected ${r.decidedAt || ''}`;
        return (
          <>
            {isPending && (
              <Space size={6}>
                <Button type="primary" size="small" onClick={() => openApprove(r)}>
                  Approve
                </Button>
                <Button type="text" danger size="small" onClick={() => rejectDevice(r.id)}>
                  Reject
                </Button>
              </Space>
            )}
            {isApproved && (
              <Space size={10}>
                <Typography.Text type="secondary">Share with supervisor</Typography.Text>
                <Button size="small" onClick={() => regenOtp(r.id)}>
                  New OTP
                </Button>
              </Space>
            )}
            {isDone && <Typography.Text type="secondary">{doneText}</Typography.Text>}
          </>
        );
      },
    },
  ];

  return (
    <Flex vertical gap={20}>
      {/* 4 Summary Tiles */}
      <Row gutter={[16, 16]} className="tms-kpi-grid" style={{ '--kpi-min': '160px' }}>
        {devTiles.map((k, idx) => (
          <Col key={idx} xs={24} sm={12} lg={6}>
            {/* Accent colour marks each tile's status (see .tms-kpi). */}
            <Card size="small" className="tms-kpi" style={{ height: '100%', '--kpi': k.edge }}>
              <Statistic
                title={<span className="tms-kpi-label">{k.label}</span>}
                value={k.value}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main Table Card */}
      <Card styles={{ body: { padding: 0 } }}>
        <Flex justify="space-between" align="center" gap={12} wrap style={{ padding: '12px 18px' }}>
          <Typography.Text style={{ maxWidth: 640 }}>
            Supervisors request access from the mobile app. <Typography.Text strong>Approve</Typography.Text> to create a 4-digit OTP, then share it with the supervisor to finish registration.
          </Typography.Text>
          <TabButtons
            ariaLabel="Request status"
            value={devFilter}
            onChange={setDevFilter}
            items={devFilters.map(f => ({ value: f.id, label: f.label }))}
          />
        </Flex>

        <Table
          columns={devColumns}
          dataSource={devShown}
          rowKey="id"
          tableLayout="auto"
          scroll={{ x: 'max-content' }}
          // Pending requests keep their hazard-tinted row.
          onRow={r => (r.status === 'Pending' ? { style: { background: 'var(--color-hazard-soft)' } } : {})}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Flex vertical align="center" gap={6}>
                    <Typography.Text strong style={{ fontSize: 18 }}>
                      {devReqs.length ? 'Nothing in this view' : 'No approval requests yet'}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ maxWidth: 460 }}>
                      When a supervisor taps <strong>Request approval</strong> in the mobile app, the request appears here with their mobile number and the phone’s IMEI.
                    </Typography.Text>
                  </Flex>
                }
              />
            ),
          }}
          pagination={
            devShown.length > 0 && {
              current: devPage,
              pageSize: devPageSize,
              onChange: (p, size) => {
                if (size !== devPageSize) setDevPageSize(size);
                else setDevPage(p);
              },
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (total, [from, to]) => `Showing ${from} to ${to} of ${total} requests`,
            }
          }
        />
      </Card>

      <Modal
        open={!!approving}
        onCancel={() => setApproving(null)}
        title={
          <Flex vertical>
            <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Approve supervisor
            </Typography.Text>
            <span>{approving ? approving.name || `+91 ${fmtPhone(approving.phone)}` : ''}</span>
          </Flex>
        }
        width={460}
        footer={[
          <Button key="cancel" onClick={() => setApproving(null)}>
            Cancel
          </Button>,
          <Button key="ok" type="primary" onClick={confirmApprove}>
            Approve &amp; share OTP
          </Button>,
        ]}
      >
        {approving && (
          <Flex vertical gap={16}>
            <Descriptions
              size="small"
              column={1}
              bordered
              items={[
                ['Name', approving.name || 'Not given'],
                ['Mobile number', `+91 ${fmtPhone(approving.phone)}`],
                ['Device IMEI', fmtImei(approving.imei)],
                ['Requested', approving.requestedAt],
              ].map(([k, v]) => ({
                key: k,
                label: k,
                children: <Typography.Text strong code={k === 'Device IMEI'}>{v}</Typography.Text>,
              }))}
            />
            <Form layout="vertical" component="div">
              <Form.Item
                label="Assign branch"
                style={{ marginBottom: 0 }}
                validateStatus={approveErr ? 'error' : undefined}
                help={approveErr || 'The supervisor is added to Supervisor Master under this branch and only sees its trips.'}
              >
                <Select
                  value={approveBranch || undefined}
                  onChange={(v) => { setApproveBranch(v); setApproveErr(''); }}
                  options={approveBranchOpts().map(b => {
                    const full = branchFull(b, approving);
                    const own = approving && findSupervisor(approving);
                    return { value: b.id, label: `${b.name} (${seatsUsed(b, own && own.id)}/${supervisorSeats(b)}${full ? ' · full' : ''})`, disabled: full };
                  })}
                  placeholder="Select branch"
                  aria-label="Branch"
                />
              </Form.Item>
            </Form>
          </Flex>
        )}
      </Modal>
    </Flex>
  );
};

export default DeviceApprovals;
