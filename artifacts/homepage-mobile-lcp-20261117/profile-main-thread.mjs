// Measures where the homepage's first-load main-thread time goes on a
// production build, under the PSI mobile profile, without touching the app.
//
// It records a V8 CPU profile for the whole first load, then aggregates
// self-time per (function, url) pair so the hottest scripts are identifiable.
//
// Usage: node artifacts/homepage-mobile-lcp-20261117/profile-main-thread.mjs [url] [label]

import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:3100/';
const label = process.argv[3] || 'profile';

const browser = await chromium.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2.75,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36',
});

const page = await context.newPage();
const cdp = await context.newCDPSession(page);

const longTasks = [];
await page.addInitScript(() => {
  window.__lpcLongTasks = [];
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__lpcLongTasks.push({ start: entry.startTime, duration: entry.duration });
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch {
    /* longtask not supported */
  }
});

await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
await cdp.send('Profiler.start');

const navigation = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(6000);

const { profile } = await cdp.send('Profiler.stop');

const lcp = await page.evaluate(() => {
  const entries = performance.getEntriesByType('largest-contentful-paint');
  const last = entries[entries.length - 1];
  const nav = performance.getEntriesByType('navigation')[0];
  return {
    lcp: last ? Math.round(last.startTime) : null,
    lcpElement: last?.element ? last.element.tagName + ' ' + (last.element.currentSrc || last.element.className || '') : null,
    fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0),
    domContentLoaded: Math.round(nav?.domContentLoadedEventEnd || 0),
    loadEventEnd: Math.round(nav?.loadEventEnd || 0),
    longTasks: window.__lpcLongTasks || [],
    transferKb: Math.round(
      performance
        .getEntriesByType('resource')
        .reduce((sum, entry) => sum + (entry.transferSize || 0), 0) / 1024,
    ),
  };
});

// Aggregate self-time per function and script.
const byId = new Map(profile.nodes.map((node) => [node.id, node]));
const selfTime = new Map();
const total = profile.samples.length;
for (const sample of profile.samples) {
  const node = byId.get(sample);
  if (!node) continue;
  const frame = node.callFrame;
  const key = `${frame.functionName || '(anonymous)'} @ ${(frame.url || '').replace(/^https?:\/\/[^/]+/, '').slice(0, 90)}`;
  selfTime.set(key, (selfTime.get(key) || 0) + 1);
}

const durationMs = (profile.endTime - profile.startTime) / 1000;
const top = [...selfTime.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 25)
  .map(([key, samples]) => ({
    key,
    ms: Math.round((samples / total) * durationMs),
    pct: Math.round((samples / total) * 1000) / 10,
  }));

const result = { label, url, status: navigation?.status(), metrics: lcp, profileDurationMs: Math.round(durationMs), top };
console.log(JSON.stringify(result, null, 2));
writeFileSync(`/tmp/${label}.json`, JSON.stringify(result, null, 2));

await browser.close();
