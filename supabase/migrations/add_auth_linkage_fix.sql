-- Run in Supabase Dashboard → SQL Editor → New query
-- =============================================================
-- Fix the RLS auth-linkage deadlock.
--
-- add_rls_hardening.sql linked a signed-in user to their members/coaches/
-- admins row with a plain UPDATE (see @riposte/core auth.ts `linkUserId`).
-- But that UPDATE is gated by the very policies that need the link: a row with
-- user_id = NULL can't satisfy `user_id = auth.uid()`, so the update touches 0
-- rows and silently fails. The admins table has no write policy at all, so
-- is_admin() can never resolve. Net effect: admins/coaches never link, athlete
-- member rows can't be found/linked, and the mobile Profile silently breaks
-- (member/memberId stay null → sheets don't open, edits don't persist).
--
-- Fix: SECURITY DEFINER functions that perform the linkage / member lookup
-- while bypassing RLS, keyed off the caller's real auth.uid() + JWT email.
-- These are safe: they only ever act on rows matching the caller's own email
-- and only ever set user_id to the caller's own auth.uid().
-- =============================================================

-- Link the caller's auth.uid() onto any admins/coaches/members row that
-- matches their JWT email and isn't linked yet. Makes is_admin()/is_coach()/
-- current_member_id() resolve. Idempotent.
CREATE OR REPLACE FUNCTION public.link_my_user() RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  em  text := lower(auth.jwt() ->> 'email');
BEGIN
  IF uid IS NULL OR em IS NULL OR em = '' THEN RETURN; END IF;
  UPDATE admins  SET user_id = uid WHERE lower(email) = em AND user_id IS NULL;
  UPDATE coaches SET user_id = uid WHERE lower(email) = em AND user_id IS NULL;
  UPDATE members SET user_id = uid WHERE lower(email) = em AND user_id IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_my_user() TO authenticated;

-- Return the caller's member row, creating/linking it if needed. Bypasses the
-- RLS/duplicate/maybeSingle fragility in the mobile athlete data provider:
--   1. link any existing member row that matches the caller's email
--   2. return the caller's member (oldest, if somehow duplicated)
--   3. otherwise insert a fresh linked member
CREATE OR REPLACE FUNCTION public.get_or_create_my_member() RETURNS members
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  em  text := lower(auth.jwt() ->> 'email');
  nm  text := coalesce(nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', ''), split_part(coalesce(em, 'member'), '@', 1));
  m   members;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'no authenticated user'; END IF;

  IF em IS NOT NULL AND em <> '' THEN
    UPDATE members SET user_id = uid WHERE lower(email) = em AND user_id IS NULL;
  END IF;

  SELECT * INTO m FROM members WHERE user_id = uid ORDER BY created_at LIMIT 1;
  IF FOUND THEN RETURN m; END IF;

  INSERT INTO members (name, email, credits, pay_status, visa_status, user_id)
  VALUES (nm, em, 0, 'paid', 'valid', uid)
  RETURNING * INTO m;
  RETURN m;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_my_member() TO authenticated;
