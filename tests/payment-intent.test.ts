import {describe,expect,it} from 'vitest';
import {
  canonicalPaymentIntent,
  hashPaymentIntent
} from '../lib/security/payment-intent';

const intent={
  commandId:'command-1',
  name:'Maria',
  amount:1050,
  key:'maria@fluxo.example',
  description:'Lunch',
  kind:'Send a Pix'
};

describe('payment intent binding',()=>{
  it('creates the same canonical intent for harmless surrounding whitespace',()=>{
    expect(canonicalPaymentIntent({
      ...intent,
      name:'  Maria  ',
      key:' maria@fluxo.example ',
      description:' Lunch '
    })).toBe(canonicalPaymentIntent(intent));
  });

  it('changes the hash when the amount changes',async()=>{
    expect(await hashPaymentIntent(intent))
      .not.toBe(await hashPaymentIntent({...intent,amount:2050}));
  });

  it('changes the hash when the recipient changes',async()=>{
    expect(await hashPaymentIntent(intent))
      .not.toBe(await hashPaymentIntent({...intent,name:'Attacker'}));
  });

  it('changes the hash when the recipient key changes',async()=>{
    expect(await hashPaymentIntent(intent))
      .not.toBe(await hashPaymentIntent({...intent,key:'attacker@example.test'}));
  });

  it('changes the hash when the command id changes',async()=>{
    expect(await hashPaymentIntent(intent))
      .not.toBe(await hashPaymentIntent({...intent,commandId:'command-2'}));
  });

  it('rejects invalid financial intents',async()=>{
    await expect(hashPaymentIntent({...intent,amount:0})).rejects.toThrow();
    await expect(hashPaymentIntent({...intent,commandId:' '})).rejects.toThrow();
    await expect(hashPaymentIntent({...intent,name:' '})).rejects.toThrow();
  });
});
