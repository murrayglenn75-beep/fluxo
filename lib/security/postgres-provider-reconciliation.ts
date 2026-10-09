import type {PgPool} from './postgres-command-claim';
import {decideProviderReconciliation,type ProviderEvidence} from './provider-reconciliation';

export type ExpectedSettlement={
 commandId:string;providerOperationId:string;amountMinor:number;currency:string;intentHash:string;
};
/**
 * Store only evidence already authenticated by a trusted provider adapter.
 * No provider calls, retries, or financial execution are performed.
 * Reconciliation is monotonic: a settled/failed record cannot be overwritten.
 */
export async function recordProviderReconciliation(
 pool:PgPool,expected:ExpectedSettlement,evidence:ProviderEvidence
):Promise<'settled'|'failed'|'reconcile'|'conflict'>{
 if(!expected.commandId.trim())throw new Error('invalid_command_id');
 const decision=decideProviderReconciliation(expected,evidence);
 const db=await pool.connect();
 let tx=false;
 try{
  await db.query('BEGIN');tx=true;
  const existing=await db.query<{status:string;intent_hash:string}>(
   `select status,intent_hash from public.financial_command_outbox
    where command_id=$1 for update`,[expected.commandId]);
  if(existing.rows.length!==1||existing.rows[0].intent_hash!==expected.intentHash){
   await db.query('ROLLBACK');tx=false;return 'conflict';
  }
  const status=existing.rows[0].status;
  if(status==='acknowledged'||status==='failed'){
   await db.query('ROLLBACK');tx=false;return 'conflict';
  }
  if(status!=='reconcile'){
   await db.query('ROLLBACK');tx=false;return 'conflict';
  }
  // A settled outcome is recorded as acknowledged by the current draft schema.
  // Separate settlement ledger and provider evidence audit are future requirements.
  const next=decision==='settled'?'acknowledged':decision==='failed'?'failed':'reconcile';
  const changed=await db.query(
   `update public.financial_command_outbox
    set status=$2,lease_expires_at=null,updated_at=clock_timestamp()
    where command_id=$1 and status='reconcile'`,[expected.commandId,next]);
  if(changed.rowCount!==1){
   await db.query('ROLLBACK');tx=false;return 'conflict';
  }
  await db.query('COMMIT');tx=false;
  return decision;
 }catch(e){if(tx)try{await db.query('ROLLBACK')}catch{};throw e}
 finally{db.release()}
}
