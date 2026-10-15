# Fluxo PR reconciliation — October 14, 2026

## Scope and decisions

The `v2/secure-auth-backend` release candidate reconciles PRs #4, #5, and #15 with current main. This is a sandbox code integration, not authorization to deploy live database migrations, fund accounts, or enable real-money execution.

- Keep the latest dark emerald mobile home, welcome screen, and Home/Activity/Pix/Cards navigation from v2. Adopt shared accessible dialogs and backend transaction/worker tests from the security branch.
- Keep the shared `lib/supabase/client.ts` browser factory and the existing successful `/home` redirect. The new `browserAuth` name is a compatibility alias, not a second client implementation.
- `/signup` is the canonical Create account destination and renders the tested real signup form. Update the regression to follow that link and validate its reachable form; do not restore a stale href merely to make a test pass.
- Maintain exact public authentication entry points, onboarding/legal information and the public portfolio root. Protected web routes fail closed when configuration is absent, a user cannot be verified, or Auth is unavailable. `/sandbox/account` stays protected and cannot be unlocked by a local pattern.
- Preserve refreshed/invalidated cookies across access-denied redirects; private responses are not cacheable. A forged or merely stored session is not accepted as a current user.
- `/auth/reset` and `/auth/reset-password` share one recovery implementation. An ordinary session or manually supplied recovery fragment cannot enable the update form.
- Preserve explicit prototype disclosures for unsupported alternate login methods. Identity authentication, local demo state, pending sandbox intents and financial approval are distinct boundaries.
- Run the authority and sandbox migrations together on both clean and populated disposable databases. Test owner isolation, denied browser settlement and zero-balance intent creation alongside the existing atomicity, replay, idempotency and worker-privilege checks.

## Local evidence

- `npm run verify`: 188 tests across 33 files, typechecking and the hosted production build passed.
- Native static export passed. Eleven screens were checked at 360, 390 and 430px with no horizontal overflow or runtime/hydration errors.
- WCAG 2 A/AA and 2.1 AA automated checks passed on those eleven exported screens. Four merge-related accessibility findings were fixed: card-button contrast, AI-intro contrast, selected account-tab contrast and exchange-flag semantics.
- Hosted login, signup, forgot-password and reset pages passed the automated accessibility checks; keyboard password visibility, the real signup route, public demo navigation and protected route denials were exercised. Login controls meet 44px targets at 360/390/430/1280px.
- Native menu navigation, explicit historical import confirmation, reload duplicate detection, unchanged wallet balance and read-only AI calculations passed using synthetic data in an isolated browser context.

Repeatable browser scripts are `tests/browser/auth-release.cjs` (hosted no-configuration boundary checks) and `tests/browser/release-reconciliation.cjs` (sandbox static export). Their pinned optional tools are installed outside application dependencies by `.github/workflows/reconciled-browser-release.yml`; the workflow uploads synthetic screenshots as review evidence.

## Merge and deployment gates

GitHub CI must pass on the reconciled commit, including disposable PostgreSQL clean/populated migrations and sandbox RLS tests, native export, browser/a11y checks and production builds. Check the merge result again before describing main as verified. READY previews alone do not meet these gates.

No live Supabase project or migration was modified by this reconciliation. Real two-user hosted authentication, email recovery delivery, applied-schema evidence, real-device testing, production operations/rollback evidence and provider integration remain separate acceptance gates. Native exports do not execute Next.js middleware; their data boundary is database grants/RLS, not the hosted route proxy. The outbox remains a draft integration, pending intents are not paid transfers, and no production banking readiness is claimed.
