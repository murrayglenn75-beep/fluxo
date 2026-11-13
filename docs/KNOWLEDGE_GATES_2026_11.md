# November 2026: privacy, assistant and UI release gates

**Status:** actionable change specification, not a claim of implementation or completed regression testing. Fluxo remains a *sandbox*: no live banking or Pix settlement.

## Preserve deterministic financial state

AI model responses, retrieval hits, semantic caches and context summaries must **never** directly mutate ledger, balance, card limits or approval state. All financial commands follow the validated integer-amount, exact-action, review, idempotency and audit path. Cloud inference is never a fallback for confidential data without user consent and a separately enforced policy. A successful model prediction is not an authorization.

## Structured assistant inputs and output

If a future assistant accesses personal or transaction data, restrict access by owner/tenant, use the minimum necessary fields, validate structured outputs with schemas, redact PII **before** remote calls and keep reversible redaction maps local, access-controlled and expiring. Do not treat a narrow-model fine-tuning demo as proof of PII recall. Test multiword names, addresses, identifiers, currencies and mixed-language data. Return a clear safe fallback on empty retrieval, timeout or invalid output.

## Cost/latency improvements only after measurement

Start with the existing deterministic summaries. Establish a gold dataset, correctness and privacy baseline before experimenting with local-small-model routing, prefix caching, batching, semantic caching or hosted LLMs. Cache keys must include tenant, role, policy version and data freshness; never reuse sensitive answers across users. Log chosen route, cost, latency and privacy tier without raw secrets or sensitive prompt bodies.

## Theme/UX acceptance matrix (existing user-reported regressions)

Exercise every supported theme/accent through Home, Cards, Activity, Transfers, Requests, Goals, Budgets and Settings on mobile/desktop. Verify token propagation on navigation and reload; contrast of text, controls, error/success/disabled states, overlays and charts; full demo-mode navigation without redirect to login; readable focus/hover states. Screenshots from a single viewport do not establish cross-device correctness.

## Ship gate

Run `npm run typecheck`, `npm test`, `npm run build`, flow-driven browser tests and a manual small-screen accessibility review. Add automated cases for unauthorized assistant write attempts, tenant cache isolation, duplicate payment retries, malformed JSON, stale state and fallback behavior *if/when* those AI features are implemented. Never claim deployment until the live release and target devices are verified.

**Implementation requires changes to existing code and tests; this document alone is not the implementation.**
