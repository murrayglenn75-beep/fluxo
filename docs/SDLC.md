# Fluxo SDLC — release governance and quality gates

Applies to all feature, UI, security and infrastructure changes. Status: adopted on UX repair branch; gates require evidence before release.

## 1. Requirements and discovery
- Capture user journeys, screenshots, expected results and explicit acceptance criteria in an issue.
- Preserve full mobile demo access and sandbox-only financial behaviour.
- Define platform, accessibility, privacy, security and performance constraints.
- Track requirements against GitHub issues (#52 mobile UX, #37 theme repair).

## 2. Design
- Mobile-first 360/390px; expand to tablet and desktop.
- Design tokens must separate accent from light/dark surface mode, semantic financial status and contrast.
- Seven accents (emerald, blue, purple, red, yellow, pink, black); Dark and System are release targets. Legacy Light must not be reintroduced as a selectable option without approval.
- Review navigation, safe areas, bottom sheets, touch targets, accessibility and error states.
- Record design decisions and rollback path.

## 3. Implementation
- Use short-lived branches and reviewed PRs. No direct production changes.
- Consolidate duplicate CSS rules; avoid additional broad !important overrides.
- Initialize and persist appearance consistently before UI paint and across navigation.
- Validate untrusted inputs; enforce authorization server-side, RLS and least-privilege grants.
- Never treat a sandbox balance as real money.

## 4. Verification matrix
- Automated: npm ci, typecheck, unit/integration, production build, dependency and secret scanning.
- Visual: 7 accents x Dark/System x OS light/dark where relevant; screenshot diffs on 360, 390, 768, 1280px.
- Functional: theme switching and persistence after reload; Demo onboarding; Home, Pix, Activity, Cards, Budgets, Goals, Settings and AI routes; navigation and back.
- Accessibility: keyboard and screen reader, contrast, 44px touch targets, reduced motion, 200% text zoom, safe areas.
- Security: cross-account RLS, no shared caching of user financial data, least-privilege API grants, error handling.
- Record actual test commands, screenshots and pass/fail evidence. CI passing does not imply visual signoff.

## 5. Release
- Merge only after CI, manual mobile checks, security review and approval.
- Deploy preview first; smoke-test preview, then production.
- Confirm deployed commit SHA, test real Android/mobile browser, monitor errors and rollback if regression occurs.
- Do not call code 'live' until production deployment and smoke checks are confirmed.

## 6. Operate and improve
- Monitor failures, performance, accessibility and user feedback.
- For each regression, record exact reproduction, root cause, tests added, corrective action and verification.
- Apply transcript-first evidence, independent authorization and regression-gated harness retrospectives proportionately.

## Current release gate
PR #37 is a draft until theme, mobile and security verification are complete. This document does not constitute test results or deployment approval.
