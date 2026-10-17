# Reusable fintech engineering evidence

## Why
A completed feature is not reusable until another engineer or agent can understand the original choice, constraints, contracts, permissions, tests and failure modes without repeating the investigation.

## Feature evidence record
For each feature, capture:
- Feature name, owner, requirement and linked issue
- Inputs/outputs and runtime/data-flow diagram (for example UI -> adapter -> validated domain logic -> authorization -> database)
- Invariants for money, idempotency, permission boundaries and account ownership
- Database and API contracts, source revisions, migrations and rollback plan
- Known failure modes, reproduction instructions, negative tests and CI evidence
- Design alternatives and why they were rejected
- Explicit status: proposed, locally tested, CI verified, deployed verified

## Prioritized targets
1. Trace login -> identity -> RLS and show where each permission check is enforced.
2. Record one testable evidence package for PIX/payment intent canonicalization and replay/idempotency protection.
3. Split reusable feature contracts (types, validated domain behavior, regression fixtures) from screen-specific UI.
4. Produce machine-readable test failures; never infer a root cause solely from an LLM summary.
5. Preserve all money-moving actions behind exact-action, scoped human approval when an agent is involved.
6. Require browser/mobile smoke evidence, RLS negative tests, release gates and rollback proof before production claims.

## Reuse acceptance test
A second engineer can implement a related feature in a fresh branch using the documented contract; security, regression and integration tests pass without copying hidden state.

This document is a staged engineering plan and does not claim any product feature has been deployed.
