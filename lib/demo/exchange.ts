import {parseMinor} from './account';

export const sandboxRates = {
  USD: {name:'US Dollar', symbol:'$', flag:'🇺🇸', perBrl:0.1852},
  EUR: {name:'Euro', symbol:'€', flag:'🇪🇺', perBrl:0.1589},
  GBP: {name:'British Pound', symbol:'£', flag:'🇬🇧', perBrl:0.1384},
  CAD: {name:'Canadian Dollar', symbol:'C$', flag:'🇨🇦', perBrl:0.2541},
  AUD: {name:'Australian Dollar', symbol:'A$', flag:'🇦🇺', perBrl:0.2817},
  JPY: {name:'Japanese Yen', symbol:'¥', flag:'🇯🇵', perBrl:27.42},
  CHF: {name:'Swiss Franc', symbol:'CHF', flag:'🇨🇭', perBrl:0.1478},
  CNY: {name:'Chinese Yuan', symbol:'¥', flag:'🇨🇳', perBrl:1.318},
} as const;

export type SandboxCurrency=keyof typeof sandboxRates;

export function quoteCurrency(text:string,currency:SandboxCurrency){
  const brl=parseMinor(text);
  const rate=sandboxRates[currency].perBrl;
  const targetMinor=Math.round((brl/100)*rate*100);
  if(!Number.isSafeInteger(targetMinor)||targetMinor<0) throw new Error('invalid_quote');
  return {brl,targetMinor,currency,rate};
}

export function quoteUsd(text:string){
  const quote=quoteCurrency(text,'USD');
  return {brl:quote.brl,usd:quote.targetMinor};
}
