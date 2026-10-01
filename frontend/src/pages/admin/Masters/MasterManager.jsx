import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Check, Clock, Eye, EyeOff, Fuel, Pencil, Plus, Search, Trash2, UserCheck, X } from 'lucide-react';
import { Alert, Button, Card, Empty, Flex, Input, Popover, Select, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { readSheet } from '../../../utils/spreadsheet';
import { matchesSearch } from '../../../utils/search';
import { useDebounce } from '../../../utils/debounce';
import { FILE_TRANSFER_ENABLED } from '../../../utils/featureFlags';
import { coordErrors } from '../../../utils/coords';
import { DRIVER_TYPES } from '../../../utils/driverTypes';

const RouteBunksCell = ({ route, tms, isOpen, onToggle, onEditRoute, onDeleteBunk, isNearBottom = false }) => {
  const rawBunks = route.authorizedBunks || [];
  const bunkNames = rawBunks.map(bId => (tms.F[bId] || {}).name || bId);
  const count = bunkNames.length;

  const openEditForm = () => {
    onToggle();
    onEditRoute();
  };

  const popoverContent = (
    // Fixed-width popover body, capped to the viewport on phones.
    <div className="rb-pop">
      {count === 0 ? (
        <Flex vertical align="center" gap={10} className="rb-empty">
          <span className="rb-empty-icon"><Fuel size={20} strokeWidth={2} /></span>
          <Typography.Text type="secondary">No authorized bunks added for this route.</Typography.Text>
          <Button type="primary" size="small" icon={<Plus size={14} />} onClick={openEditForm}>
            Add bunks
          </Button>
        </Flex>
      ) : (
        <>
          <ol className="rb-list">
            {bunkNames.map((bunkName, idx) => (
              <li key={idx} className="rb-row">
                <span className="rb-num">{idx + 1}</span>
                <Typography.Text ellipsis={{ tooltip: bunkName }} className="rb-name">
                  {bunkName}
                </Typography.Text>
                <Space size={6} className="rb-actions">
                  <Tooltip title="Edit route authorized bunks">
                    <Button
                      type="text"
                      size="small"
                      className="tms-row-action"
                      icon={<Pencil size={15} strokeWidth={2} />}
                      aria-label="Edit route authorized bunks"
                      onClick={openEditForm}
                    />
                  </Tooltip>
                  <Tooltip title="Delete this authorized bunk">
                    <Button
                      type="text"
                      size="small"
                      className="tms-row-action"
                      danger
                      icon={<Trash2 size={15} strokeWidth={2} />}
                      aria-label="Delete this authorized bunk"
                      onClick={() => onDeleteBunk(bunkName)}
                    />
                  </Tooltip>
                </Space>
              </li>
            ))}
          </ol>
          <div className="rb-foot">
            <Button block icon={<Plus size={15} />} onClick={openEditForm}>
              Add or edit bunks
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Space size={8} onClick={(e) => e.stopPropagation()}>
      <Tag color={count > 0 ? 'success' : 'default'} icon={<Fuel size={13} />}>
        {count} {count === 1 ? 'Bunk' : 'Bunks'}
      </Tag>

      <Popover
        trigger="click"
        open={isOpen}
        onOpenChange={(next) => { if (next !== isOpen) onToggle(); }}
        placement={isNearBottom ? 'topRight' : 'bottomRight'}
        classNames={{ root: 'rb-popover' }}
        title={
          <Flex justify="space-between" align="center" gap={10} className="rb-head">
            <Flex align="center" gap={10} style={{ minWidth: 0 }}>
              <span className="rb-head-icon"><Fuel size={17} strokeWidth={2} /></span>
              <Flex vertical style={{ minWidth: 0 }}>
                <span className="rb-head-title">Authorized fuel bunks</span>
                <span className="rb-head-sub">
                  {count} {count === 1 ? 'bunk' : 'bunks'} on {route.name || 'this route'}
                </span>
              </Flex>
            </Flex>
            <Button type="text" size="small" className="tms-row-action tms-row-action--plain" icon={<X size={16} strokeWidth={2} />} aria-label="Close" onClick={onToggle} />
          </Flex>
        }
        content={popoverContent}
      >
        <Button
          type="text"
          size="small"
          className={`tms-row-action tms-row-action--view${isOpen ? ' is-active' : ''}`}
          icon={<Eye size={16} strokeWidth={2} />}
          title="View authorized fuel bunks list"
          aria-label="View authorized fuel bunks"
        />
      </Popover>
    </Space>
  );
};

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
    bunkReqs,
    decideBunkRequest,
    vehTanks,
    setVehTank,
    saveMaster,
    saveMasterMany,
    normalizeRecord,
  } = useTMSAdmin();

  const [masterQ, setMasterQ] = useState('');
  // Rows whose password is revealed in the table (Supervisor Master).
  const [shownPw, setShownPw] = useState({});
  const debouncedMasterQ = useDebounce(masterQ, 300);
  const [activeBunksPopover, setActiveBunksPopover] = useState(null);
  // Loading Location Master: pick the client first — locations belong to one client,
  // so there is nothing sensible to add until we know whose location it is.
  const [locClient, setLocClient] = useState('');
  // Route / Bunk master: the records table ("Approved") or the supervisors' bunk requests.
  const [bunkView, setBunkView] = useState('approved');

  const handleDeleteBunkFromRoute = (routeRec, bunkToDelete) => {
    const rawList = routeRec.authorizedBunks || [];
    const currentBunks = rawList.map(b => (tms.F[b] || {}).name || b);
    const updatedBunks = currentBunks.filter(b => String(b).toLowerCase() !== String(bunkToDelete).toLowerCase());
    saveMaster('routes', { ...routeRec, authorizedBunks: updatedBunks }, false);
    const displayBunkName = (tms.F[bunkToDelete] || {}).name || bunkToDelete;
    showToast('success', 'Bunk removed', `Removed "${displayBunkName}" from route ${routeRec.name || ''}.`);
  };
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
    const ed = ((masterEdits || {})[routeKey] || {}).edited || {};
    const delList = deleted || [];
    return (seed || []).filter(r => !delList.includes(r.id)).map(r => ed[r.id] ? { ...r, ...ed[r.id] } : r);
  };

  const branchOpts = (tms.branches || []).map(b => ({ value: b.id, label: b.name }));
  const isBranchEqual = (bVal, bOpt) => {
    if (!bVal || !bOpt) return false;
    const optVal = typeof bOpt === 'string' ? bOpt : bOpt.value;
    const optLabel = typeof bOpt === 'string' ? bOpt : bOpt.label;
    if (bVal === optVal || bVal === optLabel) return true;
    const bName = (tms.B[bVal] || {}).name;
    if (bName && (bName === optLabel || bName === optVal)) return true;
    const bId = (tms.B[optVal] || {}).id;
    if (bId && bVal === bId) return true;
    return false;
  };
  // One supervisor per branch: a branch that already has an assigned supervisor is not offered again,
  // except to the supervisor being edited, who keeps their own branch.
  const freeBranchOpts = (self) => branchOpts.filter(o =>
    (self && isBranchEqual(self.branch, o)) ||
    !(tms.supervisors || []).some(s => isBranchEqual(s.branch, o) && (!self || s.id !== self.id)));
  const clientList = mdata('clients', tms.clients || []);
  const clientOpts = clientList.map(c => ({ value: c.id, label: c.name }));
  // Loading locations are owned by exactly one client, so both masters read the same list.
  const locationList = mdata('locations', tms.locations || []);
  const supervisorList = mdata('supervisors', tms.supervisors || []);
  const getBranchSupervisor = (b) => {
    if (!b) return '—';
    const sup = supervisorList.find(s =>
      s.branch && (
        isBranchEqual(s.branch, { value: b.id, label: b.name }) ||
        s.branch === b.id ||
        s.branch === b.name ||
        ((tms.B[s.branch] || {}).name && (tms.B[s.branch] || {}).name === b.name) ||
        ((tms.B[b.id] || {}).name && (tms.B[b.id] || {}).name === s.branch)
      )
    );
    return sup ? sup.name : '—';
  };
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

  // Status pill tone → antd Tag preset colour
  // (green good / amber waiting / red refused / grey switched off).
  const statusBadge = (v) => ({
    v: v || '—',
    badge: true,
    text: false,
    tag: /Inactive/i.test(v)
      ? 'default'
      : /Active|Approved|Registered/i.test(v)
      ? 'success'
      : /Pending|hold|review|Maintenance/i.test(v)
      ? 'warning'
      : /Reject|Suspend|Block|Expired|Fail/i.test(v)
      ? 'error'
      : 'default',
  });

  // A sign-in password: masked in the table, revealed per row with the eye button.
  const pwCell = (r) => ({ v: r.password || '', password: true, id: r.id, name: r.name });

  const txtCell = (v, strong = false) => ({
    v: v == null ? '—' : String(v),
    text: true,
    badge: false,
    strong,
    brand: false,
  });

  const mastersConfig = {
    branches: {
      title: 'Branch Master',
      singular: 'branch',
      plural: 'branches',
      addLabel: 'Add branch',
      searchPh: 'Search branch or state',
      data: mdata('branches', tms.branches || []).map(b => {
        const supName = getBranchSupervisor(b);
        return {
          ...b,
          supervisor: supName,
          supervisors: supName,
        };
      }),
      cols: ['Code', 'Branch', 'State', 'Vehicles', 'Supervisor', 'Status'],
      cells: b => [
        txtCell(b.code, true),
        txtCell(b.name, true),
        txtCell(b.state),
        txtCell(b.vehicles),
        txtCell(b.supervisor || getBranchSupervisor(b)),
        statusBadge(b.status),
      ],
      fields: [
        ['code', 'Branch code'],
        ['name', 'Branch name'],
        ['state', 'State'],
        ['status', 'Status', ['Active', 'Inactive']],
      ],
      required: ['code', 'name', 'state', 'status'],
      validate: (f, isNew, self) => {
        const errs = {};
        const selfId = (self && self.id) || (!isNew && f.id);
        const norm = s => String(s || '').trim().toLowerCase();
        const allBranches = mdata('branches', tms.branches || []);
        const others = allBranches.filter(b => b.id !== selfId && !deleted.includes(b.id));

        if (!f.code || !String(f.code).trim()) {
          errs.code = 'Enter the branch code.';
        } else if (others.some(b => norm(b.code) === norm(f.code))) {
          errs.code = 'Branch code already exists.';
        }

        if (!f.name || !String(f.name).trim()) {
          errs.name = 'Enter the branch name.';
        } else if (others.some(b => norm(b.name) === norm(f.name))) {
          errs.name = 'Branch name already exists.';
        }

        if (!f.state || !String(f.state).trim()) errs.state = 'Enter the state.';
        if (!f.status || !String(f.status).trim()) errs.status = 'Select the status.';

        return errs;
      },
    },
    supervisors: {
      title: 'Supervisor Master',
      singular: 'supervisor',
      plural: 'supervisors',
      addLabel: 'Add supervisor',
      searchPh: 'Search name or phone',
      data: mdata('supervisors', tms.supervisors || []).map(s => {
        const supsClients = clientList.filter(c =>
          (s.clientIds || []).includes(c.id) ||
          (c.supervisorIds || []).includes(s.id) ||
          (s.clients && typeof s.clients === 'string' && s.clients.toLowerCase().includes(c.name.toLowerCase())) ||
          (c.supervisors && typeof c.supervisors === 'string' && c.supervisors.toLowerCase().includes(s.name.toLowerCase()))
        );
        const clientNames = supsClients.map(c => c.name).join(', ') || s.clients || '—';
        return {
          ...s,
          clients: clientNames,
          clientIds: supsClients.map(c => c.id),
        };
      }),
      cols: ['Name', 'Phone', 'Password', 'Branch', 'Clients handled', 'Last login', 'Status'],
      cells: s => [
        txtCell(s.name, true),
        txtCell(s.phone),
        pwCell(s),
        txtCell(bn(s.branch)),
        txtCell(s.clients),
        txtCell(s.lastLogin),
        statusBadge(s.status),
      ],
      required: ['name', 'phone', 'email', 'password', 'branch', 'clients', 'status'],
      validate: (f, isNew, self) => {
        const errs = {};
        const dg = x => String(x || '').replace(/\D/g, '');
        const selfId = (self && self.id) || (!isNew && f.id);
        const allSupervisors = mdata('supervisors', tms.supervisors || []);
        const others = allSupervisors.filter(s => s.id !== selfId && !deleted.includes(s.id));

        if (!f.name || !String(f.name).trim()) errs.name = 'Enter the full name.';
        if (!f.phone || dg(f.phone).length !== 10) errs.phone = 'Enter a 10-digit mobile number.';
        if (!f.email || !String(f.email).trim()) errs.email = 'Enter the sign-in email.';
        // Same rule as portal users on the Users & Roles page.
        if (String(f.password || '').length < 8) errs.password = 'Use at least 8 characters.';

        if (!f.branch) {
          errs.branch = 'Select a branch.';
        } else {
          const clash = others.find(s => isBranchEqual(s.branch, f.branch));
          if (clash) errs.branch = 'A supervisor is already assigned to this branch.';
        }

        const hasClients = Array.isArray(f.clients) ? f.clients.length > 0 : !!String(f.clients || '').trim();
        if (!hasClients) errs.clients = 'Select at least one client handled.';
        if (!f.status) errs.status = 'Select the status.';

        return errs;
      },
      fields: [
        ['name', 'Full name'],
        ['phone', 'Mobile number', null, '90031 55012', { clean: 'phone', prefix: '+91' }],
        ['email', 'Sign-in email', null, 'name@transport.example'],
        ['password', 'Password', null, 'At least 8 characters', { type: 'password', hint: 'The supervisor signs in to the Supervisor App with this mobile number and password.' }],
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
      required: ['number', 'type', 'branch', 'odometer', 'tank', 'status'],
      validate: (f, isNew, self) => {
        const errs = {};
        const selfId = (self && self.id) || (!isNew && f.id);
        const cleanNo = s => String(s || '').replace(/[\s-]/g, '').toLowerCase();
        const allVehicles = mdata('vehicles', tms.vehicles || []);
        const others = allVehicles.filter(v => v.id !== selfId && !deleted.includes(v.id));

        if (!f.number || !String(f.number).trim()) {
          errs.number = 'Enter the registration number.';
        } else if (others.some(v => cleanNo(v.number) === cleanNo(f.number))) {
          errs.number = 'Vehicle registration number already exists.';
        }

        if (!f.type) errs.type = 'Select the vehicle type.';
        if (!f.branch) errs.branch = 'Select a branch.';
        if (f.odometer === undefined || f.odometer === null || String(f.odometer).trim() === '') errs.odometer = 'Enter the current odometer.';

        const n = Number(f.tank);
        if (!String(f.tank || '').trim()) {
          errs.tank = 'Enter the tank capacity.';
        } else if (isNaN(n) || n < 50 || n > 1500) {
          errs.tank = 'Enter a size between 50 and 1,500 L.';
        }

        if (!f.status) errs.status = 'Select the status.';

        return errs;
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
          // A supervisor's request is "New" until Head Office approves it as Regular or Acting.
          type: r.status === 'Approved' && r.type ? r.type : 'New',
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
        ['type', 'Driver type', DRIVER_TYPES],
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
      required: (isNew) => isNew
        ? ['name', 'licence', 'phone', 'branch', 'type', 'status', 'licImg', 'aadhaarImg', 'holder', 'account', 'ifsc', 'family']
        : ['name', 'licence', 'phone', 'branch', 'type', 'status'],
      validate: (f, isNew, self) => {
        const errs = {};
        const dg = x => String(x || '').replace(/\D/g, '');
        const has = x => !!String(x || '').trim();
        const selfId = (self && self.id) || (!isNew && f.id);
        const allDrivers = mdata('drivers', [...drvReqs, ...(tms.drivers || [])]);
        const others = allDrivers.filter(d => d.id !== selfId && !deleted.includes(d.id));
        const cleanLic = s => String(s || '').replace(/[\s-]/g, '').toLowerCase();

        if (!has(f.name)) {
          errs.name = 'Enter the name as on the licence.';
        }

        if (!has(f.licence)) {
          errs.licence = 'Enter the licence number.';
        } else if (cleanLic(f.licence).length < 8) {
          errs.licence = 'Enter the full licence number.';
        } else if (others.some(d => cleanLic(d.licence) === cleanLic(f.licence))) {
          errs.licence = 'License number already exists.';
        }

        const phoneDigits = dg(f.phone).slice(-10);
        if (phoneDigits.length !== 10) {
          errs.phone = 'Enter a 10-digit mobile number.';
        } else if (others.some(d => dg(d.phone).slice(-10) === phoneDigits)) {
          errs.phone = 'Mobile number already exists.';
        }

        if (!f.branch) errs.branch = 'Choose the branch.';
        if (!f.type) errs.type = 'Select driver type.';
        if (!f.status) errs.status = 'Select status.';

        const needDocs = isNew;
        if (needDocs && !f.licImg) errs.licImg = 'Upload a clear photo of the driving licence.';
        if (needDocs && !f.aadhaarImg) errs.aadhaarImg = 'Upload a clear photo of the Aadhaar card.';
        if ((needDocs || has(f.holder)) && !has(f.holder)) errs.holder = 'Enter the account holder name.';

        const accDigits = dg(f.account);
        if (needDocs && !accDigits) {
          errs.account = 'Enter a 9 to 18 digit account number.';
        } else if ((needDocs || accDigits) && !/^\d{9,18}$/.test(accDigits)) {
          errs.account = 'Enter a 9 to 18 digit account number.';
        } else if (accDigits && others.some(d => dg(d.account) === accDigits)) {
          errs.account = 'Account number already exists.';
        }

        if ((needDocs || has(f.ifsc)) && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(f.ifsc || '').trim().toUpperCase())) {
          errs.ifsc = 'Enter a valid IFSC, e.g. SBIN0001234.';
        }

        const familyDigits = dg(f.family).slice(-10);
        if (needDocs && !familyDigits) {
          errs.family = 'Enter a 10-digit family contact number.';
        } else if ((needDocs || familyDigits) && familyDigits.length !== 10) {
          errs.family = 'Enter a 10-digit family contact number.';
        } else if (familyDigits && phoneDigits && familyDigits === phoneDigits) {
          errs.family = "Family mobile number must be different from the driver's mobile number.";
        }

        return errs;
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
        // Loading locations live in the Loading Location master and belong to one client.
        const ownLocs = locationList.filter(l => (l.clientId || l.client) === c.id);
        const locNames = ownLocs.map(l => l.name).filter(Boolean);
        const loadingLoc = locNames.join(', ') || c.loadingLocation || '—';
        return {
          ...c,
          loadingLocation: loadingLoc,
          loadingLocations: locNames,
          loadingLocationCount: locNames.length,
          supervisorsFormatted: supervisorNames,
          customers: mdata('customers', tms.customers || []).filter(u => u.client === c.id && !deleted.includes(u.id)).length,
        };
      }),
      rowLink: c => `/admin/masters/clients/${c.id}`,
      cols: ['Client', 'GSTIN', 'Branch', 'Loading Locations', 'Phone', 'Latitude', 'Longitude', 'Supervisors', 'Customers', 'Status'],
      cells: c => [
        { ...txtCell(c.name, true), brand: true },
        txtCell(c.gst),
        txtCell(bn(c.branch)),
        txtCell(c.loadingLocation || '—', true),
        txtCell(c.phone ? (String(c.phone).startsWith('+91') ? c.phone : `+91 ${c.phone}`) : '—'),
        // Client site coordinates; older clients saved before these fields show —.
        txtCell(c.lat != null && c.lat !== '' ? String(c.lat) : '—'),
        txtCell(c.lng != null && c.lng !== '' ? String(c.lng) : '—'),
        txtCell(c.supervisorsFormatted || '—'),
        txtCell(c.customers),
        statusBadge(c.status),
      ],
      fields: [
        ['name', 'Client name', null, 'e.g. Linde India or INOX Air Products'],
        ['gst', 'GSTIN', null, '33AAACL0123M1Z2', { clean: 'gstin', hint: '15-character GST identification number' }],
        ['branch', 'Branch', branchOpts],
        ['loadingLocations', 'Loading locations', 'locations-input', 'Type a loading location (e.g. Sriperumbudur Cryogenic Hub)'],
        ['phone', 'Client phone number', null, '98410 11220', { clean: 'phone', prefix: '+91', hint: 'Primary contact or dispatch phone' }],
        ['lat', 'Latitude', null, '12.9605', { hint: 'Client site latitude, −90 to 90' }],
        ['lng', 'Longitude', null, '79.9412', { hint: 'Client site longitude, −180 to 180' }],
        ['supervisors', 'Supervisor assignment', 'checkbox-select', 'Select supervisors', {
          options: (f) => getSupervisorOptions(f?.branch),
          itemNoun: 'supervisor',
          searchPlaceholder: 'Search supervisors...',
        }],
        ['status', 'Status', ['Active', 'On hold']],
      ],
      required: ['name', 'gst', 'branch', 'loadingLocations', 'phone', 'lat', 'lng', 'supervisors', 'status'],
      validate: (f, isNew, self) => {
        const errs = {};
        const dg = x => String(x || '').replace(/\D/g, '');
        const norm = s => String(s || '').trim().toLowerCase();
        const cleanGst = s => String(s || '').replace(/[\s-]/g, '').toUpperCase();
        const selfId = (self && self.id) || (!isNew && f.id);
        const allClients = mdata('clients', tms.clients || []);
        const others = allClients.filter(c => c.id !== selfId && !deleted.includes(c.id));

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

        const locs = Array.isArray(f.loadingLocations) ? f.loadingLocations : String(f.loadingLocations || '').split(',').map(s => s.trim()).filter(Boolean);
        if (!locs || locs.length === 0) errs.loadingLocations = 'Add at least one loading location.';

        if (!f.phone || dg(f.phone).length !== 10) errs.phone = 'Enter a 10-digit mobile number.';
        Object.assign(errs, coordErrors(f));

        const sups = Array.isArray(f.supervisors) ? f.supervisors : String(f.supervisors || '').split(',').map(s => s.trim()).filter(Boolean);
        if (!sups || sups.length === 0) errs.supervisors = 'Select at least one supervisor.';

        if (!f.status) errs.status = 'Select the status.';

        return errs;
      },
    },
    locations: {
      title: 'Loading Location Master',
      singular: 'loading location',
      plural: 'loading locations',
      addLabel: 'Add location',
      searchPh: 'Search location or client',
      data: locationList.map(l => {
        const ownerId = l.clientId || l.client || '';
        const cl = clientList.find(c => c.id === ownerId);
        return {
          ...l,
          client: ownerId,
          clientId: ownerId,
          clientName: (cl ? cl.name : l.clientName) || '—',
        };
      }),
      cols: ['Location', 'Client', 'Branch', 'Address', 'Safe radius', 'Gps Coordinates', 'Status'],
      cells: l => [
        txtCell(l.name, true),
        { ...txtCell(l.clientName || '—', true), brand: !!(l.clientName && l.clientName !== '—') },
        txtCell(bn(l.branch)),
        txtCell(l.address),
        txtCell(l.radius ? l.radius + ' m' : '—'),
        txtCell(l.lat && l.lng ? `${l.lat}, ${l.lng}` : '—'),
        statusBadge(l.status),
      ],
      fields: [
        ['client', 'Client', clientOpts, 'Select client'],
        ['name', 'Location name', null, 'e.g. Sriperumbudur Cryogenic Hub'],
        ['branch', 'Branch', branchOpts],
        ['address', 'Address', null, 'Plant or yard address'],
        ['radius', 'Safe radius (m)', null, '100'],
        ['lat', 'Latitude', null, '12.9605'],
        ['lng', 'Longitude', null, '79.9412'],
        ['status', 'Status', ['Active', 'Inactive']],
      ],
      required: ['client', 'name', 'branch', 'address', 'radius', 'lat', 'lng', 'status'],
      validate: (f, isNew, self) => {
        const errs = {};
        const norm = s => String(s || '').trim().toLowerCase();
        const selfId = (self && self.id) || (!isNew && f.id);
        const targetClient = f.clientId || f.client;
        const allLocations = mdata('locations', tms.locations || []);
        const others = allLocations.filter(l => l.id !== selfId && !deleted.includes(l.id) && (l.clientId || l.client) === targetClient);

        if (!f.client) errs.client = 'Select the client this loading location belongs to.';

        if (!f.name || !String(f.name).trim()) {
          errs.name = 'Enter the location name.';
        } else if (others.some(l => norm(l.name) === norm(f.name))) {
          errs.name = 'Location name already exists for this client.';
        }

        if (!f.branch) errs.branch = 'Select a branch.';
        if (!f.address || !String(f.address).trim()) errs.address = 'Enter the address.';
        if (f.radius === undefined || f.radius === null || String(f.radius).trim() === '') errs.radius = 'Enter the safe radius.';
        if (f.lat === undefined || f.lat === null || String(f.lat).trim() === '') errs.lat = 'Enter latitude.';
        if (f.lng === undefined || f.lng === null || String(f.lng).trim() === '') errs.lng = 'Enter longitude.';
        if (!f.status) errs.status = 'Select the status.';

        return errs;
      },
    },
    routes: {
      title: 'Route Master',
      singular: 'route',
      plural: 'routes',
      addLabel: 'Add route',
      searchPh: 'Search route',
      data: mdata('routes', tms.routes || []),
      cols: ['Route', 'From', 'To', 'Fixed KM', 'Duration', 'Toll', 'Diesel Limit', 'Authorized Fuel Bunks'],
      cells: r => {
        const authBunks = (r.authorizedBunks || []).map(bId => (tms.F[bId] || {}).name || bId).join(', ') || 'All active bunks';
        return [
          txtCell(r.name, true),
          txtCell((tms.L[r.from] || {}).name),
          txtCell(r.to),
          txtCell(r.km + ' km'),
          txtCell(r.hours + ' h'),
          txtCell(r.toll),
          txtCell(r.dieselLimit ? Number(r.dieselLimit).toLocaleString('en-IN') + ' L' : 'Not set', true),
          txtCell(authBunks),
        ];
      },
      fields: [
        ['from', 'Loading location', (tms.locations || []).map(l => ({ value: l.id, label: l.name }))],
        ['to', 'Destination'],
        ['km', 'Fixed distance (km)', null, 'Billing reference'],
        ['hours', 'Expected duration (h)'],
        ['toll', 'Toll estimate'],
        ['dieselLimit', 'Authorized diesel limit (L)', null, 'e.g. 200', { hint: 'Most diesel a supervisor may book on this route. Anything above it is flagged for verification.' }],
        ['authorizedBunks', 'Authorized fuel bunks', 'bunks-input', 'Type bunk name manually (e.g. IOC – Salem Highway Hub)'],
        // ['status', 'Status', ['Active', 'Under review']],
      ],
      required: ['from', 'to', 'km', 'hours', 'toll', 'dieselLimit', 'authorizedBunks'],
      validate: (f, isNew, self) => {
        const errs = {};
        const norm = s => String(s || '').trim().toLowerCase();
        const selfId = (self && self.id) || (!isNew && f.id);
        const allRoutes = mdata('routes', tms.routes || []);
        const others = allRoutes.filter(r => r.id !== selfId && !deleted.includes(r.id));

        if (!f.from) {
          errs.from = 'Select the loading location.';
        }

        if (!f.to || !String(f.to).trim()) {
          errs.to = 'Enter the destination.';
        } else if (f.from && others.some(r => r.from === f.from && norm(r.to) === norm(f.to))) {
          errs.to = 'Route already exists for this origin and destination.';
        }

        if (f.km === undefined || f.km === null || String(f.km).trim() === '') errs.km = 'Enter the fixed distance.';
        if (f.hours === undefined || f.hours === null || String(f.hours).trim() === '') errs.hours = 'Enter the expected duration.';
        if (f.toll === undefined || f.toll === null || String(f.toll).trim() === '') errs.toll = 'Enter the toll estimate.';
        if (f.dieselLimit === undefined || f.dieselLimit === null || String(f.dieselLimit).trim() === '') errs.dieselLimit = 'Enter the authorized diesel limit.';

        const bunks = Array.isArray(f.authorizedBunks) ? f.authorizedBunks : String(f.authorizedBunks || '').split(',').map(s => s.trim()).filter(Boolean);
        if (!bunks || bunks.length === 0) errs.authorizedBunks = 'Add at least one authorized fuel bunk.';

        if (!f.status) errs.status = 'Select the status.';

        return errs;
      },
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
    (type !== 'locations' || !locClient || (r.clientId || r.client) === locClient) &&
    !deleted.includes(r.id) &&
    matchesSearch(debouncedMasterQ, Object.values(r), (tms.B[r.branch] || {}).name) &&
    (type !== 'drivers' || !driverApprovalFilter || (approvals[r.id] || r.approval || 'Approved') === driverApprovalFilter)
  );
  // Table paging: jump back to page 1 whenever the master or a filter changes.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => { setPage(1); }, [type, debouncedMasterQ, driverApprovalFilter, locClient]);
  const pageRowCount = Math.max(0, Math.min(pageSize, rows.length - (Math.min(page, Math.max(1, Math.ceil(rows.length / pageSize))) - 1) * pageSize));

  // Nothing to add on the Loading Location page until a client is picked.
  const addBlocked = type === 'locations' && !locClient;

  const handleNewRecord = () => {
    if (addBlocked) return;
    const req = typeof m.required === 'function' ? m.required(true) : m.required;
    setDrawer({
      isForm: true,
      isMaster: true,
      masterKey: type,
      kicker: 'New ' + m.singular,
      title: m.addLabel,
      saveLabel: 'Create ' + m.singular,
      required: req || m.fields.filter(f => f[2] !== 'section').slice(0, 2).map(f => f[0]),
      fields: fieldsFor(null),
      validate: m.validate ? f => m.validate(f, true, null) : null,
    });
    setForm(
      type === 'supervisors'
        ? { clients: [] }
        : type === 'clients'
        ? { supervisors: [], status: 'Active', loadingLocations: [] }
        : type === 'locations'
        ? { status: 'Active', radius: 100, client: locClient, branch: (clientList.find(c => c.id === locClient) || {}).branch || '' }
        : type === 'routes'
        ? { status: 'Active', authorizedBunks: [] }
        : type === 'vehicles'
        ? { status: 'Idle' }
        : type === 'drivers'
        ? { status: 'Active', type: 'Regular' }
        : type === 'branches'
        ? { status: 'Active' }
        : {}
    );
    setFormError('');
  };

  // Supervisor branch dropdown drops branches that already have an active supervisor.
  const fieldsFor = (rec) => type === 'supervisors'
    ? m.fields.map(f => (f[0] === 'branch' ? [f[0], f[1], freeBranchOpts(rec), ...f.slice(3)] : f))
    : m.fields;

  const handleEditRecord = (rec) => {
    const req = typeof m.required === 'function' ? m.required(false) : m.required;
    setDrawer({
      isForm: true,
      isMaster: true,
      masterKey: type,
      kicker: 'Edit ' + m.singular,
      title: rec.name || rec.number,
      saveLabel: 'Save changes',
      required: req || m.fields.filter(f => f[2] !== 'section').slice(0, 2).map(f => f[0]),
      fields: fieldsFor(rec),
      validate: m.validate ? f => m.validate(f, false, rec) : null,
    });
    let initialClients = Array.isArray(rec.clientIds) ? [...rec.clientIds] : [];
    if (rec.clients) {
      if (Array.isArray(rec.clients)) {
        rec.clients.forEach(cid => { if (!initialClients.includes(cid)) initialClients.push(cid); });
      } else if (typeof rec.clients === 'string') {
        const names = rec.clients.split(',').map(s => s.trim().toLowerCase());
        (tms.clients || []).forEach(c => {
          if (names.includes(c.name.toLowerCase()) || names.includes(c.id.toLowerCase())) {
            if (!initialClients.includes(c.id)) initialClients.push(c.id);
          }
        });
      }
    }
    (tms.clients || []).forEach(c => {
      const assignsThis = (c.supervisorIds || []).includes(rec.id) ||
        (Array.isArray(c.supervisors) && (c.supervisors.includes(rec.id) || c.supervisors.includes(rec.name))) ||
        (typeof c.supervisors === 'string' && rec.name && c.supervisors.toLowerCase().includes(rec.name.toLowerCase()));
      if (assignsThis && !initialClients.includes(c.id)) {
        initialClients.push(c.id);
      }
    });

    const initialAuthBunks = (rec.authorizedBunks || []).map(b => (tms.F[b] || {}).name || b);

    let initialSupervisors = Array.isArray(rec.supervisorIds) ? [...rec.supervisorIds] : [];
    if (rec.supervisors) {
      if (Array.isArray(rec.supervisors)) {
        rec.supervisors.forEach(sid => { if (!initialSupervisors.includes(sid)) initialSupervisors.push(sid); });
      } else if (typeof rec.supervisors === 'string') {
        const names = rec.supervisors.split(',').map(s => s.trim().toLowerCase());
        (tms.supervisors || []).forEach(s => {
          if (names.includes(s.name.toLowerCase()) || names.includes(s.id.toLowerCase())) {
            if (!initialSupervisors.includes(s.id)) initialSupervisors.push(s.id);
          }
        });
      }
    }
    (tms.supervisors || []).forEach(s => {
      const handlesThis = (s.clientIds || []).includes(rec.id) ||
        (Array.isArray(s.clients) && (s.clients.includes(rec.id) || s.clients.includes(rec.name))) ||
        (typeof s.clients === 'string' && rec.name && s.clients.toLowerCase().includes(rec.name.toLowerCase()));
      if (handlesThis && !initialSupervisors.includes(s.id)) {
        initialSupervisors.push(s.id);
      }
    });
    setForm({
      ...rec,
      authorizedBunks: initialAuthBunks,
      ...(type === 'supervisors' ? { clients: initialClients } : {}),
      ...(type === 'clients' ? { supervisors: initialSupervisors, loadingLocations: rec.loadingLocations || [] } : {}),
      ...(type === 'locations' ? { client: rec.clientId || rec.client || '' } : {}),
      phone: rec.phone ? String(rec.phone).replace(/\D/g, '').slice(-10) : '',
    });
    setFormError('');
  };

  // Import from Excel / CSV: first row holds the headings (field label or key), one record per row.
  // A row whose key (code, registration, licence, GSTIN, ...) matches an existing record updates it;
  // otherwise it is added. Rows go through normalizeRecord + saveMasterMany, the same path as the
  // Add / Edit drawer, so they show in the lists, dropdowns and the Supervisor App.
  const importRef = useRef(null);
  const importFields = () => m.fields.filter(f => f[2] !== 'section' && f[2] !== 'upload');
  const squash = x => String(x || '').toLowerCase().replace(/[^a-z0-9஀-௿]/g, '');
  const digits = x => String(x || '').replace(/\D/g, '');
  const importRequired = () => m.required || m.fields.filter(f => f[2] !== 'section').slice(0, 2).map(f => f[0]);

  // Which column identifies a record, so re-importing an exported / edited sheet updates instead of duplicating.
  const importKey = (r) => {
    switch (type) {
      case 'branches': return squash(r.code) || squash(r.name);
      case 'supervisors': return digits(r.phone).slice(-10) || squash(r.name);
      case 'vehicles': return squash(r.number);
      case 'drivers': return squash(r.licence) || digits(r.phone).slice(-10);
      case 'clients': return squash(r.gst) || squash(r.name);
      case 'locations': return (r.clientId || r.client || '') + '|' + squash(r.name);
      case 'routes': return (r.from || '') + '|' + squash(r.to);
      default: return squash(r.name || r.id);
    }
  };

  // Options offered by a dropdown / checkbox field, as [{ value, label }].
  const optionsOf = (f, rec) => {
    let o = Array.isArray(f[2]) ? f[2] : f[2] === 'checkbox-select' && f[4] ? f[4].options : null;
    if (typeof o === 'function') o = o(rec || {});
    return Array.isArray(o) ? o.map(x => (typeof x === 'string' ? { value: x, label: x } : x)) : null;
  };
  const matchOption = (opts, v) => {
    const s = squash(v);
    return opts.find(o => squash(o.value) === s || squash(o.label) === s || squash(String(o.label).replace(/\s*\(.*\)\s*$/, '')) === s);
  };

  const handleImportFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    let rows;
    try { rows = await readSheet(file); } catch (err) {
      showToast('warning', 'Could not read file', (err && err.message) || 'Upload an .xlsx or .csv file with headings in the first row.');
      return;
    }
    const fs = importFields();
    const cols = (rows[0] || []).map(h => fs.find(f => squash(f[1]) === squash(h) || squash(f[0]) === squash(h)));
    if (!cols.some(Boolean)) {
      showToast('warning', 'No matching headings', `The first row must hold the headings: ${fs.map(f => f[1]).join(', ')}.`);
      return;
    }
    const required = importRequired();
    const missingCols = required.filter(k => !cols.some(c => c && c[0] === k));
    if (missingCols.length) {
      showToast('warning', 'Missing columns', `Add the column${missingCols.length > 1 ? 's' : ''}: ${missingCols.map(k => (fs.find(f => f[0] === k) || [k, k])[1]).join(', ')}.`);
      return;
    }
    if (rows.length < 2) {
      showToast('warning', 'Nothing imported', 'The sheet has headings but no rows below them.');
      return;
    }

    const existingByKey = new Map(m.data.filter(r => !deleted.includes(r.id)).map(r => [importKey(r), r]));
    const pending = new Map(); // key -> { f, existing, line }
    const problems = [];
    rows.slice(1).forEach((r, idx) => {
      const line = idx + 2, f = {}, errs = [];
      cols.forEach((c, i) => {
        if (!c) return;
        let v = r[i] === undefined ? '' : String(r[i]).trim();
        if (v === '' || v === '—') return;
        const opt = c[4] || {};
        if (opt.clean === 'phone') { const d = digits(v); v = d.length > 10 && d.startsWith('91') ? d.slice(-10) : d; if (v.length !== 10) errs.push(`${c[1]} must be 10 digits`); }
        else if (opt.clean === 'gstin' || opt.clean === 'ifsc' || opt.clean === 'licence') v = v.toUpperCase();
        else if (opt.clean === 'litres' || opt.clean === 'account') v = digits(v);
        if (c[2] === 'bunks-input') { f[c[0]] = v.split(/[,;\n]/).map(s => s.trim()).filter(Boolean); return; }
        if (c[2] === 'checkbox-select') {
          const opts = optionsOf(c, f) || [];
          const names = v.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
          const bad = names.filter(n => opts.length && !matchOption(opts, n));
          if (bad.length) errs.push(`${c[1]}: "${bad.join(', ')}" not found`);
          f[c[0]] = names.map(n => { const o = matchOption(opts, n); return o ? o.value : n; });
          return;
        }
        const opts = optionsOf(c, f);
        if (opts) {
          const o = matchOption(opts, v);
          if (!o) { errs.push(`${c[1]} "${v}" is not one of: ${opts.slice(0, 6).map(x => x.label).join(', ')}${opts.length > 6 ? ', …' : ''}`); return; }
          v = o.value;
        }
        f[c[0]] = v;
      });
      if (type === 'locations' && f.client) f.clientId = f.client;
      const miss = required.filter(k => !String(Array.isArray(f[k]) ? f[k].join('') : f[k] || '').trim());
      if (miss.length) errs.push('missing ' + miss.map(k => (fs.find(x => x[0] === k) || [k, k])[1]).join(', '));
      const key = importKey(f);
      const prev = pending.get(key);
      const existing = prev ? prev.existing : existingByKey.get(key);
      const merged = { ...(existing || {}), ...(prev ? prev.f : {}), ...f };
      fs.forEach(c => { if ((c[4] || {}).clean === 'phone' && merged[c[0]]) merged[c[0]] = digits(merged[c[0]]).slice(-10); });
      if (!errs.length && m.validate) {
        Object.entries(m.validate(merged, false) || {}).forEach(([k, msg]) => { if (msg) errs.push(msg.replace(/\.$/, '')); });
      }
      if (!errs.length && type === 'supervisors' && merged.branch) {
        const selfId = existing && existing.id;
        const clash = (tms.supervisors || []).find(s => isBranchEqual(s.branch, merged.branch) && s.id !== selfId)
          || [...pending.values()].find(p => p.f !== (prev && prev.f) && isBranchEqual(p.f.branch, merged.branch));
        if (clash) errs.push(`${bn(merged.branch)} already has an assigned supervisor (${clash.name || 'in list'})`);
      }
      if (errs.length) { problems.push(`Row ${line}: ${errs.join('; ')}`); return; }
      pending.set(key, { f: prev ? { ...prev.f, ...f } : f, existing, line });
    });

    const items = [...pending.values()].map(({ f, existing }) => {
      if (!existing) return { rec: normalizeRecord(type, f, true), isNew: true };
      const rec = { ...f, id: existing.id };
      // Keep links the sheet did not mention, so an update cannot silently unassign them.
      if (type === 'clients' && f.supervisors === undefined) rec.supervisors = (existing.supervisorIds && existing.supervisorIds.length) ? existing.supervisorIds : existing.supervisors;
      if (type === 'supervisors' && f.clients === undefined) rec.clients = (existing.clientIds && existing.clientIds.length) ? existing.clientIds : existing.clients;
      if (type === 'routes' && f.authorizedBunks === undefined && existing.authorizedBunks) rec.authorizedBunks = existing.authorizedBunks;
      return { rec: normalizeRecord(type, rec, false), isNew: false };
    });

    if (!items.length) {
      showToast('warning', 'Nothing imported', problems.length ? `${problems.length} row${problems.length > 1 ? 's' : ''} skipped. ${problems.slice(0, 3).join(' · ')}` : 'No usable rows found.');
      if (problems.length) console.warn(`[${m.title} import] skipped rows:\n` + problems.join('\n'));
      return;
    }
    saveMasterMany(type, items);
    items.forEach(({ rec }) => { if (type === 'vehicles' && rec.tank) setVehTank(rec.id, rec.tank); });
    const added = items.filter(x => x.isNew).length;
    const summary = `${added} added · ${items.length - added} updated`;
    if (problems.length) {
      console.warn(`[${m.title} import] skipped rows:\n` + problems.join('\n'));
      showToast('warning', 'Import finished with skipped rows', `${summary} · ${problems.length} skipped. ${problems.slice(0, 3).join(' · ')}${problems.length > 3 ? ' · …' : ''}`);
    } else {
      showToast('success', 'Import complete', `${summary}.`);
    }
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

  const nowrap = { whiteSpace: 'nowrap' };
  // m.cells(r) builds every cell of a row at once; cache it so each column reuses the same result.
  const cellCache = new Map();
  const cellsOf = r => {
    if (!cellCache.has(r.id)) cellCache.set(r.id, m.cells(r));
    return cellCache.get(r.id);
  };

  const recordColumns = [
    ...m.cols.map((c, ci) => ({
      title: c,
      key: `col-${ci}`,
      onCell: () => ({ style: nowrap }),
      render: (_, r, rIdx) => {
        const cell = cellsOf(r)[ci];
        const isBunksCol = c === 'Authorized Fuel Bunks';
        if (isBunksCol) {
          const isNearBottom = rIdx >= pageRowCount - 2 && pageRowCount > 2;
          return (
            <RouteBunksCell
              route={r}
              tms={tms}
              isOpen={activeBunksPopover === r.id}
              onToggle={() => setActiveBunksPopover(activeBunksPopover === r.id ? null : r.id)}
              onEditRoute={() => handleEditRecord(r)}
              onDeleteBunk={(bunkName) => handleDeleteBunkFromRoute(r, bunkName)}
              isNearBottom={isNearBottom}
            />
          );
        }
        if (cell.badge) return <Tag color={cell.tag}>{cell.v}</Tag>;
        if (cell.password) {
          if (!cell.v) return <Typography.Text type="secondary">Not set</Typography.Text>;
          const shown = !!shownPw[cell.id];
          return (
            <Space size={8} onClick={e => e.stopPropagation()}>
              <span style={{ fontFamily: shown ? 'var(--font-mono)' : 'inherit', letterSpacing: shown ? 0 : '0.15em', color: 'var(--text-heading)' }}>
                {shown ? cell.v : '••••••••'}
              </span>
              <Button
                type="text"
                size="small"
                onClick={() => setShownPw(p => ({ ...p, [cell.id]: !shown }))}
                aria-label={shown ? `Hide password for ${cell.name}` : `Show password for ${cell.name}`}
                icon={shown ? <EyeOff size={16} /> : <Eye size={16} />}
              />
            </Space>
          );
        }
        if (cell.brand) return <Typography.Text strong style={{ color: 'var(--text-brand)' }}>{cell.v}</Typography.Text>;
        return cell.strong ? <Typography.Text strong>{cell.v}</Typography.Text> : cell.v;
      },
    })),
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      onCell: () => ({ style: nowrap }),
      render: (_, r) => {
        const isPendingDriver = type === 'drivers' && (approvals[r.id] || r.approval) === 'Pending approval';
        return (
          <Space size={8} onClick={e => e.stopPropagation()} aria-label={`Actions for ${r.name || r.number}`}>
            {m.rowLink && (
              <Tooltip title={`Open ${m.singular} profile`}>
                <Button type="text" size="small" className="tms-row-action tms-row-action--view" icon={<Eye size={16} strokeWidth={2} />} aria-label={`Open ${m.singular} profile`} onClick={() => navigate(m.rowLink(r))} />
              </Tooltip>
            )}
            {canEdit && (
              <Tooltip title={`Edit ${m.singular}`}>
                <Button type="text" size="small" className="tms-row-action" icon={<Pencil size={16} strokeWidth={2} />} aria-label={`Edit ${m.singular}`} onClick={() => handleEditRecord(r)} />
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip title={`Delete ${m.singular}`}>
                <Button type="text" size="small" className="tms-row-action" danger icon={<Trash2 size={16} strokeWidth={2} />} aria-label={`Delete ${m.singular}`} onClick={() => handleDeleteRecord(r)} />
              </Tooltip>
            )}
            {isPendingDriver && (
              <Tooltip title="Review driver request">
                <Button
                  type="text"
                  size="small"
                  className="tms-row-action tms-row-action--accent"
                  icon={<UserCheck size={16} strokeWidth={2} />}
                  aria-label="Review driver request"
                  onClick={() => setDrawer({ isDriverReq: true, reqId: r.id, kicker: 'Pending driver', title: r.name })}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  const hasBunkQueue = type === 'routes' || type === 'bunks';
  const pendingBunkReqs = (bunkReqs || []).filter(r => r.status === 'Pending');
  const showRequests = hasBunkQueue && bunkView === 'requests';
  // Pending first, then decided ones (newest decision on top) as a short history.
  const requestRows = (bunkReqs || [])
    .filter(r => matchesSearch(debouncedMasterQ, r.bunkName, r.routeName, r.supervisorName, r.tripNumber))
    .sort((x, y) => (x.status === 'Pending' ? 0 : 1) - (y.status === 'Pending' ? 0 : 1));
  const requestColumns = [
    {
      title: 'Bunk', dataIndex: 'bunkName',
      render: (v) => (
        <Flex align="center" gap={8}>
          <Fuel size={16} strokeWidth={2} color="var(--kr-saffron-600)" />
          <Typography.Text strong style={nowrap}>{v}</Typography.Text>
        </Flex>
      ),
    },
    { title: 'Route', dataIndex: 'routeName', render: (v) => <span style={nowrap}>{v || '—'}</span> },
    { title: 'Requested by', dataIndex: 'supervisorName', render: (v) => <span style={nowrap}>{v}</span> },
    { title: 'Trip', dataIndex: 'tripNumber', render: (v) => v || 'Close Trip' },
    { title: 'Requested', dataIndex: 'requestedAt', render: (v) => <span style={nowrap}>{v}</span> },
    {
      title: 'Status', dataIndex: 'status',
      render: (v, r) => (
        <Flex vertical gap={2}>
          <Tag color={v === 'Approved' ? 'success' : v === 'Rejected' ? 'error' : 'warning'} style={{ width: 'fit-content' }}>
            {v === 'Pending' ? 'Awaiting approval' : v}
          </Tag>
          {r.decidedAt && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{r.decidedAt}</Typography.Text>}
        </Flex>
      ),
    },
    {
      title: 'Actions', key: 'act', align: 'right', fixed: 'right',
      render: (_, r) => (r.status === 'Pending' ? (
        <Space size={8} wrap={false}>
          <Button type="primary" size="small" icon={<Check size={15} strokeWidth={2.4} />} onClick={() => decideBunkRequest(r.id, 'Approved')}>
            Approve &amp; authorize
          </Button>
          <Button danger size="small" icon={<X size={15} strokeWidth={2.4} />} onClick={() => decideBunkRequest(r.id, 'Rejected')}>
            Reject
          </Button>
        </Space>
      ) : <Typography.Text type="secondary">—</Typography.Text>),
    },
  ];

  return (
    <Flex vertical gap={20}>
      {/* Driver Approval Queue banner */}
      {/* {type === 'drivers' && drvQueue.length > 0 && (
        <Alert
          type="success"
          aria-label="Driver approval queue"
          title={<Typography.Text strong>Approval queue · {drvQueue.length} pending</Typography.Text>}
          description={
            <Flex vertical gap={10}>
              <Typography.Text>
                Driver requests from supervisors. Drivers cannot be assigned until approved; the supervisor app updates as soon as you decide.
              </Typography.Text>
              {drvQueue.map(q => (
                <Card key={q.id} size="small">
                  <Flex align="center" gap={14} wrap>
                    <Tag>{q.initials}</Tag>
                    <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Flex align="center" gap={8} wrap>
                        <Typography.Text strong>{q.name}</Typography.Text>
                        <Tag color="success">{q.tag}</Tag>
                        {q.hasDocs && <Typography.Text type="secondary">· {q.docs}</Typography.Text>}
                      </Flex>
                      <Typography.Text>{q.sub}</Typography.Text>
                    </Flex>
                    <Space wrap>
                      <Button onClick={q.review}>Review</Button>
                      {canEdit && <Button type="primary" onClick={q.approve}>Approve</Button>}
                      {canEdit && <Button danger onClick={q.reject}>Reject</Button>}
                    </Space>
                  </Flex>
                </Card>
              ))}
            </Flex>
          }
        />
      )} */}

      {/* Main Table Card */}
      <Card styles={{ body: { padding: 0 } }}>
        <Flex
          justify="space-between"
          align="center"
          gap={12}
          wrap
          className="tms-toolbar"
          style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-default)' }}
        >
          <Flex gap={12} align="center" wrap className="tms-toolbar-main">
            <Typography.Text type="secondary" style={nowrap}>
              {showRequests
                ? <><Typography.Text strong>{pendingBunkReqs.length}</Typography.Text> pending {pendingBunkReqs.length === 1 ? 'request' : 'requests'}</>
                : <><Typography.Text strong>{rows.length}</Typography.Text> {m.plural}</>}
            </Typography.Text>
            <Input
              className="tms-search"
              prefix={<Search size={16} strokeWidth={2} />}
              allowClear
              placeholder={m.searchPh}
              value={masterQ}
              onChange={(e) => setMasterQ(e.target.value)}
              style={{ width: 240, maxWidth: '100%' }}
            />

            {/* Loading Location Master: choose the client before adding anything */}
            {type === 'locations' && (
              <Select
                value={locClient === '' || locClient == null ? undefined : locClient}
                onChange={(v) => setLocClient(v === undefined ? '' : v)}
                options={[{ value: '', label: 'Select a client…' }, ...clientOpts]}
                placeholder="Select a client…"
                aria-label="Client"
                showSearch
                optionFilterProp="label"
                popupMatchSelectWidth={false}
                style={{ width: 230, maxWidth: '100%' }}
              />
            )}

            {/* Route / Bunk master: switch between the records and the bunk approval requests.
                Requests live in their own table so a long queue never pushes the routes down. */}
            {hasBunkQueue && (
              <Space size={8} wrap>
                <Button
                  className="tms-filter-pill"
                  style={{ '--pill': 'var(--color-brand)' }}
                  aria-pressed={bunkView === 'approved'}
                  icon={<BadgeCheck size={16} strokeWidth={2} />}
                  onClick={() => setBunkView('approved')}
                >
                  Approved
                </Button>
                <Button
                  className="tms-filter-pill"
                  style={{ '--pill': '#c26a00' }}
                  aria-pressed={bunkView === 'requests'}
                  icon={<Clock size={16} strokeWidth={2} />}
                  onClick={() => setBunkView('requests')}
                >
                  Request approval
                  {pendingBunkReqs.length > 0 && <span className="tms-pill-count">{pendingBunkReqs.length}</span>}
                </Button>
              </Space>
            )}

            {/* Driver Approval Filter Pills (click the active one again to clear it) */}
            {type === 'drivers' && (
              <Space size={8} wrap>
                <Button
                  className="tms-filter-pill"
                  style={{ '--pill': 'var(--color-brand)' }}
                  aria-pressed={driverApprovalFilter === 'Approved'}
                  icon={<BadgeCheck size={16} strokeWidth={2} />}
                  onClick={() => setDriverApprovalFilter(driverApprovalFilter === 'Approved' ? '' : 'Approved')}
                >
                  Approved
                </Button>
                <Button
                  className="tms-filter-pill"
                  style={{ '--pill': '#c26a00' }}
                  aria-pressed={driverApprovalFilter === 'Pending approval'}
                  icon={<Clock size={16} strokeWidth={2} />}
                  onClick={() => setDriverApprovalFilter(driverApprovalFilter === 'Pending approval' ? '' : 'Pending approval')}
                >
                  Request approval
                </Button>
              </Space>
            )}
          </Flex>

          {/* Hidden native file picker, opened by the Import button (keeps handleImportFile's change-event contract).
              Kept outside the Space so it does not take an empty slot in the button row. */}
          {canAdd && <input ref={importRef} type="file" accept=".xlsx,.csv,.tsv,.txt,.xls,.xml,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={handleImportFile} style={{ display: 'none' }} />}
          <Space wrap className="tms-toolbar-actions" style={showRequests ? { display: 'none' } : undefined}>
            {canAdd && (
              <Button
                onClick={() => FILE_TRANSFER_ENABLED && importRef.current && importRef.current.click()}
                title="Import .xlsx or .csv — headings in the first row"
              >
                Import from Excel
              </Button>
            )}
            {canAdd && (
              <Button
                type="primary"
                onClick={handleNewRecord}
                disabled={addBlocked}
                title={addBlocked ? 'Select a client first — a loading location belongs to one client.' : m.addLabel}
              >
                {m.addLabel}
              </Button>
            )}
          </Space>
        </Flex>

        {showRequests && (
          <Table
            columns={requestColumns}
            dataSource={requestRows}
            rowKey="id"
            tableLayout="auto"
            scroll={{ x: 1100 }}
            pagination={{ pageSize: 10, hideOnSinglePage: true, showTotal: (total, [from, to]) => `Showing ${from} to ${to} of ${total} requests` }}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={masterQ ? <>No requests match &ldquo;{masterQ}&rdquo;.</> : 'No bunk requests from supervisors.'} /> }}
          />
        )}

        {/* Records Table */}
        {!showRequests && <Table
          columns={recordColumns}
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
            showTotal: (total, [from, to]) => `Showing ${from} to ${to} of ${total} ${m.plural}`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Flex vertical gap={4}>
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      {addBlocked ? 'Select a client to begin' : `No ${m.plural} found`}
                    </Typography.Title>
                    <Typography.Text type="secondary">
                      {addBlocked
                        ? 'A loading location belongs to one client. Pick the client above to see its locations and add new ones.'
                        : <>Nothing matches &ldquo;{masterQ}&rdquo;. Add the record or clear the search.</>}
                    </Typography.Text>
                  </Flex>
                }
              >
                {canAdd && !addBlocked && (
                  <Button type="primary" onClick={handleNewRecord}>
                    {m.addLabel}
                  </Button>
                )}
              </Empty>
            ),
          }}
        />}
      </Card>
    </Flex>
  );
};

export default MasterManager;
