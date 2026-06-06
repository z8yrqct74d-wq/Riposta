// ============================================================
// RIPOSTE — Admin console · shared data
// ============================================================

const PISTES = [
  { id: 'p1', label: 'Riposte Main Room', electric: true },
];

// time grid: 16:00 → 22:00
const CAL_START = 16 * 60;
const CAL_END = 22 * 60;
const PX_MIN = 1.5;          // px per minute
const SNAP = 15;             // minutes

const fmtTime = (min) => {
  const h = Math.floor(min / 60), m = min % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
};

// kinds → colour role
const KIND = {
  lesson: { label: 'Lesson',       fg: 'var(--brand)', bg: 'var(--brand-tint)', bar: 'var(--brand)' },
  group:  { label: 'Group',        fg: 'var(--steel)', bg: 'var(--steel-tint)', bar: 'var(--steel)' },
  open:   { label: 'Open fencing', fg: 'var(--muted)', bg: 'var(--paper)',      bar: 'var(--hairline)' },
};

const COACH = {
  sandu:  { name: 'C. Sandu',  maitre: false },
  dina:   { name: 'L. Dina',   maitre: false },
};

const INITIAL_BLOCKS = [
  { id: 'b1', piste: 'p1', kind: 'group',  start: 16*60+30, dur: 60,  title: 'Sabre · U14',    coach: 'sandu', weapon: 'sabre' },
  { id: 'b2', piste: 'p1', kind: 'lesson', start: 18*60,    dur: 45,  title: 'Maya Rocha',     coach: 'sandu', weapon: 'sabre' },
  { id: 'b3', piste: 'p1', kind: 'open',   start: 17*60,    dur: 60,  title: 'Open fencing',   coach: null,   weapon: null    },
  { id: 'b4', piste: 'p1', kind: 'lesson', start: 19*60+30, dur: 45,  title: 'Tomas Király',   coach: 'dina',  weapon: 'sabre' },
  { id: 'b5', piste: 'p1', kind: 'group',  start: 20*60+30, dur: 60,  title: 'Sabre squad',    coach: 'dina',  weapon: 'sabre', live: true },
];

Object.assign(window, { PISTES, CAL_START, CAL_END, PX_MIN, SNAP, fmtTime, KIND, COACH, INITIAL_BLOCKS });
