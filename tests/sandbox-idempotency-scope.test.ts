import {describe,expect,it} from 'vitest';
import {SandboxAtomicCommandStore} from '../lib/security/sandbox-atomic-command-store';
const command={id:'c1',userId:'u1',idempotencyKey:'idem',intentHash:'hash',commandType:'payment' as const,status:'pending' as const};
const approval={commandId:'c1',userId:'u1',approvedBy:'u1',approvedAt:'2026-10-06T02:29:00Z',expiresAt:'2026-10-06T02:34:00Z',intentHash:'hash'};
describe('owner-scoped sandbox idempotency',()=>{
  it('rejects different commands sharing one owner and idempotency key',()=>{
    expect(()=>new SandboxAtomicCommandStore([
      {command,approval},
      {command:{...command,id:'c2'},approval:{...approval,commandId:'c2'}}
    ])).toThrow('duplicate_idempotency_key');
  });
  it('permits distinct users to use the same idempotency key',()=>{
    expect(()=>new SandboxAtomicCommandStore([
      {command,approval},
      {command:{...command,id:'c2',userId:'u2'},approval:{...approval,commandId:'c2',userId:'u2',approvedBy:'u2'}}
    ])).not.toThrow();
  });
});
