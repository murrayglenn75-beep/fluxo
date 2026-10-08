'use client';
import {useEffect,useId,useRef,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {signIn,rememberEmail,readRememberedEmail} from '../lib/auth/login';
import Icon from './icon';

const dots=[1,2,3,4,5,6,7,8,9];

export default function LoginScreen(){
 const logoGradient=useId();
 const [email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [visible,setVisible]=useState(false),[remember,setRemember]=useState(false);
 const [expanded,setExpanded]=useState(false),[pattern,setPattern]=useState<number[]>([]);
 const [error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const submitting=useRef(false);
 useEffect(()=>{const saved=readRememberedEmail();if(saved){setEmail(saved);setRemember(true);}},[]);
 async function submit(event:FormEvent<HTMLFormElement>){
   event.preventDefault();if(submitting.current)return;
   submitting.current=true;setBusy(true);setError('');setMessage('');
   try{
     await signIn(email,password);
     rememberEmail(remember?email.trim():null);
     window.location.assign('/home');
   }catch(e){setError(e instanceof Error?e.message:'Unable to log in. Please try again.');}
   finally{submitting.current=false;setBusy(false);}
 }
 function prototype(method:string){
   setMessage(method==='Passkey'?'Passkey / biometric sign-in is a prototype. A server challenge and verification flow are required before it can sign you in.':`${method} sign-in is not connected yet. Please use your email and password.`);
 }
 function addDot(n:number){setPattern(p=>p.includes(n)?p:[...p,n]);}
 return <main className="login-shell"><section className="login-card" aria-labelledby="login-heading">
   <div className="login-brand"><svg width="28" height="34" viewBox="0 0 30 36" fill="none" aria-hidden="true"><path d="M23 8 17 4a5 5 0 0 0-6 0L5 9a6 6 0 0 0-2 5v13a5 5 0 0 0 8 4l13-10v-8L10 24v-9l8-6 5 3V8Z" fill={`url(#${logoGradient})`}/><defs><linearGradient id={logoGradient} x1="3" y1="3" x2="26" y2="33"><stop stopColor="#41e2b1"/><stop offset="1" stopColor="#00926e"/></linearGradient></defs></svg><span>Fluxo</span></div>
   <header className="login-heading"><h1 id="login-heading">Welcome back</h1><p>Sign in to your account</p></header>
   <form onSubmit={submit} aria-busy={busy}>
     <label className="login-field" htmlFor="login-email">Email</label>
     <input className="login-input" id="login-email" name="email" type="email" autoComplete="username" placeholder="you@example.com" required value={email} onChange={e=>setEmail(e.target.value)} disabled={busy} aria-describedby={error?'login-error':undefined}/>
     <label className="login-field" htmlFor="login-password">Password</label>
     <div className="login-password"><input id="login-password" name="password" type={visible?'text':'password'} autoComplete="current-password" placeholder="Enter your password" required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy} aria-describedby={error?'login-error':undefined}/><button type="button" aria-label={visible?'Hide password':'Show password'} aria-pressed={visible} aria-controls="login-password" onClick={()=>setVisible(!visible)}><Icon name="eye"/>{visible&&<span className="password-slash" aria-hidden="true"/>}</button></div>
     <div className="login-options"><label><input type="checkbox" checked={remember} disabled={busy} onChange={e=>{setRemember(e.target.checked);if(!e.target.checked)rememberEmail(null);}} aria-describedby="remember-help"/>Remember me</label><Link href="/auth/forgot-password">Forgot password?</Link></div>
     <p id="remember-help" className="login-help">Remember my email on this device.</p>
     {error&&<p id="login-error" className="login-error" role="alert"><strong>Unable to log in.</strong> {error}</p>}
     <button className="login-submit" type="submit" disabled={busy}>{busy&&<span className="login-spinner" aria-hidden="true"/>}{busy?'Logging in…':'Log in'}</button>
   </form>
   <div className="login-divider"><span>or continue with</span></div>
   <div className="login-alternatives" aria-label="Alternative sign-in methods">
     <button type="button" disabled={busy} onClick={()=>prototype('Apple')}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 12.8c0-2 1.5-3 1.6-3.1-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.8 1.2 9 .8 1.1 1.6 2.1 2.7 2 1.1 0 1.5-.7 2.9-.7s1.8.7 3 .7 1.9-1 2.6-2c.9-1.2 1.3-2.4 1.3-2.5-.1 0-2.1-.8-2.1-3.9ZM15.2 6.5c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.8 1.1.1 2.1-.5 2.8-1.2Z"/></svg>Apple</button>
     <button type="button" disabled={busy} onClick={()=>prototype('Google')}><span className="google-symbol" aria-hidden="true">G</span>Google</button>
     <button type="button" disabled={busy} onClick={()=>prototype('Passkey')} aria-describedby="passkey-help"><Icon name="lock"/>Passkey</button>
   </div>
   <p id="passkey-help" className="login-help login-method-help">Apple & Google coming soon · Passkey / biometric prototype</p>
   <div role="status" className="login-feedback">{message}</div>
   <button className="login-expand" type="button" aria-expanded={expanded} aria-controls="other-sign-in" onClick={()=>setExpanded(!expanded)}>Other ways to sign in<span aria-hidden="true">{expanded?'−':'+'}</span></button>
   <section id="other-sign-in" hidden={!expanded} className="pattern-panel" aria-labelledby="gesture-heading"><h2 id="gesture-heading">Gesture unlock <span>Prototype</span></h2><p>Try a local convenience pattern. It does not sign you in, unlock an account, or authorize a financial transaction.</p><div className="pattern-grid" role="group" aria-label="Gesture pattern">{dots.map(n=><button type="button" key={n} aria-label={'Pattern point '+n} aria-pressed={pattern.includes(n)} className={pattern.includes(n)?'selected':''} onPointerEnter={e=>{if(e.buttons===1)addDot(n)}} onClick={()=>addDot(n)}>{n}</button>)}</div><p className="pattern-selection" role="status">{pattern.length?`Pattern: ${pattern.join(' → ')}`:'Choose a pattern'}</p><button type="button" className="login-clear" onClick={()=>setPattern([])}>Clear pattern</button></section>
   <p className="login-signup">New to Fluxo? <Link href="/auth/signup">Create account</Link></p>
   <Link className="login-demo" href="/">View demo <span aria-hidden="true">↗</span></Link>
   <p className="login-security"><Icon name="lock"/>Signing in verifies your identity. Payments always require separate financial approval.</p>
 </section></main>;
}
