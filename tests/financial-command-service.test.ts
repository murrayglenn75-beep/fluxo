import {describe,expect,it,vi} from 'vitest';
import {claimSandboxFinancialCommand,type FinancialCommandStore} from '../lib/security/financial-command-service';

const now='2026-10-06T02:30:00Z';
const command={id:'cmd-1',userId:'user-1',idempotencyKey:'key-1',intentHash:'sha256:abc',commandType:'payment' as const,status:'pending' as const};
const approval={commandId:'cmd-1',userId:'user-1',approvedBy:'user-1',approvedAt:'2026-10-06T02:29:00Z',expiresAt:'2026-10-06T02:34:00Z',intentHash:'sha256:abc'};
const input={commandId:'cmd-1',authenticatedUserId:'user-1',idempotencyKey:'key-1',now};
function store(): FinancialCommandStore {
  return {loadForOwner:vi.fn(async()=>({command,approval})),claimApprovedCommand:vi.fn(async()=> 'claimed' as const)};
}
describe('sandbox financial command claim boundary',()=>{
  it('claims only after validating the owner and approval',async()=>{
    const s=store();
    await expect(claimSandboxFinancialCommand(s,input)).resolves.toEqual({status:'claimed',commandId:'cmd-1'});
    expect(s.claimApprovedCommand).toHaveBeenCalledWith({commandId:'cmd-1',userId:'user-1',idempotencyKey:'key-1',intentHash:'sha256:abc',now});
  });
  it('rejects cross-user requests without claiming',async()=>{
    const s=store();
    await expect(claimSandboxFinancialCommand(s,{...input,authenticatedUserId:'attacker'})).rejects.toThrow('command_owner_mismatch');
    expect(s.claimApprovedCommand).not.toHaveBeenCalled();
  });
  it('rejects mismatched idempotency keys',async()=>{
    const s=store();
    await expect(claimSandboxFinancialCommand(s,{...input,idempotencyKey:'other'})).rejects.toThrow('idempotency_key_mismatch');
    expect(s.claimApprovedCommand).not.toHaveBeenCalled();
  });
  it('rejects expired approvals',async()=>{
    const s=store();
    await expect(claimSandboxFinancialCommand(s,{...input,now:'2026-10-06T02:35:00Z'})).rejects.toThrow('approval_expired');
    expect(s.claimApprovedCommand).not.toHaveBeenCalled();
  });
  it('rejects missing owner-scoped records',async()=>{
    const s=store();s.loadForOwner=vi.fn(async()=>null);
    await expect(claimSandboxFinancialCommand(s,input)).rejects.toThrow('command_not_found');
    expect(s.claimApprovedCommand).not.toHaveBeenCalled();
  });
  it('rejects atomic conflicts',async()=>{
    const s=store();s.claimApprovedCommand=vi.fn(async()=> 'conflict' as const);
    await expect(claimSandboxFinancialCommand(s,input)).rejects.toThrow('atomic_claim_conflict');
  });
  it('reports a store-confirmed duplicate without re-executing',async()=>{
    const s=store();s.claimApprovedCommand=vi.fn(async()=> 'already_claimed' as const);
    await expect(claimSandboxFinancialCommand(s,input)).resolves.toEqual({status:'already_claimed',commandId:'cmd-1'});
  });
});
