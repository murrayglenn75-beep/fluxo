import type {FinancialCommand,ServerApproval} from './server-financial-authority';
import type {FinancialCommandStore} from './financial-command-service';

/**
 * Test-only, single-process implementation. NOT a durable financial executor.
 * The synchronous claim section has no await, so concurrent promises in this
 * process cannot both transition a command from pending to claimed.
 * Production MUST replace this with a database transaction and row locking.
 */
export class SandboxAtomicCommandStore implements FinancialCommandStore {
  private readonly records = new Map<string,{command:FinancialCommand;approval:ServerApproval}>();
  private readonly claimed = new Set<string>();

  constructor(records:ReadonlyArray<{command:FinancialCommand;approval:ServerApproval}>) {
    for (const record of records) {
      if (this.records.has(record.command.id)) throw new Error('duplicate_command_id');
      this.records.set(record.command.id,record);
    }
  }

  async loadForOwner(commandId:string,userId:string) {
    const record=this.records.get(commandId);
    return record?.command.userId===userId ? record : null;
  }

  async claimApprovedCommand(input:{
    commandId:string;userId:string;idempotencyKey:string;intentHash:string;now:string;
  }):Promise<'claimed'|'already_claimed'|'conflict'> {
    const record=this.records.get(input.commandId);
    if (!record || record.command.userId!==input.userId ||
      record.command.idempotencyKey!==input.idempotencyKey ||
      record.command.intentHash!==input.intentHash ||
      record.approval.commandId!==input.commandId ||
      record.approval.userId!==input.userId ||
      record.approval.intentHash!==input.intentHash ||
      record.approval.approvedBy!==input.userId ||
      !Number.isFinite(Date.parse(input.now)) ||
      Date.parse(record.approval.expiresAt)<=Date.parse(input.now) ||
      Date.parse(record.approval.approvedAt)>Date.parse(input.now))
      return 'conflict';
    if (this.claimed.has(input.commandId)) return 'already_claimed';
    if (record.command.status!=='pending' && record.command.status!=='approved') return 'conflict';
    // No await between checking and claiming: one winner per JS event loop.
    this.claimed.add(input.commandId);
    return 'claimed';
  }

  claimCount():number {return this.claimed.size;}
}
