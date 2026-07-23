-- Run in Supabase Dashboard → SQL Editor → New query
-- =============================================================
-- Real athlete check-ins. Replaces the mobile "Simulate scan" demo — the
-- athlete self-checks-in at the salle and it writes a real record + bumps
-- members.last_seen.
-- =============================================================

CREATE TABLE IF NOT EXISTS check_ins (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references members(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  date          date not null default CURRENT_DATE,
  created_at    timestamptz default now()
);

CREATE INDEX IF NOT EXISTS check_ins_member_idx ON check_ins (member_id, date);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Athlete inserts/reads their own; coaches and admins can read all.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'check_ins' AND policyname = 'check_ins_select') THEN
    CREATE POLICY check_ins_select ON check_ins FOR SELECT
      USING (member_id = public.current_member_id() OR public.is_coach() OR public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'check_ins' AND policyname = 'check_ins_insert') THEN
    CREATE POLICY check_ins_insert ON check_ins FOR INSERT
      WITH CHECK (member_id = public.current_member_id() OR public.is_admin());
  END IF;
END $$;
