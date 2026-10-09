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
