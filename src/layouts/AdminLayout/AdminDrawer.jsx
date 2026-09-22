import React, { useState } from 'react';
import { useTMSAdmin } from '../../context/TMSAdminContext';
import { Eye, EyeOff, X } from 'lucide-react';

const PasswordField = ({ value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        placeholder={placeholder}
        autoComplete="new-password"
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', height: '40px', padding: '0 40px 0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontFamily: 'inherit' }}
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

export const AdminDrawer = () => {
  const {
    drawer,
    setDrawer,
    form,
    setForm,
    formError,
    setFormError,
    excOverrides,
    setExcOverrides,
    excSel,
    excAssignee,
    setExcAssignee,
    excNote,
    setExcNote,
    drvReqs,
    rejectReason,
    setRejectReason,
    decideDriver,
    saveMaster,
    setVehTank,
    normalizeRecord,
    pushNotice,
    showToast,
    shrinkImage,
    navTo,
    T,
  } = useTMSAdmin();

  if (!drawer) return null;

  const tms = T();
  const closeDrawer = () => setDrawer(null);

  // Exception drawer handling
  const exc = (tms.exceptions || []).map(x => ({ ...x, ...(excOverrides[x.id] || {}) })).find(x => x.id === excSel) || {};
  const v = tms.V[exc.vehicle];
  const tr = tms.T[exc.trip];
  const excDetail = {
    ...exc,
    vehicleNumber: v ? v.number : '—',
    tripNumber: tr ? tr.number : '—',
    branchName: (tms.B[exc.branch] || {}).name,
    sevBg: exc.severity === 'High' ? 'var(--kr-red-100)' : exc.severity === 'Medium' ? 'var(--color-hazard-soft)' : 'var(--kr-grey-100)',
    sevFg: exc.severity === 'High' ? 'var(--kr-red-800)' : exc.severity === 'Medium' ? '#7A4300' : 'var(--kr-grey-700)',
    rows: [
      ['Type', exc.type],
      ['Vehicle', v ? v.number : '—'],
      ['Trip', tr ? tr.number : '—'],
      ['Branch', (tms.B[exc.branch] || {}).name],
      ['Raised', exc.raised],
      ['Assignee', exc.assignee],
    ],
  };

  const handleExcUnderReview = () => {
    const assignee = excAssignee || 'Head Office Admin';
    setExcOverrides(prev => ({ ...prev, [exc.id]: { ...(prev[exc.id] || {}), status: 'Under review', assignee } }));
    closeDrawer();
    showToast('info', 'Marked under review', `${exc.type} assigned to ${assignee}.`);
    pushNotice({
      kind: 'action',
      branch: exc.branch,
      title: `${exc.type} · under review`,
      body: exc.detail,
      rows: [
        ['Exception', `${exc.id} · ${exc.severity} severity`],
        ['Vehicle', excDetail.vehicleNumber],
        ['Trip', excDetail.tripNumber],
        ['Action taken', 'Marked under review'],
        ['Assigned to', assignee],
      ],
      link: exc.trip ? { trip: exc.trip } : null,
      linkLabel: 'View trip',
    });
  };

  const handleExcResolve = () => {
    if (!excNote.trim()) {
      showToast('warning', 'Resolution note required', 'Record what was found before resolving.');
      return;
    }
    const assignee = excAssignee || 'Head Office Admin';
    setExcOverrides(prev => ({ ...prev, [exc.id]: { ...(prev[exc.id] || {}), status: 'Resolved', assignee, note: excNote.trim(), resolvedAt: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) } }));
    closeDrawer();
    showToast('success', 'Exception resolved', `${exc.type} on ${excDetail.vehicleNumber} closed.`);
    pushNotice({
      kind: 'action',
      branch: exc.branch,
      title: `${exc.type} · resolved`,
      body: exc.detail,
      note: excNote,
      rows: [
        ['Exception', `${exc.id} · ${exc.severity} severity`],
        ['Vehicle', excDetail.vehicleNumber],
        ['Trip', excDetail.tripNumber],
        ['Action taken', 'Resolved by Head Office'],
        ['Resolution note', excNote],
      ],
      link: exc.trip ? { trip: exc.trip } : null,
      linkLabel: 'View trip',
    });
  };

  // Driver Request drawer handling
  const drvReq = drawer.isDriverReq ? (drvReqs.find(r => r.id === drawer.reqId) || (tms.drivers || []).find(x => x.id === drawer.reqId)) : null;
  const isReq = drvReq && !!drvReq.supervisorName;
  const drvStatus = drvReq ? (isReq ? (drvReq.status === 'Pending' ? 'Pending approval' : drvReq.status) : drvReq.approval) : '';
  const isPendingDrv = drvStatus === 'Pending approval' || drvStatus === 'Pending';
  const mask = a => a ? '•••• ' + String(a).slice(-4) + ` (${String(a).length} digits)` : '—';

  // Save form handling
  const handleSaveForm = () => {
    if (drawer.validate) {
      const errs = drawer.validate(form);
      const bad = Object.values(errs).filter(Boolean).length;
      if (bad) {
        setFormError(`${bad} ${bad === 1 ? 'field' : 'fields'} to fix. Check highlighted fields below.`);
        return;
      }
    }
    const missing = (drawer.required || []).filter(k => !String(form[k] || '').trim());
    if (missing.length) {
      setFormError(`${missing.length} required ${missing.length > 1 ? 'fields are' : 'field is'} missing.`);
      return;
    }

    if (drawer.isNotice) {
      const to = form.branch === 'all' ? 'All branches' : ((tms.B[form.branch] || {}).name || '') + ' supervisors';
      pushNotice({
        kind: 'message',
        branch: form.branch,
        priority: form.priority || 'Normal',
        title: form.title.trim(),
        body: form.body.trim(),
        rows: [
          ['Sent to', to],
          ['Priority', form.priority || 'Normal'],
          ['Sent by', 'Head Office Admin'],
        ],
      });
      closeDrawer();
      showToast('success', 'Notice sent', `${form.title.trim()} · ${to}`);
      return;
    }

    if (drawer.isMaster && drawer.masterKey) {
      const isNew = !form.id;
      const rec = normalizeRecord(drawer.masterKey, form, isNew);
      saveMaster(drawer.masterKey, rec, isNew);
      // Portal users sign in with the password set here
      if (drawer.masterKey === 'users' && rec.email && rec.password) {
        try {
          const pw = JSON.parse(localStorage.getItem('krl_custom_passwords') || '{}') || {};
          pw[rec.email.toLowerCase().trim()] = rec.password;
          localStorage.setItem('krl_custom_passwords', JSON.stringify(pw));
        } catch (e) {}
      }
      if (drawer.masterKey === 'vehicles' && rec.tank) {
        setVehTank(rec.id, rec.tank);
      }
    }

    closeDrawer();
    showToast('success', drawer.saveLabel.replace(/^Create|^Save|^Send/, m => ({ Create: 'Created', Save: 'Saved', Send: 'Sent' })[m]), `${drawer.title} · ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`);
  };

  const pickFormUpload = (e, key) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      showToast('warning', 'Not an image', 'Upload a JPG or PNG photo of the document.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('warning', 'File too large', 'Keep the photo under 5 MB.');
      return;
    }
    const kb = file.size / 1024;
    const size = kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(kb)) + ' KB';
    shrinkImage(file).then(url => {
      setForm({ ...form, [key]: { name: file.name, size, url } });
    });
  };

  const clearFormUpload = (key) => {
    setForm({ ...form, [key]: null });
  };

  const toggleFormCheck = (key, val) => {
    const cur = Array.isArray(form[key]) ? form[key] : [];
    setForm({
      ...form,
      [key]: cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val]
    });
  };

  return (
    <div
      onClick={closeDrawer}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(20,32,43,.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={drawer.title}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: 'calc(100vh - 32px)',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: 'var(--shadow-lg)',
          borderTop: '6px solid var(--color-brand)',
          animation: 'tmsFadeIn var(--dur-base) var(--ease-out)',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '20px 24px 12px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              {drawer.kicker}
            </div>
            <h2
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '22px',
                letterSpacing: '-0.01em',
                color: 'var(--text-heading)',
              }}
            >
              {drawer.title}
            </h2>
          </div>
          <button
            onClick={closeDrawer}
            aria-label="Close"
            style={{
              all: 'unset',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              display: 'grid',
              placeItems: 'center',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* EXCEPTION DETAILS */}
          {drawer.isException && (
            <>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                    background: excDetail.sevBg,
                    color: excDetail.sevFg,
                  }}
                >
                  {excDetail.severity}
                </span>
                <span className="tms-badge badge-neutral">{excDetail.status}</span>
              </div>
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-heading)' }}>
                {excDetail.detail}
              </p>
              <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {excDetail.rows.map(([k, val], i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '16px',
                      padding: '10px 14px',
                      borderBottom: i === excDetail.rows.length - 1 ? 'none' : '1px solid var(--border-default)',
                      fontSize: '14px',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-heading)', textAlign: 'right' }}>{val}</span>
                  </div>
                ))}
              </div>
              {exc.trip && (
                <button
                  onClick={() => {
                    closeDrawer();
                    navTo('trip', { selectedTrip: exc.trip });
                  }}
                  style={{ all: 'unset', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: 'var(--text-brand)' }}
                >
                  Open trip {excDetail.tripNumber} →
                </button>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)' }}>
                  Assign to
                </label>
                <select
                  value={excAssignee}
                  onChange={(e) => setExcAssignee(e.target.value)}
                  style={{ height: '40px', padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}
                >
                  <option value="Head Office Admin">Head Office Admin</option>
                  {(tms.supervisors || []).map(s => (
                    <option key={s.id} value={s.name}>{s.name} · {(tms.B[s.branch] || {}).name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)' }}>
                  Resolution note
                </label>
                <input
                  type="text"
                  placeholder="What was found and what was done"
                  value={excNote}
                  onChange={(e) => setExcNote(e.target.value)}
                  style={{ height: '40px', padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}
                />
              </div>
            </>
          )}

          {/* DRIVER APPROVAL REQUEST */}
          {drawer.isDriverReq && drvReq && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span className="tms-badge badge-warning">{drvStatus}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {isReq ? `Requested by ${drvReq.supervisorName} · ${(tms.B[drvReq.branch] || {}).name} · ${drvReq.requestedAt}` : `${(tms.B[drvReq.branch] || {}).name} · already in driver master`}
                </span>
              </div>
              {drvReq.vehicle && (
                <div style={{ padding: '12px 14px', background: 'var(--color-hazard-soft)', borderRadius: 'var(--radius-md)', fontSize: '13px', lineHeight: 1.5, color: '#7A4300' }}>
                  The supervisor has already assigned this driver to a trip being opened on {drvReq.vehicle}. Rejecting removes the driver from that trip form.
                </div>
              )}
              {/* Driver Details Table */}
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Driver details
                </div>
                <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-default)', fontSize: '14px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Name</span>
                    <span style={{ fontWeight: 600 }}>{drvReq.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-default)', fontSize: '14px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Licence number</span>
                    <span style={{ fontWeight: 600 }}>{drvReq.licence}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', fontSize: '14px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Mobile</span>
                    <span style={{ fontWeight: 600 }}>+91 {drvReq.phone}</span>
                  </div>
                </div>
              </div>

              {/* Bank Details Table if attached */}
              {isReq && (
                <>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Bank account
                    </div>
                    <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-default)', fontSize: '14px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Account holder</span>
                        <span style={{ fontWeight: 600 }}>{drvReq.holder || drvReq.name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-default)', fontSize: '14px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Account number</span>
                        <span style={{ fontWeight: 600 }}>{mask(drvReq.account || '1234567890')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', fontSize: '14px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>IFSC</span>
                        <span style={{ fontWeight: 600 }}>{drvReq.ifsc || 'SBIN0001234'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Documents
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <figure style={{ margin: 0, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                        <div style={{ height: '110px', display: 'grid', placeItems: 'center', background: 'var(--surface-muted)', fontSize: '12px', color: 'var(--text-muted)' }}>
                          {drvReq.licImg?.url ? <img src={drvReq.licImg.url} alt="Licence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'Driving Licence'}
                        </div>
                        <figcaption style={{ padding: '8px 10px', borderTop: '1px solid var(--border-default)', fontSize: '12px', fontWeight: 700 }}>
                          Licence Image
                        </figcaption>
                      </figure>
                      <figure style={{ margin: 0, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                        <div style={{ height: '110px', display: 'grid', placeItems: 'center', background: 'var(--surface-muted)', fontSize: '12px', color: 'var(--text-muted)' }}>
                          {drvReq.aadhaarImg?.url ? <img src={drvReq.aadhaarImg.url} alt="Aadhaar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'Aadhaar Card'}
                        </div>
                        <figcaption style={{ padding: '8px 10px', borderTop: '1px solid var(--border-default)', fontSize: '12px', fontWeight: 700 }}>
                          Aadhaar Image
                        </figcaption>
                      </figure>
                    </div>
                  </div>
                </>
              )}

              {isPendingDrv && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700 }}>
                    Reason if rejecting
                  </label>
                  <input
                    type="text"
                    placeholder="Optional · sent to the supervisor"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value.slice(0, 200))}
                    style={{ height: '40px', padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}
                  />
                </div>
              )}
            </>
          )}

          {/* GENERIC RECORD / NOTICE FORM */}
          {drawer.isForm && (
            <>
              {formError && (
                <div
                  role="alert"
                  style={{
                    padding: '12px 14px',
                    background: 'var(--kr-red-50)',
                    border: '1px solid var(--kr-red-100)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--kr-red-800)',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {formError}
                </div>
              )}

              {drawer.isNotice && (
                <div style={{ padding: '12px 14px', background: 'var(--color-brand-tint)', borderRadius: 'var(--radius-md)', fontSize: '13px', lineHeight: 1.5, color: 'var(--kr-green-900)' }}>
                  Supervisors see this on the Notifications page of the mobile app with your name and the time sent. Urgent notices also pop up on screen.
                </div>
              )}

              {drawer.isTripEdit && (
                <div style={{ padding: '12px 14px', background: 'var(--color-hazard-soft)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: '#7A4300' }}>
                  Edits to trip records are logged with your user, timestamp and the previous values. Supervisors cannot edit saved trips.
                </div>
              )}

              {drawer.fields && drawer.fields.map(([key, label, opts, hint, extra = {}], idx) => {
                const isSection = opts === 'section';
                const isUpload = opts === 'upload';
                const isArea = opts === 'textarea';
                const isChecks = opts === 'checks';
                const isSelect = Array.isArray(opts);
                const raw = form[key];
                const file = isUpload && raw && typeof raw === 'object' ? raw : null;

                if (isSection) {
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        paddingTop: '10px',
                        marginTop: '4px',
                        borderTop: '1px solid var(--border-default)',
                      }}
                    >
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
                        {label}
                      </h3>
                    </div>
                  );
                }

                if (isSelect) {
                  const options = typeof opts[0] === 'string' ? opts.map(o => ({ value: o, label: o })) : opts;
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>
                        {label}
                      </label>
                      <select
                        value={raw ?? ''}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        style={{ height: '40px', padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}
                      >
                        <option value="">Select</option>
                        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  );
                }

                if (isChecks) {
                  const picked = Array.isArray(raw) ? raw : [];
                  const options = extra.options || [];
                  return (
                    <div key={idx} role="group" aria-label={label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
                        {label}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {options.map(o => {
                          const on = picked.includes(o.value);
                          return (
                            <button
                              type="button"
                              key={o.value}
                              onClick={() => toggleFormCheck(key, o.value)}
                              style={{
                                all: 'unset',
                                cursor: 'pointer',
                                boxSizing: 'border-box',
                                minHeight: '38px',
                                padding: '0 12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                border: `2px solid ${on ? 'var(--color-brand)' : 'var(--border-strong)'}`,
                                borderRadius: 'var(--radius-md)',
                                background: on ? 'var(--color-brand-tint)' : '#fff',
                                color: 'var(--text-heading)',
                                fontSize: '13px',
                                fontWeight: 600,
                              }}
                            >
                              <span style={{ width: '14px', height: '14px', borderRadius: '3px', border: `2px solid ${on ? 'var(--color-brand)' : 'var(--border-strong)'}`, background: on ? 'var(--color-brand)' : '#fff', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '10px' }}>
                                {on ? '✓' : ''}
                              </span>
                              {o.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                if (isUpload) {
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
                          {label}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{hint}</span>
                      </div>
                      {!file ? (
                        <label
                          style={{
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            minHeight: '64px',
                            padding: '12px 14px',
                            border: '2px dashed var(--border-strong)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--surface-muted)',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => pickFormUpload(e, key)}
                            style={{ display: 'none' }}
                          />
                          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-heading)' }}>
                            Upload photo (JPG / PNG)
                          </span>
                        </label>
                      ) : (
                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', border: '2px solid var(--color-brand)', borderRadius: 'var(--radius-md)', background: 'var(--color-brand-tint)' }}>
                          <div style={{ flex: 1, minWidth: 0, fontSize: '13px', fontWeight: 700 }}>
                            {file.name} ({file.size})
                          </div>
                          <button
                            type="button"
                            onClick={() => clearFormUpload(key)}
                            style={{ all: 'unset', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'var(--kr-red-700)' }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                if (isArea) {
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>
                        {label}
                      </label>
                      <textarea
                        rows={4}
                        placeholder={hint || ''}
                        value={raw ?? ''}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontFamily: 'inherit' }}
                      />
                    </div>
                  );
                }

                if (extra.type === 'password') {
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>
                        {label}
                      </label>
                      <PasswordField value={raw ?? ''} placeholder={hint || ''} onChange={v => setForm({ ...form, [key]: v })} />
                      {extra.hint && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{extra.hint}</span>}
                    </div>
                  );
                }

                // Default input text / number
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>
                      {label}
                    </label>
                    <input
                      type={extra.clean === 'account' || extra.clean === 'litres' ? 'number' : 'text'}
                      placeholder={hint || ''}
                      value={raw ?? ''}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      style={{ height: '40px', padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontFamily: 'inherit' }}
                    />
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '16px 24px',
            borderTop: '1px solid var(--border-default)',
            background: 'var(--surface-muted)',
          }}
        >
          <button
            onClick={closeDrawer}
            style={{
              all: 'unset',
              cursor: 'pointer',
              height: '38px',
              padding: '0 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-heading)',
            }}
          >
            Cancel
          </button>
          {drawer.isException && exc.status !== 'Resolved' && (
            <>
              {exc.status === 'Open' && (
              <button
                onClick={handleExcUnderReview}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  fontWeight: 700,
                  background: 'var(--surface-card)',
                  color: 'var(--color-brand)',
                  border: '1px solid var(--color-brand)',
                }}
              >
                Mark under review
              </button>
              )}
              <button
                onClick={handleExcResolve}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  fontWeight: 700,
                  background: 'var(--color-brand)',
                  color: '#fff',
                }}
              >
                Resolve
              </button>
            </>
          )}
          {drawer.isDriverReq && isPendingDrv && (
            <>
              <button
                onClick={() => decideDriver(drawer.reqId, 'Rejected', rejectReason.trim())}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  fontWeight: 700,
                  background: 'var(--surface-card)',
                  color: 'var(--kr-red-700)',
                  border: '1px solid var(--kr-red-600)',
                }}
              >
                Reject
              </button>
              <button
                onClick={() => decideDriver(drawer.reqId, 'Approved')}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  fontWeight: 700,
                  background: 'var(--color-brand)',
                  color: '#fff',
                }}
              >
                Approve driver
              </button>
            </>
          )}
          {drawer.isForm && (
            <button
              onClick={handleSaveForm}
              style={{
                all: 'unset',
                cursor: 'pointer',
                height: '38px',
                padding: '0 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 700,
                background: 'var(--color-brand)',
                color: '#fff',
              }}
            >
              {drawer.saveLabel}
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};

export default AdminDrawer;

