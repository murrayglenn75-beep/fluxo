import {describe,expect,it} from 'vitest';
import {isPublicAuthRoute} from './route-access';

describe('public authentication route allowlist',()=>{
 it('allows only login and password reset',()=>{
  expect(isPublicAuthRoute('/login')).toBe(true);
  expect(isPublicAuthRoute('/login/')).toBe(true);
  expect(isPublicAuthRoute('/auth/reset')).toBe(true);
  expect(isPublicAuthRoute('/auth/reset/')).toBe(true);
 });
 it('does not exempt protected or deceptive paths',()=>{
  for(const path of ['/', '/home', '/transfer', '/pix', '/settings',
   '/login-admin', '/login/private', '/auth/admin', '/auth/reset/other',
   '/auth/callback', '/account']){
   expect(isPublicAuthRoute(path)).toBe(false);
  }
 });
});
