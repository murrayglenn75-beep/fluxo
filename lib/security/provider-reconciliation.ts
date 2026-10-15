/**
 * Fail-closed provider reconciliation policy. Sandbox only: no provider I/O.
 * The provider adapter MUST authenticate responses and use a stable external
 * operation reference. An ambiguous outcome must never trigger resubmission.
 */
export type ProviderEvidence =
 | {kind:'settled';providerOperationId:string;amountMinor:number;currency:string;intentHash:string}
 | {kind:'rejected';providerOperationId:string;reason:string}
 | {kind:'pending';providerOperationId:string}
 | {kind:'not_found';providerOperationId:string}
 | {kind:'unavailable'};
export type ReconcileDecision='settled'|'failed'|'reconcile';

export function decideProviderReconciliation(
 expected:{providerOperationId:string;amountMinor:number;currency:string;intentHash:string},
 evidence:ProviderEvidence
):ReconcileDecision{
 if(!expected.providerOperationId.trim()||!expected.intentHash.trim()||
    !Number.isSafeInteger(expected.amountMinor)||expected.amountMinor<=0||
    !/^[A-Z]{3}$/.test(expected.currency))throw new Error('invalid_expected_payment');
 if(evidence.kind==='unavailable')return 'reconcile';
 if(evidence.providerOperationId!==expected.providerOperationId)return 'reconcile';
 if(evidence.kind==='pending'||evidence.kind==='not_found')return 'reconcile';
 if(evidence.kind==='rejected')return evidence.reason.trim()?'failed':'reconcile';
 if(evidence.intentHash!==expected.intentHash||
    evidence.amountMinor!==expected.amountMinor||
    evidence.currency!==expected.currency)return 'reconcile';
 return 'settled';
}
