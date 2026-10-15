# Fluxo FDE verification matrix — 2026-10-14

Scope: **sandbox only**. This file separates machine-reported checks from manual evidence still required. No client production deployment or payment-provider integration is implied.

## Current automated checks
For commit `a80ece88e8da4d97e276a82b686dbf496ad06b88`:
- [GitHub Actions verify run 38647553130](https://github.com/murrayglenn75-beep/fluxo/actions/runs/38647553130) — completed: success
- [GitHub Actions verify run 38647532067](https://github.com/murrayglenn75-beep/fluxo/actions/runs/38647532067) — completed: success

Workflow `.github/workflows/verify.yml` invokes `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run build:native` on Ubuntu / Node 22. These are reported CI outcomes, **not independent interactive user-journey checks**.

## Acceptance evidence register

| Requirement | Test procedure | Proof required | Status |
| --- | --- | --- | --- |
| App compiles and regression suite | CI `verify` workflow | Run URLs above | PASS on cited commit |
| Mobile viewport UX | Walk 360/390/430px, keyboard and errors | Screenshots + defects | NOT VERIFIED |
| Physical-device behavior | Install native debug build on Android and interact | Device/model/version + video/log | NOT VERIFIED |
| Real auth | Log in/out; refresh and expire session | Test-account transcript without secrets | NOT VERIFIED |
| Data isolation | Users A/B denied cross-owner access to rows | Disposable PostgreSQL/RLS negative test logs | NOT VERIFIED |
| Payment retry and duplicate effects | Submit same idempotency key concurrently and after reload | Persisted state + DB evidence | NOT VERIFIED |
| Truthful transaction status | Simulate failure and unknown outcome | Durable audit/outbox trace | NOT VERIFIED |
| Deployment availability | Open preview & run full journey | URL, SHA, timestamp, environment | NOT VERIFIED |
| Accessibility | Keyboard, screen reader, labels, focus and contrast | Audit notes/recording | NOT VERIFIED |
| Rollback and incident recovery | Revert safe preview and restore state | Rehearsal timestamps + outcome | NOT VERIFIED |

## Manual reviewer walkthrough
1. Check the running commit and deployment URL before testing. Do not assume a historic READY state means the app works.
2. On mobile 360/390/430 widths, inspect contrast, forms, disabled states, errors, keyboard overlap, focus order.
3. Exercise locally implemented **sandbox-only** card, payment, receipt, statement and reload workflows.
4. Log defects with **expected / observed / reproduction / environment / screenshot**, one per issue.
5. For the full authenticated vertical slice, use two disposable users and disposable database fixtures; test missing session, session expiry, RLS cross-owner denial, replay, concurrent duplicate intents and uncertain effects.
6. Verify any successful outcome against persisted authoritative state, not a UI toast.
7. Capture incident rollback rehearsal, logs redaction, security review and explicit sign-off before changing the release claim.

## Reviewer exit decision
- **Portfolio demo:** may show current sandbox workflows with limitations clearly stated.
- **Authenticated pilot:** blocked until real-session, RLS, durability, retries and deploy evidence exist.
- **Real-money use:** explicitly outside project scope; requires substantial regulatory, security, operational and provider work beyond this plan.

Do not mark an unexecuted test PASS. Do not publish credentials or real user data.
