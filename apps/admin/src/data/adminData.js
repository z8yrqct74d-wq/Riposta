export const PISTES = [
  { id: 'p1', label: 'Riposte Main Room', electric: true },
];

export const CAL_START = 16 * 60;
export const CAL_END = 22 * 60;
export const PX_MIN = 1.5;
export const SNAP = 15;

export const fmtTime = (min) => {
  const h = Math.floor(min / 60), m = min % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
};

export const KIND = {
  lesson: { label: 'Lesson',       fg: 'var(--brand)', bg: 'var(--brand-tint)', bar: 'var(--brand)' },
  group:  { label: 'Group',        fg: 'var(--steel)', bg: 'var(--steel-tint)', bar: 'var(--steel)' },
  open:   { label: 'Open fencing', fg: 'var(--muted)', bg: 'var(--paper)',      bar: 'var(--hairline)' },
};
