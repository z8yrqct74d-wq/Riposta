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
    // Not .maybeSingle(): members.email isn't unique, and a duplicate row would
    // make maybeSingle throw. Take the oldest match instead.
    const { data, error } = await supabase.from('members').select('*').ilike('email', email).order('created_at').limit(1);
    if (error) throw error;
    return ((data as Member[])?.[0]) ?? null;
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
   * Link the signed-in user to their members/coaches/admins row(s) via a
   * SECURITY DEFINER RPC that bypasses RLS. A plain client-side UPDATE can't do
   * this: it's gated by the very policies that need the link (a row with
   * user_id = NULL fails `user_id = auth.uid()`), and the admins table has no
   * write policy at all. Safe: the function only links rows matching the
   * caller's own JWT email to the caller's own auth.uid(). No-op once linked.
   */
  async function linkMyUser(): Promise<void> {
    await supabase.rpc('link_my_user');
  }

  async function upsertMemberFromAuth(user: AuthUserLike): Promise<Member> {
    // SECURITY DEFINER: links-by-email or returns/creates the caller's member,
    // bypassing the RLS/duplicate fragility of a client-side select+insert.
    const { data, error } = await supabase.rpc('get_or_create_my_member');
    if (!error && data) return (Array.isArray(data) ? data[0] : data) as Member;
    // Fallback for environments where the migration hasn't been applied yet.
    const email = user.email ?? '';
    const existing = await getMemberByEmail(email);
    if (existing) return existing;
    const name = user.user_metadata?.full_name || email.split('@')[0];
    const { data: ins, error: insErr } = await supabase
      .from('members')
      .insert({ name, email: email.toLowerCase(), credits: 0, pay_status: 'paid', visa_status: 'valid', user_id: user.id ?? null })
      .select()
      .single();
    if (insErr) throw insErr;
    return ins as Member;
  }

  // Single source of truth for role. Admin access = the admins table;
  // coach access = the coaches table; everyone else is an athlete. We link the
  // user's rows first (via the definer RPC) so is_admin()/is_coach() and the
  // by-email lookups below resolve under RLS.
  async function resolveUserRole(user: AuthUserLike | null | undefined): Promise<RoleResolution> {
    if (!user?.email) return { role: 'athlete', member: null, coach: null, admin: null };
    await linkMyUser().catch(() => {});
    const admin = await getAdminByEmail(user.email).catch(() => null);
    if (admin) return { role: 'admin', admin, coach: null, member: null };
    const coach = await getCoachByEmail(user.email).catch(() => null);
    if (coach) return { role: 'coach', coach, member: null, admin: null };
    const member = await upsertMemberFromAuth(user).catch(() => null);
    return { role: 'athlete', member, coach: null, admin: null };
  }

  return { getMemberByEmail, getCoachByEmail, getAdminByEmail, upsertMemberFromAuth, resolveUserRole };
}

export type Auth = ReturnType<typeof createAuth>;
