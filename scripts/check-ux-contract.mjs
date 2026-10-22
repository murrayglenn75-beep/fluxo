import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const layout=read('app/layout.tsx');
const settings=read('components/account-screen.tsx');
const css=read('app/appearance-fix.css');
const dashboard=read('components/dashboard.tsx');
const accents=['emerald','blue','purple','red','yellow','pink','black'];
const themes=['dark','light','system'];
for(const accent of accents){
  assert.ok(layout.includes("'"+accent+"'"),'initial preload missing '+accent);
  assert.ok(settings.includes("'"+accent+"'"),'settings missing '+accent);
  assert.ok(css.includes('[data-fluxo-accent="'+accent+'"]'),'CSS palette missing '+accent);
  assert.ok((read('app/globals.css')+css).includes('.appearance-swatch.'+accent),'swatch missing '+accent);
}
for(const theme of themes){
  assert.ok(layout.includes("'"+theme+"'"),'preload missing theme '+theme);
  assert.ok(settings.includes("'"+theme+"'"),'settings missing theme '+theme);
}
assert.ok(layout.includes('fluxo-appearance')&&settings.includes('fluxo-appearance'),'persistence key mismatch');
assert.ok(settings.includes('localStorage.setItem'),'appearance is not saved');
for(const section of ['home','pix','transfer','cards','activity','settings']){
  assert.ok(dashboard.includes("'"+section+"'"),'navigation missing '+section);
}
console.log('PASS: Fluxo appearance and route static UX contracts');
console.log('NOTE: not a substitute for runtime accessibility, visual, persistence or deployment tests');
