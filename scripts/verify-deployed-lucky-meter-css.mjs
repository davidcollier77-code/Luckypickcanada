#!/usr/bin/env node
/**
 * Verify that the deployed Lucky Meter page serves the approved vessel and
 * results-dock CSS.
 *
 * The page can be served from Next's prerender cache and the stylesheets are
 * content-addressed, so a deployment can otherwise finish successfully while
 * visitors still receive a stylesheet set from an older build. This check
 * fetches the live page and every stylesheet it links, then fails when a rule
 * from the approved Build is missing. Run it after `wrangler deploy`; the
 * retries allow for Cloudflare and OpenNext cache propagation.
 */

import { pathToFileURL } from 'node:url';

const DEFAULT_SITE_URL = 'https://luckypickcanada.ca';
const LUCKY_METER_PATH = '/lucky-meter';
const REQUIRED_SELECTORS = [
  'lucky-vessel-scene',
  'lucky-vessel-canvas-host',
  'lucky-results-dock',
];

/**
 * @param {string} html
 * @param {string} pageUrl
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

async function fetchText(url, fetchImpl) {
  const response = await fetchImpl(url, {
    headers: {
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'user-agent': 'luckypickcanada-deploy-css-check',
    },
  });
  if (!response.ok) {
    throw new Error(`GET ${url} returned HTTP ${response.status}`);
  }
  return response.text();
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {{
 *   siteUrl?: string,
 *   attempts?: number,
 *   delayMs?: number,
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
  fetchImpl = fetch,
  sleep = defaultSleep,
  log = console.log,
} = {}) {
  const pageUrl = new URL(LUCKY_METER_PATH, siteUrl);
  let lastFailure = 'no attempt was made';

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const requestUrl = new URL(pageUrl);
    requestUrl.searchParams.set('__css_check', `${Date.now()}-${attempt}`);

    try {
      const html = await fetchText(requestUrl.toString(), fetchImpl);
      const stylesheetUrls = extractStylesheetUrls(html, pageUrl);

      if (stylesheetUrls.length === 0) {
        lastFailure = 'the page did not link any stylesheets';
      } else {
        const css = (
          await Promise.all(stylesheetUrls.map((url) => fetchText(url, fetchImpl)))
        ).join('\n');
        const missing = missingLuckyMeterRules(css);

        if (missing.length === 0) {
          log(
            `Served Lucky Meter CSS contains the vessel and dock rules (${stylesheetUrls.length} stylesheets).`,
          );
          return { stylesheetUrls };
        }

        lastFailure = `missing selectors: ${missing.map((selector) => `.${selector}`).join(', ')}`;
      }
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error);
    }

    log(`Attempt ${attempt}/${attempts} failed: ${lastFailure}`);
    if (attempt < attempts) await sleep(delayMs);
  }

  throw new Error(
    `The deployed Lucky Meter stylesheets do not contain the approved vessel and dock rules (${lastFailure}). ` +
      'Redeploy the current main and purge the HTML/stylesheet cache before retrying.',
  );
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const attempts = Number.parseInt(process.env.LUCKY_METER_CSS_ATTEMPTS ?? '', 10) || 6;
  const delayMs = Number.parseInt(process.env.LUCKY_METER_CSS_DELAY_MS ?? '', 10) || 15_000;
  verifyServedLuckyMeterCss({
    siteUrl: process.env.LUCKY_METER_CSS_URL || DEFAULT_SITE_URL,
    attempts,
    delayMs,
  })
    .then(() => {
      process.exitCode = 0;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
