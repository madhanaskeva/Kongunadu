import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, FileText, MapPin, Phone, Plus } from 'lucide-react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { RowActions } from '../../../components/common/RowActions';
import { Pagination, usePagination } from '../../../components/common/Pagination';
import { matchesSearch } from '../../../utils/search';

// Seed rows merged with admin additions/edits (same rule as MasterManager)
const mergeEdits = (edits, seed) => {
  // Seed lists from T() already include saved adds; only overlay edits here.
  const ed = (edits || {}).edited || {};
  return seed.map(r => (ed[r.id] ? { ...r, ...ed[r.id] } : r));
};

const badgeTone = v =>
  /Active/.test(v)
    ? ['var(--color-brand-soft)', 'var(--kr-green-800)']
    : /hold|review/i.test(v)
    ? ['var(--color-hazard-soft)', '#7A4300']
    : ['var(--kr-grey-100)', 'var(--kr-grey-700)'];

const Badge = ({ v }) => {
  const [bg, fg] = badgeTone(v);
  return (
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
      }}
    >
      {v || '—'}
    </span>
  );
};

const thStyle = {
  padding: '10px 14px',
  fontFamily: 'var(--font-display)',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  whiteSpace: 'nowrap',
  textAlign: 'left',
};

const btnPrimary = {
  all: 'unset',
  cursor: 'pointer',
  padding: '0 14px',
  height: '32px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-brand)',
  color: '#fff',
  fontSize: '13px',
  fontWeight: 700,
};

const btnSecondary = {
  ...btnPrimary,
  background: '#fff',
  color: 'var(--text-heading)',
  border: '1px solid var(--border-strong)',
  fontWeight: 600,
};

export const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { T, masterEdits, deleted, setDeleted, setDrawer, setForm, setFormError, setConfirm, showToast } = useTMSAdmin();
  const [q, setQ] = useState('');
  const { can } = useModuleAccess();
  const tms = T();

  const client = mergeEdits(masterEdits.clients, tms.clients || []).find(c => c.id === id);
  const customers = mergeEdits(masterEdits.customers, tms.customers || []).filter(u => u.client === id && !deleted.includes(u.id));
  const routeName = rid => (tms.R[rid] || {}).name || rid || '—';
  const rows = customers.filter(u => matchesSearch(q, u.name, u.city, routeName(u.route), u.billing, u.status));
  const pg = usePagination(rows, [id, q]);

  if (!client || deleted.includes(id)) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', background: '#fff', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--text-heading)' }}>Client not found</div>
        <p style={{ margin: '6px 0 16px', color: 'var(--text-muted)', fontSize: '14px' }}>It may have been deleted. Go back to the client list.</p>
        <button onClick={() => navigate('/admin/masters/clients')} style={btnPrimary}>Back to clients</button>
      </div>
    );
  }

  const vehicles = (tms.vehicles || []).filter(v => (v.clients || []).includes(id));
  const trips = (tms.trips || []).filter(t => t.client === id);
  const supervisors = (tms.supervisors || []).filter(s => (s.clientIds || []).includes(id));
  const activeCust = customers.filter(u => u.status === 'Active').length;

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
    [Phone, 'Contact', client.contact],
    [MapPin, 'Supervisors', supervisors.map(s => s.name).join(', ') || 'None mapped'],
  ];

  const stats = [
    ['Customers', customers.length, `${activeCust} active`],
    ['Vehicles mapped', vehicles.length, vehicles.slice(0, 2).map(v => v.number).join(', ') || 'None'],
    ['Trips', trips.length, `${trips.filter(t => t.status === 'Enroute').length} enroute now`],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <button
        onClick={() => navigate('/admin/masters/clients')}
        style={{ all: 'unset', cursor: 'pointer', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-brand)' }}
      >
        <ArrowLeft size={16} /> All clients
      </button>

      {/* Profile card */}
      <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderTop: '4px solid var(--color-brand)', borderRadius: 'var(--radius-lg)', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span
            style={{
              flex: 'none',
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'var(--color-brand-soft)',
              color: 'var(--color-brand)',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '20px',
            }}
          >
            {initials}
          </span>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', color: 'var(--text-heading)' }}>{client.name}</h2>
              <Badge v={client.status} />
            </div>
            <div style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>Client ID {client.id}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {facts.map(([Icon, label, value]) => (
            <div key={label} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <Icon size={18} color="var(--kr-grey-700)" style={{ flex: 'none', marginTop: '2px' }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)', marginTop: '2px' }}>{value || '—'}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {stats.map(([label, value, sub]) => (
            <div key={label} style={{ background: 'var(--color-brand-tint)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '26px', lineHeight: 1.1, color: 'var(--text-heading)', marginTop: '4px' }}>{value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Customers table */}
      <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '12px 18px', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
              Customers · {customers.length}
            </h3>
            <input
              type="text"
              placeholder="Search customer or city"
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{ width: '240px', height: '36px', padding: '0 12px', fontSize: '14px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', outline: 'none' }}
            />
          </div>
          {can('clients', 'add') && (
            <button onClick={() => openCustomerForm(null)} style={btnSecondary}>
              <Plus size={16} /> Add customer
            </button>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '760px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-muted)' }}>
                {['Customer', 'City', 'Route', 'Billing', 'Status'].map(c => (
                  <th key={c} style={thStyle}>{c}</th>
                ))}
                <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pg.rows.map(u => (
                <tr key={u.id} style={{ borderTop: '1px solid var(--border-default)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-heading)' }}>{u.name}</td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{u.city || '—'}</td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{routeName(u.route)}</td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{u.billing || '—'}</td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}><Badge v={u.status} /></td>
                  <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                    <RowActions
                      onEdit={can('clients', 'edit') ? () => openCustomerForm(u) : undefined}
                      onDelete={can('clients', 'delete') ? () => deleteCustomer(u) : undefined}
                      editLabel="Edit customer"
                      deleteLabel="Delete customer"
                      buttonAriaLabel={`Actions for ${u.name}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length > 0 && <Pagination {...pg} noun="customers" />}
        {rows.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '17px', color: 'var(--text-heading)' }}>
              {customers.length ? 'No customers match' : 'No customers yet'}
            </div>
            <p style={{ margin: '6px 0 16px', color: 'var(--text-muted)', fontSize: '14px' }}>
              {customers.length
                ? `Nothing matches “${q}”.`
                : `Add the delivery points for ${client.name}. Supervisors pick from this list when unloading.`}
            </p>
            {!customers.length && can('clients', 'add') && (
              <button onClick={() => openCustomerForm(null)} style={btnPrimary}>
                <Plus size={16} /> Add customer
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default ClientProfile;
