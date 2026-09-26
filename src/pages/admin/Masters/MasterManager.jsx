import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Eye, Pencil, Trash2, X, Plus, Fuel } from 'lucide-react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { readSheet } from '../../../utils/spreadsheet';
import { RowActions } from '../../../components/common/RowActions';
import { Pagination, usePagination } from '../../../components/common/Pagination';
import { matchesSearch } from '../../../utils/search';
import { SelectField } from '../../../components/common/SelectField';

const RouteBunksCell = ({ route, tms, isOpen, onToggle, onEditRoute, onDeleteBunk, isNearBottom = false }) => {
  const rawBunks = route.authorizedBunks || [];
  const bunkNames = rawBunks.map(bId => (tms.F[bId] || {}).name || bId);
  const count = bunkNames.length;
  const cellRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (cellRef.current && !cellRef.current.contains(e.target)) {
        onToggle();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen, onToggle]);

  return (
    <div ref={cellRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '12px',
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: 'var(--radius-md)',
          background: count > 0 ? 'var(--color-brand-tint)' : 'var(--surface-muted)',
          color: count > 0 ? 'var(--kr-green-900)' : 'var(--text-muted)',
          border: `1px solid ${count > 0 ? 'rgba(0, 98, 63, 0.25)' : 'var(--border-default)'}`,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Fuel size={13} style={{ color: count > 0 ? 'var(--color-brand)' : 'var(--text-muted)' }} />
        {count} {count === 1 ? 'Bunk' : 'Bunks'}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        title="View authorized fuel bunks list"
        aria-label="View authorized fuel bunks"
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-strong)',
          background: isOpen ? 'var(--color-brand)' : '#fff',
          color: isOpen ? '#fff' : 'var(--text-heading)',
          transition: 'all 0.15s ease',
        }}
      >
        <Eye size={15} />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: isNearBottom ? 'auto' : 'calc(100% + 8px)',
            bottom: isNearBottom ? 'calc(100% + 8px)' : 'auto',
            right: 0,
            zIndex: 100,
            width: '320px',
            maxWidth: 'min(320px, calc(100vw - 32px))',
            boxSizing: 'border-box',
            background: '#fff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-strong)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Pointer indicator arrow aligned directly beneath/above the eye button */}
          <div
            style={{
              position: 'absolute',
              top: isNearBottom ? 'auto' : '-5px',
              bottom: isNearBottom ? '-5px' : 'auto',
              right: '9px',
              width: '10px',
              height: '10px',
              background: '#fff',
              borderLeft: isNearBottom ? 'none' : '1px solid var(--border-strong)',
              borderTop: isNearBottom ? 'none' : '1px solid var(--border-strong)',
              borderRight: isNearBottom ? '1px solid var(--border-strong)' : 'none',
              borderBottom: isNearBottom ? '1px solid var(--border-strong)' : 'none',
              transform: 'rotate(45deg)',
              zIndex: 1,
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '8px', position: 'relative', zIndex: 2 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 800, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Fuel size={15} style={{ color: 'var(--color-brand)' }} />
              Authorized Fuel Bunks ({count})
            </span>
            <button
              type="button"
              onClick={onToggle}
              style={{ all: 'unset', cursor: 'pointer', color: 'var(--text-muted)', display: 'grid', placeItems: 'center' }}
            >
              <X size={16} />
            </button>
          </div>

          {count === 0 ? (
            <div style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
              <div>No authorized bunks added for this route.</div>
              <button
                type="button"
                onClick={() => {
                  onToggle();
                  onEditRoute();
                }}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  marginTop: '8px',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-brand)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={14} /> Add Bunks in Edit Form
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
              {bunkNames.map((bunkName, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border-default)',
                    fontSize: '13px',
                  }}
                >
                  <span
                    title={bunkName}
                    style={{
                      fontWeight: 600,
                      color: 'var(--text-heading)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <strong style={{ color: 'var(--color-brand)', marginRight: '6px' }}>{idx + 1}.</strong>
                    {bunkName}
                  </span>

                  <div style={{ display: 'flex', gap: '4px', flex: 'none' }}>
                    <button
                      type="button"
                      onClick={() => {
                        onToggle();
                        onEditRoute();
                      }}
                      title="Edit route authorized bunks"
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background: '#fff',
                        border: '1px solid var(--border-default)',
                        color: 'var(--color-brand)',
                        display: 'grid',
                        placeItems: 'center',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteBunk(bunkName)}
                      title="Delete this authorized bunk"
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--kr-red-50)',
                        border: '1px solid var(--kr-red-100)',
                        color: 'var(--kr-red-600)',
                        display: 'grid',
                        placeItems: 'center',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--kr-red-50)')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
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
  const [activeBunksPopover, setActiveBunksPopover] = useState(null);
  // Loading Location Master: pick the client first — locations belong to one client,
  // so there is nothing sensible to add until we know whose location it is.
  const [locClient, setLocClient] = useState('');

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
  // One active supervisor per branch: a branch that already has one is not offered again,
  // except to the supervisor being edited, who keeps their own branch.
  const freeBranchOpts = (self) => branchOpts.filter(o =>
    (self && self.branch === o.value) ||
    !(tms.supervisors || []).some(s => s.status === 'Active' && s.branch === o.value && (!self || s.id !== self.id)));
  const clientList = mdata('clients', tms.clients || []);
  const clientOpts = clientList.map(c => ({ value: c.id, label: c.name }));
  // Loading locations are owned by exactly one client, so both masters read the same list.
  const locationList = mdata('locations', tms.locations || []);
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
      cols: ['Client', 'GSTIN', 'Branch', 'Loading Locations', 'Phone', 'Supervisors', 'Customers', 'Status'],
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
        ['loadingLocations', 'Loading locations', 'locations-input', 'Type a loading location (e.g. Sriperumbudur Cryogenic Hub)'],
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
        { ...txtCell(l.clientName || '—', true), color: l.clientName && l.clientName !== '—' ? 'var(--text-brand)' : 'var(--text-body)' },
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
      required: ['client', 'name'],
      validate: (f) => ({
        client: !f.client ? 'Select the client this loading location belongs to.' : undefined,
        name: !String(f.name || '').trim() ? 'Enter the location name.' : undefined,
      }),
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
    (type !== 'locations' || !locClient || (r.clientId || r.client) === locClient) &&
    !deleted.includes(r.id) &&
    matchesSearch(masterQ, Object.values(r), (tms.B[r.branch] || {}).name) &&
    (type !== 'drivers' || !driverApprovalFilter || (approvals[r.id] || r.approval || 'Approved') === driverApprovalFilter)
  );
  const rowsPg = usePagination(rows, [type, masterQ, driverApprovalFilter, locClient]);

  // Nothing to add on the Loading Location page until a client is picked.
  const addBlocked = type === 'locations' && !locClient;

  const handleNewRecord = () => {
    if (addBlocked) return;
    setDrawer({
      isForm: true,
      isMaster: true,
      masterKey: type,
      kicker: 'New ' + m.singular,
      title: m.addLabel,
      saveLabel: 'Create ' + m.singular,
      required: m.required || m.fields.filter(f => f[2] !== 'section').slice(0, 2).map(f => f[0]),
      fields: fieldsFor(null),
      validate: m.validate ? f => m.validate(f, true) : null,
    });
    setForm(
      type === 'supervisors'
        ? { clients: [] }
        : type === 'clients'
        ? { supervisors: [], status: 'Active', loadingLocations: [] }
        : type === 'locations'
        ? { status: 'Active', radius: 100, client: locClient, branch: (clientList.find(c => c.id === locClient) || {}).branch || '' }
        : {}
    );
    setFormError('');
  };

  // Supervisor branch dropdown drops branches that already have an active supervisor.
  const fieldsFor = (rec) => type === 'supervisors'
    ? m.fields.map(f => (f[0] === 'branch' ? [f[0], f[1], freeBranchOpts(rec), ...f.slice(3)] : f))
    : m.fields;

  const handleEditRecord = (rec) => {
    setDrawer({
      isForm: true,
      isMaster: true,
      masterKey: type,
      kicker: 'Edit ' + m.singular,
      title: rec.name || rec.number,
      saveLabel: 'Save changes',
      required: m.required || m.fields.filter(f => f[2] !== 'section').slice(0, 2).map(f => f[0]),
      fields: fieldsFor(rec),
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
    const initialAuthBunks = (rec.authorizedBunks || []).map(b => (tms.F[b] || {}).name || b);
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
      if (!errs.length && type === 'supervisors' && (merged.status || 'Active') === 'Active' && merged.branch) {
        const selfId = existing && existing.id;
        const clash = (tms.supervisors || []).find(s => s.status === 'Active' && s.branch === merged.branch && s.id !== selfId)
          || [...pending.values()].find(p => p.f !== (prev && prev.f) && (p.f.status || 'Active') === 'Active' && p.f.branch === merged.branch);
        if (clash) errs.push(`${bn(merged.branch)} already has an active supervisor`);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Bunk Approval Queue banner for Routes / Bunks */}
      {(type === 'routes' || type === 'bunks') && (bunkReqs || []).filter(r => r.status === 'Pending').length > 0 && (
        <section
          aria-label="Bunk approval queue"
          style={{
            background: 'var(--color-hazard-soft)',
            border: '1px solid rgba(230, 160, 0, 0.3)',
            borderLeft: '4px solid var(--kr-saffron-500)',
            borderRadius: 'var(--radius-lg)',
            color: '#7A4300',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '14px 18px 12px' }}>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Pending Bunk Approvals · {(bunkReqs || []).filter(r => r.status === 'Pending').length} requested
            </strong>
            <div style={{ fontSize: '14px', marginTop: '2px' }}>
              New bunks entered by supervisors during trip closing. Approving a bunk adds it to Master Bunks and automatically authorizes it for the route.
            </div>
          </div>

          {(bunkReqs || []).filter(r => r.status === 'Pending').map(q => (
            <div
              key={q.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                flexWrap: 'wrap',
                padding: '12px 18px',
                borderTop: '1px solid rgba(230, 160, 0, 0.2)',
                background: '#fff',
              }}
            >
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-heading)' }}>{q.bunkName}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--color-hazard-soft)', color: '#7A4300' }}>
                    New Bunk Request
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Route: <strong>{q.routeName || '—'}</strong> · Requested by {q.supervisorName} (Trip #{q.tripNumber || 'Close Trip'}) · {q.requestedAt}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => decideBunkRequest(q.id, 'Approved')}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    height: '32px',
                    padding: '0 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-brand)',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  Approve & Authorize
                </button>
                <button
                  type="button"
                  onClick={() => decideBunkRequest(q.id, 'Rejected')}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    height: '32px',
                    padding: '0 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--kr-red-600)',
                    color: 'var(--kr-red-600)',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

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

            {/* Loading Location Master: choose the client before adding anything */}
            {type === 'locations' && (
              <SelectField
                value={locClient}
                onChange={setLocClient}
                options={clientOpts}
                allLabel="Select a client…"
                ariaLabel="Client"
                width="230px"
                height={36}
              />
            )}

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
            {canAdd && <input ref={importRef} type="file" accept=".xlsx,.csv,.tsv,.txt,.xls,.xml,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={handleImportFile} style={{ display: 'none' }} />}
            {canAdd && (
              <button
                type="button"
                onClick={() => importRef.current && importRef.current.click()}
                title="Import .xlsx or .csv — headings in the first row"
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
                disabled={addBlocked}
                title={addBlocked ? 'Select a client first — a loading location belongs to one client.' : m.addLabel}
                style={{
                  all: 'unset',
                  cursor: addBlocked ? 'not-allowed' : 'pointer',
                  opacity: addBlocked ? 0.5 : 1,
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
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                      color: 'var(--text-heading)',
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
                    color: 'var(--text-heading)',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rowsPg.rows.map((r, rIdx) => {
                const cells = m.cells(r);
                const isPendingDriver = type === 'drivers' && (approvals[r.id] || r.approval) === 'Pending approval';
                const isNearBottom = rIdx >= rowsPg.rows.length - 2 && rowsPg.rows.length > 2;
                return (
                  <tr
                    key={r.id}
                    style={{ borderTop: '1px solid var(--border-default)' }}
                  >
                    {cells.map((c, ci) => {
                      const isBunksCol = m.cols[ci] === 'Authorized Fuel Bunks';
                      if (isBunksCol) {
                        return (
                          <td key={ci} style={{ padding: '12px 14px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                            <RouteBunksCell
                              route={r}
                              tms={tms}
                              isOpen={activeBunksPopover === r.id}
                              onToggle={() => setActiveBunksPopover(activeBunksPopover === r.id ? null : r.id)}
                              onEditRoute={() => handleEditRecord(r)}
                              onDeleteBunk={(bunkName) => handleDeleteBunkFromRoute(r, bunkName)}
                              isNearBottom={isNearBottom}
                            />
                          </td>
                        );
                      }
                      return (
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
                      );
                    })}
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
              {addBlocked ? 'Select a client to begin' : `No ${m.plural} found`}
            </div>
            <p style={{ margin: '6px 0 16px', color: 'var(--text-muted)', fontSize: '14px' }}>
              {addBlocked
                ? 'A loading location belongs to one client. Pick the client above to see its locations and add new ones.'
                : <>Nothing matches &ldquo;{masterQ}&rdquo;. Add the record or clear the search.</>}
            </p>
            {canAdd && !addBlocked && (
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
