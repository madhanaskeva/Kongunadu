import React, { useState } from 'react';
import { SelectField } from '../../../components/common/SelectField';
import { Modal } from '../../../components/common/Modal';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { Pagination, usePagination } from '../../../components/common/Pagination';

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
    { label: 'Verified / registered', value: devCounts.done, edge: 'var(--kr-grey-300)' },
    { label: 'Rejected', value: devCounts.Rejected, edge: 'var(--kr-red-600)' },
  ];

  const devFilters = [
    { id: 'all', label: `All (${devCounts.all})` },
    { id: 'Pending', label: `Pending (${devCounts.Pending})` },
    { id: 'Approved', label: `Approved (${devCounts.Approved})` },
    { id: 'done', label: `Registered (${devCounts.done})` },
    { id: 'Rejected', label: `Rejected (${devCounts.Rejected})` },
  ];

  const devShown = devReqs.filter(r =>
    devFilter === 'all'
      ? true
      : devFilter === 'done'
      ? ['Verified', 'Registered'].includes(r.status)
      : r.status === devFilter
  );
  const devPg = usePagination(devShown, [devFilter]);

  const statusTone = {
    Pending: ['var(--kr-saffron-100)', '#7A4300'],
    Approved: ['var(--kr-green-100)', 'var(--kr-green-800)'],
    Verified: ['var(--st-enroute-bg)', 'var(--st-enroute-fg)'],
    Registered: ['var(--kr-green-100)', 'var(--kr-green-800)'],
    Rejected: ['var(--kr-red-100)', 'var(--kr-red-800)'],
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
  const branchOpts = (T().branches || []).filter(b => b.status === 'Active');

  const openApprove = (r) => {
    const existing = findSupervisor(r);
    setApproving(r);
    setApproveBranch(r.branchId || (existing && existing.branch) || '');
    setApproveErr('');
  };

  const confirmApprove = () => {
    if (!approveBranch) {
      setApproveErr('Choose the branch this supervisor works at.');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 4 Summary Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px' }}>
        {devTiles.map((k, idx) => (
          <div
            key={idx}
            style={{
              background: '#fff',
              border: '1px solid var(--border-default)',
              borderTop: `4px solid ${k.edge}`,
              borderRadius: 'var(--radius-lg)',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {k.label}
            </div>
            <div style={{ marginTop: '6px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '28px', color: 'var(--text-heading)' }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <span style={{ fontSize: '14px', color: 'var(--text-body)', maxWidth: '640px' }}>
            Supervisors request access from the mobile app. <strong style={{ color: 'var(--text-heading)' }}>Approve</strong> to create a 4-digit OTP, then share it with the supervisor to finish registration.
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {devFilters.map(f => {
              const on = devFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setDevFilter(f.id)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: `1px solid ${on ? 'var(--color-brand)' : 'var(--border-strong)'}`,
                    background: on ? 'var(--color-brand)' : '#fff',
                    color: on ? '#fff' : 'var(--text-heading)',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '760px' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--surface-muted)' }}>
                {['Mobile number', 'IMEI', 'Device', 'Requested', 'Status', 'OTP', 'Action'].map((c, i) => (
                  <th
                    key={i}
                    style={{
                      padding: '10px 14px',
                      fontFamily: 'var(--font-display)',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devPg.rows.map(r => {
                const [bg, fg] = statusTone[r.status] || ['var(--kr-grey-100)', 'var(--kr-grey-700)'];
                const isPending = r.status === 'Pending';
                const isApproved = r.status === 'Approved';
                const isDone = !isPending && !isApproved;
                const doneText = r.status === 'Registered'
                  ? `Registered ${r.registeredAt || ''}`
                  : r.status === 'Verified'
                  ? `OTP verified ${r.verifiedAt || ''}`
                  : `Rejected ${r.decidedAt || ''}`;

                return (
                  <tr
                    key={r.id}
                    style={{
                      borderTop: '1px solid var(--border-default)',
                      background: isPending ? 'var(--color-hazard-soft)' : '#fff',
                    }}
                  >
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>+91 {fmtPhone(r.phone)}</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                        {r.name || 'Supervisor · not registered yet'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', color: 'var(--text-heading)' }}>
                      {fmtImei(r.imei)}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-body)', lineHeight: 1.35 }}>
                      {r.device || 'Android phone'}
                      <div style={{ fontSize: '12px', color: r.branch ? 'var(--text-muted)' : '#7A4300' }}>{r.branch || 'Branch assigned on approval'}</div>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{r.requestedAt}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          fontFamily: 'var(--font-display)',
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: bg,
                          color: fg,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      {r.otp ? (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, letterSpacing: '0.2em', color: isApproved ? 'var(--text-heading)' : 'var(--text-muted)' }}>
                          {r.otp}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      {isPending && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => openApprove(r)}
                            style={{
                              all: 'unset',
                              cursor: 'pointer',
                              padding: '7px 14px',
                              borderRadius: 'var(--radius-md)',
                              background: 'var(--color-brand)',
                              color: '#fff',
                              fontFamily: 'var(--font-display)',
                              fontSize: '13px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.02em',
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectDevice(r.id)}
                            style={{
                              all: 'unset',
                              cursor: 'pointer',
                              padding: '7px 12px',
                              borderRadius: 'var(--radius-md)',
                              color: 'var(--kr-red-700)',
                              fontSize: '13px',
                              fontWeight: 700,
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {isApproved && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Share with supervisor</span>
                          <button
                            onClick={() => regenOtp(r.id)}
                            style={{
                              all: 'unset',
                              cursor: 'pointer',
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-strong)',
                              fontSize: '13px',
                              fontWeight: 600,
                              color: 'var(--text-heading)',
                            }}
                          >
                            New OTP
                          </button>
                        </div>
                      )}
                      {isDone && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{doneText}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {devShown.length > 0 && <Pagination {...devPg} noun="requests" />}
        {devShown.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--text-heading)' }}>
              {devReqs.length ? 'Nothing in this view' : 'No approval requests yet'}
            </div>
            <p style={{ margin: '6px auto 0', maxWidth: '460px', color: 'var(--text-muted)', fontSize: '14px' }}>
              When a supervisor taps <strong>Request approval</strong> in the mobile app, the request appears here with their mobile number and the phone’s IMEI.
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!approving}
        onClose={() => setApproving(null)}
        subtitle="Approve supervisor"
        title={approving ? approving.name || `+91 ${fmtPhone(approving.phone)}` : ''}
        maxWidth="460px"
        footer={
          <>
            <button
              onClick={() => setApproving(null)}
              style={{ all: 'unset', cursor: 'pointer', height: '38px', padding: '0 16px', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)' }}
            >
              Cancel
            </button>
            <button
              onClick={confirmApprove}
              style={{ all: 'unset', cursor: 'pointer', height: '38px', padding: '0 18px', display: 'inline-flex', alignItems: 'center', borderRadius: 'var(--radius-md)', background: 'var(--color-brand)', color: '#fff', fontSize: '14px', fontWeight: 700 }}
            >
              Approve &amp; share OTP
            </button>
          </>
        }
      >
        {approving && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--surface-muted)', padding: '4px 14px' }}>
              {[
                ['Name', approving.name || 'Not given'],
                ['Mobile number', `+91 ${fmtPhone(approving.phone)}`],
                ['Device IMEI', fmtImei(approving.imei)],
                ['Requested', approving.requestedAt],
              ].map(([k, v], i) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderTop: i ? '1px solid var(--border-default)' : 'none', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-heading)', fontFamily: k === 'Device IMEI' ? 'var(--font-mono)' : 'inherit' }}>{v}</span>
                </div>
              ))}
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>Assign branch</span>
              <SelectField
                value={approveBranch}
                onChange={(v) => { setApproveBranch(v); setApproveErr(''); }}
                options={branchOpts.map(b => ({ value: b.id, label: b.name }))}
                placeholder="Select branch"
                error={approveErr ? ' ' : undefined}
                ariaLabel="Branch"
                height={40}
              />
              {approveErr ? (
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--kr-red-700)' }}>{approveErr}</span>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>The supervisor is added to Supervisor Master under this branch and only sees its trips.</span>
              )}
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DeviceApprovals;
