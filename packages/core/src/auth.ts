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

  async function upsertMemberFromAuth(user: AuthUserLike): Promise<Member> {
    const email = user.email ?? '';
    const existing = await getMemberByEmail(email);
    if (existing) return existing;
    const name = user.user_metadata?.full_name || email.split('@')[0];
    const { data, error } = await supabase
      .from('members')
      .insert({ name, email: email.toLowerCase(), credits: 0, pay_status: 'paid', visa_status: 'valid' })
      .select()
      .single();
    if (error) throw error;
    return data as Member;
  }

  // Single source of truth for role. Admin access = the admins table;
  // coach access = the coaches table; everyone else is an athlete.
  async function resolveUserRole(user: AuthUserLike | null | undefined): Promise<RoleResolution> {
    if (!user?.email) return { role: 'athlete', member: null, coach: null, admin: null };
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
