'use client';
import {useState,type FormEvent} from 'react';
import Link from 'next/link';
import {createClient} from '@supabase/supabase-js';
export default function Signup(){
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
 async function submit(e:FormEvent){e.preventDefault();setError('');setNotice('');if(password.length<8){setError('Password must have at least 8 characters.');return;}
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key){setError('Account registration is not configured on this deployment.');return;}
 setBusy(true);try{const client=createClient(url,key);const {data,error:authError}=await client.auth.signUp({email,password,options:{data:{display_name:name.trim()}}});if(authError)throw authError;setNotice(data.session?'Account created. You can now open Fluxo.':'Check your email for the confirmation link before signing in.');}catch(err){setError(err instanceof Error?err.message:'Could not create account.');}finally{setBusy(false);}}
 return <main className="mobile-auth-page"><Link href="/login" className="mobile-auth-back">← Sign in</Link><div className="mobile-auth-logo">✦ Fluxo</div><h1>Create your account</h1><p>Start your financial journey</p><form onSubmit={submit}><label>Full name<input autoComplete="name" required value={name} onChange={e=>setName(e.target.value)}/></label><label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label><button type="submit" disabled={busy}>{busy?'Creating account…':'Create account'}</button></form>{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}<small>By creating an account, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</small></main>;
}