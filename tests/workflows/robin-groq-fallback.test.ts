import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/robin.yml"), "utf8");
const primaryStart = workflow.indexOf("id: primary_review");
const groqPreflightStart = workflow.indexOf("id: groq_preflight");
const fallbackStart = workflow.indexOf("id: fallback_review");
const finalGuardStart = workflow.indexOf("id: review_final_guard");
const primaryStep = workflow.slice(primaryStart, groqPreflightStart);
const groqPreflight = workflow.slice(groqPreflightStart, fallbackStart);
const fallbackStep = workflow.slice(fallbackStart, finalGuardStart);

describe("Robin Groq fallback workflow", () => {
  it("does not use Amazon Q as Robin's fallback", () => {
    expect(workflow).not.toContain("/q review");
    expect(workflow).not.toMatch(/q_fallback|Q_FALLBACK_FOUND|Amazon Q fallback/i);
  });

  it("keeps OpenRouter primary and uses Groq as a separate provider", () => {
    expect(workflow.split("uses: antongulin/robin@fc0bf915b634bf2f8b88ff1392acefdfb54e28d9").length - 1).toBe(2);
    expect(primaryStep).toContain("llm-api-key: ${{ secrets.OPENROUTER_API_KEY }}");
    expect(fallbackStep).toContain("llm-api-key: ${{ secrets.GROQ_API_KEY }}");
    expect(fallbackStep).toContain("llm-base-url: https://api.groq.com/openai/v1");
    expect(fallbackStep).toContain('model: "llama-3.1-8b-instant"');
    expect(fallbackStep).not.toContain("OPENROUTER_API_KEY");
  });

  it("requires Groq API key configuration", () => {


    expect(groqPreflight).toContain("GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}");

    expect(fallbackStep).toContain("steps.groq_preflight.outputs.configured == 'true'");
  });

  it("does not gate Groq on OpenRouter quota or key availability", () => {
    const condition = fallbackStep.slice(0, fallbackStep.indexOf("\n        uses:"));
    expect(condition).not.toContain("free_quota_remaining");
    expect(condition).not.toContain("key_available == 'true'");
    expect(workflow).toContain('if [[ "$FREE_QUOTA_REMAINING" == "0" ]]');
    expect(workflow).not.toContain("The fallback was not called to avoid a guaranteed quota failure");
  });

  it("bounds fallback time and output size", () => {
    expect(fallbackStep).toContain("timeout-minutes: 2");
    expect(workflow).toContain('FALLBACK_MODEL: "llama-3.1-8b-instant"');
    expect(fallbackStep).toContain('max-diff-size: "50000"');
    expect(fallbackStep).toContain('max-output-tokens: "256"');
    expect(fallbackStep).toContain('llm-timeout-ms: "60000"');
  });

  it("preserves summary/help commands and exact-current-head review verification", () => {
    expect(primaryStep).toContain("startsWith(github.event.comment.body, '/summary')");
    expect(primaryStep).toContain("startsWith(github.event.comment.body, '/help')");
    expect(workflow).toContain("id: review_final_guard");
    expect(workflow).toContain("env.HEAD_SHA");
    expect(workflow).toContain("env.REVIEW_START_EPOCH");
    expect(workflow).toContain('if [[ "$FINAL_GUARD_POSTED" == "true" ]]');
  });
});
