# Fluxo release review — 9 October 2026

## Scope
This branch contains the reference-led welcome/intro and mobile banking redesign, card and payment screens, AI insights, account settings, login/signup/recovery styling, and financial authority hardening. All money movement is **sandbox-only**.

## Gates (must all pass before production promotion)
- [x] GitHub `verify` workflow green on commit `4fefca82` (recheck after documentation changes)
- [x] PostgreSQL integration workflow green on commit `4fefca82`, including concurrency and worker privilege checks (disposable CI database only)
- [ ] Visual comparison of all approved reference screens at mobile widths; review overflow, keyboard, contrast, bottom navigation and screen-reader labels
- [ ] Auth end-to-end: signup, email confirmation, login, reset, session expiration and logout with production Supabase configuration
- [ ] Sandbox flows: Pix, transfer, cards, bills, activity, privacy toggle, export and reset
- [ ] Security review: RLS, no service-role key in browser, no production provider payments, no bypass of financial approval
- [ ] Verify actual Vercel project owning `fluxo-fintech-xi.vercel.app` and its GitHub branch / env configuration
- [ ] Deploy preview, inspect mobile screenshots and test critical paths before promoting to production
- [ ] Verify production URL and rollback deployment

## Non-production items
- `docs/sql/financial-command-outbox.draft.sql` is a **design draft**, not a deployed migration.
- The trusted provider worker, real card issuance, real Pix, biometric/passkey authentication, and real settlement are **not enabled**.
- Demo data is stored locally; Supabase account sign-in does not automatically synchronize wallet data.
- Do not enable real payments or apply draft SQL to live Supabase during this UI release.

## CI evidence
- Frontend verification: https://github.com/murrayglenn75-beep/fluxo/actions/runs/38006581764 — success.
- PostgreSQL integration: https://github.com/murrayglenn75-beep/fluxo/actions/runs/38006581719 — success.
- Both workflows also passed in the immediately preceding run on the same code SHA.
- The open PR #5 targets `v2/secure-auth-backend`, **not** the default branch; merging that PR alone will not publish production.
- These automated checks do not constitute visual acceptance, live Supabase validation, or a deployed release.

## Known limitation
The current Vercel connection does not expose the existing Fluxo project. Do not create a duplicate Vercel project or promote a deployment to an unverified destination.