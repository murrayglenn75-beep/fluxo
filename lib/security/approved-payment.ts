import {
  postPayment,
  type Account,
  type PaymentInput
} from '../demo/account';
import {
  requireApproval,
  type Approval
} from './financial-command';
import {hashPaymentIntent} from './payment-intent';

export const LOCAL_DEMO_PRINCIPAL='fluxo-local-demo-user';

export async function createPaymentApproval(
  input:PaymentInput,
  approvedAt=new Date().toISOString()
):Promise<Approval>{
  return {
    approvedBy:LOCAL_DEMO_PRINCIPAL,
    approvedAt,
    intentHash:await hashPaymentIntent(input)
  };
}

export async function verifyPaymentApproval(
  input:PaymentInput,
  approval:Approval,
  now=new Date().toISOString()
):Promise<void>{
  const expectedIntentHash=await hashPaymentIntent(input);

  requireApproval(approval,{
    expectedApprover:LOCAL_DEMO_PRINCIPAL,
    expectedIntentHash,
    now,
    maxAgeMs:5*60*1000
  });
}

export async function executeApprovedPayment(
  account:Account,
  input:PaymentInput,
  approval:Approval,
  now=new Date().toISOString()
):Promise<Account>{
  await verifyPaymentApproval(input,approval,now);
  return postPayment(account,input);
}
