// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '../app/api/cloudflare-issues/resolve/route';

const ISSUE_ID = 'a94d47c2-d9e8-468d-ae61-c966c9ab7199';
const SECOND_ISSUE_ID = 'f8607191-3b38-4c40-84e3-6ff40a036b1f';
const RESOLVE_TOKEN = 'test-resolve-token-value';
const API_TOKEN = 'test-cloudflare-api-token-value';
const ENDPOINT = 'https://luckypickcanada.ca/api/cloudflare-issues/resolve';

const ENV_KEYS = ['CLOUDFLARE_ISSUE_RESOLVE_TOKEN', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'];
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

function restoreEnv() {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
}

function configure({ resolveToken = RESOLVE_TOKEN, apiToken = API_TOKEN } = {}) {
  if (resolveToken === null) delete process.env.CLOUDFLARE_ISSUE_RESOLVE_TOKEN;
  else process.env.CLOUDFLARE_ISSUE_RESOLVE_TOKEN = resolveToken;

  if (apiToken === null) delete process.env.CLOUDFLARE_API_TOKEN;
  else process.env.CLOUDFLARE_API_TOKEN = apiToken;
}

function makeRequest(body, headers = {}) {
  return new Request(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function authorizedRequest(body) {
  return makeRequest(body, { Authorization: `Bearer ${RESOLVE_TOKEN}` });
}

function cloudflareResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function confirmedResolution(issueId = ISSUE_ID) {
  return cloudflareResponse({ success: true, errors: [], result: { id: issueId, status: 'resolved' } });
}

describe('POST /api/cloudflare-issues/resolve', () => {
  beforeEach(() => {
    configure();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    restoreEnv();
  });

  it('is closed when the resolver token is not configured', async () => {
    configure({ resolveToken: null });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const response = await POST(authorizedRequest({ issueIds: [ISSUE_ID] }));

    expect(response.status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('is closed when the Cloudflare API token is not configured', async () => {
    configure({ apiToken: null });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const response = await POST(authorizedRequest({ issueIds: [ISSUE_ID] }));

    expect(response.status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects a request without a bearer credential', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const response = await POST(makeRequest({ issueIds: [ISSUE_ID] }));

    expect(response.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects a request with the wrong bearer credential', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const response = await POST(
      makeRequest({ issueIds: [ISSUE_ID] }, { Authorization: 'Bearer not-the-configured-token' }),
    );

    expect(response.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each([
    ['malformed JSON', 'not-json'],
    ['a missing issue list', {}],
    ['an empty issue list', { issueIds: [] }],
    ['a non-UUID identifier', { issueIds: ['not-an-issue-id'] }],
    ['a non-array issue list', { issueIds: ISSUE_ID }],
    ['too many identifiers', { issueIds: Array.from({ length: 11 }, (_, index) => `${index}94d47c2-d9e8-468d-ae61-c966c9ab7199`) }],
  ])('rejects %s with HTTP 400 without calling Cloudflare', async (_label, body) => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const response = await POST(authorizedRequest(body));

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('resolves an issue only after Cloudflare confirms the resolved status', async () => {
    let requestedUrl = '';
    let requestedInit: RequestInit | undefined;
    const fetchSpy = vi.fn(async (url: string, init: RequestInit) => {
      requestedUrl = url;
      requestedInit = init;
      return confirmedResolution();
    });
    vi.stubGlobal('fetch', fetchSpy);

    const response = await POST(authorizedRequest({ issueIds: [ISSUE_ID] }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      resolved: true,
      results: [{ issueId: ISSUE_ID, resolved: true, status: 'resolved', error: null }],
    });
    expect(response.headers.get('cache-control')).toBe('no-store');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(requestedUrl).toContain(
      `/accounts/dbd3120f6fa0104b5fe66c201ea4251b/workers/observability/issues/${ISSUE_ID}`,
    );
    expect(requestedInit?.method).toBe('PATCH');
    expect((requestedInit?.headers as Record<string, string>).Authorization).toBe(`Bearer ${API_TOKEN}`);
    expect(JSON.parse(String(requestedInit?.body))).toEqual({ status: 'resolved' });
  });

  it('leaves the issue unresolved when Cloudflare returns a different status', async () => {
    const fetchSpy = vi.fn(async () =>
      cloudflareResponse({ success: true, errors: [], result: { id: ISSUE_ID, status: 'active' } }),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const response = await POST(authorizedRequest({ issueIds: [ISSUE_ID] }));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.resolved).toBe(false);
    expect(body.results[0]).toMatchObject({ issueId: ISSUE_ID, resolved: false, status: 'active' });
    expect(body.results[0].error).toContain('did not confirm');
  });

  it('leaves the issue unresolved when Cloudflare rejects the update', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        cloudflareResponse(
          { success: false, errors: [{ message: 'Authentication error' }], result: null },
          403,
        ),
      ),
    );

    const response = await POST(authorizedRequest({ issueIds: [ISSUE_ID] }));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.resolved).toBe(false);
    expect(body.results[0].error).toContain('HTTP 403');
    expect(body.results[0].error).toContain('Authentication error');
  });

  it('reports a network failure without leaking the API token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error(`connect ECONNREFUSED with token ${API_TOKEN}`);
      }),
    );

    const response = await POST(authorizedRequest({ issueIds: [ISSUE_ID] }));
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(502);
    expect(body.resolved).toBe(false);
    expect(serialized).not.toContain(API_TOKEN);
    expect(body.results[0].error).toContain('[redacted]');
  });

  it('reports a partial batch as unresolved instead of a success', async () => {
    const fetchSpy = vi.fn(async (url) =>
      String(url).endsWith(SECOND_ISSUE_ID)
        ? cloudflareResponse({ success: true, errors: [], result: { id: SECOND_ISSUE_ID, status: 'active' } })
        : confirmedResolution(ISSUE_ID),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const response = await POST(authorizedRequest({ issueIds: [ISSUE_ID, SECOND_ISSUE_ID] }));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.resolved).toBe(false);
    expect(body.results).toHaveLength(2);
    expect(body.results[0].resolved).toBe(true);
    expect(body.results[1]).toMatchObject({ issueId: SECOND_ISSUE_ID, resolved: false });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('de-duplicates repeated identifiers into a single Cloudflare update', async () => {
    const fetchSpy = vi.fn(async () => confirmedResolution());
    vi.stubGlobal('fetch', fetchSpy);

    const response = await POST(authorizedRequest({ issueIds: [ISSUE_ID, ISSUE_ID.toUpperCase()] }));

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
