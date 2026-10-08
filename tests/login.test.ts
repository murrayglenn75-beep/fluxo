import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {signIn,readRememberedEmail,rememberEmail} from '../lib/auth/login';
import LoginScreen from '../components/login-screen';

const {createClient,passwordSignIn}=vi.hoisted(()=>({createClient:vi.fn(),passwordSignIn:vi.fn()}));
vi.mock('../lib/supabase/client',()=>({createClient}));

beforeEach(()=>{
 vi.clearAllMocks();
 createClient.mockReturnValue({auth:{signInWithPassword:passwordSignIn}});
 passwordSignIn.mockResolvedValue({error:null});
});
afterEach(()=>vi.unstubAllGlobals());

describe('login authentication',()=>{
 it('uses the shared browser client and preserves the password verbatim',async()=>{
   await signIn(' user@example.com ',' password with spaces ');
   expect(createClient).toHaveBeenCalledOnce();
   expect(passwordSignIn).toHaveBeenCalledWith({email:'user@example.com',password:' password with spaces '});
 });
 it('reports configuration errors without attempting authentication',async()=>{
   createClient.mockReturnValue(null);
   await expect(signIn('a@b.com','password')).rejects.toThrow('not configured');
   expect(passwordSignIn).not.toHaveBeenCalled();
 });
 it('propagates authentication errors for the inline alert',async()=>{
   passwordSignIn.mockResolvedValue({error:{message:'Invalid login credentials'}});
   await expect(signIn('a@b.com','wrong')).rejects.toThrow('Invalid login credentials');
 });
 it('propagates network failures so the form can recover',async()=>{
   passwordSignIn.mockRejectedValue(new Error('Network unavailable'));
   await expect(signIn('a@b.com','password')).rejects.toThrow('Network unavailable');
 });
});

describe('remember email convenience',()=>{
 it('stores and removes only the email preference',()=>{
   const entries=new Map<string,string>();
   const localStorage={getItem:vi.fn((key:string)=>entries.get(key)),setItem:vi.fn((key:string,value:string)=>entries.set(key,value)),removeItem:vi.fn((key:string)=>entries.delete(key))};
   vi.stubGlobal('window',{localStorage});
   rememberEmail('user@example.com');
   expect(readRememberedEmail()).toBe('user@example.com');
   expect([...entries]).toEqual([['fluxo.login.email','user@example.com']]);
   rememberEmail(null);
   expect(readRememberedEmail()).toBe('');
 });
 it('survives unavailable storage without blocking login',()=>{
   vi.stubGlobal('window',{get localStorage(){throw new Error('Storage denied');}});
   expect(readRememberedEmail()).toBe('');
   expect(()=>rememberEmail('user@example.com')).not.toThrow();
   expect(()=>rememberEmail(null)).not.toThrow();
 });
});

describe('initial login composition',()=>{
 it('renders labeled credentials with password hidden and collapsed gesture controls',()=>{
   const html=renderToStaticMarkup(createElement(LoginScreen));
   expect(html).toContain('for="login-email"');
   expect(html).toContain('for="login-password"');
   expect(html).toContain('type="password"');
   expect(html).toContain('aria-label="Show password"');
   expect(html).toContain('aria-expanded="false"');
   expect(html).toContain('id="other-sign-in" hidden=""');
   expect(html).toContain('does not sign you in, unlock an account, or authorize a financial transaction');
   expect(passwordSignIn).not.toHaveBeenCalled();
 });
 it('links to real account forms and the public demo without authenticating',()=>{
   const html=renderToStaticMarkup(createElement(LoginScreen));
   expect(html).toContain('href="/auth/signup"');
   expect(html).toContain('href="/auth/forgot-password"');
   expect(html).toContain('href="/"');
   expect(html).toContain('View demo');
   expect(html).toContain('Passkey / biometric prototype');
   expect(html).toContain('Payments always require separate financial approval');
   expect(createClient).not.toHaveBeenCalled();
 });
});
