-- Run in Supabase Dashboard → SQL Editor → New query
-- =============================================================
-- Real pistes/rooms + operating config, so the single "Riposte Main Room",
-- club hours, lesson length and credit cost stop being hardcoded in the apps.
--
-- calendar_blocks.piste and bookings.piste already store a piste id (default
-- 'p1'); seeding the pistes table with id 'p1' keeps existing rows resolving,
-- so no backfill is needed.
-- =============================================================

-- ── Pistes / rooms ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pistes (
  id         text primary key,          -- slug, e.g. 'p1'
  name       text not null,             -- display name, e.g. 'Riposte Main Room'
  electric   boolean default false,     -- electric scoring available
  sort       int default 0,
  active     boolean default true,
  created_at timestamptz default now()
);

ALTER TABLE pistes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pistes' AND policyname = 'pistes_select') THEN
    CREATE POLICY pistes_select ON pistes FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pistes' AND policyname = 'pistes_write') THEN
    CREATE POLICY pistes_write ON pistes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

-- Seed the current single room (matches the historical hardcoded 'p1').
INSERT INTO pistes (id, name, electric, sort, active)
VALUES ('p1', 'Riposte Main Room', true, 0, true)
ON CONFLICT (id) DO NOTHING;

-- ── Operating config on the settings singleton ───────────────
ALTER TABLE settings ADD COLUMN IF NOT EXISTS cal_start_min          int default 960;   -- 16:00
ALTER TABLE settings ADD COLUMN IF NOT EXISTS cal_end_min            int default 1320;  -- 22:00
ALTER TABLE settings ADD COLUMN IF NOT EXISTS lesson_duration_min    int default 45;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS credit_cost_per_lesson int default 1;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS booking_slot_min       int default 15;
