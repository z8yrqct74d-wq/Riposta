-- Run in Supabase Dashboard → SQL Editor → New query
--
-- Admin access control. `resolveUserRole` returns 'admin' when the signed-in
-- email is present here. Phase 5 (security hardening) will add the
-- `user_id uuid references auth.users(id)` linkage + tighten RLS; for now the
-- table is keyed by email to mirror the coach pattern.

CREATE TABLE IF NOT EXISTS admins (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  user_id    uuid,
  created_at timestamptz default now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admins' AND policyname = 'admins_read') THEN
    CREATE POLICY "admins_read" ON admins FOR SELECT USING (true);
  END IF;
END $$;
