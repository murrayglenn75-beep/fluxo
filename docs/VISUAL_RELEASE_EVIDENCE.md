# Fluxo visual release evidence checklist

This optional artifact-validating pilot does **not** run Stageshow, a browser, or UI tests. It only checks that a release report declares the required evidence and human approval. Run `node --test scripts/test-visual-evidence.mjs`.

For every dark/system mode and green/blue/pink/black accent, capture an actual full-screen screenshot, verify color contrast and readability, and record device/browser details. Check demo-access, navigation, and notifications with reproducible routes and real observed outcomes. Additional responsive/breakpoint, focus, reduced-motion and theme-persistence checks are required before production approval.

Review demo videos produced with Stageshow independently from real Fluxo screenshot evidence; visual presentation is not proof of functioning navigation, correct state or backend authorization. Never mark a check passed using invented evidence. 
