import {decideProviderReconciliation, type ProviderEvidence, type ReconcileDecision} from './provider-reconciliation';

/**
 * Runtime-neutral reconciliation boundary. Inject transport and authentication
 * from a trusted worker. No fetch, process.env, Deno, or provider secrets here.
 * A returned provider payload is not trustworthy until the adapter verifies it.
 */
export interface VerifiedProviderStatusAdapter {
  lookupVerified(operationId: string): Promise<ProviderEvidence>;
}

export type ExpectedProviderPayment = {
  providerOperationId: string;
  amountMinor: number;
  currency: string;
  intentHash: string;
};

export type ReconciliationOutcome =
  | {status: 'settled' | 'failed' | 'reconcile'}
  | {status: 'reconcile'; reason: 'provider_unavailable' | 'invalid_evidence'};

export async function reconcileThroughVerifiedAdapter(
  adapter: VerifiedProviderStatusAdapter,
  expected: ExpectedProviderPayment
): Promise<ReconciliationOutcome> {
  // Validate expected identity before touching a provider.
  const validate: ReconcileDecision = decideProviderReconciliation(expected, {kind: 'unavailable'});
  if (validate !== 'reconcile') throw new Error('unexpected_reconciliation_state');
  try {
    const evidence = await adapter.lookupVerified(expected.providerOperationId);
    if (!evidence || typeof evidence !== 'object' || !('kind' in evidence))
      return {status: 'reconcile', reason: 'invalid_evidence'};
    return {status: decideProviderReconciliation(expected, evidence)};
  } catch {
    // Never resubmit a payment after an ambiguous provider lookup.
    return {status: 'reconcile', reason: 'provider_unavailable'};
  }
}
