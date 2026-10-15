// Optional tooling: see docs/UI_QA_REPORT.md for the isolated install command.
const { chromium } = require("playwright");
const { AxeBuilder } = require("@axe-core/playwright");
const fs = require("node:fs");
const output = process.env.FLUXO_QA_OUTPUT || "/tmp/fluxo-ui-qa";
const base = process.env.FLUXO_QA_URL || "http://127.0.0.1:3010";
fs.mkdirSync(output + "/screenshots", { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.FLUXO_CHROMIUM || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const results = [];
  const routes = [
    "home",
    "activity",
    "cards",
    "pix",
    "transfer",
    "exchange",
    "bills",
    "ai",
    "settings",
    "goals",
    "budgets",
    "open-finance",
    "scan",
    "import",
    "welcome",
    "intro",
    "onboarding",
    "login",
    "auth/signup",
    "auth/forgot-password",
    "auth/reset-password",
  ];
  for (const width of [375, 390, 430, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
    });
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(base + "/" + route + "/", { waitUntil: "networkidle" });
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        bg: getComputedStyle(document.querySelector(".app") || document.body)
          .backgroundColor,
      }));
      const a = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      results.push({
        width,
        route,
        ...layout,
        violations: a.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      });
      await page.screenshot({
        path: `${output}/screenshots/${route.replaceAll("/", "-")}-${width}.png`,
        fullPage: true,
      });
      console.log(
        width,
        route,
        "overflow:",
        layout.overflow,
        "a11y:",
        a.violations.map((v) => v.id).join(","),
      );
    }
    await context.close();
  }
  fs.writeFileSync(
    output + "/visual-results.json",
    JSON.stringify(results, null, 2),
  );
  await browser.close();
  if (results.some((r) => r.overflow || r.violations.length))
    process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
