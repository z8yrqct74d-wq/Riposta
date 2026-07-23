-- Run in Supabase Dashboard → SQL Editor → New query
-- =============================================================
-- Push-notification device tokens + per-user notification preferences.
-- This phase stores tokens and makes the in-app notification toggles real
-- (they persist). Actually SENDING notifications is a later phase: a Supabase
-- edge function → Expo push service → APNs, once an APNs key is uploaded to
-- Expo. Note: obtaining an Expo push token also requires an Expo/EAS project
-- id configured in the app; until then token rows simply won't be created,
-- but the preference toggles below work regardless.
-- =============================================================

-- ── Device push tokens ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS device_tokens (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  expo_push_token  text not null unique,
  platform         text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

CREATE INDEX IF NOT EXISTS device_tokens_user_idx ON device_tokens (user_id);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'device_tokens' AND policyname = 'device_tokens_rw') THEN
    CREATE POLICY device_tokens_rw ON device_tokens FOR ALL
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── Per-user notification preferences ────────────────────────
-- Stored as a jsonb blob of { key: boolean } on whichever profile the user is.
ALTER TABLE members ADD COLUMN IF NOT EXISTS notif_prefs jsonb default '{}'::jsonb;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS notif_prefs jsonb default '{}'::jsonb;
