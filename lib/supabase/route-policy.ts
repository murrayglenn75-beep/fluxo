import {isPublicAuthRoute} from '../security/route-access';
const PUBLIC_ROUTES=new Set(['/','/api/health','/manifest.webmanifest','/welcome','/splash','/intro','/privacy','/terms']);
export function isPublicRoute(pathname:string){
 const normalized=pathname.length>1?pathname.replace(/\/+$/,''):pathname;
 return PUBLIC_ROUTES.has(normalized)||isPublicAuthRoute(normalized);
}
export function requiresAuthenticatedUser(pathname:string){return !isPublicRoute(pathname);}
