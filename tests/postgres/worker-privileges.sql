-- Disposable PostgreSQL permission probes, never run on live Supabase.
-- Run after fixture.sql, before real-adapter.mjs.
select 'create role fluxo_worker nologin' where not exists (select 1 from pg_roles where rolname='fluxo_worker') \gexec
grant usage on schema public to fluxo_worker;
grant select on public.financial_commands,public.financial_approvals,public.payment_intents to fluxo_worker;
grant update(status) on public.financial_commands to fluxo_worker;
grant update(consumed_at) on public.financial_approvals to fluxo_worker;
grant select,insert on public.financial_command_outbox to fluxo_worker;
grant update(status,attempts,lease_expires_at,updated_at) on public.financial_command_outbox to fluxo_worker;
grant insert on public.financial_provider_evidence,public.financial_provider_event_receipts to fluxo_worker;
-- No DELETE, no changes to command ownership, payment intent, or evidence.
select 1/(case when not has_table_privilege('anon','public.financial_command_outbox','INSERT') then 1 else 0 end);
select 1/(case when not has_table_privilege('authenticated','public.financial_provider_evidence','SELECT') then 1 else 0 end);
select 1/(case when not has_table_privilege('fluxo_worker','public.financial_provider_evidence','DELETE') then 1 else 0 end);
select 1/(case when not has_column_privilege('fluxo_worker','public.financial_commands','user_id','UPDATE') then 1 else 0 end);
select 1/(case when has_table_privilege('fluxo_worker','public.financial_provider_event_receipts','INSERT') then 1 else 0 end);
