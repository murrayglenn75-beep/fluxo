import {requireApproval,type Approval} from './financial-command';

export type FinancialCommandType='payment'|'transfer'|'exchange';
export type FinancialCommandStatus='pending'|'approved'|'executing'|'executed'|'failed'|'cancelled';

export type FinancialCommand=Readonly<{
  id:string;
  userId:string;
  idempotencyKey:string;
  intentHash:string;
  commandType:FinancialCommandType;
  status:FinancialCommandStatus;
}>;

export type ServerApproval=Approval&Readonly<{
  commandId:string;
  userId:string;
  expiresAt:string;
}>;

function required(value:string,error:string){
  const normalized=value.trim();
  if(!normalized) throw new Error(error);
  return normalized;
}

export function authorizeFinancialCommand(
  command:FinancialCommand,
  approval:ServerApproval,
  authenticatedUserId:string,
  now=new Date().toISOString()
):FinancialCommand{
  const principal=required(authenticatedUserId,'authentication_required');
  const commandId=required(command.id,'invalid_command_id');
  const userId=required(command.userId,'invalid_command_owner');
  const idempotencyKey=required(command.idempotencyKey,'idempotency_key_required');
  const intentHash=required(command.intentHash,'invalid_intent_hash');

  if(principal!==userId) throw new Error('command_owner_mismatch');
  if(command.status!=='pending'&&command.status!=='approved')
    throw new Error('command_not_executable');

  if(required(approval.commandId,'invalid_approval_command')!==commandId)
    throw new Error('approval_command_mismatch');
  if(required(approval.userId,'invalid_approval_owner')!==userId)
    throw new Error('approval_owner_mismatch');

  const expiresAt=Date.parse(approval.expiresAt);
  const currentTime=Date.parse(now);
  if(Number.isNaN(expiresAt)||Number.isNaN(currentTime))
    throw new Error('invalid_approval_expiry');
  if(expiresAt<=currentTime) throw new Error('approval_expired');

  requireApproval(approval,{
    expectedApprover:userId,
    expectedIntentHash:intentHash,
    now,
    maxAgeMs:5*60*1000,
  });

  return {...command,id:commandId,userId,idempotencyKey,intentHash,status:'approved'};
}
