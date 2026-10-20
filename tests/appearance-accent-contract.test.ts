import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
describe('appearance accent contract',()=>{
 const ui=readFileSync('components/account-screen.tsx','utf8');
 const css=readFileSync('app/appearance-fix.css','utf8');
 it('supports all seven accents in saved preferences and selectable controls',()=>{
  expect(ui.match(/\['emerald','blue','purple','red','yellow','pink','black'\]/g)?.length).toBeGreaterThanOrEqual(2);
  expect(ui).toContain("localStorage.setItem('fluxo-appearance'");
 });
 it('preserves dark, light and system independently of the accent',()=>{
  expect(ui).toContain("['dark','light','system']");
  expect(ui).toContain('changeAppearance(theme,value)');
 });
 it('maps pink and black into actual visual tokens',()=>{
  for(const color of ['pink','black']){
   expect(css).toContain(':root[data-fluxo-accent="'+color+'"]');
   expect(css).toContain('.appearance-swatch.'+color);
  }
 });
});
