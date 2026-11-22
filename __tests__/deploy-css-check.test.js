import { describe, expect, it, vi } from 'vitest';
import {
  extractStylesheetUrls,
  missingLuckyMeterRules,
  verifyServedLuckyMeterCss,
} from '../scripts/verify-deployed-lucky-meter-css.mjs';

const APPROVED_CSS = [
  '.lucky-vessel-scene{height:clamp(10.5rem,24vh,13.5rem)}',
  '.lucky-vessel-canvas-host{position:absolute;inset:0}',
  '.lucky-results-dock{display:flex}',
].join('');

const PAGE_HTML = [
  '<link rel="stylesheet" href="/_next/static/css/shared.css">',
  "<link rel='stylesheet' href='https://luckypickcanada.ca/_next/static/css/lucky.css'>",
  '<link rel="preload" href="/_next/static/media/font.woff2" as="font">',
].join('');

describe('deployed Lucky Meter CSS check', () => {
  it('resolves every linked stylesheet against the page URL', () => {
    expect(
      extractStylesheetUrls(PAGE_HTML, 'https://luckypickcanada.ca/lucky-meter'),
    ).toEqual([
      'https://luckypickcanada.ca/_next/static/css/shared.css',
      'https://luckypickcanada.ca/_next/static/css/lucky.css',
    ]);
  });

  it('names each approved rule that is missing from the served CSS', () => {
    expect(missingLuckyMeterRules(APPROVED_CSS)).toEqual([]);
    expect(missingLuckyMeterRules('.lucky-results-dock{display:flex}')).toEqual([
      'lucky-vessel-scene',
      'lucky-vessel-canvas-host',
    ]);
  });

  it('passes when every linked stylesheet carries the approved rules', async () => {
    const fetchImpl = vi.fn(async (url) => {
      if (url.includes('/lucky-meter')) {
        return { ok: true, status: 200, text: async () => PAGE_HTML };
      }
      return {
        ok: true,
        status: 200,
        text: async () =>
          url.endsWith('shared.css') ? APPROVED_CSS : '.unrelated{color:red}',
      };
    });
    const sleep = vi.fn(async () => {});

    const result = await verifyServedLuckyMeterCss({
      siteUrl: 'https://luckypickcanada.ca',
      attempts: 3,
      fetchImpl,
      sleep,
      log: () => {},
    });

    expect(result.stylesheetUrls).toHaveLength(2);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('fails with the missing selectors when the old stylesheet is still served', async () => {
    const fetchImpl = vi.fn(async (url) => ({
      ok: true,
      status: 200,
      text: async () =>
        url.includes('/lucky-meter') ? PAGE_HTML : '.lucky-tier-message{opacity:1}',
    }));

    await expect(
      verifyServedLuckyMeterCss({
        attempts: 2,
        delayMs: 0,
        fetchImpl,
        sleep: async () => {},
        log: () => {},
      }),
    ).rejects.toThrow(/lucky-vessel-scene, \.lucky-vessel-canvas-host, \.lucky-results-dock/);
  });
});
