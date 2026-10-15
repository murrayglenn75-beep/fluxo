import {describe,it,expect} from 'vitest';
import {NextResponse} from 'next/server';
import {preventAuthResponseCaching} from './proxy';

describe('Supabase SSR auth cache boundaries',()=>{
 it('marks a normal response private and non-cacheable',()=>{
  const response=preventAuthResponseCaching(NextResponse.next());
  expect(response.headers.get('cache-control')).toContain('private');
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(response.headers.get('pragma')).toBe('no-cache');
  expect(response.headers.get('expires')).toBe('0');
 });
 it('overrides dangerous public cache headers even with refreshed cookies',()=>{
  const response=NextResponse.next();
  response.headers.set('Cache-Control','public, s-maxage=3600');
  response.cookies.set('sb-example-auth-token','synthetic-test-only');
  preventAuthResponseCaching(response);
  expect(response.headers.get('cache-control')).not.toContain('public');
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(response.cookies.get('sb-example-auth-token')?.value).toBe('synthetic-test-only');
 });
 it('does not allow caching of redirects',()=>{
  const response=preventAuthResponseCaching(NextResponse.redirect('https://example.test/login'));
  expect(response.status).toBe(307);
  expect(response.headers.get('cache-control')).toContain('no-store');
 });
});
