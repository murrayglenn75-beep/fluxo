import {describe,expect,it} from 'vitest';
import {isPublicRoute,requiresAuthenticatedUser} from '../lib/supabase/route-policy';

describe('authenticated route policy',()=>{
  it('keeps only explicit portfolio/auth entry points public',()=>{
    expect(isPublicRoute('/')).toBe(true);
    expect(isPublicRoute('/login')).toBe(true);
    expect(isPublicRoute('/api/health')).toBe(true);
    expect(isPublicRoute('/auth/callback')).toBe(true);
  });

  it('protects financial and user application routes',()=>{
    for(const path of ['/home','/cards','/pix','/transfer','/activity','/settings','/exchange']){
      expect(requiresAuthenticatedUser(path)).toBe(true);
    }
  });

  it('does not treat lookalike routes as public',()=>{
    expect(requiresAuthenticatedUser('/login-admin')).toBe(true);
    expect(requiresAuthenticatedUser('/api/health/private')).toBe(true);
  });
});
