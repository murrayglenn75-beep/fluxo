export const currencies=["BRL","USD","EUR","GBP","CAD","AUD","JPY","CHF","CNY"] as const;
export type Currency=(typeof currencies)[number];
export type Money=Readonly<{amountMinor:bigint;currency:Currency}>;
export function money(amountMinor:bigint,currency:Currency):Money{return {amountMinor,currency}}
export function add(a:Money,b:Money):Money{if(a.currency!==b.currency)throw new Error("currency_mismatch");return money(a.amountMinor+b.amountMinor,a.currency)}
