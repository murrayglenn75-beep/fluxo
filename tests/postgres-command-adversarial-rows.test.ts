import {describe,expect,it,vi} from 'vitest';
import {claimDurableFinancialCommand,type PgPool} from '../lib/security/postgres-command-claim';
const input={commandId:'cmd',authenticatedUserId:'owner',idempotencyKey:'idem',intentHash:'hash'};
function run(commandOverrides:Record<string,unknown>={},intentOverrides:Record<string,unknown>={}){
  const statements:string[]=[];
  const query=vi.fn(async(sql:string)=>{
    statements.push(sql);
    if(sql.includes('from public.financial_commands'))return {rows:[{id:'cmd',user_id:'owner',idempotency_key:'idem',intent_hash:'hash',status:'pending',payment_intent_id:'intent',...commandOverrides}],rowCount:1};
    if(sql.includes('from public.financial_approvals'))return {rows:[{command_id:'cmd',user_id:'owner',approved_by:'owner',intent_hash:'hash',consumed_at:null,valid:true}],rowCount:1};
    if(sql.includes('from public.payment_intents'))return {rows:[{id:'intent',user_id:'owner',request_fingerprint:'hash',...intentOverrides}],rowCount:1};
    return {rows:[],rowCount:1};
  });
  const pool:PgPool={connect:async()=>({query:query as unknown as Awaited<ReturnType<PgPool['connect']>>['query'],release:vi.fn()})};
  return {pool,statements};
}
describe('adversarial claim row integrity',()=>{
  it.each([
    [{user_id:'attacker'},{}],
    [{id:'other'},{}],
    [{payment_intent_id:null},{}],
    [{}, {user_id:'attacker'}],
    [{}, {id:'other'}],
    [{}, {request_fingerprint:'tampered'}],
  ])('fails closed on forged database row %#',async(command,intent)=>{
    const f=run(command,intent);
    await expect(claimDurableFinancialCommand(f.pool,input)).resolves.toBe('conflict');
    expect(f.statements.at(-1)).toBe('ROLLBACK');
    expect(f.statements.some(s=>s.includes('update public.financial_approvals'))).toBe(false);
  });
});
