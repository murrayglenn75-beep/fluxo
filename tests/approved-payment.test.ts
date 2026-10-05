import {describe,expect,it} from 'vitest';
import {initialAccount,type PaymentInput} from '../lib/demo/account';
import {
  createPaymentApproval,
  executeApprovedPayment
} from '../lib/security/approved-payment';

const input:PaymentInput={
  commandId:'approved-command-1',
  name:'Maria',
  key:'maria@fluxo.example',
  amount:1000,
  kind:'Send a Pix',
  description:'Lunch',
  createdAt:'2026-10-05T12:00:00.000Z'
};

describe('approved payment execution',()=>{
  it('executes the exact approved intent',async()=>{
    const approval=await createPaymentApproval(
      input,
      '2026-10-05T12:00:01.000Z'
    );

    const result=await executeApprovedPayment(
      initialAccount,
      input,
      approval,
      '2026-10-05T12:00:02.000Z'
    );

    expect(result.balance).toBe(initialAccount.balance-1000);
  });

  it('rejects an altered amount',async()=>{
    const approval=await createPaymentApproval(input,'2026-10-05T12:00:01.000Z');

    await expect(executeApprovedPayment(
      initialAccount,
      {...input,amount:1001},
      approval,
      '2026-10-05T12:00:02.000Z'
    )).rejects.toThrow('approval_intent_mismatch');
  });

  it('rejects an altered recipient',async()=>{
    const approval=await createPaymentApproval(input,'2026-10-05T12:00:01.000Z');

    await expect(executeApprovedPayment(
      initialAccount,
      {...input,name:'Attacker'},
      approval,
      '2026-10-05T12:00:02.000Z'
    )).rejects.toThrow('approval_intent_mismatch');
  });

  it('rejects an altered command id',async()=>{
    const approval=await createPaymentApproval(input,'2026-10-05T12:00:01.000Z');

    await expect(executeApprovedPayment(
      initialAccount,
      {...input,commandId:'approved-command-2'},
      approval,
      '2026-10-05T12:00:02.000Z'
    )).rejects.toThrow('approval_intent_mismatch');
  });

  it('rejects an expired approval',async()=>{
    const approval=await createPaymentApproval(input,'2026-10-05T12:00:00.000Z');

    await expect(executeApprovedPayment(
      initialAccount,
      input,
      approval,
      '2026-10-05T12:06:00.001Z'
    )).rejects.toThrow('approval_expired');
  });

  it('keeps exact command replay idempotent',async()=>{
    const approval=await createPaymentApproval(input,'2026-10-05T12:00:01.000Z');

    const first=await executeApprovedPayment(
      initialAccount,input,approval,'2026-10-05T12:00:02.000Z'
    );

    const second=await executeApprovedPayment(
      first,input,approval,'2026-10-05T12:00:03.000Z'
    );

    expect(second.balance).toBe(first.balance);
    expect(second.activity.filter(t=>t.commandId===input.commandId)).toHaveLength(1);
  });
});
