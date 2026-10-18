# Fluxo security and Pix readiness audit — 18 October 2026

## Verified repository observations
- `main/package.json` declares Next.js 16.3.8, Supabase JS 2.117.2, @supabase/ssr 0.12.7, AI SDK 7.0.127 and Capacitor 8.
- `npm run verify` is configured to run TypeScript checking, Vitest and a Next.js build. **This audit did not execute those commands.**
- Requests for `supabase/migrations/001_core.sql` and `supabase/migrations/002_rls_policies.sql` on `main` returned 404. This does not establish whether the schema is defined elsewhere, in another branch, or only in a deployed database.
- No production database access, migrations, payment execution, or deployment changes were performed.

## P0 — database authority and October 30 readiness
Supabase will stop automatically exposing **new** public-schema tables to Data API roles on existing projects from 2026-10-30. Existing table grants remain intact. See https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically

Before applying SQL:
1. Inventory all tables, functions, views, sequences and API call sites; identify authoritative ledger and payment-intent writes.
2. Verify the current database migration source and deployed schema. Do not guess table names or apply blanket grants.
3. For each intended Data API object, add explicit minimal GRANT statements **in the same migration** as CREATE TABLE, ENABLE ROW LEVEL SECURITY and policies.
4. Ensure anon has no access to private finance records, and authenticated users cannot mutate authoritative ledger balances or settled transactions.
5. Test with two independent users and anon credentials: own-row permitted operations, cross-user read/write rejection, missing-grant errors, and privileged server-only operations.
6. Review SECURITY DEFINER functions, search_path, service-role key placement and storage policies separately.

## P1 — Pix adapter contract
Use the Banco Central specification https://github.com/bacen/pix-api (2.10.0 as of this audit) as the canonical contract. Check provider-specific differences before connecting real funds.

Required tests:
- Duplicate request idempotency and retry with unchanged payment-intent hash.
- State-machine transitions (created -> pending -> confirmed/failed), late/out-of-order callbacks and replayed webhooks.
- Signature/authenticity validation, amount and recipient integrity, reconciliation of provider IDs, and cancellation/refund edge cases.
- No automatic payment execution by an AI agent; require a server-enforced, single-use, narrowly scoped approval.

## P1 — UX and authentication
- Run `npm run verify` in CI and capture logs.
- Verify signup/login/logout/session refresh and unauthenticated route protections.
- Test every approved mobile screen on narrow viewports and confirm demo navigation is not artificially restricted.

## Exit gate
Do not label the app production-ready until the current migrations are located, permission tests run against a disposable Supabase environment, Pix contract tests pass, and the deployed app is checked on mobile. Record actual commands, commit hashes and results; do not substitute assertions for evidence.
