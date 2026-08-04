# Publishing your website — step by step

This walks through everything from start to finish. No prior experience
needed — every click is spelled out. Do the steps in order.

Total time: roughly 30–45 minutes, plus however long domain DNS takes to
activate (can be a few minutes, can be a few hours — out of anyone's control).

---

## Before you start

You'll need:
- An email address you check regularly
- A credit/debit card, for the domain purchase (typically $10–15/year)
- About half an hour of uninterrupted time

---

## Step 1 — Create a GitHub account (skip if you already have one)

GitHub is where the website's code lives.

1. Go to **github.com**
2. Click **Sign up** (top right)
3. Enter your email, create a password, pick a username
4. Verify your email when GitHub sends the confirmation

Once done, tell your developer your GitHub **username** (not email) — they
need it for the next step.

---

## Step 2 — Accept the collaborator invite

Your developer will send you an invite by email, or tell you it's ready.

1. Check your email for a message from **GitHub** — subject line something
   like *"[username] invited you to collaborate"*
2. Click the link in that email
3. It opens GitHub and shows the repository — click **Accept invitation**

If you don't see the email, check spam, or ask your developer to confirm
they sent it to the right username.

---

## Step 3 — Create a Vercel account

Vercel is the service that will actually host (run) your website.

1. Go to **vercel.com**
2. Click **Sign Up**
3. Choose **Continue with GitHub** — this links Vercel to the GitHub account
   from Step 1, which is what lets Vercel see your website's code
4. Approve the permission screen GitHub shows you

---

## Step 4 — Import the project into Vercel

1. On Vercel, click **Add New…** → **Project**
2. You'll see a list of GitHub repositories — find and click **Import** next
   to the one your developer told you (the dental clinic website)
   - If you don't see it, click **Adjust GitHub App Permissions**, and make
     sure Vercel has access to that specific repository
3. Vercel shows a setup screen. Leave everything on its default settings —
   it should already say **Framework Preset: Vite**
4. **Do not click Deploy yet.** Go to Step 5 first — deploying now will
   result in a broken site that you'd have to redo.

---

## Step 5 — Add the two required settings (get these from your developer)

The website needs two secret-looking values to connect to its database.
**Ask your developer for these two values directly** — you cannot get them
from GitHub or find them yourself, and that's intentional (they're kept out
of the public code for security).

You'll be given:
- A value for `VITE_SUPABASE_URL`
- A value for `VITE_SUPABASE_ANON_KEY`

On the same Vercel import screen from Step 4, find **Environment Variables**
(it's a collapsible section — click to expand it if needed):

1. In the **Name** field, type exactly: `VITE_SUPABASE_URL`
2. In the **Value** field, paste the URL your developer gave you
3. Click **Add**
4. Repeat for `VITE_SUPABASE_ANON_KEY` with its value
5. Confirm both are listed before continuing

Get the name exactly right — capitalization matters (`VITE_SUPABASE_URL`,
not `vite_supabase_url` or anything else).

---

## Step 6 — Deploy

1. Now click **Deploy**
2. Wait 1–2 minutes — Vercel shows a build log while it works
3. When it finishes, click **Continue to Dashboard**, then **Visit** to see
   the live site at a temporary address like `your-project.vercel.app`

**Check it works before moving on:**
- The site loads and shows the language-choice screen
- Click "Schedule Appointment" — the booking calendar should appear
- Don't worry about the domain yet — that's next

If the page is blank or shows an error, the values in Step 5 are the most
likely cause — double check them with your developer.

---

## Step 7 — Buy a domain

If you already own a domain, skip to Step 8.

1. Go to a domain registrar — **Namecheap** or **Google Domains** are both
   fine and simple for a first-timer
2. Search for the name you want (e.g. `pancholidentalcare.com`)
3. Add it to cart, complete checkout with your card
4. **Skip any "hosting" or "website builder" upsell they offer during
   checkout** — you already have hosting (Vercel), you're only buying the name

---

## Step 8 — Connect your domain to Vercel

This step means: telling your domain (bought at Namecheap/Google Domains/etc.)
to point at Vercel. It's done by adding a **DNS record** — a small entry in
your domain's settings that says "send visitors to this address."

1. In Vercel: open your project → **Settings** → **Domains**
2. Click **Add**, type your domain two ways, one at a time:
   - First `pancholidentalcare.com` (no `www`) → click **Add**
   - Then `www.pancholidentalcare.com` → click **Add**
   (this covers people typing the domain with or without `www`)
3. Vercel shows you what to add. It will be one of these two — **use exactly
   what's on your screen**, but here's what to expect so it's not a surprise:

   **For the plain domain (`pancholidentalcare.com`) — a `A` record:**
   | Field | Value |
   |---|---|
   | Type | `A` |
   | Name / Host | `@` (or leave blank — means "the root domain") |
   | Value / Points to | `76.76.21.21` |

   **For `www.pancholidentalcare.com` — a `CNAME` record:**
   | Field | Value |
   |---|---|
   | Type | `CNAME` |
   | Name / Host | `www` |
   | Value / Points to | `cname.vercel-dns.com` |

4. Open a new browser tab, log into wherever you bought the domain, and find
   its DNS page — look in the menu for **DNS**, **Manage DNS**, or
   **Advanced DNS**. Every registrar's page looks a little different, but
   they all have an **Add Record** or **Add New Record** button.
5. Add both records above using that button. Pick the **Type** from a
   dropdown (A or CNAME), then fill in Name/Host and Value/Points to exactly.
6. Save. If the registrar asks you to also remove an existing record with
   the same Name (some come with a default "parking page" A record already
   there) — delete that old one, keep the new one pointing at Vercel.
7. Go back to the Vercel tab — it rechecks automatically and shows a green
   checkmark once it sees the change. Can take a few minutes, can take a few
   hours — normal, it's outside anyone's control (DNS has to spread around
   the internet).

Vercel automatically issues HTTPS (the padlock icon) once the domain
connects — no separate step for that.

**If your registrar instead only offers "change nameservers"** (Vercel will
say this on screen if that's the path for your registrar), it's simpler:
Vercel gives you two nameserver addresses, you paste those into your
registrar's nameserver field instead of adding individual records, and it
handles both the root domain and `www` automatically.

---

## Step 9 — Final check

Once your domain shows the green checkmark in Vercel:

- Visit your real domain in a browser — confirm the site loads
- Test the booking flow again on the real domain
- Go to `yourdomain.com/#admin` and log in with the admin email/password
  your developer gave you — confirm you can see the appointments dashboard

If admin login fails with something other than "incorrect password" (e.g. a
generic error, or nothing happens), that's a setup issue — send your
developer a screenshot.

---

## After you're in

Once logged into the admin dashboard, under the **Security** tab you can:
- **Change your password** to something only you know
- Optionally turn on **two-factor authentication** for extra protection

Both are recommended once you've confirmed everything works.

---

## Who to contact if something breaks

Your developer, with:
- Which step you were on
- What you expected vs. what happened
- A screenshot, if there's an error message
