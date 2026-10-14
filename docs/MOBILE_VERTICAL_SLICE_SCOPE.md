# Fluxo: Mobile vertical-slice scope contract

Status: **scope decision only**. A merged contract does not prove the feature exists.

## In scope — exactly one user journey
Mobile sign-in (real Supabase session) → authenticated account overview → prepare a **sandbox-only** payment/transfer intent → verify identity/approval and idempotency → display **persisted, truthful** pending/confirmed/failure status.

## Release-blocking invariants
- Mobile widths 360px, 390px, 430px; keyboard, labels, contrast, loading, empty and error states.
- Supabase RLS prevents cross-user reads/writes. No service-role key in browser.
- A transfer cannot bypass authentication, consent, approval or idempotency. Avoid real-money effects.
- Duplicate submissions do not duplicate ledger/outbox effects. Unknown provider outcomes remain uncertain until reconciled.
- Deployment actually authenticates, persists/reloads the intent, and shows a true result; errors are handled.
- Negative tests and rollback path must be demonstrated, not inferred from green unit CI.

## Deferred until first slice passes
Additional provider integrations, FX expansion, cosmetic screens not required by this journey, autonomous financial actions, extra AI finance features.

## Acceptance plan
1. Authenticate as test users A/B; confirm no session means denial and B cannot read/write A's rows.
2. Run PostgreSQL migration, concurrency, idempotency and owner-bound RLS tests on a disposable DB.
3. Exercise mobile UX at 360/390/430px, including failed login, expired session, offline/retry, accessibility and no fabricated balances.
4. In deployed preview, capture real URLs/commit/environment, perform sandbox journey, check persisted status and logs. No production keys in logs.
5. Document rollback, incident response and human approval before any live-money release.

## Demo script
Open on phone → log in → see own account → draft sandbox payment → approve → confirm persisted status → demonstrate safe retry and failure handling.

## Evidence checklist
- [ ] Relevant checks pass on merged commit
- [ ] Mobile screenshots + accessibility report
- [ ] RLS/abuse tests with two users
- [ ] Deployed sandbox smoke-test results
- [ ] Audit and rollback evidence
- [ ] Reviewer sign-off for release claim

Source: 2026-10-14 Build Knowledge Base scope-cut standard. User-approved mobile UX and existing security controls take priority over new features.
