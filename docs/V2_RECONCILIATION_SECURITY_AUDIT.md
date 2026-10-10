# Fluxo v2 — Security and correctness review (9 October 2026)

Scope: security/v2-authority-hardening, disposable PostgreSQL fixture, outbox/reconciliation adapters. This is **not** a production certification.

## Implemented in this review
- Added append-only provider-evidence draft table with owner-bound FK, RLS, and no browser privileges.
- Bound reconciliation to user ID and required evidence source/digest metadata, recorded atomically with status.
- Separated `settled` from mere `acknowledged` in the draft outbox schema.
- Fixed malformed JavaScript test-harness syntax and improved test-only module import resolution.
- Added PostgreSQL assertions for evidence audit and terminal immutability.

## Blocking issues before deployment

1. **Provider authentication absent (critical).** The caller currently supplies `authenticatedSource` and a 64-hex-character `evidenceDigest`; validation of their format is **not** cryptographic verification. Implement provider-specific signature verification / mTLS / authenticated server API and replay resistance before allowing a caller to invoke `recordProviderReconciliation`. Bind authenticated evidence to operation ID, merchant/account, amount, currency, intent hash, and provider timestamps. Do not accept client-provided identity claims.
2. **No live settlement transport (critical).** The provider adapter is a policy and database recorder, not an actual Pix settlement inquiry. No payment provider is integrated. `not_found` stays uncertain by design; never automatically resend.
3. **Draft schema not deployed (critical).** `docs/sql/financial-command-outbox.draft.sql` is a draft, not a Supabase migration. Apply only after generating a migration via Supabase CLI and validating against actual migrations locally. Do not touch live database as part of this PR.
4. **Synthetic fixture is not actual production schema (high).** Current tests create simplified financial tables. Add migration-based integration tests and verify foreign keys, RLS, indexes, and all SQL queries against the real schema.
5. **No separate immutable settlement ledger or full evidence payload (high).** Evidence rows store a digest and source but not independently verified raw provider evidence in secure storage. Add canonical payload hashing, immutable object storage, signature/key-version metadata, provider event ID uniqueness, retention policy, and settlement ledger before real money.
6. **Outbox terminal semantics (high).** The sandbox-only state machine still treats `settlement_verified` as `acknowledged`; align it with the new `settled` database state. Decide how provider acknowledgements and verified settlement affect financial command status.
7. **Command-type coupling (high).** The claim adapter requires `payment_intent_id` for all commands. Verify this is valid for every supported transfer/exchange/other command type, and validate that `request_fingerprint` uses exactly the same canonical algorithm as `intent_hash`.
8. **No dedicated least-privilege worker DB role (high).** Tests use the PostgreSQL superuser. Add a narrowly scoped role; test denied browser access, row ownership, and disallowed ledger UPDATE/DELETE with that role.
9. **No trusted reconciliation scheduling (medium).** Implement bounded backoff, alerts for unresolved outcomes, reconciliation SLA, worker health checks, dead-letter handling, and operator review. Do not retry a payment submission after ambiguous outcomes.
10. **Test-only dependency install (medium).** CI installs `pg` without committing a lockfile entry. Pin via a dedicated test package/lockfile or repo dev dependency before treating CI as reproducible.

## Release gates
- CI typecheck, unit tests, build and PostgreSQL integration must pass on **the same final commit**.
- Demonstrate replay, cross-owner, tampered evidence, concurrent claims, worker crash, lease expiry, database rollback, provider outage, and verified settlement tests against a real PostgreSQL instance.
- Validate migration and RLS locally; run Supabase security advisors; independent security review.
- No production funds or live Supabase schema changes until these gates pass.
