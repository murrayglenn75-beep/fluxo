import { z } from 'zod';
export const transactionSchema=z.object({id:z.string(),name:z.string(),date:z.string(),amount:z.number().int().safe(),icon:z.string(),tone:z.string(),createdAt:z.string().optional(),description:z.string().optional(),kind:z.string().optional(),recipientKey:z.string().optional(),commandId:z.string().optional()});
const cardSchema=z.object({name:z.string().min(1).max(40),lastFour:z.string().regex(/^\d{4}$/),virtual:z.boolean(),frozen:z.boolean(),limit:z.number().int().nonnegative().safe().default(500000),used:z.number().int().nonnegative().safe().default(0)});
export const accountSchema=z.object({version:z.literal(2),balance:z.number().int().nonnegative().safe(),hidden:z.boolean(),activity:z.array(transactionSchema),cards:z.array(cardSchema),selectedCard:z.number().int().nonnegative().default(0),connected:z.array(z.string()),goals:z.array(z.object({name:z.string(),amount:z.number().int().positive().safe()})),paid:z.array(z.string()),messages:z.array(z.object({question:z.string(),answer:z.string()})),profile:z.object({name:z.string(),email:z.string(),pixKey:z.string(),onboarded:z.boolean()}),recipients:z.array(z.object({name:z.string(),key:z.string()})),requests:z.array(z.object({id:z.string(),name:z.string(),key:z.string(),amount:z.number().int().positive().safe(),createdAt:z.string()})),budgetLimits:z.record(z.string(),z.number().int().positive().safe())});
export type Transaction=z.infer<typeof transactionSchema>;
export type Account=z.infer<typeof accountSchema>;
export const initialActivity:Transaction[]=[{id:'salary',name:'Salary',date:'Today',amount:825000,icon:'up',tone:'mint'},{id:'market',name:'Supermercado',date:'Yesterday',amount:-15632,icon:'cart',tone:'pink'},{id:'uber',name:'Uber',date:'Yesterday',amount:-4280,icon:'Uber',tone:'black'},{id:'netflix',name:'Netflix',date:'Oct 2',amount:-3990,icon:'N',tone:'red'},{id:'savings',name:'Transfer to Savings',date:'Oct 1',amount:-100000,icon:'transfer',tone:'blue'},{id:'restaurant',name:'Restaurante',date:'Oct 1',amount:-9870,icon:'bills',tone:'orange'},{id:'freelance',name:'Freelance',date:'Oct 1',amount:75000,icon:'cards',tone:'mint'}];
export const initialAccount:Account={version:2,selectedCard:0,balance:1248032,hidden:false,activity:initialActivity,cards:[{name:'Nubank',lastFour:'4242',virtual:false,frozen:false,limit:500000,used:252000}],connected:[],goals:[],paid:[],messages:[],profile:{name:'João Silva',email:'joao@fluxo.app',pixKey:'joao@fluxo.example',onboarded:false},recipients:[{name:'Maria Souza',key:'maria@fluxo.example'},{name:'João Pereira',key:'joao.p@fluxo.example'},{name:'Utilities',key:'pix@company.example'}],requests:[],budgetLimits:{Housing:208000,Food:117000,Transport:78000,Subscriptions:65000}};
export function parseMinor(text:string):number{
 const clean=text.trim().replace(/^R\$\s*/, '');
 let normalized=clean;
 if(clean.includes(',')){if(!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(clean))throw new Error('Enter an amount with at most two decimal places.');normalized=clean.replace(/\./g,'').replace(',','.');}
 else if(!/^\d+(?:\.\d{1,2})?$/.test(clean))throw new Error('Enter an amount with at most two decimal places.');
 const [whole,fraction='']=normalized.split('.');const value=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!Number.isSafeInteger(value)||value<=0)throw new Error('Enter a positive, valid amount.');return value;
}
export type PaymentInput={commandId:string;name:string;key?:string;amount:number;kind:string;description?:string;createdAt:string};
export function postPayment(account:Account,input:PaymentInput):Account{
 if(account.activity.some(t=>t.commandId===input.commandId))return account;
 if(!input.name.trim()||!input.commandId||!Number.isSafeInteger(input.amount)||input.amount<=0)throw new Error('Invalid payment details.');
 if(input.amount>account.balance)throw new Error('This amount exceeds your available balance.');
 if(input.kind==='Pay bill'&&account.paid.includes(input.name))throw new Error('This bill is already paid.');
 const transaction:Transaction={id:input.commandId,commandId:input.commandId,name:input.name.trim(),recipientKey:input.key,amount:-input.amount,kind:input.kind,description:input.description,date:'Just now',createdAt:input.createdAt,icon:input.kind==='Pay bill'?'bills':'pix',tone:'mint'};
 return {...account,balance:account.balance-input.amount,activity:[transaction,...account.activity],paid:input.kind==='Pay bill'?[...account.paid,input.name]:account.paid};
}
