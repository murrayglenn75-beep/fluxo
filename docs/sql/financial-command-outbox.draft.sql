-- DESIGN DRAFT ONLY. Not a Supabase migration; do not apply to live database.
-- Generate a proper migration with the Supabase CLI after local database testing.
create table public.financial_command_outbox (
  id uuid primary key default gen_random_uuid(),
  command_id uuid not null,
  user_id uuid not null,
  intent_hash text not null,
  idempotency_key text not null,
  status text not null default 'pending'
    check (status in ('pending','leased','acknowledged','reconcile','failed')),
  attempts integer not null default 0 check (attempts >= 0),
  lease_expires_at timestamptz,
  constraint outbox_lease_consistency check ((status='leased') = (lease_expires_at is not null)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (command_id),
  unique (user_id,idempotency_key),
  foreign key (command_id,user_id)
    references public.financial_commands(id,user_id)
);
alter table public.financial_command_outbox enable row level security;
revoke all on public.financial_command_outbox from public,anon,authenticated;
-- No browser read/write grants or RPCs. Trusted worker access must be reviewed.
-- Worker lease/reconciliation state machine is NOT implemented by this draft.
