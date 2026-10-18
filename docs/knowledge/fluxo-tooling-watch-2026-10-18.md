# Fluxo knowledge base — tooling, security and release research (18 October 2026)

## Scope
Consolidates actionable findings and decisions from the October 17–18 Fluxo tooling-watch conversation. This is a research and engineering record, **not** evidence of completed live tests or production integration.

## Research watch
- Monitor official Banco Central Pix API and Open Finance Brasil documentation; GitHub and Reddit discussions; Supabase, Next.js, Vercel AI SDK, MCP finance connectors; and relevant open-source personal finance projects.
- Notify only for material, actionable developments; explain what changed, why it matters, and the concrete Fluxo action.
- Two existing daily watches were observed: `Fluxo Development Watch` and `Fluxo Tooling Watch`. Both were enabled but notifications disabled at the time checked. No automation changes were made. Consolidating duplicates was recommended, not executed.

## Developments to assess
1. Supabase announced that from **30 October 2026**, automatic Data API grants for **newly created tables** on existing projects will be restricted. Existing grants are preserved. Use explicit least-privilege grants and RLS; do not apply broad grants. Official source: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
2. Supabase announced retirement of older TLS cipher suites no earlier than **10 November 2026**; verify older custom clients if any. Confirm exact rollout against current official documentation before acting.
3. Banco Central Pix API specification version **2.10.0** was identified as an adapter compatibility review target, including Pix Automático. Official source: https://github.com/bacen/pix-api
4. Open Finance Brasil scheduled Pix hybrid-flow documentation version **24.00.00** (24 September 2026) was identified as a contract-review target. Validate against official current docs before implementation.
5. Vercel AI Gateway announced Reflection AI Beam and a temporary `reflection/beam-free` route. Consider synthetic-data-only, read-only benchmark for explanations/tool routing; never enable payment execution or assume free access remains permanent.

## Verified GitHub observations
- Repository: https://github.com/murrayglenn75-beep/fluxo ; default branch `main`.
- `main/package.json` declared Next.js 16.3.8, React 19.3.0, Supabase JS 2.117.2, @supabase/ssr 0.12.7, AI SDK 7.0.127, Capacitor 8.5.2; `npm run verify` chains typecheck, Vitest and build. These commands were **not run** during this chat.
- The historically suggested paths `supabase/migrations/001_core.sql` and `002_rls_policies.sql` returned 404 on `main`. This is **not proof that migrations are absent**.
- README describes a mobile-first local sandbox with deterministic money/approval logic, Pix-style simulations, optional Supabase auth, and no real bank settlement, card issuance or live Open Finance provider.
- `docs/CONSOLIDATION_STATUS.md` documents a v2 working tree and historical 113 passing tests on October 8.
- `docs/RELEASE_RECONCILIATION_2026-10-14.md` reports 188 passing local tests on `v2/secure-auth-backend`, including authority/sandbox migration tests, and identifies live authentication, deployed-schema evidence, CI merge gates and provider integration as outstanding. Those historical results were not rerun here.
- `docs/SANDBOX_AUDIT.md` records historical sandbox tests and native build evidence, not live banking validation.

## Changes made in this conversation
- Created branch `audit/supabase-pix-readiness-2026-10`.
- Committed audit document `docs/audits/2026-10-supabase-pix-readiness.md` at commit `f2264b8e3c2805d01b60f9dbb3ea8f40c1ea4b82`.
- Opened draft PR #30: https://github.com/murrayglenn75-beep/fluxo/pull/30 .
- A later attempt to correct that audit document was blocked; do not assume the corrections landed. This knowledge-base record explicitly supersedes any suggestion that the guessed migration paths prove missing migrations.
- No production database, payments, deployed app, or live credentials were modified. No new automated test runs were executed.

## Ordered engineering gates
P0: Locate actual v2 migrations and reconcile branch versus main; verify migration CI and clean/populated disposable Postgres tests. Confirm table grants, RLS, cross-user isolation, privileged writes, function search paths and service-role boundaries.
P1: Verify login/signup/recovery/session-refresh behavior on hosted deployment; preserve public demo and fail-closed protected routes.
P1: Implement Pix versioned adapter contracts only after comparing official specs; test idempotency, approval-hash integrity, retries, webhook authenticity, late callbacks, replay and reconciliation. No real funds.
P1: Validate approved mobile layouts, all screens, native behavior and accessible navigation.
P2: Benchmark AI assistant using synthetic data with read-only tools. Financial execution requires server-enforced scoped, single-use approvals.
Release gate: CI and reproducible evidence, hosted two-user tests, migration deployment evidence, real-device testing, and operational recovery before any production-readiness claim.

## Integrity rule
Separate (a) documentation claims, (b) code observed, (c) tests actually run, and (d) live deployment validation. Never infer a fix, successful merge, bank connection, or security guarantee from a draft PR.
