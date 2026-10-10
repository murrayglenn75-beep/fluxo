-- Disposable-database validation of the actual migrations, not the outbox fixture.
-- Invoke with psql -X -v ON_ERROR_STOP=1 -v populated=true|false -f this file.
do $$ begin
 if current_database() not like 'fluxo_qa_authority_%' then
  raise exception 'Refusing to run outside a disposable fluxo_qa_authority_* database';
 end if;
end $$;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as
 $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to authenticated;
\ir ../../supabase/migrations/20261005165041_fluxo_core.sql
\ir ../../supabase/migrations/20261005165100_fluxo_fk_indexes.sql
\ir ../../supabase/migrations/20261006023034_v2_financial_authority.sql
\if :populated
\ir authority-seed.sql
\endif
\ir ../../supabase/migrations/20261009000000_v2_authority_hardening.sql
\if :populated
\else
\ir authority-seed.sql
\endif

-- Valid existing rows survive the new owner-bound constraints.
do $$ begin
 if (select count(*) from public.accounts) <> 2
 or (select count(*) from public.payment_consents) <> 2
 or (select count(*) from public.payment_intents) <> 2
 or (select count(*) from public.provider_evidence) <> 2
 or (select count(*) from public.financial_commands) <> 2
 or (select count(*) from public.financial_approvals) <> 2
 or (select count(*) from public.ledger_entries) <> 2 then
  raise exception 'Seed rows lost or duplicated';
 end if;
 -- Same key across owners is allowed; replay within an owner is denied.
 begin
  insert into public.financial_commands(user_id,idempotency_key,intent_hash,command_type)
   values ('00000000-0000-4000-8000-000000000001','shared-key','hash-a','payment');
  raise exception 'Owner idempotency bypass';
 exception when unique_violation then null;
 end;
 -- Test references as admin so RLS/grants cannot mask a missing constraint.
 begin
  update public.payment_intents set consent_id='30000000-0000-4000-8000-000000000002'
   where id='40000000-0000-4000-8000-000000000001';
  raise exception 'Cross-owner consent accepted';
 exception when foreign_key_violation then null;
 end;
 begin
  update public.provider_evidence set payment_intent_id='40000000-0000-4000-8000-000000000002'
   where id='50000000-0000-4000-8000-000000000001';
  raise exception 'Cross-owner evidence accepted';
 exception when foreign_key_violation then null;
 end;
 begin
  update public.financial_commands set payment_intent_id='40000000-0000-4000-8000-000000000002'
   where id='60000000-0000-4000-8000-000000000001';
  raise exception 'Cross-owner command accepted';
 exception when foreign_key_violation then null;
 end;
 begin
  update public.ledger_entries set account_id='20000000-0000-4000-8000-000000000002'
   where id='80000000-0000-4000-8000-000000000001';
  raise exception 'Cross-owner ledger accepted';
 exception when foreign_key_violation then null;
 end;
 begin
  update public.financial_approvals set approved_by='00000000-0000-4000-8000-000000000002'
   where id='70000000-0000-4000-8000-000000000001';
  raise exception 'Cross-owner approver accepted';
 exception when check_violation then null;
 end;
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
do $$ declare t text; n integer; begin
 foreach t in array array['accounts','payment_consents','payment_intents','provider_evidence','ledger_entries','financial_commands','financial_approvals'] loop
  execute format('select count(*) from public.%I',t) into n;
  if n<>1 then raise exception 'Owner RLS failed for %: % rows',t,n; end if;
  begin
   execute format('update public.%I set user_id=user_id',t);
   raise exception 'Client update allowed for %',t;
  exception when insufficient_privilege then null;
  end;
  begin
   execute format('delete from public.%I',t);
   raise exception 'Client delete allowed for %',t;
  exception when insufficient_privilege then null;
  end;
  if has_table_privilege(current_user,'public.'||t,'INSERT') then
   raise exception 'Client insert grant found for %',t;
  end if;
 end loop;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
do $$ declare t text; n integer; begin
 foreach t in array array['accounts','payment_consents','payment_intents','provider_evidence','ledger_entries','financial_commands','financial_approvals'] loop
  execute format('select count(*) from public.%I where user_id=''00000000-0000-4000-8000-000000000001''',t) into n;
  if n<>0 then raise exception 'Cross-owner read allowed for %',t; end if;
 end loop;
end $$;
reset role;
set role anon;
do $$ declare t text; begin
 foreach t in array array['accounts','payment_consents','payment_intents','provider_evidence','ledger_entries','financial_commands','financial_approvals'] loop
  begin
   execute format('select count(*) from public.%I',t);
   raise exception 'Anonymous financial read allowed for %',t;
  exception when insufficient_privilege then null;
  end;
 end loop;
end $$;
reset role;
select 'PASS actual migrations: preserved rows, owner RLS, denied client writes/anonymous reads, cross-owner references, idempotency' as result;
