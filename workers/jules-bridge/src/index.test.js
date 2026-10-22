import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "./index.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function webhookRequest(payload) {
  return new Request("https://jules-bridge.example.workers.dev/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-webhook-auth": "test-webhook-secret",
    },
    body: JSON.stringify(payload),
  });
}

const validEnv = { CF_WEBHOOK_SECRET: "test-webhook-secret" };

describe("Jules bridge webhook account validation", () => {
  it("rejects a mismatched account identifier", async () => {
    const response = await worker.fetch(
      webhookRequest({ account_id: "00000000000000000000000000000000" }),
      validEnv,
    );
    expect(response.status).toBe(403);
  });

  it("rejects a non-string account identifier when present", async () => {
    const response = await worker.fetch(
      webhookRequest({ account_id: { unexpected: "value" } }),
      validEnv,
    );
    expect(response.status).toBe(403);
  });

  it("allows account_id to be absent because Cloudflare omits it for some alerts", async () => {
    const response = await worker.fetch(webhookRequest({ text: "test alert" }), validEnv);
    // The request passes account validation and then stops at the missing Jules API key.
    expect(response.status).toBe(503);
    expect(await response.text()).toContain("Jules authentication is not configured");
  });
});
