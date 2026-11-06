import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("custom Gemini reviewer retirement", () => {
  it("removes the active reviewer workflow, scripts, instructions, and exclusive suites", () => {
    const retiredPaths = [
      ".github/workflows/gemini-reviewer.yml",
      ".github/scripts/gemini-reviewer.cjs",
      ".github/scripts/gemini-autofix.cjs",
      "GEMINI_REVIEWER.md",
      "__tests__/gemini-reviewer-context.test.ts",
      "__tests__/gemini-reviewer-trigger.test.ts",
      "__tests__/gemini-reviewer-workflow.test.ts",
      "__tests__/gemini-reviewer-quality.test.ts"
    ];

    for (const path of retiredPaths) {
      expect(existsSync(path), `${path} must be removed`).toBe(false);
    }

    const workflows = readdirSync(".github/workflows").filter((name) => /\.ya?ml$/i.test(name));
    const staleInvocations = workflows.filter((name) => {
      const content = readFileSync(`.github/workflows/${name}`, "utf8");
      return content.includes(".github/scripts/gemini-reviewer.cjs") ||
        content.includes(".github/scripts/gemini-autofix.cjs");
    });
    expect(staleInvocations).toEqual([]);
  });

  it("preserves Pullfrog and its existing shared Gemini API key wiring", () => {
    const path = ".github/workflows/pullfrog.yml";
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, "utf8")).toContain("GEMINI_API_KEY");
  });

  it("preserves the website Oracle Gemini runtime integration", () => {
    const path = "functions/api/oracle.js";
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, "utf8")).toContain("env.GEMINI_API_KEY");
  });

  it("preserves historical reviewer records and shared Gemini API references", () => {
    const historicalPaths = [
      "specs/050-gemini-pr-review-retirement/spec.md",
      "specs/051-gemini-reviewer-replacement/spec.md",
      "specs/071-gemini-reviewer-reliability/spec.md",
      ".specify/features/gemini-review-context/spec.md",
      ".docs/deep-dive/_google-gemini_gemini-skills_gemini-api-dev.md",
      ".docs/manifest.json"
    ];

    for (const path of historicalPaths) {
      expect(existsSync(path), `${path} must remain available`).toBe(true);
    }
  });
});
