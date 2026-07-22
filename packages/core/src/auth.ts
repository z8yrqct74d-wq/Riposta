import type { SupabaseClient } from '@supabase/supabase-js';
import type { Member, Coach, Admin, AuthUserLike, RoleResolution } from './types';

/**
 * Binds the auth/role helpers to a Supabase client. Ported from
 * `src/lib/db.js`; `resolveUserRole` is extended to recognise admins.
 *
 * Role is derived from the backend, never a self-selected choice:
 *   admin  = present in the `admins` table
 *   coach  = present in the `coaches` table
 *   athlete = everyone else (row auto-provisioned on first login)
 */
export function createAuth(supabase: SupabaseClient) {
  async function getMemberByEmail(email: string): Promise<Member | null> {
    const { data, error } = await supabase.from('members').select('*').ilike('email', email).maybeSingle();
    if (error) throw error;
    return (data as Member) ?? null;
  }

  async function getCoachByEmail(email: string): Promise<Coach | null> {
    const { data, error } = await supabase.from('coaches').select('*').ilike('email', email).maybeSingle();
    if (error) throw error;
    return (data as Coach) ?? null;
  }

  async function getAdminByEmail(email: string): Promise<Admin | null> {
    const { data, error } = await supabase.from('admins').select('*').ilike('email', email).maybeSingle();
    if (error) throw error;
    return (data as Admin) ?? null;
  }

  /**
   * Link a table row to the signed-in auth user the first time we see them,
   * so the Phase 5 RLS policies (`user_id = auth.uid()`) resolve. No-op once
   * linked or when the auth uid is unavailable.
   */
  async function linkUserId(table: 'members' | 'coaches' | 'admins', id: string, existingUserId: string | null | undefined, authId?: string): Promise<void> {
    if (!authId || existingUserId) return;
    await supabase.from(table).update({ user_id: authId }).eq('id', id);
  }

  async function upsertMemberFromAuth(user: AuthUserLike): Promise<Member> {
    const email = user.email ?? '';
    const existing = await getMemberByEmail(email);
    if (existing) {
      await linkUserId('members', existing.id, existing.user_id, user.id).catch(() => {});
      return existing;
    }
    const name = user.user_metadata?.full_name || email.split('@')[0];
    const { data, error } = await supabase
      .from('members')
      .insert({ name, email: email.toLowerCase(), credits: 0, pay_status: 'paid', visa_status: 'valid', user_id: user.id ?? null })
      .select()
      .single();
    if (error) throw error;
    return data as Member;
  }

  // Single source of truth for role. Admin access = the admins table;
  // coach access = the coaches table; everyone else is an athlete. On first
  // login we link the row's user_id so RLS can scope by auth.uid().
  async function resolveUserRole(user: AuthUserLike | null | undefined): Promise<RoleResolution> {
    if (!user?.email) return { role: 'athlete', member: null, coach: null, admin: null };
    const admin = await getAdminByEmail(user.email).catch(() => null);
    if (admin) {
      await linkUserId('admins', admin.id, admin.user_id, user.id).catch(() => {});
      return { role: 'admin', admin, coach: null, member: null };
    }
    const coach = await getCoachByEmail(user.email).catch(() => null);
    if (coach) {
      await linkUserId('coaches', coach.id, coach.user_id, user.id).catch(() => {});
      return { role: 'coach', coach, member: null, admin: null };
    }
    const member = await upsertMemberFromAuth(user).catch(() => null);
    return { role: 'athlete', member, coach: null, admin: null };
  }

  return { getMemberByEmail, getCoachByEmail, getAdminByEmail, upsertMemberFromAuth, resolveUserRole };
}

export type Auth = ReturnType<typeof createAuth>;
