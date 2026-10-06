create extension if not exists pgcrypto;

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  currency text not null check (currency in ('BRL','USD','EUR','GBP')),
  created_at timestamptz not null default now()
);

create table public.payment_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  permissions text[] not null default '{}',
  payload_hash text not null,
  status text not null check (status in ('pending','authorised','revoked','expired')),
  token_reference text,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_id uuid references public.payment_consents(id),
  idempotency_key text not null,
  request_fingerprint text not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'BRL' check (currency in ('BRL','USD','EUR','GBP')),
  recipient jsonb not null,
  status text not null check (status in ('draft','awaiting_approval','approved','submitted','settled','failed','cancelled')),
  created_at timestamptz not null default now(),
  unique(user_id,idempotency_key)
);

create table public.provider_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_intent_id uuid not null references public.payment_intents(id) on delete cascade,
  provider text not null,
  provider_request_id text not null,
  response_jws text,
  evidence_hash text not null,
  raw_status text not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  command_id uuid not null,
  account_id uuid not null references public.accounts(id),
  amount_minor bigint not null,
  currency text not null check (currency in ('BRL','USD','EUR','GBP')),
  created_at timestamptz not null default now()
);

create index accounts_user_idx on public.accounts(user_id);
create index intents_user_idx on public.payment_intents(user_id,created_at desc);
create index evidence_intent_idx on public.provider_evidence(payment_intent_id);
create index ledger_user_created_idx on public.ledger_entries(user_id,created_at desc);
create index ledger_command_idx on public.ledger_entries(command_id);

alter table public.accounts enable row level security;
alter table public.payment_consents enable row level security;
alter table public.payment_intents enable row level security;
alter table public.provider_evidence enable row level security;
alter table public.ledger_entries enable row level security;

create policy "accounts_select_own" on public.accounts for select to authenticated using ((select auth.uid())=user_id);
create policy "accounts_insert_own" on public.accounts for insert to authenticated with check ((select auth.uid())=user_id);
create policy "accounts_update_own" on public.accounts for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "accounts_delete_own" on public.accounts for delete to authenticated using ((select auth.uid())=user_id);

create policy "consents_select_own" on public.payment_consents for select to authenticated using ((select auth.uid())=user_id);
create policy "intents_select_own" on public.payment_intents for select to authenticated using ((select auth.uid())=user_id);
create policy "evidence_select_own" on public.provider_evidence for select to authenticated using ((select auth.uid())=user_id);
create policy "ledger_select_own" on public.ledger_entries for select to authenticated using ((select auth.uid())=user_id);

revoke insert,update,delete on public.payment_consents from anon,authenticated;
revoke insert,update,delete on public.payment_intents from anon,authenticated;
revoke insert,update,delete on public.provider_evidence from anon,authenticated;
revoke insert,update,delete on public.ledger_entries from anon,authenticated;
