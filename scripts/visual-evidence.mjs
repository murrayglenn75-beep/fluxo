// Validates release evidence completeness; does not inspect screenshots or live UI.
const modes = ["dark", "system"];
const accents = ["green", "blue", "pink", "black"];
const flows = ["demo-access", "navigation", "notifications"];
export function validateVisualEvidence(report) {
  const issues = [];
  if (!report || typeof report !== "object") return ["Missing report"];
  if (report.approved !== true) issues.push("Missing human approval");
  for (const mode of modes) for (const accent of accents) {
    const item = report.themes?.[mode]?.[accent];
    if (!item?.screenshot || item.contrastChecked !== true || item.textReadable !== true)
      issues.push(`Incomplete theme ${mode}/${accent}`);
  }
  for (const flow of flows) {
    const item = report.flows?.[flow];
    if (!item?.evidence || item.passed !== true) issues.push(`Incomplete flow ${flow}`);
  }
  return issues;
}
