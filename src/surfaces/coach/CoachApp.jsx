import React from 'react';
import { Icon, Avatar, WeaponGlyph, WeaponChip } from '../../components/Shared';
import { IOSDevice } from '../../components/IOSFrame';
import { SessionAttendance, LessonView } from './CoachSession';
import { supabase } from '../../lib/supabase';
import {
  getCalendarBlocks, getCoaches, getCoachByEmail, updateCoachAvailability,
  getBookingsForCoachOnDate, getCoachWeekStats, getMembers, getAllBookingsLight,
} from '../../lib/db';

const CKIND = { lesson: 'var(--brand)', group: 'var(--steel)', open: 'var(--hairline)' };
const AVAIL_DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const AVAIL_SLOTS = ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

// ── Time helpers ────────────────────────────────────────────────

function minToTime(min) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

function todayDow() {
  return (new Date().getDay() + 6) % 7; // 0=Mon, 6=Sun
}

function nowMin() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

function slotStatus(startMin, durMin) {
  const nm = nowMin();
  if (nm >= startMin + durMin) return 'done';
  if (nm >= startMin) return 'live';
  return 'future';
}

function buildDayItems(blocks, bookings) {
  const dow = todayDow();
  const dayStart = dow * 24 * 60;

  const blockItems = blocks
    .filter(b => Math.floor(b.start / (24 * 60)) === dow)
    .map(b => {
      const timeMin = b.start - dayStart;
      return {
        id: b.id, blockId: b.id, t: minToTime(timeMin), startMin: timeMin, durMin: b.dur,
        type: b.kind || 'group', title: b.title, who: b.piste || 'Main Room',
        weapon: b.weapon, piste: b.piste, isBlock: true,
      };
    });

  const lessonItems = (bookings || []).map(bk => {
    const [h, m] = bk.slot_time.split(':').map(Number);
    const startMin = h * 60 + m;
    const mb = bk.members;
    return {
      id: bk.id, bookingId: bk.id, memberId: bk.member_id,
      t: bk.slot_time.slice(0, 5), startMin, durMin: 45, type: 'lesson',
      title: mb?.name || 'Athlete',
      who: [mb?.weapon && (mb.weapon[0].toUpperCase() + mb.weapon.slice(1)), mb?.category].filter(Boolean).join(' · '),
      weapon: mb?.weapon || 'foil',
      piste: bk.piste || 'Main Room',
      memberCredits: mb?.credits, memberCat: mb?.category, memberName: mb?.name,
    };
  });

  const all = [...blockItems, ...lessonItems].sort((a, b) => a.startMin - b.startMin);
  let nextSet = false;
  return all.map(item => {
    const base = slotStatus(item.startMin, item.durMin);
    let status;
    if (base === 'future') { status = nextSet ? 'upcoming' : 'next'; nextSet = true; }
    else status = base;
    return { ...item, status, live: status === 'live' };
  });
}

function buildWeekGrid(blocks) {
  const LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const td = todayDow();
  const mon = new Date(today);
  mon.setDate(today.getDate() - td);
  return LABELS.map((dow, di) => {
    const date = new Date(mon);
    date.setDate(mon.getDate() + di);
    const isToday = di === td;
    const items = blocks
      .filter(b => Math.floor(b.start / (24 * 60)) === di)
      .map(b => {
        const timeMin = b.start - di * 24 * 60;
        return {
          id: b.id, type: b.kind || 'group', title: b.title,
          t: minToTime(timeMin), weapon: b.weapon,
          status: isToday ? slotStatus(timeMin, b.dur) : null,
        };
      })
      .sort((a, b) => a.t.localeCompare(b.t));
    return { dow, dom: date.getDate(), items, today: isToday };
  });
}

function buildMonthGrid(blocks) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const result = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = (new Date(year, month, d).getDay() + 6) % 7;
    const sessions = blocks.filter(b => Math.floor(b.start / (24 * 60)) === dow);
    if (sessions.length > 0) result[d] = sessions.map(b => ({ type: b.kind || 'group', title: b.title }));
  }
  return result;
}

// ── UI primitives ───────────────────────────────────────────────

function StatusTag({ status }) {
  const map = {
    done:     ['Done',    'var(--muted)',  'transparent'],
    live:     ['Live',    'var(--live)',   'transparent'],
    next:     ['Up next', 'var(--brand)',  'var(--brand-tint)'],
    upcoming: ['', '', ''],
  };
  const [label, fg, bg] = map[status] || ['', '', ''];
  if (!label) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', color: fg, background: bg, padding: bg === 'transparent' ? 0 : '2px 8px', borderRadius: 'var(--r-pill)' }}>
      {status === 'live' && <span className="r-live-dot" />}
      {label}
    </span>
  );
}

function ViewSwitcher({ view, onChange }) {
  return (
    <div style={{ display: 'flex', background: 'var(--elevated)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-pill)', padding: 3 }}>
      {['Day', 'Week', 'Month'].map(o => (
        <button key={o} onClick={() => onChange(o)} className="r-focusable" style={{
          flex: 1, font: 'inherit', cursor: 'pointer', border: 'none',
          borderRadius: 'var(--r-pill)', padding: '7px 14px',
          background: view === o ? 'var(--brand)' : 'transparent',
          color: view === o ? '#fff' : 'var(--muted)',
          fontSize: 13, fontWeight: 600, transition: 'background var(--d-fast), color var(--d-fast)',
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

// ── Week + Month views ──────────────────────────────────────────

function WeekView({ weekData, onOpen }) {
  return (
    <div className="r-scroll" style={{ overflowX: 'auto', paddingBottom: 100 }}>
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px', minWidth: 480 }}>
        {weekData.map((d, di) => (
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
                return (
                  <button key={it.id || ii} onClick={() => d.today && onOpen(it)} className="r-focusable" style={{ font: 'inherit', cursor: d.today ? 'pointer' : 'default', textAlign: 'left', border: 'none', background: 'var(--surface)', borderLeft: `3px solid ${bar}`, borderRadius: 'var(--r-cal)', padding: '6px 7px', opacity: it.status === 'done' ? 0.45 : 1, animation: `r-rise var(--d-base) var(--e-enter) ${(di*2+ii)*25}ms both` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {it.status === 'live' && <span className="r-live-dot" style={{ width: 5, height: 5 }} />}
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

function MonthView({ monthData }) {
  const today = new Date();
  const todayDate = today.getDate();
  const year = today.getFullYear();
  const month = today.getMonth();
  const [selDay, setSelDay] = React.useState(todayDate);
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const selSessions = monthData[selDay] || [];

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
          const sessions = monthData[d] || [];
          const isToday = d === todayDate;
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
          {selDay === todayDate ? `Today · ${selDay} ${MONTH_NAMES[month]}` : `${selDay} ${MONTH_NAMES[month]}`}
        </div>
        {selSessions.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--faint)', fontSize: 13 }}>No sessions</div>
        ) : selSessions.map((s, i) => {
          const bar = CKIND[s.type] || CKIND.lesson;
          const label = s.title || (s.type === 'group' ? 'Group session' : s.type === 'lesson' ? 'Lesson slot' : 'Open fencing');
          return (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderLeft: `3px solid ${bar}`, borderRadius: 'var(--r-cal)', padding: '9px 12px', marginBottom: 7, fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
              {label}
              <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 6, textTransform: 'capitalize', fontSize: 12 }}>{s.type}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── My day ──────────────────────────────────────────────────────

function MyDay({ onOpen, coach }) {
  const [view, setView] = React.useState('Day');
  const [todayItems, setTodayItems] = React.useState([]);
  const [weekData, setWeekData] = React.useState([]);
  const [monthData, setMonthData] = React.useState({});
  const [loading, setLoading] = React.useState(true);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayLabel = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  React.useEffect(() => {
    setLoading(true);
    Promise.all([
      getCalendarBlocks(),
      coach?.id ? getBookingsForCoachOnDate(coach.id, todayStr) : Promise.resolve([]),
    ]).then(([blocks, bookings]) => {
      setTodayItems(buildDayItems(blocks, bookings));
      setWeekData(buildWeekGrid(blocks));
      setMonthData(buildMonthGrid(blocks));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [coach?.id, todayStr]);

  const sessions = todayItems.length;
  const lessons  = todayItems.filter(i => i.type === 'lesson').length;
  const live     = todayItems.filter(i => i.live).length;

  return (
    <div style={{ height: '100%', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '56px 16px 12px', flexShrink: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>{todayLabel}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <h1 className="r-display" style={{ margin: 0, fontSize: 28, color: 'var(--ink)' }}>My day</h1>
          <ViewSwitcher view={view} onChange={setView} />
        </div>
        {view === 'Day' && (
          <div style={{ display: 'flex', gap: 16 }}>
            <Stat n={sessions} l="sessions" />
            <Stat n={lessons}  l="lessons" />
            <Stat n={live}     l="live" accent={live > 0 ? 'var(--live)' : undefined} />
          </div>
        )}
      </div>
      <div key={view} style={{ flex: 1, overflow: 'hidden', animation: 'r-fade var(--d-fast) var(--e-standard)' }}>
        {view === 'Day' && (
          <div className="r-scroll" style={{ height: '100%', overflowY: 'auto', padding: '4px 16px 100px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="r-skeleton" style={{ height: 72, borderRadius: 'var(--r-card)' }} />)
            ) : todayItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--faint)' }}>
                <div className="r-display" style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>Nothing scheduled</div>
                <div style={{ fontSize: 13 }}>No sessions or lessons for today.</div>
              </div>
            ) : todayItems.map((it, i) => {
              const bar = CKIND[it.type] || CKIND.lesson;
              return (
                <button key={it.id} onClick={() => onOpen(it)} className="r-focusable" style={{
                  font: 'inherit', cursor: 'pointer', textAlign: 'left', width: '100%',
                  background: 'var(--surface)', border: '1px solid var(--hairline)',
                  borderLeft: `3px solid ${it.status === 'done' ? 'var(--hairline)' : bar}`,
                  borderRadius: 'var(--r-card)', padding: '13px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  opacity: it.status === 'done' ? 0.55 : 1,
                  animation: `r-rise var(--d-base) var(--e-enter) ${i * 40}ms both`,
                }}>
                  <div className="r-tabular" style={{ textAlign: 'center', width: 44, flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{it.t}</div>
                    <div style={{ fontSize: 10, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{it.type}</div>
                  </div>
                  <WeaponGlyph type={it.weapon || 'foil'} size={22} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{it.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{it.who}{it.who && it.piste ? ' · ' : ''}{it.piste}</div>
                  </div>
                  <StatusTag status={it.status} />
                  <Icon name="chevR" size={18} color="var(--faint)" />
                </button>
              );
            })}
          </div>
        )}
        {view === 'Week'  && <WeekView  weekData={weekData}   onOpen={onOpen} />}
        {view === 'Month' && <MonthView monthData={monthData} />}
      </div>
    </div>
  );
}

// ── Athletes ────────────────────────────────────────────────────

function CoachAthletes() {
  const [q, setQ] = React.useState('');
  const [athletes, setAthletes] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    Promise.all([getMembers(), getAllBookingsLight()])
      .then(([members, allBk]) => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

        setAthletes(members.map(m => {
          const mb = allBk.filter(b => b.member_id === m.id);
          // Last seen
          const past = mb.filter(b => b.slot_date <= today).sort((a, b) => b.slot_date.localeCompare(a.slot_date));
          let lastSeen = '—';
          if (past.length > 0) {
            const d = past[0].slot_date;
            lastSeen = d === today ? 'Today' : d === yesterday ? 'Yesterday'
              : new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          }
          // Attendance % last 12 weeks
          const w12ago = new Date(now);
          w12ago.setDate(now.getDate() - 84);
          const w12str = w12ago.toISOString().split('T')[0];
          const recent = mb.filter(b => b.slot_date >= w12str && b.slot_date <= today);
          const weeks = new Set(recent.map(b => Math.floor((new Date(b.slot_date + 'T12:00:00') - w12ago) / (7 * 86400000))));
          const att = Math.round(weeks.size / 12 * 100);
          // Streak: consecutive weeks from current backward
          let streak = 0;
          for (let w = 0; w < 12; w++) {
            const ws = new Date(now);
            ws.setDate(now.getDate() - ((now.getDay() + 6) % 7) - w * 7);
            ws.setHours(0, 0, 0, 0);
            const we = new Date(ws);
            we.setDate(ws.getDate() + 6);
            we.setHours(23, 59, 59, 999);
            const wsStr = ws.toISOString().split('T')[0];
            const weStr = we.toISOString().split('T')[0];
            if (mb.some(b => b.slot_date >= wsStr && b.slot_date <= weStr)) streak++;
            else break;
          }
          return { ...m, lastSeen, att, streak };
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const rows = athletes.filter(a => (a.name || '').toLowerCase().includes(q.toLowerCase()));

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
        {loading
          ? [1,2,3,4].map(i => <div key={i} className="r-skeleton" style={{ height: 70, borderRadius: 'var(--r-card)' }} />)
          : rows.map((a, i) => (
          <div key={a.id || i} style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, animation: `r-rise var(--d-base) var(--e-enter) ${i*35}ms both` }}>
            <Avatar name={a.name} size={40} src={a.avatar_url} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{a.name}</span>
                {a.weapon && <WeaponGlyph type={a.weapon} size={15} />}
                <span style={{ fontSize: 11.5, color: 'var(--faint)' }}>{a.category || ''}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 5, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 44, height: 4, borderRadius: 2, background: 'var(--hairline)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${a.att}%`, background: a.att >= 90 ? 'var(--success)' : a.att >= 75 ? 'var(--warning)' : 'var(--danger)', borderRadius: 2 }} />
                  </div>
                  <span className="r-tabular" style={{ fontSize: 11, color: 'var(--muted)' }}>{a.att}%</span>
                </div>
                {a.streak > 0 && <span style={{ fontSize: 11, color: 'var(--steel)' }}>{a.streak}wk streak</span>}
                <span style={{ fontSize: 11, color: 'var(--faint)', marginLeft: 'auto' }}>Last {a.lastSeen}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="r-mono" style={{ fontSize: 17, fontWeight: 600, color: (a.credits ?? 0) <= 1 ? 'var(--danger)' : 'var(--ink)' }}>{a.credits ?? 0}</div>
              <div style={{ fontSize: 10, color: 'var(--faint)', marginTop: 1 }}>credits</div>
            </div>
          </div>
        ))}
        {!loading && rows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--faint)' }}>
            <div className="r-display" style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 4 }}>No results</div>
            <div style={{ fontSize: 13 }}>Try a different name.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Profile ──────────────────────────────────────────────────────

function CoachProfile({ coach, onSignOut }) {
  const [notifs, setNotifs] = React.useState(true);
  const [digest, setDigest] = React.useState(true);
  const [stats, setStats] = React.useState({ lessons: 0, att: 0 });

  React.useEffect(() => {
    if (!coach?.id) return;
    getCoachWeekStats(coach.id).then(s => setStats(s)).catch(() => {});
  }, [coach?.id]);

  const name  = coach?.name  || 'Coach';
  const email = coach?.email || '';
  const weapon = coach?.weapon || null;

  return (
    <div style={{ height: '100%', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '52px 20px 16px', borderBottom: '1px solid var(--hairline)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <Avatar name={name} size={60} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{name}</div>
          {weapon && <div style={{ display: 'flex', gap: 8, marginTop: 4 }}><WeaponChip type={weapon} /></div>}
        </div>
      </div>
      <div className="r-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 2px 10px' }}>This week</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[[stats.lessons, 'lessons'], [stats.att ? `${stats.att}%` : '—', 'attendance']].map(([v, l]) => (
              <div key={l} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '13px 10px', textAlign: 'center' }}>
                <div className="r-display r-tabular" style={{ fontSize: 22, color: 'var(--ink)' }}>{v}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 2px 10px' }}>Notifications</div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
            {[['Session reminders', notifs, setNotifs], ['AI digest', digest, setDigest]].map(([label, state, setter], ri) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '13px 14px', borderBottom: ri === 0 ? '1px solid var(--hairline)' : 'none' }}>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--ink)' }}>{label}</span>
                <button onClick={() => setter(v => !v)} className="r-focusable" style={{ width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: state ? 'var(--brand)' : 'var(--hairline)', position: 'relative', transition: 'background var(--d-base)', flexShrink: 0 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: state ? 21 : 3, transition: 'left 220ms var(--e-spring)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 2px 10px' }}>Account</div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
            {[['Email', email || '—'], ['Role', 'Coach']].map(([label, val], ri) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '13px 14px', borderBottom: ri === 0 ? '1px solid var(--hairline)' : 'none' }}>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--ink)' }}>{label}</span>
                <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
          <button onClick={onSignOut} className="r-focusable" style={{ width: '100%', font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '13px 14px', border: 'none', background: 'transparent', color: 'var(--brand)', fontSize: 14, fontWeight: 600 }}>
            <Icon name="lock" size={16} color="var(--brand)" style={{ marginRight: 10 }} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Availability ────────────────────────────────────────────────

function Availability({ coach }) {
  const initGrid = () => {
    const g = {};
    AVAIL_DAYS.forEach(d => AVAIL_SLOTS.forEach(s => { g[`${d}|${s}`] = true; }));
    return g;
  };

  const [grid, setGrid] = React.useState(initGrid);
  const [blackout, setBlackout] = React.useState({});
  const [ready, setReady] = React.useState(false);
  const saveTimer = React.useRef(null);

  React.useEffect(() => {
    if (!coach?.id) return;
    const av = coach.availability_json;
    if (av?.slots && Object.keys(av.slots).length > 0) setGrid(av.slots);
    if (av?.blackout) setBlackout(av.blackout);
    setReady(true);
  }, [coach?.id]);

  React.useEffect(() => {
    if (!ready || !coach?.id) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateCoachAvailability(coach.id, { slots: grid, blackout }).catch(() => {});
    }, 1000);
    return () => clearTimeout(saveTimer.current);
  }, [grid, blackout, ready, coach?.id]);

  return (
    <div style={{ height: '100%', background: 'var(--paper)' }}>
      <div className="r-scroll" style={{ height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
        <div style={{ padding: '56px 20px 10px' }}>
          <h1 className="r-display" style={{ margin: 0, fontSize: 30, color: 'var(--ink)' }}>Availability</h1>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Tap a slot to toggle. Saved automatically.</div>
        </div>
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${AVAIL_DAYS.length}, 1fr)`, gap: 4 }}>
            <div />
            {AVAIL_DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 600, color: blackout[d] ? 'var(--danger)' : 'var(--muted)', paddingBottom: 4 }}>{d}</div>
            ))}
            {AVAIL_SLOTS.map(s => (
              <React.Fragment key={s}>
                <div className="r-tabular" style={{ fontSize: 10.5, color: 'var(--faint)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>{s}</div>
                {AVAIL_DAYS.map(d => {
                  const on = grid[`${d}|${s}`] && !blackout[d];
                  return (
                    <button key={d + s} disabled={blackout[d]} onClick={() => setGrid(g => ({ ...g, [`${d}|${s}`]: !g[`${d}|${s}`] }))} className="r-focusable" style={{ font: 'inherit', cursor: blackout[d] ? 'default' : 'pointer', aspectRatio: '1', borderRadius: 6, border: `1px solid ${on ? 'var(--brand)' : 'var(--hairline)'}`, background: blackout[d] ? 'repeating-linear-gradient(45deg, transparent, transparent 4px, var(--hairline) 4px, var(--hairline) 5px)' : on ? 'var(--brand)' : 'var(--surface)', transition: 'background var(--d-fast), border-color var(--d-fast)' }} />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Blackout days</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {AVAIL_DAYS.map(d => (
                <button key={d} onClick={() => setBlackout(b => ({ ...b, [d]: !b[d] }))} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '7px 14px', borderRadius: 'var(--r-pill)', border: `1px solid ${blackout[d] ? 'var(--danger)' : 'var(--hairline)'}`, background: blackout[d] ? 'var(--danger-tint)' : 'var(--surface)', color: blackout[d] ? 'var(--danger)' : 'var(--muted)' }}>{d}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab bar ──────────────────────────────────────────────────────

function CoachTabBar({ active, onChange }) {
  const tabs = [
    { id: 'day',     label: 'My day',       icon: 'calendar' },
    { id: 'roster',  label: 'Athletes',     icon: 'users' },
    { id: 'avail',   label: 'Availability', icon: 'clock' },
    { id: 'profile', label: 'Profile',      icon: 'user' },
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

// ── App root ─────────────────────────────────────────────────────

function CoachApp() {
  const [tab, setTab] = React.useState('day');
  const [stack, setStack] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [coach, setCoach] = React.useState(null);

  React.useEffect(() => {
    const resolve = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const email = data?.user?.email;
        if (email) {
          const found = await getCoachByEmail(email).catch(() => null);
          if (found) { setCoach(found); return; }
        }
      } catch {}
      // Fall back to first coach in DB
      try {
        const coaches = await getCoaches();
        if (coaches?.[0]) setCoach(coaches[0]);
      } catch {}
    };
    resolve();
  }, []);

  const open = (item) => {
    setSelectedItem(item);
    setStack(item.type === 'lesson' ? 'lesson' : 'session');
  };

  const signOut = async () => {
    await supabase.auth.signOut().catch(() => {});
    window.location.href = '/';
  };

  return (
    <div className="theme-dark" style={{ position: 'absolute', inset: 0, background: 'var(--paper)', overflow: 'hidden' }}>
      {!stack && (
        <>
          <div key={tab} style={{ position: 'absolute', inset: 0, animation: 'r-fade var(--d-base) var(--e-standard)' }}>
            {tab === 'day'     && <MyDay onOpen={open} coach={coach} />}
            {tab === 'avail'   && <Availability coach={coach} />}
            {tab === 'roster'  && <CoachAthletes />}
            {tab === 'profile' && <CoachProfile coach={coach} onSignOut={signOut} />}
          </div>
          <CoachTabBar active={tab} onChange={setTab} />
        </>
      )}
      {stack && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, animation: 'r-push 240ms var(--e-enter) both' }}>
          {stack === 'session' && <SessionAttendance item={selectedItem} coach={coach} onBack={() => setStack(null)} onDone={() => setStack(null)} />}
          {stack === 'lesson'  && <LessonView        item={selectedItem} coach={coach} onBack={() => setStack(null)} />}
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
