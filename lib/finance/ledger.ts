import {currencies,type Currency} from "./money";
export type Posting=Readonly<{accountId:string;amountMinor:bigint;currency:Currency}>;
export type LedgerCommand=Readonly<{commandId:string;idempotencyKey:string;postings:readonly Posting[]}>;
export function validateBalanced(command:LedgerCommand):true{
 if(!command.commandId.trim())throw new Error('command_id_required');
 if(!command.idempotencyKey.trim())throw new Error('idempotency_key_required');
 if(command.postings.length<2)throw new Error('insufficient_postings');
 for(const p of command.postings){if(!p.accountId.trim())throw new Error('account_id_required');if(!(currencies as readonly string[]).includes(p.currency))throw new Error('unsupported_currency');if(typeof p.amountMinor!=='bigint'||p.amountMinor===0n||p.amountMinor<-9223372036854775808n||p.amountMinor>9223372036854775807n)throw new Error('invalid_posting_amount');}
 const postedCurrencies=new Set(command.postings.map(p=>p.currency));if(postedCurrencies.size!==1)throw new Error('mixed_currency_entry');
 const sum=command.postings.reduce((n,p)=>n+p.amountMinor,0n);if(sum!==0n)throw new Error('unbalanced_entry');return true;
}
