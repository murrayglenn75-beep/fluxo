"""CI failure evidence report: stage outcome, not a model-generated root cause."""
import json
import os
from pathlib import Path

STAGES = {
    "install": ("Dependency installation", "Check npm lockfile sync, network/registry errors, Node version."),
    "typecheck": ("TypeScript type checking", "Inspect the first compiler diagnostic and affected file."),
    "tests": ("Automated tests", "Find the first failing assertion and reproduce locally."),
    "build": ("Next.js production build", "Inspect bundling, prerendering, missing environment and import errors."),
    "native": ("Native packaging", "Check Capacitor assets/config and generated artifacts."),
}
outcomes = {k: os.environ.get("STAGE_" + k.upper(), "skipped") for k in STAGES}
lines = ["# Fluxo CI diagnostic summary", "", "This reports observed step outcomes, not an independently proven root cause.", ""]
failed = []
for stage, (title, hint) in STAGES.items():
    result = outcomes[stage]
    lines.append(f"- **{title}**: {result}")
    if result == "failure":
        failed.append(stage)
        lines.append(f"  - Investigation hint: {hint}")
if not failed:
    lines.append("\nNo failed step recorded. Skipped steps still require explanation in workflow logs.")
else:
    lines.append("\nFailure evidence is in the corresponding GitHub Actions step logs. Review logs for secrets before sharing.")
Path("ci-diagnostic.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
Path("ci-diagnostic.json").write_text(json.dumps({"schema": "ci-step-outcomes-v1", "repository": "fluxo", "outcomes": outcomes, "failed_stages": failed}, indent=2), encoding="utf-8")
print("\n".join(lines))
