-- Fluxo v2 hardening. Apply after the v2 financial authority migration.
-- Existing cross-owner rows must be remediated before applying these constraints.

-- Disallow direct browser writes to authoritative account records.
revoke insert, update, delete on public.accounts from anon, authenticated;
drop policy if exists "accounts_insert_own" on public.accounts;
drop policy if exists "accounts_update_own" on public.accounts;
drop policy if exists "accounts_delete_own" on public.accounts;

-- Ensure consent and provider evidence cannot point across ownership boundaries.
alter table public.payment_consents
  add constraint payment_consents_id_user_id_key unique (id, user_id);
alter table public.payment_intents
  drop constraint if exists payment_intents_consent_id_fkey;
alter table public.payment_intents
  add constraint payment_intents_consent_owner_fkey
  foreign key (consent_id, user_id) references public.payment_consents(id, user_id);
alter table public.provider_evidence
  drop constraint if exists provider_evidence_payment_intent_id_fkey;
alter table public.provider_evidence
  add constraint provider_evidence_payment_intent_owner_fkey
  foreign key (payment_intent_id, user_id) references public.payment_intents(id, user_id);

-- Minimize API exposure: no anonymous table privileges.
revoke all on public.accounts, public.payment_consents, public.payment_intents,
  public.provider_evidence, public.ledger_entries,
  public.financial_commands, public.financial_approvals from anon;
-- Remove schema-wide/default inherited privileges if configured separately.
-- Authenticated users can only read their own rows under RLS.
revoke all on public.accounts, public.payment_consents, public.payment_intents,
  public.provider_evidence, public.ledger_entries,
  public.financial_commands, public.financial_approvals from authenticated;
grant select on public.accounts, public.payment_consents, public.payment_intents,
  public.provider_evidence, public.ledger_entries,
  public.financial_commands, public.financial_approvals to authenticated;

-- Prevent bypass through accidentally added table policies.
alter table public.accounts enable row level security;
alter table public.payment_consents enable row level security;
alter table public.payment_intents enable row level security;
alter table public.provider_evidence enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.financial_commands enable row level security;
alter table public.financial_approvals enable row level security;

-- Approval consumption and command transitions must be performed in a
-- single server-side transaction after verifying actor, intent hash,
-- approval expiry, state and idempotency. This migration deliberately
-- does not expose a SECURITY DEFINER executor or RPC.
