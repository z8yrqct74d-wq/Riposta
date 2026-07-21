import React from 'react';
import { Icon, Avatar, WeaponGlyph } from '../../components/Shared';
import { ChromeWindow } from '../../components/BrowserWindow';
import { PISTES, CAL_START, CAL_END, INITIAL_BLOCKS, KIND, COACH } from '../../data/adminData';
import { ResourceCalendar, findConflicts } from './AdminCalendar';
import { AdminDashboard, AdminMembers } from './AdminViews';
import { MemberDetail } from './AdminMemberDetail';
import { AdminCoaches } from './AdminCoaches';
import { AdminPlans, AdminSettings } from './AdminPlansSettings';
import { getCalendarBlocks, createCalendarBlock, updateCalendarBlock, deleteCalendarBlock } from '../../lib/db';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'members', label: 'Members', icon: 'users' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'coaches', label: 'Coaches', icon: 'user' },
  { id: 'plans', label: 'Plans & billing', icon: 'card' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

function Logo({ size = 26, color = 'var(--brand)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="11" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M7 17 L17 7" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 17 L15 7" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
      <circle cx="7" cy="17" r="1.4" fill={color} />
    </svg>
  );
}

function Sidebar({ active, onNav }) {
  return (
    <div style={{ width: 216, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', padding: '20px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 22px' }}>
        <Logo size={26} />
        <span className="r-display" style={{ fontSize: 20, color: 'var(--ink)' }}>Riposte</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(n => {
          const on = active === n.id;
          return (
            <button key={n.id} onClick={() => onNav(n.id)} className="r-focusable" style={{
              font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11,
              padding: '9px 10px', borderRadius: 'var(--r-btn)', border: 'none', textAlign: 'left',
              background: on ? 'var(--brand-tint)' : 'transparent',
              color: on ? 'var(--brand)' : 'var(--muted)', fontSize: 13.5, fontWeight: on ? 600 : 500,
              transition: 'background var(--d-fast)',
            }}>
              <Icon name={n.icon} size={18} color={on ? 'var(--brand)' : 'var(--muted)'} strokeWidth={on ? 1.9 : 1.6} />
              {n.label}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderTop: '1px solid var(--hairline)' }}>
        <Avatar name="Club Admin" size={30} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>Club Admin</div>
          <div style={{ fontSize: 11, color: 'var(--faint)' }}>Salle d'Armes</div>
        </div>
      </div>
    </div>
  );
}

function AIDigest({ items, onDismiss }) {
  return (
    <div style={{ overflow: 'hidden', animation: 'r-digest 240ms var(--e-enter)' }}>
      <div style={{ margin: '0 24px 0', background: 'var(--steel-tint)', border: '1px solid color-mix(in oklab, var(--steel) 25%, transparent)', borderRadius: 'var(--r-card)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          <Icon name="sparkle" size={16} color="var(--steel)" />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--steel)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Digest</span>
        </div>
        <div style={{ display: 'flex', gap: 20, flex: 1, flexWrap: 'wrap' }}>
          {items.map((it, i) => (
            <span key={i} style={{ fontSize: 13, color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: it.tone === 'danger' ? 'var(--danger)' : it.tone === 'warning' ? 'var(--warning)' : 'var(--steel)' }} />
              {it.text}
            </span>
          ))}
        </div>
        <button onClick={onDismiss} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent', padding: 4, display: 'flex' }}>
          <Icon name="x" size={16} color="var(--muted)" />
        </button>
      </div>
      <style>{`@keyframes r-digest { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

const NAV_CTA = {
  calendar: { label: 'New block',  icon: 'plus' },
  members:  { label: 'Add member', icon: 'plus' },
  coaches:  { label: 'Add coach',  icon: 'plus' },
  plans:    { label: 'New plan',   icon: 'plus' },
};

function TopBar({ title, sub, view, onView, onNew, nav }) {
  const cta = NAV_CTA[nav];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 14px', flexShrink: 0 }}>
      <div style={{ minWidth: 0 }}>
        <h1 className="r-display" style={{ margin: 0, fontSize: 26, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{title}</h1>
        {sub && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap' }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {nav === 'calendar' && (
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-btn)', padding: 2 }}>
            {['Day','Week','Month'].map(v => (
              <button key={v} onClick={() => onView(v)} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 600, background: view === v ? 'var(--ink)' : 'transparent', color: view === v ? 'var(--paper)' : 'var(--muted)' }}>{v}</button>
            ))}
          </div>
        )}
        {cta && (
          <button onClick={onNew} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, border: 'none', background: 'var(--brand)', color: '#fff', borderRadius: 'var(--r-btn)', padding: '9px 15px', fontSize: 13.5, fontWeight: 600 }}>
            <Icon name={cta.icon} size={16} color="#fff" /> {cta.label}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>{label}</div>{children}</div>;
}

const selStyle = () => ({ width: '100%', padding: '9px 11px', borderRadius: 'var(--r-btn)', border: '1px solid var(--hairline)', background: 'var(--paper)', font: 'inherit', fontSize: 13.5, color: 'var(--ink)', boxSizing: 'border-box' });

function SidePanel({ draft, onChange, onSave, onDelete, onClose, conflict }) {
  if (!draft) return null;
  const times = []; for (let t = CAL_START; t <= CAL_END - 15; t += 15) times.push(t);
  const durs = [30,45,60,75,90,105,120];
  const isNew = !draft.id;
  const fmtTime = (min) => { const h = Math.floor(min / 60), m = min % 60; return `${h}:${String(m).padStart(2, '0')}`; };
  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(23,21,15,0.18)', zIndex: 40, animation: 'r-scrim var(--d-base) ease' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 340, background: 'var(--surface)', borderLeft: '1px solid var(--hairline)', zIndex: 50, boxShadow: 'var(--shadow-raise)', animation: 'r-panel 240ms var(--e-enter)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--hairline)' }}>
          <h2 className="r-display" style={{ margin: 0, fontSize: 20, color: 'var(--ink)' }}>{isNew ? 'New block' : 'Edit block'}</h2>
          <button onClick={onClose} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent', display: 'flex' }}><Icon name="x" size={18} color="var(--muted)" /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          <Field label="Type">
            <div style={{ display: 'flex', gap: 6 }}>
              {Object.keys(KIND).map(k => (
                <button key={k} onClick={() => onChange({ kind: k })} className="r-focusable" style={{ flex: 1, font: 'inherit', cursor: 'pointer', borderRadius: 'var(--r-btn)', padding: '8px 4px', fontSize: 12.5, fontWeight: 600, border: '1px solid ' + (draft.kind===k?KIND[k].fg:'var(--hairline)'), background: draft.kind===k?KIND[k].bg:'transparent', color: draft.kind===k?KIND[k].fg:'var(--muted)' }}>{KIND[k].label}</button>
              ))}
            </div>
          </Field>
          <Field label="Title"><input value={draft.title} onChange={e => onChange({ title: e.target.value })} className="r-focusable" style={selStyle()} placeholder="e.g. Maya Rocha" /></Field>
          <Field label="Piste">
            <select value={draft.piste} onChange={e => onChange({ piste: e.target.value })} className="r-focusable" style={selStyle()}>
              {PISTES.map(p => <option key={p.id} value={p.id}>{p.label}{p.electric ? ' · electric' : ''}</option>)}
            </select>
          </Field>
          <div style={{ display: 'flex', gap: 12 }}>
            <Field label="Start"><select value={draft.start} onChange={e => onChange({ start: +e.target.value })} className="r-focusable" style={selStyle()}>{times.map(t => <option key={t} value={t}>{fmtTime(t)}</option>)}</select></Field>
            <Field label="Length"><select value={draft.dur} onChange={e => onChange({ dur: +e.target.value })} className="r-focusable" style={selStyle()}>{durs.map(d => <option key={d} value={d}>{d} min</option>)}</select></Field>
          </div>
          {draft.kind !== 'open' && (
            <>
              <Field label="Coach">
                <select value={draft.coach || ''} onChange={e => onChange({ coach: e.target.value || null })} className="r-focusable" style={selStyle()}>
                  <option value="">— none —</option>
                  {Object.entries(COACH).map(([id, c]) => <option key={id} value={id}>{c.name}{c.maitre ? ' (Maître)' : ''}</option>)}
                </select>
              </Field>
              <Field label="Weapon">
                <div style={{ display: 'flex', gap: 6 }}>
                  {['foil','epee','sabre'].map(w => (
                    <button key={w} onClick={() => onChange({ weapon: w })} className="r-focusable" style={{ flex: 1, font: 'inherit', cursor: 'pointer', borderRadius: 'var(--r-btn)', padding: '8px', border: '1px solid ' + (draft.weapon===w?'var(--brand)':'var(--hairline)'), background: draft.weapon===w?'var(--brand-tint)':'transparent', display: 'flex', justifyContent: 'center' }}>
                      <WeaponGlyph type={w} size={20} color={draft.weapon===w?'var(--brand)':'var(--steel)'} />
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}
          {conflict && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--danger-tint)', color: 'var(--danger)', padding: '9px 12px', borderRadius: 'var(--r-btn)', fontSize: 12.5, fontWeight: 500 }}>
              <Icon name="x" size={15} color="var(--danger)" /> {conflict}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, padding: 20, borderTop: '1px solid var(--hairline)' }}>
          {!isNew && <button onClick={onDelete} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', padding: '11px 14px', borderRadius: 'var(--r-btn)', border: '1px solid var(--brand)', background: 'transparent', color: 'var(--brand)', fontSize: 13.5, fontWeight: 600 }}>Delete</button>}
          <button onClick={onSave} className="r-focusable" style={{ flex: 1, font: 'inherit', cursor: 'pointer', padding: '11px', borderRadius: 'var(--r-btn)', border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13.5, fontWeight: 600 }}>{isNew ? 'Create block' : 'Save changes'}</button>
        </div>
      </div>
      <style>{`
        @keyframes r-panel { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes r-scrim { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const tone = toast.tone === 'danger' ? ['var(--danger)','var(--danger-tint)'] : toast.tone === 'success' ? ['var(--success)','var(--success-tint)'] : ['var(--ink)','var(--surface)'];
  return (
    <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 80, background: 'var(--surface)', border: `1px solid ${tone[0]}`, borderLeft: `3px solid ${tone[0]}`, borderRadius: 'var(--r-btn)', padding: '11px 16px', boxShadow: 'var(--shadow-raise)', display: 'flex', alignItems: 'center', gap: 9, animation: 'r-toast 200ms var(--e-enter)' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: tone[0] }} />
      <span style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 500 }}>{toast.msg}</span>
      <style>{`@keyframes r-toast { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%); } }`}</style>
    </div>
  );
}

function AdminApp() {
  const [nav, setNav] = React.useState('calendar');
  const [view, setView] = React.useState('Day');
  const [blocks, setBlocks] = React.useState(INITIAL_BLOCKS);
  const [draft, setDraft] = React.useState(null);
  const [panelConflict, setPanelConflict] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [digest, setDigest] = React.useState(true);
  const [selMember, setSelMember] = React.useState(null);

  // Load blocks from Supabase on mount
  React.useEffect(() => {
    getCalendarBlocks()
      .then(data => { if (data.length) setBlocks(data); })
      .catch(() => {}); // silently fall back to INITIAL_BLOCKS
  }, []);

  const fireToast = (msg, tone) => { setToast({ msg, tone }); setTimeout(() => setToast(null), 2600); };

  const openCreate = (partial) => { setPanelConflict(null); setDraft({ kind: 'lesson', title: '', piste: 'p1', start: 18*60, dur: 45, coach: 'sandu', weapon: 'sabre', ...partial }); };
  const openEdit = (b) => { setPanelConflict(null); setDraft({ ...b }); };
  const changeDraft = (patch) => setDraft(d => ({ ...d, ...patch }));

  const saveDraft = async () => {
    const cand = { id: draft.id || 'new', piste: draft.piste, start: draft.start, dur: draft.dur, coach: draft.kind === 'open' ? null : draft.coach };
    const c = findConflicts(cand, blocks);
    if (c.any) { setPanelConflict(c.pisteClash ? 'That piste is already booked for this time.' : 'That coach is already booked for this time.'); return; }
    const cleaned = { ...draft, coach: draft.kind === 'open' ? null : draft.coach };
    if (draft.id) {
      setBlocks(bs => bs.map(b => b.id === draft.id ? cleaned : b));
      updateCalendarBlock(draft.id, cleaned).catch(() => {});
      fireToast('Block updated', 'success');
    } else {
      const newBlock = { ...cleaned, id: 'b' + Date.now() };
      setBlocks(bs => [...bs, newBlock]);
      createCalendarBlock(newBlock).catch(() => {});
      fireToast('Block created', 'success');
    }
    setDraft(null);
  };
  const deleteDraft = () => {
    setBlocks(bs => bs.filter(b => b.id !== draft.id));
    deleteCalendarBlock(draft.id).catch(() => {});
    setDraft(null);
    fireToast('Block removed', 'default');
  };

  const titles = {
    dashboard: ['Dashboard', 'Friday, 6 June 2026'],
    members:   ['Members', '7 athletes'],
    calendar:  ['Resource calendar', 'Friday, 6 June 2026 · Riposte Main Room'],
    coaches:   ['Coaches', '2 active'],
    plans:     ['Plans & billing', ''],
    settings:  ['Settings', ''],
  };

  const showDigest = digest && (nav === 'dashboard' || nav === 'calendar') && !selMember;

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--paper)', fontFamily: 'var(--font-ui)', position: 'relative', overflow: 'hidden' }}>
      <Sidebar active={nav} onNav={(id) => { setNav(id); setSelMember(null); }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', overflow: 'hidden' }}>
        {selMember ? (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
            <MemberDetail member={selMember} onBack={() => setSelMember(null)} />
          </div>
        ) : (
          <>
            <TopBar title={titles[nav][0]} sub={titles[nav][1]} view={view} onView={setView} nav={nav} onNew={() => openCreate({})} />
            {showDigest && (
              <AIDigest onDismiss={() => setDigest(false)} items={[
                { text: '3 lessons unfilled tomorrow at 18:00', tone: 'warning' },
                { text: '2 visas expire this week', tone: 'danger' },
                { text: 'Riposte Main Room fully booked 18–20:00', tone: 'steel' },
              ]} />
            )}
            <div key={nav} style={{ flex: 1, overflow: 'auto', animation: 'r-fade var(--d-base) var(--e-standard)', minHeight: 0 }}>
              {nav === 'dashboard' && <AdminDashboard onGotoCalendar={() => setNav('calendar')} onGotoMembers={() => setNav('members')} />}
              {nav === 'members'   && <AdminMembers onSelectMember={setSelMember} />}
              {nav === 'calendar'  && (
                <div style={{ padding: 24 }}>
                  <ResourceCalendar blocks={blocks} setBlocks={setBlocks} onSelect={openEdit} onCreate={openCreate} toast={fireToast} />
                  <div style={{ display: 'flex', gap: 18, marginTop: 14, fontSize: 12, color: 'var(--muted)', alignItems: 'center' }}>
                    {Object.entries(KIND).map(([k, v]) => (
                      <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: v.bg, border: '1px solid '+v.fg, borderLeft: '3px solid '+v.bar }} /> {v.label}</span>
                    ))}
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--faint)' }}>Drag to move · edge to resize · click lane to add</span>
                  </div>
                </div>
              )}
              {nav === 'coaches'  && <AdminCoaches />}
              {nav === 'plans'    && <AdminPlans />}
              {nav === 'settings' && <AdminSettings />}
            </div>
            {nav === 'calendar' && <SidePanel draft={draft} onChange={changeDraft} onSave={saveDraft} onDelete={deleteDraft} onClose={() => setDraft(null)} conflict={panelConflict} />}
          </>
        )}
        <Toast toast={toast} />
      </div>
      <style>{`@keyframes r-fade { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}

export function AdminAppPage() {
  const vw = window.innerWidth;
  if (vw < 900) {
    const scale = vw / 1340;
    return (
      <div style={{ width: '100vw', height: '100dvh', overflow: 'hidden', background: '#0C1A2E', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', width: 1340, height: 860, flexShrink: 0 }}>
          <ChromeWindow width={1340} height={860} url="riposte.salle / calendar" tabs={[{ title: 'Riposte · Admin' }]}>
            <AdminApp />
          </ChromeWindow>
        </div>
      </div>
    );
  }
  return (
    <div style={{ minHeight: '100vh', background: '#0C1A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <ChromeWindow width={1340} height={860} url="riposte.salle / calendar" tabs={[{ title: 'Riposte · Admin' }]}>
        <AdminApp />
      </ChromeWindow>
    </div>
  );
}
