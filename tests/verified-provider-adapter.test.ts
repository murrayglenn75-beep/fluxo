import {describe, expect, it, vi} from 'vitest';
import {reconcileThroughVerifiedAdapter} from '../lib/security/verified-provider-adapter';

const expected = {providerOperationId:'op-1',amountMinor:1000,currency:'BRL',intentHash:'hash-1'};
describe('runtime-neutral verified provider adapter', () => {
 it('accepts matching verified settlement', async () => {
  const lookupVerified=vi.fn().mockResolvedValue({kind:'settled',...expected});
  expect(await reconcileThroughVerifiedAdapter({lookupVerified},expected)).toEqual({status:'settled'});
  expect(lookupVerified).toHaveBeenCalledWith('op-1');
 });
 it('contains network failure without retrying submission', async () => {
  const lookupVerified=vi.fn().mockRejectedValue(new Error('network'));
  expect(await reconcileThroughVerifiedAdapter({lookupVerified},expected)).toEqual({status:'reconcile',reason:'provider_unavailable'});
  expect(lookupVerified).toHaveBeenCalledTimes(1);
 });
 it('quarantines mismatched settlement evidence', async () => {
  const lookupVerified=vi.fn().mockResolvedValue({kind:'settled',...expected,amountMinor:999});
  expect(await reconcileThroughVerifiedAdapter({lookupVerified},expected)).toEqual({status:'reconcile'});
 });
 it('rejects invalid expected payment before I/O', async () => {
  const lookupVerified=vi.fn();
  await expect(reconcileThroughVerifiedAdapter({lookupVerified},{...expected,amountMinor:0})).rejects.toThrow('invalid_expected_payment');
  expect(lookupVerified).not.toHaveBeenCalled();
 });
 it('quarantines malformed evidence', async () => {
  const lookupVerified=vi.fn().mockResolvedValue(null);
  expect(await reconcileThroughVerifiedAdapter({lookupVerified},expected)).toEqual({status:'reconcile',reason:'invalid_evidence'});
 });
});
