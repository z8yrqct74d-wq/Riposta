-- Run in Supabase Dashboard → SQL Editor → New query

-- Link coaches to auth users + store availability
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS availability_json jsonb DEFAULT '{"slots":{},"blackout":{}}'::jsonb;

-- Attendance status on individual lesson bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS attendance_status text DEFAULT 'pending';

-- Group session attendance
CREATE TABLE IF NOT EXISTS session_attendance (
  id           uuid primary key default gen_random_uuid(),
  block_id     text references calendar_blocks(id) on delete cascade,
  session_date date not null,
  member_id    uuid references members(id) on delete set null,
  status       text not null default 'pending',
  is_dropin    boolean default false,
  dropin_name  text,
  created_at   timestamptz default now()
);

ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_attendance' AND policyname = 'sa_read') THEN
    CREATE POLICY "sa_read"  ON session_attendance FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_attendance' AND policyname = 'sa_write') THEN
    CREATE POLICY "sa_write" ON session_attendance FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
