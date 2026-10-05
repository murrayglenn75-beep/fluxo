export type PaymentIntentData=Readonly<{
  commandId:string;
  name:string;
  amount:number;
  key?:string;
  description?:string;
  kind:string;
}>;

function canonical(value:string|undefined){
  return (value??'').trim();
}

export function canonicalPaymentIntent(intent:PaymentIntentData):string{
  if(!intent.commandId.trim())throw new Error('invalid_command_id');
  if(!intent.name.trim())throw new Error('invalid_recipient');
  if(!Number.isSafeInteger(intent.amount)||intent.amount<=0)
    throw new Error('invalid_amount');

  return JSON.stringify({
    commandId:intent.commandId.trim(),
    name:intent.name.trim(),
    amount:intent.amount,
    key:canonical(intent.key),
    description:canonical(intent.description),
    kind:intent.kind.trim(),
  });
}

export async function hashPaymentIntent(intent:PaymentIntentData):Promise<string>{
  const bytes=new TextEncoder().encode(canonicalPaymentIntent(intent));
  const digest=await crypto.subtle.digest('SHA-256',bytes);

  return 'sha256:'+Array.from(new Uint8Array(digest))
    .map(byte=>byte.toString(16).padStart(2,'0'))
    .join('');
}
