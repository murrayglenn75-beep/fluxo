import {describe,it,expect} from 'vitest';
import {decideProviderReconciliation as decide} from '../lib/security/provider-reconciliation';
const expected={providerOperationId:'provider-op-1',amountMinor:2500,currency:'BRL',intentHash:'hash-a'};
describe('provider reconciliation fail-closed policy',()=>{
 it('accepts only exact verified settlement evidence',()=>{
  expect(decide(expected,{kind:'settled',...expected})).toBe('settled');
 });
 it('never resubmits on provider outage, pending or not found',()=>{
  expect(decide(expected,{kind:'unavailable'})).toBe('reconcile');
  expect(decide(expected,{kind:'pending',providerOperationId:'provider-op-1'})).toBe('reconcile');
  expect(decide(expected,{kind:'not_found',providerOperationId:'provider-op-1'})).toBe('reconcile');
 });
 it('fails closed on mismatched operation ID, amount, currency or hash',()=>{
  for(const patch of [
   {providerOperationId:'other'},
   {amountMinor:2499},
   {currency:'USD'},
   {intentHash:'tampered'}
  ]){
   expect(decide(expected,{kind:'settled',...expected,...patch})).toBe('reconcile');
  }
 });
 it('accepts explicit provider rejection only with matched ID and reason',()=>{
  expect(decide(expected,{kind:'rejected',providerOperationId:'provider-op-1',reason:'declined'})).toBe('failed');
  expect(decide(expected,{kind:'rejected',providerOperationId:'other',reason:'declined'})).toBe('reconcile');
  expect(decide(expected,{kind:'rejected',providerOperationId:'provider-op-1',reason:''})).toBe('reconcile');
 });
 it('rejects invalid expected identity and amounts',()=>{
  expect(()=>decide({...expected,amountMinor:0},{kind:'unavailable'})).toThrow('invalid_expected_payment');
  expect(()=>decide({...expected,providerOperationId:''},{kind:'unavailable'})).toThrow('invalid_expected_payment');
 });
});
