import { describe, expect, it, vi } from 'vitest';
import {
  extractStylesheetUrls,
  missingLuckyMeterRules,
  verifyServedLuckyMeterCss,
} from '../scripts/verify-deployed-lucky-meter-css.mjs';

// A build ID is opaque. Keep the fixture non-secret-looking so secret scanners
// do not treat a 40-character hexadecimal commit-shaped string as a token.
const BUILD_ID = 'review-build-20261122';

// The approved rules are deliberately split across the two linked stylesheets
// so the passing assertion can only succeed when the union is inspected.
const CSS_VESSEL = [
  '.lucky-vessel-scene{height:clamp(10.5rem,24vh,13.5rem)}',
  '.lucky-vessel-canvas-host{position:absolute;inset:0}',
].join('');
const CSS_DOCK = '.lucky-results-dock{display:flex}';
const APPROVED_CSS = `${CSS_VESSEL}${CSS_DOCK}`;

const BUILD_SCRIPT = `<script>self.__next_f.push([1,'{"b":"${BUILD_ID}"}'])</script>`;

const PAGE_HTML = [
  '<link rel="stylesheet" href="/_next/static/css/shared.css">',
  "<link rel='stylesheet' href='https://luckypickcanada.ca/_next/static/css/lucky.css'>",
  '<link rel="preload" href="/_next/static/media/font.woff2" as="font">',
  BUILD_SCRIPT,
].join('');

function ok(text) {
  return { ok: true, status: 200, text: async () => text };
}

const SITE_URL = 'https://luckypickcanada.ca';

describe('deployed Lucky Meter CSS check', () => {
  it('resolves every linked stylesheet against the page URL', () => {
    expect(extractStylesheetUrls(PAGE_HTML, `${SITE_URL}/lucky-meter`)).toEqual([
      `${SITE_URL}/_next/static/css/shared.css`,
      `${SITE_URL}/_next/static/css/lucky.css`,
    ]);
  });

  it('names each approved rule that is missing from the served CSS', () => {
    expect(missingLuckyMeterRules(APPROVED_CSS)).toEqual([]);
    expect(missingLuckyMeterRules('.lucky-results-dock{display:flex}')).toEqual([
      'lucky-vessel-scene',
      'lucky-vessel-canvas-host',
    ]);
  });

  it('passes only when both the origin and visitor-facing pages serve the union of the rules from the deployed build', async () => {
    const fetchImpl = vi.fn(async (url) =>
      url.includes('/lucky-meter')
        ? ok(PAGE_HTML)
        : ok(url.endsWith('shared.css') ? CSS_VESSEL : CSS_DOCK),
    );
    const sleep = vi.fn(async () => {});

    const result = await verifyServedLuckyMeterCss({
      siteUrl: SITE_URL,
      attempts: 3,
      expectedBuildId: BUILD_ID,
      fetchImpl,
      sleep,
      log: () => {},
    });

    expect(result.stylesheetUrls).toEqual([
      `${SITE_URL}/_next/static/css/shared.css`,
      `${SITE_URL}/_next/static/css/lucky.css`,
    ]);
    expect(sleep).not.toHaveBeenCalled();
    // One cache-bypassed page, its two stylesheets, the bare visitor page and
    // its two stylesheets. A check that skipped either page or either
    // stylesheet could not satisfy the union assertion above.
    expect(fetchImpl).toHaveBeenCalledTimes(6);
    expect(fetchImpl.mock.calls[0][0]).toContain('__css_check=');
    expect(fetchImpl.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    expect(fetchImpl.mock.calls[0][1].headers['cache-control']).toBe('no-cache');
    expect(fetchImpl.mock.calls[3][0]).toBe(`${SITE_URL}/lucky-meter`);
    expect(fetchImpl.mock.calls[3][1].headers['cache-control']).toBeUndefined();
  });

  it('fails with the missing selectors when the old stylesheet is still served', async () => {
    const fetchImpl = vi.fn(async (url) =>
      ok(url.includes('/lucky-meter') ? PAGE_HTML : '.lucky-tier-message{opacity:1}'),
    );
    const sleep = vi.fn(async () => {});

    await expect(
      verifyServedLuckyMeterCss({
        siteUrl: 'https://example.test',
        attempts: 2,
        delayMs: 25,
        fetchImpl,
        sleep,
        log: () => {},
      }),
    ).rejects.toThrow(/lucky-vessel-scene, \.lucky-vessel-canvas-host, \.lucky-results-dock/);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(25);
  });

  it('fails when the visitor-facing page is cached with stale stylesheet hashes', async () => {
    const currentHtml = `<link rel="stylesheet" href="/_next/static/css/current.css">${BUILD_SCRIPT}`;
    const cachedHtml = `<link rel="stylesheet" href="/_next/static/css/legacy.css">${BUILD_SCRIPT}`;
    const fetchImpl = vi.fn(async (url) => {
      if (url.includes('__css_check')) return ok(currentHtml);
      if (url.endsWith('/lucky-meter')) return ok(cachedHtml);
      return ok(url.endsWith('current.css') ? APPROVED_CSS : '.lucky-colour-vessel{opacity:0}');
    });
    const sleep = vi.fn(async () => {});

    await expect(
      verifyServedLuckyMeterCss({
        siteUrl: 'https://example.test',
        attempts: 2,
        delayMs: 0,
        expectedBuildId: BUILD_ID,
        fetchImpl,
        sleep,
        log: () => {},
      }),
    ).rejects.toThrow(/visitor-facing page: missing selectors: \.lucky-vessel-scene/);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('fails when the visitor-facing page is cached from an earlier build', async () => {
    const currentHtml = `<link rel="stylesheet" href="/_next/static/css/current.css">${BUILD_SCRIPT}`;
    const cachedHtml = [
      '<link rel="stylesheet" href="/_next/static/css/legacy.css">',
      '<script>self.__next_f.push([1,\'{"b":"earlier-build-20261121"}\'])</script>',
    ].join('');
    const fetchImpl = vi.fn(async (url) => {
      if (url.includes('__css_check')) return ok(currentHtml);
      if (url.endsWith('/lucky-meter')) return ok(cachedHtml);
      return ok(APPROVED_CSS);
    });

    await expect(
      verifyServedLuckyMeterCss({
        siteUrl: 'https://example.test',
        attempts: 2,
        delayMs: 0,
        expectedBuildId: BUILD_ID,
        fetchImpl,
        sleep: async () => {},
        log: () => {},
      }),
    ).rejects.toThrow(
      new RegExp(
        `visitor-facing page: the served HTML does not identify the deployed build ${BUILD_ID}`,
      ),
    );
  });

  it('fetches visitor-facing stylesheets without cache-busting headers', async () => {
    const fetchImpl = vi.fn(async (url) => {
      if (url.includes('__css_check')) {
        return ok('<link rel="stylesheet" href="/_next/static/css/origin.css">');
      }
      if (url.endsWith('/lucky-meter')) {
        return ok('<link rel="stylesheet" href="/_next/static/css/visitor.css">');
      }
      return ok(APPROVED_CSS);
    });

    await verifyServedLuckyMeterCss({
      siteUrl: 'https://example.test',
      attempts: 1,
      fetchImpl,
      sleep: async () => {},
      log: () => {},
    });

    const stylesheetCalls = fetchImpl.mock.calls.filter(([url]) =>
      url.endsWith('.css'),
    );
    expect(stylesheetCalls).toHaveLength(2);
    expect(stylesheetCalls[0][0]).toContain('origin.css');
    expect(stylesheetCalls[0][1].headers['cache-control']).toBe('no-cache');
    expect(stylesheetCalls[1][0]).toContain('visitor.css');
    expect(stylesheetCalls[1][1].headers['cache-control']).toBeUndefined();
  });

  it('fails when the served HTML does not identify the deployed build', async () => {
    const fetchImpl = vi.fn(async (url) =>
      ok(url.includes('/lucky-meter') ? '<link rel="stylesheet" href="/current.css">' : APPROVED_CSS),
    );

    await expect(
      verifyServedLuckyMeterCss({
        attempts: 1,
        expectedBuildId: BUILD_ID,
        fetchImpl,
        sleep: async () => {},
        log: () => {},
      }),
    ).rejects.toThrow(new RegExp(`does not identify the deployed build ${BUILD_ID}`));
  });

  it('bounds every request with a timeout so a stalled origin cannot hold the deploy', async () => {
    const fetchImpl = vi.fn(
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          const onAbort = () => {
            signal.removeEventListener('abort', onAbort);
            reject(signal.reason);
          };
          signal.addEventListener('abort', onAbort);
        }),
    );

    await expect(
      verifyServedLuckyMeterCss({
        attempts: 1,
        requestTimeoutMs: 5,
        fetchImpl,
        sleep: async () => {},
        log: () => {},
      }),
    ).rejects.toThrow(/request timed out after 5 ms/);
  });
});
