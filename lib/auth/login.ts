import {createClient} from '../supabase/client';

const rememberedEmailKey='fluxo.login.email';

export async function signIn(email:string,password:string){
  const supabase=createClient();
  if(!supabase)throw new Error('Sign-in is not configured. Please try again later.');
  const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
  if(error)throw new Error(error.message);
}

// Convenience only: never persist passwords or alter Supabase session policy.
export function readRememberedEmail(){
  try{return window.localStorage.getItem(rememberedEmailKey)||'';}catch{return '';}
}

export function rememberEmail(email:string|null){
  try{
    if(email)window.localStorage.setItem(rememberedEmailKey,email);
    else window.localStorage.removeItem(rememberedEmailKey);
  }catch{/* Storage restrictions must not prevent authentication. */}
}
