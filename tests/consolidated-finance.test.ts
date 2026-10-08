import {describe,expect,it} from 'vitest';
import {affordabilityAnswer} from '../lib/finance/assistant';
import {currencies} from '../lib/finance/money';
import {validateBalanced} from '../lib/finance/ledger';
import {toMinorUnits,fromMinorUnits} from '../lib/money/minorUnits';
import {canonicalRequest} from '../lib/idempotency/fingerprint';
import {parseCsvTransactions,fingerprintRows} from '../lib/importers/bank-import';
import {applyStatementImport} from '../lib/importers/reconcile';
import {accountSchema,initialAccount} from '../lib/demo/account';

describe('consolidated finance behavior',()=>{
 it('supports every v2 currency consistently in parsing and ledger validation',()=>{
   for(const currency of currencies){
     const amount=currency==='JPY'?'123':'123.45';
     expect(fromMinorUnits(toMinorUnits(amount,currency),currency)).toBe(amount);
     expect(validateBalanced({commandId:'cmd',idempotencyKey:'key',postings:[{accountId:'cash',currency,amountMinor:123n},{accountId:'merchant',currency,amountMinor:-123n}]})).toBe(true);
   }
 });
 it('rejects unsupported ledger currencies at runtime',()=>{
   expect(()=>validateBalanced({commandId:'cmd',idempotencyKey:'key',postings:[{accountId:'cash',currency:'BTC' as never,amountMinor:1n},{accountId:'merchant',currency:'BTC' as never,amountMinor:-1n}]})).toThrow('unsupported_currency');
 });
 it('does not invoke accessor properties in arrays when fingerprinting',()=>{
   const payload:number[]=[];
   Object.defineProperty(payload,'0',{get(){throw new Error('getter invoked');}});
   expect(()=>canonicalRequest(payload)).toThrow('accessors');
 });
 it('computes affordability from the current balance and unpaid bills',()=>{
   const answer=affordabilityAnswer('Can I afford R$ 200?',100000,[10000,5000]);
   expect(answer).toContain('500,00');expect(answer).toContain('fits');expect(answer).toContain('does not move money');
   expect(affordabilityAnswer('Can I afford R$ 600?',100000,[10000,5000])).toContain('exceeds');
 });
 it('keeps ordinary spending analysis out of the affordability route',()=>{
   expect(affordabilityAnswer('Analyze my spending this month',100000,[])).toBeNull();
   expect(affordabilityAnswer('How much can I spend this week?',100000,[])).toContain('650,00');
 });
 it('requires a valid, positive BRL proposal instead of treating malformed amounts as zero',()=>{
   for(const question of ['Can I afford a phone?','Can I afford R$ -100?','Can I afford R$ 1.001?','Can I afford R$ 1e3?'])expect(()=>affordabilityAnswer(question,100000,[])).toThrow();
 });
 it('imports valid history without changing financial controls or balances',async()=>{
   const rows=await fingerprintRows(parseCsvTransactions('date,description,amount\n2026-10-01,Imported deposit,123.45').rows);
   const result=applyStatementImport(initialAccount,rows);
   for(const key of ['balance','cards','paid','goals','requests','recipients'] as const)expect(result.account[key]).toEqual(initialAccount[key]);
   expect(result.account.activity[0].commandId).toBeUndefined();
   const restored=accountSchema.parse(JSON.parse(JSON.stringify(result.account)));
   expect(applyStatementImport(restored,rows).added).toBe(0);
 });
 it('enforces the 2 MB limit for multibyte pasted statements',()=>{
   expect(()=>parseCsvTransactions('é'.repeat(1_000_001))).toThrow('2 MB');
 });
});
