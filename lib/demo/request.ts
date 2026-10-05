import {z} from 'zod';
export const requestSchema=z.object({id:z.string().min(1),name:z.string().trim().min(1).max(100),key:z.string().trim().min(1).max(100),amount:z.number().int().positive().safe(),createdAt:z.iso.datetime()});
export function parseRequest(code:string){
 if(code.length>10000||!code.startsWith('fluxo-demo:'))throw new Error('Paste a Fluxo demo request code. Bank Pix codes are not supported in sandbox.');
 try{return requestSchema.parse(JSON.parse(decodeURIComponent(code.slice(11))));}catch{throw new Error('Invalid request code.');}
}
