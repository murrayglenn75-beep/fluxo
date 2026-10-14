'use client';
import {useState, type FormEvent} from 'react';
import {browserAuth} from '../lib/supabase/browser-auth';

export default function LoginScreen(){
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 async function signIn(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busy)return;
  const auth=browserAuth();
  if(!auth){setMessage('Secure sign-in is not configured. Contact the administrator.');return;}
  setBusy(true);setMessage('');
  try{
   const {error}=await auth.auth.signInWithPassword({email:email.trim(),password});
   if(error){setMessage('Sign-in failed. Check your credentials and try again.');return;}
   window.location.assign('/sandbox/account');
  }catch{setMessage('Unable to connect. Check your connection and try again.');}
  finally{setBusy(false);}
 }
 async function resetPassword(){
  const auth=browserAuth();
  if(!auth){setMessage('Secure sign-in is not configured.');return;}
  if(!email.trim()){setMessage('Enter your email address to request a password reset.');return;}
  if(busy)return;
  setBusy(true);setMessage('');
  try{
   const {error}=await auth.auth.resetPasswordForEmail(email.trim(),{
    redirectTo:new URL('/auth/reset',window.location.origin).toString()
   });
   setMessage(error?'Unable to request a reset right now. Try again later.':'If this account exists, a password-reset email has been requested.');
  }catch{setMessage('Unable to connect. Try again later.');}
  finally{setBusy(false);}
 }
 return <main className="login-shell"><section className="login-card" aria-label="Fluxo sign in">
  <div className="login-brand">Fluxo</div>
  <p className="eyebrow">Secure sandbox access</p>
  <h1>Welcome back</h1>
  <p className="page-subtitle">Sign in to your sandbox account. Real-money transfers are not supported.</p>
  <form onSubmit={signIn}>
   <label className="field">Email<input required type="email" autoComplete="username" inputMode="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
   <label className="field">Password<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
   <button className="primary" type="submit" disabled={busy} aria-busy={busy}>{busy?'Signing in…':'Log In'}</button>
  </form>
  <button className="login-reset" type="button" onClick={resetPassword} disabled={busy}>Forgot password?</button>
  {message&&<p className="notice" role="status" aria-live="polite">{message}</p>}
  <p className="privacy-note">This login uses Supabase authentication. This screen does not provide passkey login or a local gesture unlock. Demo data elsewhere in Fluxo is not a real bank balance.</p>
 </section></main>;
}
