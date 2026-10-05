import {accountSchema,parseMinor,type Account,type Transaction} from './account';
export function trackedSavings(text:string){return /^0(?:[.,]0{1,2})?$/.test(text.trim())?0:parseMinor(text);}
export function parseBackup(text:string){if(text.length>2_000_000)throw new Error('Backup must be smaller than 2 MB.');try{return accountSchema.parse(JSON.parse(text));}catch{throw new Error('This file is not a valid Fluxo sandbox backup.');}}
export function recordExpense(account:Account,input:{id:string;merchant:string;amount:number;category:string;date:string;filename?:string}):Account{
 if(account.activity.some(t=>t.id===input.id))return account;
 if(!input.id||!input.merchant.trim()||!Number.isSafeInteger(input.amount)||input.amount<=0||!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||!Number.isFinite(Date.parse(input.date)))throw new Error('Enter valid expense details.');
 if(new Date(input.date).toISOString().slice(0,10)!==input.date||!['Housing','Food','Transport','Subscriptions','Health','Shopping','Other'].includes(input.category))throw new Error('Enter a valid date and category.');
 const transaction:Transaction={id:input.id,name:input.merchant.trim(),amount:-input.amount,date:input.date,createdAt:input.date+'T12:00:00Z',kind:'Recorded expense',description:input.filename?`Receipt: ${input.filename}`:'Manually recorded expense',category:input.category,icon:'bills',tone:'orange'};
 return {...account,activity:[transaction,...account.activity]};
}
