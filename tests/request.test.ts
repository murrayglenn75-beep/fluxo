import {describe,it,expect} from 'vitest';
import {parseRequest} from '../lib/demo/request';
const request={id:'request-1',name:'Maria',key:'maria@fluxo.example',amount:2500,createdAt:'2026-10-05T03:00:00Z'};
const encode=(value:unknown)=>`fluxo-demo:${encodeURIComponent(JSON.stringify(value))}`;
describe('sandbox payment request import',()=>{
 it('preserves the recipient key and exact amount',()=>expect(parseRequest(encode(request))).toEqual(request));
 it('rejects unsupported, malformed and incomplete requests',()=>{for(const code of ['bank-code','fluxo-demo:%zz',encode({...request,key:''}),encode({...request,amount:1.5}),encode({...request,createdAt:'invalid'}),encode(null)])expect(()=>parseRequest(code)).toThrow();});
});
