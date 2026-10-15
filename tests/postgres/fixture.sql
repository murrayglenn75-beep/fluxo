-- Isolated PostgreSQL fixture. Never apply to production Supabase.
begin;
create schema if not exists auth;
select 'create role anon nologin' where not exists (select 1 from pg_roles where rolname='anon') \gexec
select 'create role authenticated nologin' where not exists (select 1 from pg_roles where rolname='authenticated') \gexec
create table auth.users(id uuid primary key);
create table public.payment_intents(
 id uuid primary key, user_id uuid not null references auth.users(id),
 request_fingerprint text not null, unique(id,user_id)
);
create table public.financial_commands(
 id uuid primary key, user_id uuid not null references auth.users(id),
 payment_intent_id uuid not null, idempotency_key text not null,
 intent_hash text not null, status text not null
 check(status in ('pending','approved','executing','executed','failed','cancelled')),
 unique(user_id,idempotency_key),unique(id,user_id),
 foreign key(payment_intent_id,user_id) references public.payment_intents(id,user_id)
);
create table public.financial_approvals(
 command_id uuid primary key, user_id uuid not null,
 approved_by uuid not null, intent_hash text not null,
 approved_at timestamptz not null, expires_at timestamptz not null,
 consumed_at timestamptz,
 foreign key(command_id,user_id) references public.financial_commands(id,user_id)
);
\ir ../../docs/sql/financial-command-outbox.draft.sql
insert into auth.users(id) values
 ('00000000-0000-4000-8000-000000000001'),
 ('00000000-0000-4000-8000-000000000002');
insert into public.payment_intents(id,user_id,request_fingerprint) values
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','hash-a'),
 ('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002','hash-b');
insert into public.financial_commands(id,user_id,payment_intent_id,idempotency_key,intent_hash,status) values
 ('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','key-a','hash-a','approved'),
 ('20000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','key-b','hash-b','approved');
insert into public.financial_approvals(command_id,user_id,approved_by,intent_hash,approved_at,expires_at) values
 ('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','hash-a',now(),now()+interval '5 minutes'),
 ('20000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002','hash-b',now(),now()+interval '5 minutes');
commit;
