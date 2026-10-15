import type {Currency} from '../finance/money';
export type MoneyCurrency=Currency;
const scales:Record<MoneyCurrency,number>={BRL:2,USD:2,EUR:2,GBP:2,CAD:2,AUD:2,JPY:0,CHF:2,CNY:2};
function scale(currency:MoneyCurrency){if(!Object.hasOwn(scales,currency))throw new Error('Unsupported currency.');return scales[currency];}
export function toMinorUnits(amount:string|number,currency:MoneyCurrency):bigint{
 const decimals=scale(currency),text=String(amount).trim();
 if(text.length>128||! /^-?\d+(?:\.\d+)?$/.test(text))throw new Error('Invalid decimal amount.');
 const negative=text.startsWith('-'),[whole,fraction='']=(negative?text.slice(1):text).split('.');
 if(fraction.length>decimals)throw new Error('Unsupported monetary precision.');
 const result=BigInt(whole)*10n**BigInt(decimals)+BigInt(fraction.padEnd(decimals,'0')||'0');
 return negative?-result:result;
}
export function fromMinorUnits(amount:bigint,currency:MoneyCurrency):string{
 const decimals=scale(currency);if(decimals===0)return amount.toString();
 const negative=amount<0n,value=negative?-amount:amount,base=10n**BigInt(decimals);
 return `${negative?'-':''}${value/base}.${(value%base).toString().padStart(decimals,'0')}`;
}
