import { describe, it, expect } from "vitest";
import { affordabilityAnswer, savingsAnswer } from "../lib/finance/assistant";
const money = (minor: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    minor / 100,
  );
describe("sandbox savings questions", () => {
  it.each([
    "How much could I save?",
    "Plan my savings",
    "Help with saving",
    "What can I set aside?",
  ])("recognizes %s and reserves unpaid bills and a buffer", (question) => {
    const answer = savingsAnswer(question, 100000, [10000, 5000]);
    expect(answer).toContain(money(75000));
    expect(answer).toContain("not a weekly savings forecast");
    expect(answer).toContain("No money will move without your approval");
  });
  it("does not recommend negative savings when commitments exceed balance", () => {
    expect(savingsAnswer("save", 1000, [2000])).toContain(`up to ${money(0)}`);
  });
  it("distinguishes savings from spending and unrelated words", () => {
    expect(savingsAnswer("Analyze my spending", 100000, [])).toBeNull();
    expect(savingsAnswer("My lifesaver", 100000, [])).toBeNull();
    expect(savingsAnswer("How much could I save?", 100000, [15000])).not.toBe(
      affordabilityAnswer("How much can I spend?", 100000, [15000]),
    );
  });
});
