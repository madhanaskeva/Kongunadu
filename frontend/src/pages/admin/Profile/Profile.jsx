import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, KeyRound, LogOut, Mail, Pencil, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useTMSAdmin } from '../../../context/TMSAdminContext';

const cardStyle = {
  background: '#fff',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
};

const cardHeadStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '14px 18px',
  borderBottom: '1px solid var(--border-default)',
};

const h2Style = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  fontSize: '15px',
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  color: 'var(--text-heading)',
};

const subStyle = { fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' };

const labelStyle = { fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' };

const inputStyle = err => ({
  width: '100%',
  boxSizing: 'border-box',
  height: '40px',
  padding: '0 12px',
  fontSize: '14px',
  borderRadius: 'var(--radius-md)',
  border: `1px solid ${err ? 'var(--kr-red-600)' : 'var(--border-strong)'}`,
  outline: 'none',
  background: '#fff',
});

const btnPrimary = {
  all: 'unset',
  cursor: 'pointer',
  padding: '0 16px',
  height: '38px',
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

const Field = ({ label, error, hint, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label style={labelStyle}>{label}</label>
    {children}
    {error ? (
      <span style={{ fontSize: '12px', color: 'var(--kr-red-700)', fontWeight: 600 }}>{error}</span>
    ) : hint ? (
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{hint}</span>
    ) : null}
  </div>
);

const PasswordInput = ({ value, onChange, error, autoComplete }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        style={{ ...inputStyle(error), paddingRight: '42px' }}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? 'Hide password' : 'Show password'}
        style={{ all: 'unset', cursor: 'pointer', position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'grid', color: 'var(--text-muted)' }}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const Profile = () => {
  const navigate = useNavigate();
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { showToast, T, saveMaster } = useTMSAdmin();
  const u = user || {};
  // The signed-in account's row on Users & roles (sign-in checks it)
  const portalRec = (T().users || []).find(x => x.id === u.id);
  const syncPortalUser = changes => portalRec && saveMaster('users', { ...portalRec, ...changes }, false);

  const initialDetails = { name: u.name || '', email: u.email || '', phone: u.phone || '' };
  const [editing, setEditing] = useState(false);
  const [details, setDetails] = useState(initialDetails);
  const [detailErr, setDetailErr] = useState({});

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErr, setPwErr] = useState({});

  // Same initials as the header avatar
  const shortName = u.role === 'Administrator' ? 'Admin' : u.name || 'Admin';
  const nameWords = shortName.split(' ').filter(Boolean);
  const initials = (nameWords.length > 1 ? nameWords[0][0] + nameWords[1][0] : shortName.slice(0, 2)).toUpperCase();
  const phoneText = u.phone ? '+91 ' + u.phone.replace(/(\d{5})(\d{5})/, '$1 $2') : '';
  const baseText = u.branch === 'All branches' || !u.branch ? 'HO - Chennai' : u.branch;

  const signOut = () => {
    logout();
    navigate('/');
  };

  const saveDetails = () => {
    const phoneDigits = details.phone.replace(/\D/g, '');
    const errs = {
      name: !details.name.trim() ? 'Enter your name.' : undefined,
      email: !emailOk(details.email.trim()) ? 'Enter a valid email address.' : undefined,
      phone: details.phone.trim() && phoneDigits.length !== 10 ? 'Enter a 10-digit mobile number.' : undefined,
    };
    setDetailErr(errs);
    if (Object.values(errs).some(Boolean)) return;
    const emailChanged = details.email.trim().toLowerCase() !== (u.email || '').toLowerCase();
    updateProfile({ name: details.name.trim(), email: details.email.trim(), phone: phoneDigits });
    syncPortalUser({ name: details.name.trim(), email: details.email.trim().toLowerCase(), phone: phoneDigits });
    setEditing(false);
    showToast('success', 'Profile updated', emailChanged ? `Sign in with ${details.email.trim()} from now on.` : 'Your account details are saved.');
  };

  const cancelDetails = () => {
    setDetails(initialDetails);
    setDetailErr({});
    setEditing(false);
  };

  const savePassword = () => {
    const errs = {
      current: !pw.current ? 'Enter your current password.' : undefined,
      next: pw.next.length < 8 ? 'Use at least 8 characters.' : pw.next === pw.current ? 'Choose a password different from the current one.' : undefined,
      confirm: pw.confirm !== pw.next ? 'Passwords do not match.' : undefined,
    };
    setPwErr(errs);
    if (Object.values(errs).some(Boolean)) return;
    if (portalRec && portalRec.password && portalRec.password !== pw.current) {
      setPwErr({ current: 'Current password is incorrect.' });
      return;
    }
    const res = changePassword(pw.current, pw.next);
    if (!res.success) {
      setPwErr({ current: res.error });
      return;
    }
    syncPortalUser({ password: pw.next });
    setPw({ current: '', next: '', confirm: '' });
    setPwErr({});
    showToast('success', 'Password changed', 'Use the new password next time you sign in.');
  };

  const readField = (Icon, label, value) => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'var(--surface-muted)' }}>
      <Icon size={18} color="var(--color-brand)" style={{ flex: 'none', marginTop: '2px' }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
        <div style={{ marginTop: '3px', fontSize: '14px', fontWeight: 600, color: value ? 'var(--text-heading)' : 'var(--text-muted)', overflowWrap: 'anywhere' }}>{value || 'Not added'}</div>
      </div>
    </div>
  );

  const asideRow = (label, value) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderTop: '1px solid var(--border-default)', fontSize: '13px' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--text-heading)', textAlign: 'right', overflowWrap: 'anywhere' }}>{value || '—'}</span>
    </div>
  );

  return (
    <div className="tms-profile">
      {/* Summary */}
      <aside className="tms-profile-aside" style={{ ...cardStyle, borderTop: '4px solid var(--color-brand)' }}>
        <div style={{ padding: '24px 20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px' }}>
          <span
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'var(--color-brand)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '28px',
              boxShadow: '0 0 0 4px var(--color-brand-soft)',
            }}
          >
            {initials}
          </span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: 'var(--text-heading)' }}>{u.name || 'Admin'}</div>
            <div style={{ ...subStyle, overflowWrap: 'anywhere' }}>{u.email}</div>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '999px',
              background: 'var(--color-brand-soft)',
              color: 'var(--kr-green-800)',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <ShieldCheck size={14} /> {u.role || 'Administrator'}
          </span>
        </div>
        <div style={{ padding: '0 20px 8px' }}>
          {asideRow('Branch access', u.branch || 'All branches')}
          {asideRow('Base', baseText)}
          {asideRow('User ID', u.id)}
        </div>
        <div style={{ padding: '12px 20px 20px' }}>
          <button
            onClick={signOut}
            style={{
              all: 'unset',
              cursor: 'pointer',
              boxSizing: 'border-box',
              width: '100%',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--kr-red-600)',
              background: 'var(--kr-red-50)',
              color: 'var(--kr-red-700)',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
        {/* Account details */}
        <section style={cardStyle}>
          <div style={cardHeadStyle}>
            <UserRound size={18} color="var(--color-brand)" />
            <div style={{ flex: 1 }}>
              <h2 style={h2Style}>Account details</h2>
              <div style={subStyle}>Your name, sign-in email and mobile number.</div>
            </div>
            {!editing && (
              <button onClick={() => { setDetails(initialDetails); setEditing(true); }} style={btnSecondary}>
                <Pencil size={14} /> Edit
              </button>
            )}
          </div>
          <div style={{ padding: '18px' }}>
            {!editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {readField(UserRound, 'Full name', u.name)}
                {readField(Mail, 'Email · sign-in', u.email)}
                {readField(Phone, 'Mobile number', phoneText)}
                {readField(Building2, 'Branch access', u.branch)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <Field label="Full name" error={detailErr.name}>
                  <input value={details.name} onChange={e => setDetails({ ...details, name: e.target.value })} style={inputStyle(detailErr.name)} autoComplete="name" />
                </Field>
                <Field label="Email · sign-in" error={detailErr.email} hint="You sign in with this email.">
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                    <input
                      type="email"
                      value={details.email}
                      onChange={e => setDetails({ ...details, email: e.target.value })}
                      style={{ ...inputStyle(detailErr.email), paddingLeft: '36px' }}
                      autoComplete="email"
                    />
                  </div>
                </Field>
                <Field label="Mobile number" error={detailErr.phone} hint="Optional · 10 digits">
                  <input
                    inputMode="numeric"
                    value={details.phone}
                    onChange={e => setDetails({ ...details, phone: e.target.value.replace(/[^\d ]/g, '').slice(0, 11) })}
                    placeholder="90031 55012"
                    style={inputStyle(detailErr.phone)}
                    autoComplete="tel"
                  />
                </Field>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-default)', paddingTop: '14px' }}>
                  <button onClick={cancelDetails} style={btnSecondary}>Cancel</button>
                  <button onClick={saveDetails} style={btnPrimary}>Save changes</button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Password */}
        <section style={cardStyle}>
          <div style={cardHeadStyle}>
            <KeyRound size={18} color="var(--color-brand)" />
            <div>
              <h2 style={h2Style}>Change password</h2>
              <div style={subStyle}>Use at least 8 characters. You stay signed in on this device.</div>
            </div>
          </div>
          <form
            onSubmit={e => { e.preventDefault(); savePassword(); }}
            style={{ padding: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}
          >
            <Field label="Current password" error={pwErr.current}>
              <PasswordInput value={pw.current} onChange={v => setPw({ ...pw, current: v })} error={pwErr.current} autoComplete="current-password" />
            </Field>
            <Field label="New password" error={pwErr.next}>
              <PasswordInput value={pw.next} onChange={v => setPw({ ...pw, next: v })} error={pwErr.next} autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password" error={pwErr.confirm}>
              <PasswordInput value={pw.confirm} onChange={v => setPw({ ...pw, confirm: v })} error={pwErr.confirm} autoComplete="new-password" />
            </Field>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-default)', paddingTop: '14px' }}>
              <button type="submit" style={btnPrimary}>Update password</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Profile;
