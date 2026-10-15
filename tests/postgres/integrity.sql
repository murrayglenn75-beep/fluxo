-- Real PostgreSQL integrity checks for the isolated fixture.
begin;
do $$
begin
 if (select count(*) from public.financial_commands) <> 2 then raise exception 'seed_commands_missing'; end if;
 if (select count(*) from public.financial_approvals) <> 2 then raise exception 'seed_approvals_missing'; end if;
 if (select count(*) from public.financial_command_outbox) <> 0 then raise exception 'outbox_not_empty'; end if;
end $$;
-- Atomically consume approval, transition command and insert outbox.
update public.financial_approvals set consumed_at=clock_timestamp()
 where command_id='20000000-0000-4000-8000-000000000001' and consumed_at is null;
update public.financial_commands set status='executing'
 where id='20000000-0000-4000-8000-000000000001' and status='approved';
insert into public.financial_command_outbox(command_id,user_id,intent_hash,idempotency_key)
 values('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','hash-a','key-a');
do $$
begin
 if (select count(*) from public.financial_command_outbox)<>1 then raise exception 'outbox_not_created'; end if;
 if (select status from public.financial_commands where id='20000000-0000-4000-8000-000000000001')<>'executing' then raise exception 'command_not_executing'; end if;
end $$;
rollback;
-- Rollback must undo all three changes.
do $$
begin
 if (select count(*) from public.financial_command_outbox)<>0 then raise exception 'outbox_survived_rollback'; end if;
 if (select status from public.financial_commands where id='20000000-0000-4000-8000-000000000001')<>'approved' then raise exception 'status_survived_rollback'; end if;
 if (select consumed_at from public.financial_approvals where command_id='20000000-0000-4000-8000-000000000001') is not null then raise exception 'approval_survived_rollback'; end if;
end $$;
-- Browser roles must not have outbox write privileges.
do $$
begin
 if has_table_privilege('anon','public.financial_command_outbox','INSERT') or
    has_table_privilege('authenticated','public.financial_command_outbox','INSERT') then
   raise exception 'browser_can_insert_outbox';
 end if;
end $$;
