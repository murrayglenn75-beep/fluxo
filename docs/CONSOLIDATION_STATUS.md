# Fluxo v2 consolidation status

Verified locally on October 8, 2026. This document describes the consolidated sandbox release candidate on `v2/secure-auth-backend`. Passing builds do not establish production banking readiness.

## Included work

- Main's README overview from `85e7c9c`, brought in through a no-commit merge.
- Login using the existing Supabase SSR browser client, with unchanged successful `/home` redirect, inline errors, keyboard-accessible password visibility, email remembrance, and a public demo link.
- Public signup and password recovery forms. New-password entry stays disabled until the shared client verifies a password recovery link. A deployed Supabase project must allow the `/auth/reset-password/` redirect; live email delivery and recovery still require end-to-end validation.
- BRL CSV/OFX historical statement preview, explicit import confirmation, persistent fingerprints, and FITID/account-reference identities. Imports add Activity records without changing wallet balances, cards, paid bills, financial commands, or approvals.
- Read-only, deterministic affordability answers based on the current demo balance, unpaid bills, and an explicit R$350 safety buffer.
- Strict minor-unit parsing and balanced-posting validation covering BRL, USD, EUR, GBP, CAD, AUD, JPY, CHF, and CNY. JPY has zero decimal places. Ledger postings must be nonzero signed 64-bit integers with account and command identifiers.

The original hardening checkout in `fluxo-github-sync` has been preserved. Its simple confirmation-flag policy was not adopted: financial actions retain the existing intent-hash and explicit-approval path. Import fingerprints are duplicate-detection metadata, not financial authorizations.

## Statement import

Open **More → Statement Import**, or use the link from **Scan & Import**.

CSV needs `date`/`data`, `description`/`descrição`, and `amount`/`valor` columns. Comma and semicolon delimiters and quoted fields are supported. Optional `id`, `transaction_id`, or `fitid` columns identify bank transactions. OFX supports closed `STMTTRN` blocks containing `DTPOSTED`, `TRNAMT`, `FITID`, and `MEMO` or `NAME`.

Limits: BRL only, at most 2 MB of UTF-8 text, and at most 10,000 transactions. The same account reference must be used for repeat imports. Invalid rows are reported. Duplicates are skipped; likely matches and conflicting FITIDs require manual investigation and are not imported. File-loading and hashing lock the inputs until preview completes. No statement contents are uploaded.

## Verification evidence

- `npm run verify`: typechecking, 113 tests across 17 files, and the production build passed.
- 12 isolated headless Chrome checks passed against the production build: login keyboard/prototype/error behavior, recovery gating, mobile navigation, import preview/confirmation, persistence, CSV duplicates, OFX conflicts, unchanged wallet balance, read-only affordability, responsive layout, and absence of runtime/hydration errors.
- `npm run build:native`: static export passed. Native exports are sandbox-only and do not run server middleware or enforce the web deployment route boundary.
- `git diff --check`: passed.

The browser checks used synthetic local data in a disposable browser context, without real account credentials. They do not verify a live Supabase project, bank provider, or native device build.

## Still outstanding

- PR review and successful GitHub CI are required before merging the consolidated v2 work into main.
- Deploy and verify the existing financial-authority migrations against the intended Supabase project, including grants, RLS, ownership isolation, and approval lifecycle tests.
- Connect authenticated financial-command API routes to the existing server-authority helper and durable tables. This consolidation does not implement a server financial executor.
- Live Supabase login/signup/recovery validation and deployment configuration.
- Real Apple/Google OAuth and passkey registration/challenge/verification. Gesture unlock remains a convenience prototype and cannot authenticate an account or authorize payments.
- Pix/Open Finance/FX provider adapters, verified provider evidence, reconciliation, governed read-only MCP, and production audit/observability.

Fluxo remains a sandbox. Historical statement ingestion and AI explanations do not grant authority to move money.
