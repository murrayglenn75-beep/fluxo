// Browser regression for theme preference, paint, persistence and accent routing.
// Requires Playwright and a completed Fluxo native export (out/).
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.env.FLUXO_QA_EXPORT || 'out');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server = http.createServer((req,res)=>{
  try {
    let file = path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if (file!==root && !file.startsWith(root+path.sep)) throw new Error('outside export');
    if(fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  }catch {res.statusCode=404;res.end('Not found');}
});
async function inspect(page){
  return page.evaluate(()=>({
    theme:document.documentElement.dataset.fluxoTheme,
    accent:document.documentElement.dataset.fluxoAccent,
    appBackground:getComputedStyle(document.querySelector('.app') || document.body).backgroundColor,
    stored:localStorage.getItem('fluxo-appearance')
  }));
}
(async()=>{
  await new Promise(resolve=>server.listen(3123,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true});
  try{
    for(const scheme of ['light','dark']){
      const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:scheme});
      const page=await context.newPage();
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.goto('http://127.0.0.1:3123/settings/');
        await page.getByRole('heading',{name:'Appearance'}).waitFor();
        await page.getByRole('button',{name:'System',exact:true}).click();
        let state=await inspect(page);
        assert.equal(state.theme,'system','System selection must set system DOM theme');
        const systemBackground=state.appBackground;
        for (const accent of ['Emerald','Blue','Purple','Red','Yellow','Pink','Black']){
          await page.getByRole('button',{name:accent,exact:true}).click();
          state=await inspect(page);
          assert.equal(state.theme,'system');
          assert.equal(state.accent,accent.toLowerCase());
          const stored=JSON.parse(state.stored);
          assert.equal(stored.theme,'system');
          assert.equal(stored.accent,accent.toLowerCase());
          await page.reload();
          await page.getByRole('heading',{name:'Appearance'}).waitFor();
          assert.equal((await inspect(page)).accent,accent.toLowerCase(),'accent lost on reload');
          assert.equal((await inspect(page)).theme,'system','system theme lost on reload');
        }
        await page.goto('http://127.0.0.1:3123/home/');
        assert.equal((await inspect(page)).theme,'system','system theme lost during navigation');
        await page.goto('http://127.0.0.1:3123/settings/');
        await page.getByRole('button',{name:'Dark',exact:true}).click();
        assert.equal((await inspect(page)).theme,'dark','Dark selection not respected');
        await page.reload();
        assert.equal((await inspect(page)).theme,'dark','Dark selection lost on reload');
        await page.getByRole('button',{name:'System',exact:true}).click();
        const after=await inspect(page);
        assert.equal(after.theme,'system');
        console.log('PASS',scheme,'System + Dark persistence, 7 accents, navigation',systemBackground,after.appBackground);
        assert.deepEqual(errors,[], 'runtime/hydration errors');
      }finally{await context.close();}
    }
  } finally {
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
