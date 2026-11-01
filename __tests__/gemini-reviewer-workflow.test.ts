import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const workflow = readFileSync(".github/workflows/gemini-reviewer.yml", "utf8");
const rulesPath = "GEMINI_REVIEWER.md";
const rules = readFileSync(rulesPath, "utf8");
const scriptPath = ".github/scripts/gemini-reviewer.cjs";
const script = readFileSync(scriptPath, "utf8");
const fixPath = ".github/scripts/gemini-autofix.cjs";
const fixScript = readFileSync(fixPath, "utf8");

describe("Gemini PR reviewer", () => {
  it("uses one simplified root instruction file based on Amazon Q's A-B-C structure", () => {
    expect(rulesPath).toBe("GEMINI_REVIEWER.md");
    expect(existsSync(rulesPath)).toBe(true);
    expect(existsSync(".gemini/rules/luckypickcanada.md")).toBe(false);
    expect(rules).toContain("Gemini's single authoritative pull-request review instruction file");
    expect(rules).toContain("🔴 A — ANALYZE");
    expect(rules).toContain("🔴 B — BOUNDARIES");
    expect(rules).toContain("🔴 C — COMMUNICATE");
    expect(rules).toContain("Bugs and logic errors.");
    expect(rules).toContain("Security vulnerabilities.");
    expect(rules).toContain("Do not invent issues or present speculation as confirmed defects.");
    expect(rules).toContain("Do not flag harmless style preferences.");
    expect(rules).toContain("Do not repeat resolved findings.");
    expect(rules).toContain("Distinguish confirmed defects from potential risks.");
    expect(rules).toContain("Never make direct repository changes, commits, pushes, approvals or merges.");
    expect(rules).toContain("owner-controlled, opt-in fix-suggestion process");
    expect(rules).toContain("confidence of at least 0.80");
    expect(rules).toContain("⚪ neutral");
    expect(rules).toContain("Fix Selected");
    expect(rules).toContain("Fix All");
    expect(rules).toContain("@gemini full review");
    expect(rules).toContain("If no issues are found, say so clearly");
    expect(rules).not.toContain("manifest.json");
    expect(rules).not.toContain("_google-gemini");
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

  it("runs automatic reviews and accepts one manual full-review command plus the two fix controls", () => {
    expect(workflow).toContain("pull_request_target:");
    expect(workflow).toContain("opened, reopened, synchronize, ready_for_review, review_requested");
    expect(workflow).toContain("issue_comment:");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("options: [review, fix]");
    expect(script).toContain("@gemini full review");
    expect(script).toContain("parseFullReviewCommand");
    expect(script).not.toContain("@gemini repair one");
    expect(script).not.toContain("@gemini repair all");
    expect(script).not.toContain("parseRepairCommand");
    expect(script).not.toContain("parseSelectionCommand");
    expect(script).not.toContain("setFindingSelection");
    expect(script).toContain("mentionsReviewerCommand");
    expect(script).toContain("resolveRequestedFindings(state.findings, { mode, targetFinding })");
    expect(script).toContain("🛠️ **Fix Selected**");
    expect(script).toContain("🪄 **Fix All**");
    const unmatchedGuardIndex = script.indexOf("if (!requestedFindings.length) {");
    const unmatchedMessageIndex = script.indexOf("The requested finding(s) could not be matched.");
    const fixModuleIndex = script.indexOf('const fixModule = require("./gemini-autofix.cjs");');
    expect(unmatchedGuardIndex).toBeGreaterThan(script.indexOf("const requestedFindings = resolution.selected;"));
    expect(unmatchedGuardIndex).toBeLessThan(unmatchedMessageIndex);
    expect(unmatchedMessageIndex).toBeLessThan(fixModuleIndex);
    expect(script).toContain("Gemini Targeted Fix");
    expect(script).toContain("Gemini On-Demand Fix Suggestions");
    expect(script).toContain("Copy/paste implementation prompt");
    expect(script).toContain("function parseReviewAction(body, previousBody = \"\")");
    expect(script).not.toContain("@gemini repair selected");
    expect(script).toContain("async function fetchAllReviews(number, fetchPage = gh, repo = REPO)");
    expect(script).toContain("await fetchAllReviews(number)");
    expect(script).toContain("findReviewStateForHead(reviews, pr.head.sha)");
    expect(script).toContain("resolveEventAction(body, previousBody, event.action)");
    expect(script).toContain("selectionLimitExceeded");
    expect(script).toContain("serializeReviewState(pr.head.sha, findings)");
    expect(script).toContain('const reviewBody = summary.join("\\n") + serializeReviewState(pr.head.sha, findings);');
    expect(script).toContain('batchFailures.push("Adversarial review for batch "');
    expect(script).not.toContain("if (primaryFindings.length > 0)");
  });

  it("uses trusted base-branch code and limited workflow permissions", () => {
    expect(workflow).toContain("github.event.pull_request.base.ref || github.event.repository.default_branch");
    expect(workflow).not.toContain("github.event.pull_request.base.sha || github.event.repository.default_branch");
    expect(workflow).toContain("persist-credentials: false");
    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("pull-requests: write");
    expect(workflow).toContain("git diff --exit-code -- GEMINI_REVIEWER.md .github/workflows .github/scripts");
    expect(script).toContain("author_association");
    expect(script).toContain('if (!pr || typeof pr !== "object")');
    expect(script.indexOf("if (!API_KEY)")).toBeLessThan(script.indexOf("const list = await getFiles(number)"));
    expect(script.indexOf("if (!API_KEY)")).toBeLessThan(script.indexOf("const sourceContext = await collectSourceContext(pr, files)"));
  });

  it("keeps Library documentation out of every Gemini review and fix prompt", () => {
    expect(script).toContain('const RULE_PATH = "GEMINI_REVIEWER.md";');
    expect(script).toContain('systemInstruction: { parts: [{ text: RULES }] }');
    expect(fixScript).toContain('systemInstruction: { parts: [{ text: rules }] }');
    for (const source of [script, fixScript]) {
      expect(source).not.toContain(".docs/manifest.json");
      expect(source).not.toContain("document_assessments");
      expect(source).not.toContain("documentReport");
      expect(source).not.toContain("DOCUMENT: ");
    }
    for (const removed of ["walkDocs", "chooseDocs", "loadDocs", "docReport", "loadDocumentManifest", "GEMINI_API_DEV_SKILL"]) {
      expect(script).not.toContain(removed);
    }
    // Changed-file patches and bounded relevant source retrieval must survive the simplification.
    expect(script).toContain("const sourceContext = await collectSourceContext(pr, files);");
    expect(script).toContain("renderSourceContext");
    expect(script).toContain("clipSourceWithAnchors");
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
    expect(script).toContain("changed code file(s) exceeded the ");
    expect(script).toContain("patches remain included in review batches.");
    expect(fixScript).toContain("const models = [PRIMARY, FALLBACK, SECOND_FALLBACK].filter((model, index, all) => model && all.indexOf(model) === index);");
    expect(script).toContain("generativelanguage.googleapis.com/v1beta/models/");
    expect(script).toContain("GEMINI_API_KEY");
    expect(script).toContain("GEMINI_REVIEWER.md");
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
    expect(fixScript).toContain("const MAX_SUGGESTIONS = 25;");
    expect(fixScript).toContain("comments.length >= MAX_SUGGESTIONS");
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
    expect(script).toContain('(EVENT_NAME === "workflow_dispatch" ? !["review", "fix"].includes(mode) :');
    expect(script).toContain('!["initial", "review", "fix", "fix-selected"].includes(mode))');
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

  it("loads the root instruction file as the model system instruction at runtime", () => {
    const probe = [
      'const { RULE_PATH, RULES } = require("./.github/scripts/gemini-reviewer.cjs");',
      'process.stdout.write(JSON.stringify({ path: RULE_PATH, analyze: RULES.includes("A — ANALYZE"), boundaries: RULES.includes("B — BOUNDARIES"), communicate: RULES.includes("C — COMMUNICATE"), library: RULES.includes("is never loaded into review or fix context") }));'
    ].join("\n");
    const result = spawnSync(process.execPath, ["-e", probe], {
      cwd: process.cwd(),
      encoding: "utf8"
    });
    expect(result.status, result.stderr || result.stdout).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.path).toBe("GEMINI_REVIEWER.md");
    expect(payload.analyze).toBe(true);
    expect(payload.boundaries).toBe(true);
    expect(payload.communicate).toBe(true);
    expect(payload.library).toBe(true);
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

  it("routes the Gemini API Developer Skill only to relevant task groups and the general API overview to Creation", () => {
    const manifest = JSON.parse(readFileSync(".docs/manifest.json", "utf8"));
    const skillId = "/google-gemini/gemini-skills/gemini-api-dev";
    const apiId = "/websites/ai_google_dev_gemini-api";
    const allGroups = ["creation", "troubleshooting", "polishing", "testing", "security", "audio", "deep-dive", "seo"];
    expect(Object.keys(manifest.groups)).toEqual(allGroups);
    for (const group of ["creation", "troubleshooting", "deep-dive"]) expect(manifest.groups[group]).toContain(skillId);
    for (const group of allGroups.filter((name) => !["creation", "troubleshooting", "deep-dive"].includes(name))) expect(manifest.groups[group]).not.toContain(skillId);
    expect(manifest.sources[skillId].url).toBe("https://raw.githubusercontent.com/google-gemini/gemini-skills/main/skills/gemini-api-dev/SKILL.md");
    expect(manifest.sources[apiId].url).toBe("https://ai.google.dev/gemini-api/docs.md.txt");
    expect(manifest.groups.creation).toContain(apiId);
    for (const group of allGroups.filter((name) => name !== "creation")) expect(manifest.groups[group]).not.toContain(apiId);
    expect(manifest.inventory).toContain(skillId);
    expect(manifest.inventory).toContain("/google/eng-practices");
    expect(readFileSync(".docs/creation/_google-gemini_gemini-skills_gemini-api-dev.md", "utf8")).toContain("name: gemini-api-dev");
    const groups = ["creation", "troubleshooting", "polishing", "testing", "security", "audio", "deep-dive", "seo"];
    for (const group of groups) {
      const instructions = readFileSync(`.freebuff/${group}.md`, "utf8");
      if (["creation", "troubleshooting", "deep-dive"].includes(group)) expect(instructions).toContain("Conditional Gemini API Developer Skill Reference");
      else expect(instructions).not.toContain("Gemini API Developer Skill");
    }
    for (const group of ["audio", "polishing", "testing", "security", "seo"]) expect(existsSync(`.docs/${group}/_google-gemini_gemini-skills_gemini-api-dev.md`)).toBe(false);
  });

});
