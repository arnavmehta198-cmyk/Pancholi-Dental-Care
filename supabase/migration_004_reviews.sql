-- Patient-submitted reviews with admin moderation. Anyone can submit; only
-- an approved review is ever visible to the public. Mirrors the same
-- anon-insert / authenticated-moderate pattern as appointments/contacts.

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rating int not null check (rating between 1 and 5),
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  constraint reviews_name_len check (char_length(name) between 1 and 80),
  constraint reviews_message_len check (char_length(message) between 1 and 500)
);

alter table reviews enable row level security;

-- Public can submit a review (always starts 'pending' — the column default,
-- and there is deliberately no policy letting anon set status directly).
create policy "public can submit reviews" on reviews
  for insert to anon, authenticated with check (status = 'pending');

-- Public can read ONLY approved reviews — this is what makes moderation real:
-- a pending or rejected review is invisible to anyone who isn't signed in.
create policy "public can read approved reviews" on reviews
  for select to anon, authenticated using (status = 'approved');

-- Admin can read everything (pending/rejected included, to moderate them)
-- and update status. Matches the "to authenticated using (true)" pattern
-- used for appointments/contacts elsewhere in this schema.
create policy "admin can read all reviews" on reviews
  for select to authenticated using (true);
create policy "admin can update review status" on reviews
  for update to authenticated using (true);

create index if not exists reviews_status_idx on reviews (status);
create index if not exists reviews_submitted_at_idx on reviews (submitted_at);

-- Seed the existing testimonials as pre-approved, so the reviews section
-- isn't empty the moment this ships (previously these lived hardcoded in
-- src/App.jsx as a static array — moving them here retires that array).
insert into reviews (name, rating, message, status) values
  ('Sparsh', 5, 'Absolutely painless root canal — I was shocked how comfortable the whole procedure was.', 'approved'),
  ('Arnav', 5, 'My hair transplant results look completely natural. Dr. Pancholi is a true expert.', 'approved'),
  ('Hilori', 4, 'My smile makeover changed everything. I am so happy with the results!', 'approved'),
  ('Aanya', 5, 'My new dentures fit perfectly and feel so natural. Highly recommend this clinic.', 'approved'),
  ('Helik', 4, 'Quick, professional, and affordable. The crown feels just like my real tooth.', 'approved'),
  ('Sudhakar', 5, 'Only ₹200 for a consultation and the care felt premium. Amazing value for Sagwara.', 'approved'),
  ('Mahendera', 3, '19 years of experience really shows. Best clinic in Dungarpur, hands down.', 'approved');
