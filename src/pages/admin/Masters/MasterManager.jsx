import React, { useState } from 'react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';

export const MasterManager = ({ type }) => {
  const {
    T,
    masterEdits,
    deleted,
    setDeleted,
    approvals,
    setSeedApproval,
    drvReqs,
    driverApprovalFilter,
    setDriverApprovalFilter,
    decideDriver,
    setDrawer,
    setForm,
    setFormError,
    setConfirm,
    showToast,
    fmtPhone,
    fmtImei,
    vehTanks,
    setVehTank,
    saveMaster,
  } = useTMSAdmin();

  const [masterQ, setMasterQ] = useState('');
  const tms = T();
  const bn = id => (tms.B[id] || {}).name || '—';

  // Master definitions matching HTML prototype
  const mdata = (routeKey, seed) => {
    const e = masterEdits[routeKey] || {};
    const ed = e.edited || {};
    return [...(e.added || []), ...seed.map(r => ed[r.id] ? { ...r, ...ed[r.id] } : r)];
  };

  const branchOpts = (tms.branches || []).map(b => ({ value: b.id, label: b.name }));

  const statusBadge = (v) => ({
    v: v || '—',
    badge: true,
    text: false,
    bg: /Active|Approved/.test(v)
      ? 'var(--color-brand-soft)'
      : /Pending|hold|review/i.test(v)
      ? 'var(--color-hazard-soft)'
      : 'var(--kr-grey-100)',
    fg: /Active|Approved/.test(v)
      ? 'var(--kr-green-800)'
      : /Pending|hold|review/i.test(v)
      ? '#7A4300'
      : 'var(--kr-grey-700)',
  });

  const txtCell = (v, strong = false) => ({
    v: v == null ? '—' : String(v),
    text: true,
    badge: false,
    color: strong ? 'var(--text-heading)' : 'var(--text-body)',
    weight: strong ? 600 : 400,
  });

  const mastersConfig = {
    branches: {
      title: 'Branch Master',
      singular: 'branch',
      plural: 'branches',
      addLabel: 'Add branch',
      searchPh: 'Search branch or state',
      data: mdata('branches', tms.branches || []),
      cols: ['Code', 'Branch', 'State', 'Vehicles', 'Supervisors', 'Status'],
      cells: b => [
        txtCell(b.code, true),
        txtCell(b.name, true),
        txtCell(b.state),
        txtCell(b.vehicles),
        txtCell(b.supervisors),
        statusBadge(b.status),
      ],
      fields: [
        ['code', 'Branch code'],
        ['name', 'Branch name'],
        ['state', 'State'],
        ['status', 'Status', ['Active', 'Inactive']],
      ],
    },
    supervisors: {
      title: 'Supervisor Master',
      singular: 'supervisor',
      plural: 'supervisors',
      addLabel: 'Add supervisor',
      searchPh: 'Search name or phone',
      data: mdata('supervisors', tms.supervisors || []),
      cols: ['Name', 'Phone', 'Branch', 'Clients handled', 'Last login', 'Status'],
      cells: s => [
        txtCell(s.name, true),
        txtCell(s.phone),
        txtCell(bn(s.branch)),
        txtCell(s.clients),
        txtCell(s.lastLogin),
        statusBadge(s.status),
      ],
      fields: [
        ['name', 'Full name'],
        ['phone', 'Mobile number', null, '90031 55012', { clean: 'phone', prefix: '+91' }],
        ['branch', 'Branch', branchOpts],
        ['clients', 'Clients handled', null, 'Comma separated'],
        ['status', 'Status', ['Active', 'Suspended']],
      ],
    },
    vehicles: {
      title: 'Vehicle Master',
      singular: 'vehicle',
      plural: 'vehicles',
      addLabel: 'Add vehicle',
      searchPh: 'Search registration',
      data: mdata('vehicles', tms.vehicles || []).map(v => ({ ...v, tank: vehTanks[v.id] || v.tank })),
      cols: ['Registration', 'Type', 'Branch', 'Odometer', 'Tank', 'GPS', 'Status'],
      cells: v => [
        txtCell(v.number, true),
        txtCell(v.type),
        txtCell(bn(v.branch)),
        txtCell(Number(v.odometer || 0).toLocaleString('en-IN') + ' km'),
        txtCell(v.tank ? Number(v.tank).toLocaleString('en-IN') + ' L' : '—'),
        txtCell(v.gps),
        statusBadge(v.status === 'Idle' || v.status === 'Running' ? 'Active' : v.status),
      ],
      fields: [
        ['number', 'Registration number', null, 'TN 28 AQ 4521'],
        ['type', 'Vehicle type', ['Reefer container 20ft', 'Reefer trailer 32ft', 'Closed body 19ft', 'Closed body 24ft']],
        ['branch', 'Branch', branchOpts],
        ['odometer', 'Current odometer (km)'],
        ['tank', 'Tank capacity', null, 'e.g. 400', { suffix: 'L', clean: 'litres', hint: 'Diesel tank size. Supervisors cannot enter a fill larger than this.' }],
        ['status', 'Status', ['Idle', 'Running', 'Maintenance', 'Inactive']],
      ],
      validate: f => {
        const n = Number(f.tank);
        return {
          tank: !String(f.tank || '').trim()
            ? 'Enter the tank capacity.'
            : !(n >= 50 && n <= 1500)
            ? 'Enter a size between 50 and 1,500 L.'
            : undefined,
        };
      },
    },
    drivers: {
      title: 'Driver Master',
      singular: 'driver',
      plural: 'drivers',
      addLabel: 'Add driver',
      searchPh: 'Search name or licence',
      data: mdata('drivers', [
        ...drvReqs.map(r => ({
          id: r.id,
          name: r.name,
          licence: r.licence,
          phone: fmtPhone(r.phone),
          branch: r.branch,
          type: 'New',
          status: 'Active',
          approval: r.status === 'Pending' ? 'Pending approval' : r.status,
        })),
        ...(tms.drivers || []),
      ]),
      approval: true,
      cols: ['Name', 'Licence', 'Phone', 'Branch', 'Type', 'Approval', 'Status'],
      cells: d => {
        const ap = approvals[d.id] || d.approval || 'Approved';
        return [
          txtCell(d.name, true),
          txtCell(d.licence),
          txtCell(d.phone),
          txtCell(bn(d.branch)),
          txtCell(d.type),
          statusBadge(ap),
          statusBadge(ap === 'Approved' ? d.status : ap === 'Rejected' ? 'Inactive' : 'Pending'),
        ];
      },
      fields: [
        ['s1', 'Driver details', 'section'],
        ['name', 'Driver name', null, 'Full name as on licence'],
        ['licence', 'Licence number', null, 'TN28 2019 0004521', { clean: 'licence' }],
        ['phone', 'Mobile number', null, '90031 55012', { prefix: '+91', clean: 'phone' }],
        ['s2', 'Branch and status', 'section'],
        ['branch', 'Branch', branchOpts],
        ['type', 'Driver type', ['Regular', 'Supporting']],
        ['status', 'Status', ['Active', 'Inactive']],
        ['s3', 'Documents', 'section'],
        ['licImg', 'Licence image', 'upload', 'Front side'],
        ['aadhaarImg', 'Aadhaar image', 'upload', 'Front side · number visible'],
        ['s4', 'Bank details', 'section'],
        ['holder', 'Account holder name', null, 'As in bank passbook'],
        ['account', 'Account number', null, '9 to 18 digits', { clean: 'account' }],
        ['ifsc', 'IFSC code', null, 'SBIN0001234', { clean: 'ifsc', hint: '11 characters, printed on passbook.' }],
        ['s5', 'Family and reference', 'section'],
        ['family', 'Family contact number', null, 'Emergency contact', { prefix: '+91', clean: 'phone' }],
        ['reference', 'Reference', 'textarea', 'Who referred this driver', { max: 250, optional: true }],
      ],
      validate: (f, isNew) => {
        const dg = x => String(x || '').replace(/\D/g, '');
        const has = x => !!String(x || '').trim();
        const need = isNew;
        return {
          name: !has(f.name) ? 'Enter the name as on the licence.' : undefined,
          licence: String(f.licence || '').replace(/\s/g, '').length < 10 ? 'Enter the full licence number.' : undefined,
          phone: dg(f.phone).length !== 10 ? 'Enter a 10-digit mobile number.' : undefined,
          branch: !f.branch ? 'Choose the branch.' : undefined,
          licImg: need && !f.licImg ? 'Upload a clear photo of the driving licence.' : undefined,
          aadhaarImg: need && !f.aadhaarImg ? 'Upload a clear photo of the Aadhaar card.' : undefined,
          holder: need && !has(f.holder) ? 'Enter the account holder name.' : undefined,
          account: (need || has(f.account)) && !/^\d{9,18}$/.test(dg(f.account)) ? 'Enter a 9 to 18 digit account number.' : undefined,
          ifsc: (need || has(f.ifsc)) && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(f.ifsc || '') ? 'Enter a valid IFSC, e.g. SBIN0001234.' : undefined,
          family: (need || has(f.family)) && dg(f.family).length !== 10 ? 'Enter a 10-digit family contact number.' : has(f.family) && dg(f.family) === dg(f.phone) ? 'Use a family member’s number, not the driver’s.' : undefined,
        };
      },
    },
    clients: {
      title: 'Client Master',
      singular: 'client',
      plural: 'clients',
      addLabel: 'Add client',
      searchPh: 'Search client or GST',
      data: mdata('clients', tms.clients || []),
      cols: ['Client', 'GSTIN', 'Branch', 'Customers', 'Contact'],
      cells: c => [
        txtCell(c.name, true),
        txtCell(c.gst),
        txtCell(bn(c.branch)),
        txtCell(c.customers),
        txtCell(c.contact),
      ],
      fields: [
        ['name', 'Client name'],
        ['gst', 'GSTIN'],
        ['branch', 'Branch', branchOpts],
        ['contact', 'Contact'],
        ['status', 'Status', ['Active', 'On hold']],
      ],
    },
    locations: {
      title: 'Loading Location Master',
      singular: 'loading location',
      plural: 'loading locations',
      addLabel: 'Add location',
      searchPh: 'Search location',
      data: mdata('locations', tms.locations || []),
      cols: ['Location', 'Branch', 'Address', 'Safe radius', 'Coordinates'],
      cells: l => [
        txtCell(l.name, true),
        txtCell(bn(l.branch)),
        txtCell(l.address),
        txtCell(l.radius + ' m'),
        txtCell(l.lat + ', ' + l.lng),
      ],
      fields: [
        ['name', 'Location name'],
        ['branch', 'Branch', branchOpts],
        ['address', 'Address'],
        ['radius', 'Safe radius (m)', null, '100'],
        ['lat', 'Latitude'],
        ['lng', 'Longitude'],
        ['status', 'Status', ['Active', 'Inactive']],
      ],
    },
    routes: {
      title: 'Route Master',
      singular: 'route',
      plural: 'routes',
      addLabel: 'Add route',
      searchPh: 'Search route',
      data: mdata('routes', tms.routes || []),
      cols: ['Route', 'From', 'To', 'Fixed KM', 'Duration', 'Toll'],
      cells: r => [
        txtCell(r.name, true),
        txtCell((tms.L[r.from] || {}).name),
        txtCell(r.to),
        txtCell(r.km + ' km'),
        txtCell(r.hours + ' h'),
        txtCell(r.toll),
      ],
      fields: [
        ['from', 'Loading location', (tms.locations || []).map(l => ({ value: l.id, label: l.name }))],
        ['to', 'Destination'],
        ['km', 'Fixed distance (km)', null, 'Billing reference'],
        ['hours', 'Expected duration (h)'],
        ['toll', 'Toll estimate'],
        ['status', 'Status', ['Active', 'Under review']],
      ],
    },
  };

  const m = mastersConfig[type] || mastersConfig.branches;

  // Filter & Queue Logic
  const mq = masterQ.trim().toLowerCase();
  const queueSrc = [
    ...drvReqs.filter(r => r.status === 'Pending').map(r => ({ ...r, req: true })),
    ...(tms.drivers || []).filter(d => (approvals[d.id] || d.approval) === 'Pending approval').map(d => ({ ...d, req: false })),
  ];
  const initials = n => String(n || '').replace(/[^A-Za-z ]/g, ' ').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const drvQueue = queueSrc.map(d => ({
    id: d.id,
    name: d.name,
    initials: initials(d.name),
    tag: d.req ? 'New driver' : d.type,
    sub: d.req
      ? `${(tms.B[d.branch] || {}).name} · requested by ${d.supervisorName} · ${d.requestedAt}${d.vehicle ? ' · for ' + d.vehicle : ''}`
      : `${(tms.B[d.branch] || {}).name} · licence ${d.licence} · already in driver master`,
    docs: d.req ? [d.licImg && 'Licence', d.aadhaarImg && 'Aadhaar'].filter(Boolean).join(' + ') + ' attached' : '',
    hasDocs: !!d.req,
    review: () => setDrawer({ isDriverReq: true, reqId: d.id, kicker: d.req ? 'New driver request' : 'Pending driver', title: d.name }),
    approve: () => decideDriver(d.id, 'Approved'),
    reject: () => decideDriver(d.id, 'Rejected'),
  }));

  const rows = m.data.filter(r =>
    !deleted.includes(r.id) &&
    (!mq || Object.values(r).join(' ').toLowerCase().includes(mq)) &&
    (type !== 'drivers' || !driverApprovalFilter || (approvals[r.id] || r.approval || 'Approved') === driverApprovalFilter)
  );

  const handleNewRecord = () => {
    setDrawer({
      isForm: true,
      kicker: 'New ' + m.singular,
      title: m.addLabel,
      saveLabel: 'Create ' + m.singular,
      required: m.fields.filter(f => f[2] !== 'section').slice(0, 2).map(f => f[0]),
      fields: m.fields,
      validate: m.validate ? f => m.validate(f, true) : null,
    });
    setForm({});
    setFormError('');
  };

  const handleEditRecord = (rec) => {
    setDrawer({
      isForm: true,
      kicker: 'Edit ' + m.singular,
      title: rec.name || rec.number,
      saveLabel: 'Save changes',
      required: m.fields.filter(f => f[2] !== 'section').slice(0, 2).map(f => f[0]),
      fields: m.fields,
      validate: m.validate ? f => m.validate(f, false) : null,
    });
    setForm({ ...rec, phone: rec.phone ? String(rec.phone).replace(/\D/g, '').slice(-10) : '' });
    setFormError('');
  };

  const handleDeleteRecord = (rec) => {
    const inUse = type === 'vehicles' && (tms.trips || []).some(t => t.vehicle === rec.id && t.status === 'Enroute');
    setConfirm(
      inUse
        ? {
            title: 'Cannot delete ' + (rec.name || rec.number),
            body: 'This vehicle has an active trip. Close the trip first, or mark the vehicle Inactive so it no longer appears to supervisors.',
            okLabel: 'Understood',
            onOk: () => setConfirm(null),
          }
        : {
            title: 'Delete ' + (rec.name || rec.number) + '?',
            body: 'Historic trips that reference this ' + m.singular + ' keep their data. Supervisors will no longer see it in dropdowns.',
            okLabel: 'Delete',
            danger: true,
            onOk: () => {
              setDeleted([...deleted, rec.id]);
              setConfirm(null);
              showToast('danger', m.title.replace(' Master', '') + ' deleted', (rec.name || rec.number) + ' removed.');
            },
          }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Driver Approval Queue banner */}
      {type === 'drivers' && drvQueue.length > 0 && (
        <section
          aria-label="Driver approval queue"
          style={{
            background: 'var(--color-hazard-soft)',
            borderRadius: 'var(--radius-lg)',
            color: '#7A4300',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '14px 18px 12px' }}>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Approval queue · {drvQueue.length} pending
            </strong>
            <div style={{ fontSize: '14px', marginTop: '2px' }}>
              Driver requests from supervisors. Drivers cannot be assigned until approved; the supervisor app updates as soon as you decide.
            </div>
          </div>

          {drvQueue.map(q => (
            <div
              key={q.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                flexWrap: 'wrap',
                padding: '12px 18px',
                borderTop: '1px solid rgba(122,67,0,.18)',
                background: 'rgba(255,255,255,.6)',
              }}
            >
              <span
                style={{
                  flex: 'none',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#fff',
                  border: '2px solid var(--color-hazard)',
                  color: '#7A4300',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '14px',
                }}
              >
                {q.initials}
              </span>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-heading)' }}>{q.name}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: '#fff', color: '#7A4300' }}>
                    {q.tag}
                  </span>
                  {q.hasDocs && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>· {q.docs}</span>}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-body)', marginTop: '2px' }}>{q.sub}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={q.review}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-strong)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-heading)',
                    background: '#fff',
                  }}
                >
                  Review
                </button>
                <button
                  onClick={q.approve}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-brand)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={q.reject}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--kr-red-700)',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

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
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              <strong style={{ color: 'var(--text-heading)' }}>{rows.length}</strong> {m.plural}
            </span>
            <input
              type="text"
              placeholder={m.searchPh}
              value={masterQ}
              onChange={(e) => setMasterQ(e.target.value)}
              style={{
                width: '240px',
                height: '36px',
                padding: '0 12px',
                fontSize: '14px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
              }}
            />

            {/* Driver Approval Filter Pills */}
            {type === 'drivers' && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setDriverApprovalFilter(driverApprovalFilter === 'Approved' ? '' : 'Approved')}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    height: '36px',
                    padding: '0 12px',
                    boxSizing: 'border-box',
                    display: 'inline-flex',
                    alignItems: 'center',
                    border: `2px solid ${driverApprovalFilter === 'Approved' ? 'var(--color-brand)' : 'var(--border-strong)'}`,
                    borderRadius: 'var(--radius-md)',
                    background: driverApprovalFilter === 'Approved' ? 'var(--color-brand)' : '#fff',
                    color: driverApprovalFilter === 'Approved' ? '#fff' : 'var(--text-heading)',
                    fontFamily: 'var(--font-display)',
                    fontSize: '12px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Approved
                </button>
                <button
                  onClick={() => setDriverApprovalFilter(driverApprovalFilter === 'Pending approval' ? '' : 'Pending approval')}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    height: '36px',
                    padding: '0 12px',
                    boxSizing: 'border-box',
                    display: 'inline-flex',
                    alignItems: 'center',
                    border: `2px solid ${driverApprovalFilter === 'Pending approval' ? 'var(--color-hazard)' : 'var(--border-strong)'}`,
                    borderRadius: 'var(--radius-md)',
                    background: driverApprovalFilter === 'Pending approval' ? 'var(--color-hazard-soft)' : '#fff',
                    color: driverApprovalFilter === 'Pending approval' ? '#7A4300' : 'var(--text-heading)',
                    fontFamily: 'var(--font-display)',
                    fontSize: '12px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Request approval
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => showToast('info', 'Import from Excel', 'Upload the existing sheet; columns are mapped on the next step.')}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '0 14px',
                height: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                background: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-heading)',
              }}
            >
              Import from Excel
            </button>
            <button
              onClick={handleNewRecord}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '0 14px',
                height: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-brand)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              {m.addLabel}
            </button>
          </div>
        </div>

        {/* Records Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '760px' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--surface-muted)' }}>
                {m.cols.map((c, i) => (
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
                <th style={{ padding: '10px 14px' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const cells = m.cells(r);
                const isPendingDriver = type === 'drivers' && (approvals[r.id] || r.approval) === 'Pending approval';
                return (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--border-default)' }}>
                    {cells.map((c, ci) => (
                      <td key={ci} style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: c.color, fontWeight: c.weight }}>
                        {c.badge ? (
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
                              background: c.bg,
                              color: c.fg,
                            }}
                          >
                            {c.v}
                          </span>
                        ) : (
                          c.v
                        )}
                      </td>
                    ))}
                    <td style={{ padding: '8px 14px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {isPendingDriver && (
                        <button
                          onClick={() => setDrawer({ isDriverReq: true, reqId: r.id, kicker: 'Pending driver', title: r.name })}
                          style={{ all: 'unset', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#7A4300', padding: '6px 8px' }}
                        >
                          Review
                        </button>
                      )}
                      <button
                        onClick={() => handleEditRecord(r)}
                        style={{ all: 'unset', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--text-brand)', padding: '6px 8px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(r)}
                        style={{ all: 'unset', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', padding: '6px 8px' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--text-heading)' }}>
              No {m.plural} found
            </div>
            <p style={{ margin: '6px 0 16px', color: 'var(--text-muted)', fontSize: '14px' }}>
              Nothing matches &ldquo;{masterQ}&rdquo;. Add the record or clear the search.
            </p>
            <button
              onClick={handleNewRecord}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '0 20px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-brand)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              {m.addLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterManager;
