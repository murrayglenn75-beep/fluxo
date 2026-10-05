# Fluxo

Mobile fintech sandbox styled from the supplied Fluxo reference. Phone layout with bottom navigation and a centered 430px preview on larger screens. Android and iOS Capacitor projects are included.

## Run locally

```sh
npm ci
npm run dev -- --port 3010
```

Open http://localhost:3010. No credentials are required for the sandbox.

## Sandbox features

- Add demo cards, create virtual cards, select, freeze/unfreeze, rename, change limits, remove cards, and export statements.
- Pix and transfers have explicit review/approval, integer money amounts, balance validation, duplicate protection, saved recipients, and downloadable/shareable receipts.
- Generate scannable Fluxo demo request QR codes, copy/import request codes, and retain request history. These are sandbox requests, not bank Pix QR codes.
- Account onboarding, profile settings, balance privacy, editable budgets, editable goals with tracked savings, bill payments, demo bank connections, and local assistant summaries.
- Record receipt expenses with merchant, amount, date and category. They appear in Activity and budget totals without changing the wallet balance. Confirmed deletion removes mistaken records. Receipt contents remain on the device and OCR is not performed.
- Restore a validated JSON account backup after reviewing and confirming replacement of the local account.
- Card Activity's View all opens a statement with CSV export.
- Home shortcuts include Exchange and Open Finance. Activity rows open transaction details.
- Data survives reloads and navigation in device/browser storage. Account settings provide export and a confirmed reset. Browser data and installed app data are separate.
- Native receipt sharing uses the operating system share sheet. Android Back closes dialogs or returns to the previous page.

Initial balances, purchases, budgets, and conversion rates are illustrative. Exchange is a quote preview; receipt details are entered manually without extracting file contents. Goal savings track progress without transferring money. The assistant computes local sandbox summaries. No real payments, issued cards, bank connections, or external AI requests occur.

## Verify

```sh
npm run typecheck
npm test
npm run build
npm run sync:native
```

Tests cover ledger integrity, exact currency parsing, balance checks, duplicate commands and duplicate bill payments. sync:native builds a static export into out/ and copies it into both native projects with installed plugins.

See [the sandbox audit](docs/SANDBOX_AUDIT.md) for verified flows, regression checks and remaining integration/device limits.

## Android and iOS

```sh
npm run sync:native
npm run open:android
# On macOS:
npm run open:ios
```

Android requires Android Studio, JDK 21 and Android SDK 36. iOS requires macOS and Xcode. Projects use the provisional identifier app.fluxo.mobile; choose your own identifier and signing configuration before distribution. Icons and an iOS filesystem privacy manifest are included. No APK or IPA has been compiled in this Windows workspace.

See the [Capacitor development workflow](https://capacitorjs.com/docs/basics/workflow) for device builds and signing. Sync native files after UI changes. The native build contains local assets and does not point at localhost.

The manual **Native test builds** GitHub Actions workflow builds an Android debug APK and an unsigned iOS simulator app. Successful runs publish downloadable artifacts for 14 days. The simulator app is for Xcode's simulator; installing on a physical iPhone still requires Apple signing. These test packages are not store releases.

## Optional live foundation

The original ledger, sandbox provider boundary, and Supabase migration are preserved. Optional Supabase email authentication appears in Account settings when NEXT_PUBLIC_SUPABASE_URL and a public key are configured. It is not configured or verified in this sandbox. Keep service-role keys and provider credentials on a trusted backend.

Live payments/card issuance, bank consent, server persistence, receipt extraction and external AI need service accounts and backend implementation. The local demo account is independent of optional sign-in. Those integrations are deferred until accounts are available.
