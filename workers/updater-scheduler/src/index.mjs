const ATLANTIC_ZONE = "America/Halifax";
const SUPPORTED_CRONS = new Set(["5 * * * *", "21 * * * *"]);

// GitHub rejects REST requests that carry no User-Agent header with HTTP 403
// "Request forbidden by administrative rules". Cloudflare Workers fetch sends
// no default User-Agent, so every dispatch request must set one explicitly.
export const GITHUB_USER_AGENT = "luckypickcanada-updater-scheduler";

// Bounded, allowlisted failure diagnostics: enough to tell a missing User-Agent
// from a credential or rate-limit rejection without leaking the token.
const DIAGNOSTIC_BODY_LIMIT = 500;
const DIAGNOSTIC_HEADERS = [
  "content-type",
  "retry-after",
  "x-github-request-id",
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
  "x-ratelimit-reset"
];
const TARGETS = new Map([
  ["Tue 01:05", { workflow: "update-spec-kit.yml", slot: "spec-kit-primary" }],
  ["Fri 01:05", { workflow: "update-spec-kit.yml", slot: "spec-kit-primary" }],
  ["Tue 05:05", { workflow: "update-spec-kit.yml", slot: "spec-kit-retry" }],
  ["Fri 05:05", { workflow: "update-spec-kit.yml", slot: "spec-kit-retry" }],
  ["Tue 02:21", { workflow: "refresh-docs.yml", slot: "docs-primary" }],
  ["Fri 02:21", { workflow: "refresh-docs.yml", slot: "docs-primary" }],
  ["Tue 06:21", { workflow: "refresh-docs.yml", slot: "docs-backup" }],
  ["Fri 06:21", { workflow: "refresh-docs.yml", slot: "docs-backup" }],
  ["Tue 10:21", { workflow: "refresh-docs.yml", slot: "docs-recovery" }],
  ["Fri 10:21", { workflow: "refresh-docs.yml", slot: "docs-recovery" }]
]);
const ATLANTIC_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: ATLANTIC_ZONE,
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

export function formatAtlanticParts(scheduledTime) {
  const date = new Date(scheduledTime);
  if (!Number.isFinite(date.getTime())) {
    throw new TypeError("scheduledTime must be a valid timestamp");
  }
  const parts = Object.fromEntries(
    ATLANTIC_FORMATTER.formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map(({ type, value }) => [type, value])
  );
  return {
    weekday: parts.weekday,
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    date: parts.year + "-" + parts.month + "-" + parts.day
  };
}

export function resolveTarget(scheduledTime, cron) {
  if (!SUPPORTED_CRONS.has(cron)) return null;
  if (typeof scheduledTime !== "number" || !Number.isFinite(scheduledTime)) return null;
  const parts = formatAtlanticParts(scheduledTime);
  const expectedMinute = cron === "5 * * * *" ? "05" : "21";
  if (parts.minute !== expectedMinute) return null;
  const match = TARGETS.get(parts.weekday + " " + parts.hour + ":" + parts.minute);
  if (!match) return null;
  return {
    ...match,
    localDate: parts.date,
    localTime: parts.hour + ":" + parts.minute,
    localWeekday: parts.weekday,
    scheduledTime: new Date(scheduledTime).toISOString()
  };
}

function validateEnv(env) {
  const owner = env && env.GITHUB_OWNER;
  const repo = env && env.GITHUB_REPO;
  const token = env && env.GITHUB_TOKEN;
  if (!owner || !/^[A-Za-z0-9_.-]+$/.test(owner)) {
    throw new Error("Missing or invalid GITHUB_OWNER configuration");
  }
  if (!repo || !/^[A-Za-z0-9_.-]+$/.test(repo)) {
    throw new Error("Missing or invalid GITHUB_REPO configuration");
  }
  if (typeof token !== "string" || token.length === 0) {
    throw new Error("Missing GITHUB_TOKEN secret");
  }
  return { owner, repo, token };
}

function sanitizeDiagnosticBody(text, token) {
  let body = String(text == null ? "" : text);
  if (typeof token === "string" && token.length > 0) {
    body = body.split(token).join("[redacted]");
  }
  const normalized = body
    .replace(/Bearer\s+[^\s"']+/gi, "Bearer [redacted]")
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g, "[redacted]")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length <= DIAGNOSTIC_BODY_LIMIT) return normalized;
  return normalized.slice(0, DIAGNOSTIC_BODY_LIMIT) + "…[truncated]";
}

function selectDiagnosticHeaders(headers) {
  const selected = {};
  if (!headers || typeof headers.get !== "function") return selected;
  for (const name of DIAGNOSTIC_HEADERS) {
    const value = headers.get(name);
    if (value !== null && value !== undefined && value !== "") {
      selected[name] = String(value);
    }
  }
  return selected;
}

async function readDiagnosticBody(response, token) {
  try {
    if (!response || typeof response.text !== "function") return "";
    return sanitizeDiagnosticBody(await response.text(), token);
  } catch {
    return "[body unavailable]";
  }
}

export class GitHubDispatchError extends Error {
  constructor(status, body, headers) {
    super("GitHub workflow dispatch failed with HTTP " + status);
    this.name = "GitHubDispatchError";
    this.githubStatus = status;
    this.githubBody = body;
    this.githubHeaders = headers;
  }
}

export async function dispatchWorkflow(target, env, fetchImpl = fetch) {
  const { owner, repo, token } = validateEnv(env);
  const endpoint = "https://api.github.com/repos/" + owner + "/" + repo +
    "/actions/workflows/" + target.workflow + "/dispatches";
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      "User-Agent": GITHUB_USER_AGENT,
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: JSON.stringify({
      ref: "main",
      inputs: { dispatch_source: "cloudflare", scheduler_slot: target.slot }
    })
  });
  if (!response.ok) {
    throw new GitHubDispatchError(
      response.status,
      await readDiagnosticBody(response, token),
      selectDiagnosticHeaders(response.headers)
    );
  }
  return { status: response.status, workflow: target.workflow, slot: target.slot };
}

export async function handleScheduled(controller, env, options = {}) {
  const logger = options.logger || console;
  const fetchImpl = options.fetchImpl || fetch;
  const target = resolveTarget(controller && controller.scheduledTime, controller && controller.cron);
  if (!target) return { outcome: "ignored", reason: "not-an-approved-slot" };

  // GitHub may have accepted a dispatch even if its response is lost. Suppress
  // platform retries for approved slots to avoid launching the same updater twice;
  // the next scheduled backup/recovery slot is the retry opportunity.
  if (typeof controller?.noRetry === "function") controller.noRetry();

  const logContext = {
    localDate: target.localDate,
    localTime: target.localTime,
    localWeekday: target.localWeekday,
    slot: target.slot,
    workflow: target.workflow,
    scheduledTime: target.scheduledTime
  };
  if (!env || env.DISPATCH_ENABLED !== "true") {
    logger.log(JSON.stringify({ event: "workflow-dispatch", outcome: "disabled", ...logContext }));
    return { outcome: "disabled", target };
  }
  try {
    const result = await dispatchWorkflow(target, env, fetchImpl);
    logger.log(JSON.stringify({
      event: "workflow-dispatch",
      outcome: "accepted",
      httpStatus: result.status,
      ...logContext
    }));
    return { outcome: "accepted", target, status: result.status };
  } catch (error) {
    const diagnostics = error && error.githubStatus !== undefined
      ? {
          githubStatus: error.githubStatus,
          githubBody: error.githubBody,
          githubHeaders: error.githubHeaders
        }
      : {};
    logger.error(JSON.stringify({
      event: "workflow-dispatch",
      outcome: "failed",
      error: error instanceof Error ? error.message : "Unknown dispatch failure",
      ...diagnostics,
      ...logContext
    }));
    throw error;
  }
}

export default {
  async scheduled(controller, env) {
    return handleScheduled(controller, env);
  }
};
