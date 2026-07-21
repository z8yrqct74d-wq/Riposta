// ── Domain constants + helpers ───────────────────────────────
// Framework-free: statuses map to semantic *tone* names (success/warning/…)
// rather than CSS vars, so each app can resolve tones against its theme.

import type { Weapon, PayStatus, VisaStatus, BlockKind, AttendanceStatus } from './types';

export type Tone = 'success' | 'warning' | 'danger' | 'muted' | 'steel' | 'brand';

export const WEAPON_LABEL: Record<Weapon, string> = {
  foil: 'Foil',
  epee: 'Épée',
  sabre: 'Sabre',
};

export const WEAPONS: Weapon[] = ['foil', 'epee', 'sabre'];

/** Attendance states, in toggle order (from CoachSession.jsx). */
export const ATT_STATES: ReadonlyArray<{ id: AttendanceStatus; label: string; tone: Tone }> = [
  { id: 'present', label: 'Present', tone: 'success' },
  { id: 'late', label: 'Late', tone: 'warning' },
  { id: 'absent', label: 'Absent', tone: 'muted' },
];

export const PAYMENT_STATUS: Record<PayStatus, { label: string; tone: Tone }> = {
  paid: { label: 'Paid', tone: 'success' },
  due: { label: 'Due', tone: 'warning' },
  overdue: { label: 'Overdue', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'muted' },
};

export const VISA_STATUS: Record<VisaStatus, { label: string; tone: Tone; icon: string }> = {
  valid: { label: 'Valid', tone: 'success', icon: 'check' },
  expiring: { label: 'Expiring soon', tone: 'warning', icon: 'clock' },
  expired: { label: 'Expired', tone: 'danger', icon: 'x' },
  pending: { label: 'Pending', tone: 'danger', icon: 'alertCircle' },
};

export const BLOCK_KIND: Record<BlockKind, { label: string; tone: Tone }> = {
  lesson: { label: 'Lesson', tone: 'brand' },
  group: { label: 'Group', tone: 'steel' },
  open: { label: 'Open fencing', tone: 'muted' },
};

/** Coach availability grid (from CoachApp.jsx). */
export const AVAIL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const AVAIL_SLOTS = ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00'] as const;

/** Full weekday labels, Monday-first. */
export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

// ── Time helpers ─────────────────────────────────────────────

/** Minutes-since-midnight → "H:MM" (e.g. 1080 → "18:00"). */
export function fmtTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

/** "HH:MM" → minutes since midnight. */
export function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** 0 = Monday … 6 = Sunday for the current day. */
export function mondayIndex(date: Date = new Date()): number {
  return (date.getDay() + 6) % 7;
}

/** YYYY-MM-DD for a date (local-agnostic, ISO date part). */
export function isoDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}
