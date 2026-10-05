import {describe,it,expect} from 'vitest';
import {initialAccount,accountSchema} from '../lib/demo/account';
import {parseBackup,recordExpense,trackedSavings} from '../lib/demo/extensions';
const expense={id:'receipt-1',merchant:'Lunch',amount:3500,category:'Food',date:'2026-10-05'};
describe('local sandbox extensions',()=>{
 it('records an expense once without executing a payment',()=>{const next=recordExpense(initialAccount,expense);expect(next.balance).toBe(initialAccount.balance);expect(next.activity[0].amount).toBe(-3500);expect(next.activity[0].category).toBe('Food');expect(recordExpense(next,expense)).toBe(next);expect(accountSchema.safeParse(next).success).toBe(true);});
 it('rejects invalid receipt amounts and calendar dates',()=>{expect(()=>recordExpense(initialAccount,{...expense,amount:0})).toThrow();expect(()=>recordExpense(initialAccount,{...expense,date:'2026-02-30'})).toThrow();});
 it('validates backups and upgrades old goal progress',()=>{const backup=parseBackup(JSON.stringify({...initialAccount,goals:[{name:'Trip',amount:50000}]}));expect(backup.goals[0].saved).toBe(0);expect(()=>parseBackup('{broken')).toThrow();expect(()=>parseBackup(JSON.stringify({...initialAccount,balance:-1}))).toThrow();});
 it('validates tracked savings against goal targets',()=>{expect(trackedSavings('0,00')).toBe(0);expect(trackedSavings('20,50')).toBe(2050);expect(accountSchema.safeParse({...initialAccount,goals:[{name:'Trip',amount:50000,saved:50001}]}).success).toBe(false);});
});
