import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
import {requiresAuthenticatedUser} from './route-policy';

// Never permit a CDN/shared cache to store a response that might carry refreshed auth cookies.
export function preventAuthResponseCaching<T extends NextResponse>(response:T):T{
 response.headers.set('Cache-Control','private, no-cache, no-store, must-revalidate, max-age=0');
 response.headers.set('Pragma','no-cache');
 response.headers.set('Expires','0');
 return response;
}

export async function updateSession(request:NextRequest){
 let response=preventAuthResponseCaching(NextResponse.next({request}));
 const protectedRoute=requiresAuthenticatedUser(request.nextUrl.pathname);
 const deny=()=>{
   const loginUrl=new URL('/login',request.url);
   loginUrl.searchParams.set('next',request.nextUrl.pathname);
   const redirect=NextResponse.redirect(loginUrl);
   for(const cookie of response.cookies.getAll())redirect.cookies.set(cookie);
   return preventAuthResponseCaching(redirect);
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
         if(headers)Object.entries(headers).forEach(([name,value])=>response.headers.set(name,value));
         preventAuthResponseCaching(response);
       },
     },
   });
   // Server-side identity is verified against Supabase Auth, not a cookie payload.
   const {data,error}=await auth.auth.getUser();
   if(protectedRoute&&(error||!data.user))return deny();
 }catch{if(protectedRoute)return deny();}
 return preventAuthResponseCaching(response);
}
