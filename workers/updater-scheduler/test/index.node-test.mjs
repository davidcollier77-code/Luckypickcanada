import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  dispatchWorkflow,
  formatAtlanticParts,
  handleScheduled,
  resolveTarget
} from "../src/index.mjs";

const ts = (value) => Date.parse(value);
const quiet = { log() {}, error() {} };
const summer = [
  ["2026-10-20T04:05:00Z", "5 * * * *", "update-spec-kit.yml", "spec-kit-primary", "01:05"],
  ["2026-10-20T08:05:00Z", "5 * * * *", "update-spec-kit.yml", "spec-kit-retry", "05:05"],
  ["2026-10-20T05:21:00Z", "21 * * * *", "refresh-docs.yml", "docs-primary", "02:21"],
  ["2026-10-20T09:21:00Z", "21 * * * *", "refresh-docs.yml", "docs-backup", "06:21"],
  ["2026-10-20T13:21:00Z", "21 * * * *", "refresh-docs.yml", "docs-recovery", "10:21"]
];
const winter = [
  ["2026-11-03T05:05:00Z", "5 * * * *", "update-spec-kit.yml", "spec-kit-primary", "01:05"],
  ["2026-11-03T09:05:00Z", "5 * * * *", "update-spec-kit.yml", "spec-kit-retry", "05:05"],
  ["2026-11-03T06:21:00Z", "21 * * * *", "refresh-docs.yml", "docs-primary", "02:21"],
  ["2026-11-03T10:21:00Z", "21 * * * *", "refresh-docs.yml", "docs-backup", "06:21"],
  ["2026-11-03T14:21:00Z", "21 * * * *", "refresh-docs.yml", "docs-recovery", "10:21"]
];

for (const [label, rows] of [["daylight time", summer], ["standard time", winter]]) {
  test("maps all five Tuesday targets during " + label, () => {
    for (const [iso, cron, workflow, slot, localTime] of rows) {
      const result = resolveTarget(ts(iso), cron);
      assert.ok(result, iso + " should resolve");
      assert.equal(result.workflow, workflow);
      assert.equal(result.slot, slot);
      assert.equal(result.localTime, localTime);
      assert.equal(result.localWeekday, "Tue");
    }
  });
}

test("maps all five Friday targets in daylight and standard time", () => {
  const rows = [
    ["2026-10-23T04:05:00Z", "5 * * * *", "update-spec-kit.yml", "spec-kit-primary", "01:05"],
    ["2026-10-23T08:05:00Z", "5 * * * *", "update-spec-kit.yml", "spec-kit-retry", "05:05"],
    ["2026-10-23T05:21:00Z", "21 * * * *", "refresh-docs.yml", "docs-primary", "02:21"],
    ["2026-10-23T09:21:00Z", "21 * * * *", "refresh-docs.yml", "docs-backup", "06:21"],
    ["2026-10-23T13:21:00Z", "21 * * * *", "refresh-docs.yml", "docs-recovery", "10:21"],
    ["2026-11-06T05:05:00Z", "5 * * * *", "update-spec-kit.yml", "spec-kit-primary", "01:05"],
    ["2026-11-06T09:05:00Z", "5 * * * *", "update-spec-kit.yml", "spec-kit-retry", "05:05"],
    ["2026-11-06T06:21:00Z", "21 * * * *", "refresh-docs.yml", "docs-primary", "02:21"],
    ["2026-11-06T10:21:00Z", "21 * * * *", "refresh-docs.yml", "docs-backup", "06:21"],
    ["2026-11-06T14:21:00Z", "21 * * * *", "refresh-docs.yml", "docs-recovery", "10:21"]
  ];
  for (const [iso, cron, workflow, slot, time] of rows) {
    const target = resolveTarget(ts(iso), cron);
    assert.ok(target, iso + " should resolve");
    assert.equal(target.workflow, workflow);
    assert.equal(target.slot, slot);
    assert.equal(target.localTime, time);
    assert.equal(target.localWeekday, "Fri");
  }
});

test("ignores non-target dates, times, and cron expressions", () => {
  assert.equal(resolveTarget(ts("2026-10-21T04:05:00Z"), "5 * * * *"), null);
  assert.equal(resolveTarget(ts("2026-10-20T04:05:00Z"), "21 * * * *"), null);
  assert.equal(resolveTarget(ts("2026-10-20T04:06:00Z"), "5 * * * *"), null);
  assert.equal(resolveTarget(ts("2026-10-20T04:05:00Z"), "* * * * *"), null);
});

test("ignores missing or malformed scheduled timestamps", () => {
  assert.equal(resolveTarget(undefined, "5 * * * *"), null);
  assert.equal(resolveTarget(null, "5 * * * *"), null);
  assert.equal(resolveTarget(Number.NaN, "5 * * * *"), null);
  assert.equal(resolveTarget("2026-10-20T04:05:00Z", "5 * * * *"), null);
});

test("scheduled handler safely ignores a missing scheduled timestamp", async () => {
  let noRetryCalls = 0;
  let fetchCalls = 0;
  const result = await handleScheduled(
    {
      scheduledTime: undefined,
      cron: "5 * * * *",
      noRetry() { noRetryCalls++; }
    },
    {
      DISPATCH_ENABLED: "true",
      GITHUB_OWNER: "owner",
      GITHUB_REPO: "repo",
      GITHUB_TOKEN: "dummy-secret"
    },
    {
      logger: quiet,
      fetchImpl: async () => {
        fetchCalls++;
        return new Response(null, { status: 204 });
      }
    }
  );
  assert.deepEqual(result, { outcome: "ignored", reason: "not-an-approved-slot" });
  assert.equal(noRetryCalls, 0);
  assert.equal(fetchCalls, 0);
});

test("timezone formatter reports Atlantic local date and time", () => {
  assert.deepEqual(formatAtlanticParts(ts("2026-10-20T04:05:00Z")), {
    weekday: "Tue", year: "2026", month: "10", day: "20",
    hour: "01", minute: "05", date: "2026-10-20"
  });
  assert.throws(() => formatAtlanticParts("not-a-date"), /valid timestamp/);
});

test("marks approved scheduled attempts no-retry before dispatch", async () => {
  const order = [];
  const controller = {
    scheduledTime: ts("2026-10-20T04:05:00Z"),
    cron: "5 * * * *",
    noRetry() { order.push("noRetry"); }
  };
  const result = await handleScheduled(
    controller,
    {
      DISPATCH_ENABLED: "true",
      GITHUB_OWNER: "owner",
      GITHUB_REPO: "repo",
      GITHUB_TOKEN: "dummy-secret"
    },
    {
      logger: quiet,
      fetchImpl: async () => {
        order.push("fetch");
        return new Response(null, { status: 204 });
      }
    }
  );
  assert.equal(result.outcome, "accepted");
  assert.deepEqual(order, ["noRetry", "fetch"]);
});

test("does not mark an unapproved slot no-retry or dispatch it", async () => {
  let noRetryCalls = 0;
  let fetchCalls = 0;
  const result = await handleScheduled(
    {
      scheduledTime: ts("2026-10-21T04:05:00Z"),
      cron: "5 * * * *",
      noRetry() { noRetryCalls++; }
    },
    {
      DISPATCH_ENABLED: "true",
      GITHUB_OWNER: "owner",
      GITHUB_REPO: "repo",
      GITHUB_TOKEN: "dummy-secret"
    },
    {
      logger: quiet,
      fetchImpl: async () => {
        fetchCalls++;
        return new Response(null, { status: 204 });
      }
    }
  );
  assert.equal(result.outcome, "ignored");
  assert.equal(noRetryCalls, 0);
  assert.equal(fetchCalls, 0);
});

test("is disabled by default and never calls GitHub when disabled", async () => {
  let calls = 0;
  const result = await handleScheduled(
    { scheduledTime: ts("2026-10-20T04:05:00Z"), cron: "5 * * * *" },
    { DISPATCH_ENABLED: "false" },
    { logger: quiet, fetchImpl: async () => { calls++; throw new Error("must not call"); } }
  );
  assert.equal(result.outcome, "disabled");
  assert.equal(calls, 0);
});

test("posts the workflow filename and main ref with a minimal request", async () => {
  let request;
  const result = await dispatchWorkflow(
    { workflow: "update-spec-kit.yml", slot: "spec-kit-primary" },
    { GITHUB_OWNER: "davidcollier77-code", GITHUB_REPO: "Luckypickcanada", GITHUB_TOKEN: "dummy-secret" },
    async (url, init) => { request = { url, init }; return new Response(null, { status: 204 }); }
  );
  assert.equal(result.status, 204);
  assert.equal(request.url, "https://api.github.com/repos/davidcollier77-code/Luckypickcanada/actions/workflows/update-spec-kit.yml/dispatches");
  assert.equal(request.init.method, "POST");
  assert.equal(request.init.headers.Authorization, "Bearer dummy-secret");
  assert.deepEqual(JSON.parse(request.init.body), { ref: "main" });
});

test("accepts successful HTTP 200 responses", async () => {
  const result = await dispatchWorkflow(
    { workflow: "refresh-docs.yml", slot: "docs-primary" },
    { GITHUB_OWNER: "owner", GITHUB_REPO: "repo", GITHUB_TOKEN: "dummy-secret" },
    async () => new Response(JSON.stringify({ workflow_run_id: 123 }), { status: 200 })
  );
  assert.equal(result.status, 200);
});

test("fails safely on missing configuration or non-success HTTP status", async () => {
  await assert.rejects(() => dispatchWorkflow({ workflow: "refresh-docs.yml" }, {}), /GITHUB_OWNER/);
  await assert.rejects(() => dispatchWorkflow(
    { workflow: "refresh-docs.yml" },
    { GITHUB_OWNER: "owner", GITHUB_REPO: "repo", GITHUB_TOKEN: "dummy-secret" },
    async () => new Response("not logged", { status: 403 })
  ), /HTTP 403/);
});

test("failed dispatch logs status without token or response body", async () => {
  const lines = [];
  const logger = { log: (value) => lines.push(value), error: (value) => lines.push(value) };
  await assert.rejects(() => handleScheduled(
    { scheduledTime: ts("2026-10-20T04:05:00Z"), cron: "5 * * * *" },
    { DISPATCH_ENABLED: "true", GITHUB_OWNER: "owner", GITHUB_REPO: "repo", GITHUB_TOKEN: "secret-token" },
    { logger, fetchImpl: async () => new Response("private body", { status: 403 }) }
  ), /HTTP 403/);
  const output = lines.join("\n");
  assert.match(output, /HTTP 403/);
  assert.doesNotMatch(output, /secret-token|private body/);
});

test("activation enables Worker while preserving native schedules pending explicit handoff", async () => {
  const readRepoFile = (path) => readFile(new URL("../../../" + path, import.meta.url), "utf8");
  const [config, specKitWorkflow, docsWorkflow] = await Promise.all([
    readRepoFile("workers/updater-scheduler/wrangler.toml"),
    readRepoFile(".github/workflows/update-spec-kit.yml"),
    readRepoFile(".github/workflows/refresh-docs.yml")
  ]);

  assert.match(config, /^DISPATCH_ENABLED = "true"$/m);
  for (const [name, workflow] of [
    ["Spec Kit updater", specKitWorkflow],
    ["documentation updater", docsWorkflow]
  ]) {
    assert.match(workflow, /^  workflow_dispatch:\s*$/m, name + " must retain manual dispatch");
    assert.match(workflow, /^  schedule:\s*$/m, name + " must keep automatic scheduling before cutover");
    assert.match(workflow, /vars\.UPDATER_SCHEDULER_ACTIVE != 'true'/, name + " must support guarded handoff to Worker scheduling");
  }
});

test("enabled scheduler bundles its dispatch secret into the same Worker deployment", async () => {
  const workflow = await readFile(new URL("../../../.github/workflows/deploy-updater-scheduler.yml", import.meta.url), "utf8");
  const validation = workflow.indexOf("name: Validate GitHub dispatch write permission before enabling scheduler");
  const deployment = workflow.indexOf("name: Deploy updater scheduler from reviewed configuration");

  assert.ok(validation >= 0, "credential canary validation must be present");
  assert.ok(deployment > validation, "deployment must follow successful canary validation");
  assert.match(workflow, /--secrets-file "\$SECRETS_FILE"/);
  assert.match(workflow, /process\.env\.UPDATER_DISPATCH_TOKEN/);
  assert.doesNotMatch(workflow, /wrangler secret put GITHUB_TOKEN/);
  assert.doesNotMatch(workflow, /name: Sync GitHub dispatch token before deployment/);
});
