/**
 * Cloudflare Workers Observability issue resolution.
 *
 * The deployed Cloudflare Worker holds `CLOUDFLARE_API_TOKEN` as a Worker
 * secret. This module is the only place that spends it: it asks Cloudflare to
 * move one Observability issue to `resolved` and reports success only when the
 * API response itself confirms `status: "resolved"`.
 *
 * Failure contract:
 * - A rejected request, an unparsable body, a `success: false` payload or an
 *   unconfirmed status is reported as `resolved: false` with a redacted reason.
 * - Nothing here guesses, retries blindly or closes anything. The caller decides
 *   how to report the failure; the Cloudflare issue simply stays as it was.
 *
 * The token value is never included in a returned reason or log line.
 */

/** Cloudflare API origin. Kept as one constant so the route stays testable. */
export const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * The Lucky Pick Canada Cloudflare account. It is a public identifier, not a
 * credential, and matches `scripts/cloudflare/workers-issues-to-github-setup.sh`.
 * `CLOUDFLARE_ACCOUNT_ID` may override it for another account or for tests.
 */
export const DEFAULT_CLOUDFLARE_ACCOUNT_ID = 'dbd3120f6fa0104b5fe66c201ea4251b';

/** Cloudflare issue identifiers are UUIDs. */
const ISSUE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Upper bound on one resolution request; a deploy fixes one or a few issues. */
export const MAX_ISSUES_PER_REQUEST = 10;

/** How much of an unexpected Cloudflare response is quoted back in a reason. */
const RESPONSE_EXCERPT_LIMIT = 300;

export type ObservabilityIssueResolution = {
  issueId: string;
  resolved: boolean;
  /** Status Cloudflare reported back, or null when it reported none. */
  status: string | null;
  /** Redacted failure reason; null when the issue was confirmed resolved. */
  error: string | null;
};

export type ResolveObservabilityIssueOptions = {
  issueId: string;
  apiToken: string;
  accountId?: string;
  fetchImpl?: typeof fetch;
};

/** True when the value is a syntactically valid Cloudflare issue identifier. */
export function isCloudflareIssueId(value: unknown): value is string {
  return typeof value === 'string' && ISSUE_ID_PATTERN.test(value.trim());
}

/**
 * Validate a caller-supplied issue list.
 *
 * Validation is all-or-nothing: if the input is not an array, is empty, has
 * more than MAX_ISSUES_PER_REQUEST entries (counted before de-duplication), or
 * contains ANY entry that is not a valid Cloudflare issue UUID, the entire
 * batch is rejected and `null` is returned. Invalid entries are never silently
 * dropped and no partial results are ever returned.
 *
 * On success, IDs are trimmed and lowercased, and duplicates are removed while
 * preserving first-seen order.
 *
 * @returns the normalized, distinct issue IDs, or `null` if the input is
 * invalid (callers should respond with HTTP 400).
 */
export function normalizeIssueIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length === 0 || value.length > MAX_ISSUES_PER_REQUEST) return null;

  const issueIds: string[] = [];
  for (const candidate of value) {
    if (!isCloudflareIssueId(candidate)) return null;
    const issueId = candidate.trim().toLowerCase();
    if (!issueIds.includes(issueId)) issueIds.push(issueId);
  }
  return issueIds.length > 0 ? issueIds : null;
}

/** Resolve the Cloudflare account id, allowing an explicit environment override. */
export function resolveAccountId(env: NodeJS.ProcessEnv = process.env): string {
  const configured = typeof env?.CLOUDFLARE_ACCOUNT_ID === 'string' ? env.CLOUDFLARE_ACCOUNT_ID.trim() : '';
  return configured || DEFAULT_CLOUDFLARE_ACCOUNT_ID;
}

/**
 * Strip credential material from text that may reach a response or a log.
 * Applied to the API token and to anything shaped like a bearer credential.
 */
export function redactCredentials(text: string, secrets: string[] = []): string {
  let redacted = typeof text === 'string' ? text : '';
  for (const secret of secrets) {
    if (typeof secret === 'string' && secret.length >= 8) {
      redacted = redacted.split(secret).join('[redacted]');
    }
  }
  return redacted
    .replace(/Bearer\s+[^\s"',]+/gi, 'Bearer [redacted]')
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, RESPONSE_EXCERPT_LIMIT);
}

/** First Cloudflare error message from a response payload, when present. */
function firstCloudflareError(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const errors = (payload as { errors?: unknown }).errors;
  if (!Array.isArray(errors)) return null;
  for (const entry of errors) {
    if (entry && typeof entry === 'object') {
      const message = (entry as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim() !== '') return message;
    }
  }
  return null;
}

/** Status Cloudflare reported for the issue, when the payload carries one. */
function reportedStatus(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const result = (payload as { result?: unknown }).result;
  if (!result || typeof result !== 'object') return null;
  const status = (result as { status?: unknown }).status;
  return typeof status === 'string' ? status : null;
}

/**
 * Ask Cloudflare to mark one Observability issue as resolved.
 *
 * `resolved: true` is returned only for a successful response that explicitly
 * confirms `status: "resolved"`. Everything else is a failure.
 */
export async function resolveObservabilityIssue({
  issueId,
  apiToken,
  accountId = resolveAccountId(),
  fetchImpl = fetch,
}: ResolveObservabilityIssueOptions): Promise<ObservabilityIssueResolution> {
  if (!isCloudflareIssueId(issueId)) {
    return { issueId: String(issueId), resolved: false, status: null, error: 'Invalid Cloudflare issue identifier.' };
  }
  if (typeof apiToken !== 'string' || apiToken.trim() === '') {
    return { issueId, resolved: false, status: null, error: 'Cloudflare API token is not configured.' };
  }

  const endpoint =
    `${CLOUDFLARE_API_BASE}/accounts/${encodeURIComponent(accountId)}` +
    `/workers/observability/issues/${encodeURIComponent(issueId.trim().toLowerCase())}`;

  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ status: 'resolved' }),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      issueId,
      resolved: false,
      status: null,
      error: redactCredentials(`Cloudflare request failed: ${detail}`, [apiToken]),
    };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const status = reportedStatus(payload);

  if (!response.ok || (payload as { success?: unknown } | null)?.success !== true) {
    const detail = firstCloudflareError(payload) || 'no error detail returned';
    return {
      issueId,
      resolved: false,
      status,
      error: redactCredentials(
        `Cloudflare rejected the status update (HTTP ${response.status}): ${detail}`,
        [apiToken],
      ),
    };
  }

  if (status !== 'resolved') {
    return {
      issueId,
      resolved: false,
      status,
      error: `Cloudflare did not confirm the resolved status (reported: ${status ?? 'unknown'}).`,
    };
  }

  return { issueId, resolved: true, status, error: null };
}

/**
 * Resolve several issues, preserving input order.
 *
 * Each issue is reported independently so a partial failure cannot be presented
 * as a successful resolution.
 */
export async function resolveObservabilityIssues({
  issueIds,
  apiToken,
  accountId = resolveAccountId(),
  fetchImpl,
}: {
  issueIds: string[];
  apiToken: string;
  accountId?: string;
  fetchImpl?: typeof fetch;
}): Promise<ObservabilityIssueResolution[]> {
  const results: ObservabilityIssueResolution[] = [];
  for (const issueId of issueIds) {
    results.push(await resolveObservabilityIssue({ issueId, apiToken, accountId, fetchImpl }));
  }
  return results;
}
