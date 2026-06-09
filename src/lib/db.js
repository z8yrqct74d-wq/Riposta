import { supabase } from './supabase';

// ── Members ──────────────────────────────────────────────────

export async function getMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function getMember(id) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateMemberCredits(id, credits) {
  const { error } = await supabase
    .from('members')
    .update({ credits })
    .eq('id', id);
  if (error) throw error;
}

// ── Calendar blocks ──────────────────────────────────────────

export async function getCalendarBlocks() {
  const { data, error } = await supabase
    .from('calendar_blocks')
    .select('*')
    .order('start_min');
  if (error) throw error;
  // normalise to match the shape the calendar component expects
  return data.map(b => ({
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

export async function createCalendarBlock(block) {
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

export async function updateCalendarBlock(id, changes) {
  const patch = {};
  if (changes.start  !== undefined) patch.start_min = changes.start;
  if (changes.dur    !== undefined && changes.start !== undefined) patch.end_min = changes.start + changes.dur;
  if (changes.title  !== undefined) patch.title = changes.title;
  if (changes.coach  !== undefined) patch.coach = changes.coach;
  if (changes.kind   !== undefined) patch.kind = changes.kind;
  if (changes.weapon !== undefined) patch.weapon = changes.weapon;

  const { error } = await supabase
    .from('calendar_blocks')
    .update(patch)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteCalendarBlock(id) {
  const { error } = await supabase
    .from('calendar_blocks')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── Bookings ─────────────────────────────────────────────────

export async function getBookingsForMember(memberId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, coaches(name)')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createBooking(booking) {
  const { data, error } = await supabase
    .from('bookings')
    .insert(booking)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelBooking(bookingId) {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);
  if (error) throw error;
}

// ── Lesson notes ─────────────────────────────────────────────

export async function saveNote(note) {
  const { data, error } = await supabase
    .from('lesson_notes')
    .insert(note)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getNotesForMember(memberId) {
  const { data, error } = await supabase
    .from('lesson_notes')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ── Coaches ──────────────────────────────────────────────────

export async function getCoaches() {
  const { data, error } = await supabase
    .from('coaches')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function getCoachByEmail(email) {
  const { data, error } = await supabase
    .from('coaches')
    .select('*')
    .ilike('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateCoachAvailability(coachId, json) {
  const { error } = await supabase
    .from('coaches')
    .update({ availability_json: json })
    .eq('id', coachId);
  if (error) throw error;
}

export async function getBookingsForCoachOnDate(coachId, dateStr) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, members(name, weapon, category, credits, avatar_url)')
    .eq('coach_id', coachId)
    .eq('slot_date', dateStr)
    .eq('status', 'booked')
    .order('slot_time');
  if (error) throw error;
  return data || [];
}

export async function getCoachWeekStats(coachId) {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const mon = new Date(today);
  mon.setDate(today.getDate() - dow);
  const monStr = mon.toISOString().split('T')[0];
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const sunStr = sun.toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('bookings')
    .select('id, attendance_status')
    .eq('coach_id', coachId)
    .gte('slot_date', monStr)
    .lte('slot_date', sunStr)
    .eq('status', 'booked');
  if (error) throw error;
  const lessons = data?.length || 0;
  const present = data?.filter(b => b.attendance_status === 'present' || b.attendance_status === 'late').length || 0;
  const att = lessons > 0 ? Math.round(present / lessons * 100) : 0;
  return { lessons, att };
}

export async function getAllBookingsLight() {
  const { data, error } = await supabase
    .from('bookings')
    .select('member_id, slot_date, status')
    .neq('status', 'cancelled');
  if (error) throw error;
  return data || [];
}

export async function getSessionAttendance(blockId, dateStr) {
  const { data, error } = await supabase
    .from('session_attendance')
    .select('*')
    .eq('block_id', blockId)
    .eq('session_date', dateStr);
  if (error) throw error;
  return data || [];
}

export async function upsertSessionAttendance(record) {
  const { error } = await supabase
    .from('session_attendance')
    .upsert(record, { onConflict: 'block_id,session_date,member_id' });
  if (error) throw error;
}

export async function updateBookingAttendance(bookingId, status) {
  const { error } = await supabase
    .from('bookings')
    .update({ attendance_status: status })
    .eq('id', bookingId);
  if (error) throw error;
}


// ── Auth helpers ──────────────────────────────────────────────

export async function getMemberByEmail(email) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .ilike('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertMemberFromAuth(user) {
  const existing = await getMemberByEmail(user.email);
  if (existing) return existing;
  const name = user.user_metadata?.full_name || user.email.split('@')[0];
  const { data, error } = await supabase
    .from('members')
    .insert({ name, email: user.email.toLowerCase(), credits: 0, pay_status: 'paid', visa_status: 'valid' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMember(id, patch) {
  const { error } = await supabase.from('members').update(patch).eq('id', id);
  if (error) throw error;
}

export async function getEmergencyContacts(memberId) {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('member_id', memberId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addEmergencyContact(contact) {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert(contact)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setPrimaryContact(memberId, contactId) {
  await supabase.from('emergency_contacts').update({ is_primary: false }).eq('member_id', memberId);
  const { error } = await supabase.from('emergency_contacts').update({ is_primary: true }).eq('id', contactId);
  if (error) throw error;
}

export async function deleteEmergencyContact(id) {
  const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
  if (error) throw error;
}

export async function updateMemberDocument(memberId, docType, { url, issueDate, expiryDate, licenceNumber }) {
  const prefix = docType === 'medical' ? 'medical_cert' : 'federation_licence';
  const patch = {};
  if (url !== undefined) patch[`${prefix}_url`] = url;
  if (issueDate !== undefined) patch[`${prefix}_issue_date`] = issueDate || null;
  if (expiryDate !== undefined) patch[`${prefix}_expiry_date`] = expiryDate || null;
  if (docType === 'federation' && licenceNumber !== undefined) patch.federation_licence_number = licenceNumber;
  if (docType === 'medical' && expiryDate !== undefined) {
    if (!expiryDate) {
      patch.visa_status = 'pending';
    } else {
      const exp = new Date(expiryDate);
      const now = new Date();
      const soon = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
      patch.visa_status = exp < now ? 'expired' : exp < soon ? 'expiring' : 'valid';
    }
  }
  const { error } = await supabase.from('members').update(patch).eq('id', memberId);
  if (error) throw error;
}

export async function uploadMemberAvatar(memberId, file) {
  const path = `${memberId}/avatar`;
  const { error } = await supabase.storage
    .from('member-docs')
    .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage
    .from('member-docs')
    .getPublicUrl(path);
  return `${publicUrl}?t=${Date.now()}`;
}

export async function uploadMemberDocument(memberId, docType, file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${memberId}/${docType}_${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('member-docs')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage
    .from('member-docs')
    .getPublicUrl(path);
  return publicUrl;
}

export async function getUpcomingBookings(memberId) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('bookings')
    .select('*, coaches(name)')
    .eq('member_id', memberId)
    .eq('status', 'booked')
    .gte('slot_date', today)
    .order('slot_date', { ascending: true })
    .order('slot_time', { ascending: true });
  if (error) throw error;
  return data || [];
}
