const PUBLIC_ROUTES=new Set(['/','/login','/api/health']);

export function isPublicRoute(pathname:string){
  const route=pathname.length>1?pathname.replace(/\/$/,''):pathname;
  if(PUBLIC_ROUTES.has(route)) return true;
  return pathname.startsWith('/auth/');
}

export function requiresAuthenticatedUser(pathname:string){
  return !isPublicRoute(pathname);
}
