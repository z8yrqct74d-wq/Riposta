-- Run in Supabase Dashboard → SQL Editor → New query
--
-- Backend tables the wired admin app needs (plan catalogue, club settings,
-- member payments). Prototype RLS is open here; Phase 5 hardens it.

-- ── Plans catalogue ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id          text primary key,           -- slug, e.g. 'competitor'
  name        text not null,
  sub         text,                        -- subtitle, e.g. 'Monthly subscription'
  price       text,                        -- display price, e.g. '€120/mo'
  credits     int default 0,
  description text,
  sort        int default 0,
  created_at  timestamptz default now()
);

-- ── Club settings (single row, id = 1) ───────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id                         int primary key default 1,
  club_name                  text,
  city                       text,
  contact_email              text,
  cancellation_window_hours  int default 12,
  dunning_offset_days        int default 3,
  digest_enabled             boolean default true,
  note_tidying_enabled       boolean default true,
  digest_tone                text default 'Direct',
  updated_at                 timestamptz default now(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);

-- ── Member payments + credit top-ups ─────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid references members(id) on delete cascade,
  amount        numeric(10,2) not null default 0,
  kind          text default 'payment',    -- payment | topup | refund
  note          text,
  status        text default 'paid',        -- paid | due | overdue | refunded
  credits_delta int default 0,              -- credits granted by a top-up
  created_at    timestamptz default now()
);

CREATE INDEX IF NOT EXISTS payments_member_idx ON payments (member_id, created_at DESC);

ALTER TABLE plans    ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plans' AND policyname = 'plans_rw') THEN
    CREATE POLICY "plans_rw" ON plans FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'settings_rw') THEN
    CREATE POLICY "settings_rw" ON settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'payments_rw') THEN
    CREATE POLICY "payments_rw" ON payments FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── Seed: default settings row + plan catalogue ──────────────
INSERT INTO settings (id, club_name, city, contact_email)
VALUES (1, 'Riposte Salle d''Armes', 'Bucharest, Romania', 'admin@riposte.ro')
ON CONFLICT (id) DO NOTHING;

INSERT INTO plans (id, name, sub, price, credits, description, sort) VALUES
  ('competitor', 'Competitor',     'Monthly subscription', '€120/mo',     6,  'For active competitors. Includes 6 individual lesson credits per month, unlimited group sessions.', 0),
  ('monthly',    'Monthly',        'Monthly subscription', '€80/mo',      3,  '3 lesson credits per month. Unlimited group sessions.', 1),
  ('pack10',     '10-credit pack', 'Lesson pack',          '€210',        10, 'Buy 10 individual lesson credits. No expiry. 4.5% saving.', 2),
  ('pack5',      '5-credit pack',  'Lesson pack',          '€115',        5,  'Buy 5 individual lesson credits. 4.2% saving.', 3),
  ('trial',      'Trial',          '4-week trial',         '€35',         1,  'One individual lesson + 4 group sessions to try the club.', 4),
  ('dropin',     'Drop-in',        'Pay per session',      '€18/session', 0,  'Single group session, no commitment. Lesson credits available separately.', 5)
ON CONFLICT (id) DO NOTHING;
