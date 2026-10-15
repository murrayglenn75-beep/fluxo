import {describe,expect,it} from 'vitest';
import {claimSandboxFinancialCommand} from '../lib/security/financial-command-service';
import {SandboxAtomicCommandStore} from '../lib/security/sandbox-atomic-command-store';

const now='2026-10-06T02:30:00Z';
const command={id:'cmd-1',userId:'user-1',idempotencyKey:'idem-1',intentHash:'sha256:abc',commandType:'payment' as const,status:'pending' as const};
const approval={commandId:'cmd-1',userId:'user-1',approvedBy:'user-1',approvedAt:'2026-10-06T02:29:00Z',expiresAt:'2026-10-06T02:34:00Z',intentHash:'sha256:abc'};
const input={commandId:'cmd-1',authenticatedUserId:'user-1',idempotencyKey:'idem-1',now};
const make=()=>new SandboxAtomicCommandStore([{command,approval}]);

describe('single-process sandbox claim concurrency',()=>{
  it('allows exactly one winning claim across 100 simultaneous requests',async()=>{
    const store=make();
    const results=await Promise.all(Array.from({length:100},()=>claimSandboxFinancialCommand(store,input)));
    expect(results.filter(x=>x.status==='claimed')).toHaveLength(1);
    expect(results.filter(x=>x.status==='already_claimed')).toHaveLength(99);
    expect(store.claimCount()).toBe(1);
  });
  it('does not let a different user claim the command',async()=>{
    const store=make();
    await expect(claimSandboxFinancialCommand(store,{...input,authenticatedUserId:'attacker'}))
      .rejects.toThrow('command_not_found');
    expect(store.claimCount()).toBe(0);
  });
  it('does not consume a claim with a mismatched idempotency key',async()=>{
    const store=make();
    await expect(claimSandboxFinancialCommand(store,{...input,idempotencyKey:'changed'}))
      .rejects.toThrow('idempotency_key_mismatch');
    expect(store.claimCount()).toBe(0);
  });
  it('rejects expired approvals before claiming',async()=>{
    const store=make();
    await expect(claimSandboxFinancialCommand(store,{...input,now:'2026-10-06T02:35:00Z'}))
      .rejects.toThrow('approval_expired');
    expect(store.claimCount()).toBe(0);
  });
  it('rejects duplicate command IDs at initialization',()=>{
    expect(()=>new SandboxAtomicCommandStore([{command,approval},{command,approval}]))
      .toThrow('duplicate_command_id');
  });
});
