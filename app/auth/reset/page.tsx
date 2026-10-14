'use client';
import {useEffect,useState,type FormEvent} from 'react';
import {browserAuth} from '../../../lib/supabase/browser-auth';

export default function ResetPasswordPage(){
 const [password,setPassword]=useState('');
 const [confirm,setConfirm]=useState('');
 const [status,setStatus]=useState('');
 const [ready,setReady]=useState(false);
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  const auth=browserAuth();
  if(!auth){setStatus('Authentication is not configured.');return;}
  let active=true;
  const {data:{subscription}}=auth.auth.onAuthStateChange((event)=>{
   if(active&&event==='PASSWORD_RECOVERY')setReady(true);
  });
  void auth.auth.getSession().then(({data:{session}})=>{
   if(active&&session&&window.location.hash.includes('type=recovery'))setReady(true);
  }).catch(()=>{if(active)setStatus('Unable to verify recovery session.');});
  return()=>{active=false;subscription.unsubscribe();};
 },[]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busy||!ready)return;
  if(password.length<12){setStatus('Use a password of at least 12 characters.');return;}
  if(password!==confirm){setStatus('Passwords do not match.');return;}
  const auth=browserAuth();
  if(!auth){setStatus('Authentication unavailable.');return;}
  setBusy(true);setStatus('');
  try{
   const {error}=await auth.auth.updateUser({password});
   if(error){setStatus('Unable to change password. Request another recovery link.');return;}
   await auth.auth.signOut();
   setStatus('Password updated. Return to sign in.');
   setReady(false);
  }catch{setStatus('Unable to connect. Try again later.');}
  finally{setBusy(false);}
 }
 return <main className="login-shell"><section className="login-card">
  <div className="login-brand">Fluxo</div><h1>Reset password</h1>
  <p className="page-subtitle">A valid password-recovery email link is required.</p>
  {ready?<form onSubmit={submit}>
   <label className="field">New password<input type="password" minLength={12} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
   <label className="field">Confirm password<input type="password" minLength={12} required autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
   <button className="primary" type="submit" disabled={busy}>{busy?'Updating…':'Update password'}</button>
  </form>:<p className="page-subtitle">Open the recovery link sent to your email. If it has expired, request another from sign in.</p>}
  {status&&<p role="status" aria-live="polite" className="notice">{status}</p>}
  <a className="login-reset" href="/login">Return to sign in</a>
 </section></main>;
}
