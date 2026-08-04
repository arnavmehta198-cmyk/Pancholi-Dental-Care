# Deploying this site

Written for whoever is publishing this — you don't need to read the code to
follow it. Three parts: connect the repo to Vercel, set two environment
variables, connect the domain.

## 1. Import the repo into Vercel

1. Go to https://vercel.com and sign in (GitHub login is easiest).
2. **Add New… → Project**.
3. Pick this GitHub repo from the list. If you don't see it, click
   **Adjust GitHub App Permissions** and grant Vercel access to it.
4. Vercel will auto-detect **Vite** as the framework. Leave the defaults:
   - Build command: `npm run build`
   - Output directory: `dist`
5. **Don't click Deploy yet** — do step 2 first, or the first deploy will be
   broken (blank page / login won't work).

## 2. Environment variables

The site needs two values to talk to its database. They are **not** in the
GitHub repo on purpose (that's a security practice, not an oversight) — you
add them directly in Vercel.

In the Vercel project screen, before or after the first deploy:
**Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | *(get from Supabase dashboard → Project Settings → API → Project URL)* |
| `VITE_SUPABASE_ANON_KEY` | *(same page → Project API keys → `anon` `public` key)* |

Whoever set up the Supabase project can hand you these two values directly —
they're safe to share over chat/email; they're meant to be public-facing
(Row Level Security is what actually protects the data, not secrecy of this key).

Apply both to **Production**, **Preview**, and **Development** environments
(the checkboxes when adding the variable).

After adding them: **Deployments → ⋯ on the latest one → Redeploy** (env vars
only take effect on a fresh build, not automatically).

## 3. Connect your domain

1. In Vercel: **Project → Settings → Domains → Add**.
2. Type the domain you bought (e.g. `pancholidentalcare.com`).
3. Vercel shows you either:
   - **an A record + CNAME** to add at your domain registrar, or
   - **"use Vercel nameservers"** — pick whichever your registrar's dashboard
     makes easier; both work.
4. Add those records at wherever you bought the domain (GoDaddy, Namecheap,
   Google Domains, etc. — their DNS settings page). Takes a few minutes to a
   few hours to go live.
5. Vercel auto-issues an HTTPS certificate once DNS points at it — no action
   needed for that part.

## Verifying it worked

Once deployed:
- Visit the domain — you should see the language-choice screen, not a blank
  page or an error.
- Try `/#schedule` — the booking flow should load and let you pick a date.
- Try `/#admin` and log in with the admin email/password — if this fails with
  a network error (not "incorrect password"), the environment variables from
  step 2 are missing or wrong.

## If something's wrong

- **Blank white page** → environment variables missing, or added but not
  redeployed after.
- **"Incorrect username or password" on admin login, but you're sure it's
  right** → check the account in Supabase (Authentication → Users) — the
  email must match exactly and the account must show a **Confirmed at** date.
- **Everything loads but booking/contact forms fail silently** → almost
  always the RLS policies or the migrations in `supabase/` weren't run against
  this Supabase project. Check `supabase/schema.sql` was executed there.
