import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const read=(file:string)=>readFileSync(resolve(process.cwd(),file),'utf8');
describe('mobile navigation and appearance release guardrails',()=>{
 it('exposes the More menu as a scoped dark dialog',()=>{
  expect(read('components/dashboard.tsx')).toContain('className="fluxo-navigation-dialog"');
  expect(read('app/globals.css')).toContain('.modal.fluxo-navigation-dialog');
 });
 it('keeps More menu above fixed bottom navigation and scrollable',()=>{
  const css=read('app/globals.css');
  expect(css).toContain('.overlay:has(>.fluxo-navigation-dialog) { z-index:1000; }');
  expect(css).toContain('overflow-y:auto');
  expect(css).toContain('env(safe-area-inset-bottom,0px)');
 });
 it('offers five selectable palettes and persists the preference',()=>{
  const ui=read('components/appearance-settings.tsx');
  for(const id of ['forest','ocean','violet','sunset','ruby'])expect(ui).toContain("id:'"+id+"'");
  expect(ui).toContain('localStorage.setItem(storageKey,value)');
  expect(ui).toContain('aria-pressed={selected===theme.id}');
  expect(read('app/layout.tsx')).toContain('<ThemeInitializer/>');
 });
 it('keeps profile and financial authority separate from appearance settings',()=>{
  const ui=read('components/account-screen.tsx');
  expect(ui).toContain('<AppearanceSettings/>');
  expect(ui).toContain('Sandbox · provider required');
 });
});
