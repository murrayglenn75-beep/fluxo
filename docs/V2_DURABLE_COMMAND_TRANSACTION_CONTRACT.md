# Fluxo v2 — durable financial command transaction contract (design, not deployed)

Status: **proposed**. The in-memory `SandboxAtomicCommandStore` is only a concurrency model; it is not safe across processes or restarts. Do not connect a payment provider or release funds based on its result.

## Required boundary

A trusted server-side component must derive the principal from a verified session, never from a request-supplied `user_id`. Database writes must be unavailable to browser and AI clients. A privileged connection must not be exposed through a public RPC or `NEXT_PUBLIC_*` environment variable.

## Atomic claim transaction

Use one PostgreSQL transaction, with all predicates enforced again inside the transaction:

1. Begin a transaction and lock the financial command row using `SELECT ... FOR UPDATE` by **command ID and authenticated owner**.
2. Lock the matching approval row, checking `command_id`, `user_id`, `approved_by`, and `intent_hash`. Require `consumed_at IS NULL`, approval time not in the future, expiry strictly after the database clock, and approval age no more than five minutes.
3. Verify the command is in an eligible state, the owner-bound payment intent still has the same canonical hash, and the supplied idempotency key matches the durable command. Reject all mismatches without mutation.
4. Mark the approval consumed and move the command to `executing` **in the same transaction**. The affected-row counts must each be exactly one; otherwise roll back.
5. Commit. Only the winning caller receives `claimed`. A later identical request must read a durable status and return `already_claimed` without invoking the provider again; a conflicting request fails closed.

**Important:** The database transaction cannot include an external payment-provider network request. The actual provider submission needs a durable outbox record with a unique command ID, provider-supported idempotency key, and a reconciliation state machine. A process crash after claim but before submission must be recoverable. `executing` is *not* proof of settlement. Never automatically resubmit to a provider that lacks an idempotent operation without reconciliation.

## Negative tests required before merge

- Two concurrent connections race to claim one command: exactly one transaction wins.
- Restart a server and retry the same idempotency key: no second outbox entry.
- Same owner and idempotency key but different intent: reject.
- Cross-owner command, approval, payment intent and account references: reject.
- Expired, future-dated, already consumed or tampered approval: reject.
- Failure between approval update and command update: transaction rolls back both.
- Failure between claim commit and provider send: durable outbox resumes safely.
- Provider timeout, duplicated webhook, reordered webhook and replay: no duplicate ledger postings.
- Unauthorized `anon` and `authenticated` roles cannot mutate financial tables or invoke privileged claims.
- Reconciliation distinguishes accepted, pending, failed and settled; never treat a provider acknowledgment as final settlement.

## Release gates

1. Implement a trusted transaction adapter and durable outbox in a **local** database.
2. Run the adversarial integration suite against actual PostgreSQL, including two independent connections.
3. Review RLS, grants and Supabase security advisors.
4. Verify no public privileged RPC and no service-role key in browser bundles.
5. Keep this PR draft until all gates pass.

No database migration is applied by this design document.
