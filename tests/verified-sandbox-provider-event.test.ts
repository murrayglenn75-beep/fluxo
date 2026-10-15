import {createHmac} from 'node:crypto';
import {describe,it,expect,vi} from 'vitest';
import {processVerifiedSandboxProviderEvent as process} from '../lib/security/verified-sandbox-provider-event';
const secret=Buffer.alloc(32,9);
const expected={commandId:'cmd-1',userId:'user-1',providerOperationId:'op-1',amountMinor:2500,currency:'BRL',intentHash:'hash-1'};
const now=Date.parse('2026-10-09T12:00:00Z');
function event(patch:Record<string,unknown>={}){
 const rawBody=Buffer.from(JSON.stringify({eventId:'evt-1',operationId:'op-1',timestamp:'2026-10-09T11:59:00Z',
 kind:'settled',amountMinor:2500,currency:'BRL',intentHash:'hash-1',...patch}));
 const signature=createHmac('sha256',secret).update(rawBody).digest('hex');
 return {rawBody,signature,secret,expected,eventId:'evt-1',providerName:'sandbox',nowMs:now};
}
function pool(){
 const queries:string[]=[];
 const query=vi.fn(async(sql:string)=>{
  queries.push(sql);
  if(sql.includes('select status,intent_hash,user_id'))return {rows:[{status:'reconcile',intent_hash:'hash-1',user_id:'user-1'}],rowCount:1};
  return {rows:[{id:'receipt-1'}],rowCount:1};
 });
 const release=vi.fn();
 return {db:{connect:async()=>({query,release})},queries,release};
}
describe('verified sandbox webhook to durable replay fence',()=>{
 it('commits verified evidence, replay receipt and settlement together',async()=>{
  const p=pool();
  expect(await process(p.db as never,event())).toBe('settled');
  expect(p.queries.some(q=>q.includes('financial_provider_event_receipts'))).toBe(true);
  expect(p.queries.some(q=>q.includes('financial_provider_evidence'))).toBe(true);
  expect(p.queries.at(-1)).toBe('COMMIT');
 });
 it('rejects tampering before opening any DB transaction',async()=>{
  const p=pool();const e=event();e.rawBody=Buffer.from(e.rawBody.toString().replace('2500','2600'));
  await expect(process(p.db as never,e)).rejects.toThrow('invalid_signature');
  expect(p.queries).toHaveLength(0);
 });
 it('rejects unsupported provider event before DB access',async()=>{
  const p=pool();
  await expect(process(p.db as never,event({kind:'refunded'}))).rejects.toThrow('unsupported_provider_event');
  expect(p.queries).toHaveLength(0);
 });
 it('does not settle mismatched amount despite valid signature',async()=>{
  const p=pool();
  expect(await process(p.db as never,event({amountMinor:2600}))).toBe('reconcile');
  expect(p.queries.some(q=>q.includes('financial_provider_event_receipts'))).toBe(true);
 });
 it('rejects wrong event identity before DB access',async()=>{
  const p=pool();
  await expect(process(p.db as never,event({eventId:'other'}))).rejects.toThrow('provider_identity_mismatch');
  expect(p.queries).toHaveLength(0);
 });
});
