import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
import {requiresAuthenticatedUser} from './route-policy';

export async function updateSession(request:NextRequest){
  let response=NextResponse.next({request});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Keep local/static portfolio builds usable when Supabase is intentionally absent.
  // A configured deployment fails closed for protected routes based on verified claims.
  if(!url||!key) return response;

  const supabase=createServerClient(url,key,{
    cookies:{
      getAll(){return request.cookies.getAll();},
      setAll(cookiesToSet,headers){
        cookiesToSet.forEach(({name,value})=>request.cookies.set(name,value));
        response=NextResponse.next({request});
        cookiesToSet.forEach(({name,value,options})=>response.cookies.set(name,value,options));
        Object.entries(headers).forEach(([name,value])=>response.headers.set(name,value));
      },
    },
  });

  const {data,error}=await supabase.auth.getClaims();
  const authenticated=!error&&Boolean(data?.claims?.sub);

  if(requiresAuthenticatedUser(request.nextUrl.pathname)&&!authenticated){
    const loginUrl=request.nextUrl.clone();
    loginUrl.pathname='/login';
    loginUrl.searchParams.set('next',request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
