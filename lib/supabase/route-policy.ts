const PUBLIC_ROUTES=new Set(['/','/login','/api/health']);

export function isPublicRoute(pathname:string){
  if(PUBLIC_ROUTES.has(pathname)) return true;
  return pathname.startsWith('/auth/');
}

export function requiresAuthenticatedUser(pathname:string){
  return !isPublicRoute(pathname);
}
