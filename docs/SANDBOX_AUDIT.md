# Sandbox verification — 2026-10-05

Scope: the local mobile sandbox and its Android/iOS project setup. Live integrations remain deferred by the owner.

## Verified

- TypeScript checks, production build and static native export succeed.
- 25 tests cover ledger balancing, approval validation, exact money parsing, duplicate commands, duplicate bills, corrupted storage, failed writes, fresh persisted balances, QR request validation, currency quote rounding, receipt expense recording, calendar dates, backup restoration and goal progress validation.
- Dependency audit reports zero known vulnerabilities.
- All 14 primary screen URLs plus health and manifest return HTTP 200.
- Browser checks cover opening saved receipts, income filtering, QR import with recipient key/amount, new card creation, empty card activity, persisted card selection/freeze and confirmed removal.
- Both native projects synchronize their local assets and App, Filesystem and Share plugins. The iOS privacy manifest remains included in the Xcode Resources phase.

## Issues fixed

- Home/activity transaction rows now open details.
- QR imports retain and validate the recipient key and timestamp.
- Newly added cards no longer show the sample card's purchases or statement.
- Corrupted saved data blocks mutations; export preserves the original raw backup, and a confirmed reset recovers the wallet.
- Payment references cannot be reused for different details; bill names are normalized before duplicate checks.
- Card creation and selection save in one mutation and report storage failures.
- Payment and add-card dialogs share keyboard focus and Escape handling.
- Currency previews parse localized amounts and round using integer arithmetic.
- GitHub CI now checks the static native export as well as the production build.

## Boundaries

Android/iOS binaries and device behavior have not been verified: the required Android toolchain and macOS/Xcode are unavailable in this workspace. Export/plugin synchronization is not a substitute for device testing.

Real payments, card issuance, server account synchronization, live bank consent, receipt OCR and external AI are not implemented or verified. Exchange previews, category allocations, goals' initial progress and initial transactions are illustrative. Scan selects a local file without extracting it. Optional Supabase authentication is unconfigured and untested.

The local wallet is a single-device sandbox, not a secure shared ledger. Updates refresh persisted state before applying commands, but simultaneous writes in separate browser tabs do not have a server transaction lock.

## Added local features

Editable savings goals, confirmed goal deletion, manually recorded receipt expenses, confirmed expense deletion, recorded expense budget totals, validated backup restoration and a dedicated card statement are implemented. Goal progress and recorded historical expenses do not move money or change the wallet balance. Browser verification covers goal creation/progress persistence/deletion and expense recording/persistence/deletion. Backup parsing and restoration are verified with regression tests; operating system file-picker behavior still needs device testing.

A manual native build workflow is included for Android debug and unsigned iOS simulator packages. Its run results establish native compilation separately from export synchronization. Physical-device testing and distribution signing remain pending.
