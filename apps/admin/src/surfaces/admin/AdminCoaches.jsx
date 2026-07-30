import React from 'react';
import { AVAIL_DAYS, buildAvailSlots, DEFAULT_AVAIL_SLOTS } from '@riposte/core';
import { Icon, Avatar, WeaponChip } from '../../components/Shared';
import { getCoaches, getCoachWeekStats, updateCoachAvailability, createCoach, getSettings } from '../../lib/db';

const WEAPONS = ['foil','epee','sabre'];

function slugify(name) {
  return (name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `coach-${Date.now()}`;
}

function LoadMeter({ load, max }) {
  const pct = Math.min(load / max, 1);
  const color = pct > 0.85 ? 'var(--danger)' : pct > 0.65 ? 'var(--warning)' : 'var(--success)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Lesson load this week</span>
        <span className="r-tabular" style={{ fontSize: 12, fontWeight: 600, color }}>{load}/{max}</span>
      </div>
      <div style={{ height: 5, background: 'var(--hairline)', borderRadius: 'var(--r-pill)' }}>
        <div style={{ height: '100%', width: `${pct*100}%`, background: color, borderRadius: 'var(--r-pill)', transition: 'width var(--d-slow)' }} />
      </div>
    </div>
  );
}

function CoachRosterCard({ coach, selected, onSelect }) {
  return (
    <div onClick={onSelect} style={{
      background: 'var(--surface)', border: `1px solid ${selected ? 'var(--brand)' : 'var(--hairline)'}`,
      borderRadius: 'var(--r-card)', padding: 18, cursor: 'pointer',
      transition: 'border-color var(--d-fast)',
      boxShadow: selected ? '0 0 0 3px var(--brand-tint)' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <Avatar name={coach.name} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{coach.name}</span>
            {coach.maitre && (
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--steel)', background: 'var(--steel-tint)', padding: '2px 7px', borderRadius: 'var(--r-pill)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Maître</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
            {coach.weapons.map(w => <WeaponChip key={w} type={w} />)}
          </div>
        </div>
      </div>
      {coach.bio && <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{coach.bio}</p>}
      <LoadMeter load={coach.load} max={coach.max} />
    </div>
  );
}

// Availability persists as { slots: { "Mon|17:00": true, … }, blackout: { Wed: true } }
// — the same shape the coach mobile app reads/writes.
/** Order-independent signature of an availability template — only the keys that
 *  are actually on count, so a server payload and a locally-toggled object with
 *  the same meaning compare equal. */
function availSignature(slots, blackout) {
  const on = (o) => Object.keys(o || {}).filter((k) => o[k]).sort();
  return JSON.stringify([on(slots), on(blackout)]);
}

function AvailGrid({ coach, onSave, availSlots }) {
  const [grid, setGrid] = React.useState({});
  const [blackout, setBlackout] = React.useState({});
  // Signature of what's currently in the database, so the save effect can tell
  // a real edit from the state settling after a load. This used to be a boolean
  // armed by a setTimeout(…, 0), which lost the race: the arming tick landed
  // before the state-settling re-render, so simply opening a coach could fire a
  // debounced UPDATE writing the same JSON straight back.
  const persisted = React.useRef(null);

  React.useEffect(() => {
    const av = coach.availability_json || {};
    const slots = av.slots && typeof av.slots === 'object' ? av.slots : {};
    const bo = av.blackout && typeof av.blackout === 'object' ? av.blackout : {};
    persisted.current = availSignature(slots, bo);
    setGrid(slots);
    setBlackout(bo);
  }, [coach.id]);

  // Debounced persistence — only when the template actually differs from the
  // stored one, so a no-op write is impossible regardless of effect timing.
  React.useEffect(() => {
    const sig = availSignature(grid, blackout);
    if (persisted.current === null || sig === persisted.current) return;
    const t = setTimeout(() => {
      persisted.current = sig;
      onSave(coach.id, { slots: grid, blackout });
    }, 500);
    return () => clearTimeout(t);
  }, [grid, blackout, coach.id, onSave]);

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 }}>
        Tap a slot to toggle availability. This is the weekly recurring template — changes save automatically.
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(6, 1fr)', gap: 4, minWidth: 380 }}>
          <div />
          {AVAIL_DAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: blackout[d] ? 'var(--danger)' : 'var(--muted)', paddingBottom: 4 }}>{d}</div>
          ))}
          {availSlots.map(s => (
            <React.Fragment key={s}>
              <div className="r-tabular" style={{ fontSize: 11, color: 'var(--faint)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>{s}</div>
              {AVAIL_DAYS.map(d => {
                const key = d + '|' + s;
                const on = grid[key] && !blackout[d];
                return (
                  <button key={key} disabled={blackout[d]} onClick={() => setGrid(g => ({ ...g, [key]: !g[key] }))} className="r-focusable" style={{
                    aspectRatio: '1', borderRadius: 6, font: 'inherit',
                    cursor: blackout[d] ? 'default' : 'pointer',
                    border: '1px solid ' + (on ? 'var(--brand)' : 'var(--hairline)'),
                    background: blackout[d]
                      ? 'repeating-linear-gradient(45deg,transparent,transparent 4px,var(--hairline) 4px,var(--hairline) 5px)'
                      : on ? 'var(--brand)' : 'var(--surface)',
                    transition: 'background var(--d-fast), border-color var(--d-fast)',
                  }} />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted)' }}>Blackout days:</span>
        {AVAIL_DAYS.map(d => (
          <button key={d} onClick={() => setBlackout(b => ({ ...b, [d]: !b[d] }))} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, padding: '5px 12px', borderRadius: 'var(--r-pill)', border: '1px solid ' + (blackout[d] ? 'var(--danger)' : 'var(--hairline)'), background: blackout[d] ? 'var(--danger-tint)' : 'var(--surface)', color: blackout[d] ? 'var(--danger)' : 'var(--muted)' }}>{d}</button>
        ))}
      </div>
    </div>
  );
}

function AddCoachPanel({ onClose, onCreate }) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [weapon, setWeapon] = React.useState('sabre');
  const [maitre, setMaitre] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const field = { width: '100%', padding: '9px 11px', borderRadius: 'var(--r-btn)', border: '1px solid var(--hairline)', background: 'var(--paper)', font: 'inherit', fontSize: 13.5, color: 'var(--ink)', boxSizing: 'border-box' };

  const submit = async () => {
    if (!name.trim()) { setErr('Name is required.'); return; }
    if (!email.trim()) { setErr('Email is required — it enables the coach to log in.'); return; }
    setSaving(true); setErr(null);
    try {
      await onCreate({ name: name.trim(), email: email.trim().toLowerCase(), weapon, maitre });
      onClose();
    } catch (e) {
      setErr(e?.message || 'Could not create coach.');
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(23,21,15,0.18)', zIndex: 40 }} />
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 340, background: 'var(--surface)', borderLeft: '1px solid var(--hairline)', zIndex: 50, boxShadow: 'var(--shadow-raise)', display: 'flex', flexDirection: 'column', animation: 'r-panel 240ms var(--e-enter)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--hairline)' }}>
          <h2 className="r-display" style={{ margin: 0, fontSize: 20, color: 'var(--ink)' }}>Add coach</h2>
          <button onClick={onClose} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent', display: 'flex' }}><Icon name="x" size={18} color="var(--muted)" /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>Name</div><input value={name} onChange={e => setName(e.target.value)} className="r-focusable" style={field} placeholder="e.g. Constantin Sandu" /></div>
          <div><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>Login email</div><input value={email} onChange={e => setEmail(e.target.value)} className="r-focusable" style={field} placeholder="coach@club.ro" /><div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 5 }}>The coach signs in with this Google account.</div></div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>Weapon</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {WEAPONS.map(w => (
                <button key={w} onClick={() => setWeapon(w)} className="r-focusable" style={{ flex: 1, font: 'inherit', cursor: 'pointer', borderRadius: 'var(--r-btn)', padding: '8px', textTransform: 'capitalize', fontSize: 13, fontWeight: 600, border: '1px solid ' + (weapon===w?'var(--brand)':'var(--hairline)'), background: weapon===w?'var(--brand-tint)':'transparent', color: weapon===w?'var(--brand)':'var(--muted)' }}>{w}</button>
              ))}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={maitre} onChange={e => setMaitre(e.target.checked)} />
            <span style={{ fontSize: 13.5, color: 'var(--ink)' }}>Maître d'armes</span>
          </label>
          {err && <div style={{ fontSize: 12.5, color: 'var(--danger)' }}>{err}</div>}
        </div>
        <div style={{ padding: 20, borderTop: '1px solid var(--hairline)' }}>
          <button onClick={submit} disabled={saving} className="r-focusable" style={{ width: '100%', font: 'inherit', cursor: saving ? 'default' : 'pointer', padding: 12, borderRadius: 'var(--r-btn)', border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 14, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>{saving ? 'Creating…' : 'Create coach'}</button>
        </div>
      </div>
      <style>{`@keyframes r-panel { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </>
  );
}

export function AdminCoaches({ addNonce = 0 }) {
  const [coaches, setCoaches] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [adding, setAdding] = React.useState(false);
  // "Add coach" also lives in the shared top bar; AdminApp bumps a counter.
  React.useEffect(() => { if (addNonce > 0) setAdding(true); }, [addNonce]);
  const [loading, setLoading] = React.useState(true);
  const [availSlots, setAvailSlots] = React.useState(DEFAULT_AVAIL_SLOTS);

  React.useEffect(() => {
    getSettings()
      .then(s => setAvailSlots(buildAvailSlots(s?.cal_start_min ?? 960, s?.cal_end_min ?? 1320, s?.booking_slot_min ?? 15)))
      .catch(() => {});
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getCoaches();
      const stats = await Promise.all(rows.map(c => getCoachWeekStats(c.id).catch(() => ({ lessons: 0 }))));
      const mapped = rows.map((c, i) => ({
        id: c.id,
        name: c.name,
        weapons: c.weapon ? [c.weapon] : [],
        maitre: !!c.maitre,
        load: stats[i]?.lessons ?? 0,
        max: c.max_load || 12,
        bio: c.blurb,
        email: c.email,
        availability_json: c.availability_json,
      }));
      setCoaches(mapped);
      setSelected(sel => sel && mapped.some(m => m.id === sel) ? sel : (mapped[0]?.id ?? null));
    } catch {
      /* leave empty on failure */
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const saveAvail = React.useCallback((coachId, json) => {
    setCoaches(cs => cs.map(c => c.id === coachId ? { ...c, availability_json: json } : c));
    updateCoachAvailability(coachId, json).catch(() => {});
  }, []);

  const createNew = React.useCallback(async ({ name, email, weapon, maitre }) => {
    const id = slugify(name);
    await createCoach({ id, name, email, weapon, maitre, max_load: 12, availability_json: { slots: {}, blackout: {} } });
    await load();
    setSelected(id);
  }, [load]);

  const coach = coaches.find(c => c.id === selected);

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid var(--hairline)', padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && coaches.length === 0 && (
          <>{[0,1].map(i => <div key={i} className="r-skeleton" style={{ height: 150, borderRadius: 'var(--r-card)' }} />)}</>
        )}
        {coaches.map(c => (
          <CoachRosterCard key={c.id} coach={c} selected={selected===c.id} onSelect={() => setSelected(c.id)} />
        ))}
        <button onClick={() => setAdding(true)} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: '1px dashed var(--hairline)', background: 'transparent', borderRadius: 'var(--r-card)', padding: 14, fontSize: 13.5, fontWeight: 600, color: 'var(--muted)' }}>
          <Icon name="plus" size={16} color="var(--muted)" /> Add coach
        </button>
      </div>
      <div key={selected} style={{ flex: 1, overflowY: 'auto', padding: 24, animation: 'r-fade var(--d-base) var(--e-standard)' }}>
        {coach ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <Avatar name={coach.name} size={40} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{coach.name}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{coach.email || 'Weekly availability template'}</div>
              </div>
            </div>
            <AvailGrid coach={coach} onSave={saveAvail} availSlots={availSlots} />
          </>
        ) : !loading && (
          <div style={{ padding: 40, color: 'var(--muted)', fontSize: 14 }}>No coaches yet. Add one to get started.</div>
        )}
      </div>
      {adding && <AddCoachPanel onClose={() => setAdding(false)} onCreate={createNew} />}
    </div>
  );
}
