// Optional tooling: see docs/UI_QA_REPORT.md for the isolated install command.
const { chromium } = require("playwright");
const { AxeBuilder } = require("@axe-core/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const output = process.env.FLUXO_QA_OUTPUT || "/tmp/fluxo-ui-qa";
const base = process.env.FLUXO_QA_URL || "http://127.0.0.1:3010";
fs.mkdirSync(output + "/screenshots", { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.FLUXO_CHROMIUM || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const c = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await c.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const checks = [];
  const go = async (r) => {
    await p.goto(base + "/" + r + "/", { waitUntil: "networkidle" });
  };
  const account = () =>
    p.evaluate(() => JSON.parse(localStorage.getItem("fluxo.demo.account.v2")));
  const check = (label) => {
    checks.push(label);
    console.log("PASS", label);
  };
  await go("ai");
  await p.getByLabel("Ask Fluxo").fill("How much could I save?");
  await p.getByRole("button", { name: "Send question" }).click();
  await p
    .getByText("not a weekly savings forecast", { exact: false })
    .waitFor();
  const savings = (await account()).messages.at(-1).answer;
  await p.getByLabel("Ask Fluxo").fill("Analyze my spending");
  await p.getByRole("button", { name: "Send question" }).click();
  await p.getByText("outgoing entries", { exact: false }).waitFor();
  assert.notEqual((await account()).messages.at(-1).answer, savings);
  check("Distinct savings and spending responses");
  await go("home");
  await p.getByRole("link", { name: "Receive", exact: true }).click();
  await p.getByLabel("Demo Pix key", { exact: true }).waitFor();
  check("Home Receive opens the receiving flow");
  await go("pix");
  await p.getByRole("button", { name: "Receive", exact: true }).click();
  assert.equal(await p.getByLabel("Demo Pix key", { exact: true }).count(), 1);
  assert.equal(await p.getByLabel("Requested amount (BRL)").count(), 0);
  await p.getByRole("button", { name: "Create a demo QR request" }).click();
  await p.getByLabel("Requested amount (BRL)").fill("25");
  await p.getByRole("button", { name: "Generate request QR" }).click();
  await p.getByAltText("Scannable Fluxo demo payment request").waitFor();
  const code = await p.getByLabel("Generated request code").inputValue();
  const balanceBefore = (await account()).balance;
  await p.getByLabel("Request code", { exact: true }).fill(code);
  await p.getByRole("button", { name: "Import request for review" }).click();
  assert.equal(
    await p.getByLabel("Amount", { exact: true }).inputValue(),
    "25.00",
  );
  assert.equal((await account()).balance, balanceBefore);
  check(
    "Receive/key and QR/request flows differentiated; import preserves balance",
  );
  await p.getByLabel("Recipient", { exact: true }).fill("QA Recipient");
  await p.getByLabel("Amount", { exact: true }).fill("10");
  await p.getByRole("button", { name: "Continue", exact: true }).click();
  const dialog = p.getByRole("dialog");
  assert.equal(
    await dialog.evaluate(
      (element) => element.getBoundingClientRect().right <= innerWidth,
    ),
    true,
  );
  await dialog.getByRole("button", { name: "Review details" }).click();
  await p.getByRole("dialog", { name: "Review your payment" }).waitFor();
  assert.equal((await account()).balance, balanceBefore);
  let a = await new AxeBuilder({ page: p })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    a.violations.map((v) => v.id),
    [],
  );
  await p.screenshot({
    path: output + "/screenshots/payment-review-390.png",
    fullPage: false,
  });
  await dialog
    .getByRole("button", { name: "Approve demo transaction" })
    .click();
  await p.getByRole("dialog", { name: "Payment receipt" }).waitFor();
  assert.equal((await account()).balance, balanceBefore - 1000);
  await p.keyboard.press("Escape");
  check(
    "Pix review before mutation, explicit approval, receipt and Escape close",
  );
  await go("transfer");
  await p.getByLabel("Recipient", { exact: true }).fill("QA Transfer");
  await p.getByLabel("Amount", { exact: true }).fill("999999");
  await p.getByRole("button", { name: "Continue", exact: true }).click();
  await p.getByRole("button", { name: "Review details" }).click();
  await p
    .getByRole("alert")
    .filter({ hasText: "exceeds your available balance" })
    .waitFor();
  await p.keyboard.press("Escape");
  check("Insufficient funds rejected");
  await go("cards");
  await p.getByRole("button", { name: "+ Add Card", exact: true }).click();
  const modal = p.getByRole("dialog");
  assert.ok(
    await p.evaluate(
      () =>
        document.querySelector(".bottom-nav").inert ||
        document.querySelector(".bottom-nav").closest("[inert]"),
    ),
  );
  await modal.getByLabel("Card name").fill("QA Card");
  await modal.getByLabel("Last four digits").fill("4321");
  await modal.getByRole("button", { name: "Add demo card" }).click();
  await p.getByRole("button", { name: "Freeze Card", exact: true }).click();
  assert.equal((await account()).cards.at(-1).frozen, true);
  await p.getByRole("button", { name: "Unfreeze Card", exact: true }).click();
  await p.getByRole("button", { name: "Manage Card", exact: true }).click();
  await p.getByRole("dialog").getByLabel("Card name").fill("QA Updated Card");
  await p.getByRole("button", { name: "Save card changes" }).click();
  assert.equal((await account()).cards.at(-1).name, "QA Updated Card");
  check("Add, freeze/unfreeze and rename demo card");
  await p.getByRole("button", { name: "+ Add Card", exact: true }).click();
  const close = p.getByRole("button", { name: "Close dialog" });
  await close.focus();
  await p.keyboard.press("Shift+Tab");
  assert.equal(
    await p.evaluate(() => document.activeElement.textContent),
    "Add demo card",
  );
  await p.keyboard.press("Tab");
  assert.equal(
    await p.evaluate(() => document.activeElement.getAttribute("aria-label")),
    "Close dialog",
  );
  await p.keyboard.press("Escape");
  assert.equal(
    await p.evaluate(() => document.activeElement.textContent),
    "+ Add Card",
  );
  check("Dialog keyboard trap, inert background and focus restoration");
  await go("exchange");
  await p.getByLabel("To", { exact: true }).selectOption("JPY");
  assert.ok(await p.getByText(/1 BRL = .* JPY/).count());
  await p.getByLabel("Amount in BRL").fill("0");
  await p.getByRole("button", { name: "Preview Conversion" }).click();
  await p.getByRole("status").waitFor();
  check("Currency selection and invalid quote feedback");
  await go("goals");
  await p.getByRole("button", { name: "Create a goal", exact: true }).click();
  await p.getByLabel("Goal name").fill("QA Goal");
  await p.getByLabel("Target (BRL)").fill("200");
  await p.getByLabel("Tracked savings (BRL)").fill("50");
  await p.getByRole("button", { name: "Save goal", exact: true }).click();
  assert.equal((await account()).goals.at(-1).saved, 5000);
  await p.getByRole("button", { name: "Edit QA Goal", exact: true }).click();
  await p.getByRole("button", { name: "Delete goal", exact: true }).click();
  await p
    .getByRole("button", { name: "Confirm delete goal", exact: true })
    .click();
  assert.ok(!(await account()).goals.some((g) => g.name === "QA Goal"));
  check("Create, edit and confirmed delete goal");
  await go("budgets");
  await p
    .getByRole("button", { name: "Edit limit", exact: true })
    .first()
    .click();
  await p.getByLabel("Housing limit (BRL)").fill("1800");
  await p.getByRole("button", { name: "Save budget" }).click();
  assert.equal((await account()).budgetLimits.Housing, 180000);
  check("Budget editing persists");
  await go("open-finance");
  await p.getByRole("button", { name: /Itaú/ }).click();
  assert.ok((await account()).connected.includes("Itaú"));
  await p.getByRole("button", { name: /Itaú/ }).click();
  assert.ok(!(await account()).connected.includes("Itaú"));
  check("Demo bank consent connects and revokes");
  await go("scan");
  const beforeExpense = (await account()).balance;
  await p.getByLabel("Merchant", { exact: true }).fill("QA Coffee");
  await p.getByLabel("Expense amount (BRL)").fill("12.50");
  await p.getByRole("button", { name: "Record expense" }).click();
  await p.getByRole("dialog", { name: "Expense record" }).waitFor();
  assert.equal((await account()).balance, beforeExpense);
  await p.keyboard.press("Escape");
  check("Receipt expense recorded without wallet mutation");
  await go("import");
  await p
    .getByLabel("Statement text")
    .fill("date,description,amount\n2026-10-09,QA Statement,-18.25");
  await p.getByRole("button", { name: "Preview statement" }).click();
  await p.getByRole("button", { name: "Confirm import of new rows" }).click();
  assert.equal((await account()).balance, beforeExpense);
  await p
    .getByRole("status")
    .filter({ hasText: "1 historical entries added" })
    .waitFor();
  check("Statement preview/import preserves wallet balance");
  await go("settings");
  await p
    .getByLabel("Your name")
    .fill("A Very Long QA Profile Name With Multiple Parts");
  await p.getByRole("button", { name: "Save profile" }).click();
  const exportEvent = p.waitForEvent("download");
  await p
    .getByRole("button", { name: "Export demo account", exact: true })
    .click();
  assert.equal(
    (await exportEvent).suggestedFilename(),
    "fluxo-demo-backup.json",
  );
  await p.getByRole("button", { name: "Hide values", exact: true }).click();
  assert.equal((await account()).hidden, true);
  check("Profile, privacy and backup export");
  await go("activity");
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight));
  const clearance = await p.evaluate(() => ({
    footer: document.querySelector(".workspace-footer").getBoundingClientRect()
      .bottom,
    nav: document.querySelector(".bottom-nav").getBoundingClientRect().top,
  }));
  assert.ok(clearance.footer < clearance.nav);
  await p.screenshot({ path: output + "/screenshots/activity-bottom-390.png" });
  check("Activity footer visible above navigation at end of scroll");
  await p.getByRole("button", { name: "More Fluxo features" }).click();
  await p.getByRole("dialog", { name: "Explore Fluxo" }).waitFor();
  await p.keyboard.press("Escape");
  check("More menu keyboard dismissal");
  await go("settings");
  await p
    .getByRole("button", { name: "Reset demo account", exact: true })
    .click();
  await p.getByRole("button", { name: "Confirm reset", exact: true }).click();
  assert.equal((await account()).balance, 1248032);
  check("Confirmed demo reset");
  await go("intro");
  await p.getByRole("button", { name: /Next/ }).click();
  await p.getByRole("heading", { name: "Your money, in focus" }).waitFor();
  await p.getByRole("button", { name: /Next/ }).click();
  await p.getByRole("link", { name: /Get started/ }).waitFor();
  check("Three-step intro");
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    output + "/interaction-results.json",
    JSON.stringify({ checks, errors }, null, 2),
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
