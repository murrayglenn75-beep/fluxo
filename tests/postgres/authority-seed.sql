-- Two consistent owners for clean and populated authority-migration checks.
insert into auth.users values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
insert into public.accounts(id,user_id,name,currency)
 select ('20000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'Demo','BRL' from generate_series(1,2) n;
insert into public.payment_consents(id,user_id,provider,payload_hash,status)
 select ('30000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'sandbox','hash-'||n,'authorised' from generate_series(1,2) n;
insert into public.payment_intents(id,user_id,consent_id,idempotency_key,request_fingerprint,amount_minor,recipient,status)
 select ('40000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 ('30000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'shared-key','hash-'||n,1000,'{}','approved' from generate_series(1,2) n;
insert into public.provider_evidence(id,user_id,payment_intent_id,provider,provider_request_id,evidence_hash,raw_status)
 select ('50000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 ('40000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'sandbox','request-'||n,'hash-'||n,'approved' from generate_series(1,2) n;
insert into public.financial_commands(id,user_id,payment_intent_id,idempotency_key,intent_hash,command_type,status)
 select ('60000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 ('40000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'shared-key','hash-'||n,'payment','approved' from generate_series(1,2) n;
insert into public.financial_approvals(id,user_id,command_id,intent_hash,approved_by,approved_at,expires_at)
 select ('70000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 ('60000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'hash-'||n,
 ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,now(),now()+interval '5 minutes' from generate_series(1,2) n;
insert into public.ledger_entries(id,user_id,command_id,account_id,amount_minor,currency)
 select ('80000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 ('60000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 ('20000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,1000,'BRL' from generate_series(1,2) n;
