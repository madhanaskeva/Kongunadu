import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck } from 'lucide-react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { downloadXlsx, readSheet } from '../../../utils/spreadsheet';
import { RowActions } from '../../../components/common/RowActions';
import { Pagination, usePagination } from '../../../components/common/Pagination';
import { matchesSearch } from '../../../utils/search';

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
    saveMasterMany,
    normalizeRecord,
  } = useTMSAdmin();

  const [masterQ, setMasterQ] = useState('');
  const navigate = useNavigate();
  const { can } = useModuleAccess();
  const canAdd = can(type, 'add');
  const canEdit = can(type, 'edit');
  const canDelete = can(type, 'delete');
  const tms = T();
  const bn = id => (tms.B[id] || {}).name || '—';

  // Master definitions matching HTML prototype
  // tms lists already include saved adds and edits (see TMSAdminContext); this only overlays
  // edits on rows built outside them, like drivers requested from the Supervisor App.
  const mdata = (routeKey, seed) => {
    const ed = (masterEdits[routeKey] || {}).edited || {};
    return seed.filter(r => !deleted.includes(r.id)).map(r => ed[r.id] ? { ...r, ...ed[r.id] } : r);
  };

  const branchOpts = (tms.branches || []).map(b => ({ value: b.id, label: b.name }));
  const clientList = mdata('clients', tms.clients || []);
  const clientOpts = clientList.map(c => ({ value: c.id, label: c.name }));
  const supervisorList = mdata('supervisors', tms.supervisors || []);
  const getSupervisorOptions = (selectedBranch) => {
    const sups = supervisorList.filter(s => s.status !== 'Inactive' && s.status !== 'Suspended');
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
        ['email', 'Sign-in email', null, 'name@transport.example'],
        ['branch', 'Branch', branchOpts],
        ['clients', 'Clients handled', 'checkbox-select', 'Select clients handled', { options: clientOpts }],
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
      searchPh: 'Search client, GST, or loading location',
      data: mdata('clients', tms.clients || []).map(c => {
        const sups = (tms.supervisors || []).filter(s =>
          (s.clientIds || []).includes(c.id) ||
          (c.supervisorIds || []).includes(s.id) ||
          (c.supervisors && typeof c.supervisors === 'string' && c.supervisors.toLowerCase().includes(s.name.toLowerCase()))
        );
        const supervisorNames = sups.map(s => s.name).join(', ') || c.supervisors || '—';
        const loc = (tms.locations || []).find(l => l.clientId === c.id || l.client === c.id || l.id === c.loadingLocationId);
        const loadingLoc = c.loadingLocation || (loc ? loc.name : '') || c.contact || '—';
        return {
          ...c,
          loadingLocation: loadingLoc,
          supervisorsFormatted: supervisorNames,
          customers: mdata('customers', tms.customers || []).filter(u => u.client === c.id && !deleted.includes(u.id)).length,
        };
      }),
      rowLink: c => `/admin/masters/clients/${c.id}`,
      cols: ['Client', 'GSTIN', 'Branch', 'Loading Location', 'Phone', 'Supervisors', 'Customers', 'Status'],
      cells: c => [
        { ...txtCell(c.name, true), color: 'var(--text-brand)' },
        txtCell(c.gst),
        txtCell(bn(c.branch)),
        txtCell(c.loadingLocation || '—', true),
        txtCell(c.phone ? (String(c.phone).startsWith('+91') ? c.phone : `+91 ${c.phone}`) : '—'),
        txtCell(c.supervisorsFormatted || '—'),
        txtCell(c.customers),
        statusBadge(c.status),
      ],
      fields: [
        ['name', 'Client name', null, 'e.g. Linde India or INOX Air Products'],
        ['gst', 'GSTIN', null, '33AAACL0123M1Z2', { clean: 'gstin', hint: '15-character GST identification number' }],
        ['branch', 'Branch', branchOpts],
        ['loadingLocation', 'Loading location', null, 'e.g. Sriperumbudur Cryogenic Hub', { hint: 'Primary loading plant, terminal, or hub' }],
        ['phone', 'Client phone number', null, '98410 11220', { clean: 'phone', prefix: '+91', hint: 'Primary contact or dispatch phone' }],
        ['supervisors', 'Supervisor assignment', 'checkbox-select', 'Select supervisors', {
          options: (f) => getSupervisorOptions(f?.branch),
          itemNoun: 'supervisor',
          searchPlaceholder: 'Search supervisors...',
        }],
        ['status', 'Status', ['Active', 'On hold']],
      ],
      required: ['name', 'gst', 'branch'],
      validate: (f) => {
        const dg = x => String(x || '').replace(/\D/g, '');
        return {
          name: !String(f.name || '').trim() ? 'Enter the client name.' : undefined,
          gst: !String(f.gst || '').trim()
            ? 'Enter the GSTIN.'
            : String(f.gst || '').replace(/\s/g, '').length !== 15
            ? 'GSTIN must be 15 characters.'
            : undefined,
          branch: !f.branch ? 'Select a branch for this client.' : undefined,
          phone: f.phone && dg(f.phone).length !== 10 ? 'Enter a 10-digit mobile number.' : undefined,
        };
      },
    },
    locations: {
      title: 'Loading Location Master',
      singular: 'loading location',
      plural: 'loading locations',
      addLabel: 'Add location',
      searchPh: 'Search location or client',
      data: mdata('locations', tms.locations || []).map(l => {
        const cl = (tms.clients || []).find(c =>
          c.id === l.clientId ||
          c.id === l.client ||
          c.loadingLocationId === l.id ||
          (c.loadingLocation && c.loadingLocation.trim().toLowerCase() === (l.name || '').trim().toLowerCase()) ||
          c.name === l.clientName
        );
        return {
          ...l,
          clientName: (cl ? cl.name : l.clientName) || (l.client && tms.C?.[l.client]?.name) || '—',
          clientId: cl ? cl.id : (l.clientId || l.client || ''),
        };
      }),
      cols: ['Location', 'Client', 'Branch', 'Address', 'Safe radius', 'Gps Coordinates', 'Status'],
      cells: l => [
        txtCell(l.name, true),
        { ...txtCell(l.clientName || '—', true), color: l.clientName && l.clientName !== '—' ? 'var(--text-brand)' : 'var(--text-body)' },
        txtCell(bn(l.branch)),
        txtCell(l.address),
        txtCell(l.radius ? l.radius + ' m' : '—'),
        txtCell(l.lat && l.lng ? `${l.lat}, ${l.lng}` : '—'),
        statusBadge(l.status),
      ],
      fields: [
        ['name', 'Location name', null, 'e.g. Sriperumbudur Cryogenic Hub'],
        ['client', 'Client', clientOpts, 'Select client'],
        ['branch', 'Branch', branchOpts],
        ['address', 'Address', null, 'Plant or yard address'],
        ['radius', 'Safe radius (m)', null, '100'],
        ['lat', 'Latitude', null, '12.9605'],
        ['lng', 'Longitude', null, '79.9412'],
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
    matchesSearch(masterQ, Object.values(r), (tms.B[r.branch] || {}).name) &&
    (type !== 'drivers' || !driverApprovalFilter || (approvals[r.id] || r.approval || 'Approved') === driverApprovalFilter)
  );
  const rowsPg = usePagination(rows, [type, masterQ, driverApprovalFilter]);

  const handleNewRecord = () => {
    setDrawer({
      isForm: true,
      isMaster: true,
      masterKey: type,
      kicker: 'New ' + m.singular,
      title: m.addLabel,
      saveLabel: 'Create ' + m.singular,
      required: m.required || m.fields.filter(f => f[2] !== 'section').slice(0, 2).map(f => f[0]),
      fields: m.fields,
      validate: m.validate ? f => m.validate(f, true) : null,
    });
    setForm(
      type === 'supervisors'
        ? { clients: [] }
        : type === 'clients'
        ? { supervisors: [], status: 'Active', loadingLocation: '' }
        : type === 'locations'
        ? { status: 'Active', radius: 100 }
        : {}
    );
    setFormError('');
  };

  const handleEditRecord = (rec) => {
    setDrawer({
      isForm: true,
      isMaster: true,
      masterKey: type,
      kicker: 'Edit ' + m.singular,
      title: rec.name || rec.number,
      saveLabel: 'Save changes',
      required: m.required || m.fields.filter(f => f[2] !== 'section').slice(0, 2).map(f => f[0]),
      fields: m.fields,
      validate: m.validate ? f => m.validate(f, false) : null,
    });
    let initialClients = rec.clientIds || [];
    if ((!initialClients || !initialClients.length) && rec.clients) {
      if (Array.isArray(rec.clients)) {
        initialClients = rec.clients;
      } else if (typeof rec.clients === 'string') {
        const names = rec.clients.split(',').map(s => s.trim().toLowerCase());
        initialClients = (tms.clients || []).filter(c => names.includes(c.name.toLowerCase())).map(c => c.id);
        if (!initialClients.length) initialClients = rec.clients.split(',').map(s => s.trim());
      }
    }
    let initialSupervisors = rec.supervisorIds || [];
    if (!initialSupervisors || !initialSupervisors.length) {
      if (Array.isArray(rec.supervisors)) {
        initialSupervisors = rec.supervisors;
      } else {
        const mappedSups = (tms.supervisors || []).filter(s =>
          (s.clientIds || []).includes(rec.id) ||
          (rec.supervisors && typeof rec.supervisors === 'string' && rec.supervisors.toLowerCase().includes(s.name.toLowerCase()))
        );
        initialSupervisors = mappedSups.map(s => s.id);
      }
    }
    setForm({
      ...rec,
      ...(type === 'supervisors' ? { clients: initialClients } : {}),
      ...(type === 'clients' ? { supervisors: initialSupervisors, loadingLocation: rec.loadingLocation || rec.contact || '' } : {}),
      ...(type === 'locations' ? { client: rec.clientId || rec.client || '' } : {}),
      phone: rec.phone ? String(rec.phone).replace(/\D/g, '').slice(-10) : '',
    });
    setFormError('');
  };

  // Import from Excel / CSV: first row holds the headings (field label or key), one record per row.
  // A row whose first field matches an existing record updates it; otherwise it is added.
  const importRef = useRef(null);
  const importFields = () => m.fields.filter(f => f[2] !== 'section' && f[2] !== 'upload' && f[2] !== 'textarea');
  const squash = x => String(x || '').toLowerCase().replace(/[^a-z0-9]/g, '');


  const handleImportFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    let rows;
    try { rows = await readSheet(file); } catch (err) {
      showToast('warning', 'Could not read file', 'Upload an .xlsx or .csv file with headings in the first row.');
      return;
    }
    const fs = importFields();
    const cols = (rows[0] || []).map(h => fs.find(f => squash(f[1]) === squash(h) || squash(f[0]) === squash(h)));
    if (!cols.some(Boolean)) {
      showToast('warning', 'No matching headings', `Use the headings: ${fs.map(f => f[1]).join(', ')}.`);
      return;
    }
    const required = fs.slice(0, 2).map(f => f[0]), key = required[0];
    const optionValue = (f, v) => {
      if (!Array.isArray(f[2])) return v;
      const o = f[2].find(x => typeof x === 'string' ? squash(x) === squash(v) : squash(x.label) === squash(v) || squash(x.value) === squash(v));
      return o == null ? v : typeof o === 'string' ? o : o.value;
    };
    const items = [];
    let skipped = 0;
    rows.slice(1).forEach(r => {
      const f = {};
      cols.forEach((c, i) => { if (c && r[i] !== undefined && r[i] !== '') f[c[0]] = optionValue(c, r[i]); });
      if (required.some(k => !String(f[k] || '').trim())) { skipped++; return; }
      const existing = m.data.find(x => squash(x[key]) === squash(f[key]));
      const isNew = !existing;
      items.push({ rec: normalizeRecord(type, isNew ? f : { ...f, id: existing.id }, isNew), isNew });
    });
    if (!items.length) {
      showToast('warning', 'Nothing imported', `No rows had ${fs.slice(0, 2).map(f => f[1]).join(' and ')} filled in.`);
      return;
    }
    saveMasterMany(type, items);
    items.forEach(({ rec }) => { if (type === 'vehicles' && rec.tank) setVehTank(rec.id, rec.tank); });
    const added = items.filter(x => x.isNew).length;
    showToast('success', 'Import complete', `${added} added · ${items.length - added} updated${skipped ? ` · ${skipped} skipped (missing ${fs.slice(0, 2).map(f => f[1]).join(' or ')})` : ''}.`);
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
            background: 'var(--color-brand-soft)',
            border: '1px solid rgba(0,98,63,.22)',
            borderLeft: '4px solid var(--color-brand)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--kr-green-800)',
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
                borderTop: '1px solid rgba(0,98,63,.16)',
                background: 'var(--color-brand-tint)',
              }}
            >
              <span
                style={{
                  flex: 'none',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#fff',
                  border: '2px solid var(--color-brand)',
                  color: 'var(--color-brand)',
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
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: '#fff', color: 'var(--color-brand)', border: '1px solid rgba(0,98,63,.25)' }}>
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
                {canEdit && (
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
                )}
                {canEdit && (
                  <button
                    onClick={q.reject}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--kr-red-600)',
                      background: 'var(--kr-red-50)',
                      color: 'var(--kr-red-700)',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    Reject
                  </button>
                )}
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
            {canAdd && <input ref={importRef} type="file" accept=".xlsx,.csv" onChange={handleImportFile} style={{ display: 'none' }} />}
            {canAdd && (
              // Shown for now without the import; wire onClick={() => importRef.current && importRef.current.click()} back to enable it.
              <button
                type="button"
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
            )}
            {canAdd && (
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
            )}
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
                <th
                  style={{
                    padding: '10px 14px',
                    fontFamily: 'var(--font-display)',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rowsPg.rows.map(r => {
                const cells = m.cells(r);
                const isPendingDriver = type === 'drivers' && (approvals[r.id] || r.approval) === 'Pending approval';
                return (
                  <tr
                    key={r.id}
                    style={{ borderTop: '1px solid var(--border-default)' }}
                  >
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
                    <td style={{ padding: '8px 14px', whiteSpace: 'nowrap', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <RowActions
                        actions={isPendingDriver ? [
                          {
                            key: 'review',
                            icon: UserCheck,
                            label: 'Review driver request',
                            onClick: () => setDrawer({ isDriverReq: true, reqId: r.id, kicker: 'Pending driver', title: r.name }),
                            colorHover: '#7A4300',
                            bgHover: 'var(--color-hazard-soft)',
                          },
                        ] : []}
                        onView={m.rowLink ? () => navigate(m.rowLink(r)) : undefined}
                        viewLabel={`Open ${m.singular} profile`}
                        onEdit={canEdit ? () => handleEditRecord(r) : undefined}
                        onDelete={canDelete ? () => handleDeleteRecord(r) : undefined}
                        editLabel={`Edit ${m.singular}`}
                        deleteLabel={`Delete ${m.singular}`}
                        buttonAriaLabel={`Actions for ${r.name || r.number}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rows.length > 0 && <Pagination {...rowsPg} noun={m.plural} />}
        {rows.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--text-heading)' }}>
              No {m.plural} found
            </div>
            <p style={{ margin: '6px 0 16px', color: 'var(--text-muted)', fontSize: '14px' }}>
              Nothing matches &ldquo;{masterQ}&rdquo;. Add the record or clear the search.
            </p>
            {canAdd && (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterManager;
