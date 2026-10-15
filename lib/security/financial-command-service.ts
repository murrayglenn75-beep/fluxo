import {authorizeFinancialCommand, type FinancialCommand, type ServerApproval} from './server-financial-authority';

/**
 * Sandbox command boundary. The store MUST atomically compare command status,
 * approval consumption and idempotency key in one database transaction.
 * Never implement claim() as separate read and write operations.
 */
export interface FinancialCommandStore {
  loadForOwner(commandId: string, userId: string): Promise<{
    command: FinancialCommand;
    approval: ServerApproval;
  } | null>;
  claimApprovedCommand(input: {
    commandId: string;
    userId: string;
    idempotencyKey: string;
    intentHash: string;
    now: string;
  }): Promise<'claimed' | 'already_claimed' | 'conflict'>;
}

export type CommandClaimResult =
  | {status: 'claimed'; commandId: string}
  | {status: 'already_claimed'; commandId: string};

export async function claimSandboxFinancialCommand(
  store: FinancialCommandStore,
  input: {commandId: string; authenticatedUserId: string; idempotencyKey: string; now?: string}
): Promise<CommandClaimResult> {
  const {commandId, authenticatedUserId, idempotencyKey} = input;
  if (!commandId.trim() || !authenticatedUserId.trim() || !idempotencyKey.trim())
    throw new Error('invalid_command_request');
  const now = input.now ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(now))) throw new Error('invalid_request_time');

  const record = await store.loadForOwner(commandId, authenticatedUserId);
  if (!record) throw new Error('command_not_found');
  if (record.command.id !== commandId) throw new Error('command_id_mismatch');
  if (record.command.idempotencyKey !== idempotencyKey)
    throw new Error('idempotency_key_mismatch');

  const approved = authorizeFinancialCommand(
    record.command, record.approval, authenticatedUserId, now
  );
  const result = await store.claimApprovedCommand({
    commandId: approved.id,
    userId: authenticatedUserId,
    idempotencyKey,
    intentHash: approved.intentHash,
    now
  });
  if (result === 'conflict') throw new Error('atomic_claim_conflict');
  return {status: result, commandId: approved.id};
}
