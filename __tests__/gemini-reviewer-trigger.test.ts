import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.GEMINI_API_KEY = "test-key-not-a-secret";
process.env.GEMINI_PRIMARY_MODEL = "gemini-3.8-flash";
process.env.GEMINI_FALLBACK_MODEL = "gemini-3.6-flash";
process.env.GEMINI_SECOND_FALLBACK_MODEL = "gemini-3.5-flash-lite";

const require = createRequire(import.meta.url);
const reviewer = require("../.github/scripts/gemini-reviewer.cjs");
const autofix = require("../.github/scripts/gemini-autofix.cjs");

const tick = String.fromCharCode(96);
const fence = tick.repeat(3);

const redFinding = {
  path: "app/api/demo/route.js", line: 12, inline: true, severity: "HIGH", confidence: 0.93,
  title: "Response is cached without checking the database", problem: "The route returns a cached value.",
  impact: "Deleted records stay visible.", fix: "Invalidate the cache before returning.", suggestion: null
};
const yellowFinding = {
  path: "app/homepage/HomePage.js", line: 40, inline: false, severity: "MEDIUM", confidence: 0.88,
  title: "Error path is silent", problem: "A rejected fetch leaves the spinner state set.",
  impact: "The page looks stuck.", fix: "Reset the state in the catch block.", suggestion: null
};
const lowFinding = {
  path: "app/homepage/HomePage.js", line: 55, inline: false, severity: "LOW", confidence: 0.85,
  title: "Unused helper retained", problem: "The helper is no longer referenced.",
  impact: "Minor dead code.", fix: "Remove the helper.", suggestion: null
};

const reviewBody = (findings: unknown[], options: Record<string, unknown> = {}) =>
  reviewer.formatReviewSections({ findings, pullRequestNumber: 1700, ...options });

// Simulates the only interaction GitHub offers the owner: editing this review's checkboxes.
const tickCheckbox = (body: string, matcher: RegExp, checked = true) =>
  body.split("\n").map((line: string) => (matcher.test(line) ? line.replace(/^- \[[ x]\]/, checked ? "- [x]" : "- [ ]") : line)).join("\n");

describe("Gemini manual full-review trigger", () => {
  it("accepts the exact command however a person actually pastes it", () => {
    const accepted = [
      "@gemini full review",
      "@gemini full review ",                      // the real PR #1661 comment body
      "  @gemini full review\n",
      "@GEMINI FULL REVIEW",
      tick + "@gemini full review" + tick,
      "**@gemini full review**",
      "> @gemini full review",
      "Before I forget:\n\n@gemini full review\n\nthanks!"
    ];
    for (const body of accepted) {
      expect(reviewer.parseFullReviewCommand(body), body).toEqual({ mode: "review", command: "@gemini full review" });
      expect(reviewer.resolveEventAction(body, "", "created"), body).toEqual({ mode: "review", command: "@gemini full review" });
    }
  });

  it("rejects every other command, including the removed repair and selection commands", () => {
    const rejected = [
      "", "ship it", "@gemini", "@gemini review", "@gemini full", "@gemini full review please",
      "@gemini review all", "@gemini full reviews",
      "@gemini repair one app/homepage/HomePage.js:40 -- Error path is silent",
      "@gemini repair all", "@gemini select all", "@gemini select none", "@gemini fix selected"
    ];
    for (const body of rejected) {
      expect(reviewer.parseFullReviewCommand(body), body).toBeNull();
    }
  });

  it("makes an unsupported @gemini command visible instead of silently ignoring it", () => {
    expect(reviewer.mentionsReviewerCommand("@gemini repair all")).toBe(true);
    expect(reviewer.mentionsReviewerCommand("@gemini full review")).toBe(true);
    expect(reviewer.mentionsReviewerCommand("Looks good to me")).toBe(false);
    // The unrecognised command resolves to no action, which the workflow answers with a
    // visible explanation rather than a silent return.
    expect(reviewer.resolveEventAction("@gemini repair all", "", "created")).toBeNull();
  });

  it("publishes exactly two fix controls and one copyable command at the very bottom", () => {
    const body = reviewBody([redFinding, yellowFinding]);
    expect(body).toContain("- [ ] 🛠️ **Fix Selected**");
    expect(body).toContain("- [ ] 🪄 **Fix All**");
    expect(body).not.toContain("Select all findings");
    expect(body).not.toContain("Clear selection");
    expect(body).not.toContain("@gemini repair");
    expect(body).not.toContain("@gemini select");
    expect(body).not.toContain("@gemini fix selected");
    // Only one manual command exists, and it is the last thing in the review.
    expect(body.split("@gemini full review").length - 1).toBe(1);
    expect(body.trimEnd().endsWith(fence + "text\n@gemini full review\n" + fence)).toBe(true);
    expect(body).toContain("### Request fixes");
    expect(body).toContain("Select the checkbox beside any red or yellow findings you want Gemini to address, then choose Fix Selected. To request suggestions for every eligible finding, choose Fix All.");
    expect(body).toContain("Gemini will recheck findings against the latest PR code and provide safe, eligible native GitHub suggestions. You remain in control of accepting suggestions.");
    expect(body).toContain("To request a fresh review of the latest PR commit, copy the command below and post it in the PR conversation.");
  });

  it("gives every red and yellow finding its own checkbox, both selectable", () => {
    const body = reviewBody([redFinding, yellowFinding, lowFinding]);
    const boxes = body.split("\n").filter((line: string) => /^- \[[ x]\] Finding /.test(line));
    expect(boxes).toHaveLength(3);
    expect(boxes.filter((line: string) => line.includes("🔴"))).toHaveLength(1);
    expect(boxes.filter((line: string) => line.includes("🟡"))).toHaveLength(2);
    const ids = boxes.map((line: string) => line.match(/- \[[ x]\] Finding `([a-f0-9]{12})`/)![1]);
    expect(new Set(ids).size).toBe(3);
    // A red and a yellow finding are both selectable.
    const selected = tickCheckbox(tickCheckbox(body, new RegExp("Finding " + tick + ids[0])), new RegExp("Finding " + tick + ids[1]));
    expect(reviewer.parseSelectedIds(selected).sort()).toEqual([ids[0], ids[1]].sort());
  });

  it("identifies the exact reviewed head in the published result", () => {
    const sha = "a".repeat(40);
    const body = reviewBody([redFinding], { reviewedSha: sha });
    expect(body).toContain("**Reviewed commit:** " + tick + sha + tick);
  });
});

describe("Gemini status colours", () => {
  it("uses red only for confirmed critical/high findings", () => {
    expect(reviewer.buildReviewVerdict([{ severity: "CRITICAL" }], []).status).toBe("red");
    expect(reviewer.buildReviewVerdict([{ severity: "HIGH" }], []).status).toBe("red");
    expect(reviewer.buildReviewVerdict([{ severity: "HIGH" }], []).marker).toBe("🔴");
    expect(reviewer.buildReviewVerdict([{ severity: "HIGH" }], []).label).toBe("FIXES NEEDED");
  });

  it("uses yellow for confirmed warnings, including low-severity ones", () => {
    expect(reviewer.buildReviewVerdict([{ severity: "MEDIUM" }], []).status).toBe("yellow");
    expect(reviewer.buildReviewVerdict([{ severity: "LOW" }], []).status).toBe("yellow");
    expect(reviewer.buildReviewVerdict([{ severity: "MEDIUM" }], []).marker).toBe("🟡");
    expect(reviewer.buildReviewVerdict([{ severity: "MEDIUM" }], []).label).toBe("WARNINGS FOUND");
  });

  it("is green only for a completed review with coverage and no findings", () => {
    const green = reviewer.buildReviewVerdict([], [], { reviewCompleted: true });
    expect(green.status).toBe("green");
    expect(green.marker).toBe("🟢");
    expect(green.label).toBe("REVIEW COMPLETE — NO FINDINGS");
  });

  it("never shows red or green for an incomplete or failed review", () => {
    const gaps = reviewer.buildReviewVerdict([], ["app/a.js was not fully examined."]);
    expect(gaps.status).toBe("incomplete");
    expect(gaps.marker).toBe("⚪");
    expect(gaps.label).toBe("REVIEW INCOMPLETE — NOT VERIFIED");
    expect(gaps.detail).toContain("app/a.js was not fully examined.");
    const failed = reviewer.buildReviewVerdict([], [], { reviewCompleted: false });
    expect(failed.status).toBe("incomplete");
    expect(failed.marker).toBe("⚪");
    expect(failed.detail).toMatch(/Unverified/);
    const partialWithFinding = reviewer.buildReviewVerdict([{ severity: "MEDIUM" }], ["gap"], { reviewCompleted: false });
    expect(partialWithFinding.status).toBe("yellow");
  });

  it("renders a clean completed review as green with no red marker anywhere", () => {
    const clean = reviewBody([], { reviewedSha: "b".repeat(40) });
    expect(clean).toContain("🟢 **REVIEW COMPLETE — NO FINDINGS**");
    expect(clean).not.toContain("🔴");
    const incomplete = reviewBody([], { coverageGaps: ["app/a.js was only partly examined."] });
    expect(incomplete).toContain("⚪ **REVIEW INCOMPLETE — NOT VERIFIED**");
    expect(incomplete).not.toContain("🟢");
    expect(incomplete).not.toContain("🔴");
  });

  it("reports a technically failed review as incomplete rather than clean", () => {
    const body = reviewBody([], { reviewCompleted: false, coverageGaps: ["Primary review for batch 1 failed."] });
    expect(body).toContain("⚪ **REVIEW INCOMPLETE — NOT VERIFIED**");
    expect(body).not.toContain("REVIEW COMPLETE");
  });

  it("classifies severity consistently", () => {
    expect(reviewer.classifyFindingCategory({ severity: "CRITICAL" })).toBe("red");
    expect(reviewer.classifyFindingCategory({ severity: "HIGH" })).toBe("red");
    expect(reviewer.classifyFindingCategory({ severity: "MEDIUM" })).toBe("yellow");
    expect(reviewer.classifyFindingCategory({ severity: "LOW" })).toBe("yellow");
    expect(reviewer.FINDING_CATEGORIES.map((item: { id: string }) => item.id)).toEqual(["red", "yellow"]);
  });
});

describe("Gemini Fix Selected and Fix All", () => {
  const body = reviewBody([redFinding, yellowFinding, lowFinding]);
  const ids = body.split("\n").filter((line: string) => /^- \[[ x]\] Finding /.test(line))
    .map((line: string) => line.match(/- \[[ x]\] Finding `([a-f0-9]{12})`/)![1]);
  const files = [
    { filename: "app/api/demo/route.js", patch: "@@ -10,3 +10,4 @@\n a\n+b\n c\n d" },
    // The added line lands on 40, which is where the yellow finding is anchored.
    { filename: "app/homepage/HomePage.js", patch: "@@ -38,3 +38,4 @@\n x\n y\n+z\n w" }
  ];

  // Fix Selected requires a checked finding and a ticked Fix Selected control, exactly as
  // the review footer instructs the owner.
  const checkFinding = (body: string, id: string) => tickCheckbox(body, new RegExp("Finding " + tick + id));

  it("acts only on the findings the owner checked", () => {
    const oneChecked = tickCheckbox(checkFinding(body, ids[0]), /Fix Selected\*\*/);
    const action = reviewer.parseReviewAction(oneChecked, body);
    expect(action).toEqual({ mode: "fix-selected", targetFinding: [ids[0]] });
    const state = { sha: "head", findings: [redFinding, yellowFinding, lowFinding].map((f) => ({ ...f, id: reviewer.generateFindingId(f) })) };
    const resolution = reviewer.resolveRequestedFindings(state.findings, action);
    expect(resolution.selected.map((item: { id: string }) => item.id)).toEqual([ids[0]]);
    expect(resolution.selected.some((item: { title: string }) => item.title === yellowFinding.title)).toBe(false);
  });

  it("acts only on multiple checked findings, red and yellow together", () => {
    const twoChecked = tickCheckbox(checkFinding(checkFinding(body, ids[0]), ids[1]), /Fix Selected\*\*/);
    const action = reviewer.parseReviewAction(twoChecked, body);
    expect(action.mode).toBe("fix-selected");
    expect(action.targetFinding.sort()).toEqual([ids[0], ids[1]].sort());
  });

  it("does not fire when no control was newly ticked", () => {
    const fixAllChecked = tickCheckbox(body, /Fix All\*\*/);
    expect(reviewer.parseReviewAction(fixAllChecked, body)).toEqual({ mode: "fix" });
    expect(reviewer.parseReviewAction(fixAllChecked, fixAllChecked)).toBeNull();
    expect(reviewer.parseReviewAction(body, "")).toBeNull();
  });

  it("requests every eligible finding for Fix All without individual selection", () => {
    const action = reviewer.parseReviewAction(tickCheckbox(body, /Fix All\*\*/), body);
    expect(action).toEqual({ mode: "fix" });
    const findings = [redFinding, yellowFinding, lowFinding].map((f) => ({ ...f, id: reviewer.generateFindingId(f) }));
    const resolution = reviewer.resolveRequestedFindings(findings, action);
    expect(resolution.selected).toHaveLength(3);
    expect(resolution.rejected).toHaveLength(0);
  });

  it("rejects an id that is not in the current review instead of acting on it", () => {
    const findings = [{ ...redFinding, id: ids[0] }];
    const resolution = reviewer.resolveRequestedFindings(findings, { mode: "fix-selected", targetFinding: [ids[1]] });
    expect(resolution.selected).toHaveLength(0);
    expect(resolution.rejected).toHaveLength(1);
    expect(resolution.rejected[0].reason).toMatch(/No finding with this id/);
  });

  it("accounts for every selected finding: nothing is dropped silently", () => {
    const findings = [redFinding, yellowFinding, lowFinding].map((f) => ({ ...f, id: reviewer.generateFindingId(f) }));
    const plan = autofix.planSelectedFindings(findings, files);
    // Every requested finding ends up either eligible or rejected with a reason.
    expect(plan.eligible.length + plan.results.length).toBe(3);
    expect(plan.results.every((item: { status: string; reason: string }) => item.status === "rejected" && item.reason.length > 10)).toBe(true);
    // The yellow finding is eligible; the red finding's line is not an added line here.
    expect(plan.eligible.map((item: { title: string }) => item.title)).toContain(yellowFinding.title);
    expect(plan.results.map((item: { reason: string }) => item.reason).join(" | ")).toMatch(/stale or mis-anchored|not part of the current pull-request diff/);
  });

  it("revalidates against the current head before any suggestion is posted", () => {
    const fixScript = readFileSync(".github/scripts/gemini-autofix.cjs", "utf8");
    expect(fixScript).toContain("expectedHeadSha");
    const headCheck = fixScript.indexOf("the PR head changed while this fix request was running");
    const reviewPost = fixScript.indexOf('"/repos/" + REPO + "/pulls/" + pr.number + "/reviews"');
    expect(headCheck).toBeGreaterThan(-1);
    expect(reviewPost).toBeGreaterThan(headCheck);
    expect(reviewer.headMatchesReview("abc", "abd")).toBe(false);
    expect(reviewer.headMatchesReview("abc", "abc")).toBe(true);
  });

  it("keeps suggestions ineligible outside safe added lines and never pushes code", () => {
    expect(autofix.isEligiblePath(".github/scripts/gemini-reviewer.cjs")).toBe(false);
    expect(autofix.isEligiblePath(".docs/creation/note.md")).toBe(false);
    expect(autofix.isEligiblePath("app/homepage/HomePage.js")).toBe(true);
    const plan = autofix.planSelectedFindings([
      { ...yellowFinding, id: "a", path: "not/in/diff.js", line: 1 },
      { ...yellowFinding, id: "b", line: null },
      { ...yellowFinding, id: "c", line: 9999 }
    ], files);
    expect(plan.eligible).toHaveLength(0);
    const reasons = plan.results.map((item: { reason: string }) => item.reason).join(" | ");
    expect(reasons).toMatch(/not part of the current pull-request diff/);
    expect(reasons).toMatch(/no line anchor/);
    expect(reasons).toMatch(/stale or mis-anchored/);
    const fixScript = readFileSync(".github/scripts/gemini-autofix.cjs", "utf8");
    expect(fixScript).not.toContain('["push"');
    expect(fixScript).not.toContain('["commit"');
    expect(fixScript).toContain("Commit suggestion");
  });
});

describe("Gemini reviewer startup resilience", () => {
  it("keeps reviewing when the documentation manifest cannot be parsed", () => {
    const dir = mkdtempSync(join(tmpdir(), "gemini-manifest-"));
    mkdirSync(join(dir, ".docs"), { recursive: true });
    // The exact historical failure mode: an invalid manifest aborted the process on load.
    writeFileSync(join(dir, ".docs", "manifest.json"), '{"groups": {"creation": [}}\n');
    const script = join(process.cwd(), ".github/scripts/gemini-reviewer.cjs");
    const probe = "const r = require(" + JSON.stringify(script) + ");" +
      "process.stdout.write(JSON.stringify({ error: r.MANIFEST_ERROR, hasManifest: !!r.MANIFEST, canParse: typeof r.parseFullReviewCommand }));";
    const result = spawnSync(process.execPath, ["-e", probe], { cwd: dir, encoding: "utf8" });
    expect(result.status, result.stderr || result.stdout).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.hasManifest).toBe(false);
    expect(payload.error).toMatch(/could not be parsed/);
    expect(payload.canParse).toBe("function");
  });

  it("reports a startup failure on the pull request even if the script cannot comment", () => {
    const workflow = readFileSync(".github/workflows/gemini-reviewer.yml", "utf8");
    const reporter = workflow.indexOf("Report reviewer failure on the pull request");
    expect(reporter).toBeGreaterThan(-1);
    const reporterBlock = workflow.slice(reporter);
    expect(reporterBlock).toContain("if: failure()");
    expect(reporterBlock).toContain("issues/$number/comments");
    expect(reporterBlock).toContain("@gemini full review");
  });
});
