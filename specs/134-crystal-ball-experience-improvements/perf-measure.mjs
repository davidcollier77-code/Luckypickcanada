import { chromium } from 'playwright';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const BASE = process.env.PERF_BASE_URL || 'http://127.0.0.1:3007';
const LABEL = process.argv[2] || 'run';
const OUT = process.argv[3] || `specs/134-crystal-ball-experience-improvements/perf-${LABEL}.json`;

const PROFILES = [
  { name: 'desktop-1440', viewport: { width: 1440, height: 900 }, mobile: false },
  { name: 'mobile-390', viewport: { width: 390, height: 844 }, mobile: true },
];

// Minimal Linux images can have no fontconfig file, which makes Chromium abort
// as soon as the page asks for a font. Point it at Next's bundled Geist font,
// matching the Playwright test harness.
function ensureFonts() {
  if (process.env.FONTCONFIG_FILE && existsSync(process.env.FONTCONFIG_FILE)) return;
  const font = join(process.cwd(), 'node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf');
  if (existsSync('/etc/fonts/fonts.conf') || !existsSync(font)) return;
  const directory = mkdtempSync(join(tmpdir(), 'lpc-perf-fonts-'));
  const cache = join(directory, 'cache');
  mkdirSync(cache);
  const config = join(directory, 'fonts.conf');
  writeFileSync(
    config,
    ['<?xml version="1.0"?>', '<fontconfig>', `  <dir>${dirname(font)}</dir>`, `  <cachedir>${cache}</cachedir>`, '</fontconfig>', ''].join('\n'),
  );
  process.env.FONTCONFIG_FILE = config;
}

ensureFonts();

const THROTTLE = process.env.PERF_THROTTLE !== '0';
const browser = await chromium.launch({
  executablePath: process.env.PERF_EXECUTABLE_PATH || undefined,
  args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
});

async function measure(profile) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    isMobile: profile.mobile,
    hasTouch: profile.mobile,
    deviceScaleFactor: 1,
    locale: 'en-CA',
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.__perfProbe = { lcp: 0, cls: 0 };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__perfProbe.lcp = Math.max(window.__perfProbe.lcp, entry.startTime);
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__perfProbe.cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  page.on('crash', () => console.error(`[${profile.name}] page crashed`));
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (THROTTLE) {
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: Math.round((1_600_000 / 8)),
      uploadThroughput: Math.round((750_000 / 8)),
    });
  }

  const startedAt = Date.now();
  await page.goto(`${BASE}/crystal-ball`, { waitUntil: 'load', timeout: 180_000 });
  const wallClockToLoadMs = Date.now() - startedAt;
  await page.waitForSelector('img[alt^="Canadian crystal ball"]', { timeout: 60_000 });
  await page.waitForTimeout(2_500);

  const data = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const transferByExtension = {};
    let transferBytes = 0;
    for (const entry of resources) {
      const bytes = entry.transferSize || 0;
      transferBytes += bytes;
      const match = entry.name.split('?')[0].match(/\.([a-z0-9]+)$/i);
      const extension = match ? match[1].toLowerCase() : 'other';
      transferByExtension[extension] = (transferByExtension[extension] || 0) + bytes;
    }
    return {
      lcpMs: Math.round(window.__perfProbe.lcp),
      cls: Number(window.__perfProbe.cls.toFixed(4)),
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
      loadEventMs: Math.round(nav.loadEventEnd),
      resourceCount: resources.length,
      transferBytes,
      transferByExtension,
      domNodes: document.getElementsByTagName('*').length,
      audioResources: resources
        .filter((entry) => /\/sounds\//.test(entry.name))
        .map((entry) => ({ name: entry.name, bytes: entry.transferSize || 0 })),
    };
  });

  await context.close();
  return { profile: profile.name, viewport: profile.viewport, wallClockToLoadMs, ...data };
}

const results = {
  label: LABEL,
  base: BASE,
  throttled: THROTTLE,
  measuredAt: new Date().toISOString(),
  profiles: [],
};

for (const profile of PROFILES) {
  try {
    results.profiles.push(await measure(profile));
  } catch (error) {
    results.profiles.push({
      profile: profile.name,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

await browser.close();
writeFileSync(OUT, JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
