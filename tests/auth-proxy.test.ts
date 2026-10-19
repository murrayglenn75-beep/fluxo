import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
import {updateSession} from '../lib/supabase/proxy';
const {createServerClient,getUser}=vi.hoisted(()=>({createServerClient:vi.fn(),getUser:vi.fn()}));
vi.mock('@supabase/ssr',()=>({createServerClient}));
type CookieWriter={setAll:(values:{name:string;value:string;options:{path:string}}[],headers:Record<string,string>)=>void};
let cookies:CookieWriter;
beforeEach(()=>{
 vi.clearAllMocks();vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://test-project.supabase.co');vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','test-only-publishable-key');
 createServerClient.mockImplementation((_url:string,_key:string,options:{cookies:CookieWriter})=>{cookies=options.cookies;return {auth:{getUser}};});
 getUser.mockResolvedValue({data:{user:null},error:null});
});
afterEach(()=>vi.unstubAllEnvs());
const request=(path:string)=>new NextRequest('https://fluxo.example'+path);
describe('web authentication boundary',()=>{
 it('fails closed for protected data when Supabase is not configured',async()=>{
   vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','');
   const result=await updateSession(request('/sandbox/account'));
   expect(result.status).toBe(307);expect(result.headers.get('location')).toBe('https://fluxo.example/login?next=%2Fsandbox%2Faccount');
   expect(createServerClient).not.toHaveBeenCalled();
 });
 it('keeps explicit signup/recovery and the public portfolio reachable without configuration',async()=>{
   vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','');
   for(const path of ['/','/login','/signup','/auth/signup','/auth/forgot-password','/auth/reset-password','/auth/reset','/splash','/manifest.webmanifest','/welcome','/privacy','/terms'])expect((await updateSession(request(path))).status).toBe(200);
 });
 it('denies protected routes for an unsigned or invalid session',async()=>{
   for(const path of ['/sandbox/account','/signup/private','/auth/admin'])expect((await updateSession(request(path))).status).toBe(307);
 });
 it('accepts only a verified current user and makes private responses non-cacheable',async()=>{
   getUser.mockResolvedValue({data:{user:{id:'user-a'}},error:null});
   const result=await updateSession(request('/sandbox/account'));
   expect(result.status).toBe(200);expect(result.headers.get('Cache-Control')).toBe('private, no-cache, no-store, must-revalidate, max-age=0');expect(getUser).toHaveBeenCalledOnce();
 });
 it('denies even an apparent user when the Auth server reports an error',async()=>{
   getUser.mockResolvedValue({data:{user:{id:'user-a'}},error:{message:'Invalid token'}});
   expect((await updateSession(request('/sandbox/account'))).status).toBe(307);
 });
 it('denies protected routes on network failure while leaving public auth usable',async()=>{
   getUser.mockRejectedValue(new Error('Auth unavailable'));
   expect((await updateSession(request('/sandbox/account'))).status).toBe(307);
   expect((await updateSession(request('/login'))).status).toBe(200);
 });
 it('carries refreshed cookies and cache headers on an authenticated response',async()=>{
   getUser.mockImplementation(async()=>{cookies.setAll([{name:'sb-session',value:'test-session',options:{path:'/'}}],{'Cache-Control':'private, no-cache, no-store, must-revalidate, max-age=0'});return {data:{user:{id:'user-a'}},error:null};});
   const result=await updateSession(request('/sandbox/account'));
   expect(result.cookies.get('sb-session')?.value).toBe('test-session');expect(result.headers.get('Cache-Control')).toBe('private, no-cache, no-store, must-revalidate, max-age=0');
 });
 it('carries cookie invalidation into the denied response',async()=>{
   getUser.mockImplementation(async()=>{cookies.setAll([{name:'sb-session',value:'',options:{path:'/'}}],{});return {data:{user:null},error:{message:'Expired'}};});
   const result=await updateSession(request('/sandbox/account'));
   expect(result.status).toBe(307);expect(result.cookies.get('sb-session')?.value).toBe('');expect(result.headers.get('Cache-Control')).toBe('private, no-cache, no-store, must-revalidate, max-age=0');
 });
});
