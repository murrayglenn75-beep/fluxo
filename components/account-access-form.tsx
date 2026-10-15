'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {submitAccountAccess,verifyRecoveryLink} from '../lib/auth/account-access';

type Mode='signup'|'forgot'|'reset';
const headings={signup:'Create account',forgot:'Forgot password?',reset:'Choose a new password'};
const copy={signup:'Start with your email and a secure password.',forgot:'We’ll email you a secure password reset link.',reset:'Use at least 8 characters for your new password.'};

export default function AccountAccessForm({mode}:{mode:Mode}){
 const [email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [busy,setBusy]=useState(mode==='reset'),[verified,setVerified]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[done,setDone]=useState(false);
 const working=useRef(false),recovery=useRef<Promise<void>|null>(null);
 useEffect(()=>{
   if(mode!=='reset')return;
   // Keep Strict Mode from exchanging the one-use PKCE code twice.
   if(!recovery.current)recovery.current=verifyRecoveryLink(window.location.search);
   let active=true;
   recovery.current.then(()=>{if(active){setVerified(true);window.history.replaceState(null,'','/auth/reset-password/');}}).catch(e=>{if(active)setError(e instanceof Error?e.message:'This reset link is invalid or expired.');}).finally(()=>{if(active)setBusy(false);});
   return()=>{active=false;};
 },[mode]);
 async function submit(event:FormEvent<HTMLFormElement>){
   event.preventDefault();if(working.current||done||(mode==='reset'&&!verified))return;
   working.current=true;setBusy(true);setError('');setNotice('');
   try{
     await submitAccountAccess(mode,email,password,window.location.origin);
     setPassword('');setDone(true);
     setNotice(mode==='signup'?'Your signup request was accepted. Check your email if confirmation is required, then return to log in.':mode==='forgot'?'If an account exists for that email, a reset link has been requested. Open it in this browser.':'Your password was updated. You can return to log in.');
   }catch(e){setError(e instanceof Error?e.message:'Unable to complete this request. Please try again.');}
   finally{working.current=false;setBusy(false);}
 }
 return <main className="login-shell"><section className="login-card" aria-labelledby="account-heading"><div className="login-brand"><span className="fluxo-auth-logo" aria-hidden="true">◈</span>Fluxo</div><div className="fluxo-auth-progress" aria-hidden="true"><span/><span/><span/></div><header className="login-heading"><h1 id="account-heading">{headings[mode]}</h1><p>{copy[mode]}</p></header><p className="fluxo-auth-context">{mode==='signup'?'Create your secure account to explore the Fluxo sandbox.':mode==='forgot'?'For your security, reset links expire and can only be used once.':'Use a strong, unique password to protect your account.'}</p><form onSubmit={submit} aria-busy={busy}>
 {mode!=='reset'&&<><label className="login-field" htmlFor="account-email">Email</label><input className="login-input" id="account-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} disabled={busy||done}/></>}
 {mode!=='forgot'&&<><label className="login-field" htmlFor="account-password">{mode==='reset'?'New password':'Password'}</label><input className="login-input" id="account-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} disabled={busy||done||(mode==='reset'&&!verified)}/></>}
 {error&&<p className="login-error" role="alert">{error}</p>}
 {notice&&<p className="login-feedback" role="status">{notice}</p>}
 <button type="submit" className="login-submit account-submit" disabled={busy||done||(mode==='reset'&&!verified)}>{busy?'Please wait…':mode==='forgot'?'Send reset link':mode==='reset'?'Update password':'Create account'}</button>
 </form><Link className="login-demo" href="/login">Back to log in</Link>{mode==='reset'&&error&&<Link className="login-demo" href="/auth/forgot-password">Request a new reset link</Link>}<p className="login-security">Account access verifies identity. Financial transactions require separate approval.</p></section></main>;
}
