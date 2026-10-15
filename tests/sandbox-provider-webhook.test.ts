import {describe,it,expect} from 'vitest';
import {createHmac} from 'node:crypto';
import {verifySandboxProviderWebhook as verify} from '../lib/security/sandbox-provider-webhook';
const secret=Buffer.alloc(32,7);
const now=Date.parse('2026-10-09T12:00:00Z');
const expected={eventId:'event-1',operationId:'op-1',maxAgeSeconds:300};
function signed(data:unknown){
 const body=Buffer.from(JSON.stringify(data));
 return {body,sig:createHmac('sha256',secret).update(body).digest('hex')};
}
const payload={eventId:'event-1',operationId:'op-1',timestamp:'2026-10-09T11:59:00Z',kind:'settled'};
describe('sandbox provider webhook trust boundary',()=>{
 it('accepts correctly signed, fresh, operation-bound payload',()=>{
  const {body,sig}=signed(payload);
  expect(verify(body,sig,secret,expected,now).eventId).toBe('event-1');
 });
 it('rejects tampered body',()=>{
  const {sig}=signed(payload);
  expect(()=>verify(Buffer.from(JSON.stringify({...payload,kind:'rejected'})),sig,secret,expected,now)).toThrow('invalid_signature');
 });
 it('rejects mismatched operation and event IDs even with valid signatures',()=>{
  const {body,sig}=signed({...payload,operationId:'other'});
  expect(()=>verify(body,sig,secret,expected,now)).toThrow('provider_identity_mismatch');
 });
 it('rejects stale, future and malformed evidence',()=>{
  for(const timestamp of ['2026-10-09T11:00:00Z','2026-10-09T12:02:00Z','bad']){
   const {body,sig}=signed({...payload,timestamp});
   expect(()=>verify(body,sig,secret,expected,now)).toThrow('stale_provider_evidence');
  }
 });
 it('rejects wrong signature and weak secret',()=>{
  const {body,sig}=signed(payload);
  expect(()=>verify(body,'0'.repeat(64),secret,expected,now)).toThrow('invalid_signature');
  expect(()=>verify(body,sig,Buffer.from('weak'),expected,now)).toThrow('invalid_verification_config');
 });
});
