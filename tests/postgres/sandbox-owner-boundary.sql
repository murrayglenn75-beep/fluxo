\set ON_ERROR_STOP on
create role authenticated nologin;
create role anon nologin;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
insert into auth.users(id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222');
\i supabase/migrations/20261014_fluxo_sandbox_owner_boundary.sql
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
insert into public.fluxo_sandbox_accounts(user_id,display_name,balance_minor,currency)
values('11111111-1111-4111-8111-111111111111','A',0,'BRL');
do $$
begin
 if (select count(*) from public.fluxo_sandbox_accounts)<>1 then raise exception 'owner account not readable';end if;
 begin
  insert into public.fluxo_sandbox_accounts(user_id,balance_minor) values
   ('22222222-2222-4222-8222-222222222222',0);
  raise exception 'cross-user insert incorrectly allowed';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.fluxo_sandbox_accounts(user_id,balance_minor) values
   ('11111111-1111-4111-8111-111111111111',10000);
  raise exception 'nonzero opening balance incorrectly allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
insert into public.fluxo_sandbox_intents(id,user_id,account_user_id,command_id,recipient,amount_minor)
values('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111',
'11111111-1111-4111-8111-111111111111','44444444-4444-4444-8444-444444444444','Test',500);
do $$
begin
 begin
  update public.fluxo_sandbox_intents set status='confirmed';
  raise exception 'client status update incorrectly allowed';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.fluxo_sandbox_intents(id,user_id,account_user_id,command_id,recipient,amount_minor)
  values('55555555-5555-4555-8555-555555555555',
  '11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111',
  '44444444-4444-4444-8444-444444444444','Duplicate',500);
  raise exception 'duplicate command incorrectly allowed';
 exception when unique_violation then null;
 end;
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$
begin
 if (select count(*) from public.fluxo_sandbox_accounts)<>0 then raise exception 'user B can see A account'; end if;
 if (select count(*) from public.fluxo_sandbox_intents)<>0 then raise exception 'user B can see A intent'; end if;
 begin
  insert into public.fluxo_sandbox_intents(id,user_id,account_user_id,command_id,recipient,amount_minor)
  values('66666666-6666-4666-8666-666666666666',
  '11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111',
  '77777777-7777-4777-8777-777777777777','Cross',500);
  raise exception 'cross-user intent incorrectly allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;

-- Verify anonymous users have no table privileges.
reset role;
do $$
begin
 if has_table_privilege('anon','public.fluxo_sandbox_accounts','SELECT') or
    has_table_privilege('anon','public.fluxo_sandbox_intents','SELECT') or
    has_table_privilege('anon','public.fluxo_sandbox_intents','INSERT') then
   raise exception 'anonymous role has sandbox data privileges';
 end if;
 if has_table_privilege('authenticated','public.fluxo_sandbox_accounts','UPDATE') or
    has_table_privilege('authenticated','public.fluxo_sandbox_accounts','DELETE') or
    has_table_privilege('authenticated','public.fluxo_sandbox_intents','UPDATE') or
    has_table_privilege('authenticated','public.fluxo_sandbox_intents','DELETE') then
   raise exception 'authenticated role can mutate protected records';
 end if;
end $$;
-- Verify users cannot manufacture a settled/reviewed intent or bind a different owner.
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
do $$
begin
 begin
  insert into public.fluxo_sandbox_intents(id,user_id,account_user_id,command_id,recipient,amount_minor,status)
  values('88888888-8888-4888-8888-888888888888',
   '11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111',
   '99999999-9999-4999-8999-999999999999','Forged',500,'settled');
  raise exception 'forged settlement status accepted';
 exception when check_violation then null;
 end;
 begin
  insert into public.fluxo_sandbox_intents(id,user_id,account_user_id,command_id,recipient,amount_minor)
  values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Wrong account',500);
  raise exception 'mismatched account owner accepted';
 exception when check_violation then null;
 end;
 begin
  delete from public.fluxo_sandbox_intents;
  raise exception 'client deletion allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
