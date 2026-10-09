/**
 * Sandbox-only outbox lease and reconciliation state machine.
 * No provider transport is invoked. This module does not grant database access.
 */
export type OutboxStatus='pending'|'leased'|'acknowledged'|'settled'|'reconcile'|'failed';
export type OutboxRecord=Readonly<{
  commandId:string;userId:string;idempotencyKey:string;intentHash:string;
  status:OutboxStatus;attempts:number;leaseExpiresAt:string|null;
}>;
export type OutboxEvent=
  | {type:'lease';now:string}
  | {type:'lease_expired';now:string}
  | {type:'provider_ack'}
  | {type:'provider_timeout'}
  | {type:'provider_rejected'}
  | {type:'settlement_verified'};

export function transitionOutbox(record:OutboxRecord,event:OutboxEvent):OutboxRecord {
  if (!record.commandId || !record.userId || !record.idempotencyKey || !record.intentHash)
    throw new Error('invalid_outbox_identity');
  if (!Number.isSafeInteger(record.attempts)||record.attempts<0)
    throw new Error('invalid_attempt_count');
  switch(event.type){
    case 'lease':{
      if(record.status!=='pending') throw new Error('lease_not_allowed');
      const now=Date.parse(event.now);
      if(!Number.isFinite(now))throw new Error('invalid_lease_time');
      return {...record,status:'leased',attempts:record.attempts+1,
        leaseExpiresAt:new Date(now+30_000).toISOString()};
    }
    case 'lease_expired':{
      if(record.status!=='leased'||!record.leaseExpiresAt||
        !Number.isFinite(Date.parse(event.now))||
        Date.parse(event.now)<Date.parse(record.leaseExpiresAt))
        throw new Error('lease_not_expired');
      // Never blindly resend after a crash: provider may have received request.
      return {...record,status:'reconcile',leaseExpiresAt:null};
    }
    case 'provider_ack':
      if(record.status!=='leased')throw new Error('ack_not_allowed');
      return {...record,status:'acknowledged',leaseExpiresAt:null};
    case 'provider_timeout':
      if(record.status!=='leased')throw new Error('timeout_not_allowed');
      return {...record,status:'reconcile',leaseExpiresAt:null};
    case 'provider_rejected':
      if(record.status!=='leased')throw new Error('rejection_not_allowed');
      return {...record,status:'failed',leaseExpiresAt:null};
    case 'settlement_verified':
      // Acknowledgement alone never constitutes settlement.
      if(record.status!=='acknowledged'&&record.status!=='reconcile')
        throw new Error('settlement_not_allowed');
      return {...record,status:'settled',leaseExpiresAt:null};
  }
}
