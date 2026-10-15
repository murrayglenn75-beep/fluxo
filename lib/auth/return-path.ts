/** Only accept simple local application pathnames from the auth proxy. */
export function safePostLoginPath(search:string):string {
  const candidate=new URLSearchParams(search).get('next');
  if(!candidate || !/^\/(?!\/)[a-zA-Z0-9/_-]+$/.test(candidate) || candidate.includes('//'))return '/home';
  if(candidate==='/login'||candidate.startsWith('/auth/')||candidate==='/signup')return '/home';
  return candidate;
}
