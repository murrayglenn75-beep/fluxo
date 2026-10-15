# Fluxo visual design system — v1

## Art direction
Fluxo uses a **cover/interior** contrast. Splash and onboarding are the vibrant cover: emerald gradients, luminous card art, and the logo as the hero. Authenticated banking screens are the sober interior: dark forest/ink surroundings, restrained gradients, and readable content surfaces. Preserve the existing layout, navigation, and information architecture.

## Design tokens (initial contract)
| Token | Value | Purpose |
| --- | --- | --- |
| `--fluxo-cover-start` | `#008b65` | Onboarding gradient |
| `--fluxo-cover-end` | `#41e2b1` | Onboarding highlight |
| `--fluxo-interior-ink` | `#081f22` | Dark authenticated canvas |
| `--fluxo-interior-forest` | `#123b37` | Interior gradient |
| `--fluxo-action` | `#008a65` | Primary actions |
| `--fluxo-focus` | `#53c4a5` | Keyboard focus |
| `--fluxo-content-surface` | `#ffffff` | High-contrast light panels |

Do not use saturated green as the background for long-form transaction details. Keep positive/negative values distinguishable through labels and signs, not colour alone.

## Component behavior contract
| Component | States | Expected behavior |
| --- | --- | --- |
| Fluxo logo | default | Accessible brand text, consistent proportions; no action unless linked |
| Navigation | default, active, keyboard-focus | Current destination visibly indicated; focus outline visible; mobile targets >= 44px |
| Balance card | visible, concealed, loading | Hide all monetary details when concealed; prevent layout jump |
| Payment/transfer action | idle, validating, awaiting approval, processing, success, error | Disable duplicate submission; never imply a real payment in sandbox |
| Transaction row | default, focused, selected | Opens details by pointer or Enter/Space; transaction amount remains readable |
| Financial chart | loading, empty, data, error | Include text summary; don't rely on hue to communicate values |
| Dialog | open, processing, error, closed | Trap focus while open, restore focus on close, clear error text |
| Form field | default, focused, invalid, disabled | Persistent label, inline error, semantic autocomplete where appropriate |
| AI insight | loading, ready, error, approval required | Explain reasoning; cannot execute financial commands without server authority |

## Implementation rules
1. Keep the established desktop UI and login styling intact.
2. On narrow screens, darken the **canvas behind** internal content, not the readable content panels.
3. Splash/onboarding can use richer emerald gradients than the authenticated app.
4. Validate WCAG AA text contrast, keyboard navigation, 200% zoom, and reduced-motion.
5. Use one shared component for each repeated pattern and document all new variants before adding them.
6. Keep screenshot baselines for onboarding, home, payment, activity, and error states.
7. Changes to financial behavior require security tests; CSS changes must not alter transaction semantics.

## Current scope
This document is the initial component contract, not a claim that every behavior above is already implemented or accessibility-audited. The mobile interior-canvas treatment is a conservative first iteration and should be visually reviewed on device.
