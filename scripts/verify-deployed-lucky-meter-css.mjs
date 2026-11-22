#!/usr/bin/env node
/**
 * Verify that the deployed Lucky Meter page serves the approved vessel and
 * results-dock CSS from the deployed commit.
 *
 * The page can be served from Next's prerender cache and the stylesheets are
 * content-addressed, so a deployment can otherwise finish successfully while
 * visitors still receive HTML and a stylesheet set from an older build. This
 * check fetches both a cache-bypassed page and the exact bare URL visitors
 * request, resolves every stylesheet each response links, and fails when an
 * approved rule is missing or the HTML does not identify the deployed commit.
 * Run it after `wrangler deploy`; the retries allow for Cloudflare and OpenNext
 * cache propagation.
 */

import { pathToFileURL } from 'node:url';

const DEFAULT_SITE_URL = 'https://luckypickcanada.ca';
const LUCKY_METER_PATH = '/lucky-meter';
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
const REQUIRED_SELECTORS = [
  'lucky-vessel-scene',
  'lucky-vessel-canvas-host',
  'lucky-results-dock',
];

/**
 * @param {string} html
 * @param {string | URL} pageUrl
 * @returns {string[]}
 */
export function extractStylesheetUrls(html, pageUrl) {
  const urls = new Set();
  const linkPattern = /<link\b[^>]*>/gi;
  for (const [tag] of html.matchAll(linkPattern)) {
    if (!/\brel\s*=\s*["']?[^"'>]*\bstylesheet\b/i.test(tag)) continue;
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    urls.add(new URL(href, pageUrl).toString());
  }
  return [...urls];
}

/**
 * @param {string} css
 * @returns {string[]} The required selectors missing from the CSS.
 */
export function missingLuckyMeterRules(css) {
  return REQUIRED_SELECTORS.filter((selector) => !css.includes(`.${selector}`));
}

/**
 * Fetch text with a bounded request timeout and an explicit cache policy.
 *
 * A stalled request must never hold the deploy job open. `bypassCache` is used
 * only for the freshness probe; the visitor-facing request is sent without
 * cache-busting headers so it reflects what a visitor actually receives.
 *
 * @param {string} url
 * @param {typeof fetch} fetchImpl
 * @param {{ timeoutMs?: number, bypassCache?: boolean }} [options]
 * @returns {Promise<string>}
 */
async function fetchText(
  url,
  fetchImpl,
  { timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS, bypassCache = true } = {},
) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error(`request timed out after ${timeoutMs} ms`)),
    timeoutMs,
  );

  /** @type {Record<string, string>} */
  const headers = { 'user-agent': 'luckypickcanada-deploy-css-check' };
  if (bypassCache) {
    headers['cache-control'] = 'no-cache';
    headers.pragma = 'no-cache';
  }

  try {
    const response = await fetchImpl(url, { headers, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`GET ${url} returned HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Inspect one served page: confirm it identifies the deployed build, resolve
 * every stylesheet it links, and confirm the approved rules are present.
 *
 * @param {{
 *   requestUrl: string,
 *   pageUrl: URL,
 *   expectedBuildId: string,
 *   fetchImpl: typeof fetch,
 *   timeoutMs: number,
 *   bypassCache: boolean,
 * }} options
 * @returns {Promise<string[]>}
 */
async function inspectServedPage({
  requestUrl,
  pageUrl,
  expectedBuildId,
  fetchImpl,
  timeoutMs,
  bypassCache,
}) {
  const html = await fetchText(requestUrl, fetchImpl, { timeoutMs, bypassCache });

  if (expectedBuildId && !html.includes(expectedBuildId)) {
    throw new Error(`the served HTML does not identify the deployed build ${expectedBuildId}`);
  }

  const stylesheetUrls = extractStylesheetUrls(html, pageUrl);
  if (stylesheetUrls.length === 0) {
    throw new Error('the page did not link any stylesheets');
  }

  const css = (
    await Promise.all(
      stylesheetUrls.map((url) =>
        fetchText(url, fetchImpl, { timeoutMs, bypassCache }),
      ),
    )
  ).join('\n');
  const missing = missingLuckyMeterRules(css);

  if (missing.length > 0) {
    throw new Error(
      `missing selectors: ${missing.map((selector) => `.${selector}`).join(', ')}`,
    );
  }

  return stylesheetUrls;
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {{
 *   siteUrl?: string,
 *   attempts?: number,
 *   delayMs?: number,
 *   requestTimeoutMs?: number,
 *   expectedBuildId?: string,
 *   fetchImpl?: typeof fetch,
 *   sleep?: (ms: number) => Promise<void>,
 *   log?: (message: string) => void,
 * }} [options]
 * @returns {Promise<{ stylesheetUrls: string[] }>}
 */
export async function verifyServedLuckyMeterCss({
  siteUrl = DEFAULT_SITE_URL,
  attempts = 6,
  delayMs = 15_000,
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  expectedBuildId = '',
  fetchImpl = fetch,
  sleep = defaultSleep,
  log = console.log,
} = {}) {
  const pageUrl = new URL(LUCKY_METER_PATH, siteUrl);
  let lastFailure = 'no attempt was made';

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const bypassedUrl = new URL(pageUrl);
    bypassedUrl.searchParams.set('__css_check', `${Date.now()}-${attempt}`);

    // The cache-bypassed request proves what the origin now serves. The bare
    // request proves what a visitor receives, including any cached HTML whose
    // stylesheet hashes predate this deployment.
    const variants = [
      {
        label: 'cache-bypassed origin page',
        requestUrl: bypassedUrl.toString(),
        bypassCache: true,
      },
      {
        label: 'visitor-facing page',
        requestUrl: pageUrl.toString(),
        bypassCache: false,
      },
    ];

    const failures = [];
    const stylesheetUrls = new Set();

    for (const variant of variants) {
      try {
        const urls = await inspectServedPage({
          requestUrl: variant.requestUrl,
          pageUrl,
          expectedBuildId,
          fetchImpl,
          timeoutMs: requestTimeoutMs,
          bypassCache: variant.bypassCache,
        });
        for (const url of urls) stylesheetUrls.add(url);
      } catch (error) {
        failures.push(
          `${variant.label}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    if (failures.length === 0) {
      log(
        `Served Lucky Meter CSS contains the vessel and dock rules for the origin and visitor-facing page (${stylesheetUrls.size} stylesheets).`,
      );
      return { stylesheetUrls: [...stylesheetUrls] };
    }

    lastFailure = failures.join('; ');
    log(`Attempt ${attempt}/${attempts} failed: ${lastFailure}`);
    if (attempt < attempts) await sleep(delayMs);
  }

  throw new Error(
    `The deployed Lucky Meter page does not serve the approved vessel and dock rules from the deployed build (${lastFailure}). ` +
      'Redeploy the current main and purge the cached HTML/stylesheet entries before retrying.',
  );
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const attempts = Number.parseInt(process.env.LUCKY_METER_CSS_ATTEMPTS ?? '', 10) || 6;
  const delayMs = Number.parseInt(process.env.LUCKY_METER_CSS_DELAY_MS ?? '', 10) || 15_000;
  const requestTimeoutMs =
    Number.parseInt(process.env.LUCKY_METER_CSS_TIMEOUT_MS ?? '', 10) ||
    DEFAULT_REQUEST_TIMEOUT_MS;
  verifyServedLuckyMeterCss({
    siteUrl: process.env.LUCKY_METER_CSS_URL || DEFAULT_SITE_URL,
    attempts,
    delayMs,
    requestTimeoutMs,
    expectedBuildId: (process.env.LUCKY_METER_EXPECTED_BUILD_ID || '').trim(),
  })
    .then(() => {
      process.exitCode = 0;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
