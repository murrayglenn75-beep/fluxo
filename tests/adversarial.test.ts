import { describe, expect, it } from 'vitest';
import {
  accountSchema,
  initialAccount,
  parseMinor,
  postPayment,
} from '../lib/demo/account';
import { parseBackup, recordExpense } from '../lib/demo/extensions';
import { validateBalanced } from '../lib/finance/ledger';
import { requireApproval } from '../lib/security/financial-command';

const payment = {
  commandId: 'attack-command',
  name: 'Maria',
  key: 'maria@fluxo.example',
  amount: 1000,
  kind: 'Send a Pix',
  description: 'test',
  createdAt: '2026-10-05T03:00:00Z',
};

describe('Fluxo adversarial financial boundaries', () => {
  it('rejects unsafe and malformed payment amounts', () => {
    for (const amount of [
      0,
      -1,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      expect(() =>
        postPayment(initialAccount, { ...payment, amount }),
      ).toThrow();
    }
  });

  it('does not allow an exact replay to debit twice', () => {
    const once = postPayment(initialAccount, payment);
    const twice = postPayment(once, payment);

    expect(twice).toBe(once);
    expect(twice.balance).toBe(initialAccount.balance - payment.amount);
  });

  it('rejects command-id reuse with altered recipient', () => {
    const once = postPayment(initialAccount, payment);

    expect(() =>
      postPayment(once, {
        ...payment,
        name: 'Attacker',
        key: 'attacker@example.test',
      }),
    ).toThrow('different details');
  });

  it('rejects command-id reuse with altered payment type', () => {
    const once = postPayment(initialAccount, payment);

    expect(() =>
      postPayment(once, {
        ...payment,
        kind: 'Transfer',
      }),
    ).toThrow('different details');
  });

  it('rejects command-id reuse with altered description', () => {
    const once = postPayment(initialAccount, payment);

    expect(() =>
      postPayment(once, {
        ...payment,
        description: 'changed after approval',
      }),
    ).toThrow('different details');
  });

  it('allows spending the exact available balance but not one cent more', () => {
    const emptied = postPayment(initialAccount, {
      ...payment,
      commandId: 'exact-balance',
      amount: initialAccount.balance,
    });

    expect(emptied.balance).toBe(0);

    expect(() =>
      postPayment(initialAccount, {
        ...payment,
        commandId: 'over-balance',
        amount: initialAccount.balance + 1,
      }),
    ).toThrow('exceeds');
  });

  it('rejects suspicious money parser inputs', () => {
    const attacks = [
      '',
      ' ',
      '-1',
      '+1',
      '1e3',
      'Infinity',
      'NaN',
      '1.001',
      '0x10',
      '1,234.56',
    ];

    for (const value of attacks) {
      expect(() => parseMinor(value)).toThrow();
    }
  });

  it('rejects mixed-currency ledger attacks', () => {
    expect(() =>
      validateBalanced({
        commandId: 'mixed',
        idempotencyKey: 'mixed-key',
        postings: [
          { accountId: 'a', amountMinor: 100n, currency: 'BRL' },
          { accountId: 'b', amountMinor: -100n, currency: 'USD' },
        ],
      }),
    ).toThrow('mixed_currency_entry');
  });

  it('rejects zero and one-sided ledger entries', () => {
    expect(() =>
      validateBalanced({
        commandId: 'one',
        idempotencyKey: 'one-key',
        postings: [
          { accountId: 'a', amountMinor: 0n, currency: 'BRL' },
        ],
      }),
    ).toThrow('insufficient_postings');
  });

  it('rejects empty ledger idempotency keys', () => {
    expect(() =>
      validateBalanced({
        commandId: 'ledger',
        idempotencyKey: '   ',
        postings: [
          { accountId: 'a', amountMinor: 100n, currency: 'BRL' },
          { accountId: 'b', amountMinor: -100n, currency: 'BRL' },
        ],
      }),
    ).toThrow('idempotency_key_required');
  });

  it('rejects malformed approvals', () => {
    expect(() => requireApproval(undefined)).toThrow();

    expect(() =>
      requireApproval({
        approvedBy: '',
        approvedAt: '2026-10-05T03:00:00Z',
        intentHash: 'hash',
      }),
    ).toThrow();

    expect(() =>
      requireApproval({
        approvedBy: 'user',
        approvedAt: 'not-a-date',
        intentHash: 'hash',
      }),
    ).toThrow();

    expect(() =>
      requireApproval({
        approvedBy: 'user',
        approvedAt: '2026-10-05T03:00:00Z',
        intentHash: '',
      }),
    ).toThrow();
  });

  it('rejects hostile backup financial values', () => {
    const attacks = [
      { ...initialAccount, balance: -1 },
      { ...initialAccount, balance: Number.NaN },
      { ...initialAccount, balance: Number.POSITIVE_INFINITY },
      { ...initialAccount, balance: Number.MAX_SAFE_INTEGER + 1 },
    ];

    for (const attack of attacks) {
      expect(() => parseBackup(JSON.stringify(attack))).toThrow();
    }
  });

  it('rejects oversized backup input', () => {
    expect(() => parseBackup('x'.repeat(2_000_001))).toThrow(
      'smaller than 2 MB',
    );
  });

  it('does not let receipt recording alter wallet balance', () => {
    const next = recordExpense(initialAccount, {
      id: 'malicious-receipt',
      merchant: 'Merchant',
      amount: 999999,
      category: 'Food',
      date: '2026-10-05',
    });

    expect(next.balance).toBe(initialAccount.balance);
  });

  it('rejects duplicate bill execution with a new command id', () => {
    const first = postPayment(initialAccount, {
      ...payment,
      commandId: 'bill-one',
      name: 'Netflix',
      kind: 'Pay bill',
    });

    expect(() =>
      postPayment(first, {
        ...payment,
        commandId: 'bill-two',
        name: ' Netflix ',
        kind: 'Pay bill',
      }),
    ).toThrow('already paid');
  });

  it('keeps resulting account state schema-valid after payment', () => {
    const next = postPayment(initialAccount, payment);
    expect(accountSchema.safeParse(next).success).toBe(true);
  });
});
