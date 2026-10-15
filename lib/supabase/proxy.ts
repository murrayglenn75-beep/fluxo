import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
import {requiresAuthenticatedUser} from './route-policy';

export async function updateSession(request:NextRequest){
 let response=NextResponse.next({request});
 const protectedRoute=requiresAuthenticatedUser(request.nextUrl.pathname);
 const deny=()=>{
   const loginUrl=new URL('/login',request.url);
   loginUrl.searchParams.set('next',request.nextUrl.pathname);
   const redirect=NextResponse.redirect(loginUrl);
   for(const cookie of response.cookies.getAll())redirect.cookies.set(cookie);
   redirect.headers.set('Cache-Control','private, no-store');
   return redirect;
 };
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return protectedRoute?deny():response;
 try{
   const auth=createServerClient(url,key,{
     cookies:{
       getAll(){return request.cookies.getAll();},
       setAll(cookies,headers){
         cookies.forEach(({name,value})=>request.cookies.set(name,value));
         response=NextResponse.next({request});
         cookies.forEach(({name,value,options})=>response.cookies.set(name,value,options));
         Object.entries(headers).forEach(([name,value])=>response.headers.set(name,value));
       },
     },
   });
   // Ask the Auth server for a verified current user, never trust a stored session.
   const {data,error}=await auth.auth.getUser();
   if(protectedRoute&&(error||!data.user))return deny();
 }catch{if(protectedRoute)return deny();}
 if(protectedRoute)response.headers.set('Cache-Control','private, no-store');
 return response;
}
