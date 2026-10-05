const {spawnSync}=require('node:child_process');
const path=require('node:path');
const next=require.resolve('next/dist/bin/next');
const build=spawnSync(process.execPath,[next,'build'],{stdio:'inherit',env:{...process.env,FLUXO_NATIVE_BUILD:'1'}});
if(build.status!==0)process.exit(build.status||1);
