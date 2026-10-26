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
});
