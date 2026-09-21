import React, { useState } from 'react';
import { useTMSAdmin } from '../../../context/TMSAdminContext';

export const Settings = () => {
  const {
    st,
    setSt,
    dashTab,
    setDashTab,
    dashCfg,
    saveDash,
    dashDefault,
    dashForm,
    setDashForm,
    dashFormErr,
    setDashFormErr,
    showToast,
    navTo,
    T,
  } = useTMSAdmin();
  const tms = T();

  // Dashboard Modules Catalog
  const dt = dashTab || 'cards';
  const df = dashForm || { module: '', title: '', fields: [] };
  const dtItems = (dashCfg && dashCfg[dt]) || [];

  const modulesList = [
    { id: 'trips', label: 'Trips', cols: ['Trip number', 'Branch', 'Vehicle', 'Driver', 'Client · unloading', 'Type', 'Opened', 'Status', 'Flags'] },
    { id: 'exceptions', label: 'Exceptions', cols: ['Severity', 'Type', 'Vehicle / trip', 'Detail', 'Branch', 'Raised', 'Assignee', 'Status'] },
    { id: 'fleet', label: 'Fleet & GPS', cols: ['Vehicle', 'Type', 'Branch', 'Driver', 'Status', 'GPS', 'Odometer', 'Last seen', 'Route'] },
    { id: 'distance', label: 'Distance variation', cols: ['Trip', 'Vehicle', 'Route', 'Branch', 'Fixed KM', 'GPS KM', 'Odometer KM', 'Variance', 'Review'] },
    { id: 'attendance', label: 'Attendance', cols: ['Driver', 'Branch', 'Type', 'Present', 'Absent', 'Utilisation', 'Status'] },
    { id: 'branches', label: 'Branches', cols: ['Code', 'Branch', 'State', 'Vehicles', 'Supervisors', 'Status'] },
    { id: 'supervisors', label: 'Supervisors', cols: ['Name', 'Phone', 'Branch', 'Clients handled', 'Last login', 'Status'] },
    { id: 'vehicles', label: 'Vehicles', cols: ['Registration', 'Type', 'Branch', 'Odometer', 'Tank', 'GPS', 'Status'] },
    { id: 'drivers', label: 'Drivers', cols: ['Name', 'Licence', 'Phone', 'Branch', 'Type', 'Approval', 'Status'] },
    { id: 'clients', label: 'Clients', cols: ['Client', 'GSTIN', 'Branch', 'Customers', 'Contact'] },
    { id: 'locations', label: 'Loading locations', cols: ['Location', 'Branch', 'Address', 'Safe radius', 'Coordinates'] },
    { id: 'routes', label: 'Routes', cols: ['Route', 'From', 'To', 'Fixed KM', 'Duration', 'Toll'] },
    { id: 'analytics', label: 'Analytics', cols: ['Area', 'KPI', 'Value', 'Note'] },
    { id: 'reports', label: 'Reports', cols: ['Report', 'Description', 'Last run', 'Rows'] },
    { id: 'deviceApprovals', label: 'Device approvals', cols: ['Mobile number', 'IMEI', 'Device', 'Branch', 'Requested', 'Status'] },
    { id: 'users', label: 'Users & roles', cols: ['Name', 'Email', 'Role', 'Branch scope', 'Status', 'Last active'] },
  ];

  const modById = Object.fromEntries(modulesList.map(m => [m.id, m]));
  const fm = modById[df.module] || null;

  const dashTabs = [
    { value: 'cards', label: 'Card view' },
    { value: 'charts', label: 'Chart view' },
    { value: 'lists', label: 'List view' },
  ];
  const dashNoun = { cards: 'card', charts: 'chart', lists: 'list' }[dt];

  const handleAddDashItem = () => {
    if (!fm) {
      setDashFormErr('Choose a module.');
      return;
    }
    if (!df.fields || !df.fields.length) {
      setDashFormErr(`Select at least one heading from ${fm.label}.`);
      return;
    }
    const item = {
      uid: fm.id + '-' + Math.random().toString(36).slice(2, 7),
      module: fm.id,
      title: (df.title || '').trim(),
      fields: fm.cols.filter(h => df.fields.includes(h)),
    };
    saveDash({ ...dashCfg, [dt]: [...dtItems, item] });
    setDashForm({ module: '', title: '', fields: [] });
    setDashFormErr('');
    showToast('success', 'Added to dashboard', `${item.title || fm.label} · ${item.fields.length} headings from ${fm.label}.`);
  };

  const removeDashItem = (uid) => {
    const it = dtItems.find(x => x.uid === uid);
    saveDash({ ...dashCfg, [dt]: dtItems.filter(x => x.uid !== uid) });
    if (it) showToast('info', 'Removed from dashboard', it.title || (it.module ? modById[it.module]?.label : uid));
  };

  const moveDashItem = (uid, dir) => {
    const i = dtItems.findIndex(x => x.uid === uid);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= dtItems.length) return;
    const next = [...dtItems];
    [next[i], next[j]] = [next[j], next[i]];
    saveDash({ ...dashCfg, [dt]: next });
  };

  const handleRestoreAll = () => {
    saveDash(dashDefault());
    setDashForm({ module: '', title: '', fields: [] });
    setDashFormErr('');
    showToast('info', 'Dashboard restored', 'Every metric is back on the dashboard.');
  };

  const handleSaveSettings = () => {
    showToast('success', 'Settings saved', `Variance ${st.variance}%, radius ${st.radius} m, long open ${st.longOpen} h.`);
  };

  const handleResetSettings = () => {
    setSt({
      variance: '5',
      radius: '100',
      longOpen: '8',
      idle: '15',
      gpsFail: '30',
      serial: 'monthly',
      reasons: 'Maintenance, Internal Movement, Empty Return, Driver Testing',
      session: '12',
      attReminder: true,
      excEmail: true,
    });
    showToast('info', 'Settings reset', 'Restored system thresholds to defaults.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Dashboard Layout Customizer Section */}
      <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', padding: '18px 18px 0' }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
              Dashboard layout
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Add a card, chart or list with the form. Its values are fetched automatically and it appears on the dashboard straight away.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button
              onClick={handleRestoreAll}
              style={{ all: 'unset', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}
            >
              Restore defaults
            </button>
            <button
              onClick={() => navTo('dashboard')}
              style={{ all: 'unset', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--text-brand)' }}
            >
              View dashboard &rarr;
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div style={{ padding: '0 18px', borderBottom: '1px solid var(--border-default)', display: 'flex', gap: '8px' }}>
          {dashTabs.map(t => (
            <button
              key={t.value}
              onClick={() => {
                setDashTab(t.value);
                setDashFormErr('');
              }}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '12px 16px',
                fontFamily: 'var(--font-display)',
                fontSize: '14px',
                fontWeight: 700,
                color: dt === t.value ? 'var(--color-brand)' : 'var(--text-muted)',
                borderBottom: `3px solid ${dt === t.value ? 'var(--color-brand)' : 'transparent'}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Add Form Column */}
          <div
            style={{
              flex: '1 1 300px',
              maxWidth: '100%',
              boxSizing: 'border-box',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: 'var(--surface-muted)',
              borderRight: '1px solid var(--border-default)',
              alignSelf: 'stretch',
            }}
          >
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
              Add a {dashNoun}
            </h3>

            {/* Module Select */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
                Module
              </label>
              <select
                value={df.module || ''}
                onChange={(e) => setDashForm({ ...df, module: e.target.value, fields: [] })}
                style={{
                  height: '42px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  fontSize: '14px',
                  outline: 'none',
                  background: '#fff',
                }}
              >
                <option value="">Choose a module…</option>
                {modulesList.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Title Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
                Label name
              </label>
              <input
                type="text"
                placeholder={fm ? fm.label : 'e.g. Trips this week'}
                value={df.title || ''}
                onChange={(e) => setDashForm({ ...df, title: e.target.value.slice(0, 60) })}
                style={{
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  fontSize: '14px',
                  outline: 'none',
                  background: '#fff',
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Shown as the heading on the dashboard. Blank uses the module name.
              </span>
            </div>

            {/* Headings Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
                  Headings
                </span>
                {fm && (
                  <span style={{ display: 'flex', gap: '10px', alignItems: 'baseline', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {df.fields.length} of {fm.cols.length} selected
                    <button
                      onClick={() => setDashForm({ ...df, fields: [...fm.cols] })}
                      style={{ all: 'unset', cursor: 'pointer', fontWeight: 700, color: 'var(--text-brand)' }}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setDashForm({ ...df, fields: [] })}
                      style={{ all: 'unset', cursor: 'pointer', fontWeight: 700, color: 'var(--text-muted)' }}
                    >
                      None
                    </button>
                  </span>
                )}
              </div>

              {!fm && (
                <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '14px', fontSize: '13px', color: 'var(--text-muted)', background: '#fff' }}>
                  Choose a module to see its headings.
                </div>
              )}

              {fm && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {fm.cols.map(h => {
                    const on = (df.fields || []).includes(h);
                    return (
                      <button
                        key={h}
                        onClick={() => {
                          const cur = df.fields || [];
                          const next = cur.includes(h) ? cur.filter(x => x !== h) : [...cur, h];
                          setDashForm({ ...df, fields: next });
                        }}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          height: '32px',
                          padding: '0 12px',
                          borderRadius: 'var(--radius-pill)',
                          fontFamily: 'var(--font-display)',
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          border: `2px solid ${on ? 'var(--color-brand)' : 'var(--border-strong)'}`,
                          background: on ? 'var(--color-brand)' : '#fff',
                          color: on ? '#fff' : 'var(--text-heading)',
                        }}
                      >
                        {on && <span style={{ marginRight: '6px' }}>✓</span>}
                        {h}
                      </button>
                    );
                  })}
                </div>
              )}

              {dashFormErr && (
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--kr-red-700)' }}>
                  {dashFormErr}
                </div>
              )}
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddDashItem}
              style={{
                all: 'unset',
                cursor: 'pointer',
                height: '40px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-brand)',
                color: '#fff',
                fontFamily: 'var(--font-display)',
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Add to dashboard
            </button>
          </div>

          {/* On the Dashboard Column */}
          <div style={{ flex: '3 1 420px', maxWidth: '100%', boxSizing: 'border-box', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
                On the dashboard ({dtItems.length})
              </h3>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Shown in this order. Changes apply immediately.
              </div>
            </div>

            {dtItems.length === 0 && (
              <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)', padding: '28px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                Nothing here yet. Add a {dashNoun} with the form.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '14px' }}>
              {dtItems.map((w, i) => {
                const itemLabel = w.title || (w.module ? modById[w.module]?.label : w.src) || w.uid;
                return (
                  <div
                    key={w.uid || i}
                    style={{
                      background: '#fff',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <span style={{ display: 'block', height: '4px', width: '36px', borderRadius: '2px', background: 'var(--color-brand)' }}></span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        {itemLabel}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {w.fields ? `${w.fields.length} headings` : 'Standard metric'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px', borderTop: '1px solid var(--border-default)', background: 'var(--surface-muted)' }}>
                      <button
                        onClick={() => moveDashItem(w.uid, -1)}
                        disabled={i === 0}
                        style={{
                          all: 'unset',
                          cursor: i === 0 ? 'default' : 'pointer',
                          opacity: i === 0 ? 0.3 : 1,
                          width: '28px',
                          height: '28px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '15px',
                          color: 'var(--text-heading)',
                        }}
                      >
                        &larr;
                      </button>
                      <button
                        onClick={() => moveDashItem(w.uid, 1)}
                        disabled={i === dtItems.length - 1}
                        style={{
                          all: 'unset',
                          cursor: i === dtItems.length - 1 ? 'default' : 'pointer',
                          opacity: i === dtItems.length - 1 ? 0.3 : 1,
                          width: '28px',
                          height: '28px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '15px',
                          color: 'var(--text-heading)',
                        }}
                      >
                        &rarr;
                      </button>
                      <span style={{ flex: 1 }}></span>
                      <button
                        onClick={() => removeDashItem(w.uid)}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--kr-red-700)',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Thresholds & Security Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '24px', alignItems: 'start' }}>
        {/* Validation Thresholds */}
        <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
              Validation thresholds
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Applied to every trip at close.</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Distance variance flag (%)</label>
            <input
              type="number"
              value={st.variance || '5'}
              onChange={(e) => setSt({ ...st, variance: e.target.value })}
              style={{ height: '36px', padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fixed vs GPS vs odometer. Trips above this are flagged.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Default safe radius (m)</label>
            <input
              type="number"
              value={st.radius || '100'}
              onChange={(e) => setSt({ ...st, radius: e.target.value })}
              style={{ height: '36px', padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading and unloading locations. Per-location override in Loading Locations.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Long open trip alert (h)</label>
            <input
              type="number"
              value={st.longOpen || '8'}
              onChange={(e) => setSt({ ...st, longOpen: e.target.value })}
              style={{ height: '36px', padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hours beyond route duration before an alert is raised.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Idle detection (min)</label>
            <input
              type="number"
              value={st.idle || '15'}
              onChange={(e) => setSt({ ...st, idle: e.target.value })}
              style={{ height: '36px', padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>GPS failure after (min)</label>
            <input
              type="number"
              value={st.gpsFail || '30'}
              onChange={(e) => setSt({ ...st, gpsFail: e.target.value })}
              style={{ height: '36px', padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No fix for this long switches distance source to odometer.</span>
          </div>
        </section>

        {/* Trip Numbering & Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
                Trip numbering
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Vehicle Number / Month / Serial. Generated on save only.</div>
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--text-heading)' }}>
              TN28AQ4521 / 09 / 014
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Serial resets</label>
              <select
                value={st.serial || 'monthly'}
                onChange={(e) => setSt({ ...st, serial: e.target.value })}
                style={{ height: '36px', padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}
              >
                <option value="monthly">Every month (recommended)</option>
                <option value="yearly">Every year</option>
                <option value="never">Never</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Non-business reasons</label>
              <input
                type="text"
                value={st.reasons || ''}
                onChange={(e) => setSt({ ...st, reasons: e.target.value })}
                style={{ height: '36px', padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Comma separated. Shown to supervisors when trip type is Non-Business.</span>
            </div>
          </section>

          <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-heading)' }}>
              Security and alerts
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Session timeout (h)</label>
              <input
                type="number"
                value={st.session || '12'}
                onChange={(e) => setSt({ ...st, session: e.target.value })}
                style={{ height: '36px', padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!st.attReminder}
                onChange={(e) => setSt({ ...st, attReminder: e.target.checked })}
              />
              Daily attendance reminder to supervisors at 20:00
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!st.excEmail}
                onChange={(e) => setSt({ ...st, excEmail: e.target.checked })}
              />
              Email exception report when both GPS and odometer fail
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-muted)' }}>
              <input type="checkbox" disabled checked={false} />
              OTP login (planned, not yet available)
            </label>
          </section>
        </div>
      </div>

      {/* Footer Save & Reset Buttons */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button
          onClick={handleResetSettings}
          style={{
            all: 'unset',
            cursor: 'pointer',
            padding: '0 20px',
            height: '40px',
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: '14px',
            fontWeight: 700,
          }}
        >
          Reset
        </button>
        <button
          onClick={handleSaveSettings}
          style={{
            all: 'unset',
            cursor: 'pointer',
            padding: '0 20px',
            height: '40px',
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-brand)',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontSize: '14px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Save settings
        </button>
      </div>
    </div>
  );
};

export default Settings;
