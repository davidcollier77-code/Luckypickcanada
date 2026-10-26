import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const reviewer = require("../.github/scripts/gemini-reviewer.cjs");

describe("Gemini reviewer source context", () => {
  it("extracts local imports but ignores package imports", () => {
    expect(reviewer.extractLocalImports('import Hero from "./Hero"; export { x } from "../lib/x.js"; const p = require("react"); require("./local.cjs"); import("next/image");'))
      .toEqual(["./Hero", "../lib/x.js", "./local.cjs"]);
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
  it("selects relevant groups based on paths/domain, not generic fix wording", () => {
    const groups = ["polishing", "troubleshooting", "testing", "seo", "security", "deep-dive"];
    expect(reviewer.classifyReviewGroups({title:"fix: homepage performance",body:"Improve image preload"},[{filename:"app/homepage/Hero.js",patch:"+preload"}],groups)).toContain("polishing");
    expect(reviewer.classifyReviewGroups({title:"fix: metadata",body:""},[{filename:"app/metadata.js",patch:"+metadata"}],groups)).toContain("seo");
    expect(reviewer.classifyReviewGroups({title:"fix typo",body:""},[{filename:"lib/math.js",patch:"+return value"}],groups)).not.toContain("polishing");
  });
  it("clips source while preserving the beginning and end", () => {
    const clipped = reviewer.clipSource("BEGIN" + "x".repeat(1000) + "END", 100);
    expect(clipped.truncated).toBe(true); expect(clipped.content.startsWith("BEGIN")).toBe(true);
    expect(clipped.content.endsWith("END")).toBe(true); expect(clipped.content).toContain("middle of source omitted");
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

  it("sets red, yellow, and green verdicts according to findings and coverage", () => {
    expect(reviewer.buildReviewVerdict([{severity:"HIGH"}], []).label).toBe("FIXES NEEDED");
    expect(reviewer.buildReviewVerdict([], ["Source context unavailable"]).label).toBe("REVIEW INCOMPLETE");
    expect(reviewer.buildReviewVerdict([], []).label).toBe("NO ACTIONABLE FINDINGS");
    expect(reviewer.buildReviewVerdict([{severity:"HIGH"}], []).marker).toBe("🔴");
    expect(reviewer.buildReviewVerdict([], ["coverage gap"]).marker).toBe("🟡");
    expect(reviewer.buildReviewVerdict([], []).marker).toBe("🟢");
  });
  it("formats issue details with a collapsible copy-friendly suggested fix", () => {
    const formatted = reviewer.formatReviewSections({
      findings:[{severity:"HIGH",title:"Broken preload",path:"app/homepage/Hero.js",line:42,inline:true,
        problem:"The preload type does not match the selected source.",impact:"The LCP image may not use the preload.",
        fix:"Align the preload with the selected source.",suggestion:'preload("/hero.avif", { type: "image/avif" });'}],
      positiveObservations:[{path:"app/homepage/Hero.js",title:"Fallback preserved",details:"The WebP fallback remains available.",confidence:0.91}],
      coverageGaps:["One source file was unavailable."]
    });
    expect(formatted).toContain("🔴 **[HIGH] Broken preload**");
    expect(formatted).toContain("<summary>🛠️ Suggested fix for Broken preload — click to expand and copy</summary>");
    expect(formatted).toContain("**Recommended fix (copyable)**");
    expect(formatted).toContain("**Copyable code replacement**");
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

});
