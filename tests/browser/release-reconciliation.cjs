const {chromium}=require('playwright');const {AxeBuilder}=require('@axe-core/playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.env.FLUXO_QA_EXPORT||'out');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{try{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)&&file!==root)throw Error('invalid path');if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);}catch{res.statusCode=404;res.end('Not found');}});
(async()=>{
 await new Promise(r=>server.listen(3111,'127.0.0.1',r));const browser=await chromium.launch({channel:process.env.FLUXO_BROWSER_CHANNEL||undefined,headless:true});const context=await browser.newContext();const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));const output=path.resolve(process.env.FLUXO_QA_OUTPUT||path.join(require('node:os').tmpdir(),'fluxo-release-qa'))+path.sep;fs.mkdirSync(output,{recursive:true});
 try{
  for(const width of [360,390,430]){
   await p.setViewportSize({width,height:844});
   for(const route of ['home','login','signup','pix','transfer','cards','exchange','ai','settings','import','sandbox/account']){
    await p.goto('http://127.0.0.1:3111/'+route+'/');await p.locator('main').waitFor();
    const layout=await p.evaluate(()=>({viewport:innerWidth,content:document.documentElement.scrollWidth}));assert(layout.content<=layout.viewport,`${route} overflow at ${width}: ${JSON.stringify(layout)}`);
    if(width===390&&['home','login','pix'].includes(route))await p.screenshot({path:output+`fluxo-integrated-${route}.png`,fullPage:true});
    if(width===390){const a=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();console.log(JSON.stringify({route,violations:a.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.slice(0,4).map(n=>({target:n.target,summary:n.failureSummary}))}))}));assert.deepEqual(a.violations.map(v=>v.id),[],'Accessibility violations on '+route);}
   }
   console.log('PASS mobile layout '+width);
  }

  await p.setViewportSize({width:390,height:844});
  await p.goto('http://127.0.0.1:3111/home/');
  await p.getByRole('button',{name:'More Fluxo features',exact:true}).click();
  await p.getByRole('dialog',{name:'Explore Fluxo'}).waitFor();
  await p.getByRole('link',{name:'Statement Import',exact:true}).click();
  await p.getByRole('heading',{name:'Import bank statement'}).waitFor();
  const csv='date,description,amount,id\n2026-10-14,Release coffee,-12.50,release-1\n2026-10-14,Release salary,100.00,release-2';
  await p.getByLabel('Statement text').fill(csv);
  await p.getByRole('button',{name:'Preview statement',exact:true}).click();
  await p.getByText('2 new · 0 duplicate · 0 likely match · 0 conflict · 0 rejected',{exact:true}).waitFor();
  assert.equal(await p.evaluate(()=>localStorage.getItem('fluxo.demo.account.v2')),null);
  await p.getByRole('button',{name:'Confirm import of new rows'}).click();
  await p.getByText('2 historical entries added. Wallet balance unchanged.',{exact:true}).waitFor();
  const imported=await p.evaluate(()=>JSON.parse(localStorage.getItem('fluxo.demo.account.v2')));
  assert.equal(imported.balance,1248032);assert.equal(imported.activity.length,9);
  await p.reload();await p.getByLabel('Statement text').fill(csv);await p.getByRole('button',{name:'Preview statement',exact:true}).click();
  await p.getByText('0 new · 2 duplicate · 0 likely match · 0 conflict · 0 rejected',{exact:true}).waitFor();
  assert(!(await p.getByRole('button',{name:'Confirm import of new rows'}).isEnabled()));
  await p.goto('http://127.0.0.1:3111/ai/');
  await p.getByLabel('Ask Fluxo').fill('How much can I spend this week?');
  await p.getByRole('button',{name:'Send question'}).click();
  await p.getByText('This calculation does not move money.',{exact:false}).waitFor();
  const after=await p.evaluate(()=>JSON.parse(localStorage.getItem('fluxo.demo.account.v2')));
  assert.equal(after.balance,imported.balance);assert.equal(after.activity.length,imported.activity.length);
  console.log('PASS native menu navigation, explicit import confirmation, reload deduplication and read-only AI');
  assert.deepEqual(errors,[]);console.log('PASS no native-export runtime or hydration errors');
 }finally{await context.close();await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
