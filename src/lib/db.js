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
