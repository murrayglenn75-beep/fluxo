import {describe,it,expect} from 'vitest';
import {quoteUsd} from '../lib/demo/exchange';
describe('illustrative currency quote',()=>{
 it('accepts localized BRL and rounds USD to cents',()=>{expect(quoteUsd('1.000,00')).toEqual({brl:100000,usd:18520});expect(quoteUsd('0.03')).toEqual({brl:3,usd:1});});
 it('rejects invalid and non-finite input',()=>{for(const amount of ['Infinity','1e309','0','-1','1.234'])expect(()=>quoteUsd(amount)).toThrow();});
});
