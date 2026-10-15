// Optional tooling: see docs/UI_QA_REPORT.md.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const output = process.env.FLUXO_QA_OUTPUT || "/tmp/fluxo-ui-qa";
const base = process.env.FLUXO_QA_URL || "http://127.0.0.1:3010";
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.FLUXO_CHROMIUM || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const results = [];
  fs.mkdirSync(output + "/screenshots", { recursive: true });
  for (const width of [375, 390, 430]) {
    const c = await b.newContext({ viewport: { width, height: 500 } });
    const p = await c.newPage();
    await p.goto(base + "/settings/", { waitUntil: "networkidle" });
    await p
      .getByRole("button", { name: "Reset demo account", exact: true })
      .click();
    await p.getByRole("button", { name: "Confirm reset", exact: true }).click();
    await p.evaluate(() => {
      const key = "fluxo.demo.account.v2";
      const a = JSON.parse(localStorage.getItem(key));
      a.profile.name = "A".repeat(60);
      a.profile.pixKey = "x".repeat(100);
      a.balance = 9000000000000000;
      a.cards[0].name = "C".repeat(40);
      a.cards[0].limit = 9000000000000000;
      a.activity[0].name = "T".repeat(100);
      a.activity[0].amount = 9000000000000000;
      a.goals = [
        { name: "G".repeat(60), amount: 9000000000000000, saved: 500000 },
      ];
      localStorage.setItem(key, JSON.stringify(a));
    });
    for (const route of ["home", "activity", "cards", "settings", "goals"]) {
      await p.goto(base + "/" + route + "/", { waitUntil: "networkidle" });
      const overflow = await p.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      results.push({ width, route, overflow });
      console.log(width, route, "overflow:", overflow);
      await p.screenshot({
        path: `${output}/screenshots/stress-${route}-${width}.png`,
        fullPage: true,
      });
      assert.equal(overflow, false, `${route} overflow at ${width}px`);
    }
    await p.goto(base + "/cards/", { waitUntil: "networkidle" });
    await p.getByRole("button", { name: "+ Add Card" }).click();
    const modal = p.getByRole("dialog");
    const inViewport = await modal.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return (
        rect.left >= 0 &&
        rect.right <= innerWidth &&
        rect.top >= 0 &&
        rect.bottom <= innerHeight
      );
    });
    assert.equal(
      inViewport,
      true,
      "Dialog bounds fit the short mobile viewport",
    );
    await modal.getByLabel("Last four digits").focus();
    await modal
      .getByRole("button", { name: "Add demo card" })
      .scrollIntoViewIfNeeded();
    const fits = await modal
      .getByRole("button", { name: "Add demo card" })
      .evaluate((e) => {
        const r = e.getBoundingClientRect();
        return r.bottom <= innerHeight && r.top >= 0;
      });
    assert.equal(fits, true);
    await p.keyboard.press("Escape");
    results.push({
      width,
      route: "short-viewport-dialog",
      controlsReachable: true,
    });
    await c.close();
  }
  fs.writeFileSync(
    output + "/stress-results.json",
    JSON.stringify(results, null, 2),
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
