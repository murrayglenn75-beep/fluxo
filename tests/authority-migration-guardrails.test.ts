import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Repository guardrails. These do not replace integration tests against Postgres.
const sql = readFileSync(resolve(process.cwd(),
  'supabase/migrations/20261009000000_v2_authority_hardening.sql'), 'utf8');

describe('v2 authority migration static guardrails', () => {
  it('removes direct client mutations from authoritative accounts', () => {
    expect(sql).toMatch(/revoke insert, update, delete on public\.accounts from anon, authenticated/i);
    for (const operation of ['insert', 'update', 'delete']) {
      expect(sql).toContain(`drop policy if exists "accounts_${operation}_own"`);
    }
  });

  it('enforces owner-bound consent and evidence references', () => {
    expect(sql).toMatch(/foreign key \(consent_id, user_id\) references public\.payment_consents\(id, user_id\)/i);
    expect(sql).toMatch(/foreign key \(payment_intent_id, user_id\) references public\.payment_intents\(id, user_id\)/i);
  });

  it('limits financial API roles to authenticated reads', () => {
    expect(sql).toMatch(/revoke all on public\.accounts[\s\S]*?from anon;/i);
    expect(sql).toMatch(/revoke all on public\.accounts[\s\S]*?from authenticated;/i);
    expect(sql).toMatch(/grant select on public\.accounts[\s\S]*?to authenticated;/i);
    expect(sql).not.toMatch(/grant\s+(?:all|insert|update|delete)\s+on\s+public\./i);
  });

  it('does not introduce a privileged RPC or bypass RLS', () => {
    expect(sql).not.toMatch(/create\s+(?:or replace\s+)?function/i);
    expect(sql).not.toMatch(/disable\s+row\s+level\s+security/i);
    expect(sql.replace(/^\s*--.*$/gm, '')).not.toMatch(/security\s+definer\b/i);
  });
});
