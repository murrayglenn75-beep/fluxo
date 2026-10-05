import {describe,it,expect} from 'vitest';
import {initialAccount,parseMinor,postPayment,accountSchema} from '../lib/demo/account';
const input={commandId:'command-1',name:'Maria',amount:1050,kind:'Send a Pix',createdAt:'2026-10-05T01:00:00Z'};
describe('persistent demo financial commands',()=>{
 it('parses BRL without floating point rounding',()=>{expect(parseMinor('1.234,56')).toBe(123456);expect(parseMinor('0.29')).toBe(29);expect(()=>parseMinor('1.234')).toThrow();expect(()=>parseMinor('1e5')).toThrow();});
 it('posts a receipt and deducts balance atomically',()=>{const next=postPayment(initialAccount,input);expect(next.balance).toBe(initialAccount.balance-1050);expect(next.activity[0].commandId).toBe(input.commandId);expect(accountSchema.safeParse(next).success).toBe(true);});
 it('does not charge twice when approval is repeated',()=>{const next=postPayment(initialAccount,input);expect(postPayment(next,input)).toBe(next);});
 it('rejects overdrafts and invalid amounts',()=>{expect(()=>postPayment(initialAccount,{...input,amount:initialAccount.balance+1})).toThrow();expect(()=>postPayment(initialAccount,{...input,amount:0})).toThrow();expect(()=>postPayment(initialAccount,{...input,amount:1.2})).toThrow();});
 it('does not allow paying the same bill twice',()=>{const next=postPayment(initialAccount,{...input,kind:'Pay bill'});expect(()=>postPayment(next,{...input,commandId:'other',kind:'Pay bill'})).toThrow('already paid');});
 it('rejects corrupted saved financial values',()=>{expect(accountSchema.safeParse({...initialAccount,balance:-1}).success).toBe(false);});
});
