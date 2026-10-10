# Codex task: complete Fluxo v2

Inspect the latest branch and existing code first. Complete the approved emerald/midnight-teal responsive UX/UI across Home, Activity, Cards, Pix, Transfer, Exchange, Bills, AI, Settings, Goals, Budgets, Open Finance, Scan/Import, welcome/onboarding, and authentication.

Refactor accumulated `app/globals.css` mobile overrides into a coherent design system, preserving existing functionality. Verify at 375px, 390px, 430px and desktop; capture screenshots where browser tooling is available. Fix overflow, bottom-navigation clearance, dialogs, focus, contrast, labels, native select readability and keyboard interactions.

Specific prior defects: Exchange currency selector was unreadable; Activity footer was clipped; AI spending/savings answers were too similar (a conservative savings branch was added); Pix Receive and QR Code need clear differentiation. Preserve sandbox-only labels and behavior.

Run repository lint, typecheck, tests, build and PostgreSQL integration/security checks. Record exact results and unresolved blockers. Commit only to `security/v2-authority-hardening`. Do not merge or deploy production.
