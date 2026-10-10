# Financial authority and release gates

PR #5 strengthens owner-scoped financial authority RLS, owner-bound references, grants, idempotency, and sandbox financial command claims. Keep these safeguards intact. Never expose a Supabase service-role key in the browser.

Inspect `supabase/migrations/20261009000000_v2_authority_hardening.sql`, `docs/RELEASE_REVIEW_2026-10-09.md`, and PostgreSQL integration tests. The outbox draft `docs/sql/financial-command-outbox.draft.sql` is **not approved for deployment**.

Before any merge or production rollout: clean and populated database migration tests; cross-owner/RLS adversarial tests; least-privilege worker grants; atomic approval consumption, idempotency, replay and rollback review; final frontend and PostgreSQL CI; responsive visual/accessibility QA; explicit human approval.

Vercel preview success is not evidence that production DB migrations or live financial behavior are safe. The app is sandbox-only: no real Pix, bank connections, card issuance, live FX or actual money transfers.
