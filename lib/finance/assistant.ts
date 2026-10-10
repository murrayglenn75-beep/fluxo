import { parseMinor } from "../demo/account";
import { assertReadOnlyTool } from "../security/policy";
import { calculateAffordability } from "./affordability";

export function savingsAnswer(
  question: string,
  availableMinor: number,
  unpaidBillsMinor: readonly number[],
): string | null {
  if (!/\b(?:sav(?:e|ing|ings)|set aside)\b/i.test(question)) return null;
  assertReadOnlyTool("financial.snapshot");
  const unpaid = unpaidBillsMinor.reduce((sum, amount) => sum + amount, 0);
  const buffer = Math.max(0, Math.round(availableMinor * 0.1));
  const potential = Math.max(0, availableMinor - unpaid - buffer);
  const format = (amount: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount / 100);
  return `Based on your demo balance of ${format(availableMinor)}, unpaid bills of ${format(unpaid)} and a 10% safety buffer of ${format(buffer)}, up to ${format(potential)} could be set aside. This is a balance-based estimate, not a weekly savings forecast; recurring income and spending are not projected. No money will move without your approval.`;
}

export function affordabilityAnswer(
  question: string,
  availableMinor: number,
  unpaidBillsMinor: readonly number[],
): string | null {
  if (!/afford|can i (?:spend|buy)|how much can i spend/i.test(question))
    return null;
  assertReadOnlyTool("affordability.check");
  const proposal = question.match(/R\$\s*([^\s?!;]+)/i);
  if (!proposal && !/how much/i.test(question))
    throw new Error("Include a BRL amount, for example: Can I afford R$ 100?");
  const proposedMinor = proposal ? parseMinor(proposal[1]) : 0;
  const result = calculateAffordability({
    availableMinor,
    proposedMinor,
    unpaidBillsMinor,
  });
  const format = (amount: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount / 100);
  return `Sandbox calculation: ${format(result.safeToSpendMinor)} remains after unpaid demo bills and a ${format(result.safetyBufferMinor)} safety buffer.${proposal ? ` Your proposed ${format(proposedMinor)} ${result.canAfford ? "fits" : "exceeds"} that amount.` : ""} This calculation does not move money.`;
}
