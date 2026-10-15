create index if not exists ledger_entries_account_id_idx
  on public.ledger_entries(account_id);

create index if not exists payment_consents_user_id_idx
  on public.payment_consents(user_id);

create index if not exists payment_intents_consent_id_idx
  on public.payment_intents(consent_id);

create index if not exists provider_evidence_user_id_idx
  on public.provider_evidence(user_id);
