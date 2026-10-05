export type Approval=Readonly<{
  approvedBy:string;
  approvedAt:string;
  intentHash:string;
}>;

export type ApprovalContext=Readonly<{
  expectedApprover:string;
  expectedIntentHash:string;
  now?:string;
  maxAgeMs?:number;
}>;

export function requireApproval(
  approval:Approval|undefined,
  context?:ApprovalContext
):Approval{
  if(!approval)throw new Error("approval_required");

  const approvedBy=approval.approvedBy.trim();
  const intentHash=approval.intentHash.trim();

  if(!approvedBy||!intentHash)throw new Error("invalid_approval");

  const approvedTime=Date.parse(approval.approvedAt);
  if(Number.isNaN(approvedTime))throw new Error("invalid_approval_time");

  if(context){
    if(approvedBy!==context.expectedApprover)
      throw new Error("approval_principal_mismatch");

    if(intentHash!==context.expectedIntentHash)
      throw new Error("approval_intent_mismatch");

    const now=Date.parse(context.now??new Date().toISOString());
    if(Number.isNaN(now))throw new Error("invalid_current_time");

    if(approvedTime>now)
      throw new Error("approval_from_future");

    const maxAgeMs=context.maxAgeMs??5*60*1000;

    if(!Number.isSafeInteger(maxAgeMs)||maxAgeMs<=0)
      throw new Error("invalid_approval_window");

    if(now-approvedTime>maxAgeMs)
      throw new Error("approval_expired");
  }

  return approval;
}
