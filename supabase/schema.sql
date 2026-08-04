-- Pancholi Dental Care & Hair Transplant Center — Supabase schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query) once.

create extension if not exists pgcrypto;

-- Appointment requests submitted from the public booking flow.
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  country_code text,
  phone text,
  appointment_date date not null,
  appointment_time text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  submitted_at timestamptz not null default now()
);

-- Contact form messages.
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  message text not null,
  submitted_at timestamptz not null default now()
);

-- Single-row clinic availability config (weekday/Sunday session windows, closed days).
create table if not exists availability (
  id int primary key default 1,
  weekday_sessions jsonb not null default '[{"start":10,"end":14},{"start":16,"end":20}]',
  sunday_sessions jsonb not null default '[{"start":10,"end":14}]',
  closed_days jsonb not null default '[]',
  constraint single_row check (id = 1)
);
insert into availability (id) values (1) on conflict (id) do nothing;

-- Real traffic/analytics events — logged by the site itself, not sampled/fake.
-- event_type: 'pageview' | 'booking_page_view' | 'booking_completed'
-- source: 'organic' | 'maps' | 'paid' | 'direct' (classified from document.referrer + UTM params)
-- device: 'mobile' | 'desktop'
create table if not exists analytics_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  path text,
  source text,
  device text,
  session_id text not null,
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_created_at_idx on analytics_events (created_at);
create index if not exists analytics_events_type_idx on analytics_events (event_type);

-- Row Level Security: public visitors can INSERT (submit bookings/messages/events)
-- but only an authenticated admin (Supabase Auth) can READ or UPDATE.
alter table appointments enable row level security;
alter table contacts enable row level security;
alter table availability enable row level security;
alter table analytics_events enable row level security;

-- "to anon, authenticated" (not just anon) so the form still works if the
-- admin happens to be signed in while browsing the public site themselves.
create policy "public can submit appointments" on appointments
  for insert to anon, authenticated with check (true);
create policy "admin can read appointments" on appointments
  for select to authenticated using (true);
create policy "admin can update appointments" on appointments
  for update to authenticated using (true);

create policy "public can submit contacts" on contacts
  for insert to anon, authenticated with check (true);
create policy "admin can read contacts" on contacts
  for select to authenticated using (true);

create policy "anyone can read availability" on availability
  for select to anon, authenticated using (true);
create policy "admin can update availability" on availability
  for update to authenticated using (true);

create policy "public can log analytics events" on analytics_events
  for insert to anon, authenticated with check (true);
create policy "admin can read analytics events" on analytics_events
  for select to authenticated using (true);

-- Create the admin login: Supabase Dashboard > Authentication > Users > Add user,
-- using the email/password you want Harsh to sign in with. The app's admin login
-- form authenticates against Supabase Auth once VITE_SUPABASE_URL /
-- VITE_SUPABASE_ANON_KEY are set — no more hardcoded password in the JS bundle.
