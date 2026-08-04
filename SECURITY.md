# Architecture & Security Overview

This is a single-tenant, backend-less SPA (React + Vite). There is no application
server — the browser talks directly to Supabase (Postgres + Auth + PostgREST).
Postgres Row Level Security (RLS) is the actual server-side authorization
boundary, not an app server.

## Components

| Component | What it can read/write | Secrets it holds |
|---|---|---|
| `src/App.jsx` (public landing + contact form) | Inserts into `contacts` only | Supabase anon key (public, safe to expose — RLS enforces limits) |
| `src/Schedule.jsx` (booking flow) | Inserts into `appointments`, reads `availability` | Supabase anon key |
| `src/AdminLogin.jsx` | Supabase Auth password + TOTP challenge | Supabase anon key |
| `src/AdminDashboard.jsx` (behind auth) | Full read/update on `appointments`, `contacts`, `availability`, read on `analytics_events` | Supabase anon key + user's own session JWT (short-lived, issued by Supabase Auth) |
| `src/validation.js` | Client-side Zod schema checks (defense in depth, not a trust boundary) | none |
| `supabase/schema.sql`, `migration_002_*.sql`, `migration_003_*.sql` | Define the actual trust boundary: RLS policies + CHECK constraints | Run manually via Supabase SQL Editor (needs project owner credentials, which Claude never has) |
| `src/analytics.js` | Inserts into `analytics_events` | Supabase anon key |

There is no service-role key anywhere in the client bundle. The anon key is
meant to be public (it's embedded in every Supabase JS app) — it only grants
whatever RLS policies allow.

## Data flow: booking a patient appointment

1. Browser (`Schedule.jsx`) collects name/email/phone/date/time.
2. `src/validation.js` (Zod) validates shape client-side — UX only, not a
   security control, since anyone can call the API directly with the anon key
   and skip the browser entirely.
3. `adminStore.js#addAppointment` calls `supabase.from('appointments').insert(...)`
   over HTTPS, authenticated with the anon key.
4. Postgres RLS policy `"public can submit appointments"` allows the insert
   for `anon`/`authenticated` roles, `with check (true)` — no read-back.
5. Postgres CHECK constraints (`migration_003_input_constraints.sql`) reject
   malformed data (bad email format, oversized fields) even if the client-side
   check was bypassed.
6. The row is only ever readable by an `authenticated` Supabase Auth session
   (the admin) per the `"admin can read appointments"` SELECT policy — the
   submitting patient cannot read their own row back, nor anyone else's.

Same shape for the contact form → `contacts` table.

## Data flow: admin login

1. `AdminLogin.jsx` submits email + password to
   `supabase.auth.signInWithPassword` — password never touches app code in
   plaintext beyond the form state; it's sent directly over TLS to Supabase
   Auth, which stores it bcrypt-hashed. The client never sees or stores the
   hash.
2. If the account has a verified TOTP factor, Supabase returns a session at
   AAL1 (not yet fully authenticated). `adminStore.js#isAdminLoggedIn` checks
   `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` and refuses to treat
   AAL1 as logged in.
3. `AdminLogin.jsx` prompts for the 6-digit TOTP code and calls
   `supabase.auth.mfa.challengeAndVerify`, which raises the session to AAL2.
4. `AdminDashboard.jsx` is only reachable once `isAdminLoggedIn()` returns
   true (AAL2 confirmed, or no MFA enrolled — see below).
5. Logout calls `supabase.auth.signOut({ scope: 'global' })`, revoking every
   session for that user across all devices, not just the current tab.

**Known gap, honestly stated:** RLS policies currently check `to authenticated`
only (any valid session), not the AAL level. A stolen AAL1-only session token
could theoretically call the REST API directly and pass RLS, bypassing the
app-level AAL2 gate in `isAdminLoggedIn()`. Closing this fully requires adding
`(select auth.jwt()->>'aal') = 'aal2'` to the admin RLS policies — not done
here since MFA enrollment is optional per-account and enforcing it at the DB
layer would need a decision about whether unenrolled admin access is
acceptable at all. Flagging this rather than silently leaving it undocumented.

## Cross-tenant / IDOR

There is only one tenant (one clinic, one admin account) — there is no
horizontal privilege boundary between "users" the way a multi-tenant SaaS
app would have. The only boundary that matters is public-visitor vs.
authenticated-admin, which is what RLS enforces (see above). Verified live:
anonymous `SELECT` on `contacts`/`appointments`/`analytics_events` returns
`200 []` (RLS filters all rows), anonymous `INSERT` succeeds, and the schema
defines no anonymous `UPDATE`/`DELETE` policy on any table (Postgres denies
by default when RLS is enabled and no policy matches).

## What's explicitly out of scope / N/A

- CI/CD pipeline, staging environments, secrets manager: this is a static
  site with no build-time secrets (the anon key is meant to be public) and no
  deploy pipeline exists yet — whoever hosts this (Vercel/Netlify/etc.) should
  set env vars there rather than committing `.env`.
- Payment processing, cross-tenant data isolation beyond what's described
  above: not applicable, no payments or multi-tenancy in this app.
- Tamper-evident/immutable audit logging: not implemented. `analytics_events`
  is descriptive traffic data, not a security audit trail — admin actions
  (accept/reject appointment, availability changes) are not currently logged
  with who/when beyond Postgres's own row timestamps.
