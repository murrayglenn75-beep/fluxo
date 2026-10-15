import {describe,expect,it,vi} from 'vitest';
import {claimDurableFinancialCommand,type PgPool} from '../lib/security/postgres-command-claim';

const input={commandId:'cmd',authenticatedUserId:'owner',idempotencyKey:'idem',intentHash:'hash'};
function fixture() {
  const sql:string[]=[];
  const query=vi.fn(async(statement:string)=>{
    sql.push(statement);
    if(statement.includes('from public.financial_commands')) return {rows:[{
      id:'cmd',user_id:'owner',idempotency_key:'idem',intent_hash:'hash',status:'pending',
      payment_intent_id:'intent-1'
    }],rowCount:1};
    if(statement.includes('from public.financial_approvals')) return {rows:[{
      user_id:'owner',command_id:'cmd',approved_by:'owner',intent_hash:'hash',consumed_at:null,valid:true
    }],rowCount:1};
    if(statement.includes('from public.payment_intents')) return {rows:[{
      id:'intent-1',user_id:'owner',request_fingerprint:'different-hash'
    }],rowCount:1};
    return {rows:[],rowCount:1};
  });
  const pool:PgPool={connect:async()=>({
    query:query as unknown as Awaited<ReturnType<PgPool['connect']>>['query'],
    release:vi.fn()
  })};
  return {pool,sql};
}
describe('owner-bound payment intent hash',()=>{
  it('rejects changed intent fingerprint before approval consumption',async()=>{
    const f=fixture();
    await expect(claimDurableFinancialCommand(f.pool,input)).resolves.toBe('conflict');
    expect(f.sql.some(s=>s.includes('from public.payment_intents'))).toBe(true);
    expect(f.sql.some(s=>s.includes('update public.financial_approvals'))).toBe(false);
    expect(f.sql.at(-1)).toBe('ROLLBACK');
  });
});
