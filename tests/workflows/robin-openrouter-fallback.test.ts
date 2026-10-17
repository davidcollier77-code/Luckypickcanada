import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/robin.yml"), "utf8");
const primaryStart = workflow.indexOf("id: primary_review");
const fallbackStart = workflow.indexOf("id: fallback_review");
const finalGuardStart = workflow.indexOf("id: review_final_guard");
const primaryStep = workflow.slice(primaryStart, fallbackStart);
const fallbackStep = workflow.slice(fallbackStart, finalGuardStart);

describe("Robin OpenRouter fallback workflow", () => {
  it("does not call or accept Amazon Q as Robin's fallback", () => {
    expect(workflow).not.toMatch(/amazon-q-developer\[bot\]|\/q review|q_fallback|Q_FALLBACK_FOUND|Amazon Q fallback/i);
  });

  it("runs two pinned Robin attempts with the existing OpenRouter secret", () => {
    expect(workflow.match(/uses: antongulin\/robin@fc0bf915b634bf2f8b88ff1392acefdfb54e28d9/g)).toHaveLength(2);
    expect(primaryStep).toContain("llm-api-key: ${{ secrets.OPENROUTER_API_KEY }}");
    expect(fallbackStep).toContain("llm-api-key: ${{ secrets.OPENROUTER_API_KEY }}");
    expect(fallbackStep).toContain("model: ${{ steps.review_preflight.outputs.fallback_model }}");
  });

  it("defaults to a separate free model and rejects paid or router aliases", () => {
    expect(workflow).toContain('FALLBACK_MODEL_OVERRIDE: ${{ vars.ROBIN_LLM_FALLBACK_MODEL }}');
    expect(workflow).toContain('fallback_model="${FALLBACK_MODEL_OVERRIDE:-nvidia/nemotron-3-super-120b-a12b:free}"');
    expect(workflow).toContain('[[ ! "$fallback_model" =~ ^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+:free$');
    expect(fallbackStep).toContain('llm-timeout-ms: "35000"');
  });

  it("still allows Robin summary/help commands to run when quota is low", () => {
    expect(workflow).toContain("steps.quota_preflight.outputs.free_quota_insufficient != 'true' || (github.event_name == 'issue_comment'");
    expect(primaryStep).toContain("startsWith(github.event.comment.body, '/summary')");
    expect(primaryStep).toContain("startsWith(github.event.comment.body, '/help')");
  });

  it("does not call the fallback when OpenRouter explicitly reports zero free requests", () => {
    expect(workflow).toContain("free_quota_remaining=${remainingOutput}");
    expect(workflow).toContain("steps.quota_preflight.outputs.free_quota_remaining != '0'");
    expect(workflow).toContain('if [[ "$FREE_QUOTA_REMAINING" == "0" ]]');
  });

  it("requires a Robin review for the exact current PR head before passing the review check", () => {
    expect(workflow).toContain("id: review_final_guard");
    expect(workflow).toContain("env.HEAD_SHA");
    expect(workflow).toContain("env.REVIEW_START_EPOCH");
    expect(workflow).toContain('if [[ "$FINAL_GUARD_POSTED" == "true" ]]');
  });
});
