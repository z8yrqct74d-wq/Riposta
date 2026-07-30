import React from 'react';
import { isoDate } from '@riposte/core';
import { Icon, Avatar, WeaponGlyph } from '../../components/Shared';
import { PISTES, CAL_START, CAL_END, KIND } from '../../data/adminData';
import { ResourceCalendar, findConflicts } from './AdminCalendar';
import { AdminDashboard, AdminMembers } from './AdminViews';
import { MemberDetail } from './AdminMemberDetail';
import { AdminCoaches } from './AdminCoaches';
import { AdminPlans, AdminSettings } from './AdminPlansSettings';
import { getCalendarBlocks, createCalendarBlock, updateCalendarBlock, deleteCalendarBlock, getCoaches, getSettings, getMembers, getPistes } from '../../lib/db';
import { supabase } from '../../lib/core';

const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function fmtLongDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DOW[dt.getDay()]}, ${d} ${MON[m - 1]} ${y}`;
}
function shiftDate(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return isoDate(dt);
}

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

function Sidebar({ active, onNav, adminEmail, clubName }) {
  return (
    <div style={{ width: 216, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', padding: '20px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 22px' }}>
        <Logo size={26} />
        <span className="r-display" style={{ fontSize: 20, color: 'var(--ink)' }}>{clubName || 'Riposte'}</span>
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
        <Avatar name={adminEmail || 'Admin'} size={30} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adminEmail || 'Admin'}</div>
          <div style={{ fontSize: 11, color: 'var(--faint)' }}>{clubName || 'Riposte'}</div>
        </div>
      </div>
    </div>
  );
}

const NAV_CTA = {
  calendar: { label: 'New block',  icon: 'plus' },
  members:  { label: 'Add member', icon: 'plus' },
  coaches:  { label: 'Add coach',  icon: 'plus' },
  plans:    { label: 'New plan',   icon: 'plus' },
};

function TopBar({ title, sub, view, onView, onNew, nav, onPrevDay, onNextDay, onToday }) {
  const cta = NAV_CTA[nav];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 14px', flexShrink: 0 }}>
      <div style={{ minWidth: 0 }}>
        <h1 className="r-display" style={{ margin: 0, fontSize: 26, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{title}</h1>
        {sub && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap' }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {nav === 'calendar' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button onClick={onPrevDay} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: '1px solid var(--hairline)', background: 'var(--surface)', borderRadius: 'var(--r-btn)', padding: '7px 9px', display: 'flex' }}><Icon name="chevL" size={15} color="var(--muted)" /></button>
            <button onClick={onToday} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: '1px solid var(--hairline)', background: 'var(--surface)', borderRadius: 'var(--r-btn)', padding: '7px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--muted)' }}>Today</button>
            <button onClick={onNextDay} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: '1px solid var(--hairline)', background: 'var(--surface)', borderRadius: 'var(--r-btn)', padding: '7px 9px', display: 'flex' }}><Icon name="chevR" size={15} color="var(--muted)" /></button>
          </div>
        )}
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

function SidePanel({ draft, onChange, onSave, onDelete, onClose, conflict, coaches, pistes, calStart, calEnd }) {
  if (!draft) return null;
  const cs = calStart ?? CAL_START, ce = calEnd ?? CAL_END;
  const rooms = (pistes && pistes.length ? pistes : PISTES).map(p => ({ id: p.id, label: p.name ?? p.label, electric: p.electric }));
  const times = []; for (let t = cs; t <= ce - 15; t += 15) times.push(t);
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
          <Field label="Date"><input type="date" value={draft.date} onChange={e => onChange({ date: e.target.value })} className="r-focusable" style={selStyle()} /></Field>
          <Field label="Piste">
            <select value={draft.piste} onChange={e => onChange({ piste: e.target.value })} className="r-focusable" style={selStyle()}>
              {rooms.map(p => <option key={p.id} value={p.id}>{p.label}{p.electric ? ' · electric' : ''}</option>)}
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
                  {coaches.map(c => <option key={c.id} value={c.id}>{c.name}{c.maitre ? ' (Maître)' : ''}</option>)}
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
  const [selectedDate, setSelectedDate] = React.useState(() => isoDate());
  const [blocks, setBlocks] = React.useState([]);
  const [coaches, setCoaches] = React.useState([]);
  const [draft, setDraft] = React.useState(null);
  const [panelConflict, setPanelConflict] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [selMember, setSelMember] = React.useState(null);
  const [settings, setSettings] = React.useState(null);
  const [adminEmail, setAdminEmail] = React.useState(null);
  const [memberCount, setMemberCount] = React.useState(null);
  const [pistes, setPistes] = React.useState([]);

  const coachMap = React.useMemo(() => Object.fromEntries(coaches.map(c => [c.id, c])), [coaches]);
  const clubName = settings?.club_name || null;
  const calStart = settings?.cal_start_min ?? CAL_START;
  const calEnd = settings?.cal_end_min ?? CAL_END;
  const activePistes = React.useMemo(() => pistes.filter(p => p.active !== false), [pistes]);

  React.useEffect(() => {
    getCoaches().then(setCoaches).catch(() => {});
    getSettings().then(setSettings).catch(() => {});
    getMembers().then(ms => setMemberCount(ms.length)).catch(() => {});
    getPistes().then(setPistes).catch(() => {});
    supabase.auth.getUser().then(({ data }) => setAdminEmail(data?.user?.email ?? null)).catch(() => {});
  }, []);

  // Load the selected day's blocks from Supabase whenever the date changes.
  React.useEffect(() => {
    let cancelled = false;
    getCalendarBlocks(selectedDate)
      .then(data => { if (!cancelled) setBlocks(data); })
      .catch(() => { if (!cancelled) setBlocks([]); });
    return () => { cancelled = true; };
  }, [selectedDate]);

  const fireToast = (msg, tone) => { setToast({ msg, tone }); setTimeout(() => setToast(null), 2600); };

  // The top bar's primary CTA is shared across surfaces, but each surface owns
  // its own create flow. This used to call openCreate() unconditionally, so on
  // Members/Coaches/Plans the button built a calendar-block draft that nothing
  // rendered — three dead buttons. Bumping a per-surface counter lets each one
  // open its own panel while keeping their in-page "add" affordances working.
  const [addNonce, setAddNonce] = React.useState({ members: 0, coaches: 0, plans: 0 });
  const requestAdd = () => {
    if (nav === 'calendar') { openCreate({}); return; }
    if (nav in addNonce) setAddNonce(a => ({ ...a, [nav]: a[nav] + 1 }));
  };

  const openCreate = (partial) => { setPanelConflict(null); setDraft({ kind: 'lesson', title: '', piste: activePistes[0]?.id ?? 'p1', date: selectedDate, start: 18*60, dur: settings?.lesson_duration_min ?? 45, coach: coaches[0]?.id ?? null, weapon: 'sabre', ...partial }); };
  const openEdit = (b) => { setPanelConflict(null); setDraft({ ...b }); };
  const changeDraft = (patch) => setDraft(d => ({ ...d, ...patch }));

  const saveDraft = async () => {
    const cand = { id: draft.id || 'new', piste: draft.piste, start: draft.start, dur: draft.dur, coach: draft.kind === 'open' ? null : draft.coach };
    const sameDay = draft.date === selectedDate;
    if (sameDay) {
      const c = findConflicts(cand, blocks);
      if (c.any) { setPanelConflict(c.pisteClash ? 'That piste is already booked for this time.' : 'That coach is already booked for this time.'); return; }
    }
    const cleaned = { ...draft, coach: draft.kind === 'open' ? null : draft.coach };
    if (draft.id) {
      setBlocks(bs => sameDay ? bs.map(b => b.id === draft.id ? cleaned : b) : bs.filter(b => b.id !== draft.id));
      updateCalendarBlock(draft.id, cleaned).catch(() => {});
      fireToast('Block updated', 'success');
    } else {
      const newBlock = { ...cleaned, id: 'b' + Date.now() };
      if (sameDay) setBlocks(bs => [...bs, newBlock]);
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

  const memberSub = memberCount == null ? '' : `${memberCount} athlete${memberCount === 1 ? '' : 's'}`;
  const titles = {
    dashboard: ['Dashboard', fmtLongDate(isoDate())],
    members:   ['Members', memberSub],
    calendar:  ['Resource calendar', fmtLongDate(selectedDate)],
    coaches:   ['Coaches', `${coaches.length} active`],
    plans:     ['Plans & billing', ''],
    settings:  ['Settings', ''],
  };

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--paper)', fontFamily: 'var(--font-ui)', position: 'relative', overflow: 'hidden' }}>
      <Sidebar active={nav} onNav={(id) => { setNav(id); setSelMember(null); }} adminEmail={adminEmail} clubName={clubName} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', overflow: 'hidden' }}>
        {selMember ? (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
            <MemberDetail key={selMember?.id} member={selMember} onBack={() => setSelMember(null)} />
          </div>
        ) : (
          <>
            <TopBar title={titles[nav][0]} sub={titles[nav][1]} view={view} onView={setView} nav={nav} onNew={requestAdd}
              onPrevDay={() => setSelectedDate(d => shiftDate(d, -1))}
              onNextDay={() => setSelectedDate(d => shiftDate(d, 1))}
              onToday={() => setSelectedDate(isoDate())} />
            <div key={nav} style={{ flex: 1, overflow: 'auto', animation: 'r-fade var(--d-base) var(--e-standard)', minHeight: 0 }}>
              {nav === 'dashboard' && <AdminDashboard onGotoCalendar={() => setNav('calendar')} onGotoMembers={() => setNav('members')} />}
              {nav === 'members'   && <AdminMembers onSelectMember={setSelMember} addNonce={addNonce.members} />}
              {nav === 'calendar'  && (
                <div style={{ padding: 24 }}>
                  <ResourceCalendar blocks={blocks} setBlocks={setBlocks} onSelect={openEdit} onCreate={openCreate} toast={fireToast} coachMap={coachMap} pistes={activePistes} calStart={calStart} calEnd={calEnd} />
                  <div style={{ display: 'flex', gap: 18, marginTop: 14, fontSize: 12, color: 'var(--muted)', alignItems: 'center' }}>
                    {Object.entries(KIND).map(([k, v]) => (
                      <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: v.bg, border: '1px solid '+v.fg, borderLeft: '3px solid '+v.bar }} /> {v.label}</span>
                    ))}
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--faint)' }}>Drag to move · edge to resize · click lane to add</span>
                  </div>
                </div>
              )}
              {nav === 'coaches'  && <AdminCoaches addNonce={addNonce.coaches} />}
              {nav === 'plans'    && <AdminPlans addNonce={addNonce.plans} />}
              {nav === 'settings' && <AdminSettings />}
            </div>
            {nav === 'calendar' && <SidePanel draft={draft} onChange={changeDraft} onSave={saveDraft} onDelete={deleteDraft} onClose={() => setDraft(null)} conflict={panelConflict} coaches={coaches} pistes={activePistes} calStart={calStart} calEnd={calEnd} />}
          </>
        )}
        <Toast toast={toast} />
      </div>
      <style>{`@keyframes r-fade { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}

// This used to render the console inside a mock browser window (fake tab bar,
// fake URL bar) at a fixed 1340×860, centred on a dark backdrop — and CSS-scaled
// the whole thing down below 900px wide. That framing came from the HTML
// prototype, where a browser chrome made mockups read as screenshots. Shipped in
// a real browser it drew a browser inside the browser, wasted the vertical space
// its tab and URL bars took, and never used more than 1340px of a wider monitor.
// The console is the page now.
export function AdminAppPage() {
  return (
    <div style={{ height: '100dvh', background: 'var(--paper)' }}>
      <AdminApp />
    </div>
  );
}
