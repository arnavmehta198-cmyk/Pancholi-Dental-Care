-- Run this once in the Supabase SQL editor. Fixes: contact form / booking
-- form silently failing to submit if the admin happens to be signed in
-- while browsing the public site (RLS insert policies were anon-only).

drop policy if exists "public can submit appointments" on appointments;
create policy "public can submit appointments" on appointments
  for insert to anon, authenticated with check (true);

drop policy if exists "public can submit contacts" on contacts;
create policy "public can submit contacts" on contacts
  for insert to anon, authenticated with check (true);

drop policy if exists "public can log analytics events" on analytics_events;
create policy "public can log analytics events" on analytics_events
  for insert to anon, authenticated with check (true);
