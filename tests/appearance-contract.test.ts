import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const globals = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8');
const repair = readFileSync(resolve(process.cwd(), 'app/appearance-fix.css'), 'utf8');
const layout = readFileSync(resolve(process.cwd(), 'app/layout.tsx'), 'utf8');
const css = globals + '\n' + repair;
const accents = ['emerald', 'blue', 'purple', 'red', 'yellow', 'pink', 'black'];

describe('Fluxo seven-accent appearance contract', () => {
  it.each(accents)('defines %s accent tokens and a dark panel palette', accent => {
    expect(css).toContain(`data-fluxo-accent="${accent}"`);
    expect(repair).toMatch(new RegExp(`data-fluxo-accent="${accent}"[^}]*--fluxo-dark-canvas`));
    expect(repair).toMatch(new RegExp(`data-fluxo-accent="${accent}"[^}]*--fluxo-card-start`));
    expect(layout).toContain(`'${accent}'`);
  });

  it('includes light and dark modes and effective system appearance selection', () => {
    for (const theme of ['light', 'dark', 'system']) expect(layout).toContain(`'${theme}'`);
    expect(layout).toContain("prefers-color-scheme: light");
    expect(css).toContain('data-fluxo-theme="light"');
    expect(css).toContain('data-fluxo-theme="dark"');
  });

  it('uses accent variables for primary actions and navigation', () => {
    expect(repair).toContain('var(--action)!important');
    expect(repair).toContain('var(--teal)!important');
    expect(repair).toContain('.bottom-nav');
  });

  it('forces legible bank provider labels on light provider tiles', () => {
    expect(repair).toContain('.bank-page .bank-row strong');
    expect(repair).toContain('color:#152c3b!important');
  });
});
