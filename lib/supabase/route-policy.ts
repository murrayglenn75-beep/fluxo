import {isPublicAuthRoute} from '../security/route-access';
const SANDBOX_PAGES=new Set(['/home','/activity','/pix','/transfer','/cards','/bills','/exchange','/open-finance','/ai','/scan','/import','/budgets','/goals','/settings','/onboarding']);
const PUBLIC_ROUTES=new Set(['/','/api/health','/manifest.webmanifest','/welcome','/splash','/intro','/privacy','/terms']);
export function isPublicRoute(pathname:string){
 const normalized=pathname.length>1?pathname.replace(/\/+$/,''):pathname;
 return SANDBOX_PAGES.has(normalized)||PUBLIC_ROUTES.has(normalized)||isPublicAuthRoute(normalized);
}
export function requiresAuthenticatedUser(pathname:string){return !isPublicRoute(pathname);}
