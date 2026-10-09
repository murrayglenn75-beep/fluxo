import {describe,expect,it} from 'vitest';
import {transitionOutbox,type OutboxRecord} from '../lib/security/sandbox-outbox-state';
const base:OutboxRecord={commandId:'c',userId:'u',idempotencyKey:'k',intentHash:'h',status:'pending',attempts:0,leaseExpiresAt:null};
describe('sandbox outbox recovery state machine',()=>{
  it('leases pending work once',()=>{
    const leased=transitionOutbox(base,{type:'lease',now:'2026-10-09T10:00:00.000Z'});
    expect(leased.status).toBe('leased');
    expect(leased.attempts).toBe(1);
    expect(()=>transitionOutbox(leased,{type:'lease',now:'2026-10-09T10:00:01.000Z'})).toThrow('lease_not_allowed');
  });
  it('moves timed out provider calls to reconciliation, never automatic retry',()=>{
    const leased=transitionOutbox(base,{type:'lease',now:'2026-10-09T10:00:00.000Z'});
    const reconciled=transitionOutbox(leased,{type:'provider_timeout'});
    expect(reconciled.status).toBe('reconcile');
    expect(()=>transitionOutbox(reconciled,{type:'lease',now:'2026-10-09T10:00:40.000Z'})).toThrow('lease_not_allowed');
  });
  it('treats crashed worker expired lease as uncertain delivery',()=>{
    const leased=transitionOutbox(base,{type:'lease',now:'2026-10-09T10:00:00.000Z'});
    expect(()=>transitionOutbox(leased,{type:'lease_expired',now:'2026-10-09T10:00:29.000Z'})).toThrow('lease_not_expired');
    expect(transitionOutbox(leased,{type:'lease_expired',now:'2026-10-09T10:00:31.000Z'}).status).toBe('reconcile');
  });
  it('does not treat acknowledgement as permission to resend',()=>{
    const leased=transitionOutbox(base,{type:'lease',now:'2026-10-09T10:00:00.000Z'});
    const ack=transitionOutbox(leased,{type:'provider_ack'});
    expect(ack.status).toBe('acknowledged');
    expect(()=>transitionOutbox(ack,{type:'lease',now:'2026-10-09T10:00:31.000Z'})).toThrow('lease_not_allowed');
  });
  it('rejects forged or incomplete identities',()=>{
    expect(()=>transitionOutbox({...base,userId:''},{type:'lease',now:'2026-10-09T10:00:00.000Z'})).toThrow('invalid_outbox_identity');
  });
});
