-- ============================================================
-- Riposte — Supabase Schema
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- COACHES
create table if not exists coaches (
  id        text primary key,
  name      text not null,
  weapon    text,
  maitre    boolean default false,
  blurb     text,
  max_load  int default 12
);

-- MEMBERS (athletes)
create table if not exists members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  category    text,
  weapon      text,
  plan_name   text,
  credits     int default 0,
  pay_status  text default 'paid',
  visa_status text default 'valid',
  last_seen   text,
  created_at  timestamptz default now()
);

-- CALENDAR BLOCKS (sessions on the admin calendar)
create table if not exists calendar_blocks (
  id        text primary key,
  piste     text default 'p1',
  kind      text not null,
  title     text,
  coach     text references coaches(id),
  weapon    text,
  start_min int not null,
  end_min   int not null,
  live      boolean default false,
  created_at timestamptz default now()
);

-- BOOKINGS (athlete lesson bookings)
create table if not exists bookings (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid references members(id) on delete cascade,
  coach_id    text references coaches(id),
  slot_date   text,
  slot_time   text,
  piste       text,
  weapon      text,
  status      text default 'booked',
  created_at  timestamptz default now()
);

-- LESSON NOTES
create table if not exists lesson_notes (
  id               uuid primary key default gen_random_uuid(),
  member_id        uuid references members(id) on delete cascade,
  coach_id         text,
  raw_note         text,
  tidied_focus     text,
  tidied_improved  text,
  tidied_homework  text,
  created_at       timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY — open for prototype (no auth yet)
-- ============================================================
alter table coaches          enable row level security;
alter table members          enable row level security;
alter table calendar_blocks  enable row level security;
alter table bookings         enable row level security;
alter table lesson_notes     enable row level security;

create policy "public read"  on coaches         for select using (true);
create policy "public write" on coaches         for all    using (true);
create policy "public read"  on members         for select using (true);
create policy "public write" on members         for all    using (true);
create policy "public read"  on calendar_blocks for select using (true);
create policy "public write" on calendar_blocks for all    using (true);
create policy "public read"  on bookings        for select using (true);
create policy "public write" on bookings        for all    using (true);
create policy "public read"  on lesson_notes    for select using (true);
create policy "public write" on lesson_notes    for all    using (true);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Coaches
insert into coaches (id, name, weapon, maitre, blurb, max_load) values
  ('sandu', 'Constantin Sandu', 'sabre', true,  'Former national team member. Specialises in explosive attacks and tactical awareness.', 12),
  ('dina',  'Lucian Dina',      'sabre', false, 'Club coach focusing on youth development and technical foundations.', 10)
on conflict (id) do nothing;

-- Members
insert into members (name, email, category, weapon, plan_name, credits, pay_status, visa_status, last_seen) values
  ('Maya Rocha',   'maya@riposte.ro',  'U17',   'foil',  'Competitor',  5, 'due',     'expiring', 'Today'),
  ('Tomas Király', 'tomas@riposte.ro', 'Senior','epee',  'Monthly',     2, 'paid',    'valid',    'Yesterday'),
  ('Léa Bernard',  'lea@riposte.ro',   'U14',   'sabre', 'Lesson pack', 8, 'paid',    'valid',    '2 Jun'),
  ('Inès Morel',   'ines@riposte.ro',  'U17',   'epee',  'Competitor',  0, 'overdue', 'expired',  '28 May'),
  ('Hugo Almeida', 'hugo@riposte.ro',  'Senior','foil',  'Drop-in',     1, 'paid',    'valid',    '3 Jun'),
  ('Sofia Marin',  'sofia@riposte.ro', 'U14',   'sabre', 'Monthly',     4, 'due',     'valid',    '1 Jun'),
  ('Noah Klein',   'noah@riposte.ro',  'U11',   'foil',  'Trial',       1, 'paid',    'expiring', '4 Jun')
on conflict do nothing;

-- Calendar blocks
insert into calendar_blocks (id, piste, kind, title, coach, weapon, start_min, end_min, live) values
  ('b1', 'p1', 'group',  'Sabre · U14',  'sandu', 'sabre', 990,  1050, false),
  ('b2', 'p1', 'lesson', 'Maya Rocha',   'sandu', 'sabre', 1080, 1125, false),
  ('b3', 'p1', 'open',   'Open fencing', null,    null,    1020, 1080, false),
  ('b4', 'p1', 'lesson', 'Tomas Király', 'dina',  'sabre', 1170, 1215, false),
  ('b5', 'p1', 'group',  'Sabre squad',  'dina',  'sabre', 1230, 1290, true)
on conflict (id) do nothing;
