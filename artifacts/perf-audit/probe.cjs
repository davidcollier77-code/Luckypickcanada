#!/usr/bin/env node
/**
 * Homepage performance probe.
 *
 * Loads the given URL in Chromium at a cold, mobile-emulated profile, records
 * Core Web Vitals style metrics (FCP, LCP, CLS, long-task blocking time), and
 * lists every network response with its transfer size so the heaviest requests
 * can be identified. Writes a JSON report and prints a short summary.
 *
 * Usage: node artifacts/perf-audit/probe.cjs <url> [outputFile] [--desktop]
 */
const { chromium } = require('playwright-chromium');
const fs = require('node:fs');
const path = require('node:path');

const url = process.argv[2];
if (!url) {
  console.error('Usage: node artifacts/perf-audit/probe.cjs <url> [outputFile] [--desktop]');
  process.exit(2);
}
const desktop = process.argv.includes('--desktop');
const outIndex = process.argv.slice(3).findIndex((arg) => !arg.startsWith('--'));
const outputFile =
  outIndex >= 0
    ? path.resolve(process.argv.slice(3)[outIndex])
    : path.resolve('artifacts/perf-audit/report.json');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext(
    desktop
      ? { viewport: { width: 1440, height: 900 } }
      : {
          viewport: { width: 390, height: 844 },
          deviceScaleFactor: 3,
          isMobile: true,
          hasTouch: true,
          userAgent:
            'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
        }
  );
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.__perf = { lcp: 0, lcpElement: null, cls: 0, longTasks: [], fcp: 0 };

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') window.__perf.fcp = entry.startTime;
        if (entry.entryType === 'largest-contentful-paint') {
          window.__perf.lcp = entry.startTime;
          const el = entry.element;
          if (el) {
            window.__perf.lcpElement = {
              tag: el.tagName,
              id: el.id || null,
              className: typeof el.className === 'string' ? el.className.slice(0, 160) : null,
              src: el.currentSrc || el.src || null,
              size: entry.size,
            };
          }
        }
        if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
          window.__perf.cls += entry.value;
        }
        if (entry.entryType === 'longtask') {
          window.__perf.longTasks.push({ start: entry.startTime, duration: entry.duration });
        }
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') window.__perf.fcp = entry.startTime;
      }
    }).observe({ type: 'paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
          window.__perf.cls += entry.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__perf.longTasks.push({ start: entry.startTime, duration: entry.duration });
      }
    }).observe({ type: 'longtask', buffered: true });
  });

  const responses = [];
  page.on('response', async (response) => {
    const request = response.request();
    const type = request.resourceType();
    let size = 0;
    try {
      const headers = await response.allHeaders();
      size = Number(headers['content-length'] || 0);
    } catch {
      size = 0;
    }
    if (!size) {
      try {
        size = (await response.body()).length;
      } catch {
        size = 0;
      }
    }
    responses.push({ url: response.url(), status: response.status(), type, size });
  });

  const started = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  // Let late layout shifts, lazy images and long tasks land.
  await page.waitForTimeout(7000);
  const nav = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0];
    const paints = Object.fromEntries(
      performance.getEntriesByType('paint').map((p) => [p.name, p.startTime])
    );
    return {
      ttfb: n ? n.responseStart : null,
      domContentLoaded: n ? n.domContentLoadedEventEnd : null,
      load: n ? n.loadEventEnd : null,
      paints,
    };
  });
  const perf = await page.evaluate(() => window.__perf);

  const longTasks = perf.longTasks || [];
  const blockingTime = longTasks.reduce(
    (sum, task) => sum + Math.max(0, task.duration - 50),
    0
  );
  const totalTransfer = responses.reduce((sum, r) => sum + r.size, 0);
  const byType = {};
  for (const r of responses) {
    byType[r.type] = byType[r.type] || { count: 0, bytes: 0 };
    byType[r.type].count += 1;
    byType[r.type].bytes += r.size;
  }

  const report = {
    url,
    profile: desktop ? 'desktop-1440x900' : 'mobile-390x844-dpr3',
    measuredAt: new Date().toISOString(),
    wallClockMs: Date.now() - started,
    metrics: {
      fcpMs: Math.round(perf.fcp || nav.paints['first-contentful-paint'] || 0),
      lcpMs: Math.round(perf.lcp),
      lcpElement: perf.lcpElement,
      cls: Number((perf.cls || 0).toFixed(4)),
      ttfbMs: Math.round(nav.ttfb || 0),
      domContentLoadedMs: Math.round(nav.domContentLoaded || 0),
      loadMs: Math.round(nav.load || 0),
      longTaskCount: longTasks.length,
      totalBlockingTimeMs: Math.round(blockingTime),
    },
    network: {
      requestCount: responses.length,
      totalTransferBytes: totalTransfer,
      byType,
      heaviest: responses
        .slice()
        .sort((a, b) => b.size - a.size)
        .slice(0, 25)
        .map((r) => ({ size: r.size, type: r.type, url: r.url })),
    },
  };

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`);

  console.log(JSON.stringify(report.metrics, null, 2));
  console.log(
    `requests=${report.network.requestCount} transfer=${(totalTransfer / 1024).toFixed(1)} KiB`
  );
  console.log('heaviest:');
  for (const r of report.network.heaviest.slice(0, 12)) {
    console.log(`  ${(r.size / 1024).toFixed(1).padStart(8)} KiB  ${r.type.padEnd(10)} ${r.url}`);
  }
  console.log(`report: ${outputFile}`);

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
