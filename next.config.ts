import type { NextConfig } from 'next';
const nextConfig: NextConfig = {output:process.env.FLUXO_NATIVE_BUILD==='1'?'export':undefined,trailingSlash:true,poweredByHeader:false,devIndicators:false,turbopack:{root:process.cwd()},images:{unoptimized:true}};
export default nextConfig;
