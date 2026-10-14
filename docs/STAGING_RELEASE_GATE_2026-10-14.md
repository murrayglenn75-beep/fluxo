# Fluxo staging acceptance gate (2026-10-14)

**Status: NOT RELEASE-VERIFIED.** This is a staging execution checklist, not a record of a completed live smoke test.

## Verified facts
- Fluxo Supabase production project `lwlhabuzsiklikmaysnj` (sa-east-1) contains existing account, consent, payment intent, ledger, command, approval and provider evidence tables with RLS enabled; zero rows reported in the public table list during audit.
- The two *new* `fluxo_sandbox_*` tables are absent on the existing active project.
- GitHub PR #15 has passed web, native-export and disposable PostgreSQL row-isolation checks.
- Vercel projects `fluxo` and `fluxo-fintech` have READY preview deployments for this branch. Listing environment variable names (not secret values) showed that both declare `NEXT_PUBLIC_SUPABASE_URL`, but only `fluxo-fintech` declares `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Check effective environment and deployment scope before using previews.
- No development Supabase branch was present in the connected account at review time.

## Safe next steps (no production data mutation until staging verification)
1. Provision a cost-approved isolated Supabase development branch (or independently approved test project). Never silently create a billable resource.
2. Apply `supabase/migrations/20261014_fluxo_sandbox_owner_boundary.sql` **on that staging database**; ensure migrations are tracked and backup/rollback steps recorded.
3. Create two *real* test users by the normal authentication flow, not by modifying live auth tables or assuming forged JWT claims reflect production authorization.
4. Verify user A can create their own zero-balance account, then view their own pending intent; refresh and confirm persistence. Verify user B cannot read A's rows, change A's ownership or set any intent to settled.
5. Check duplicate client command submission and offline/retry uncertainty; **no automatic payment execution**. An intent saved as `pending_review` means *not paid*.
6. Configure test preview with the **staging** Supabase URL and publishable/anon client key only. Do not place `service_role` / secret API keys in NEXT_PUBLIC variables.
7. Test web 360/390/430px and Capacitor Android build on a real device, including expired session, password recovery, request errors, RLS failures, and assistive technology.
8. Preserve deployment URL + Git SHA, redact logs, capture rollback plan and re-run automated checks. No release approval until evidence exists.

## Known limitations
The hosted Next.js route guard is not an authorization boundary for Capacitor static exports. All sensitive reads/writes must be enforced by Supabase RLS and database grants; fake accounts shown elsewhere in Fluxo are local demo data. The sandbox account currently starts at zero and has no authorized funding action. There is no settlement or provider reconciliation implementation. Do not call this a complete financial transfer flow.

## Seven-part production release evidence gate (2026-10-14)

The following are **not yet verified** and require linked evidence for this exact release commit. No entry may be marked passed on the basis of source code or a READY preview alone.

| Requirement | Required evidence | Current status |
| --- | --- | --- |
| Rollback | Rehearsed deployment revert and safe migration rollback/forward-repair, with integrity checks | Missing |
| Observability | Redacted structured logs, request correlation, failed-auth/intent alert and an incident owner | Missing |
| Regression | CI tests on SHA for auth, RLS, duplicate intent, spoofed settlement and native build | CI verified; live coverage incomplete |
| Performance | Browser mobile timings and representative account/history volume plus p95/error rates | Missing |
| Privacy | Data classification, retention/deletion, breach response and applicable-law assessment | Missing |
| Safe support | Audited, least-privilege diagnostic procedure with no service-role tokens exposed to support UI | Missing |
| Maintainability | Architecture notes, environment map, migration runbook and independent maintainer review | Partial documentation |

All seven are release blockers until tested or explicitly reviewed as not applicable. GDPR, HIPAA and SOC 2 each need separate applicability assessment and any necessary compliance work.

The latest local/security verification does not establish live two-user authentication. Do not create a billable Supabase branch or alter the active project as a shortcut; continue no-cost CI and isolated local verification until authorized.
