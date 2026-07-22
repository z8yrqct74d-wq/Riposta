-- Run in Supabase Dashboard → SQL Editor → New query
-- =============================================================
-- calendar_blocks becomes a real dated calendar instead of an implicit
-- "today only" template with no day dimension at all. Previously start_min/
-- end_min only ever encoded time-of-day (e.g. 960-1320), so every block
-- applied to "today" with no way to schedule a specific future/past day —
-- the admin UI's calendar title was literally hardcoded text, and the coach
-- mobile app's day-of-week bucketing math had nothing real to bucket by.
--
-- Existing rows (if any) are backfilled to today's date so nothing silently
-- disappears; going forward every block has a real, admin-chosen date.
-- =============================================================

ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS date date;

UPDATE calendar_blocks SET date = CURRENT_DATE WHERE date IS NULL;

ALTER TABLE calendar_blocks ALTER COLUMN date SET DEFAULT CURRENT_DATE;
ALTER TABLE calendar_blocks ALTER COLUMN date SET NOT NULL;

CREATE INDEX IF NOT EXISTS calendar_blocks_date_idx ON calendar_blocks (date);
