import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const workflow = readFileSync(".github/workflows/gemini-reviewer.yml", "utf8");
const rulesPath = ".gemini/rules/luckypickcanada.md";
const rules = readFileSync(rulesPath, "utf8");
const scriptPath = ".github/scripts/gemini-reviewer.cjs";
const script = readFileSync(scriptPath, "utf8");
const fixPath = ".github/scripts/gemini-autofix.cjs";
const fixScript = readFileSync(fixPath, "utf8");

describe("Gemini PR reviewer", () => {
  it("uses separate rules based on Amazon Q's review standards", () => {
    expect(existsSync(rulesPath)).toBe(true);
    expect(rules).toContain("Bugs and logic errors.");
    expect(rules).toContain("Security vulnerabilities.");
    expect(rules).toContain("confidence of at least 0.80");
    expect(rules).toContain("DOCUMENT-LIBRARY SELECTION AND EVIDENCE");
    expect(rules).toContain("There is no one-group limit.");
    expect(rules).toContain("which were materially useful, and why");
    expect(rules).toContain("Never approve or merge a pull request.");
    expect(rules).toContain("GitHub's native inline suggestion format");
  });

  it("runs automatic reviews and accepts explicit suggestion requests", () => {
    expect(workflow).toContain("pull_request_target:");
    expect(workflow).toContain("opened, reopened, synchronize, ready_for_review, review_requested");
    expect(workflow).toContain("issue_comment:");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("options: [review, fix]");
    expect(script).toContain("@gemini full review");
    expect(script).toContain("@gemini repair all");
    expect(script).toContain("Gemini On-Demand Fix Suggestions");
    expect(script).toContain("Commands: comment exactly @gemini full review");
  });

  it("checks out trusted base code with limited permissions", () => {
    expect(workflow).toContain("github.event.pull_request.base.sha || github.event.repository.default_branch");
    expect(workflow).toContain("persist-credentials: false");
    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("pull-requests: write");
    expect(workflow).toContain("git diff --exit-code -- .gemini/rules .github/workflows .github/scripts");
    expect(script).toContain("author_association");
    expect(script).toContain('if (!pr || typeof pr !== "object")');
    expect(script.indexOf("if (!API_KEY)")).toBeLessThan(script.indexOf("const list = await getFiles(number)"));
    expect(script).toContain("AGENTS.md");
  });

  it("uses the configured Gemini primary and fallback models without dependencies", () => {
    expect(workflow).toContain("GEMINI_PRIMARY_MODEL: gemini-3.8-flash");
    expect(workflow).toContain("GEMINI_FALLBACK_MODEL: gemini-3.6-flash");
    expect(script).toContain("generativelanguage.googleapis.com/v1beta/models/");
    expect(script).toContain("GEMINI_API_KEY");
    expect(script).toContain("luckypickcanada.md");
  });

  it("generates optional native suggestions instead of writing repository code", () => {
    expect(fixScript).toContain("isEligiblePath");
    expect(fixScript).toContain("suggestion");
    expect(fixScript).toContain("Commit suggestion");
    expect(fixScript).toContain("comments.length >= 25");
    expect(fixScript).not.toContain('["push"');
    expect(fixScript).not.toContain('["commit"');
    expect(fixScript).toContain(".docs/");
  });

  it("parses the reviewer scripts without executing them", () => {
    for (const path of [scriptPath, fixPath]) {
      const result = spawnSync(process.execPath, ["--check", path], {
        cwd: process.cwd(),
        encoding: "utf8"
      });
      expect(result.status, result.stderr || result.stdout).toBe(0);
    }
  });

  it("does not add Amazon Q's original rules file to its implementation scope", () => {
    const paths = [
      ".gemini/rules/luckypickcanada.md",
      ".github/workflows/gemini-reviewer.yml",
      ".github/scripts/gemini-reviewer.cjs",
      ".github/scripts/gemini-autofix.cjs",
      "__tests__/gemini-reviewer-workflow.test.ts"
    ];
    expect(paths).not.toContain(".amazonq/rules/luckypickcanada.md");
  });
});
