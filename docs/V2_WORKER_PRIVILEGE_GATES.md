# Financial worker privileges — current limits

The disposable PostgreSQL CI database creates a `fluxo_worker` NOLOGIN role and checks explicit permissions. This does **not** mean the real adapter runs under that role: the existing integration adapter still uses the fixture superuser.

## Privilege model
- Read commands, approvals, payment intents.
- Update only command `status`, approval `consumed_at`, and specific outbox state columns.
- Insert outbox, verified provider evidence, and replay receipts.
- No browser access to the outbox/evidence/receipts; no worker DELETE or owner reassignment.

## Remaining release gates
1. Run the actual adapter under a dedicated worker login with its own credentials in disposable CI.
2. Decide RLS strategy for the trusted worker. RLS on public outbox/evidence tables blocks a non-bypass role absent explicit policies; prefer a private schema or a narrow role with carefully reviewed policies. Do **not** grant BYPASSRLS casually.
3. Build a migration-faithful test environment using the real Supabase migration chain and the auth schema, not the simplified fixture.
4. Validate and restrict PostgreSQL `PUBLIC` and inherited privileges; add privilege tests using `SET ROLE` for both positive and negative SQL operations.
5. Keep server-only secrets and DB credentials out of browser bundles and CI logs.

This file documents the gap rather than claiming least-privilege runtime verification.

## Confirmed schema mismatch requiring redesign

The actual `20261006023034_v2_financial_authority.sql` permits
`command_type` values `payment`, `transfer`, and `exchange` and allows
`payment_intent_id` to be NULL. The current
`postgres-command-claim.ts` rejects all pending commands with NULL payment
intent, while the simplified CI fixture makes that column NOT NULL.
Consequently, the CI fixture is **not migration-faithful** and does not prove
transfer/exchange commands work. Do not remove the fail-closed check until
each command type has a separately defined canonical intent binding and tests.

The isolated fixture also omits several actual command and approval columns.
A full migration replay and RLS-aware worker test remain mandatory.
