-- Run in Supabase Dashboard → SQL Editor → New query

ALTER TABLE members ADD COLUMN IF NOT EXISTS avatar_url text;
