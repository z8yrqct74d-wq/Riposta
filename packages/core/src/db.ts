import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Member,
  Coach,
  CalendarBlock,
  Booking,
  LessonNote,
  EmergencyContact,
  SessionAttendanceRecord,
  AttendanceStatus,
  DocType,
  DocumentPatch,
  UploadInput,
  Plan,
  Settings,
  Payment,
} from './types';
import { isoDate } from './constants';

/**
 * Turn a platform-agnostic {@link UploadInput} into an `ArrayBuffer` + content
 * type. Web `File`/`Blob` are read directly; a React Native picker result
 * (`{ uri, name, type }`) is fetched first. Supabase Storage requires an
 * explicit content type when the body is an `ArrayBuffer`.
 */
async function readUploadBody(
  file: UploadInput,
  fallbackType: string,
): Promise<{ body: ArrayBuffer; contentType: string }> {
  if (typeof Blob !== 'undefined' && file instanceof Blob) {
    return { body: await file.arrayBuffer(), contentType: file.type || fallbackType };
  }
  const picker = file as { uri: string; type?: string };
  const res = await fetch(picker.uri);
  const body = await res.arrayBuffer();
  return { body, contentType: picker.type || fallbackType };
}

function uploadName(file: UploadInput): string {
  const anyFile = file as { name?: string; uri?: string };
  return anyFile.name || anyFile.uri || '';
}

/**
 * Binds the Supabase data layer to a client. Every app creates one of these
 * with its own client (see {@link createSupabaseClient}). Ports the old
 * `src/lib/db.js` query functions near-verbatim; only the two upload helpers
 * are reworked to be platform-agnostic.
 */
export function createDb(supabase: SupabaseClient) {
  // ── Members ────────────────────────────────────────────────
  async function getMembers(): Promise<Member[]> {
    const { data, error } = await supabase.from('members').select('*').order('name');
    if (error) throw error;
    return data as Member[];
  }

  async function getMember(id: string): Promise<Member> {
    const { data, error } = await supabase.from('members').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Member;
  }

  async function updateMemberCredits(id: string, credits: number): Promise<void> {
    const { error } = await supabase.from('members').update({ credits }).eq('id', id);
    if (error) throw error;
  }

  async function updateMember(id: string, patch: Partial<Member>): Promise<void> {
    const { error } = await supabase.from('members').update(patch).eq('id', id);
    if (error) throw error;
  }

  // ── Calendar blocks ────────────────────────────────────────
  async function getCalendarBlocks(): Promise<CalendarBlock[]> {
    const { data, error } = await supabase.from('calendar_blocks').select('*').order('start_min');
    if (error) throw error;
    // normalise to match the shape the calendar component expects
    return (data ?? []).map((b) => ({
      id: b.id,
      piste: b.piste,
      kind: b.kind,
      title: b.title,
      coach: b.coach,
      weapon: b.weapon,
      start: b.start_min,
      dur: b.end_min - b.start_min,
      live: b.live ?? false,
    }));
  }

  async function createCalendarBlock(block: CalendarBlock): Promise<unknown> {
    const { data, error } = await supabase
      .from('calendar_blocks')
      .insert({
        id: block.id,
        piste: block.piste,
        kind: block.kind,
        title: block.title,
        coach: block.coach,
        weapon: block.weapon,
        start_min: block.start,
        end_min: block.start + block.dur,
        live: block.live ?? false,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function updateCalendarBlock(id: string, changes: Partial<CalendarBlock>): Promise<void> {
    const patch: Record<string, unknown> = {};
    if (changes.start !== undefined) patch.start_min = changes.start;
    if (changes.title !== undefined) patch.title = changes.title;
    if (changes.coach !== undefined) patch.coach = changes.coach;
    if (changes.kind !== undefined) patch.kind = changes.kind;
    if (changes.weapon !== undefined) patch.weapon = changes.weapon;

    // end_min = start + dur, but a caller may only move (start) or only
    // resize (dur) a block — fetch the current row for whichever side is
    // missing so end_min never desyncs from the block's actual duration.
    if (changes.start !== undefined || changes.dur !== undefined) {
      let currentStart: number | undefined;
      let currentDur: number | undefined;
      if (changes.start === undefined || changes.dur === undefined) {
        const { data, error: fetchError } = await supabase
          .from('calendar_blocks')
          .select('start_min, end_min')
          .eq('id', id)
          .single();
        if (fetchError) throw fetchError;
        currentStart = data.start_min;
        currentDur = data.end_min - data.start_min;
      }
      const start = changes.start ?? currentStart ?? 0;
      const dur = changes.dur ?? currentDur ?? 0;
      patch.end_min = start + dur;
    }

    const { error } = await supabase.from('calendar_blocks').update(patch).eq('id', id);
    if (error) throw error;
  }

  async function deleteCalendarBlock(id: string): Promise<void> {
    const { error } = await supabase.from('calendar_blocks').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Bookings ───────────────────────────────────────────────
  async function getBookingsForMember(memberId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, coaches(name)')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Booking[];
  }

  async function createBooking(booking: Partial<Booking>): Promise<Booking> {
    const { data, error } = await supabase.from('bookings').insert(booking).select().single();
    if (error) throw error;
    return data as Booking;
  }

  async function cancelBooking(bookingId: string): Promise<void> {
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
    if (error) throw error;
  }

  async function getUpcomingBookings(memberId: string): Promise<Booking[]> {
    const today = isoDate();
    const { data, error } = await supabase
      .from('bookings')
      .select('*, coaches(name)')
      .eq('member_id', memberId)
      .eq('status', 'booked')
      .gte('slot_date', today)
      .order('slot_date', { ascending: true })
      .order('slot_time', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Booking[];
  }

  // ── Lesson notes ───────────────────────────────────────────
  async function saveNote(note: Partial<LessonNote>): Promise<LessonNote> {
    const { data, error } = await supabase.from('lesson_notes').insert(note).select().single();
    if (error) throw error;
    return data as LessonNote;
  }

  async function getNotesForMember(memberId: string): Promise<LessonNote[]> {
    const { data, error } = await supabase
      .from('lesson_notes')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as LessonNote[];
  }

  // ── Coaches ────────────────────────────────────────────────
  async function getCoaches(): Promise<Coach[]> {
    const { data, error } = await supabase.from('coaches').select('*').order('name');
    if (error) throw error;
    return (data ?? []) as Coach[];
  }

  async function updateCoachAvailability(coachId: string, json: unknown): Promise<void> {
    const { error } = await supabase.from('coaches').update({ availability_json: json }).eq('id', coachId);
    if (error) throw error;
  }

  async function createCoach(coach: Partial<Coach>): Promise<Coach> {
    const { data, error } = await supabase.from('coaches').insert(coach).select().single();
    if (error) throw error;
    return data as Coach;
  }

  // ── Plans ──────────────────────────────────────────────────
  async function getPlans(): Promise<Plan[]> {
    const { data, error } = await supabase.from('plans').select('*').order('sort');
    if (error) throw error;
    return (data ?? []) as Plan[];
  }

  async function createPlan(plan: Partial<Plan>): Promise<Plan> {
    const { data, error } = await supabase.from('plans').insert(plan).select().single();
    if (error) throw error;
    return data as Plan;
  }

  async function updatePlan(id: string, patch: Partial<Plan>): Promise<void> {
    const { error } = await supabase.from('plans').update(patch).eq('id', id);
    if (error) throw error;
  }

  async function deletePlan(id: string): Promise<void> {
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Club settings (single row, id = 1) ─────────────────────
  async function getSettings(): Promise<Settings | null> {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
    if (error) throw error;
    return (data as Settings) ?? null;
  }

  async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
    const { data, error } = await supabase
      .from('settings')
      .upsert({ id: 1, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data as Settings;
  }

  // ── Payments + credit top-ups ──────────────────────────────
  async function getPaymentsForMember(memberId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Payment[];
  }

  async function getPayments(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*, members(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Payment[];
  }

  /**
   * Record a payment, top-up, or refund. A `credits_delta` also adjusts the
   * member's credit balance in the same call so the two stay consistent.
   */
  async function recordPayment(payment: Partial<Payment>): Promise<Payment> {
    const { data, error } = await supabase.from('payments').insert(payment).select().single();
    if (error) throw error;
    const row = data as Payment;
    if (row.credits_delta && payment.member_id) {
      const { data: member } = await supabase.from('members').select('credits').eq('id', payment.member_id).single();
      const current = (member as { credits?: number } | null)?.credits ?? 0;
      await supabase.from('members').update({ credits: current + row.credits_delta }).eq('id', payment.member_id);
    }
    return row;
  }

  async function getBookingsForCoachOnDate(coachId: string, dateStr: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, members(name, weapon, category, credits, avatar_url)')
      .eq('coach_id', coachId)
      .eq('slot_date', dateStr)
      .eq('status', 'booked')
      .order('slot_time');
    if (error) throw error;
    return (data ?? []) as Booking[];
  }

  async function getCoachWeekStats(coachId: string): Promise<{ lessons: number; att: number }> {
    const today = new Date();
    const dow = (today.getDay() + 6) % 7;
    const mon = new Date(today);
    mon.setDate(today.getDate() - dow);
    const monStr = isoDate(mon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const sunStr = isoDate(sun);
    const { data, error } = await supabase
      .from('bookings')
      .select('id, attendance_status')
      .eq('coach_id', coachId)
      .gte('slot_date', monStr)
      .lte('slot_date', sunStr)
      .eq('status', 'booked');
    if (error) throw error;
    const lessons = data?.length || 0;
    const present = data?.filter((b) => b.attendance_status === 'present' || b.attendance_status === 'late').length || 0;
    const att = lessons > 0 ? Math.round((present / lessons) * 100) : 0;
    return { lessons, att };
  }

  async function getAllBookingsLight(): Promise<Array<Pick<Booking, 'member_id' | 'slot_date' | 'status'>>> {
    const { data, error } = await supabase.from('bookings').select('member_id, slot_date, status').neq('status', 'cancelled');
    if (error) throw error;
    return (data ?? []) as Array<Pick<Booking, 'member_id' | 'slot_date' | 'status'>>;
  }

  // ── Attendance ─────────────────────────────────────────────
  async function getSessionAttendance(blockId: string, dateStr: string): Promise<SessionAttendanceRecord[]> {
    const { data, error } = await supabase
      .from('session_attendance')
      .select('*')
      .eq('block_id', blockId)
      .eq('session_date', dateStr);
    if (error) throw error;
    return (data ?? []) as SessionAttendanceRecord[];
  }

  async function upsertSessionAttendance(record: SessionAttendanceRecord): Promise<void> {
    const { error } = await supabase
      .from('session_attendance')
      .upsert(record, { onConflict: 'block_id,session_date,member_id' });
    if (error) throw error;
  }

  async function updateBookingAttendance(bookingId: string, status: AttendanceStatus): Promise<void> {
    const { error } = await supabase.from('bookings').update({ attendance_status: status }).eq('id', bookingId);
    if (error) throw error;
  }

  // ── Emergency contacts ─────────────────────────────────────
  async function getEmergencyContacts(memberId: string): Promise<EmergencyContact[]> {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('member_id', memberId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as EmergencyContact[];
  }

  async function addEmergencyContact(contact: Partial<EmergencyContact>): Promise<EmergencyContact> {
    const { data, error } = await supabase.from('emergency_contacts').insert(contact).select().single();
    if (error) throw error;
    return data as EmergencyContact;
  }

  async function setPrimaryContact(memberId: string, contactId: string): Promise<void> {
    await supabase.from('emergency_contacts').update({ is_primary: false }).eq('member_id', memberId);
    const { error } = await supabase.from('emergency_contacts').update({ is_primary: true }).eq('id', contactId);
    if (error) throw error;
  }

  async function deleteEmergencyContact(id: string): Promise<void> {
    const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Member documents + compliance ──────────────────────────
  async function updateMemberDocument(memberId: string, docType: DocType, patch: DocumentPatch): Promise<void> {
    const { url, issueDate, expiryDate, licenceNumber } = patch;
    const prefix = docType === 'medical' ? 'medical_cert' : 'federation_licence';
    const dbPatch: Record<string, unknown> = {};
    if (url !== undefined) dbPatch[`${prefix}_url`] = url;
    if (issueDate !== undefined) dbPatch[`${prefix}_issue_date`] = issueDate || null;
    if (expiryDate !== undefined) dbPatch[`${prefix}_expiry_date`] = expiryDate || null;
    if (docType === 'federation' && licenceNumber !== undefined) dbPatch.federation_licence_number = licenceNumber;
    if (docType === 'medical' && expiryDate !== undefined) {
      if (!expiryDate) {
        dbPatch.visa_status = 'pending';
      } else {
        const exp = new Date(expiryDate);
        const now = new Date();
        const soon = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
        dbPatch.visa_status = exp < now ? 'expired' : exp < soon ? 'expiring' : 'valid';
      }
    }
    const { error } = await supabase.from('members').update(dbPatch).eq('id', memberId);
    if (error) throw error;
  }

  async function uploadMemberAvatar(memberId: string, file: UploadInput): Promise<string> {
    const path = `${memberId}/avatar`;
    const { body, contentType } = await readUploadBody(file, 'image/jpeg');
    const { error } = await supabase.storage.from('member-docs').upload(path, body, { upsert: true, contentType });
    if (error) throw error;
    const {
      data: { publicUrl },
    } = supabase.storage.from('member-docs').getPublicUrl(path);
    return `${publicUrl}?t=${Date.now()}`;
  }

  async function uploadMemberDocument(memberId: string, docType: DocType, file: UploadInput): Promise<string> {
    const ext = uploadName(file).split('.').pop()?.toLowerCase() || 'bin';
    const path = `${memberId}/${docType}_${Date.now()}.${ext}`;
    const { body, contentType } = await readUploadBody(file, 'application/octet-stream');
    const { error } = await supabase.storage.from('member-docs').upload(path, body, { upsert: true, contentType });
    if (error) throw error;
    const {
      data: { publicUrl },
    } = supabase.storage.from('member-docs').getPublicUrl(path);
    return publicUrl;
  }

  return {
    getMembers,
    getMember,
    updateMemberCredits,
    updateMember,
    getCalendarBlocks,
    createCalendarBlock,
    updateCalendarBlock,
    deleteCalendarBlock,
    getBookingsForMember,
    createBooking,
    cancelBooking,
    getUpcomingBookings,
    saveNote,
    getNotesForMember,
    getCoaches,
    createCoach,
    updateCoachAvailability,
    getPlans,
    createPlan,
    updatePlan,
    deletePlan,
    getSettings,
    updateSettings,
    getPaymentsForMember,
    getPayments,
    recordPayment,
    getBookingsForCoachOnDate,
    getCoachWeekStats,
    getAllBookingsLight,
    getSessionAttendance,
    upsertSessionAttendance,
    updateBookingAttendance,
    getEmergencyContacts,
    addEmergencyContact,
    setPrimaryContact,
    deleteEmergencyContact,
    updateMemberDocument,
    uploadMemberAvatar,
    uploadMemberDocument,
  };
}

export type Db = ReturnType<typeof createDb>;
