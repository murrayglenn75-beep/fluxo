-- Authenticated sandbox evidence only. No real payment execution.
create table if not exists public.fluxo_sandbox_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Sandbox account',
 balance_minor bigint not null default 0 check (balance_minor >= 0),
 currency text not null default 'BRL' check (currency = 'BRL')
);
create table if not exists public.fluxo_sandbox_intents (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 account_user_id uuid not null references public.fluxo_sandbox_accounts(user_id) on delete cascade,
 command_id uuid not null,
 recipient text not null check (length(trim(recipient)) between 1 and 120),
 amount_minor bigint not null check (amount_minor between 1 and 100000000),
 status text not null default 'pending_review' check (status = 'pending_review'),
 created_at timestamptz not null default now(),
 unique (user_id, command_id),
 constraint same_owner check (user_id = account_user_id)
);
alter table public.fluxo_sandbox_accounts enable row level security;
alter table public.fluxo_sandbox_intents enable row level security;
revoke all on public.fluxo_sandbox_accounts from anon, authenticated;
revoke all on public.fluxo_sandbox_intents from anon, authenticated;
grant select, insert on public.fluxo_sandbox_accounts to authenticated;
grant select, insert on public.fluxo_sandbox_intents to authenticated;
drop policy if exists fluxo_sandbox_account_read on public.fluxo_sandbox_accounts;
create policy fluxo_sandbox_account_read on public.fluxo_sandbox_accounts
 for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists fluxo_sandbox_account_insert on public.fluxo_sandbox_accounts;
create policy fluxo_sandbox_account_insert on public.fluxo_sandbox_accounts
 for insert to authenticated with check (
 user_id = (select auth.uid()) and balance_minor = 0 and currency = 'BRL'
);
drop policy if exists fluxo_sandbox_intent_read on public.fluxo_sandbox_intents;
create policy fluxo_sandbox_intent_read on public.fluxo_sandbox_intents
 for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists fluxo_sandbox_intent_insert on public.fluxo_sandbox_intents;
create policy fluxo_sandbox_intent_insert on public.fluxo_sandbox_intents
 for insert to authenticated with check (
 user_id = (select auth.uid()) and account_user_id = (select auth.uid()) and status = 'pending_review'
);
-- Account creation is strictly an owner-bound zero-balance sandbox; no authenticated update or delete privileges.
-- Do not treat a pending intent as an approved or executed transfer.
