import {parseMinor} from './account';
export function quoteUsd(text:string){const brl=parseMinor(text);const usd=Number((BigInt(brl)*1852n+5000n)/10000n);return{brl,usd};}
