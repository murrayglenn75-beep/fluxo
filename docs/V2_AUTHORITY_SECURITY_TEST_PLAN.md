# Fluxo financial authority security checks

This is a **pre-deployment checklist** for the v2 migration and hardening patch. Run against a disposable Supabase project, not production. Never expose a service-role key in browser code.

## Database assertions

1. Apply all migrations in chronological order on a clean database.
2. Confirm every authoritative table has RLS enabled and only owner-scoped SELECT policies.
3. As authenticated user A, attempt INSERT, UPDATE and DELETE on accounts, financial_commands, financial_approvals, payment_intents, provider_evidence, payment_consents and ledger_entries. All must be rejected.
4. As user A, SELECT user B's records. No rows must be returned.
5. Using a trusted server test role, try to create a payment intent for A pointing to B's consent; expect FK failure.
6. Using a trusted server test role, try to create provider evidence for A pointing to B's intent; expect FK failure.
7. Try to attach A's command to B's payment intent and A's ledger entry to B's account/command; expect FK failures.
8. Verify anon has no privileges on financial tables and authenticated has SELECT only.
9. Verify a service/server execution transaction rejects wrong intent hashes, stale approvals, replayed approval, expired approvals, idempotency-key reuse with changed payload, and concurrent execution. **Not yet implemented; release-blocking.**
10. Run migration tests against a populated database clone to detect existing cross-owner rows before rollout.

## Deployment gate

- No production deployment until the migration is verified against the intended Supabase project.
- No money movement without atomic approval consumption, idempotency, and durable audit.
- Keep sandbox demo state separate from authoritative accounts.
