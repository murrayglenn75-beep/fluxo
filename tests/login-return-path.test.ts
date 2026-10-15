import {describe,expect,it} from 'vitest';
import {safePostLoginPath} from '../lib/auth/return-path';

describe('post-login protected destination',()=>{
 it('restores a local protected route after successful sign-in',()=>{
   expect(safePostLoginPath('?next=%2Fsandbox%2Faccount')).toBe('/sandbox/account');
   expect(safePostLoginPath('?next=%2Fpix')).toBe('/pix');
   expect(safePostLoginPath('?next=%2Fhome')).toBe('/home');
 });
 it('ignores untrusted external, protocol-relative or encoded traversal destinations',()=>{
   for(const destination of ['//evil.test','https://evil.test','/\\\\evil.test','/%2F%2Fevil.test','/%5Cevil.test','/%0aevil.test','/home?bad=1','/home#fragment','/home//evil.test']){
     expect(safePostLoginPath('?next='+encodeURIComponent(destination))).toBe('/home');
   }
 });
 it('ignores missing and public authentication loop targets',()=>{
   for(const q of ['', '?next=%2Flogin','?next=%2Fsignup','?next=%2Fauth%2Freset'])expect(safePostLoginPath(q)).toBe('/home');
 });
});
