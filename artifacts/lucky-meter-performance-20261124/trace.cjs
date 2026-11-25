#!/usr/bin/env node
/**
 * Lucky Meter Phase 0 timeline tracer.
 *
 * Records a Chrome trace (devtools.timeline + gpu/cc/viz) for one cold load,
 * then aggregates the trace events that fall inside named windows:
 *   - the largest long task
 *   - the renderer swap window (meter-on-ready -> meter-commit:three)
 *   - the audio preparation window (lucky-audio-prepare-start -> last load mark)
 *
 * Only the derived summary is written; the raw trace stays in memory, so no
 * multi-megabyte trace file enters the workspace.
 *
 * Usage:
 *   node .../trace.cjs <url> <outputFile> [--desktop] [--wait=8000] [--label=name]
 */
const { chromium } = require('playwright-chromium');
const fs = require('node:fs');
const path = require('node:path');

const positional = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const url = positional[0];
if (!url) {
  console.error('Usage: node trace.cjs <url> <outputFile> [--desktop] [--wait=ms] [--label=name]');
  process.exit(2);
}
const outputFile = path.resolve(
  positional[1] || 'artifacts/lucky-meter-performance-20261124/trace.json'
);
const desktop = process.argv.includes('--desktop');
const waitArg = process.argv.find((arg) => arg.startsWith('--wait='));
const settleMs = waitArg ? Number(waitArg.slice('--wait='.length)) : 8000;
const labelArg = process.argv.find((arg) => arg.startsWith('--label='));
const label = labelArg ? labelArg.slice('--label='.length) : desktop ? 'desktop' : 'mobile';

const INIT = () => {
  const store = { longTasks: [], marks: [] };
  window.__phase0 = store;
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        store.longTasks.push({ start: entry.startTime, duration: entry.duration });
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch {}
  const snapshot = () => {
    store.marks = performance.getEntriesByType('mark').map((entry) => ({
      name: entry.name,
      startTime: entry.startTime,
    }));
  };
  document.addEventListener('DOMContentLoaded', snapshot, { once: true });
  window.addEventListener('load', snapshot, { once: true });
  const observer = new MutationObserver(snapshot);
  observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true });
};

(async () => {
  const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
  const context = await browser.newContext(
    desktop
      ? { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
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
  await page.addInitScript(INIT);

  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  await cdp.send('Profiler.enable');

  const complete = new Promise((resolve, reject) => {
    cdp.once('Tracing.tracingComplete', resolve);
    cdp.once('Tracing.dataCollected', () => {});
    setTimeout(() => reject(new Error('tracing did not complete')), 180000);
  });

  await cdp.send('Tracing.start', {
    transferMode: 'ReturnAsStream',
    traceConfig: {
      includedCategories: [
        'devtools.timeline',
        'toplevel',
        'blink.user_timing',
        'v8.execute',
        'gpu',
        'cc',
        'viz',
        'disabled-by-default-devtools.timeline',
      ],
    },
  });

  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(settleMs);

  await cdp.send('Tracing.end');
  const { stream } = await complete;

  let raw = '';
  for (;;) {
    const chunk = await cdp.send('IO.read', { handle: stream });
    raw += chunk.base64Encoded ? Buffer.from(chunk.data, 'base64').toString('utf8') : chunk.data;
    if (chunk.eof) break;
  }
  await cdp.send('IO.close', { handle: stream }).catch(() => {});

  const anchorPageNowMs = await page.evaluate(() => performance.now());
  const metrics = await cdp.send('Performance.getMetrics');
  const anchorMonotonicMs =
    (metrics.metrics.find((metric) => metric.name === 'Timestamp')?.value || 0) * 1000;
  const clockOffsetMs = anchorMonotonicMs - anchorPageNowMs;
  const evidence = await page.evaluate(() => ({
    longTasks: window.__phase0.longTasks,
    marks: performance.getEntriesByType('mark').map((entry) => ({
      name: entry.name,
      startTime: entry.startTime,
    })),
    navigation: (() => {
      const nav = performance.getEntriesByType('navigation')[0];
      return nav ? { ttfb: nav.responseStart, load: nav.loadEventEnd } : null;
    })(),
  }));

  const trace = JSON.parse(raw.slice(raw.indexOf('{')));
  const events = (trace.traceEvents || trace).filter(
    (event) => event.ph === 'X' && typeof event.dur === 'number'
  );
  const toPageMs = (timestamp) => timestamp / 1000 - clockOffsetMs;

  const nameOf = (event) => event.name || event.cat || 'unknown';
  const aggregate = (from, to) => {
    const list = events.filter((event) => {
      const start = toPageMs(event.ts);
      return start + event.dur / 1000 > from && start < to;
    });
    const byName = new Map();
    for (const event of list) {
      const start = toPageMs(event.ts);
      const overlap = Math.min(to, start + event.dur / 1000) - Math.max(from, start);
      if (overlap <= 0) continue;
      const key = nameOf(event);
      const entry = byName.get(key) || { name: key, category: event.cat, count: 0, ms: 0 };
      entry.count += 1;
      entry.ms += overlap;
      byName.set(key, entry);
    }
    return {
      window: { from: Number(from.toFixed(1)), to: Number(to.toFixed(1)), ms: Number((to - from).toFixed(1)) },
      eventsInWindow: list.length,
      topByName: Array.from(byName.values())
        .map((entry) => ({ ...entry, ms: Number(entry.ms.toFixed(1)) }))
        .sort((a, b) => b.ms - a.ms)
        .slice(0, 25),
    };
  };

  const marks = evidence.marks.slice().sort((a, b) => a.startTime - b.startTime);
  const markAt = (name) => marks.find((mark) => mark.name === name)?.startTime ?? null;
  const longest = evidence.longTasks.slice().sort((a, b) => b.duration - a.duration)[0];
  const windows = [];
  if (longest) windows.push({ name: 'largest-long-task', ...aggregate(longest.start, longest.start + longest.duration) });
  if (markAt('meter-on-ready') !== null && markAt('meter-commit:three') !== null) {
    windows.push({
      name: 'renderer-swap',
      ...aggregate(markAt('meter-on-ready'), markAt('meter-commit:three')),
    });
  }
  const audioStart = markAt('lucky-audio-prepare-start');
  const audioLoads = marks.filter((mark) => mark.name.startsWith('lucky-audio-load:'));
  if (audioStart !== null && audioLoads.length) {
    const audioEnd = Math.max(...audioLoads.map((mark) => mark.startTime));
    windows.push({ name: 'audio-prepare', ...aggregate(audioStart, audioEnd) });
  }

  const summary = {
    url,
    label,
    measuredAt: new Date().toISOString(),
    traceEventCount: events.length,
    clockOffsetMs: Number(clockOffsetMs.toFixed(1)),
    longTasks: evidence.longTasks,
    marks,
    navigation: evidence.navigation,
    windows,
  };
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(summary, null, 2)}\n`);

  for (const window of windows) {
    console.log(`\nWINDOW ${window.name} ${window.window.from}..${window.window.to} (${window.window.ms} ms, ${window.eventsInWindow} events)`);
    for (const entry of window.topByName.slice(0, 14)) {
      console.log(`  ${String(entry.ms).padStart(9)} ms  x${String(entry.count).padStart(4)}  ${entry.name}  [${entry.category}]`);
    }
  }
  console.log(`\ntrace summary: ${outputFile} (${(raw.length / 1048576).toFixed(1)} MiB raw, not saved)`);
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
