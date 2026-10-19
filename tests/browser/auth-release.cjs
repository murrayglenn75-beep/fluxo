const {chromium}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({channel:process.env.FLUXO_BROWSER_CHANNEL||undefined,headless:true});const context=await b.newContext({viewport:{width:390,height:844}});const p=await context.newPage();
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const fs=require('node:fs'),path=require('node:path');const base=process.env.FLUXO_QA_URL||'http://localhost:3110',output=path.resolve(process.env.FLUXO_QA_OUTPUT||path.join(require('node:os').tmpdir(),'fluxo-release-qa'))+path.sep;fs.mkdirSync(output,{recursive:true});
 try{
  for(const route of ['/login/','/signup/','/auth/forgot-password/','/auth/reset/']){
   await p.goto(base+route);await p.locator('h1').waitFor();
   const audit=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   console.log(JSON.stringify({route,violations:audit.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary})).slice(0,8)}))}));assert.deepEqual(audit.violations.map(v=>v.id),[],'Accessibility violations on '+route);
  }
  await p.goto(base+'/login/');
  await p.getByRole('button',{name:'Show password',exact:true}).press('Enter');assert.equal(await p.getByLabel('Password',{exact:true}).getAttribute('type'),'text');
  await p.getByRole('button',{name:'Hide password',exact:true}).press('Enter');
  await p.getByRole('link',{name:'Create account',exact:true}).click();await p.waitForURL('**/signup/');await p.getByLabel('Email',{exact:true}).waitFor();
  await p.goto(base+'/login/');await p.getByRole('link',{name:'View demo',exact:false}).click();await p.waitForURL(base+'/');
  await p.goto(base+'/home/');await p.waitForURL('**/home/');
  await p.goto(base+'/sandbox/account/');await p.waitForURL('**/login/?next=*');
  console.log('PASS signup destination, keyboard password toggle, public demo home and protected sandbox denial');
  for(const width of [360,390,430,1280]){
   await p.setViewportSize({width,height:900});await p.goto(base+'/login/');
   const layout=await p.evaluate(()=>({content:document.documentElement.scrollWidth,viewport:innerWidth,smallTargets:[...document.querySelectorAll('.login-card button,.login-card a,.login-options label')].filter(e=>e.getClientRects().length&&e.getBoundingClientRect().height<44).map(e=>e.textContent)}));assert(layout.content<=layout.viewport);assert.deepEqual(layout.smallTargets,[]);console.log('PASS web layout '+width);
  }
  await p.setViewportSize({width:390,height:844});await p.goto(base+'/login/');await p.screenshot({path:output+'fluxo-reconciled-login.png',fullPage:true});
  console.log(JSON.stringify({errors}));assert.deepEqual(errors,[]);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
