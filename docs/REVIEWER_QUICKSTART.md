# Reviewer quick start — Fluxo

**Purpose:** Evaluate product-engineering quality and safe financial workflow design **inside a sandbox**, not as a production banking service.

## Run locally

Follow the repository [README](../README.md) for environment requirements. From the project root:

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run dev -- --port 3010
```

See [sandbox audit](SANDBOX_AUDIT.md) for the documented verification boundary.

## Inspect first

- Integer-based money representation and validation of invalid amounts.
- Idempotent commands and prevention of duplicate sandbox financial effects.
- Review/approval transitions and handling of conflicting commands.
- Supabase authorization assumptions and the distinction between client-side demos and authoritative server operations.
- UI flows on mobile-sized screens and any Vercel deployment linked from the repository.

## Explicit limits

**Fluxo is a fintech sandbox.** It does not settle real Pix payments, issue actual cards, access production Open Finance providers, move real funds, or claim banking regulatory approval. A build passing locally does not prove live integrations or complete financial authorization hardening.

## Suggested reviewer questions

1. Can a replayed command change the simulated balance twice?
2. Which state transitions are authoritative and which are only UI/demo state?
3. How are owner-scoped references and server-only writes enforced?
4. Which deployment environment and provider dependencies have been independently validated?
