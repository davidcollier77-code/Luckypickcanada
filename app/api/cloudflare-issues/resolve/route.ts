/**
 * POST /api/cloudflare-issues/resolve
 *
 * Protected endpoint on the deployed Cloudflare Worker. It marks the given
 * Workers Observability issues as `resolved` using the `CLOUDFLARE_API_TOKEN`
 * Worker secret, and reports success only for issues Cloudflare itself confirms
 * as `resolved`.
 *
 * Authentication: `Authorization: Bearer <CLOUDFLARE_ISSUE_RESOLVE_TOKEN>`.
 * The route is closed (HTTP 503) when either Worker secret is missing, so a
 * half-configured deployment can never resolve anything or open the endpoint.
 *
 * Callers: the post-deploy `resolve-observability-issues` job in
 * `.github/workflows/deploy-open-next.yml`, after the fix build and deploy
 * succeeded.
 */

import {
  normalizeIssueIds,
  redactCredentials,
  resolveAccountId,
  resolveObservabilityIssues,
} from '../../../lib/cloudflare-observability-issues';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

function jsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

/** Read a bearer credential without accepting `Bearer` with an empty value. */
function readBearerToken(request: Request): string {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(\S.*)$/i.exec(header.trim());
  return match ? match[1].trim() : '';
}

/**
 * Compare two credentials without an early exit.
 *
 * The inputs are hashed first so the comparison length does not depend on the
 * supplied secret, then all digest bytes are compared before returning.
 */
async function secureEquals(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [providedDigest, expectedDigest] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const providedBytes = new Uint8Array(providedDigest);
  const expectedBytes = new Uint8Array(expectedDigest);
  let difference = 0;
  for (let index = 0; index < providedBytes.length; index += 1) {
    difference |= providedBytes[index] ^ expectedBytes[index];
  }
  return difference === 0;
}

export async function POST(request: Request): Promise<Response> {
  const resolveToken = (process.env.CLOUDFLARE_ISSUE_RESOLVE_TOKEN || '').trim();
  if (resolveToken === '') {
    return jsonResponse(
      { resolved: false, error: 'Cloudflare issue resolver is not configured on this Worker.' },
      503,
    );
  }

  const providedToken = readBearerToken(request);
  if (providedToken === '' || !(await secureEquals(providedToken, resolveToken))) {
    return jsonResponse({ resolved: false, error: 'Unauthorized.' }, 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ resolved: false, error: 'Request body must be valid JSON.' }, 400);
  }

  const issueIds = normalizeIssueIds((payload as { issueIds?: unknown } | null)?.issueIds);
  if (!issueIds) {
    return jsonResponse(
      {
        resolved: false,
        error: 'Body must contain `issueIds` with 1-10 distinct Cloudflare issue UUIDs.',
      },
      400,
    );
  }

  const apiToken = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
  if (apiToken === '') {
    return jsonResponse(
      { resolved: false, error: 'Cloudflare API token is not configured on this Worker.' },
      503,
    );
  }

  const results = await resolveObservabilityIssues({
    issueIds,
    apiToken,
    accountId: resolveAccountId(),
  });

  const allResolved = results.every((result) => result.resolved);
  const unresolved = results.filter((result) => !result.resolved);

  if (!allResolved) {
    // Report the failure, keep the unresolved issues untouched and never claim
    // a partial resolution as success.
    console.error(
      'Cloudflare issue resolution failed:',
      redactCredentials(
        unresolved
          .map((result) => `${result.issueId}: ${result.error ?? 'unknown failure'}`)
          .join('; '),
        [apiToken],
      ),
    );
  }

  return jsonResponse({ resolved: allResolved, results }, allResolved ? 200 : 502);
}
