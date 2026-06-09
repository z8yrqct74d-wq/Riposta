-- Run in Supabase Dashboard → SQL Editor → New query

ALTER TABLE members ADD COLUMN IF NOT EXISTS date_of_birth date;

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid references members(id) on delete cascade,
  name        text not null,
  role        text,
  phone       text,
  is_primary  boolean default false,
  created_at  timestamptz default now()
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emergency_contacts' AND policyname = 'ec_read') THEN
    CREATE POLICY "ec_read"  ON emergency_contacts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emergency_contacts' AND policyname = 'ec_write') THEN
    CREATE POLICY "ec_write" ON emergency_contacts FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
