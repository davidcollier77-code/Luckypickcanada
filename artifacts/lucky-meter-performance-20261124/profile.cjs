#!/usr/bin/env node
/**
 * Lucky Meter Phase 0 CPU profiler.
 *
 * Records the same load evidence as probe.cjs plus a V8 sampling profile of the
 * page's main thread from navigation to READY, then attributes every long task
 * window to the functions that ran in it.
 *
 * Attribution method: every profile sample carries a timestamp derived from the
 * profile's timeDeltas; samples falling inside [longTask.start,
 * longTask.start + duration] are counted per call frame with their *self* time
 * (the delta to the next sample). Samples are also attributed to the nearest
 * enclosing User Timing mark pair so a window can be named.
 *
 * Usage:
 *   node .../profile.cjs <url> <outputFile> [--desktop] [--wait=8000] [--label=name]
 */
const { chromium } = require('playwright-chromium');
const fs = require('node:fs');
const path = require('node:path');

const positional = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const url = positional[0];
if (!url) {
  console.error('Usage: node profile.cjs <url> <outputFile> [--desktop] [--wait=ms] [--label=name]');
  process.exit(2);
}
const outputFile = path.resolve(
  positional[1] || 'artifacts/lucky-meter-performance-20261124/profile.json'
);
const desktop = process.argv.includes('--desktop');
const waitArg = process.argv.find((arg) => arg.startsWith('--wait='));
const settleMs = waitArg ? Number(waitArg.slice('--wait='.length)) : 8000;
const labelArg = process.argv.find((arg) => arg.startsWith('--label='));
const label = labelArg ? labelArg.slice('--label='.length) : desktop ? 'desktop' : 'mobile';

const INIT = () => {
  const store = { longTasks: [], marks: [], renders: [] };
  window.__phase0 = store;
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        store.longTasks.push({ start: entry.startTime, duration: entry.duration });
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch {}
  const snapshotMarks = () => {
    store.marks = performance.getEntriesByType('mark').map((entry) => ({
      name: entry.name,
      startTime: entry.startTime,
    }));
  };
  document.addEventListener('DOMContentLoaded', snapshotMarks, { once: true });
  window.addEventListener('load', snapshotMarks, { once: true });
  const attach = () => {
    const el = document.querySelector('[data-testid="lucky-meter-ring"]');
    if (!el) return false;
    const record = () => {
      store.renders.push({ t: performance.now(), mode: el.getAttribute('data-meter-renderer') });
      snapshotMarks();
    };
    record();
    new MutationObserver(record).observe(el, {
      attributes: true,
      attributeFilter: ['data-meter-renderer'],
    });
    return true;
  };
  if (!attach()) {
    const observer = new MutationObserver(() => {
      if (attach()) observer.disconnect();
    });
    observer.observe(document.documentElement, { subtree: true, childList: true });
  }
};

(async () => {
  const started = Date.now();
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
  await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
  await cdp.send('Profiler.start');

  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(settleMs);

  const { profile } = await cdp.send('Profiler.stop');
  // V8 profile timestamps are monotonic microseconds; the page's
  // performance.now() has its own epoch per navigation. Anchor one to the
  // other so samples can be attributed to User Timing windows.
  const anchorPageNowMs = await page.evaluate(() => performance.now());
  const metricsResponse = await cdp.send('Performance.getMetrics');
  const anchorMonotonicMs =
    (metricsResponse.metrics.find((metric) => metric.name === 'Timestamp')?.value || 0) * 1000;
  const clockOffsetMs = anchorMonotonicMs - anchorPageNowMs;
  const pageEvidence = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    return {
      longTasks: window.__phase0.longTasks,
      marks: performance
        .getEntriesByType('mark')
        .map((entry) => ({ name: entry.name, startTime: entry.startTime })),
      renders: window.__phase0.renders,
      navigation: nav
        ? {
            ttfb: nav.responseStart,
            load: nav.loadEventEnd,
            domContentLoaded: nav.domContentLoadedEventEnd,
          }
        : null,
      rendererInfo: (() => {
        try {
          const gl = document.createElement('canvas').getContext('webgl2');
          const debug = gl?.getExtension('WEBGL_debug_renderer_info');
          return debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null;
        } catch {
          return null;
        }
      })(),
    };
  });

  // Reconstruct sample timestamps from the profile's timeDeltas.
  const byId = new Map(profile.nodes.map((node) => [node.id, node]));
  const sampleTimes = [];
  let current = profile.startTime;
  for (let index = 0; index < profile.samples.length; index += 1) {
    current += profile.timeDeltas[index] || 0;
    sampleTimes.push({ t: current / 1000 - clockOffsetMs, id: profile.samples[index] });
  }
  const profileStartPageMs = Number((profile.startTime / 1000 - clockOffsetMs).toFixed(1));

  const frameFor = (node) => {
    const frame = node.callFrame || {};
    const url = frame.url || '';
    return {
      functionName: frame.functionName || '(anonymous)',
      url: url.split('/').pop() || url,
      fullUrl: url,
      line: frame.lineNumber,
      column: frame.columnNumber,
    };
  };

  // Self time per frame within one time window, ordered by total time.
  const aggregateWindow = (from, to) => {
    const totals = new Map();
    for (let index = 0; index < sampleTimes.length; index += 1) {
      const sample = sampleTimes[index];
      if (sample.t < from || sample.t >= to) continue;
      const next = sampleTimes[index + 1];
      const duration = next ? Math.min(next.t, to) - sample.t : 0;
      const node = byId.get(sample.id);
      if (!node) continue;
      const frame = frameFor(node);
      const key = `${frame.functionName}@${frame.url}:${frame.line}`;
      const entry = totals.get(key) || { ...frame, selfMs: 0, samples: 0 };
      entry.selfMs += duration;
      entry.samples += 1;
      totals.set(key, entry);
    }
    return Array.from(totals.values())
      .map((entry) => ({ ...entry, selfMs: Number(entry.selfMs.toFixed(1)) }))
      .sort((a, b) => b.selfMs - a.selfMs);
  };

  const marks = pageEvidence.marks.slice().sort((a, b) => a.startTime - b.startTime);
  const windowName = (from) => {
    let name = 'before-first-mark';
    for (const mark of marks) {
      if (mark.startTime <= from) name = mark.name;
      else break;
    }
    return name;
  };

  const longTasks = pageEvidence.longTasks
    .slice()
    .sort((a, b) => b.duration - a.duration)
    .map((task) => ({
      start: Number(task.start.toFixed(1)),
      duration: Number(task.duration.toFixed(1)),
      afterMark: windowName(task.start),
      top: aggregateWindow(task.start, task.start + task.duration).slice(0, 14),
    }));

  const totalWindow = aggregateWindow(0, Math.max(...sampleTimes.map((s) => s.t), 1));
  const report = {
    url,
    label,
    measuredAt: new Date().toISOString(),
    wallClockMs: Date.now() - started,
    settleMs,
    samplingIntervalUs: 100,
    clock: {
      anchorPageNowMs: Number(anchorPageNowMs.toFixed(1)),
      anchorMonotonicMs: Number(anchorMonotonicMs.toFixed(1)),
      clockOffsetMs: Number(clockOffsetMs.toFixed(1)),
      profileStartPageMs,
      profileEndPageMs: Number((profile.endTime / 1000 - clockOffsetMs).toFixed(1)),
    },
    profile: {
      startTime: profile.startTime,
      endTime: profile.endTime,
      sampleCount: profile.samples.length,
      nodeCount: profile.nodes.length,
    },
    renderer: pageEvidence.rendererInfo,
    navigation: pageEvidence.navigation,
    marks: pageEvidence.marks,
    renders: pageEvidence.renders,
    longTasks,
    hottestFunctionsOverall: totalWindow.slice(0, 40),
    rawProfile: profile,
  };

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(report)}\n`);

  console.log(`label=${label} renderer=${report.renderer}`);
  console.log(`profile page window: ${profileStartPageMs} .. ${report.clock.profileEndPageMs} ms`);
  for (const task of longTasks.slice(0, 6)) {
    console.log(`\nLONG TASK ${task.start} +${task.duration} ms (after mark: ${task.afterMark})`);
    for (const frame of task.top.slice(0, 10)) {
      console.log(`  ${String(frame.selfMs).padStart(8)} ms  ${frame.functionName}  ${frame.url}:${frame.line}`);
    }
  }
  console.log(`\nprofile: ${outputFile}`);
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
