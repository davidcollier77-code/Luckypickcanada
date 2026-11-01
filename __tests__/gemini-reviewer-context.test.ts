import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const reviewer = require("../.github/scripts/gemini-reviewer.cjs");

describe("Gemini reviewer source context", () => {
  it("parses only the manual full-review command and retires the repair commands", () => {
    expect(reviewer.parseFullReviewCommand("@gemini full review")).toEqual({ mode: "review", command: "@gemini full review" });
    expect(reviewer.parseFullReviewCommand("@gemini repair all")).toBeNull();
    expect(reviewer.parseFullReviewCommand("@gemini repair one app/homepage/HomePage.js:42 -- Duplicate submit guard")).toBeNull();
    expect(reviewer.parseFullReviewCommand("@GEMINI REPAIR ONE app/homepage/HomePage.js:42 -- Duplicate submit guard")).toBeNull();
    expect(reviewer.parseFullReviewCommand("@gemini repair all extra")).toBeNull();
    expect(reviewer.parseRepairCommand).toBeUndefined();
  });
  it("builds a standalone implementation prompt and keeps suggestion eligibility in the autofix module", () => {
    const finding = {severity:"HIGH", title:"Broken preload", path:"app/homepage/Hero.js", line:42,
      inline:true, problem:"The preload type does not match the selected source.", impact:"The LCP image may not use the preload.",
      fix:"Align the preload with the actual selected source.", suggestion:null};
    const prompt = reviewer.buildFixPrompt(finding, 1617);
    expect(prompt).toContain("Repository: davidcollier77-code/Luckypickcanada");
    expect(prompt).toContain("Pull request: #1617");
    expect(prompt).toContain("Read the repository's root AGENTS.md first");
    expect(prompt).toContain("Add or update focused regression tests");
    expect(prompt).toContain("Leave the PR open and unmerged");
    const autofix = require("../.github/scripts/gemini-autofix.cjs");
    expect(autofix.isEligiblePath("app/homepage/Hero.js")).toBe(true);
    expect(autofix.isEligiblePath(".github/scripts/gemini-reviewer.cjs")).toBe(false); // DevSkim: ignore DS173237
    expect(reviewer.canRequestTargetedFix).toBeUndefined();
    expect(reviewer.matchTargetFinding).toBeUndefined();
  });
  it("extracts local imports but ignores package imports", () => {
    expect(reviewer.extractLocalImports('import Hero from "./Hero"; export { x } from "../lib/x.js"; const p = require("react"); require("./local.cjs"); import("next/image");'))
      .toEqual(["./Hero", "../lib/x.js", "./local.cjs"]);
    // Template-literal and fully dynamic specifiers are intentionally not matched (statically unresolvable)
    expect(reviewer.extractLocalImports('import x from `./foo`; import(`./dynamic/${name}`);')).toEqual([]);
  });
  it("resolves relative modules and rejects repository escapes", () => {
    expect(reviewer.resolveImportCandidates("./Hero", "app/homepage/HomePage.js").slice(0, 4))
      .toEqual(["app/homepage/Hero.js", "app/homepage/Hero.jsx", "app/homepage/Hero.ts", "app/homepage/Hero.tsx"]);
    expect(reviewer.resolveImportCandidates("../../../../secret", "app/homepage/HomePage.js")).toEqual([]);
    expect(reviewer.resolveImportCandidates("/etc/passwd", "app/homepage/HomePage.js")).toEqual([]);
    expect(reviewer.resolveImportCandidates("react", "app/homepage/HomePage.js")).toEqual([]);
  });
  it("strictly bounds import candidate probes when the tree is unavailable", () => {
    const candidates = Array.from({length: 12}, (_, i) => "app/homepage/Module" + i + ".js");
    expect(reviewer.MAX_IMPORT_SOURCE_PROBES).toBe(12);
    expect(reviewer.limitImportCandidates(candidates, false, 12)).toHaveLength(3);
    expect(reviewer.limitImportCandidates(candidates, false, 2)).toHaveLength(2);
    expect(reviewer.limitImportCandidates(candidates, false, 0)).toEqual([]);
    expect(reviewer.limitImportCandidates(candidates, true, 12)).toHaveLength(1);
  });
  it("uses stronger stable IDs and parses checkbox actions only on a new checked transition", () => {
    const finding = { path: "src/app.js", line: 10, title: "Missing await", problem: "Not awaiting", impact: "Wrong order", fix: "Add await", inline: true };
    const id = reviewer.generateFindingId(finding);
    expect(id).toMatch(/^[a-f0-9]{12}$/);
    expect(reviewer.generateFindingId({ ...finding, title: "missing await" })).toBe(id);
    const stateText = reviewer.serializeReviewState("test-current-pr-head-sha", [finding]);
    const state = reviewer.extractReviewState("Review body" + stateText);
    expect(state.sha).toBe("test-current-pr-head-sha");
    expect(state.findings[0].id).toBe(id);
    const tick = String.fromCharCode(96);
    const checkedFinding = "- [x] Finding " + tick + id + tick + ": 🔴 **[HIGH] Missing await**";
    expect(reviewer.parseSelectedIds(checkedFinding)).toEqual([id]);
    expect(reviewer.parseReviewAction(checkedFinding, "")).toBeNull();
    const actionBody = checkedFinding + "\n- [x] 🛠️ **Fix selected findings**";
    expect(reviewer.parseReviewAction(actionBody, "")).toEqual({ mode: "fix-selected", targetFinding: [id] });
    expect(reviewer.parseReviewAction(actionBody, actionBody)).toBeNull();
    expect(reviewer.parseReviewAction("- [x] 🪄 **Fix All**", "")).toEqual({ mode: "fix" });
    expect(reviewer.parseReviewAction("- [ ] 🪄 **Fix All**", "")).toBeNull();
    expect(reviewer.parseFullReviewCommand("@gemini fix selected " + id)).toBeNull();
  });
  it("rejects selected checkbox lists over an explicit limit without silently truncating", () => {
    expect(reviewer.MAX_SELECTED_IDS).toBe(25);
    const tick = String.fromCharCode(96);
    const line = (id: string) => "- [x] Finding " + tick + id + tick + ": Finding";
    const id = "000000000001";
    expect(reviewer.parseSelectedIds(line(id))).toEqual([id]);
    expect(reviewer.parseSelectedIds(line(id) + "\n" + line(id))).toEqual([id]);
    expect(reviewer.parseSelectedIds("- [x] Finding " + tick + "not-a-valid-id" + tick + ": Finding")).toEqual([]);
    const tooMany = Array.from({length: reviewer.MAX_SELECTED_IDS + 1}, (_, i) =>
      line((i + 1).toString(16).padStart(12, "0"))).join("\n");
    expect(reviewer.parseSelectedIds(tooMany)).toBeNull();
    expect(reviewer.parseReviewAction(tooMany + "\n- [x] 🛠️ **Fix selected findings**", ""))
      .toEqual({ mode: "fix-selected", selectionLimitExceeded: true });
  });

  it("resolves the manual command on submitted reviews and fix controls only on edits", () => {
    expect(reviewer.resolveEventAction("@gemini repair all", "", "submitted")).toBeNull();
    expect(reviewer.resolveEventAction("@gemini full review", "", "submitted")).toEqual({mode:"review", command:"@gemini full review"});
    expect(reviewer.resolveEventAction("@gemini full review", "", "created")).toEqual({mode:"review", command:"@gemini full review"});
    expect(reviewer.resolveEventAction("- [x] 🪄 **Fix All**", "", "submitted")).toBeNull();
    expect(reviewer.resolveEventAction("- [x] 🪄 **Fix All**", "", "edited")).toEqual({mode:"fix"});
  });

  it("paginates review state and finds a current-head review beyond the first 100 entries", async () => {
    expect(reviewer.MAX_REVIEW_PAGES).toBe(100);
    const sha = "test-current-head-sha";
    const stateBody = reviewer.serializeReviewState(sha, [{
      path:"src/app.js", line:7, title:"Current-head finding", problem:"Problem", impact:"Impact", fix:"Fix", inline:false
    }]);
    const firstPage = Array.from({length:100}, (_, i) => ({body:"older review " + i}));
    const pages: number[] = [];
    const reviews = await reviewer.fetchAllReviews(1620, async (path: string) => {
      const page = Number(path.match(/[?&]page=(\d+)/)?.[1]);
      pages.push(page);
      return page === 1 ? firstPage : page === 2 ? [{body:stateBody}] : [];
    }, "owner/repo");
    expect(pages).toEqual([1,2]);
    expect(reviewer.findReviewStateForHead(reviews, sha)).toEqual(reviewer.extractReviewState(stateBody));
  });

  it("does not accept stale review state as the current-head state", () => {
    const staleBody = reviewer.serializeReviewState("test-stale-pr-head-sha", [{
      path:"src/app.js", line:7, title:"Stale finding", problem:"Problem", impact:"Impact", fix:"Fix", inline:false
    }]);
    expect(reviewer.findReviewStateForHead([{body:staleBody},{body:"review with no state"}],
      "test-expected-pr-head-sha")).toBeNull();
  });

  it("fails explicitly rather than silently stopping at the review-history page limit", async () => {
    let calls = 0;
    await expect(reviewer.fetchAllReviews(1620, async () => {
      calls += 1;
      return Array.from({length:100}, () => ({body:"review without state"}));
    }, "owner/repo")).rejects.toThrow(/100 pages/);
    expect(calls).toBe(reviewer.MAX_REVIEW_PAGES);
  });
  it("names files in the context clipping note", () => {
    expect(reviewer.formatTruncatedSourceNote([{ path: "src/large.js", truncated: true }]))
      .toBe("Source shortened: src/large.js. Available diffs were still reviewed.");
    expect(reviewer.formatTruncatedSourceNote([{ path: "src/full.js", truncated: false }])).toBeNull();
  });
  it("bounds full-source retrieval but keeps every available text patch in review batches", () => {
    const files = Array.from({length: reviewer.MAX_CHANGED_SOURCE_FILES + 3}, (_, i) => ({
      filename: "src/module-" + i + ".js",
      status: i === 0 ? "removed" : "modified",
      patch: "@@ -1 +1 @@\n-old\n+new"
    }));
    const selected = reviewer.selectChangedSourceCandidates(files);
    expect(reviewer.MAX_CHANGED_SOURCE_CHARS).toBe(6000);
    expect(reviewer.MAX_TOTAL_SOURCE_CHARS).toBe(160000);
    expect(reviewer.MAX_BASE_SOURCE_CHARS).toBe(2200);
    expect(reviewer.MAX_RELATED_SOURCE_CHARS).toBe(3200);
    expect(selected.totalCount).toBe(files.length);
    expect(selected.candidates).toHaveLength(reviewer.MAX_CHANGED_SOURCE_FILES);
    expect(selected.candidates.every((file) => file.status !== "removed")).toBe(true);
    expect(selected.omittedCount).toBe(3);
    const reviewedPatches = reviewer.makeBatches(files).flat();
    expect(reviewedPatches).toHaveLength(files.length);
    expect(reviewedPatches.some((file) => file.filename === "src/module-0.js" && file.patch)).toBe(true);
  });
  it("loads the Gemini API development skill only as a conditional specialist reference", () => {
    const cliDoc = ".docs/deep-dive/_google-gemini_gemini-cli.md";
    const apiOverviewDoc = ".docs/creation/_websites_ai_google_dev_gemini-api.md";
    const ordinaryPr = {title: "feat: improve Gemini reviewer", body: "Improve default source coverage."};
    const ordinaryFiles = [{filename: ".github/scripts/gemini-reviewer.cjs"}];
    expect(reviewer.GEMINI_API_DEV_SKILL_PATH).toBe(".docs/creation/_google-gemini_gemini-skills_gemini-api-dev.md");
    const skill = reviewer.loadGeminiApiDevSkill();
    expect(skill?.path).toBe(reviewer.GEMINI_API_DEV_SKILL_PATH);
    expect(skill?.content).toContain("# Gemini API Development Skill");
    expect(skill?.content).toContain("Before writing any code");
    expect(reviewer.isGeminiCliDoc(cliDoc)).toBe(true);
    expect(reviewer.isGeminiApiOverviewDoc(apiOverviewDoc)).toBe(true);
    expect(reviewer.isGeminiReferenceRelevant(cliDoc, ordinaryPr, ordinaryFiles)).toBe(false);
    expect(reviewer.isGeminiReferenceRelevant(apiOverviewDoc, ordinaryPr, ordinaryFiles)).toBe(false);
    expect(reviewer.isGeminiApiDevSkillRelevant(ordinaryFiles)).toBe(false);
    expect(reviewer.isGeminiApiDevSkillRelevant([{filename: "README.md", patch: "+Gemini API may be considered in the future."}])).toBe(false);
    expect(reviewer.isGeminiApiDevSkillRelevant([{filename: "app/api/gemini/route.ts", patch: '+import { GoogleGenAI } from "@google/genai";'}])).toBe(true);
    expect(reviewer.isGeminiApiDevSkillRelevant([{filename: "package.json", patch: '+"@google/genai": "^2.0.0"'}])).toBe(true);
    expect(reviewer.isGeminiApiDevSkillRelevant([{filename: "__tests__/gemini-reviewer-context.test.ts", patch: '+import { GoogleGenAI } from "@google/genai";'}])).toBe(false);
    const referenceRoutingPr = {
      title: "improve Gemini reviewer documentation selection",
      body: "Keep the CLI and general Gemini API overview snapshots conditional."
    };
    expect(reviewer.isGeminiReferenceRelevant(cliDoc, referenceRoutingPr, ordinaryFiles)).toBe(false);
    expect(reviewer.isGeminiReferenceRelevant(apiOverviewDoc, referenceRoutingPr, ordinaryFiles)).toBe(false);
    expect(reviewer.isGeminiReferenceRelevant(
      cliDoc,
      {title: "fix: Gemini CLI config", body: ""},
      [{filename: ".gemini/GEMINI.md"}]
    )).toBe(true);
    expect(reviewer.isGeminiReferenceRelevant(
      apiOverviewDoc,
      {title: "integrate Gemini API client", body: "Use the Interactions API."},
      [{filename: "lib/gemini-api-client.ts"}]
    )).toBe(true);
    const selected = reviewer.selectRelevantGeminiReferenceDocs([
      ".docs/deep-dive/_google-gemini_gemini-cli.md",
      ".docs/security/_google-gemini_gemini-cli.md",
      ".docs/creation/_websites_ai_google_dev_gemini-api.md"
    ], {
      title: "Integrate Gemini CLI config and Gemini API client",
      body: "Use Interactions API for the integration."
    }, [
      {filename: ".gemini/GEMINI.md"},
      {filename: "lib/gemini-api-client.ts"}
    ]);
    expect(selected.map((item) => item.kind)).toEqual(["cli", "api-overview"]);
    expect(selected).toHaveLength(2);
  });

  it("selects relevant groups based on paths/domain, not generic fix wording", () => {
    const groups = ["polishing", "troubleshooting", "testing", "seo", "security", "deep-dive"];
    expect(reviewer.classifyReviewGroups({title:"fix: homepage performance",body:"Improve image preload"},[{filename:"app/homepage/Hero.js",patch:"+preload"}],groups)).toContain("polishing");
    expect(reviewer.classifyReviewGroups({title:"fix: metadata",body:""},[{filename:"app/metadata.js",patch:"+metadata"}],groups)).toContain("seo");
    // deep-dive: file path matching gemini-reviewer routes to deep-dive
    expect(reviewer.classifyReviewGroups({title:"feat: improve gemini reviewer",body:""},[{filename:".github/scripts/gemini-reviewer.cjs",patch:"+code"}],groups)).toContain("deep-dive");
    // deep-dive: PR body containing "reviewer pipeline" keyword routes to deep-dive
    expect(reviewer.classifyReviewGroups({title:"chore: update workflow",body:"Improve the reviewer pipeline"},[{filename:"README.md",patch:"+text"}],groups)).toContain("deep-dive");
    expect(reviewer.classifyReviewGroups({title:"fix typo",body:""},[{filename:"lib/math.js",patch:"+return value"}],groups)).not.toContain("polishing");
  });
  it("clips source while preserving the beginning and end", () => {
    const clipped = reviewer.clipSource("BEGIN" + "x".repeat(1000) + "END", 100);
    expect(clipped.truncated).toBe(true); expect(clipped.content.startsWith("BEGIN")).toBe(true);
    expect(clipped.content.endsWith("END")).toBe(true); expect(clipped.content).toContain("middle of source omitted");
    // Boundary: limit = 0 must yield empty content, not the full 55-char marker string
    const zeroLimited = reviewer.clipSource("x".repeat(200), 0);
    expect(zeroLimited.truncated).toBe(true); expect(zeroLimited.content.length).toBe(0);
    // Boundary: limit below marker length (55 chars) must produce content no longer than limit
    const tinyLimited = reviewer.clipSource("x".repeat(200), 10);
    expect(tinyLimited.truncated).toBe(true); expect(tinyLimited.content.length).toBeLessThanOrEqual(10);
    expect(clipped.content.length).toBeLessThanOrEqual(100);
  });
  it("anchors findings only to added lines", () => {
    expect([...reviewer.addedLines("@@ -1,2 +1,3 @@\n a\n+new line\n b")]).toEqual([2]);
  });
  it("includes only context relevant to the batch", () => {
    const context={records:[
      {path:"app/homepage/Hero.js",role:"head source",content:"hero source"},
      {path:"app/homepage/Image.js",role:"import",relatedTo:"app/homepage/Hero.js",content:"image source"},
      {path:"lib/other.js",role:"head source",content:"unrelated"}
    ]};
    const result=reviewer.renderSourceContext([{filename:"app/homepage/Hero.js"}],context);
    expect(result).toContain("hero source"); expect(result).toContain("image source"); expect(result).not.toContain("unrelated");
  });
  it("requires evidence-led asynchronous control-flow reasoning", () => {
    expect(reviewer.CONTROL_FLOW_REVIEW_GUIDANCE).toMatch(/registration.*callback execution.*state writes.*reads/i);
    expect(reviewer.CONTROL_FLOW_REVIEW_GUIDANCE).toMatch(/every reachable direct or synchronous call path/i);
    expect(reviewer.CONTROL_FLOW_REVIEW_GUIDANCE).toMatch(/rather than asserting a race/i);
  });
  it("checks whether typed image preloads can fetch multiple supported formats", () => {
    expect(reviewer.IMAGE_PRELOAD_REVIEW_GUIDANCE).toMatch(/preload URL.*MIME type.*imageSrcSet\/imageSizes/i);
    expect(reviewer.IMAGE_PRELOAD_REVIEW_GUIDANCE).toMatch(/supporting both AVIF and WebP may preload both files/i);
    expect(reviewer.IMAGE_PRELOAD_REVIEW_GUIDANCE).toMatch(/Do not recommend dual-format preloading by default/i);
  });

  it("sets red, yellow, neutral, and green statuses according to findings and coverage", () => {
    expect(reviewer.buildReviewVerdict([{severity:"HIGH"}], []).label).toBe("FIXES NEEDED");
    expect(reviewer.buildReviewVerdict([{severity:"MEDIUM"}], []).label).toBe("WARNINGS FOUND");
    expect(reviewer.buildReviewVerdict([], ["Source context unavailable"]).label).toBe("REVIEW INCOMPLETE — NOT VERIFIED");
    expect(reviewer.buildReviewVerdict([], [], {reviewCompleted:false}).label).toBe("REVIEW INCOMPLETE — NOT VERIFIED");
    expect(reviewer.buildReviewVerdict([], []).label).toBe("REVIEW COMPLETE — NO FINDINGS");
    expect(reviewer.buildReviewVerdict([{severity:"HIGH"}], []).marker).toBe("🔴");
    expect(reviewer.buildReviewVerdict([], ["coverage gap"]).marker).toBe("⚪");
    expect(reviewer.buildReviewVerdict([], []).marker).toBe("🟢");
  });
  it("formats issue details with a collapsible copy-friendly suggested fix", () => {
    const formatted = reviewer.formatReviewSections({
      findings:[{severity:"HIGH",title:"Broken preload",path:"app/homepage/Hero.js",line:42,inline:true,
        problem:"The preload type does not match the selected source.",impact:"The LCP image may not use the preload.",
        fix:"Align the preload with the selected source.",suggestion:'preload("/hero.avif", { type: "image/avif" });'}],
      positiveObservations:[{path:"app/homepage/Hero.js",title:"Fallback preserved",details:"The WebP fallback remains available.",confidence:0.91}],
      coverageGaps:["One source file was unavailable."],
      pullRequestNumber:1617
    });
    expect(formatted).toContain("🔴 **[HIGH] Broken preload**");
    expect(formatted).toContain("<summary>🧰 Copy/paste prompt for Broken preload — expand to copy or request a fix</summary>");
    expect(formatted).toContain("**Copy/paste implementation prompt**");
    expect(formatted).toContain("Task: Investigate and fix one reported code-review finding.");
    expect(formatted).toContain("Read the repository's root AGENTS.md first");
    expect(formatted).not.toContain("@gemini repair");
    expect(formatted).toContain("### Fix controls");
    expect(formatted).toContain("🛠️ **Fix Selected**");
    expect(formatted).toContain("🪄 **Fix All**");
    expect(formatted).toContain("You remain in control of accepting suggestions.");
    expect(formatted).toContain("**Optional code replacement (not a substitute for the implementation prompt)**");
    expect(formatted).toContain('preload("/hero.avif", { type: "image/avif" });');
    expect(formatted).toContain("🟢 **Fallback preserved**");
    expect(formatted).toContain("🟡 One source file was unavailable.");
    expect(formatted).toContain("not merge approval");
    expect(formatted).toContain("required GitHub Actions checks");
  });
  it("keeps positive observations tied to changed paths and confidence threshold", () => {
    const changedFiles=[{filename:"app/homepage/Hero.js"},{filename:"app/homepage/HomePage.js"}];
    const normalized=reviewer.normalizePositiveObservations([
      {path:"app/homepage/Hero.js",title:"Fallback preserved",details:"WebP source remains available.",confidence:0.92},
      {path:"docs/unknown.md",title:"Unchanged",details:"Not in supplied changed paths.",confidence:0.99},
      {path:"app/homepage/HomePage.js",title:"Speculative",details:"Might be fast.",confidence:0.61}
    ],changedFiles);
    expect(normalized).toHaveLength(1);
    expect(normalized[0].title).toBe("Fallback preserved");
  });

  it("builds an independent adversarial second-pass prompt with concrete missed-defect patterns", () => {
    const prompt = reviewer.buildAdversarialReviewPrompt({
      pr: { number: 1634, title: "Fix story reaction consistency", body: "", head: { sha: "head-sha" } },
      batch: [{ filename: "app/lucky-map-of-canada/lucky-map-of-canada.js", status: "modified", patch: "@@ -1 +1 @@\n-old\n+new" }],
      sourceContext: { records: [{ path: "app/lucky-map-of-canada/lucky-map-of-canada.js", role: "head source", content: "catch (error) { /* state unchanged */ }" }], limitations: [] },
      docBundle: "DOCUMENT: .docs/troubleshooting/react.md\nState lifecycle reference.",
      primaryFindings: [{ path: "app/lucky-map-of-canada/lucky-map-of-canada.js", line: 15, severity: "HIGH", title: "Existing finding", problem: "One failure path is incomplete." }],
      batchIndex: 0,
      batchCount: 1
    });
    expect(prompt).toContain("independent adversarial second-pass reviewer");
    expect(prompt).toContain("head-sha");
    expect(prompt).toContain("Existing finding");
    expect(prompt).toContain("non-OK response");
    expect(prompt).toContain("thrown network exception");
    expect(prompt).toContain("background polling");
    expect(prompt).toContain("generic fallback collisions");
    expect(prompt).toContain("app/lucky-map-of-canada/lucky-map-of-canada.js");
    expect(prompt).toContain("State lifecycle reference.");
    expect(reviewer.ADVERSARIAL_REVIEW_GUIDANCE).toMatch(/confidence >= 0\.80/);
  });

  it("keeps review-context footer short and lists only documents explicitly confirmed useful", () => {
    const report = reviewer.docReport(
      [
        { path: ".docs/troubleshooting/react.md", truncated: false },
        { path: ".docs/troubleshooting/next.md", truncated: false },
        { path: ".docs/troubleshooting/unassessed.md", truncated: false }
      ],
      [{ path: ".docs/troubleshooting/missing.md", reason: "Missing from checkout." }],
      [
        { path: ".docs/troubleshooting/react.md", useful: true, reason: "Clarified state update and effect lifecycle." },
        { path: ".docs/troubleshooting/next.md", useful: false, reason: "Generic framework background." }
      ],
      {
        groups: ["troubleshooting"],
        groupReasons: { troubleshooting: "diagnosing failure-path behavior." },
        method: "Gemini group/document selection"
      }
    );
    expect(report).toContain("### Review context");
    expect(report).toContain("**Task group:** troubleshooting — diagnosing failure-path behavior.");
    expect(report).toContain(".docs/troubleshooting/react.md — Clarified state update and effect lifecycle.");
    expect(report).not.toContain(".docs/troubleshooting/next.md");
    expect(report).not.toContain(".docs/troubleshooting/unassessed.md");
    expect(report).not.toContain("USED: YES");
    expect(report).toContain("Coverage note:");
    expect(report).toContain("1 selected document snapshot(s) could not be loaded");
    expect(report.length).toBeLessThan(900);
  });

  it("renders a compact report for the initial automatic review without inventing a task group", () => {
    const report = reviewer.docReport([], [], [], {
      groups: [],
      groupReasons: {},
      method: "skipped for initial automatic review"
    });
    expect(report).toContain("initial automatic review skips optional library selection");
    expect(report).toContain("Gemini API Developer Skill");
    expect(report).toContain("Not loaded — no direct Gemini API integration changes were detected.");
    expect(report).not.toContain("UNAVAILABLE");
    expect(report).not.toContain("Selection method:");
  });

  it("detects a stale PR head before a generated review can be published", () => {
    expect(reviewer.headMatchesReview("abc123", "abc123")).toBe(true);
    expect(reviewer.headMatchesReview("abc123", "def456")).toBe(false);
    expect(reviewer.headMatchesReview("", "abc123")).toBe(false);
  });

  it("rejects findings about files outside the patch batch supplied to a model", () => {
    const batch = [{ filename: "app/feature/current.js" }];
    const lineMap = new Map([["app/feature/current.js", new Set([12])]]);
    const findings = reviewer.normalizeFindings([
      { path: "app/feature/current.js", line: 12, severity: "HIGH", confidence: 0.93, title: "Broken state rollback", problem: "Failure state is not restored." },
      { path: "app/feature/not-in-this-batch.js", line: 7, severity: "HIGH", confidence: 0.95, title: "Uninspected file", problem: "This path was not supplied to the model." }
    ], batch, lineMap);
    expect(findings).toHaveLength(1);
    expect(findings[0].path).toBe("app/feature/current.js");
    expect(findings[0].inline).toBe(true);
  });

});


describe("Gemini reviewer keeps changed-hunk context in clipped source", () => {
  const buildLongFile = () => {
    const rows = [];
    for (let n = 1; n <= 400; n += 1) rows.push("const value" + n + " = " + n + ";");
    rows[299] = 'const ANCHORED_MIDDLE_DEFECT = "forEach left unconverted";';
    return rows.join("\n");
  };
  it("retains the region around a changed line instead of only the head and tail", () => {
    const clipped = reviewer.clipSourceWithAnchors(buildLongFile(), 3000, new Set([300]));
    expect(clipped.truncated).toBe(true);
    expect(clipped.content).toContain("ANCHORED_MIDDLE_DEFECT");
    expect(clipped.content.length).toBeLessThanOrEqual(3000);
    expect(clipped.content.startsWith("const value1 = 1;")).toBe(true);
    expect(clipped.content.trimEnd().endsWith("const value400 = 400;")).toBe(true);
  });
  it("falls back to head and tail when no changed lines are known", () => {
    const clipped = reviewer.clipSourceWithAnchors(buildLongFile(), 3000, []);
    expect(clipped.content).not.toContain("ANCHORED_MIDDLE_DEFECT");
    expect(clipped.content).toContain("const value1 = 1;");
    expect(clipped.content.length).toBeLessThanOrEqual(3000);
  });
  it("returns an unchanged file without a truncation marker", () => {
    const small = "const a = 1;\nconst b = 2;";
    expect(reviewer.clipSourceWithAnchors(small, 1000, [2])).toEqual({ content: small, truncated: false });
  });
  it("tolerates an anchor beyond the end of the file", () => {
    const clipped = reviewer.clipSourceWithAnchors(buildLongFile(), 2500, new Set([99999]));
    expect(clipped.truncated).toBe(true);
    expect(clipped.content.length).toBeLessThanOrEqual(2500);
  });
});

describe("Gemini reviewer scope and claim guidance", () => {
  it("states that PR claims are not evidence and covers artifacts and benchmarks", () => {
    const guidance = reviewer.SCOPE_AND_CLAIM_GUIDANCE;
    expect(typeof guidance).toBe("string");
    expect(guidance).toContain("unverified claims, not evidence");
    expect(guidance).toContain("line null");
    expect(guidance).toContain("scratch artifacts");
    expect(guidance).toContain("benchmark");
  });
  it("is supplied to the adversarial prompt", () => {
    const prompt = reviewer.buildAdversarialReviewPrompt({
      pr: { number: 1642, title: "perf", body: "claims", head: { sha: "a".repeat(40) } },
      batch: [{ filename: "components/LuckyGenerator.tsx", patch: "@@ -1,1 +1,2 @@\n+const a = 1;\n const b = 2;" }],
      sourceContext: { records: [], limitations: [] }
    });
    expect(prompt).toContain("unverified claims, not evidence");
    expect(prompt).toContain("scratch artifacts");
  });
});
