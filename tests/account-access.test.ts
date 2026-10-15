import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import AccountAccessForm from '../components/account-access-form';
import {submitAccountAccess,verifyRecoveryLink} from '../lib/auth/account-access';
import {isPublicRoute,requiresAuthenticatedUser} from '../lib/supabase/route-policy';
const {createClient,signUp,reset,update,getSession,unsubscribe,onChange}=vi.hoisted(()=>({createClient:vi.fn(),signUp:vi.fn(),reset:vi.fn(),update:vi.fn(),getSession:vi.fn(),unsubscribe:vi.fn(),onChange:vi.fn()}));
vi.mock('../lib/supabase/client',()=>({createClient}));
beforeEach(()=>{
 vi.clearAllMocks();
 createClient.mockReturnValue({auth:{signUp,resetPasswordForEmail:reset,updateUser:update,getSession,onAuthStateChange:onChange}});
 for(const fn of [signUp,reset,update,getSession])fn.mockResolvedValue({error:null});
 onChange.mockReturnValue({data:{subscription:{unsubscribe}}});
});
afterEach(()=>vi.unstubAllGlobals());
describe('public account entry points',()=>{
 it('keeps signup and recovery public while settings remains protected',()=>{
   for(const route of ['/auth/signup','/auth/forgot-password','/auth/reset-password'])expect(isPublicRoute(route)).toBe(true);
   expect(requiresAuthenticatedUser('/settings')).toBe(true);
 });
 it('uses real Supabase signup without granting financial approval',async()=>{
   await submitAccountAccess('signup',' user@example.com ','password','https://fluxo.example');
   expect(signUp).toHaveBeenCalledWith({email:'user@example.com',password:'password'});
   expect(update).not.toHaveBeenCalled();
 });
 it('requests a reset link to the public recovery page',async()=>{
   await submitAccountAccess('forgot','user@example.com','','https://fluxo.example');
   expect(reset).toHaveBeenCalledWith('user@example.com',{redirectTo:'https://fluxo.example/auth/reset-password/'});
 });
 it('surfaces configuration and server failures without success claims',async()=>{
   createClient.mockReturnValueOnce(null);
   await expect(submitAccountAccess('signup','a@b.com','password','https://fluxo.example')).rejects.toThrow('not configured');
   reset.mockResolvedValue({error:{message:'Rate limited'}});
   await expect(submitAccountAccess('forgot','a@b.com','','https://fluxo.example')).rejects.toThrow('Rate limited');
 });
 it('does not enable password updates on initial recovery render',()=>{
   const html=renderToStaticMarkup(createElement(AccountAccessForm,{mode:'reset'}));
   expect(html).toContain('id="account-password"');
   expect(html).toContain('disabled=""');
   expect(update).not.toHaveBeenCalled();
 });
 it('rejects missing codes and ordinary existing sessions',async()=>{
   await expect(verifyRecoveryLink('')).rejects.toThrow('Open the reset link');
   await expect(verifyRecoveryLink('?code=invalid')).rejects.toThrow('invalid or expired');
   expect(unsubscribe).toHaveBeenCalledOnce();
 });
 it('accepts only a verified recovery event from shared client initialization',async()=>{
   onChange.mockImplementation(callback=>{
     getSession.mockImplementation(async()=>{setTimeout(()=>callback('PASSWORD_RECOVERY',{user:{id:'user-1'}}),0);return {error:null};});
     return {data:{subscription:{unsubscribe}}};
   });
   await expect(verifyRecoveryLink('?code=one-use-code')).resolves.toBeUndefined();
   expect(unsubscribe).toHaveBeenCalledOnce();
 });
 it('propagates invalid recovery links and unsubscribes',async()=>{
   getSession.mockResolvedValue({error:{message:'Expired code'}});
   await expect(verifyRecoveryLink('?code=expired')).rejects.toThrow('Expired code');
   expect(unsubscribe).toHaveBeenCalledOnce();
 });
});
