import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";

const workflow = readFileSync(".github/workflows/gemini-reviewer.yml", "utf8");
const rulesPath = ".gemini/rules/luckypickcanada.md";
const rules = readFileSync(rulesPath, "utf8");
const script = readFileSync(".github/scripts/gemini-reviewer.mjs", "utf8");

describe("Gemini PR reviewer", () => {
  it("uses a separate rules file copied from the Amazon Q review standards", () => {
    expect(existsSync(rulesPath)).toBe(true);
    expect(rules).toContain("Bugs and logic errors.");
    expect(rules).toContain("Security vulnerabilities.");
    expect(rules).toContain("confidence of at least 0.80");
    expect(rules).toContain("DOCUMENT-LIBRARY SELECTION AND EVIDENCE");
    expect(rules).toContain("There is no one-group limit.");
    expect(rules).toContain("which were materially useful, and why");
    expect(rules).toContain("Never approve or merge a pull request.");
  });

  it("runs automatic reviews, accepts explicit fix requests, and supports manual dispatch", () => {
    expect(workflow).toContain("pull_request_target:");
    expect(workflow).toContain("types: [opened, reopened, synchronize, ready_for_review, review_requested]");
    expect(workflow).toContain("issue_comment:");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("options: [review, fix]");
    expect(script).toContain("/gemini-fix");
  });

  it("uses trusted base-branch code rather than executing pull-request code", () => {
    expect(workflow).toContain("github.event.pull_request.base.sha || github.event.repository.default_branch");
    expect(workflow).toContain("persist-credentials: true");
    expect(script).toContain("pull_request_target");
    expect(script).toContain("author_association");
  });

  it("uses the primary Gemini model and fallback without adding a dependency", () => {
    expect(workflow).toContain("GEMINI_PRIMARY_MODEL: gemini-3.8-flash");
    expect(workflow).toContain("GEMINI_FALLBACK_MODEL: gemini-3.6-flash");
    expect(script).toContain("generativelanguage.googleapis.com/v1beta/models/");
    expect(script).toContain("GEMINI_API_KEY");
    expect(script).toContain("luckypickcanada.md");
  });

  it("requires fixes to stay inside eligible files already changed by the pull request", () => {
    expect(script).toContain("isEligibleAutoFixPath");
    expect(script).toContain("git apply --check");
    expect(script).toContain("head.repo.full_name");
    expect(script).toContain("git diff --check");
  });
});
