import {createClient} from '../supabase/client';

export async function submitAccountAccess(mode:'signup'|'forgot'|'reset',email:string,password:string,origin:string){
 const auth=createClient();if(!auth)throw new Error('Account access is not configured. Please try again later.');
 const result=mode==='signup'?await auth.auth.signUp({email:email.trim(),password}):mode==='forgot'?await auth.auth.resetPasswordForEmail(email.trim(),{redirectTo:origin+'/auth/reset-password/'}):await auth.auth.updateUser({password});
 if(result.error)throw new Error(result.error.message);
}

export async function verifyRecoveryLink(search:string){
 if(!new URLSearchParams(search).get('code'))throw new Error('Open the reset link from your email in the browser that requested it.');
 const auth=createClient();if(!auth)throw new Error('Account access is not configured.');
 // The shared SSR browser client exchanges the PKCE code during initialization.
 // An existing signed-in session alone is not proof of a password recovery link.
 let recovered=false;
 const {data}=auth.auth.onAuthStateChange((event,session)=>{
   if(event==='PASSWORD_RECOVERY'&&session)recovered=true;
 });
 try{
   const {error}=await auth.auth.getSession();
   if(error)throw new Error(error.message);
   // auth-js publishes the URL recovery event on the next task after initialization.
   await new Promise<void>(resolve=>setTimeout(resolve,0));
   if(!recovered)throw new Error('This reset link is invalid or expired. Request a new link.');
 }finally{data.subscription.unsubscribe();}
}
