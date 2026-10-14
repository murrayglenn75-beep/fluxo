'use client';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {browserAuth} from '../../../lib/supabase/browser-auth';

type Account={user_id:string;display_name:string;balance_minor:number;currency:string};
type Intent={id:string;recipient:string;amount_minor:number;status:string;created_at:string};
function minor(input:string){
 if(!/^[0-9]{1,8}(?:\.[0-9]{1,2})?$/.test(input))throw new Error('Enter a valid amount with up to two decimal places.');
 const [whole,fraction='']=input.split('.');
 const amount=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!Number.isSafeInteger(amount)||amount<1||amount>100000000)throw new Error('Amount is outside sandbox limits.');
 return amount;
}
export default function SandboxAccountPage(){
 const [account,setAccount]=useState<Account|null>(null),[intents,setIntents]=useState<Intent[]>([]);
 const [recipient,setRecipient]=useState(''),[amount,setAmount]=useState(''),[message,setMessage]=useState('');
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const [userId,setUserId]=useState('');
 const load=useCallback(async()=>{
  const auth=browserAuth();if(!auth){setMessage('Supabase is not configured.');setLoading(false);return;}
  try{
   const {data:{user},error}=await auth.auth.getUser();
   if(error||!user){window.location.assign('/login');return;}
   setUserId(user.id);
   const [a,i]=await Promise.all([
    auth.from('fluxo_sandbox_accounts').select('user_id,display_name,balance_minor,currency').eq('user_id',user.id).maybeSingle(),
    auth.from('fluxo_sandbox_intents').select('id,recipient,amount_minor,status,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(20)
   ]);
   if(a.error||i.error){setMessage('Unable to load sandbox data. Check that migrations and account provisioning are complete.');return;}
   setAccount(a.data as Account|null);setIntents((i.data||[]) as Intent[]);
  }catch{setMessage('Unable to connect to the sandbox service.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 async function createIntent(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||!account||!userId)return;
  let amountMinor:number;
  try{amountMinor=minor(amount);}catch(e){setMessage(e instanceof Error?e.message:'Invalid amount.');return;}
  if(!recipient.trim()||recipient.trim().length>120){setMessage('Enter a recipient under 120 characters.');return;}
  const auth=browserAuth();if(!auth)return;
  setBusy(true);setMessage('');
  const id=crypto.randomUUID(),commandId=crypto.randomUUID();
  try{
   const {error}=await auth.from('fluxo_sandbox_intents').insert({
    id,user_id:userId,account_user_id:account.user_id,command_id:commandId,
    recipient:recipient.trim(),amount_minor:amountMinor,status:'pending_review'
   });
   if(error){setMessage('Unable to save pending sandbox intent. No payment was executed.');return;}
   setMessage('Sandbox intent saved as pending review. No funds were transferred.');
   setRecipient('');setAmount('');await load();
  }catch{setMessage('Connection failed. Submission status is uncertain; check history before retrying.');}
  finally{setBusy(false);}
 }
 return <main className="login-shell"><section className="login-card">
  <div className="login-brand">Fluxo</div><h1>My sandbox account</h1>
  <p className="page-subtitle">Only data owned by your signed-in user is queried. This is not a real bank account.</p>
  {loading?<p role="status">Loading account…</p>:account?<><p className="page-subtitle">{account.display_name}</p>
   <p className="page-subtitle">Sandbox balance: {new Intl.NumberFormat('en-US',{style:'currency',currency:'BRL'}).format(account.balance_minor/100)}</p>
   <form onSubmit={createIntent}>
    <label className="field">Recipient<input required maxLength={120} value={recipient} onChange={e=>setRecipient(e.target.value)}/></label>
    <label className="field">Amount (BRL)<input required type="text" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)}/></label>
    <button className="primary" disabled={busy}>{busy?'Saving…':'Save pending sandbox intent'}</button>
   </form>
  </>:<p className="page-subtitle">No sandbox account has been provisioned. No balance or payment is available.</p>}
  <h2>Recent sandbox intents</h2>
  {intents.length? <ul>{intents.map(i=><li key={i.id}>{i.recipient} — {i.amount_minor/100} BRL — {i.status}</li>)}</ul>:<p className="page-subtitle">No persisted intents.</p>}
  {message&&<p role="status" className="notice" aria-live="polite">{message}</p>}
  <Link className="login-reset" href="/home">Back to demo dashboard</Link>
 </section></main>;
}
