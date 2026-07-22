-- Run in Supabase Dashboard → SQL Editor → New query
-- =============================================================
-- Phase 5 — Security hardening: auth linkage + real RLS.
--
-- Replaces every prototype `USING (true)` policy with scoping by the
-- signed-in user. Closes the hole where anyone with the public anon key could
-- read/write every table.
--
-- IMPORTANT — apply and TEST this with scoped tokens before relying on it
-- (see docs/rewrite-plan.md → Verification). Getting a policy wrong can lock
-- users out. Existing rows are linked to their auth user on first login
-- (see @riposte/core auth.ts `linkUserId`); coaches/admins must sign in once
-- (or be linked manually) for their user_id to populate.
-- =============================================================

-- ── Auth linkage columns ─────────────────────────────────────
ALTER TABLE members ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE admins  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS members_user_id_idx ON members (user_id);
CREATE INDEX IF NOT EXISTS coaches_user_id_idx ON coaches (user_id);
CREATE INDEX IF NOT EXISTS admins_user_id_idx  ON admins  (user_id);

-- Missing unique constraint that the session_attendance upsert relies on
-- (onConflict: 'block_id,session_date,member_id').
CREATE UNIQUE INDEX IF NOT EXISTS session_attendance_uniq
  ON session_attendance (block_id, session_date, member_id);

-- ── Role helper functions (SECURITY DEFINER to avoid recursive RLS) ──
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.current_coach_id() RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM coaches WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_coach() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM coaches WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.current_member_id() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Drop the old open policies (names from schema.sql / earlier migrations).
DROP POLICY IF EXISTS "public read"  ON members;
DROP POLICY IF EXISTS "public write" ON members;
DROP POLICY IF EXISTS "public read"  ON coaches;
DROP POLICY IF EXISTS "public write" ON coaches;
DROP POLICY IF EXISTS "public read"  ON calendar_blocks;
DROP POLICY IF EXISTS "public write" ON calendar_blocks;
DROP POLICY IF EXISTS "public read"  ON bookings;
DROP POLICY IF EXISTS "public write" ON bookings;
DROP POLICY IF EXISTS "public read"  ON lesson_notes;
DROP POLICY IF EXISTS "public write" ON lesson_notes;
DROP POLICY IF EXISTS "sa_read"  ON session_attendance;
DROP POLICY IF EXISTS "sa_write" ON session_attendance;
DROP POLICY IF EXISTS "ec_read"  ON emergency_contacts;
DROP POLICY IF EXISTS "ec_write" ON emergency_contacts;

-- ── members ──────────────────────────────────────────────────
-- Athlete: own row. Coaches + admins: read all. Admins: write all.
CREATE POLICY members_select ON members FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin() OR public.is_coach());
CREATE POLICY members_update ON members FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY members_insert ON members FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY members_delete ON members FOR DELETE USING (public.is_admin());

-- ── coaches ──────────────────────────────────────────────────
-- Any signed-in user can read (needed for booking); only admins write.
CREATE POLICY coaches_select ON coaches FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY coaches_insert ON coaches FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY coaches_update ON coaches FOR UPDATE
  USING (public.is_admin() OR user_id = auth.uid())
  WITH CHECK (public.is_admin() OR user_id = auth.uid());
CREATE POLICY coaches_delete ON coaches FOR DELETE USING (public.is_admin());

-- ── calendar_blocks ──────────────────────────────────────────
-- Read: any authed. Write: coach or admin.
CREATE POLICY blocks_select ON calendar_blocks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY blocks_write  ON calendar_blocks FOR ALL
  USING (public.is_coach() OR public.is_admin())
  WITH CHECK (public.is_coach() OR public.is_admin());

-- ── bookings ─────────────────────────────────────────────────
-- Member: own bookings. Coach: bookings assigned to them. Admin: all.
CREATE POLICY bookings_select ON bookings FOR SELECT
  USING (member_id = public.current_member_id() OR coach_id = public.current_coach_id() OR public.is_admin());
CREATE POLICY bookings_insert ON bookings FOR INSERT
  WITH CHECK (member_id = public.current_member_id() OR public.is_admin());
CREATE POLICY bookings_update ON bookings FOR UPDATE
  USING (member_id = public.current_member_id() OR coach_id = public.current_coach_id() OR public.is_admin())
  WITH CHECK (member_id = public.current_member_id() OR coach_id = public.current_coach_id() OR public.is_admin());

-- ── lesson_notes ─────────────────────────────────────────────
-- Coach (author) + admin write; the member it's about can read; admin all.
CREATE POLICY notes_select ON lesson_notes FOR SELECT
  USING (member_id = public.current_member_id() OR coach_id = public.current_coach_id() OR public.is_admin());
CREATE POLICY notes_write ON lesson_notes FOR ALL
  USING (coach_id = public.current_coach_id() OR public.is_admin())
  WITH CHECK (coach_id = public.current_coach_id() OR public.is_admin());

-- ── session_attendance ───────────────────────────────────────
-- Coach + admin manage; the member it references can read their own.
CREATE POLICY sa_select ON session_attendance FOR SELECT
  USING (member_id = public.current_member_id() OR public.is_coach() OR public.is_admin());
CREATE POLICY sa_write ON session_attendance FOR ALL
  USING (public.is_coach() OR public.is_admin())
  WITH CHECK (public.is_coach() OR public.is_admin());

-- ── emergency_contacts ───────────────────────────────────────
-- Owning member (+ coaches/admins read).
CREATE POLICY ec_select ON emergency_contacts FOR SELECT
  USING (member_id = public.current_member_id() OR public.is_coach() OR public.is_admin());
CREATE POLICY ec_write ON emergency_contacts FOR ALL
  USING (member_id = public.current_member_id() OR public.is_admin())
  WITH CHECK (member_id = public.current_member_id() OR public.is_admin());

-- ── plans / settings / payments (from add_admin_backend.sql) ──
DROP POLICY IF EXISTS "plans_rw"    ON plans;
DROP POLICY IF EXISTS "settings_rw" ON settings;
DROP POLICY IF EXISTS "payments_rw" ON payments;

-- Plans + settings: any authed reads (the mobile app shows plans); admin writes.
CREATE POLICY plans_select ON plans FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY plans_write  ON plans FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY settings_select ON settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY settings_write  ON settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
-- Payments: member reads own; admin all.
CREATE POLICY payments_select ON payments FOR SELECT
  USING (member_id = public.current_member_id() OR public.is_admin());
CREATE POLICY payments_write ON payments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── admins ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "admins_read" ON admins;
-- A user can see their own admin row (so is_admin resolves); admins see all.
CREATE POLICY admins_select ON admins FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

-- ── storage: member-docs scoped to the uploader's own folder ─
-- Path convention: `${member_id}/…`. Scope writes to a folder matching the
-- caller's member id (admins bypass via is_admin()).
DROP POLICY IF EXISTS "member_docs_insert" ON storage.objects;
DROP POLICY IF EXISTS "member_docs_update" ON storage.objects;
DROP POLICY IF EXISTS "member_docs_select" ON storage.objects;

CREATE POLICY member_docs_select ON storage.objects FOR SELECT
  USING (bucket_id = 'member-docs');
CREATE POLICY member_docs_insert ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'member-docs'
    AND ((storage.foldername(name))[1] = public.current_member_id()::text OR public.is_admin()));
CREATE POLICY member_docs_update ON storage.objects FOR UPDATE
  USING (bucket_id = 'member-docs'
    AND ((storage.foldername(name))[1] = public.current_member_id()::text OR public.is_admin()));
