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

-- Append-only reconciliation evidence ledger. Design draft; not deployed.
create table public.financial_provider_evidence (
  id uuid primary key default gen_random_uuid(),
  command_id uuid not null,
  user_id uuid not null,
  provider_operation_id text not null,
  evidence_kind text not null check (evidence_kind in ('settled','rejected','pending','not_found','unavailable')),
  decision text not null check (decision in ('settled','failed','reconcile')),
  evidence_digest text not null check (length(evidence_digest)=64),
  authenticated_source text not null check (length(authenticated_source)>0),
  observed_at timestamptz not null default clock_timestamp(),
  foreign key (command_id,user_id) references public.financial_commands(id,user_id)
);
create index financial_provider_evidence_command_idx on public.financial_provider_evidence(command_id,observed_at);
alter table public.financial_provider_evidence enable row level security;
revoke all on public.financial_provider_evidence from public,anon,authenticated;
-- Insert-only access for a dedicated trusted worker is still to be configured.
-- No evidence should be accepted from a browser or unverified webhook.
