# Fluxo user flows — mobile-first sandbox

Status: UX specification and acceptance criteria. All money movement is simulated.

## Flow 1: Enter demo and explore
Entry -> Welcome -> Enter demo -> Home dashboard -> Bottom navigation -> Any feature -> Back/Home.
- No Supabase sign-in required for demo.
- All features remain reachable, including Activity, Pix, Cards, Budgets, Goals, Open Finance and AI.
- A route must not unexpectedly redirect a demo user to login.
- Verify browser refresh and back navigation preserve demo access.

## Flow 2: Change appearance
Home -> Settings -> Appearance -> Select Dark or System -> Select Emerald/Blue/Purple/Red/Yellow/Pink/Black -> Immediate preview -> Navigate to Home/Pix/Cards -> Reload -> Selection persists.
- Dark always uses dark surfaces; System follows OS light/dark preference.
- Accent changes page background, surfaces, primary controls, navigation and hero card consistently.
- Semantic income/expense/error colours remain distinct.
- Old saved Light selection safely resolves to Dark.
- Verify every accent in both themes and both OS preferences for System.

## Flow 3: Sandbox Pix transfer
Home/Pix -> Choose recipient or enter demo key -> Enter amount -> Review recipient, amount and fee -> Confirm simulated transfer -> Success receipt -> Activity -> Transaction details -> Home.
- Validation and clear errors for invalid keys, amounts and insufficient sandbox balance.
- Never imply real money was transferred.
- Back/cancel does not duplicate a transaction; repeated confirmation is guarded.

## Flow 4: Review activity
Home -> Activity -> Filter/search -> Select transaction -> Details -> Return to same filtered list.
- Empty, loading and error states; no unexpected login.
- Balance privacy preference is respected.

## Flow 5: Manage virtual cards
Home -> Cards -> Select demo card -> View controls/details -> Change sandbox card setting -> Confirm -> Updated state -> Return.
- Hide sensitive details by default and make the simulation status clear.

## Flow 6: Budgets and goals
Home -> Budgets/Goals -> Create or edit -> Validate amount/target -> Save -> Progress updates -> Reopen/edit/delete with confirmation.
- Accessible feedback; never lose unsaved edits without warning.

## Flow 7: Open Finance demo
Home -> Open Finance -> Explain sandbox simulation -> Choose demo provider -> Grant simulated consent -> View imported demo data -> Revoke -> Confirm disconnected.
- No actual bank connection or credential collection.
- Empty sync is a no-change state, not an error.

## Flow 8: AI financial insights
Home -> AI -> Explain sandbox and limitations -> Ask about demo spending -> Read response -> Follow link to supporting transactions.
- No fabricated account activity, no real financial advice claims.
- Read-only access by default; tool actions independently authorized.

## Cross-cutting UX acceptance
- 360px, 390px, 768px and desktop; Android and iOS safe areas.
- Bottom navigation never covers last content or CTA; no horizontal page overflow.
- Clear Back/Home recovery path, touch targets at least 44px, keyboard focus, screen reader labels, reduced motion and contrast.
- Every user flow gets automated happy-path, failure-path and persistence tests plus mobile screenshots.
- Link failures to issues, PRs and regression tests; require release-gate evidence per docs/SDLC.md.
