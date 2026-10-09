-- Disposable PostgreSQL permission probes, never run on live Supabase.
-- Run after fixture.sql, before real-adapter.mjs.
select 'create role fluxo_worker nologin' where not exists (select 1 from pg_roles where rolname='fluxo_worker') \gexec
grant usage on schema public to fluxo_worker;
grant select on public.financial_commands,public.financial_approvals,public.payment_intents to fluxo_worker;
-- A read-only SHARE lock protects intent verification without granting intent UPDATE.
select 1/(case when not has_table_privilege('fluxo_worker','public.payment_intents','UPDATE') then 1 else 0 end);
grant update(status) on public.financial_commands to fluxo_worker;
grant update(consumed_at) on public.financial_approvals to fluxo_worker;
grant select,insert on public.financial_command_outbox to fluxo_worker;
grant update(status,attempts,lease_expires_at,updated_at) on public.financial_command_outbox to fluxo_worker;
grant insert on public.financial_provider_evidence,public.financial_provider_event_receipts to fluxo_worker;
-- ON CONFLICT replay fencing reads the unique provider identity and RETURNING id.
-- Grant only these columns; do not expose other receipt fields.
grant select(id,provider_name,provider_event_id) on public.financial_provider_event_receipts to fluxo_worker;
-- Dedicated worker-only policies; browser roles do not inherit this role.
create policy fluxo_worker_commands_select on public.financial_commands for select to fluxo_worker using (true);
create policy fluxo_worker_commands_update on public.financial_commands for update to fluxo_worker using (true) with check (true);
create policy fluxo_worker_approvals_select on public.financial_approvals for select to fluxo_worker using (true);
create policy fluxo_worker_approvals_update on public.financial_approvals for update to fluxo_worker using (true) with check (true);
create policy fluxo_worker_outbox_select on public.financial_command_outbox for select to fluxo_worker using (true);
create policy fluxo_worker_outbox_insert on public.financial_command_outbox for insert to fluxo_worker with check (true);
create policy fluxo_worker_outbox_update on public.financial_command_outbox for update to fluxo_worker using (true) with check (true);
create policy fluxo_worker_evidence_insert on public.financial_provider_evidence for insert to fluxo_worker with check (true);
create policy fluxo_worker_receipts_insert on public.financial_provider_event_receipts for insert to fluxo_worker with check (true);
create policy fluxo_worker_receipts_select on public.financial_provider_event_receipts for select to fluxo_worker using (true);
-- No DELETE, no changes to command ownership, payment intent, or evidence.
select 1/(case when not has_table_privilege('anon','public.financial_command_outbox','INSERT') then 1 else 0 end);
select 1/(case when not has_table_privilege('authenticated','public.financial_provider_evidence','SELECT') then 1 else 0 end);
select 1/(case when not has_table_privilege('fluxo_worker','public.financial_provider_evidence','DELETE') then 1 else 0 end);
select 1/(case when not has_column_privilege('fluxo_worker','public.financial_commands','user_id','UPDATE') then 1 else 0 end);
select 1/(case when has_table_privilege('fluxo_worker','public.financial_provider_event_receipts','INSERT') then 1 else 0 end);

-- Exercise the actual SQL role, not only has_*_privilege metadata.
-- Worker-only RLS policies are now exercised under SET ROLE.
set role fluxo_worker;
select 1/(case when (select count(*) from public.financial_commands)=2 then 1 else 0 end);
select 1/(case when (select count(*) from public.financial_command_outbox)=0 then 1 else 0 end);
reset role;
-- Dedicated worker policies must be added and reviewed before the adapter
-- can execute under fluxo_worker. Never grant BYPASSRLS to make tests pass.
