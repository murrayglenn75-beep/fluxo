import {parseMinor} from './account';

export const sandboxRates = {
  USD: {name:'US Dollar',symbol:'$',flag:'🇺🇸',numerator:1852n,denominator:10000n,minorUnits:2},
  EUR: {name:'Euro',symbol:'€',flag:'🇪🇺',numerator:1589n,denominator:10000n,minorUnits:2},
  GBP: {name:'British Pound',symbol:'£',flag:'🇬🇧',numerator:1384n,denominator:10000n,minorUnits:2},
  CAD: {name:'Canadian Dollar',symbol:'C$',flag:'🇨🇦',numerator:2541n,denominator:10000n,minorUnits:2},
  AUD: {name:'Australian Dollar',symbol:'A$',flag:'🇦🇺',numerator:2817n,denominator:10000n,minorUnits:2},
  JPY: {name:'Japanese Yen',symbol:'¥',flag:'🇯🇵',numerator:2742n,denominator:100n,minorUnits:0},
  CHF: {name:'Swiss Franc',symbol:'CHF',flag:'🇨🇭',numerator:1478n,denominator:10000n,minorUnits:2},
  CNY: {name:'Chinese Yuan',symbol:'¥',flag:'🇨🇳',numerator:1318n,denominator:1000n,minorUnits:2},
} as const;

export type SandboxCurrency=keyof typeof sandboxRates;

function pow10(n:number){return 10n**BigInt(n);}
function roundRatio(numerator:bigint,denominator:bigint){
  if(numerator<0n||denominator<=0n) throw new Error('invalid_quote');
  return (numerator+denominator/2n)/denominator;
}

export function quoteCurrency(text:string,currency:SandboxCurrency){
  const brl=parseMinor(text);
  const rate=sandboxRates[currency];
  const target=roundRatio(BigInt(brl)*rate.numerator*pow10(rate.minorUnits),100n*rate.denominator);
  if(target>BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('invalid_quote');
  return {brl,targetMinor:Number(target),currency,minorUnits:rate.minorUnits};
}

export function quoteUsd(text:string){
  const quote=quoteCurrency(text,'USD');
  return {brl:quote.brl,usd:quote.targetMinor};
}
