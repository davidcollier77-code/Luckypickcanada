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
  it("uses concise Gemini-only rules based on Amazon Q's A-B-C structure", () => {
    expect(existsSync(rulesPath)).toBe(true);
    expect(rules).toContain("Gemini's only agent-instruction file.");
    expect(rules).toContain("Review the pull request for:");
    expect(rules).toContain("Security vulnerabilities.");
    expect(rules).toContain("confidence of at least 0.80");
    expect(rules).toContain("🔴 A — ANALYZE");
    expect(rules).toContain("🔴 B — BOUNDARIES");
    expect(rules).toContain("🔴 C — COMMUNICATE");
    expect(rules).toContain("Use `.docs/manifest.json` to choose the smallest relevant task group(s).");
    expect(rules).toContain("_google-gemini_gemini-cli.md");
    expect(rules).toContain("_websites_ai_google_dev_gemini-api.md");
    expect(rules).toContain("Treat Gemini reference snapshots as optional, task-specific references");
    expect(rules).toContain("MUST still attempt bounded read-only source-context retrieval");
    expect(rules).toContain("USED: YES/NO");
    expect(rules).toContain("USEFUL: YES/NO");
    expect(rules).toContain("@gemini full review");
    expect(rules).toContain("@gemini repair all");
    expect(rules).not.toMatch(/AGENTS\.md|jules/i);
  });

  it("passes only Gemini's own rules as model system instructions", () => {
    expect(script).toContain('systemInstruction: { parts: [{ text: RULES }] }');
    expect(fixScript).toContain('systemInstruction: { parts: [{ text: rules }] }');
    expect(script).toContain("Read the repository's root AGENTS.md first");
    expect(fixScript).not.toContain("AGENTS.md");
    expect(script).not.toContain("Trusted repository governance");
    expect(fixScript).not.toContain("Trusted AGENTS.md governance");
  });

  it("runs automatic reviews and accepts full review plus single/all targeted repair requests", () => {
    expect(workflow).toContain("pull_request_target:");
    expect(workflow).toContain("opened, reopened, synchronize, ready_for_review, review_requested");
    expect(workflow).toContain("issue_comment:");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("options: [review, fix]");
    expect(script).toContain("@gemini full review");
    expect(script).toContain("@gemini repair one");
    expect(script).toContain("@gemini repair all");
    expect(script).toContain("parseRepairCommand");
    expect(script).toContain("requestedFindings = matchTargetFinding");
    expect(script).toContain("Gemini Targeted Fix");
    expect(script).toContain("Gemini On-Demand Fix Suggestions");
    expect(script).toContain("Fix all findings");
    expect(script).toContain("Copy/paste implementation prompt");
    expect(script).toContain("Select one or more finding checkboxes above");
    expect(script).toContain("function parseReviewAction(body, previousBody = \"\")");
    expect(script).not.toContain("@gemini repair selected");
    expect(script).toContain("async function fetchAllReviews(number, fetchPage = gh, repo = REPO)");
    expect(script).toContain("await fetchAllReviews(number)");
    expect(script).toContain("findReviewStateForHead(reviews, pr.head.sha)");
    expect(script).toContain("resolveEventAction(body, previousBody, event.action)");
    expect(script).toContain("selectionLimitExceeded");
    expect(script).toContain("serializeReviewState(pr.head.sha, findings)");
  });

  it("uses trusted base-branch code and limited workflow permissions", () => {
    expect(workflow).toContain("github.event.pull_request.base.ref || github.event.repository.default_branch");
    expect(workflow).not.toContain("github.event.pull_request.base.sha || github.event.repository.default_branch");
    expect(workflow).toContain("persist-credentials: false");
    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("pull-requests: write");
    expect(workflow).toContain("git diff --exit-code -- .gemini/rules .github/workflows .github/scripts");
    expect(script).toContain("author_association");
    expect(script).toContain('if (!pr || typeof pr !== "object")');
    expect(script.indexOf("if (!API_KEY)")).toBeLessThan(script.indexOf("const list = await getFiles(number)"));
    expect(script.indexOf("if (!API_KEY)")).toBeLessThan(script.indexOf("const sourceContext = await collectSourceContext(pr, files)"));
  });

  it("uses selected task groups, relevance-guards Gemini references, and reports actual usage", () => {
    expect(script).toContain("function isGeminiCliDoc(path)");
    expect(script).toContain("function isGeminiDeepResearchDoc(path)");
    expect(script).toContain("function isGeminiReferenceRelevant(path, pr, files)");
    expect(script).toContain("_google-gemini_gemini-cli.md");
    expect(script).toContain("_websites_ai_google_dev_gemini-api.md");
    expect(script).toContain("Gemini reference snapshots are OPTIONAL, not required per group.");
    expect(script).toContain("const selectedReferenceDocs = selectRelevantGeminiReferenceDocs(groupPaths, pr, files);");
    expect(script).toContain("if (isGeminiReferenceDoc(path)) {");
    expect(script).toContain("if (!isGeminiReferenceRelevant(path, pr, files)) continue;");
    expect(script).toContain("if (selectedReferenceDocs.some((doc) => doc.kind === kind)) continue;");
    expect(script).toContain("const groupPrefixes = groups.map");
    expect(script).toContain("const availableSet = new Set(groupPaths)");
    expect(script).toContain("function geminiManifestGroups()");
    expect(script).toContain('const allDocPaths = mode === "initial" ? [] : walkDocs(resolve(ROOT, ".docs")).filter((path) => !isJulesSpecificDoc(path));');
    expect(script).toContain("Selected task group(s):**");
    expect(script).toContain("USED: YES; USEFUL: ");
    expect(script).toContain("USED: NO; USEFUL: NO;");
    expect(script).toContain("const documentReport = docReport(docState.loaded, docState.unloaded, assessments, selection);");
    expect(script).toContain('mode = "initial";');
    expect(script).toContain('const selection = mode === "initial"');
    expect(script).toContain('mode === "initial" ? { loaded: [], unloaded: [] } : loadDocs(selection)');
    expect(fixScript).toContain("documentReport");
  });

  it("uses the configured three-model Gemini fallback chain without adding dependencies", () => {
    expect(workflow).toContain("GEMINI_PRIMARY_MODEL: gemini-3.8-flash");
    expect(workflow).toContain("GEMINI_FALLBACK_MODEL: gemini-3.6-flash");
    expect(workflow).toContain("GEMINI_SECOND_FALLBACK_MODEL: gemini-3.5-flash-lite");
    expect(script).toContain('const PRIMARY = process.env.GEMINI_PRIMARY_MODEL || "gemini-3.8-flash";');
    expect(script).toContain('const FALLBACK = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.6-flash";');
    expect(script).toContain('const SECOND_FALLBACK = process.env.GEMINI_SECOND_FALLBACK_MODEL || "gemini-3.5-flash-lite";');
    expect(fixScript).toContain('const SECOND_FALLBACK = process.env.GEMINI_SECOND_FALLBACK_MODEL || "gemini-3.5-flash-lite";');
    expect(script).toContain("const models = [PRIMARY, FALLBACK, SECOND_FALLBACK].filter((x, i, a) => x && a.indexOf(x) === i);");
    expect(script).toContain("const sourceContext = await collectSourceContext(pr, files);");
    expect(script).not.toContain("Source context skipped for initial automatic review.");
    expect(script).toContain("changed text file(s) exceeded the ");
    expect(script).toContain("patches remain included in review batches.");
    expect(fixScript).toContain("const models = [PRIMARY, FALLBACK, SECOND_FALLBACK].filter((model, index, all) => model && all.indexOf(model) === index);");
    expect(script).toContain("generativelanguage.googleapis.com/v1beta/models/");
    expect(script).toContain("GEMINI_API_KEY");
    expect(script).toContain("luckypickcanada.md");
    expect(script).toContain("for (let attempt = 1; attempt <= 2; attempt += 1)");
    expect(fixScript).toContain("for (let attempt = 1; attempt <= 2; attempt += 1)");
    expect(script).toContain('log("Model " + models[index] + " attempt " + attempt + " failed: " + reason);');
    expect(fixScript).toContain('console.error("[Gemini PR Reviewer] Fix model " + models[ix] + " attempt " + attempt + " failed: " + reason);');
    expect(script).toContain("All configured Gemini models failed after bounded retries.");
    expect(fixScript).toContain("All configured Gemini models failed while generating fix suggestions.");
  });

  it("generates opt-in GitHub suggestions rather than directly writing code", () => {
    expect(fixScript).toContain("isEligiblePath");
    expect(fixScript).toContain("suggestion");
    expect(fixScript).toContain("Commit suggestion");
    expect(fixScript).toContain("comments.length >= 25");
    expect(fixScript).not.toContain('["push"');
    expect(fixScript).not.toContain('["commit"');
    expect(fixScript).toContain(".docs/");
  });

  it("validates event-specific modes once before prompt construction", () => {
    const validations = script.match(/if \(!Number\.isInteger\(Number\(number\)\)/g) || [];
    expect(validations).toHaveLength(1);
    const validationIndex = script.indexOf("if (!Number.isInteger(Number(number))");
    const promptIndex = script.indexOf("const prompt = [");
    expect(validationIndex).toBeGreaterThan(-1);
    expect(validationIndex).toBeLessThan(promptIndex);
    expect(script).toContain('(EVENT_NAME === "workflow_dispatch" ? !["review", "fix"].includes(mode) : !["initial", "review", "fix", "fix-one", "fix-selected"].includes(mode))');
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

  it("keeps Amazon Q's original rules outside Gemini's implementation scope", () => {
    const aqRulesPath = ".amazonq/rules/luckypickcanada.md";
    // The Amazon Q rules file must remain present and unchanged.
    expect(existsSync(aqRulesPath)).toBe(true);
    // Gemini's scripts and workflow must not reference the Amazon Q rules file.
    expect(script).not.toContain(aqRulesPath);
    expect(fixScript).not.toContain(aqRulesPath);
    expect(workflow).not.toContain(aqRulesPath);
  });
});
