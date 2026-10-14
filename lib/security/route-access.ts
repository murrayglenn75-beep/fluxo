/** Deliberately narrow public auth routes. All other application routes require a user. */
export function isPublicAuthRoute(pathname:string):boolean{
 const normalized=pathname.length>1?pathname.replace(/\/+$/,''):pathname;
 return normalized==='/login'||normalized==='/auth/reset';
}
