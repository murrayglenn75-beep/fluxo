-- Fluxo v2 — financial authority boundary
-- Browser/AI clients may observe their own financial records.
-- Creation and mutation of financial truth remains server-authoritative.

-- ---------------------------------------------------------------------------
-- Expanded deterministic currency support
-- ---------------------------------------------------------------------------

alter table public.accounts
  drop constraint accounts_currency_check;

alter table public.accounts
  add constraint accounts_currency_check
  check (currency in ('BRL','USD','EUR','GBP','CAD','AUD','JPY','CHF','CNY'));

alter table public.payment_intents
  drop constraint payment_intents_currency_check;

alter table public.payment_intents
  add constraint payment_intents_currency_check
  check (currency in ('BRL','USD','EUR','GBP','CAD','AUD','JPY','CHF','CNY'));

alter table public.ledger_entries
  drop constraint ledger_entries_currency_check;

alter table public.ledger_entries
  add constraint ledger_entries_currency_check
  check (currency in ('BRL','USD','EUR','GBP','CAD','AUD','JPY','CHF','CNY'));

-- ---------------------------------------------------------------------------
-- Durable financial commands
-- ---------------------------------------------------------------------------

create table public.financial_commands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_intent_id uuid references public.payment_intents(id),
  idempotency_key text not null,
  intent_hash text not null,
  command_type text not null
    check (command_type in ('payment','transfer','exchange')),
  status text not null default 'pending'
    check (status in (
      'pending',
      'approved',
      'executing',
      'executed',
      'failed',
      'cancelled'
    )),
  created_at timestamptz not null default now(),
  executed_at timestamptz,
  unique (user_id,idempotency_key),
  unique (id,user_id)
);

create index financial_commands_user_created_idx
  on public.financial_commands(user_id,created_at desc);

create index financial_commands_intent_idx
  on public.financial_commands(payment_intent_id);

-- ---------------------------------------------------------------------------
-- Cryptographically-bound approvals
-- ---------------------------------------------------------------------------

create table public.financial_approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  command_id uuid not null,
  intent_hash text not null,
  approved_by uuid not null references auth.users(id),
  approved_at timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),

  constraint financial_approvals_expiry_check
    check (expires_at > approved_at),

  unique (command_id),

  constraint financial_approvals_command_owner_fkey
    foreign key (command_id,user_id)
    references public.financial_commands(id,user_id),

  constraint financial_approvals_approver_owner_check
    check (approved_by = user_id)
);

create index financial_approvals_user_idx
  on public.financial_approvals(user_id);

-- ---------------------------------------------------------------------------
-- Bind ledger mutations to durable commands
-- ---------------------------------------------------------------------------

alter table public.ledger_entries
  add constraint ledger_entries_command_id_fkey
  foreign key (command_id)
  references public.financial_commands(id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.financial_commands enable row level security;
alter table public.financial_approvals enable row level security;

create policy "financial_commands_select_own"
  on public.financial_commands
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "financial_approvals_select_own"
  on public.financial_approvals
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Financial authority is intentionally unavailable to browser clients.
revoke insert,update,delete
  on public.financial_commands
  from anon,authenticated;

revoke insert,update,delete
  on public.financial_approvals
  from anon,authenticated;

-- Explicit read grants; RLS still determines which rows are visible.
grant select
  on public.financial_commands
  to authenticated;

grant select
  on public.financial_approvals
  to authenticated;

-- Keep existing sensitive tables client read-only.
revoke insert,update,delete
  on public.payment_consents
  from anon,authenticated;

revoke insert,update,delete
  on public.payment_intents
  from anon,authenticated;

revoke insert,update,delete
  on public.provider_evidence
  from anon,authenticated;

revoke insert,update,delete
  on public.ledger_entries
  from anon,authenticated;
