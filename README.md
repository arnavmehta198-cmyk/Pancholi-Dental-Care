# Pancholi Dental Care & Hair Transplant Center

Marketing site + patient booking flow for a dental clinic in Sagwara,
Dungarpur, Rajasthan. React 19 + Vite, no backend server — the browser talks
directly to Supabase (Postgres + Auth + PostgREST), with Row Level Security as
the actual authorization boundary. See [SECURITY.md](SECURITY.md) for the
full architecture writeup.

## Stack

- React 19 + Vite (rolldown), hash-based routing (`#schedule`, `#admin`, else landing)
- Supabase: Postgres, Auth (bcrypt + optional TOTP MFA), PostgREST, RLS
- Zod for client-side validation, mirrored by Postgres CHECK constraints
- No external CSS/component framework; hand-written CSS per component

## Local development

```bash
npm install
cp .env.example .env   # fill in your Supabase project's URL + anon key
npm run dev             # http://localhost:8080
```

## Build

```bash
npm run build            # outputs to dist/
npm run preview          # serve the production build locally to sanity-check it
```

## Database

Run once, in order, via the Supabase SQL Editor (`supabase/` folder):

1. `schema.sql` — tables, RLS policies, indexes
2. `migration_002_allow_authenticated_insert.sql`
3. `migration_003_input_constraints.sql` — CHECK constraints mirroring `src/validation.js`

Then create the admin user under **Authentication → Users** (email + password,
**Auto Confirm User** checked — the app has no separate email-verification flow).

## Deploying

See [DEPLOY.md](DEPLOY.md) — written for whoever is publishing this, not
necessarily whoever wrote the code.

## Security

[SECURITY.md](SECURITY.md) — architecture, data flow, trust boundaries.
[COMPLIANCE.md](COMPLIANCE.md) — audit results against a full security checklist.

## Background music

Optional. See [public/music/README.md](public/music/README.md) — the site
ships with a synthesised piano loop by default; licensed tracks can replace it.
