# Financial agents: safe refund and payment command execution

Status: proposed execution contract. Does not replace the existing pending Supabase migration tests, server-side approval consumption, or financial executor.

## Critical distinction
Agent workflow selection (plain loop versus LangGraph) cannot grant financial authority or prevent double charges/refunds.

## Command state machine
`draft -> awaiting_approval -> authorized -> prepared -> dispatching -> {committed | failed | outcome_unknown}`
`outcome_unknown -> reconciling -> {committed | failed | manual_review}`
Terminal records immutable; human approval bound to canonical immutable parameters, account owner, provider target, expiry and command hash.

## Invariants
1. Never issue provider requests from the browser, LLM or client-authenticated financial-table writes.
2. Server broker owns credentials; RLS and same-owner relational constraints still enforced.
3. Unique immutable `command_id` plus idempotency key; atomic approval consumption within a database transaction.
4. Timeout after provider dispatch is **not** proof of failure. Reconcile via provider operation ID or idempotency key before retry.
5. If provider cannot verify result, block automated retry and require human review.
6. Retry only transient errors for operations known not to have committed, or safely idempotent operations.
7. Audit every transition, redact secrets/PII, retain provider evidence bound to command hash.

## Database and integration gates (must be executed before shipping)
- Run migrations on clean and populated Supabase databases; verify grants/RLS and cross-owner rejection.
- Two concurrent workers submit same payment command -> one provider effect.
- Crash before and after provider acknowledgement -> no duplicate on resume.
- Mutated amount/recipient after approval -> invalidates authorization.
- Provider success followed by audit failure -> quarantine with reconciliation.
- Fail-closed when provider lacks reliable idempotency/read-after-write.
- Compare minimal loop vs graph only for agent UX; maintain this executor boundary in both.
