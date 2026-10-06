import {describe,it,expect} from 'vitest';
import {quoteCurrency,quoteUsd,sandboxRates} from '../lib/demo/exchange';

describe('illustrative deterministic currency quote',()=>{
  it('accepts localized BRL and rounds USD to cents',()=>{
    expect(quoteUsd('1.000,00')).toEqual({brl:100000,usd:18520});
    expect(quoteUsd('0.03')).toEqual({brl:3,usd:1});
  });

  it('uses zero minor units for JPY',()=>{
    expect(quoteCurrency('1,00','JPY')).toEqual({brl:100,targetMinor:27,currency:'JPY',minorUnits:0});
    expect(quoteCurrency('100,00','JPY').targetMinor).toBe(2742);
  });

  it('uses integer rate ratios for every supported currency',()=>{
    for(const rate of Object.values(sandboxRates)){
      expect(typeof rate.numerator).toBe('bigint');
      expect(typeof rate.denominator).toBe('bigint');
      expect([0,2]).toContain(rate.minorUnits);
    }
  });

  it('rejects invalid and non-finite input',()=>{
    for(const amount of ['Infinity','1e309','0','-1','1.234']) expect(()=>quoteUsd(amount)).toThrow();
  });
});
