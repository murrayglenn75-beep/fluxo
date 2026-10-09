/**
 * Trusted-server PostgreSQL transaction adapter. Requires a transaction-capable
 * driver connection; do not use separate Supabase REST calls for this operation.
 * No connection is created here and this module must never be imported client-side.
 */
export interface PgTransaction {
  query<T extends Record<string,unknown>>(sql:string,values?:readonly unknown[]):Promise<{rows:T[];rowCount:number|null}>;
}
export interface PgPool {
  connect():Promise<{query:PgTransaction['query'];release():void}>;
}
export type DurableClaim='claimed'|'already_claimed'|'conflict';

type CommandRow={id:string;user_id:string;idempotency_key:string;intent_hash:string;status:string;payment_intent_id:string|null};
type ApprovalRow={user_id:string;command_id:string;approved_by:string;intent_hash:string;consumed_at:string|null;valid:boolean};
type IntentRow={id:string;user_id:string;request_fingerprint:string};

/**
 * Claims an already-created command and approval. The caller MUST supply an
 * authenticated principal established by trusted server middleware.
 *
 * This is a claim/outbox transaction, NOT a provider payment or settlement.
 * The provider worker and recovery/reconciliation process remain unimplemented.
 */
export async function claimDurableFinancialCommand(
  pool:PgPool,
  input:{commandId:string;authenticatedUserId:string;idempotencyKey:string;intentHash:string}
):Promise<DurableClaim>{
  const {commandId,authenticatedUserId,idempotencyKey,intentHash}=input;
  if (![commandId,authenticatedUserId,idempotencyKey,intentHash].every(x=>typeof x==='string'&&x.trim()))
    throw new Error('invalid_command_request');
  const db=await pool.connect();
  let inTransaction=false;
  try {
    await db.query('BEGIN');
    inTransaction=true;
    // Lock the command before inspecting mutable status, serializing contenders.
    const commands=await db.query<CommandRow>(
      `select id,user_id,idempotency_key,intent_hash,status,payment_intent_id
       from public.financial_commands where id=$1 and user_id=$2 for update`,
      [commandId,authenticatedUserId]);
    if (commands.rows.length!==1) return await rollbackConflict(db);
    const command=commands.rows[0];
    if (command.idempotency_key!==idempotencyKey || command.intent_hash!==intentHash)
      return await rollbackConflict(db);
    if (command.status==='executing' || command.status==='executed') {
      await db.query('COMMIT');inTransaction=false;
      return 'already_claimed';
    }
    if (command.status!=='pending' && command.status!=='approved')
      return await rollbackConflict(db);

    const approvals=await db.query<ApprovalRow>(
      `select user_id,command_id,approved_by,intent_hash,consumed_at,
       (approved_at <= clock_timestamp() and expires_at > clock_timestamp()
        and approved_at >= clock_timestamp() - interval '5 minutes') as valid
       from public.financial_approvals
       where command_id=$1 and user_id=$2 for update`,
      [commandId,authenticatedUserId]);
    if (approvals.rows.length!==1) return await rollbackConflict(db);
    const approval=approvals.rows[0];
    if (approval.command_id!==commandId || approval.user_id!==authenticatedUserId ||
      approval.approved_by!==authenticatedUserId || approval.intent_hash!==intentHash ||
      approval.consumed_at!==null || approval.valid!==true)
      return await rollbackConflict(db);

    if (command.payment_intent_id!==null) {
      const intents=await db.query<IntentRow>(
        `select id,user_id,request_fingerprint from public.payment_intents
         where id=$1 and user_id=$2 for update`,
        [command.payment_intent_id,authenticatedUserId]);
      if (intents.rows.length!==1 || intents.rows[0].request_fingerprint!==intentHash)
        return await rollbackConflict(db);
    }

    const consumed=await db.query(
      `update public.financial_approvals set consumed_at=clock_timestamp()
       where command_id=$1 and user_id=$2 and consumed_at is null
       and expires_at > clock_timestamp()
       and approved_at <= clock_timestamp()
       and approved_at >= clock_timestamp()-interval '5 minutes'`,
      [commandId,authenticatedUserId]);
    if (consumed.rowCount!==1) return await rollbackConflict(db);
    const updated=await db.query(
      `update public.financial_commands set status='executing'
       where id=$1 and user_id=$2 and status in ('pending','approved')`,
      [commandId,authenticatedUserId]);
    if (updated.rowCount!==1) return await rollbackConflict(db);

    // Outbox table is intentionally not invented here. This claim MUST NOT be
    // connected to provider submission until an outbox is inserted atomically.
    await db.query('COMMIT');inTransaction=false;
    return 'claimed';
  } catch (error) {
    if (inTransaction) {try {await db.query('ROLLBACK');} catch {/* preserve original error */}}
    throw error;
  } finally {db.release();}
}

async function rollbackConflict(db:PgTransaction):Promise<'conflict'>{
  await db.query('ROLLBACK');
  return 'conflict';
}
