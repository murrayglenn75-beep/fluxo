import {describe,expect,it} from 'vitest';
import {authorizeFinancialCommand,type FinancialCommand,type ServerApproval} from '../lib/security/server-financial-authority';

const now='2026-10-06T02:30:00Z';
const command:FinancialCommand={
  id:'command-1',userId:'user-1',idempotencyKey:'idem-1',
  intentHash:'sha256:intent',commandType:'payment',status:'pending',
};
const approval:ServerApproval={
  commandId:'command-1',userId:'user-1',approvedBy:'user-1',
  approvedAt:'2026-10-06T02:29:00Z',expiresAt:'2026-10-06T02:34:00Z',
  intentHash:'sha256:intent',
};

describe('server financial authority',()=>{
  it('authorizes only a matching authenticated owner and approval',()=>{
    expect(authorizeFinancialCommand(command,approval,'user-1',now).status).toBe('approved');
  });

  it('rejects cross-user command execution',()=>{
    expect(()=>authorizeFinancialCommand(command,approval,'attacker',now)).toThrow('command_owner_mismatch');
  });

  it('rejects approval replay onto another command',()=>{
    expect(()=>authorizeFinancialCommand({...command,id:'command-2'},approval,'user-1',now)).toThrow('approval_command_mismatch');
  });

  it('rejects approval owner substitution',()=>{
    expect(()=>authorizeFinancialCommand(command,{...approval,userId:'attacker'},'user-1',now)).toThrow('approval_owner_mismatch');
  });

  it('rejects approver substitution',()=>{
    expect(()=>authorizeFinancialCommand(command,{...approval,approvedBy:'attacker'},'user-1',now)).toThrow('approval_principal_mismatch');
  });

  it('rejects intent mutation after approval',()=>{
    expect(()=>authorizeFinancialCommand({...command,intentHash:'sha256:changed'},approval,'user-1',now)).toThrow('approval_intent_mismatch');
  });

  it('rejects expired approvals',()=>{
    expect(()=>authorizeFinancialCommand(command,{...approval,expiresAt:now},'user-1',now)).toThrow('approval_expired');
  });

  it('rejects replay of terminal commands',()=>{
    for(const status of ['executing','executed','failed','cancelled'] as const)
      expect(()=>authorizeFinancialCommand({...command,status},approval,'user-1',now)).toThrow('command_not_executable');
  });
});
