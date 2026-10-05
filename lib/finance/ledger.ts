import type {Currency} from "./money";
export type Posting=Readonly<{accountId:string;amountMinor:bigint;currency:Currency}>;
export type LedgerCommand=Readonly<{commandId:string;idempotencyKey:string;postings:readonly Posting[]}>;
export function validateBalanced(command:LedgerCommand):true{if(!command.idempotencyKey.trim())throw new Error("idempotency_key_required");if(command.postings.length<2)throw new Error("insufficient_postings");const currencies=new Set(command.postings.map(p=>p.currency));if(currencies.size!==1)throw new Error("mixed_currency_entry");const sum=command.postings.reduce((n,p)=>n+p.amountMinor,0n);if(sum!==0n)throw new Error("unbalanced_entry");return true}
