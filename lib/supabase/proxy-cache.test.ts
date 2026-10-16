import {describe,it,expect} from 'vitest';
import {NextResponse} from 'next/server';
import {preventAuthResponseCaching} from './proxy';

describe('Supabase session caching boundaries',()=>{
 it('prevents caching normal responses',()=>{
  const response=preventAuthResponseCaching(NextResponse.next());
  expect(response.headers.get('cache-control')).toContain('private');
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(response.headers.get('pragma')).toBe('no-cache');
 });
 it('overrides public cache headers on responses carrying auth cookies',()=>{
  const response=NextResponse.next();
  response.headers.set('Cache-Control','public, s-maxage=3600');
  response.cookies.set('sb-test-auth-token','synthetic-only');
  preventAuthResponseCaching(response);
  expect(response.headers.get('cache-control')).not.toContain('public');
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(response.cookies.get('sb-test-auth-token')?.value).toBe('synthetic-only');
 });
 it('prevents caching login redirects',()=>{
  const response=preventAuthResponseCaching(NextResponse.redirect('https://example.test/login'));
  expect(response.status).toBe(307);
  expect(response.headers.get('cache-control')).toContain('no-store');
 });
});
