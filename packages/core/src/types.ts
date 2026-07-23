// ── Domain types ─────────────────────────────────────────────
// Shapes mirror the Supabase schema (supabase/schema.sql + migrations).
// Kept permissive where the backend is still loosely typed (prototype).

export type Weapon = 'foil' | 'epee' | 'sabre';

export type Role = 'athlete' | 'coach' | 'admin';

export type PayStatus = 'paid' | 'due' | 'overdue' | 'refunded';

export type VisaStatus = 'valid' | 'expiring' | 'expired' | 'pending';

export type BlockKind = 'lesson' | 'group' | 'open';

export type AttendanceStatus = 'pending' | 'present' | 'late' | 'absent';

export interface Member {
  id: string;
  user_id?: string | null;
  name: string;
  email: string | null;
  category?: string | null;
  weapon?: Weapon | null;
  plan_name?: string | null;
  credits: number;
  pay_status: PayStatus;
  visa_status: VisaStatus;
  last_seen?: string | null;
  created_at?: string;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  medical_cert_url?: string | null;
  medical_cert_issue_date?: string | null;
  medical_cert_expiry_date?: string | null;
  federation_licence_number?: string | null;
  federation_licence_url?: string | null;
  federation_licence_issue_date?: string | null;
  federation_licence_expiry_date?: string | null;
}

export interface CoachAvailability {
  slots: Record<string, boolean>;
  blackout: Record<string, boolean>;
}

export interface Coach {
  id: string;
  user_id?: string | null;
  name: string;
  weapon?: Weapon | null;
  maitre?: boolean;
  blurb?: string | null;
  max_load?: number;
  email?: string | null;
  availability_json?: CoachAvailability | null;
}

export interface Admin {
  id: string;
  email: string;
  user_id?: string | null;
  created_at?: string;
}

/** Row shape as stored in `calendar_blocks`. */
export interface CalendarBlockRow {
  id: string;
  date: string; // YYYY-MM-DD — the specific day this block occurs on
  piste: string;
  kind: BlockKind;
  title: string | null;
  coach: string | null;
  weapon: Weapon | null;
  start_min: number;
  end_min: number;
  live?: boolean;
  created_at?: string;
}

/** Normalised shape the calendar UI consumes (start + duration). */
export interface CalendarBlock {
  id: string;
  date: string; // YYYY-MM-DD
  piste: string;
  kind: BlockKind;
  title: string | null;
  coach: string | null;
  weapon: Weapon | null;
  start: number;
  dur: number;
  live: boolean;
}

export interface Booking {
  id: string;
  member_id: string;
  coach_id: string | null;
  slot_date: string | null;
  slot_time: string | null;
  piste?: string | null;
  weapon?: Weapon | null;
  status: string;
  attendance_status?: AttendanceStatus;
  created_at?: string;
  // Optional joined relations
  coaches?: { name: string } | null;
  members?: Partial<Member> | null;
}

export interface LessonNote {
  id: string;
  member_id: string;
  coach_id: string | null;
  raw_note?: string | null;
  tidied_focus?: string | null;
  tidied_improved?: string | null;
  tidied_homework?: string | null;
  created_at?: string;
  // Enriched by getNotesForMember (coach_id has no FK, so this is a manual
  // lookup rather than a PostgREST embed).
  coaches?: { name: string } | null;
}

export interface EmergencyContact {
  id: string;
  member_id: string;
  name: string;
  role?: string | null;
  phone?: string | null;
  is_primary: boolean;
  created_at?: string;
}

export interface SessionAttendanceRecord {
  id?: string;
  block_id: string;
  session_date: string;
  member_id: string | null;
  status: AttendanceStatus;
  is_dropin?: boolean;
  dropin_name?: string | null;
  created_at?: string;
}

/**
 * Minimal shape of the authenticated user we read from Supabase Auth.
 * Structurally compatible with supabase-js's `User` (no catch-all index
 * signature, so `User` is directly assignable).
 */
export interface AuthUserLike {
  id?: string;
  email?: string | null;
  user_metadata?: { full_name?: string } | null;
}

export interface RoleResolution {
  role: Role;
  member: Member | null;
  coach: Coach | null;
  admin: Admin | null;
}

export type DocType = 'medical' | 'federation';

export interface DocumentPatch {
  url?: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  licenceNumber?: string;
}

/**
 * Platform-agnostic file input for uploads. Web passes a `Blob`/`File`
 * directly; React Native passes an image/document picker result
 * (`{ uri, name, type }`).
 */
export type UploadInput =
  | Blob
  | { uri: string; name?: string; type?: string };

export interface Plan {
  id: string;
  name: string;
  sub?: string | null;
  price?: string | null;
  credits: number;
  description?: string | null;
  sort?: number;
  created_at?: string;
}

export interface Piste {
  id: string;
  name: string;
  electric?: boolean;
  sort?: number;
  active?: boolean;
  created_at?: string;
}

export interface Settings {
  id: number;
  club_name?: string | null;
  city?: string | null;
  contact_email?: string | null;
  cancellation_window_hours?: number;
  dunning_offset_days?: number;
  digest_enabled?: boolean;
  note_tidying_enabled?: boolean;
  digest_tone?: string | null;
  // Operating config (add_pistes_and_config.sql)
  cal_start_min?: number;
  cal_end_min?: number;
  lesson_duration_min?: number;
  credit_cost_per_lesson?: number;
  booking_slot_min?: number;
  updated_at?: string;
}

export type PaymentKind = 'payment' | 'topup' | 'refund';

export interface Payment {
  id: string;
  member_id: string;
  amount: number;
  kind: PaymentKind;
  note?: string | null;
  status: PayStatus;
  credits_delta?: number;
  created_at?: string;
}
