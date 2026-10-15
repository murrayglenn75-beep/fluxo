import {createHash} from 'node:crypto';
import type {PgPool} from './postgres-command-claim';
import {verifySandboxProviderWebhook} from './sandbox-provider-webhook';
import {recordProviderReconciliation,type ExpectedSettlement} from './postgres-provider-reconciliation';
import type {ProviderEvidence} from './provider-reconciliation';

/**
 * Trusted SERVER-ONLY sandbox boundary. Never accept expected payment values
 * or a secret from a request body. Resolve expected values from authoritative
 * server state, and keep the HMAC secret in a server-only configuration.
 * This is NOT a real Pix provider integration.
 */
export async function processVerifiedSandboxProviderEvent(
 pool:PgPool,
 input:{rawBody:Buffer;signature:string;secret:Buffer;expected:ExpectedSettlement;
        eventId:string;providerName:string;nowMs?:number}
):Promise<'settled'|'failed'|'reconcile'|'conflict'>{
 const verified=verifySandboxProviderWebhook(input.rawBody,input.signature,input.secret,{
  eventId:input.eventId,operationId:input.expected.providerOperationId,maxAgeSeconds:300
 },input.nowMs);
 const obj=verified.payload as Record<string,unknown>;
 let evidence:ProviderEvidence;
 if(obj.kind==='settled'){
  if(!Number.isSafeInteger(obj.amountMinor)||typeof obj.currency!=='string'||typeof obj.intentHash!=='string')
   throw new Error('invalid_settlement_payload');
  evidence={kind:'settled',providerOperationId:verified.operationId,
   amountMinor:obj.amountMinor as number,currency:obj.currency,intentHash:obj.intentHash};
 }else if(obj.kind==='rejected'){
  if(typeof obj.reason!=='string'||!obj.reason.trim())throw new Error('invalid_rejection_payload');
  evidence={kind:'rejected',providerOperationId:verified.operationId,reason:obj.reason};
 }else if(obj.kind==='pending'||obj.kind==='not_found'){
  evidence={kind:obj.kind,providerOperationId:verified.operationId};
 }else throw new Error('unsupported_provider_event');
 const digest=createHash('sha256').update(input.rawBody).digest('hex');
 return recordProviderReconciliation(pool,input.expected,evidence,{
  authenticatedSource:'sandbox-hmac-v1',evidenceDigest:digest,
  providerName:input.providerName,providerEventId:verified.eventId
 });
}
