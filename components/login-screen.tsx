'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {createClient} from '../lib/supabase/client';

const dots=[1,2,3,4,5,6,7,8,9];

export default function LoginScreen(){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[pattern,setPattern]=useState<number[]>([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const patternText=useMemo(()=>pattern.join(' → '),[pattern]);
 async function signIn(){const supabase=createClient();if(!supabase){setMessage('Supabase sign-in is not configured.');return;}setBusy(true);const {error}=await supabase.auth.signInWithPassword({email,password});setBusy(false);if(error){setMessage(error.message);return;}window.location.assign('/home');}
 async function biometric(){
   if(!window.PublicKeyCredential){setMessage('Passkeys are not supported on this device/browser.');return;}
   setMessage('Biometric/passkey hardware is available. Server challenge registration is required before it can unlock Fluxo.');
 }
 function addDot(n:number){setPattern(p=>p.includes(n)?p:p.length<9?[...p,n]:p);}
 return <main className="login-shell"><section className="login-card"><div className="login-brand">Fluxo</div><p className="eyebrow">Secure sandbox access</p><h1>Welcome back</h1><p className="page-subtitle">Use your account, device biometrics/passkey, or a local gesture pattern.</p>
 <label className="field">Email<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label>
 <label className="field">Password<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
 <button className="primary" disabled={busy} onClick={signIn}>{busy?'Signing in…':'Sign in securely'}</button>
 <div className="login-divider"><span>or</span></div>
 <button className="secondary biometric-button" onClick={biometric}>◉ Use biometrics / passkey</button>
 <section className="pattern-panel"><h3>Gesture passcode</h3><small>Drag-style prototype. Tap the dots in your pattern; this convenience control does not authorize payments.</small><div className="pattern-grid" aria-label="Gesture passcode grid">{dots.map(n=><button key={n} aria-label={'Pattern point '+n} className={pattern.includes(n)?'selected':''} onPointerEnter={e=>{if(e.buttons===1)addDot(n)}} onPointerDown={()=>addDot(n)}>{n}</button>)}</div><small>{patternText||'Choose a pattern'}</small><div className="pattern-actions"><button className="secondary" onClick={()=>setPattern([])}>Clear</button><Link className="secondary" href="/">Portfolio demo</Link></div></section>
 {message&&<p className="notice" role="status">{message}</p>}<small className="privacy-note">Login convenience factors never bypass Fluxo's separate payment review and authorization boundary.</small></section></main>;
}
