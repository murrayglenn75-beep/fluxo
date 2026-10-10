# Fluxo v2 UI and security validation

Work completed on `security/v2-authority-hardening`, following `docs/codex-handoff/{README,TASK,DESIGN,RELEASE_GATES}.md`. PR #5 was observed as Draft on its public GitHub page. No merge, production deployment, production database access, or production migration was performed.

## Implemented behavior

- One midnight-teal theme at 375, 390, 430 and desktop widths, retaining the centered mobile app frame. Shared tokens and explicit `foundation` / `presentation` CSS layers replace the accumulated mobile `body:has(...)` overrides and `!important` rules. Component geometry remains separate from the theme; dialogs define their own light token palette.
- Emerald home card, Receive/Send actions, AI Insights and an explicitly illustrative balance chart. Home Receive opens the receiving view rather than the Send form.
- Consistent cards, payments, bills, activity, exchange, goals, budgets, bank connections, imports and profile forms. Authentication stays dark at every breakpoint. Native select options, buttons, alerts and light modal text are readable.
- Pill navigation on every interior screen; one safe-area-aware scroll-clearance rule. Activity search remains available and the footer is reachable above navigation.
- Savings questions recognize normal words such as “save”, “saving”, “savings” and “set aside”, and return a conservative balance-based estimate distinct from spending answers. It reserves unpaid demo bills and a 10% buffer, floors savings at zero, and does not move money or project weekly income.
- Pix Receive shares a sandbox key; QR Code creates or imports an amount-bearing demo request. Imported requests only prefill the Send form for review.
- Dialogs and the More menu isolate background controls with `inert`, lock background scrolling, trap keyboard focus, close with Escape and restore the opening control. Long goal labels and large amounts wrap instead of widening the page. Inputs use 16px text to avoid focus zoom on mobile Safari.
- Actual authority-migration checks added to PostgreSQL CI, separate from the existing command/outbox fixture. Financial migrations, authority adapters, RLS rules and grants remain unchanged.

## Validation results

| Check | Outcome |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm test` | 173 passed across 30 files; no skipped or failed tests |
| `npm run build` | Passed; 26 generated routes including authentication |
| `npm run build:native` | Passed static export; native Android/iOS compilation and device testing not performed |
| Browser visual/accessibility runner | 21 routes × 4 widths = 84 checks; no horizontal overflow or automated WCAG 2 A/AA / 2.1 AA violations |
| Browser interaction runner | 18 checks covering home Receive, AI, Pix request/review/approval, insufficient funds, cards, focus handling, exchange, goals, budgets, consent revocation, expenses, statements, profile, export, privacy, reset, intro and footer clearance; no page errors |
| Browser stress runner | 15 route/width checks plus 3 short-viewport modal checks; 60-character names, 100-character keys/transaction labels, large safe-integer balances and a 500px viewport |
| PostgreSQL `fixture.sql`, `integrity.sql`, `worker-privileges.sql` | Passed in isolated PostgreSQL 16 |
| Independent PostgreSQL connections | Expected competing-row lock timeout verified; row accessible after holder committed |
| `node tests/postgres/real-adapter.mjs` | Passed actual TypeScript adapter checks with test-only `pg@8.16.3` and `typescript@5.9.3`: one winner among 12 claims, consumed approval, one outbox entry, owner/key/hash conflicts, concurrent leases, crash/timeout recovery, uncertain outcomes, evidence matching and replay rejection |
| Actual migrations on clean and populated databases | Both passed: preserved seeded rows, owner-scoped reads, denied client writes and anonymous reads, cross-owner FK/approver rejection, owner-scoped idempotency |
| `git diff --check` and changed formatted-file checks | Passed |
| Lint | No repository lint script/configured lint workflow exists; not claimed as executed |

Browser runs used Chromium 151 and Playwright 1.58.2. Automated accessibility checks supplement human and device review; they do not establish pixel-perfect matching or universal accessibility. The original reference images were absent from the handoff. The written design specification and actual rendered screenshots were used for visual review.

The existing native export warns that API routes/middleware are unavailable in a static export. This is a pre-existing platform boundary; static build success does not validate live authentication or server-authoritative native behavior.

## Reproduce browser checks

Run the app from the existing isolated checkout; do not create a worktree for environment setup. The optional QA tools can be installed outside the repository, keeping its manifests and lockfile unchanged:

```sh
cd /workspace/fluxo
npm install --prefix /tmp/fluxo-browser --cache /workspace/.npm-cache --no-audit --no-fund playwright@1.58.2 @axe-core/playwright@4.11.1
# After npm run build, start in another managed terminal:
npm run start -- --hostname 127.0.0.1 --port 3012
# Run in a separate terminal:
export NODE_PATH=/tmp/fluxo-browser/node_modules
export FLUXO_QA_URL=http://127.0.0.1:3012
export FLUXO_QA_OUTPUT=/workspace/fluxo-qa
node tests/browser/visual.cjs
node tests/browser/interactions.cjs
node tests/browser/stress.cjs
```

`FLUXO_CHROMIUM` can override `/usr/bin/chromium`. Screenshots and JSON results are written under `FLUXO_QA_OUTPUT`; they are generated artifacts, not checked-in source. The visual runner fails on overflow or automated accessibility violations. Interaction/stress runners fail on broken behavior. All use fresh browser contexts with disposable demo storage.

## Reproduce database checks

Use PostgreSQL 16 in a disposable service and the connection variables from `.github/workflows/postgres-integration.yml`. Never point these checks at Supabase or a retained/live database.

```sh
psql -X -v ON_ERROR_STOP=1 -f tests/postgres/fixture.sql
psql -X -v ON_ERROR_STOP=1 -f tests/postgres/integrity.sql
psql -X -v ON_ERROR_STOP=1 -f tests/postgres/worker-privileges.sql
createdb fluxo_qa_authority_clean
createdb fluxo_qa_authority_populated
psql -X -v ON_ERROR_STOP=1 -v populated=false -d fluxo_qa_authority_clean -f tests/postgres/authority-migrations.sql
psql -X -v ON_ERROR_STOP=1 -v populated=true -d fluxo_qa_authority_populated -f tests/postgres/authority-migrations.sql
```

The authority test refuses databases outside `fluxo_qa_authority_*`. It applies the actual migration chain, seeding before or after hardening as selected, and exercises RLS/grants/references. Populated validation covers internally consistent seeded data; it does not establish that a live database has no rows requiring remediation. The isolated command/outbox fixture intentionally exercises the design-draft SQL without deploying it.

For the real adapter, CI installs the test-only driver/compiler. In this environment, the runner was copied unchanged to `/tmp/fluxo-browser/real-adapter.mjs`, alongside isolated `pg@8.16.3` and `typescript@5.9.3`, then executed from `/workspace/fluxo` with `PGHOST=127.0.0.1 PGPORT=55432 PGUSER=postgres PGDATABASE=fluxo_test`. This supplies the compiler's transpile API without replacing the repository's TypeScript 7 dependency. Migration/privilege checks used `docker exec ... psql -X -v ON_ERROR_STOP=1` against the disposable container. The workflow's independent lock-holder/contender commands were also executed and their expected failure checked.

## External release gates still pending

- Current Vercel previews were located in PR #5, but HTTP requests were denied by the environment's network proxy. No preview rendering or live auth behavior is claimed:
  - https://fluxo-git-security-v2-autho-08eac5-murrayglenn75-9604s-projects.vercel.app
  - https://fluxo-fintech-git-security-4c1387-murrayglenn75-9604s-projects.vercel.app
- GitHub API access was also denied. The draft environment allowlist now contains `api.github.com` and those two exact preview hosts, preserving package-manager presets. Review/save those settings and publish the **cloud environment** to activate the saved configuration; this does not deploy Fluxo to production. Retry external checks after access changes. Additional Vercel preview protection may still require project access.
- Auth end-to-end (signup/confirmation/login/recovery/expiry/logout) needs a configured test Supabase project. Public configuration variables are absent in this machine; UI/error states and existing auth unit tests passed. No credentials are requested in chat.
- Final remote CI, visual comparison to the original references, native/device behavior, human SQL/authority review, and production-project ownership/rollback checks remain release gates. Local tests and preview status alone do not mark the release ready.

Keep PR #5 Draft. Production promotion and migrations remain outside this task.
