// Trusted-worker PostgreSQL lease and recovery primitives.
// No provider requests are made here. The worker must reconcile uncertain outcomes.
import type {PgPool} from './postgres-command-claim';

export async function leaseNextOutbox(pool:PgPool,now:string,seconds=30){
 if(!Number.isFinite(Date.parse(now))||!Number.isSafeInteger(seconds)||seconds<1||seconds>300)
   throw new Error('invalid_lease_request');
 const db=await pool.connect();
 let tx=false;
 try{
  await db.query('BEGIN');tx=true;
  // Skip already-locked records; multiple workers can safely claim distinct jobs.
  const result=await db.query<{command_id:string;user_id:string;idempotency_key:string;intent_hash:string;attempts:number}>(
   `with selected as (
      select id from public.financial_command_outbox
      where status='pending'
      order by created_at,id for update skip locked limit 1
     )
     update public.financial_command_outbox o
     set status='leased',attempts=attempts+1,
         lease_expires_at=$1::timestamptz + ($2::integer * interval '1 second'),
         updated_at=clock_timestamp()
     from selected where o.id=selected.id
     returning o.command_id,o.user_id,o.idempotency_key,o.intent_hash,o.attempts`,
   [now,seconds]);
  await db.query('COMMIT');tx=false;
  return result.rows[0]??null;
 }catch(e){if(tx)try{await db.query('ROLLBACK')}catch{};throw e}
 finally{db.release()}
}

export async function reconcileExpiredLeases(pool:PgPool,now:string){
 if(!Number.isFinite(Date.parse(now)))throw new Error('invalid_recovery_time');
 const db=await pool.connect();
 try{
  const result=await db.query<{command_id:string}>(
   `update public.financial_command_outbox
    set status='reconcile',lease_expires_at=null,updated_at=clock_timestamp()
    where status='leased' and lease_expires_at<=$1::timestamptz
    returning command_id`,[now]);
  return result.rows.map(x=>x.command_id);
 }finally{db.release()}
}

export async function markOutboxTimeout(pool:PgPool,commandId:string){
 if(!commandId.trim())throw new Error('invalid_command_id');
 const db=await pool.connect();
 try{
  const result=await db.query(
   `update public.financial_command_outbox
    set status='reconcile',lease_expires_at=null,updated_at=clock_timestamp()
    where command_id=$1 and status='leased'`,[commandId]);
  return result.rowCount===1;
 }finally{db.release()}
}
