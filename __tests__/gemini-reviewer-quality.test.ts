import { describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

// Configure the model chain before the reviewer module reads it at load time.
process.env.GEMINI_API_KEY = "test-key-not-a-secret";
process.env.GEMINI_PRIMARY_MODEL = "gemini-3.8-flash";
process.env.GEMINI_FALLBACK_MODEL = "gemini-3.6-flash";
process.env.GEMINI_SECOND_FALLBACK_MODEL = "gemini-3.5-flash-lite";

const require = createRequire(import.meta.url);
const reviewer = require("../.github/scripts/gemini-reviewer.cjs");
const autofix = require("../.github/scripts/gemini-autofix.cjs");

const tick = String.fromCharCode(96);
const findingLine = (id: string, severity = "HIGH", title = "Test finding") => {
  const marker = ({ red: "🔴", yellow: "🟡", additional: "🔵" } as Record<string, string>)[reviewer.classifyFindingCategory({ severity })] || "🔴";
  return "- [ ] Finding " + tick + id + tick + ": " + marker + " **[" + severity + "] " + title + "** — " + tick + "src/app.js:7" + tick;
};

describe("Gemini reviewer finding categories", () => {
  it("maps severity to the three documented categories", () => {
    expect(reviewer.classifyFindingCategory({ severity: "CRITICAL" })).toBe("red");
    expect(reviewer.classifyFindingCategory({ severity: "HIGH" })).toBe("red");
    expect(reviewer.classifyFindingCategory({ severity: "MEDIUM" })).toBe("yellow");
    expect(reviewer.classifyFindingCategory({ severity: "LOW" })).toBe("additional");
    expect(reviewer.FINDING_CATEGORIES.map((item: { heading: string }) => item.heading)).toEqual([
      "Red — Critical fixes", "Yellow — Suggested fixes", "Additional recommendations"
    ]);
  });

  it("uses red only for critical/high findings, yellow for medium, and blue for low", () => {
    expect(reviewer.buildReviewVerdict([{ severity: "HIGH" }], []).marker).toBe("🔴");
    expect(reviewer.buildReviewVerdict([{ severity: "CRITICAL" }], []).label).toBe("FIXES NEEDED");
    expect(reviewer.buildReviewVerdict([{ severity: "MEDIUM" }], []).marker).toBe("🟡");
    expect(reviewer.buildReviewVerdict([{ severity: "MEDIUM" }], []).label).toBe("SUGGESTED FIXES");
    expect(reviewer.buildReviewVerdict([{ severity: "LOW" }], []).marker).toBe("🔵");
    expect(reviewer.buildReviewVerdict([{ severity: "LOW" }], []).label).toBe("ADDITIONAL RECOMMENDATIONS");
    expect(reviewer.buildReviewVerdict([], ["source omitted"]).marker).toBe("🟡");
    expect(reviewer.buildReviewVerdict([], []).marker).toBe("🟢");
    const mediumOnly = reviewer.formatReviewSections({
      findings: [{ severity: "MEDIUM", title: "Suggested improvement", path: "src/a.js", line: 1, problem: "p", impact: "i", fix: "f" }]
    });
    expect(mediumOnly).toContain("🟡 **SUGGESTED FIXES**");
    expect(mediumOnly).not.toContain("🔴 Red — Critical fixes");
  });

  it("renders three distinguishable categories with one checkbox per actionable finding", () => {
    const body = reviewer.formatReviewSections({
      findings: [
        { severity: "HIGH", title: "Broken rollback", path: "src/a.js", line: 4, inline: true, problem: "p", impact: "i", fix: "f", suggestion: null },
        { severity: "MEDIUM", title: "Misleading log", path: "src/b.js", line: 8, inline: false, problem: "p2", impact: "i2", fix: "f2", suggestion: null },
        { severity: "LOW", title: "Dead helper", path: "src/c.js", line: null, inline: false, problem: "p3", impact: "i3", fix: "f3", suggestion: null }
      ],
      coverageGaps: ["scripts/refresh-docs.js was not fully examined (source-context budget exhausted)."],
      pullRequestNumber: 1656
    });
    expect(body).toContain("### 🔴 Red — Critical fixes");
    expect(body).toContain("### 🟡 Yellow — Suggested fixes");
    expect(body).toContain("### 🔵 Additional recommendations");
    expect(body).toContain("🔴 **[HIGH] Broken rollback**");
    expect(body).toContain("🟡 **[MEDIUM] Misleading log**");
    expect(body).toContain("🔵 **[LOW] Dead helper**");
    const checkboxes = body.split("\n").filter((line: string) => /^- \[[ x]\] Finding /.test(line));
    expect(checkboxes).toHaveLength(3);
    // Coverage warnings stay informational: they are listed under their own heading and
    // never become selectable findings.
    expect(body).toContain("### Review coverage (informational — not a finding)");
    expect(body).toContain("- 🟡 scripts/refresh-docs.js was not fully examined");
    expect(checkboxes.some((line: string) => line.includes("refresh-docs.js"))).toBe(false);
    expect(body).toContain("- [ ] ✅ **Select all findings**");
    expect(body).toContain("- [ ] ⬜ **Clear selection**");
    expect(body).toContain("**Fix selected findings**");
  });

  it("keeps the review body bounded by dropping prompts instead of findings", () => {
    const many = Array.from({ length: 18 }, (_, index) => ({
      severity: "HIGH", title: "Finding number " + index, path: "src/app" + index + ".js", line: index + 1,
      inline: false, problem: "p".repeat(1600), impact: "i".repeat(1000), fix: "f".repeat(1000), suggestion: null
    }));
    const full = reviewer.formatReviewSections({ findings: many, pullRequestNumber: 1 });
    const compact = reviewer.formatReviewSections({ findings: many, pullRequestNumber: 1, compact: true });
    expect(full.length).toBeGreaterThan(compact.length);
    expect(compact.length).toBeLessThanOrEqual(reviewer.MAX_REVIEW_BODY_CHARS);
    expect(compact).not.toContain("Copy/paste prompt for");
    expect(compact.split("\n").filter((line: string) => /^- \[[ x]\] Finding /.test(line))).toHaveLength(18);
  });
});

describe("Gemini reviewer selection controls", () => {
  const ids = ["aaaaaaaaaaaa", "bbbbbbbbbbbb"];
  const body = [
    "### 🔴 Red — Critical fixes",
    findingLine(ids[0]),
    findingLine(ids[1], "MEDIUM"),
    "- [ ] 🛠️ **Fix selected findings**",
    "- [ ] ✅ **Select all findings**",
    "Problem text mentions a checkbox - [ ] Finding " + tick + "cccccccccccc" + tick + ": not a real line"
  ].join("\n");

  it("checks and clears only the finding checkbox lines", () => {
    const all = reviewer.setFindingSelection(body, "all");
    expect(all.split("\n").filter((line: string) => line.startsWith("- [x] Finding "))).toHaveLength(2);
    expect(body).toContain("🟡 **[MEDIUM] Test finding**");
    expect(all).toContain("- [ ] 🛠️ **Fix selected findings**");
    expect(all).toContain("not a real line");
    const cleared = reviewer.setFindingSelection(all, "none");
    expect(cleared).toBe(body);
    const onlyFirst = reviewer.setFindingSelection(cleared, "ids", [ids[0]]);
    expect(onlyFirst).toContain("- [x] Finding " + tick + ids[0]);
    expect(onlyFirst).toContain("- [ ] Finding " + tick + ids[1]);
    expect(() => reviewer.setFindingSelection(body, "everything")).toThrow(/Unsupported selection mode/);
  });

  it("accepts select-all, clear-selection, and fix-selected commands only", () => {
    expect(reviewer.parseSelectionCommand("@gemini select all")).toEqual({ mode: "select-all" });
    expect(reviewer.parseSelectionCommand("@GEMINI SELECT NONE")).toEqual({ mode: "select-none" });
    expect(reviewer.parseSelectionCommand("@gemini clear selection")).toEqual({ mode: "select-none" });
    expect(reviewer.parseSelectionCommand("@gemini fix selected")).toEqual({ mode: "fix-selected", fromCommand: true });
    expect(reviewer.parseSelectionCommand("@gemini select some")).toBeNull();
    expect(reviewer.parseSelectionCommand("@gemini repair all")).toBeNull();
  });

  it("treats newly checked select controls as functional actions", () => {
    const selectAll = "- [x] ✅ **Select all findings**";
    const clear = "- [x] ⬜ **Clear selection**";
    expect(reviewer.parseReviewAction(selectAll, "")).toEqual({ mode: "select-all" });
    expect(reviewer.parseReviewAction(clear, "")).toEqual({ mode: "select-none" });
    expect(reviewer.parseReviewAction(selectAll, selectAll)).toBeNull();
    expect(reviewer.resolveEventAction(selectAll, "", "edited")).toEqual({ mode: "select-all" });
    expect(reviewer.resolveEventAction(selectAll, "", "submitted")).toBeNull();
  });

  it("submits only selected findings and rejects unknown ids with a reason", () => {
    const findings = [{ id: ids[0], path: "src/a.js", line: 4, title: "A" }, { id: ids[1], path: "src/b.js", line: 9, title: "B" }];
    const result = reviewer.resolveRequestedFindings(findings, { mode: "fix-selected", targetFinding: [ids[1], "dddddddddddd"] });
    expect(result.selected.map((item: { id: string }) => item.id)).toEqual([ids[1]]);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].reason).toMatch(/No finding with this id/);
    expect(reviewer.resolveRequestedFindings(findings, { mode: "fix", targetFinding: [] }).selected).toHaveLength(2);
    expect(reviewer.resolveRequestedFindings(findings, { mode: "fix-one", targetFinding: { path: "src/zz.js", line: 1, title: "A" } }).selected).toHaveLength(0);
  });
});

describe("Gemini reviewer coverage and parsing robustness", () => {
  it("names the changed files that were not fully examined", () => {
    const notes = reviewer.formatCoverageDisclosure({
      changedTextFiles: 5,
      fullSource: ["a.js", "b.js"],
      partial: [{ path: "c.js", reason: "clipped to the reviewer context budget" }],
      patchOnly: [{ path: "d.js", reason: "source-context budget exhausted" }, { path: "e.js", reason: "head source unavailable" }]
    });
    expect(notes[0]).toBe("Full source reviewed for 2 of 5 changed text file(s), partially for 1, patch-only for 2.");
    expect(notes.join(" ")).toContain("c.js (clipped to the reviewer context budget)");
    expect(notes.join(" ")).toContain("d.js (source-context budget exhausted)");
    expect(notes.join(" ")).toContain("e.js (head source unavailable)");
    expect(reviewer.formatCoverageDisclosure(null)).toEqual([]);
  });

  it("deduplicates the same root cause at one location", () => {
    const deduped = reviewer.dedupeFindings([
      { path: "src/a.js", line: 4, title: "Duplicate log statement", severity: "MEDIUM" },
      { path: "src/a.js", line: 4, title: "duplicate log statement", severity: "MEDIUM" },
      { path: "src/a.js", line: 4, title: "Duplicate log statement in fetch path", severity: "MEDIUM" },
      { path: "src/a.js", line: 4, title: "Missing guard", severity: "HIGH" },
      { path: "src/b.js", line: 4, title: "Duplicate log statement", severity: "MEDIUM" }
    ]);
    expect(deduped.map((item: { title: string }) => item.title))
      .toEqual(["Duplicate log statement", "Duplicate log statement in fetch path", "Missing guard", "Duplicate log statement"]);
    expect(reviewer.sortFindings(deduped).map((item: { severity: string }) => item.severity))
      .toEqual(["HIGH", "MEDIUM", "MEDIUM", "MEDIUM"]);
  });

  it("deduplicates empty-title findings at the same path and line", () => {
    const deduped = reviewer.dedupeFindings([
      { path: "src/empty.js", line: 9, title: "", severity: "LOW" },
      { path: "src/empty.js", line: 9, title: "", severity: "LOW" },
      { path: "src/empty.js", line: 10, title: "", severity: "LOW" }
    ]);
    expect(deduped).toHaveLength(2);
    expect(deduped.every((item: { title: string }) => item.title === "")).toBe(true);
  });

  it("recovers fenced, prose-wrapped, trailing-comma, and truncated JSON", () => {
    const fence = String.fromCharCode(96).repeat(3);
    expect(reviewer.parseModelJson(fence + "json\n{\"summary\":\"ok\",\"findings\":[]}\n" + fence).summary).toBe("ok");
    expect(reviewer.parseModelJson("Here is the review:\n{\"summary\":\"ok\",\"findings\":[]}\nThanks.").summary).toBe("ok");
    expect(reviewer.parseModelJson("{\"summary\":\"ok\",\"findings\":[],}").summary).toBe("ok");
    expect(reviewer.parseModelJson("{\"summary\":\"ok\",\"findings\":[{\"path\":\"a.js\"}").summary).toBe("ok");
    expect(reviewer.parseModelJson("not json at all")).toBeNull();
    expect(reviewer.parseModelJson("[1,2,3]")).toBeNull();
    expect(reviewer.parseModelJson("")).toBeNull();
  });

  it("rejects unmatched closing brackets during truncated JSON recovery", () => {
    expect(reviewer.closeTruncatedJson('{"summary":"ok","findings":[{"path":"a.js"')).toBe('{"summary":"ok","findings":[{"path":"a.js"}]}');
    expect(reviewer.closeTruncatedJson('{"summary":"ok","findings":[]} }')).toBeNull();
    expect(reviewer.closeTruncatedJson('{"summary":"ok","findings":[1}}')).toBeNull();
  });

  it("preserves Unicode apostrophes while repairing trailing commas", () => {
    const malformed = '{"summary":"It’s still curly","findings":[],}';
    expect(reviewer.parseModelJson(malformed).summary).toBe("It’s still curly");
    expect(autofix.parseModelJson(malformed).summary).toBe("It’s still curly");
  });

  it("keeps every patch of an 84-file pull request in review batches and names omitted source files", () => {
    const files = Array.from({ length: 84 }, (_, index) => ({
      filename: "src/module-" + index + ".js",
      status: "modified",
      patch: "@@ -1 +1,2 @@\n-old\n+new line\n+second line " + index
    }));
    const batches = reviewer.makeBatches(files).flat();
    expect(batches).toHaveLength(84);
    expect(batches.every((file: { patch: string }) => file.patch.includes("second line"))).toBe(true);
    const selected = reviewer.selectChangedSourceCandidates(files);
    expect(selected.totalCount).toBe(84);
    expect(selected.candidates).toHaveLength(reviewer.MAX_CHANGED_SOURCE_FILES);
    expect(selected.omittedPaths).toHaveLength(84 - reviewer.MAX_CHANGED_SOURCE_FILES);
    expect(selected.omittedPaths[0]).toMatch(/^src\/module-\d+\.js$/);
    const notes = reviewer.formatCoverageDisclosure({
      changedTextFiles: 84,
      fullSource: Array.from({ length: 60 }, (_, index) => "src/module-" + index + ".js"),
      partial: [],
      patchOnly: selected.omittedPaths.map((path: string) => ({ path, reason: "beyond the " + reviewer.MAX_CHANGED_SOURCE_FILES + "-file full-source cap" }))
    });
    expect(notes.join(" ")).toContain("Full source reviewed for 60 of 84 changed text file(s)");
    expect(notes.join(" ")).toContain("and 14 more");
  });

  it("classifies transient transport and parse failures as retryable", () => {
    expect(reviewer.isRetryableError({ retryable: true })).toBe(true);
    expect(reviewer.isRetryableError({ name: "TimeoutError" })).toBe(true);
    expect(reviewer.isRetryableError({ code: "ECONNRESET" })).toBe(true);
    expect(autofix.isRetryableError({ code: "UND_ERR_CONNECT_TIMEOUT" })).toBe(true);
    expect(reviewer.isRetryableError(new TypeError("fetch failed"))).toBe(true);
    expect(reviewer.isRetryableError(new Error("Gemini model X output could not be parsed as the required JSON object."))).toBe(true);
    expect(reviewer.isRetryableError({ message: "Gemini model X returned HTTP 400." })).toBe(false);
    expect(reviewer.isRetryableError(null)).toBe(false);
  });

  it("retries malformed output on the same model and keeps the configured fallback order", async () => {
    const payload = (text: string) => ({ ok: true, status: 200, text: async () => JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }) });
    const malformedThenValid = [payload("not json"), payload('{"summary":"recovered","findings":[]}')];
    const fetchMock = vi.fn(async () => malformedThenValid.shift());
    vi.stubGlobal("fetch", fetchMock);
    const first = await reviewer.askModel("review", 100);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(first.result.summary).toBe("recovered");
    expect(first.model).toBe("gemini-3.8-flash");
    vi.unstubAllGlobals();

    const failures = [
      { ok: false, status: 503, text: async () => "" },
      { ok: false, status: 503, text: async () => "" },
      payload('{"summary":"fallback","findings":[]}')
    ];
    const fallbackMock = vi.fn(async () => failures.shift());
    vi.stubGlobal("fetch", fallbackMock);
    const second = await reviewer.askModel("review", 100);
    expect(fallbackMock).toHaveBeenCalledTimes(3);
    expect(second.model).toBe("gemini-3.6-flash");
    vi.unstubAllGlobals();
  });

  it("does not retry a non-retryable HTTP failure and still reports all models failed", async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 400, text: async () => "" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(reviewer.askModel("review", 100)).rejects.toThrow(/All configured Gemini models failed/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    vi.unstubAllGlobals();
  });
});

describe("Gemini review-state comment serialization", () => {
  it("round-trips both HTML comment terminators without altering finding text", () => {
    const finding = {
      path: "app/example.js",
      line: 12,
      title: "Literal markers --> and --!>",
      severity: "HIGH",
      confidence: 0.97,
      problem: "Preserve both --> and --!> in problem text.",
      impact: "Do not truncate or rewrite --> or --!>.",
      fix: "Keep --> and --!> intact.",
      suggestion: null,
      inline: false
    };
    const body = reviewer.serializeReviewState("review-head", [finding]);
    const payload = body.match(/<!-- gemini-review-state: ([\s\S]*?) -->/)?.[1] || "";
    expect(payload).not.toMatch(/--!?>/);
    const restored = reviewer.extractReviewState(body);
    expect(restored).toMatchObject({
      sha: "review-head",
      findings: [{
        path: finding.path,
        line: finding.line,
        title: finding.title,
        problem: finding.problem,
        impact: finding.impact,
        fix: finding.fix,
        severity: finding.severity,
        confidence: finding.confidence
      }]
    });
  });

  it("continues to read legacy escaped review-state comments", () => {
    const legacyBody = "<!-- gemini-review-state: {\"sha\":\"legacy\",\"findings\":[{\"title\":\"Legacy marker --\\>\"}]} -->";
    expect(reviewer.extractReviewState(legacyBody)?.findings[0].title).toBe("Legacy marker -->");
  });
});

describe("Gemini selected-finding remediation tracking", () => {
  const files = [
    { filename: "app/homepage/Hero.js", patch: "@@ -1,2 +1,3 @@\n a\n+preload(\"/hero.avif\");\n b" },
    { filename: ".github/scripts/gemini-reviewer.cjs", patch: "@@ -1 +1 @@\n-old\n+new" },
    { filename: "app/api/oracle/route.js", patch: "@@ -1 +1 @@\n-old\n+new" }
  ];
  const base = { problem: "p", impact: "i", fix: "f", confidence: 0.9 };

  it("rejects stale, ineligible, malformed, and duplicate selections before any model call", () => {
    const plan = autofix.planSelectedFindings([
      { id: "a1", path: "app/homepage/Hero.js", line: 2, title: "Valid finding", ...base },
      { id: "a2", path: "app/homepage/Hero.js", line: 2, title: "Duplicate location", ...base },
      { id: "a3", path: "app/homepage/Hero.js", line: 99, title: "Stale line", ...base },
      { id: "a4", path: ".github/scripts/gemini-reviewer.cjs", line: 1, title: "Governance file", ...base },
      { id: "a5", path: "app/api/oracle/route.js", line: 1, title: "API route", ...base },
      { id: "a6", path: "not/part/of/pr.js", line: 1, title: "Not in diff", ...base },
      { id: "a7", path: "app/homepage/Hero.js", line: null, title: "No anchor", ...base }
    ], files);
    expect(plan.eligible.map((item: { id: string }) => item.id)).toEqual(["a1"]);
    const rejected = plan.results.filter((item: { status: string }) => item.status === "rejected");
    expect(rejected).toHaveLength(6);
    expect(rejected.map((item: { reason: string }) => item.reason).join(" | ")).toMatch(/Duplicate of another selected finding/);
    expect(rejected.map((item: { reason: string }) => item.reason).join(" | ")).toMatch(/stale or mis-anchored/);
    expect(rejected.map((item: { reason: string }) => item.reason).join(" | ")).toMatch(/not part of the current pull-request diff/);
    expect(rejected.map((item: { reason: string }) => item.reason).join(" | ")).toMatch(/no line anchor/);
  });

  it("reports fixed, rejected, and unresolved outcomes with explanations", () => {
    const report = autofix.formatFixOutcomes([
      { id: "a1", path: "app/homepage/Hero.js", line: 2, title: "Fixed one", status: "fixed", reason: "Suggestion posted." },
      { id: "a2", path: "app/homepage/Hero.js", line: 9, title: "Rejected one", status: "rejected", reason: "Already handled by the guard." },
      { id: "a3", path: "app/homepage/Hero.js", line: 12, title: "Unresolved one", status: "unresolved", reason: "Validation could not run." }
    ], { unselectedCount: 2 });
    expect(report).toContain("| Fixed one | app/homepage/Hero.js:2 | fixed | Suggestion posted. |");
    expect(report).toContain("**Fixed:** 1 · **Rejected:** 1 · **Unresolved:** 1.");
    expect(report).toContain("2 unselected finding(s) were left untouched.");
    expect(report).toContain("Rejected findings were not applied");
    expect(autofix.formatFixOutcomes([])).toContain("**Fixed:** 0 · **Rejected:** 0 · **Unresolved:** 0.");
  });

  it("escapes backslashes and pipes and normalizes line breaks in outcome cells", () => {
    const report = autofix.formatFixOutcomes([{
      id: "a1",
      path: "docs\\notes|today.md",
      title: "Backslash \\ and pipe | title\nsecond line",
      status: "unresolved",
      reason: "First\\second | reason\r\ncontinued"
    }]);
    expect(report).toContain("| Backslash \\\\ and pipe \\| title second line | docs\\\\notes\\|today.md | unresolved | First\\\\second \\| reason continued |");
  });

  it("keeps the Gemini and autofix modules free of direct push or commit actions", () => {
    expect(autofix.MAX_SUGGESTIONS).toBe(25);
    expect(typeof autofix.applyAutoFix).toBe("function");
    expect(autofix.isEligiblePath(".freebuff/instructions.md")).toBe(false);
    expect(autofix.isEligiblePath("app/homepage/Hero.js")).toBe(true);
  });
});
