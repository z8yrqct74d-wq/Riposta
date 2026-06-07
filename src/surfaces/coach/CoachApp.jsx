import React from 'react';
import { Icon, Avatar, WeaponGlyph, WeaponChip } from '../../components/Shared';
import { IOSDevice } from '../../components/IOSFrame';
import { SessionAttendance, LessonView } from './CoachSession';

const CKIND = { lesson: 'var(--brand)', group: 'var(--steel)', open: 'var(--hairline)' };

const MY_DAY = [
  { id: 'm1', t: '16:30', type: 'group',  title: 'Sabre · U14',  who: '8 athletes',      weapon: 'sabre', piste: 'Riposte Main Room', status: 'done' },
  { id: 'm2', t: '18:00', type: 'group',  title: 'Sabre squad',  who: '6 athletes',      weapon: 'sabre', piste: 'Riposte Main Room', status: 'live', live: true },
  { id: 'm3', t: '18:00', type: 'lesson', title: 'Maya Rocha',   who: 'Sabre · U17',     weapon: 'sabre', piste: 'Riposte Main Room', status: 'next' },
  { id: 'm4', t: '19:30', type: 'lesson', title: 'Tomas Király', who: 'Sabre · Senior',  weapon: 'sabre', piste: 'Riposte Main Room', status: 'upcoming' },
  { id: 'm5', t: '20:30', type: 'lesson', title: 'Léa Bernard',  who: 'Sabre · U14',     weapon: 'sabre', piste: 'Riposte Main Room', status: 'upcoming' },
];

const WEEK_DAYS = [
  { dow: 'Mon', dom: 2,  items: [] },
  { dow: 'Tue', dom: 3,  items: [{ type: 'lesson', title: 'Maya Rocha', t: '18:00', weapon: 'sabre' }] },
  { dow: 'Wed', dom: 4,  items: [{ type: 'group', title: 'Sabre U14', t: '17:30', weapon: 'sabre' }, { type: 'lesson', title: 'Léa Bernard', t: '19:00', weapon: 'sabre' }] },
  { dow: 'Thu', dom: 5,  items: MY_DAY, today: true },
  { dow: 'Fri', dom: 6,  items: [{ type: 'lesson', title: 'Tomas Király', t: '18:00', weapon: 'sabre' }] },
  { dow: 'Sat', dom: 7,  items: [{ type: 'group', title: 'Open sabre', t: '10:00', weapon: 'sabre' }] },
  { dow: 'Sun', dom: 8,  items: [] },
];

const MONTH_SESSIONS = {
  2: [{ type: 'lesson' }], 3: [{ type: 'lesson' }, { type: 'group' }],
  4: [{ type: 'group' }, { type: 'lesson' }], 5: [{ type: 'group' }, { type: 'group' }, { type: 'lesson' }],
  6: [{ type: 'lesson' }], 7: [{ type: 'group' }], 9: [{ type: 'lesson' }],
  10: [{ type: 'group' }, { type: 'lesson' }], 11: [{ type: 'group' }],
  12: [{ type: 'lesson' }, { type: 'lesson' }], 14: [{ type: 'group' }],
  16: [{ type: 'lesson' }], 17: [{ type: 'group' }, { type: 'lesson' }],
  18: [{ type: 'group' }], 19: [{ type: 'lesson' }], 21: [{ type: 'group' }, { type: 'lesson' }],
  23: [{ type: 'lesson' }], 24: [{ type: 'group' }], 25: [{ type: 'lesson' }, { type: 'lesson' }],
  26: [{ type: 'group' }], 28: [{ type: 'lesson' }], 30: [{ type: 'group' }, { type: 'lesson' }],
};

function StatusTag({ status }) {
  const map = {
    done: ['Done', 'var(--muted)', 'transparent'],
    live: ['Live', 'var(--live)', 'transparent'],
    next: ['Up next', 'var(--brand)', 'var(--brand-tint)'],
    upcoming: ['', '', ''],
  };
  const [label, fg, bg] = map[status];
  if (!label) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', color: fg, background: bg, padding: bg === 'transparent' ? 0 : '2px 8px', borderRadius: 'var(--r-pill)' }}>
      {status === 'live' && <span className="r-live-dot" />}
      {label}
    </span>
  );
}

function ViewSwitcher({ view, onChange }) {
  const opts = ['Day', 'Week', 'Month'];
  return (
    <div style={{ display: 'flex', background: 'var(--elevated)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-pill)', padding: 3, gap: 0 }}>
      {opts.map(o => (
        <button key={o} onClick={() => onChange(o)} className="r-focusable" style={{
          flex: 1, font: 'inherit', cursor: 'pointer', border: 'none',
          borderRadius: 'var(--r-pill)', padding: '7px 14px',
          background: view === o ? 'var(--brand)' : 'transparent',
          color: view === o ? '#fff' : 'var(--muted)',
          fontSize: 13, fontWeight: 600,
          transition: 'background var(--d-fast) var(--e-spring), color var(--d-fast)',
        }}>{o}</button>
      ))}
    </div>
  );
}

function Stat({ n, l, accent }) {
  return (
    <div>
      <span className="r-display r-tabular" style={{ fontSize: 22, color: accent || 'var(--ink)' }}>{n}</span>
      <span style={{ fontSize: 12.5, color: 'var(--muted)', marginLeft: 5 }}>{l}</span>
    </div>
  );
}

function WeekView({ onOpen }) {
  return (
    <div className="r-scroll" style={{ overflowX: 'auto', paddingBottom: 100 }}>
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px', minWidth: 480 }}>
        {WEEK_DAYS.map((d, di) => (
          <div key={d.dow} style={{ flex: d.today ? 1.15 : 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ textAlign: 'center', paddingBottom: 4 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: d.today ? 'var(--brand)' : 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.dow}</div>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: d.today ? 'var(--brand)' : 'transparent', color: d.today ? '#fff' : 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '3px auto 0', fontSize: 14, fontWeight: d.today ? 700 : 500 }}>{d.dom}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {d.items.length === 0 ? (
                <div style={{ height: 48, borderRadius: 'var(--r-cal)', border: '1px dashed var(--hairline)', opacity: 0.4 }} />
              ) : d.items.map((it, ii) => {
                const bar = CKIND[it.type] || CKIND.lesson;
                const live = it.status === 'live';
                return (
                  <button key={ii} onClick={() => d.today && onOpen && onOpen(it)} className="r-focusable" style={{ font: 'inherit', cursor: d.today ? 'pointer' : 'default', textAlign: 'left', border: 'none', background: 'var(--surface)', borderLeft: `3px solid ${bar}`, borderRadius: 'var(--r-cal)', padding: '6px 7px', opacity: it.status === 'done' ? 0.45 : 1, animation: `r-rise var(--d-base) var(--e-enter) ${(di*2+ii)*25}ms both` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {live && <span className="r-live-dot" style={{ width: 5, height: 5 }} />}
                      {it.title}
                    </div>
                    <div className="r-tabular" style={{ fontSize: 10, color: 'var(--faint)', marginTop: 1 }}>{it.t}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthView() {
  const [selDay, setSelDay] = React.useState(5);
  const firstDow = 0;
  const daysInMonth = 30;
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const selSessions = MONTH_SESSIONS[selDay] || [];

  return (
    <div className="r-scroll" style={{ overflowY: 'auto', paddingBottom: 100 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, padding: '0 12px', marginBottom: 4 }}>
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 600, color: 'var(--faint)', padding: '6px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, padding: '0 12px' }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const sessions = MONTH_SESSIONS[d] || [];
          const isToday = d === 5;
          const isSel = d === selDay;
          return (
            <button key={d} onClick={() => setSelDay(d)} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: 'none', borderRadius: 8, padding: '6px 4px 5px', background: isSel ? 'var(--brand)' : isToday ? 'var(--brand-tint)' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'background var(--d-fast)' }}>
              <span style={{ fontSize: 13.5, fontWeight: isToday || isSel ? 700 : 400, color: isSel ? '#fff' : isToday ? 'var(--brand)' : 'var(--ink)' }}>{d}</span>
              <div style={{ display: 'flex', gap: 2 }}>
                {sessions.slice(0, 3).map((s, si) => (
                  <div key={si} style={{ width: 4, height: 4, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,0.7)' : CKIND[s.type] || 'var(--steel)' }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          {selDay === 5 ? 'Today · 5 Jun' : `${selDay} Jun`}
        </div>
        {selSessions.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--faint)', fontSize: 13 }}>No sessions</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {selSessions.map((s, i) => {
              const bar = CKIND[s.type] || CKIND.lesson;
              const label = s.title || (s.type === 'lesson' ? 'Individual lesson' : s.type === 'group' ? 'Group session' : 'Open fencing');
              return (
                <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderLeft: `3px solid ${bar}`, borderRadius: 'var(--r-cal)', padding: '9px 12px', fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
                  {selDay === 5 && MY_DAY[i] ? MY_DAY[i].title : label}
                  <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 6, textTransform: 'capitalize', fontSize: 12 }}>{s.type}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MyDay({ onOpen }) {
  const [view, setView] = React.useState('Day');
  return (
    <div style={{ height: '100%', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '56px 16px 12px', flexShrink: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>Thursday, 5 June</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <h1 className="r-display" style={{ margin: 0, fontSize: 28, color: 'var(--ink)' }}>My day</h1>
          <ViewSwitcher view={view} onChange={setView} />
        </div>
        {view === 'Day' && (
          <div style={{ display: 'flex', gap: 16 }}>
            <Stat n="5" l="sessions" /><Stat n="3" l="lessons" /><Stat n="1" l="live" accent="var(--live)" />
          </div>
        )}
      </div>
      <div key={view} style={{ flex: 1, overflow: 'hidden', animation: 'r-fade var(--d-fast) var(--e-standard)' }}>
        {view === 'Day' && (
          <div className="r-scroll" style={{ height: '100%', overflowY: 'auto', padding: '4px 16px 100px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MY_DAY.map((it, i) => {
              const bar = CKIND[it.type] || CKIND.lesson;
              return (
                <button key={it.id} onClick={() => onOpen(it)} className="r-focusable" style={{
                  font: 'inherit', cursor: 'pointer', textAlign: 'left', width: '100%',
                  background: 'var(--surface)', border: '1px solid var(--hairline)',
                  borderLeft: `3px solid ${it.status === 'done' ? 'var(--hairline)' : bar}`,
                  borderRadius: 'var(--r-card)', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12,
                  opacity: it.status === 'done' ? 0.55 : 1,
                  animation: `r-rise var(--d-base) var(--e-enter) ${i*40}ms both`,
                }}>
                  <div className="r-tabular" style={{ textAlign: 'center', width: 44, flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{it.t}</div>
                    <div style={{ fontSize: 10, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{it.type}</div>
                  </div>
                  <WeaponGlyph type={it.weapon} size={22} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{it.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{it.who} · {it.piste}</div>
                  </div>
                  <StatusTag status={it.status} />
                  <Icon name="chevR" size={18} color="var(--faint)" />
                </button>
              );
            })}
          </div>
        )}
        {view === 'Week' && <WeekView onOpen={onOpen} />}
        {view === 'Month' && <MonthView />}
      </div>
    </div>
  );
}

const COACH_ATHLETES = [
  { name: 'Maya Rocha',    cat: 'U17', credits: 5, lastSeen: 'Today',     att: 92, weapon: 'sabre', streak: 4 },
  { name: 'Tomas Király',  cat: 'Senior', credits: 2, lastSeen: 'Yesterday', att: 88, weapon: 'sabre', streak: 2 },
  { name: 'Léa Bernard',   cat: 'U14', credits: 8, lastSeen: '2 Jun',     att: 95, weapon: 'sabre', streak: 6 },
  { name: 'Sofia Marin',   cat: 'U14', credits: 4, lastSeen: '1 Jun',     att: 80, weapon: 'sabre', streak: 1 },
  { name: 'Hugo Almeida',  cat: 'Senior', credits: 1, lastSeen: '3 Jun',  att: 75, weapon: 'sabre', streak: 0 },
  { name: 'Noah Klein',    cat: 'U11', credits: 1, lastSeen: '4 Jun',     att: 90, weapon: 'sabre', streak: 3 },
];

function CoachAthletes() {
  const [q, setQ] = React.useState('');
  const rows = COACH_ATHLETES.filter(a => a.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ height: '100%', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '56px 16px 12px', flexShrink: 0 }}>
        <h1 className="r-display" style={{ margin: '0 0 12px', fontSize: 28, color: 'var(--ink)' }}>Athletes</h1>
        <div style={{ position: 'relative' }}>
          <Icon name="search" size={16} color="var(--faint)" style={{ position: 'absolute', left: 12, top: 10 }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" className="r-focusable" style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 'var(--r-btn)', border: '1px solid var(--hairline)', background: 'var(--surface)', font: 'inherit', fontSize: 14, color: 'var(--ink)', boxSizing: 'border-box' }} />
        </div>
      </div>
      <div className="r-scroll" style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 100px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((a, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, animation: `r-rise var(--d-base) var(--e-enter) ${i*35}ms both` }}>
            <Avatar name={a.name} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{a.name}</span>
                <span style={{ fontSize: 11.5, color: 'var(--faint)' }}>{a.cat}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 5, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 44, height: 4, borderRadius: 2, background: 'var(--hairline)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: a.att + '%', background: a.att >= 90 ? 'var(--success)' : a.att >= 75 ? 'var(--warning)' : 'var(--danger)', borderRadius: 2 }} />
                  </div>
                  <span className="r-tabular" style={{ fontSize: 11, color: 'var(--muted)' }}>{a.att}%</span>
                </div>
                {a.streak > 0 && <span style={{ fontSize: 11, color: 'var(--steel)' }}>{a.streak}wk streak</span>}
                <span style={{ fontSize: 11, color: 'var(--faint)', marginLeft: 'auto' }}>Last {a.lastSeen}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="r-mono" style={{ fontSize: 17, fontWeight: 600, color: a.credits <= 1 ? 'var(--danger)' : 'var(--ink)' }}>{a.credits}</div>
              <div style={{ fontSize: 10, color: 'var(--faint)', marginTop: 1 }}>credits</div>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--faint)' }}>
            <div className="r-display" style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 4 }}>No results</div>
            <div style={{ fontSize: 13 }}>Try a different name.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function CoachProfile() {
  const [notifs, setNotifs] = React.useState(true);
  const [digest, setDigest] = React.useState(true);
  return (
    <div style={{ height: '100%', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '52px 20px 16px', borderBottom: '1px solid var(--hairline)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <Avatar name="Constantin Sandu" size={60} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>Constantin Sandu</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <WeaponChip type="sabre" />
          </div>
        </div>
      </div>
      <div className="r-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 2px 10px' }}>This week</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['8', 'lessons'], ['5', 'sessions'], ['92%', 'attendance']].map(([v, l]) => (
              <div key={l} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '13px 10px', textAlign: 'center' }}>
                <div className="r-display r-tabular" style={{ fontSize: 22, color: 'var(--ink)' }}>{v}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        {[[
          'Notifications',
          [['Session reminders', true, setNotifs, notifs], ['AI digest', true, setDigest, digest]]
        ],[
          'Account',
          [['Email', 'sandu@riposte.ro', null, null], ['Role', 'Coach', null, null]]
        ]].map(([section, rows]) => (
          <div key={section} style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 2px 10px' }}>{section}</div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
              {rows.map(([label, val, setter, state], ri) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '13px 14px', borderBottom: ri < rows.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--ink)' }}>{label}</span>
                  {setter ? (
                    <button onClick={() => setter(v => !v)} className="r-focusable" style={{ width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: state ? 'var(--brand)' : 'var(--hairline)', position: 'relative', transition: 'background var(--d-base) var(--e-spring)', flexShrink: 0 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: state ? 21 : 3, transition: 'left 220ms var(--e-spring)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </button>
                  ) : (
                    <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>{val}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
          <button className="r-focusable" style={{ width: '100%', font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '13px 14px', border: 'none', background: 'transparent', color: 'var(--brand)', fontSize: 14, fontWeight: 600 }}>
            <Icon name="lock" size={16} color="var(--brand)" style={{ marginRight: 10 }} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function Availability() {
  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat'];
  const SLOTS = ['16:00','17:00','18:00','19:00','20:00','21:00'];
  const [grid, setGrid] = React.useState(() => {
    const g = {};
    DAYS.forEach(d => SLOTS.forEach(s => { g[`${d}|${s}`] = !(d === 'Sat' && +s.slice(0,2) >= 19) && !(d==='Wed'); }));
    return g;
  });
  const [blackout, setBlackout] = React.useState({ Wed: true });

  return (
    <div style={{ height: '100%', background: 'var(--paper)' }}>
      <div className="r-scroll" style={{ height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
        <div style={{ padding: '56px 20px 10px' }}>
          <h1 className="r-display" style={{ margin: 0, fontSize: 30, color: 'var(--ink)' }}>Availability</h1>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Tap a slot to toggle. Recurring weekly.</div>
        </div>
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${DAYS.length}, 1fr)`, gap: 4 }}>
            <div />
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 600, color: blackout[d] ? 'var(--danger)' : 'var(--muted)', paddingBottom: 4 }}>{d}</div>
            ))}
            {SLOTS.map(s => (
              <React.Fragment key={s}>
                <div className="r-tabular" style={{ fontSize: 10.5, color: 'var(--faint)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>{s}</div>
                {DAYS.map(d => {
                  const on = grid[`${d}|${s}`] && !blackout[d];
                  return (
                    <button key={d+s} disabled={blackout[d]} onClick={() => setGrid(g => ({ ...g, [`${d}|${s}`]: !g[`${d}|${s}`] }))} className="r-focusable" style={{ font: 'inherit', cursor: blackout[d] ? 'default' : 'pointer', aspectRatio: '1', borderRadius: 6, border: '1px solid ' + (on ? 'var(--brand)' : 'var(--hairline)'), background: blackout[d] ? 'repeating-linear-gradient(45deg, transparent, transparent 4px, var(--hairline) 4px, var(--hairline) 5px)' : on ? 'var(--brand)' : 'var(--surface)', transition: 'background var(--d-fast), border-color var(--d-fast)' }} />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Blackout days</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DAYS.map(d => (
                <button key={d} onClick={() => setBlackout(b => ({ ...b, [d]: !b[d] }))} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '7px 14px', borderRadius: 'var(--r-pill)', border: '1px solid ' + (blackout[d] ? 'var(--danger)' : 'var(--hairline)'), background: blackout[d] ? 'var(--danger-tint)' : 'var(--surface)', color: blackout[d] ? 'var(--danger)' : 'var(--muted)' }}>{d}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 22, padding: 14, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="calendar" size={18} color="var(--steel)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>One-off exception</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>Away Fri 13 Jun — regional comp</div>
            </div>
            <Icon name="chevR" size={16} color="var(--faint)" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CoachTabBar({ active, onChange }) {
  const tabs = [
    { id: 'day', label: 'My day', icon: 'calendar' },
    { id: 'roster', label: 'Athletes', icon: 'users' },
    { id: 'avail', label: 'Availability', icon: 'clock' },
    { id: 'profile', label: 'Profile', icon: 'user' },
  ];
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40, background: 'color-mix(in oklab, var(--surface) 88%, transparent)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: '1px solid var(--hairline)', paddingBottom: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 10px 4px' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => onChange(t.id)} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 8px', width: 72 }}>
            <Icon name={t.icon} size={22} color={active === t.id ? 'var(--brand)' : 'var(--faint)'} strokeWidth={active === t.id ? 2 : 1.6} />
            <span style={{ fontSize: 10.5, fontWeight: active === t.id ? 600 : 500, color: active === t.id ? 'var(--brand)' : 'var(--faint)' }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CoachApp() {
  const [tab, setTab] = React.useState('day');
  const [stack, setStack] = React.useState(null);

  const open = (item) => {
    if (item.type === 'lesson') setStack('lesson');
    else setStack('session');
  };

  return (
    <div className="theme-dark" style={{ position: 'absolute', inset: 0, background: 'var(--paper)', overflow: 'hidden' }}>
      {!stack && (
        <>
          <div key={tab} style={{ position: 'absolute', inset: 0, animation: 'r-fade var(--d-base) var(--e-standard)' }}>
            {tab === 'day' && <MyDay onOpen={open} />}
            {tab === 'avail' && <Availability />}
            {tab === 'roster' && <CoachAthletes />}
            {tab === 'profile' && <CoachProfile />}
          </div>
          <CoachTabBar active={tab} onChange={setTab} />
        </>
      )}
      {stack && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, animation: 'r-push 240ms var(--e-enter) both' }}>
          {stack === 'session' && <SessionAttendance onBack={() => setStack(null)} onDone={() => setStack(null)} />}
          {stack === 'lesson' && <LessonView onBack={() => setStack(null)} />}
        </div>
      )}
      <style>{`
        @keyframes r-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes r-push { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

export function CoachAppPage() {
  const mobile = window.innerWidth < 500;
  if (mobile) {
    return (
      <div className="theme-dark" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--paper)' }}>
        <CoachApp />
      </div>
    );
  }
  return (
    <div style={{ minHeight: '100vh', background: '#0C1A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <IOSDevice>
        <CoachApp />
      </IOSDevice>
    </div>
  );
}
