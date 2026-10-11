# Fluxo runtime portability and financial authority contract

Status: design guardrails; no live payment provider or production deployment authorized.

## Boundaries
- Next.js UI, Supabase Auth, Postgres/RLS, and provider execution must remain separate.
- Model/MCP tools can read permitted data and propose commands; they cannot approve or execute financial effects.
- The trusted executor alone obtains provider credentials, after a durable single-use approval is atomically consumed.
- Provider-specific Pix and Open Finance calls live behind injected adapters. Avoid importing Deno globals, Node-only modules or network clients into domain logic.
- All financial operations must bind authenticated actor, account owner, intent hash, amount/currency, provider, expiry, and owner-scoped idempotency key.
- Database transitions and outbox insertion are atomic. External provider calls cannot be part of a database transaction; reconcile uncertain outcomes before retries.
- Webhooks require cryptographic validation, replay resistance, durable deduplication, and reconciliation before ledger posting.
- Failed audit writes must not silently convert uncertain effects into success.

## Proposed ports
```ts
export interface Clock { now(): Date }
export interface PixProvider {
  submit(command: ApprovedPixCommand): Promise<ProviderSubmission>;
  lookup(providerReference: string): Promise<ProviderStatus>;
}
export interface OpenFinanceProvider {
  fetchConsentedAccounts(consent: VerifiedConsent): Promise<ReadonlyArray<AccountSnapshot>>;
}
export interface FinancialCommandStore {
  claimApproved(commandId: string, workerId: string): Promise<ClaimResult>;
  recordProviderOutcome(commandId: string, outcome: ProviderOutcome): Promise<void>;
}
```
Types above are illustrative: implement against existing schemas, not as a second authority model.

## Required verification before adopting a new runtime
1. Existing Vitest suite and real PostgreSQL integration suite pass unchanged.
2. Owner-isolation, role inheritance and PUBLIC effective privileges are checked on Supabase-compatible Postgres.
3. Concurrent claims, worker crash, network timeout, duplicate webhook and unknown provider outcome do not double-post.
4. No service-role or provider secret is exposed to browser bundles, AI tools, logs, or audit payloads.
5. Adapter contract tests run with sandbox/fake providers on each proposed runtime.
6. Record version-pinned runtime, dependency and deployment evidence; verify rollback and recovery.
7. Production provider integration, real Pix, and settlement remain explicitly out of scope.

## Release decision
No runtime migration, payment enablement, or deployment promotion until reproducible evidence and an independent security review are available.
