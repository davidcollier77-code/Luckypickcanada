import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/robin.yml"), "utf8");
const primaryStart = workflow.indexOf("id: primary_review");
const cloudflarePreflightStart = workflow.indexOf("id: cloudflare_preflight");
const fallbackStart = workflow.indexOf("id: fallback_review");
const finalGuardStart = workflow.indexOf("id: review_final_guard");
const primaryStep = workflow.slice(primaryStart, cloudflarePreflightStart);
const cloudflarePreflight = workflow.slice(cloudflarePreflightStart, fallbackStart);
const fallbackStep = workflow.slice(fallbackStart, finalGuardStart);

describe("Robin Cloudflare Workers AI fallback workflow", () => {
  it("does not use Amazon Q as Robin's fallback", () => {
    expect(workflow).not.toContain("/q review");
    expect(workflow).not.toMatch(/q_fallback|Q_FALLBACK_FOUND|Amazon Q fallback/i);
  });

  it("keeps OpenRouter primary and uses Cloudflare as a separate provider", () => {
    expect(workflow.split("uses: antongulin/robin@fc0bf915b634bf2f8b88ff1392acefdfb54e28d9").length - 1).toBe(2);
    expect(primaryStep).toContain("llm-api-key: ${{ secrets.OPENROUTER_API_KEY }}");
    expect(fallbackStep).toContain("llm-api-key: ${{ secrets.CLOUDFLARE_API_TOKEN }}");
    expect(fallbackStep).toContain("llm-base-url: https://api.cloudflare.com/client/v4/accounts/${{ vars.CLOUDFLARE_ACCOUNT_ID }}/ai/v1");
    expect(fallbackStep).toContain('model: "@cf/zai-org/glm-4.7-flash"');
    expect(fallbackStep).not.toContain("OPENROUTER_API_KEY");
  });

  it("requires explicit free-plan confirmation and a narrowly scoped token", () => {
    expect(cloudflarePreflight).toContain("CLOUDFLARE_FREE_TIER_CONFIRMED: ${{ vars.ROBIN_CLOUDFLARE_AI_FREE_TIER_CONFIRMED }}");
    expect(cloudflarePreflight).toContain("CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}");
    expect(cloudflarePreflight).toContain("CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}");
    expect(cloudflarePreflight).toContain('if [[ "${CLOUDFLARE_FREE_TIER_CONFIRMED:-}" != "true" ]]');
    expect(fallbackStep).toContain("steps.cloudflare_preflight.outputs.configured == 'true'");
  });

  it("does not gate Cloudflare on OpenRouter quota or key availability", () => {
    const condition = fallbackStep.slice(0, fallbackStep.indexOf("\n        uses:"));
    expect(condition).not.toContain("free_quota_remaining");
    expect(condition).not.toContain("key_available == 'true'");
    expect(workflow).toContain('if [[ "$FREE_QUOTA_REMAINING" == "0" ]]');
    expect(workflow).not.toContain("The fallback was not called to avoid a guaranteed quota failure");
  });

  it("bounds fallback time and output size", () => {
    expect(fallbackStep).toContain("timeout-minutes: 2");
    expect(fallbackStep).toContain('max-diff-size: "50000"');
    expect(fallbackStep).toContain('max-output-tokens: "2048"');
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
  it("still attempts Cloudflare if the pre-fallback review lookup fails", () => {
    const preflightCondition = cloudflarePreflight.slice(0, cloudflarePreflight.indexOf("\n        shell:"));
    expect(preflightCondition).not.toContain("steps.review_guard.outcome == 'success'");
    expect(preflightCondition).toContain("steps.review_guard.outputs.posted != 'true'");
  });

  it("exports the event name and defines only one safe comment-body variable", () => {
    const enforcementStart = workflow.indexOf("      - name: Record and enforce review outcome");
    const enforcementStep = workflow.slice(enforcementStart);
    expect(enforcementStep).toContain("EVENT_NAME: ${{ github.event_name }}");
    expect((enforcementStep.match(/^\s+COMMENT_BODY:/gm) || []).length).toBe(1);
    expect(enforcementStep).toContain('if [[ "$EVENT_NAME" == "issue_comment"');
    const commentBodyMatch = enforcementStep.match(/COMMENT_BODY:\s*(\$\{\{[^}]+\}\})/);
    expect(commentBodyMatch).not.toBeNull();
    expect(commentBodyMatch![1]).toMatch(/^(\$\{\{[^}]*'\/review'[^}]*\}\}|\$\{\{[^}]*'\/robin'[^}]*\}\}|\$\{\{[^}]*''\s*\}\})$/);
  });

});
