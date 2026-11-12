import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * `actions/setup-node` with `cache: pnpm` resolves `pnpm` from PATH while it runs. If the
 * workflow installs pnpm afterwards, the step fails with "Unable to locate executable
 * file: pnpm" and every later validation step is skipped — which is exactly how the
 * OpenNext validator stopped validating. This guard covers every workflow, not just the
 * one that broke.
 */

const workflowsDirectory = join(process.cwd(), ".github", "workflows");
const workflowFiles = readdirSync(workflowsDirectory).filter((name) =>
  /\.ya?ml$/.test(name),
);

function read(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("workflow pnpm availability", () => {
  it("installs pnpm before any setup-node step that caches the pnpm store", () => {
    const offending = [];

    for (const file of workflowFiles) {
      const path = join(".github", "workflows", file);
      const workflow = read(path);

      for (const match of workflow.matchAll(/^ {6}- name: .*$/gm)) {
        const start = match.index ?? 0;
        const rest = workflow.slice(start);
        const nextStep = rest.slice(1).search(/^ {6}- /m);
        const step = nextStep === -1 ? rest : rest.slice(0, nextStep + 1);
        if (
          !step.includes("actions/setup-node") ||
          !step.includes("cache: pnpm")
        )
          continue;

        const pnpmSetup = workflow.indexOf("pnpm/action-setup");
        if (pnpmSetup === -1 || pnpmSetup > start) {
          offending.push(`${path}: ${match[0].trim()}`);
        }
      }
    }

    expect(offending).toEqual([]);
  });

  it("keeps the OpenNext validator installing pnpm before Node.js", () => {
    const workflow = read(
      join(".github", "workflows", "validate-open-next-repair.yml"),
    );

    const pnpmSetup = workflow.indexOf("pnpm/action-setup");
    const nodeSetup = workflow.indexOf("actions/setup-node");

    expect(pnpmSetup).toBeGreaterThan(-1);
    expect(nodeSetup).toBeGreaterThan(-1);
    expect(pnpmSetup).toBeLessThan(nodeSetup);
  });
});
