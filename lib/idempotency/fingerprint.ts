export function canonicalRequest(payload:unknown):string{
 const ancestors=new Set<object>();
 function encode(value:unknown,depth:number):string{
  if(depth>32)throw new Error('Request nesting is too deep.');
  if(value===null)return 'null';
  if(typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
  if(typeof value==='number'){if(!Number.isFinite(value))throw new Error('Request numbers must be finite.');return JSON.stringify(value);}
  if(typeof value!=='object')throw new Error('Request must contain JSON values only.');
  if(ancestors.has(value))throw new Error('Circular request.');
  ancestors.add(value);
  try{
   if(Array.isArray(value)){const items:string[]=[];for(let i=0;i<value.length;i++){if(!Object.hasOwn(value,i))throw new Error('Sparse arrays are unsupported.');const descriptor=Object.getOwnPropertyDescriptor(value,String(i))!;if(!('value' in descriptor))throw new Error('Request accessors are unsupported.');items.push(encode(descriptor.value,depth+1));}return `[${items.join(',')}]`;}
   if(Object.getPrototypeOf(value)!==Object.prototype&&Object.getPrototypeOf(value)!==null)throw new Error('Request must contain plain objects only.');
   return `{${Object.keys(value).sort().map(key=>{const descriptor=Object.getOwnPropertyDescriptor(value,key)!;if(!('value' in descriptor))throw new Error('Request accessors are unsupported.');return `${JSON.stringify(key)}:${encode(descriptor.value,depth+1)}`;}).join(',')}}`;
  }finally{ancestors.delete(value);}
 }
 const canonical=encode(payload,0);if(canonical.length>200000)throw new Error('Request is too large.');return canonical;
}
export async function requestFingerprint(payload:unknown){const bytes=new TextEncoder().encode(canonicalRequest(payload));const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');}
