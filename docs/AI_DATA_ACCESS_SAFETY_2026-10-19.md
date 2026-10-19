# Proposed AI data access safety standard (2026-10-19)

Status: architecture and test specification only; no feature or production deployment implied.

- The LLM may explain user-authorized data, but cannot directly perform authoritative ledger, transfer, balance, or account writes.
- SQL-based AI analytics must use a read-only scoped database principal, deterministic AST allowlist, bounded queries, timeouts, row limits and parameter binding.
- Validate Supabase RLS and same-user keys independently of the LLM. Restrict model retrieval by session identity and tenant scope before ranking.
- Finance memory must include provenance, scope, timestamps, retention policy and revocation. Keep PII and secrets out of prompts, logs and traces.
- Trace permission decisions and failures, but redact sensitive fields. Prompt-injection text in transactions is untrusted data.

## Required tests before enabling any AI query
- Cross-account transaction access rejected.
- Write statements, multiple statements, DDL and unsafe functions rejected.
- Session spoofing and modified filters rejected.
- Excessive cardinality/latency rejected.
- Existing mobile visual requirements and authentication unaffected.

No new database grants, schema changes, environment variables or production deploy authorized by this note.
