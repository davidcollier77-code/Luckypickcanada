import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * `actions/setup-node` with `cache: pnpm` resolves `pnpm` from PATH while it runs. If the
 * workflow installs pnpm afterwards, the step fails with "Unable to locate executable
 * file: pnpm" and every later validation step is skipped — which is exactly how the
 * OpenNext validator stopped validating. Ordering is checked per job, because a correct
 * first job says nothing about the second, and across every workflow, not just that one.
 */

const workflowsDirectory = join(process.cwd(), ".github", "workflows");
const workflowFiles = readdirSync(workflowsDirectory).filter((name) =>
  /\.ya?ml$/.test(name),
);

function read(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

/** Split a workflow into its `  job-name:` blocks. */
function jobBlocks(workflow) {
  const blocks = [];
  let current = null;

  for (const line of workflow.split("\n")) {
    if (/^ {2}[A-Za-z0-9_-]+:$/.test(line)) {
      if (current) blocks.push(current);
      current = { name: line.trim(), lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) blocks.push(current);
  return blocks;
}

/** The lines of one step, from its `- name:` line to the next step or job. */
function stepLinesAt(jobLines, startIndex) {
  const rest = jobLines.slice(startIndex + 1);
  const nextStep = rest.findIndex((line) => /^ {6}- /.test(line));
  return [
    jobLines[startIndex],
    ...(nextStep === -1 ? rest : rest.slice(0, nextStep)),
  ];
}

describe("workflow pnpm availability", () => {
  it("installs pnpm before setup-node caches the pnpm store, in every job", () => {
    const offending = [];

    for (const file of workflowFiles) {
      const path = join(".github", "workflows", file);
      for (const job of jobBlocks(read(path))) {
        for (let index = 0; index < job.lines.length; index += 1) {
          const line = job.lines[index];
          if (!line.includes("uses: actions/setup-node")) continue;

          const step = stepLinesAt(job.lines, index);
          if (!step.some((stepLine) => stepLine.includes("cache: pnpm")))
            continue;

          const firstPnpmLine = job.lines.findIndex((jobLine) =>
            jobLine.includes("pnpm/action-setup"),
          );
          if (firstPnpmLine === -1 || firstPnpmLine > index) {
            offending.push(`${path} (${job.name}): ${line.trim()}`);
          }
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
