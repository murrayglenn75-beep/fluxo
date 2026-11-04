import test from "node:test";
import assert from "node:assert/strict";
import { validateVisualEvidence } from "./visual-evidence.mjs";
const report = { approved: true, themes: {}, flows: {} };
for (const mode of ["dark", "system"]) {
  report.themes[mode] = {};
  for (const accent of ["green", "blue", "pink", "black"])
    report.themes[mode][accent] = { screenshot: `evidence/${mode}-${accent}.png`, contrastChecked: true, textReadable: true };
}
for (const flow of ["demo-access", "navigation", "notifications"])
  report.flows[flow] = { evidence: `evidence/${flow}.json`, passed: true };
test("complete evidence accepted", () => assert.deepEqual(validateVisualEvidence(report), []));
test("missing theme evidence rejected", () => assert.match(validateVisualEvidence({...report, themes: {...report.themes, dark: {...report.themes.dark, pink: {}}}}).join(","), /dark\/pink/));
test("human approval required", () => assert.match(validateVisualEvidence({...report, approved: false}).join(","), /approval/));
test("missing report rejected", () => assert.deepEqual(validateVisualEvidence(null), ["Missing report"]));
