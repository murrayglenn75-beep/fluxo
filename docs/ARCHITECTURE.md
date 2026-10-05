# Fluxo architecture

## Authority chain
User → UI/API → PaymentIntent → capability/policy check → explicit approval → idempotent financial command → ProviderRouter → provider evidence → reconciliation → double-entry ledger → audit.

## Security invariants
- AI and MCP tools read or propose by default; they do not post ledger entries.
- Provider callbacks are evidence until verified and reconciled.
- Money is represented as integer minor units.
- Every retryable financial command has an idempotency key.
- Browser code never receives secret/service-role/provider credentials.
- Authenticated users may read their own ledger data; direct client ledger mutation is denied.
