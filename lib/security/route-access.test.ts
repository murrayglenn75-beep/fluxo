import {describe,expect,it} from 'vitest';
import {isPublicAuthRoute} from './route-access';
describe('public authentication route allowlist',()=>{
 it('allows login, signup, and both supported recovery entry points',()=>{
   for(const route of ['/login','/signup','/auth/signup','/auth/forgot-password','/auth/reset-password','/auth/reset']){
     expect(isPublicAuthRoute(route)).toBe(true);expect(isPublicAuthRoute(route+'/')).toBe(true);
   }
 });
 it('does not exempt protected or deceptive paths',()=>{
   for(const route of ['/','/home','/sandbox/account','/transfer','/pix','/settings','/login-admin','/login/private','/signup/private','/auth/admin','/auth/reset/other','/auth/callback','/account'])expect(isPublicAuthRoute(route)).toBe(false);
 });
});
