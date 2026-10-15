import {describe,expect,it,vi} from 'vitest';
import {claimDurableFinancialCommand,type PgPool} from '../lib/security/postgres-command-claim';
const input={commandId:'cmd',authenticatedUserId:'owner',idempotencyKey:'key',intentHash:'hash'};
function fixture(mode:'ok'|'duplicate'|'error'){
  const statements:string[]=[];
  const query=vi.fn(async(sql:string)=>{
    statements.push(sql);
    if(sql.includes('from public.financial_commands'))return {rows:[{id:'cmd',user_id:'owner',idempotency_key:'key',intent_hash:'hash',status:'pending',payment_intent_id:'intent'}],rowCount:1};
    if(sql.includes('from public.financial_approvals'))return {rows:[{user_id:'owner',command_id:'cmd',approved_by:'owner',intent_hash:'hash',consumed_at:null,valid:true}],rowCount:1};
    if(sql.includes('from public.payment_intents'))return {rows:[{id:'intent',user_id:'owner',request_fingerprint:'hash'}],rowCount:1};
    if(sql.includes('insert into public.financial_command_outbox')){
      if(mode==='error')throw new Error('simulated_outbox_disk_failure');
      return {rows:[],rowCount:mode==='duplicate'?0:1};
    }
    return {rows:[],rowCount:1};
  });
  const release=vi.fn();
  const pool:PgPool={connect:async()=>({query:query as unknown as Awaited<ReturnType<PgPool['connect']>>['query'],release})};
  return {pool,statements,release};
}
describe('atomic claim and durable outbox',()=>{
  it('inserts outbox before committing',async()=>{
    const f=fixture('ok');
    await expect(claimDurableFinancialCommand(f.pool,input)).resolves.toBe('claimed');
    expect(f.statements.findIndex(s=>s.includes('insert into public.financial_command_outbox')))
      .toBeLessThan(f.statements.indexOf('COMMIT'));
  });
  it('rolls back claim and approval if outbox already exists',async()=>{
    const f=fixture('duplicate');
    await expect(claimDurableFinancialCommand(f.pool,input)).resolves.toBe('conflict');
    expect(f.statements.at(-1)).toBe('ROLLBACK');
    expect(f.statements).not.toContain('COMMIT');
  });
  it('rolls back if outbox insert throws',async()=>{
    const f=fixture('error');
    await expect(claimDurableFinancialCommand(f.pool,input)).rejects.toThrow('simulated_outbox_disk_failure');
    expect(f.statements.at(-1)).toBe('ROLLBACK');
    expect(f.release).toHaveBeenCalledOnce();
  });
});
