import React, { useEffect, useRef, useState } from 'react';
import { Lock, RotateCcw, ShieldCheck } from 'lucide-react';

import {
  ACTIONS,
  ALL_MODULES,
  MODULE_GROUPS,
  MODULE_TOTAL,
  accessCount,
  isAdminRole,
  readAccess,
  roleDefault,
  userAccess,
  writeAccess,
} from '../../../utils/moduleAccess';

export { MODULE_TOTAL, accessCount, userAccess };

const same = (a, b) => ALL_MODULES.every(([k]) => [...(a[k] || [])].sort().join() === [...(b[k] || [])].sort().join());

const Check = ({ checked, indeterminate, disabled, onChange, label }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={!!checked}
      disabled={disabled}
      onChange={e => onChange(e.target.checked)}
      aria-label={label}
      style={{ width: '18px', height: '18px', margin: 0, accentColor: 'var(--color-brand)', cursor: disabled ? 'not-allowed' : 'pointer' }}
    />
  );
};

const thStyle = {
  padding: '10px 12px',
  fontFamily: 'var(--font-display)',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  whiteSpace: 'nowrap',
};

const btn = primary => ({
  all: 'unset',
  cursor: 'pointer',
  padding: '0 14px',
  height: '34px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  borderRadius: 'var(--radius-md)',
  fontSize: '13px',
  fontWeight: 700,
  background: primary ? 'var(--color-brand)' : '#fff',
  color: primary ? '#fff' : 'var(--text-heading)',
  border: primary ? 'none' : '1px solid var(--border-strong)',
});

export const ModuleAccess = ({ users, selectedId, onSelect, showToast }) => {
  const [saved, setSaved] = useState(readAccess);
  const [drafts, setDrafts] = useState({});

  const user = users.find(u => u.id === selectedId) || users[0];
  if (!user) return null;

  const locked = isAdminRole(user.role);
  const savedAccess = userAccess(user, saved);
  const access = drafts[user.id] || savedAccess;
  const dirty = !locked && !same(access, savedAccess);
  const isDirty = u => !!drafts[u.id] && !same(drafts[u.id], userAccess(u, saved));

  const setAccess = next => setDrafts({ ...drafts, [user.id]: next });

  // View is required for any other action; removing View removes the rest
  const toggle = (key, act, on) => {
    const cur = new Set(access[key] || []);
    if (on) {
      cur.add(act);
      if (act !== 'view') cur.add('view');
    } else if (act === 'view') {
      cur.clear();
    } else {
      cur.delete(act);
    }
    setAccess({ ...access, [key]: [...cur] });
  };

  const toggleRow = (key, acts, on) => setAccess({ ...access, [key]: on ? [...acts] : [] });

  const colState = act => {
    const mods = ALL_MODULES.filter(([, , acts]) => acts.includes(act));
    const n = mods.filter(([k]) => (access[k] || []).includes(act)).length;
    return { all: n === mods.length, some: n > 0 && n < mods.length };
  };

  const toggleCol = (act, on) => {
    const next = { ...access };
    ALL_MODULES.forEach(([k, , acts]) => {
      if (!acts.includes(act)) return;
      const cur = new Set(next[k] || []);
      if (on) {
        cur.add(act);
        cur.add('view');
      } else if (act === 'view') {
        cur.clear();
      } else {
        cur.delete(act);
      }
      next[k] = [...cur];
    });
    setAccess(next);
  };

  const save = () => {
    const next = { ...saved, [user.id]: access };
    setSaved(next);
    writeAccess(next);
    const { [user.id]: _, ...rest } = drafts;
    setDrafts(rest);
    showToast('success', 'Access saved', `${user.name} can open ${accessCount(access)} of ${MODULE_TOTAL} modules.`);
  };

  const discard = () => {
    const { [user.id]: _, ...rest } = drafts;
    setDrafts(rest);
  };

  const resetToRole = () => setAccess(roleDefault(user.role));

  return (
    <div className="tms-access">
      {/* User picker */}
      <aside style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', alignSelf: 'start' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)', fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Select user
        </div>
        {users.map(u => {
          const active = u.id === user.id;
          const n = accessCount(drafts[u.id] || userAccess(u, saved));
          return (
            <button
              key={u.id}
              onClick={() => onSelect(u.id)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                boxSizing: 'border-box',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderTop: '1px solid var(--border-default)',
                borderLeft: `3px solid ${active ? 'var(--color-brand)' : 'transparent'}`,
                background: active ? 'var(--color-brand-tint)' : '#fff',
              }}
            >
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>{u.name}</span>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>{u.role}</span>
              </span>
              {isDirty(u) && <span title="Unsaved changes" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-hazard)' }} />}
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kr-green-800)', background: 'var(--color-brand-soft)', padding: '2px 8px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
                {n}/{MODULE_TOTAL}
              </span>
            </button>
          );
        })}
      </aside>

      {/* Matrix */}
      <section style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '14px 18px', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--text-heading)' }}>
              Module access · {user.name}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {user.role} · {user.branch} · {accessCount(access)} of {MODULE_TOTAL} modules
            </div>
          </div>
          {!locked && (
            <>
              <button onClick={resetToRole} style={btn(false)} title="Use the default access for this role">
                <RotateCcw size={14} /> Role default
              </button>
              {dirty && <button onClick={discard} style={btn(false)}>Discard</button>}
              <button onClick={save} disabled={!dirty} style={{ ...btn(true), opacity: dirty ? 1 : 0.5, cursor: dirty ? 'pointer' : 'not-allowed' }}>
                Save access
              </button>
            </>
          )}
        </div>

        {locked && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'var(--color-brand-tint)', borderBottom: '1px solid var(--border-default)', fontSize: '13px', color: 'var(--kr-green-900)' }}>
            <Lock size={14} /> Administrators always have full access to every module, so these boxes can't be changed.
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '640px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-muted)' }}>
                <th style={{ ...thStyle, textAlign: 'left', paddingLeft: '18px' }}>Module</th>
                {ACTIONS.map(([act, label]) => {
                  const st = colState(act);
                  return (
                    <th key={act} style={{ ...thStyle, textAlign: 'center' }}>
                      <label style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: locked ? 'default' : 'pointer' }}>
                        {label}
                        <Check checked={st.all} indeterminate={st.some} disabled={locked} onChange={on => toggleCol(act, on)} label={`${label} for all modules`} />
                      </label>
                    </th>
                  );
                })}
                <th style={{ ...thStyle, textAlign: 'center' }}>Full</th>
              </tr>
            </thead>
            <tbody>
              {MODULE_GROUPS.map(g => (
                <React.Fragment key={g.group}>
                  <tr>
                    <td colSpan={ACTIONS.length + 2} style={{ padding: '14px 18px 6px', fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-brand)', borderTop: '1px solid var(--border-default)' }}>
                      {g.group}
                    </td>
                  </tr>
                  {g.items.map(([key, label, acts]) => {
                    const cur = access[key] || [];
                    const full = acts.every(a => cur.includes(a));
                    const none = cur.length === 0;
                    return (
                      <tr key={key} className="tms-access-row" style={{ borderTop: '1px solid var(--border-default)', opacity: none ? 0.7 : 1 }}>
                        <td style={{ padding: '10px 12px 10px 18px', fontWeight: 600, color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>{label}</td>
                        {ACTIONS.map(([act, actLabel]) => (
                          <td key={act} style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {acts.includes(act) ? (
                              <Check checked={cur.includes(act)} disabled={locked} onChange={on => toggle(key, act, on)} label={`${actLabel} ${label}`} />
                            ) : (
                              <span style={{ color: 'var(--kr-grey-300)' }} aria-hidden="true">—</span>
                            )}
                          </td>
                        ))}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <Check checked={full} indeterminate={!full && !none} disabled={locked} onChange={on => toggleRow(key, acts, on)} label={`Full access to ${label}`} />
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', borderTop: '1px solid var(--border-default)', fontSize: '12px', color: 'var(--text-muted)' }}>
          <ShieldCheck size={14} /> Ticking Add, Edit, Delete or Export also gives View. Unticking View removes all access to that module.
        </div>
      </section>
    </div>
  );
};

export default ModuleAccess;
