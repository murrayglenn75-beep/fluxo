// Static regression gate: catches missing routes and UI entry points before deployment.
// Does not substitute for browser-based visual and interaction tests.
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const dashboard = readFileSync('components/dashboard.tsx','utf8');
const routes = ['activity','pix','transfer','cards','settings'];
for (const route of routes) {
  assert.ok(existsSync('app/'+route+'/page.tsx'), 'Missing route: '+route);
  assert.ok(dashboard.includes("['"+route+"'"), 'Missing navigation entry: '+route);
}
assert.match(dashboard,/showCardDetails/, 'Card detail state missing');
assert.match(dashboard,/verifyPaymentApproval/, 'Payment approval gate missing');
assert.match(dashboard,/postPayment/, 'Demo payment posting missing');
const css = readFileSync('app/globals.css','utf8');
assert.match(css,/--surface\s*:/, 'Surface token missing');
assert.match(css,/--action\s*:/, 'Action token missing');
console.log('Static UI contract checks passed; run actual browser and theme tests separately.');
