import {NextResponse, type NextRequest} from 'next/server';
import {createServerClient} from '@supabase/ssr';
import {isPublicAuthRoute} from './lib/security/route-access';

export async function proxy(request:NextRequest){
 if(isPublicAuthRoute(request.nextUrl.pathname))return NextResponse.next();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key){
  return NextResponse.redirect(new URL('/login',request.url));
 }
 let response=NextResponse.next({request});
 const supabase=createServerClient(url,key,{
  cookies:{
   getAll(){return request.cookies.getAll();},
   setAll(cookies){
    for(const {name,value} of cookies)request.cookies.set(name,value);
    response=NextResponse.next({request});
    for(const {name,value,options} of cookies)response.cookies.set(name,value,options);
   }
  }
 });
 try{
  const {data:{user},error}=await supabase.auth.getUser();
  if(error||!user)return NextResponse.redirect(new URL('/login',request.url));
 }catch{
  return NextResponse.redirect(new URL('/login',request.url));
 }
 return response;
}

export const config={
 matcher:['/((?!_next/|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?)).*)']
};
