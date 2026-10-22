# Fluxo DESIGN.md — authoritative UI contract
Status: approved requirements distilled from the user's Fluxo mobile references and UX library. This document is a testable specification, not a claim of visual equivalence.

## Product identity
- Mobile-first banking-style **sandbox**, not a live bank. No simulated operation may imply actual settlement.
- Forest-green visual foundation, legible financial information, accessible contrast and consistent typography.
- Keep the approved mobile layout and user journeys; do not introduce an unrelated generic dashboard.
- Accent choices: **Emerald, Blue, Purple, Red, Yellow, Pink, Black**. Theme choices: **Dark, Light, System**.
- Theme and accent are independent preferences. The setting on `/settings` changes the same tokens used on every screen, and restores after refresh/navigation.
- Black accent means near-black branding and card surfaces, not black text on a black background; preserve readable foregrounds.
- Pink is a distinct palette (not Red). Keep semantic errors/income/outgoing transactions distinguishable from decorative accent.
- Decorative animation is optional; no external UI skill or animation library is approved by this document.

## Responsive design / screens
- Primary mobile target viewports: 360, 390, and 430 CSS pixels; then tablet and desktop.
- Target flows: Home -> Pix; Home -> Transfers; Home -> Cards; Home -> Activity; Settings -> change accent -> navigate -> refresh.
- No horizontal clipping, overlapping bottom navigation or inaccessible final action.
- Bottom navigation must maintain a visible active destination; landscape, keyboard-only and assistive technology interactions must remain usable.
- Preserve scroll position and focus semantics where feasible. Use native links/buttons and accurate labels.

## Theme implementation contract
- Canonical persisted storage key: `fluxo-appearance`, object `{theme, accent}`.
- Validate stored values against one consistent allowlist during initial render AND Settings hydration.
- CSS `data-fluxo-theme` and `data-fluxo-accent` on `html`; preserve `system` responsiveness.
- Shared semantic CSS tokens control interactive emphasis, gradients, surfaces, borders, text and focus rings.
- All seven accents must visibly affect a representative button and the home hero card. Do not mask controls under `!important` overrides.
- Accessibility: readable focus, descriptive labels, meaningful states, reduced-motion support; validate WCAG 2.2 AA contrast where appropriate.

## UX acceptance gates — no merge based on screenshots alone
1. Static source contract test passes (`node scripts/check-ux-contract.mjs`).
2. `npm run typecheck && npm test && npm run build` pass on the change branch.
3. Browser tests: each accent x each theme; Settings -> Home -> Cards/Pix/Transfers -> refresh; confirm restoration and visible difference.
4. Visual comparison at 360/390/430px against user-approved references; log screenshots, differences, and any deliberate exceptions.
5. Functional navigation and demo-only truthfulness; disabled controls have accurate feedback.
6. Merge/deploy only after review; independently inspect the **actual deployed SHA** and repeat smoke tests.

## Agent-assisted UI rules
- Research external skills like UI/UX Pro Max, Taste, Impeccable or DESIGN.md as references, never blindly install their scripts.
- No copied template takes priority over Fluxo's approved references, no new dependency without licensing/security review.
- Any proposed UI patch must identify: observed defect -> source cause -> code change -> test evidence -> before/after comparison.
- Do not state "fixed" or "deployed" without evidence.
