# Fluxo — Forward Deployed Engineering Case Study

**Engagement type:** simulated fintech customer scenario; independent portfolio project, not a paid client deployment.  
**Product:** mobile-first, sandbox-only financial workflows.  
**Status:** engineering demonstration; **not approved for real-money or regulated use**.  
**Review date:** 2026-10-14.

## Executive summary
**Scenario:** A prospective fintech customer wants a mobile prototype of account overview, Pix-style transfers, card controls and budgeting. Attractive UI alone is insufficient: the prototype must prevent invalid money arithmetic, accidental duplicate commands and misleading transaction confirmations.

**Solution:** Fluxo separates user-interface interactions from deterministic validation, review/approval and ledger/state transitions. It offers a sandbox mobile interface, local persistence, receipt/statement flows and optional foundations for authentication. It explicitly does not connect to real payment rails or issue cards.

**Engineering decision:** do not let model-generated text control financial truth or execute transfers. Show the verified sandbox state, and distinguish pending, confirmed and failed outcomes.

**Business outcome:** reusable prototype and testable delivery artifact, **not measured customer ROI**. No external client adoption or operational savings are claimed.

## Discovery assumptions to validate with a real customer
1. Are users permitted to initiate transfers, or only prepare requests for approval?
2. What systems are the source of truth for identity, balances and transfer status?
3. Which identities can approve, revoke or reconcile a payment?
4. What retries, duplicate requests and offline cases must be handled?
5. What does the customer require before pilot sign-off (privacy, audit, accessibility, recovery)?

These are hypothetical discovery prompts, not records of completed interviews.

## Delivery plan and acceptance gates

| Gate | Required acceptance evidence | Current status |
| --- | --- | --- |
| G1: Local sandbox | Exact money calculations, bounded state transitions, duplicate prevention, reproducible tests | Historically documented in [sandbox audit](SANDBOX_AUDIT.md); rerun on target commit |
| G2: Mobile usability | 360/390/430px, keyboard, accessibility, failed-login, offline and error screenshots; physical Android device evidence | **Outstanding / not verified** |
| G3: Real identity | Supabase login, session expiration, two-user owner isolation and PostgreSQL RLS adversarial tests | **Outstanding / not verified** |
| G4: Persistent sandbox payment | Authenticate, review, approve, submit, refresh, retry; persisted truthful pending/confirmed/failed state with no duplicate effect | **Outstanding / not verified** |
| G5: Deployment and recovery | Preview URL and SHA, zero-secrets logs, smoke tests, rollback rehearsal and sign-off | **Outstanding / not verified** |

Do **not** treat a successful native build, HTTP 200, green unit test or READY deployment as a substitute for G2–G5.

## Architecture and trade-offs
UI → validated sandbox command → explicit review → deterministic money/state logic → local persistence → receipts and statements. The assistant can summarize known sandbox state, not authorize provider effects.

- **Why integer amounts?** Floating-point rounding must not determine transfers.
- **Why idempotency?** Repeated requests should not debit twice.
- **Why explicit approvals?** High-impact operations require user control.
- **Why no live integrations yet?** Local sandbox invariants are not sufficient assurance for real customer funds.
- **Known limitation:** browser/device storage is not a transactional multi-user ledger; multi-tab races and cross-user isolation require a real server-side persistence layer and tests.

See [mobile vertical-slice contract](MOBILE_VERTICAL_SLICE_SCOPE.md) and [reviewer quickstart](REVIEWER_QUICKSTART.md).

## Five-minute hiring-manager walkthrough
1. **0:00–0:45** — Problem statement and sandbox boundaries.
2. **0:45–2:15** — On phone/browser: account overview → prepare Pix-style sandbox transfer → review → receipt/status. Show actual working paths only.
3. **2:15–3:15** — Explain integer-money validation, duplicate prevention and state persistence using code/test references.
4. **3:15–4:15** — Open CI and the reproducible review guide; disclose any failing/pending checks.
5. **4:15–5:00** — Explain the G2–G5 blockers and how a production migration would be safely gated.

**Demo:** https://fluxo-fintech-xi.vercel.app/ — availability and correctness must be rechecked before an interview.

## Operational handover template
Before pilot handover, record:
- exact deployed SHA, preview URL, environment and dependencies;
- test command outputs with timestamps and failure cases;
- data retention, deletion and privacy threat model;
- secrets ownership and rotation (never commit credentials);
- rollback owner, procedure, rehearsal evidence and recovery objective;
- monitoring/alerting responsibility and incident escalation;
- unresolved limitations, explicit customer acceptance and release decision.

## Next evidence collection
- [ ] Run `npm ci && npm run typecheck && npm test && npm run build && npm run build:native` at a pinned commit.
- [ ] Capture real mobile/browser walkthrough with screen dimensions and accessibility checks.
- [ ] Run the test-user A/B RLS suite against a disposable database with no cost-bearing managed branch.
- [ ] Verify persisted sandbox statuses and duplicate-request behavior in deployed preview.
- [ ] Capture rollback rehearsal and release-review sign-off.

**Claim policy:** Historical numbers belong to their dated source; only current green runs may be called current. Synthetic data, simulated customer needs, and unverified deployment properties must always be labeled.
