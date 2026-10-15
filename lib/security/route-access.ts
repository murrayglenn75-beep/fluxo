/** Exact public authentication entry points; descendants are protected. */
const AUTH_ROUTES=new Set(['/login','/signup','/auth/signup','/auth/forgot-password','/auth/reset-password','/auth/reset']);
export function isPublicAuthRoute(pathname:string):boolean{
 const normalized=pathname.length>1?pathname.replace(/\/+$/,''):pathname;
 return AUTH_ROUTES.has(normalized);
}
