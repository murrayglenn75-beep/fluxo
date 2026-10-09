import type {PgPool} from './postgres-command-claim';
import {decideProviderReconciliation,type ProviderEvidence} from './provider-reconciliation';

export type ExpectedSettlement={
 commandId:string;userId:string;providerOperationId:string;amountMinor:number;currency:string;intentHash:string;
};
/**
 * Store only evidence already authenticated by a trusted provider adapter.
 * No provider calls, retries, or financial execution are performed.
 * Reconciliation is monotonic: a settled/failed record cannot be overwritten.
 */
export async function recordProviderReconciliation(
 pool:PgPool,expected:ExpectedSettlement,evidence:ProviderEvidence,
 audit:{authenticatedSource:string;evidenceDigest:string}
):Promise<'settled'|'failed'|'reconcile'|'conflict'>{
 if(!expected.commandId.trim()||!expected.userId.trim())throw new Error('invalid_command_id');
 if(!audit.authenticatedSource.trim()||!/^[a-f0-9]{64}$/.test(audit.evidenceDigest))
  throw new Error('invalid_authenticated_evidence');
 const decision=decideProviderReconciliation(expected,evidence);
 const db=await pool.connect();
 let tx=false;
 try{
  await db.query('BEGIN');tx=true;
  const existing=await db.query<{status:string;intent_hash:string;user_id:string}>(
   `select status,intent_hash,user_id from public.financial_command_outbox
    where command_id=$1 for update`,[expected.commandId]);
  if(existing.rows.length!==1||existing.rows[0].intent_hash!==expected.intentHash||existing.rows[0].user_id!==expected.userId){
   await db.query('ROLLBACK');tx=false;return 'conflict';
  }
  const status=existing.rows[0].status;
  if(status==='settled'||status==='acknowledged'||status==='failed'){
   await db.query('ROLLBACK');tx=false;return 'conflict';
  }
  if(status!=='reconcile'){
   await db.query('ROLLBACK');tx=false;return 'conflict';
  }
  // A provider acknowledgement is NOT a verified settlement.
  const next=decision==='settled'?'settled':decision==='failed'?'failed':'reconcile';
  const changed=await db.query(
   `update public.financial_command_outbox
    set status=$2,lease_expires_at=null,updated_at=clock_timestamp()
    where command_id=$1 and status='reconcile'`,[expected.commandId,next]);
  if(changed.rowCount!==1){
   await db.query('ROLLBACK');tx=false;return 'conflict';
  }
  await db.query(
   `insert into public.financial_provider_evidence
    (command_id,user_id,provider_operation_id,evidence_kind,decision,evidence_digest,authenticated_source)
    values ($1,$2,$3,$4,$5,$6,$7)`,
   [expected.commandId,expected.userId,evidence.kind==='unavailable'?'':evidence.providerOperationId,
    evidence.kind,decision,audit.evidenceDigest,audit.authenticatedSource]);
  await db.query('COMMIT');tx=false;
  return decision;
 }catch(e){if(tx)try{await db.query('ROLLBACK')}catch{};throw e}
 finally{db.release()}
}
