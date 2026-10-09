import {describe,expect,it,vi} from 'vitest';
import {claimDurableFinancialCommand,type PgPool} from '../lib/security/postgres-command-claim';

const input={commandId:'cmd',authenticatedUserId:'owner',idempotencyKey:'idem',intentHash:'hash'};
function fixture(overrides:{status?:string;approvalValid?:boolean;consumed?:string|null;owner?:string;failUpdate?:boolean}={}) {
  const sql:string[]=[];
  const query=vi.fn(async (statement:string)=>{
    sql.push(statement);
    if(statement.includes('from public.financial_commands')) return {rows:[{
      id:'cmd',user_id:overrides.owner??'owner',idempotency_key:'idem',
      intent_hash:'hash',status:overrides.status??'pending',payment_intent_id:null
    }],rowCount:1};
    if(statement.includes('from public.financial_approvals')) return {rows:[{
      command_id:'cmd',user_id:'owner',approved_by:'owner',intent_hash:'hash',
      consumed_at:overrides.consumed??null,valid:overrides.approvalValid??true
    }],rowCount:1};
    if(statement.includes('update public.financial_commands')&&overrides.failUpdate)
      return {rows:[],rowCount:0};
    return {rows:[],rowCount:1};
  });
  const release=vi.fn();
  const pool:PgPool={connect:async()=>({query,release})};
  return {pool,sql,release};
}
describe('PostgreSQL command claim transaction orchestration',()=>{
  it('locks, consumes and commits in one transaction',async()=>{
    const f=fixture();
    await expect(claimDurableFinancialCommand(f.pool,input)).resolves.toBe('claimed');
    expect(f.sql[0]).toBe('BEGIN');
    expect(f.sql.some(s=>s.includes('for update'))).toBe(true);
    expect(f.sql.filter(s=>s.includes('update public.'))).toHaveLength(2);
    expect(f.sql.at(-1)).toBe('COMMIT');
    expect(f.release).toHaveBeenCalledOnce();
  });
  it('does not consume an already executing command',async()=>{
    const f=fixture({status:'executing'});
    await expect(claimDurableFinancialCommand(f.pool,input)).resolves.toBe('already_claimed');
    expect(f.sql.some(s=>s.includes('update public.'))).toBe(false);
  });
  it('rejects an expired approval with rollback',async()=>{
    const f=fixture({approvalValid:false});
    await expect(claimDurableFinancialCommand(f.pool,input)).resolves.toBe('conflict');
    expect(f.sql.at(-1)).toBe('ROLLBACK');
  });
  it('rolls back both updates if command transition loses race',async()=>{
    const f=fixture({failUpdate:true});
    await expect(claimDurableFinancialCommand(f.pool,input)).resolves.toBe('conflict');
    expect(f.sql.at(-1)).toBe('ROLLBACK');
  });
  it('rejects a mismatched key without consuming approval',async()=>{
    const f=fixture();
    await expect(claimDurableFinancialCommand(f.pool,{...input,idempotencyKey:'other'})).resolves.toBe('conflict');
    expect(f.sql.some(s=>s.includes('update public.'))).toBe(false);
  });
});
