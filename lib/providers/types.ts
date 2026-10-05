export type ProviderCapability="PIX_IMMEDIATE"|"PIX_SCHEDULED"|"PIX_AUTOMATIC"|"STATEMENTS"|"WEBHOOKS";
export type PaymentIntent=Readonly<{id:string;userId:string;amountMinor:bigint;currency:"BRL";recipient:string;idempotencyKey:string}>;
export type ProviderEvidence=Readonly<{provider:string;providerRequestId:string;status:"accepted"|"rejected"|"pending";evidenceHash:string}>;
export interface PaymentProvider{name:string;capabilities():ReadonlySet<ProviderCapability>;createPix(intent:PaymentIntent):Promise<ProviderEvidence>;getPayment(providerRequestId:string):Promise<ProviderEvidence>}
