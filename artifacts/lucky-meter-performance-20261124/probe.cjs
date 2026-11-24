#!/usr/bin/env node
/**
 * Lucky Meter Phase 0 probe.
 *
 * Loads a URL in a cold Chromium context and records the evidence needed to
 * attribute the Lucky Meter's first-render and audio long tasks:
 *   - Core Web Vitals style metrics (FCP, LCP, CLS, long tasks, blocking time)
 *   - Long Animation Frame entries with their script attribution
 *   - User Timing marks the application and the temporary Phase 0
 *     instrumentation emit, plus their deltas
 *   - Every network response with transfer/encoded size and responseEnd
 *   - The renderer timeline (data-meter-renderer / canvas count over time)
 *
 * The script never drives the page (no Start press): it measures the load and
 * READY experience exactly as a visitor meets it.
 *
 * Usage:
 *   node artifacts/lucky-meter-performance-20261124/probe.cjs \
 *     <url> <outputFile> [--desktop] [--wait=8000] [--label=name]
 *
 * Evidence written here is measured on a host with no hardware GPU, so the
 * WebGL renderer string is recorded with every run and must be reported.
 */
const { chromium } = require('playwright-chromium');
const fs = require('node:fs');
const path = require('node:path');

const positional = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const url = positional[0];
if (!url) {
  console.error('Usage: node probe.cjs <url> <outputFile> [--desktop] [--wait=ms] [--label=name]');
  process.exit(2);
}
const outputFile = path.resolve(
  positional[1] || 'artifacts/lucky-meter-performance-20261124/run.json'
);
const desktop = process.argv.includes('--desktop');
const waitArg = process.argv.find((arg) => arg.startsWith('--wait='));
const settleMs = waitArg ? Number(waitArg.slice('--wait='.length)) : 8000;
const labelArg = process.argv.find((arg) => arg.startsWith('--label='));
const label = labelArg ? labelArg.slice('--label='.length) : desktop ? 'desktop' : 'mobile';

const AUDIO_RE = /\.(mp3|wav|ogg|m4a)(\?|$)|^\/?(sounds|freesound_community|dragon-studio)/i;

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
  const consoleMessages = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') {
      consoleMessages.push({ type: message.type(), text: message.text().slice(0, 400) });
    }
  });
  page.on('pageerror', (error) => pageErrors.push(String(error).slice(0, 400)));

  await page.addInitScript(() => {
    const store = {
      fcp: 0,
      lcp: 0,
      lcpElement: null,
      cls: 0,
      longTasks: [],
      loaf: [],
      renderer: [],
      canvases: [],
      marks: [],
      errors: [],
    };
    window.__phase0 = store;

    const observe = (type, callback, options = { buffered: true }) => {
      try {
        new PerformanceObserver(callback).observe({ type, ...options });
      } catch {
        // Entry type unsupported in this browser build.
      }
    };

    observe('paint', (list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') store.fcp = entry.startTime;
      }
    });
    observe('largest-contentful-paint', (list) => {
      for (const entry of list.getEntries()) {
        store.lcp = entry.startTime;
        const el = entry.element;
        if (el) {
          store.lcpElement = {
            tag: el.tagName,
            id: el.id || null,
            className: typeof el.className === 'string' ? el.className.slice(0, 160) : null,
            src: el.currentSrc || el.src || null,
            size: entry.size,
          };
        }
      }
    });
    observe('layout-shift', (list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) store.cls += entry.value;
      }
    });
    observe('longtask', (list) => {
      for (const entry of list.getEntries()) {
        store.longTasks.push({
          start: entry.startTime,
          duration: entry.duration,
          name: entry.name,
          container: entry.attribution?.[0]?.containerType ?? null,
        });
      }
    });
    observe('long-animation-frame', (list) => {
      for (const entry of list.getEntries()) {
        store.loaf.push({
          start: entry.startTime,
          duration: entry.duration,
          renderStart: entry.renderStart,
          styleAndLayoutStart: entry.styleAndLayoutStart,
          blockingDuration: entry.blockingDuration,
          firstUIEventTimestamp: entry.firstUIEventTimestamp,
          scripts: (entry.scripts || []).map((script) => ({
            invoker: script.invoker,
            invokerType: script.invokerType,
            sourceURL: script.sourceURL,
            sourceFunctionName: script.sourceFunctionName,
            duration: script.duration,
            executionStart: script.executionStart,
            forcedStyleAndLayoutDuration: script.forcedStyleAndLayoutDuration,
            pauseDuration: script.pauseDuration,
          })),
        });
      }
    });

    // The renderer timeline: when the DOM swaps from the CSS fallback to the
    // Three canvas, and when a canvas is appended to the host.
    const recordRenderer = (el) => {
      const mode = el.getAttribute('data-meter-renderer');
      const last = store.renderer[store.renderer.length - 1];
      if (last && last.mode === mode && last.phase === el.getAttribute('data-phase')) return;
      store.renderer.push({
        t: performance.now(),
        mode,
        phase: el.getAttribute('data-phase'),
        canvasCount: el.querySelectorAll('canvas').length,
      });
    };
    const attach = () => {
      const el = document.querySelector('[data-testid="lucky-meter-ring"]');
      if (!el) return false;
      recordRenderer(el);
      new MutationObserver(() => recordRenderer(el)).observe(el, {
        attributes: true,
        attributeFilter: ['data-meter-renderer', 'data-phase'],
      });
      new MutationObserver(() => {
        store.canvases.push({
          t: performance.now(),
          canvasCount: el.querySelectorAll('canvas').length,
        });
        recordRenderer(el);
      }).observe(el, { subtree: true, childList: true });
      return true;
    };
    const waitForMeter = () => {
      if (attach()) return;
      const timeline = new MutationObserver(() => {
        if (attach()) timeline.disconnect();
      });
      timeline.observe(document.documentElement, { subtree: true, childList: true });
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', waitForMeter, { once: true });
    } else {
      waitForMeter();
    }
  });

  const responses = [];
  page.on('response', async (response) => {
    const request = response.request();
    const type = request.resourceType();
    let headers = {};
    try {
      headers = await response.allHeaders();
    } catch {
      headers = {};
    }
    let bodyBytes = 0;
    if (!Number(headers['content-length'] || 0)) {
      try {
        bodyBytes = (await response.body()).length;
      } catch {
        bodyBytes = 0;
      }
    }
    responses.push({
      url: response.url(),
      status: response.status(),
      type,
      contentLength: Number(headers['content-length'] || 0),
      bodyBytes,
    });
  });

  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(settleMs);

  const collected = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const plain = (entry) => JSON.parse(JSON.stringify(entry));
    const resourceEntries = performance
      .getEntriesByType('resource')
      .map((entry) => ({
        name: entry.name,
        initiatorType: entry.initiatorType,
        startTime: entry.startTime,
        responseEnd: entry.responseEnd,
        duration: entry.duration,
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize,
        renderBlockingStatus: entry.renderBlockingStatus ?? null,
        deliveryType: entry.deliveryType ?? null,
      }));
    const marks = performance
      .getEntriesByType('mark')
      .map((entry) => ({ name: entry.name, startTime: entry.startTime }));
    const measures = performance
      .getEntriesByType('measure')
      .map((entry) => ({ name: entry.name, startTime: entry.startTime, duration: entry.duration }));
    const rendererInfo = (() => {
      try {
        const canvas = document.createElement('canvas');
        const gl =
          canvas.getContext('webgl2') ||
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl');
        if (!gl) return { available: false };
        const debug = gl.getExtension('WEBGL_debug_renderer_info');
        const info = {
          available: true,
          version: gl.getParameter(gl.VERSION),
          vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
          renderer: debug
            ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
            : gl.getParameter(gl.RENDERER),
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        };
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return info;
      } catch (error) {
        return { available: false, error: String(error) };
      }
    })();
    return {
      profile: {
        devicePixelRatio: window.devicePixelRatio,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory ?? null,
        userAgent: navigator.userAgent,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        rendererInfo,
        userTimingSupport: typeof performance.mark === 'function',
      },
      navigation: nav
        ? {
            ttfb: nav.responseStart,
            responseEnd: nav.responseEnd,
            domContentLoaded: nav.domContentLoadedEventEnd,
            load: nav.loadEventEnd,
            transferSize: nav.transferSize,
            encodedBodySize: nav.encodedBodySize,
            decodedBodySize: nav.decodedBodySize,
          }
        : null,
      paints: Object.fromEntries(
        performance.getEntriesByType('paint').map((entry) => [entry.name, entry.startTime])
      ),
      marks,
      measures,
      resources: resourceEntries,
      rendererWork: window.__phase0Renderer || null,
      phase0: plain(window.__phase0 || {}),
    };
  });

  const marks = collected.marks.slice().sort((a, b) => a.startTime - b.startTime);
  const markByName = Object.fromEntries(marks.map((mark) => [mark.name, mark.startTime]));
  const between = (from, to) =>
    typeof markByName[from] === 'number' && typeof markByName[to] === 'number'
      ? Number((markByName[to] - markByName[from]).toFixed(1))
      : null;

  const resources = collected.resources.map((entry) => {
    const response = responses.find((item) => item.url === entry.name);
    const transferSize = entry.transferSize || response?.contentLength || response?.bodyBytes || 0;
    return {
      ...entry,
      transferSize,
      fileName: entry.name.split('/').pop()?.split('?')[0] ?? entry.name,
      isAudio: AUDIO_RE.test(new URL(entry.name, url).pathname),
      contentTypeGroup: entry.initiatorType,
    };
  });

  const longTasks = collected.phase0.longTasks || [];
  const blockingTime = longTasks.reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0);
  const audio = resources.filter((entry) => entry.isAudio);
  const byType = {};
  for (const entry of resources) {
    const key = entry.contentTypeGroup || 'other';
    byType[key] = byType[key] || { count: 0, bytes: 0 };
    byType[key].count += 1;
    byType[key].bytes += entry.transferSize;
  }

  const report = {
    url,
    label,
    measuredAt: new Date().toISOString(),
    wallClockMs: Date.now() - started,
    settleMs,
    cacheState: 'cold-context (fresh browser context, empty HTTP cache)',
    networkCondition: 'unthrottled, no CPU throttling (lab baseline)',
    profile: collected.profile,
    navigation: collected.navigation,
    paints: collected.paints,
    metrics: {
      fcpMs: Math.round(collected.phase0.fcp || collected.paints['first-contentful-paint'] || 0),
      lcpMs: Math.round(collected.phase0.lcp || 0),
      lcpElement: collected.phase0.lcpElement,
      cls: Number((collected.phase0.cls || 0).toFixed(4)),
      ttfbMs: Math.round(collected.navigation?.ttfb || 0),
      domContentLoadedMs: Math.round(collected.navigation?.domContentLoaded || 0),
      loadMs: Math.round(collected.navigation?.load || 0),
      longTaskCount: longTasks.length,
      totalBlockingTimeMs: Math.round(blockingTime),
      longTasks,
    },
    rendererTimeline: collected.phase0.renderer || [],
    canvasAppends: collected.phase0.canvases || [],
    rendererWork: collected.rendererWork || null,
    marks,
    markDeltas: {
      'meter-surface->meter-ready': between('meter-surface', 'meter-ready'),
      'meter-started->meter-ready': between('meter-started', 'meter-ready'),
      'navigationStart->meter-surface': markByName['meter-surface'] ?? null,
      'navigationStart->meter-ready': markByName['meter-ready'] ?? null,
      'navigationStart->meter-started': markByName['meter-started'] ?? null,
      ...(markByName['meter-scene-request'] !== undefined
        ? {
            'meter-scene-request->meter-scene-resolved': between(
              'meter-scene-request',
              'meter-scene-resolved'
            ),
            'navigationStart->meter-scene-request': markByName['meter-scene-request'],
            'navigationStart->meter-surface': between(
              'meter-scene-request',
              'meter-surface'
            ),
            'meter-surface->meter-environment': between('meter-surface', 'meter-environment'),
            'meter-environment->meter-lights': between('meter-environment', 'meter-lights'),
            'meter-lights->meter-geometry': between('meter-lights', 'meter-geometry'),
            'meter-geometry->meter-start': between('meter-geometry', 'meter-start'),
            'meter-start->meter-first-frame': between('meter-start', 'meter-first-frame'),
            'meter-start->meter-ready': between('meter-start', 'meter-ready'),
          }
        : {}),
    },
    measures: collected.measures,
    loaf: collected.phase0.loaf || [],
    audio: {
      requestCount: audio.length,
      transferBytes: audio.reduce((sum, entry) => sum + entry.transferSize, 0),
      firstRequestStartMs: audio.length ? Math.round(Math.min(...audio.map((entry) => entry.startTime))) : null,
      files: audio
        .slice()
        .sort((a, b) => b.transferSize - a.transferSize)
        .map((entry) => ({
          file: entry.fileName,
          transferSize: entry.transferSize,
          decodedBodySize: entry.decodedBodySize,
          startTime: Math.round(entry.startTime),
          responseEnd: Math.round(entry.responseEnd),
          transferDuration: Math.round(entry.duration),
        })),
    },
    network: {
      requestCount: resources.length,
      totalTransferBytes: resources.reduce((sum, entry) => sum + entry.transferSize, 0),
      byType,
      heaviest: resources
        .slice()
        .sort((a, b) => b.transferSize - a.transferSize)
        .slice(0, 30)
        .map((entry) => ({
          transferSize: entry.transferSize,
          type: entry.contentTypeGroup,
          startTime: Math.round(entry.startTime),
          responseEnd: Math.round(entry.responseEnd),
          url: entry.name,
        })),
    },
    console: consoleMessages,
    pageErrors,
    resources,
  };

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        label,
        renderer: report.profile.rendererInfo.renderer ?? null,
        fcpMs: report.metrics.fcpMs,
        lcpMs: report.metrics.lcpMs,
        loadMs: report.metrics.loadMs,
        longTasks: report.metrics.longTaskCount,
        tbtMs: report.metrics.totalBlockingTimeMs,
        longestTask: longTasks.slice().sort((a, b) => b.duration - a.duration)[0] ?? null,
        marks: report.markDeltas,
        rendererTimeline: report.rendererTimeline,
        transferKiB: Math.round(report.network.totalTransferBytes / 1024),
        audioKiB: Math.round(report.audio.transferBytes / 1024),
        audioFirstStartMs: report.audio.firstRequestStartMs,
      },
      null,
      2
    )
  );
  console.log(`report: ${outputFile}`);
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
