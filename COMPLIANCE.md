# Security checklist — compliance matrix

Honest pass/fail against the full checklist. This is a single-tenant static
SPA + Supabase, not an enterprise multi-service app — some bullets are N/A by
architecture, marked as such rather than faked.

## Architecture & Data Flow
| Item | Status |
|---|---|
| Data Flow Documentation | **Pass** — [SECURITY.md](SECURITY.md) |
| Component Inventory | **Pass** — [SECURITY.md](SECURITY.md) |
| Sensitive Data Path Documentation | **Pass** — [SECURITY.md](SECURITY.md) |
| Cross-Tenant Access Prevention / IDOR | **Pass** — single tenant, no cross-tenant boundary needed; anon↔admin boundary verified live (anon SELECT returns `[]`, no anon UPDATE/DELETE policy exists) |

## Access Control
| Item | Status |
|---|---|
| Server-Side Authentication | **Pass** — Supabase Auth + Postgres RLS is the real server-side boundary (no app server, but RLS is enforced in Postgres, not the browser) |
| Resource Ownership Validation | **Partial — gap documented** — RLS checks `authenticated` role, not AAL level. A stolen AAL1 (password-only) session token could hit the REST API directly and pass RLS even with MFA enrolled. Fixing this needs `aal2`-aware RLS policies — a scope decision, not done yet |
| Principle of Least Privilege | **Pass** — anon can only INSERT; only `authenticated` can SELECT/UPDATE; no DELETE policy exists for anyone via the API |
| Session Invalidation | **Pass** — logout uses `signOut({scope:'global'})`, revokes all sessions/devices |

## Credential Handling
| Item | Status |
|---|---|
| Password Storage | **Pass** — bcrypt-hashed by Supabase Auth, app never sees the hash |
| Multi-Factor Authentication | **Not enabled — owner's decision** — TOTP enrollment + login challenge are built, tested and working, but the enrolled factor was removed at the owner's request. Admin login is password-only. Re-enable any time: Admin → Security → Set up two-factor authentication |
| One-Time Token Security | **N/A** — no password-reset/magic-link flow exists in the UI yet; nothing to assess |

## Database Security
| Item | Status |
|---|---|
| Parameterized Queries | **Pass** — all access via `supabase-js`/PostgREST, zero raw SQL string concatenation in app code |
| Database Privileges | **Pass** — client only ever holds the anon key; no service-role key in the bundle |
| Database Network Access | **N/A — hosting decision** — Supabase manages network exposure (public HTTPS endpoint); no VPN/IP-allowlist configured, that's a Supabase project setting outside app code |
| Sensitive Data Encryption | **Partial** — TLS in transit (enforced by Supabase); at-rest encryption is Supabase infra's responsibility; no field-level encryption of names/emails/phone — reasonable for this data class, but flag if you want it |

## Input Validation
| Item | Status |
|---|---|
| Schema Validation | **Pass** — Zod client-side ([validation.js](src/validation.js)) + Postgres CHECK constraints ([migration_003](supabase/migration_003_input_constraints.sql)) |
| No Dynamic Code Execution | **Pass** — grepped all deps, zero `eval`/`new Function`; CSP `script-src 'self'` blocks inline/eval |
| Output Encoding | **Pass** — React escapes JSX by default; one `dangerouslySetInnerHTML` (MFA QR SVG), sourced from Supabase's own trusted response, not user input |
| SSRF Protection | **N/A** — no server-side outbound requests to user-supplied URLs; map iframe uses a hardcoded clinic-coordinate URL, not user input |

## Logging & Monitoring
| Item | Status |
|---|---|
| Security Event Logging | **Missing** — no login-attempt or admin-action audit log |
| Log Sanitization | **N/A given above** — nothing currently logs PII; `console.error` only logs Supabase error objects |
| Tamper-Evident Logging | **Missing** — no audit log infra exists to make tamper-evident |

## CI/CD & Operations
| Item | Status |
|---|---|
| Automated Builds & Deploys | **N/A** — no CI/CD configured; hosting provider not yet chosen |
| Debug Mode Disabled | **Pass** — `vite.config.js` has `build.sourcemap: false`; verified prod build has no dev artifacts |
| Secrets Management | **Pass** — `.env` gitignored; anon key is meant to be public (RLS-scoped); no service-role key anywhere |
| Certificate Management | **N/A** — depends on hosting provider (Vercel/Netlify auto-manage TLS certs); no host chosen yet |

## Administrative Interfaces
| Item | Status |
|---|---|
| Admin MFA | **Not enabled — owner's decision** — feature works, factor removed on request. The admin panel exposes patient names, emails and phone numbers, so a leaked password is now sufficient for full access. Mitigations in place: bcrypt hashing, Supabase Auth rate limiting, global session revocation on logout |
| Admin Action Auditing | **Missing** — accept/reject/availability changes aren't logged with actor+timestamp |
| Admin Access Restrictions | **N/A — scope decision** — no IP-allowlist/VPN gateway; admin panel is reachable from any IP, protected by password+MFA only |

## What's left, if you want full enterprise-grade coverage
1. Admin action audit log (who did what, when) — new table + write on every accept/reject/availability change.
2. AAL2-aware RLS policies so a leaked AAL1 token can't bypass MFA at the API layer.
3. Pick a host, wire up CI/CD and TLS there.

Everything else in the checklist that applies to this stack is fixed and
live-verified against the real Supabase project, not just built.
