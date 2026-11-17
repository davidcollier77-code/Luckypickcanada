/**
 * Production-build measurement for the shared adaptive performance layer.
 *
 * Runs the real homepage in Chromium with device and network hints injected
 * before application scripts, then measures canvas paint cadence (a proxy for
 * the governed ambient animation loop), long tasks, heap use and load timing.
 *
 * Usage: node artifacts/adaptive-performance-20261117/benchmark.mjs <baseUrl>
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const baseUrl = process.argv[2] || 'http://127.0.0.1:3100';

const PROFILES = [
  {
    name: 'low-capability-mobile',
    viewport: { width: 360, height: 740 },
    deviceScaleFactor: 2,
    cpuThrottle: 4,
    reducedMotion: 'no-preference',
    device: { memory: 1, cores: 2 },
    connection: { saveData: true, downlink: 0.4, rtt: 700, effectiveType: '3g' },
  },
  {
    name: 'medium-capability-mobile',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    cpuThrottle: 2,
    reducedMotion: 'no-preference',
    device: { memory: 4, cores: 4 },
    connection: { downlink: 2, rtt: 250, effectiveType: '4g' },
  },
  {
    name: 'same-viewport-capable',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    cpuThrottle: 1,
    reducedMotion: 'no-preference',
    device: { memory: 8, cores: 16 },
    connection: { downlink: 30, rtt: 30, effectiveType: '4g' },
  },
  {
    name: 'same-viewport-constrained',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    cpuThrottle: 1,
    reducedMotion: 'no-preference',
    device: { memory: 1, cores: 2 },
    connection: { saveData: true, downlink: 0.4, rtt: 700, effectiveType: '3g' },
  },
  {
    name: 'high-capability-desktop',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    cpuThrottle: 1,
    reducedMotion: 'no-preference',
    device: { memory: 8, cores: 16 },
    connection: { downlink: 30, rtt: 30, effectiveType: '4g' },
  },
  {
    name: 'high-capability-desktop-reduced-motion',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    cpuThrottle: 1,
    reducedMotion: 'reduce',
    device: { memory: 8, cores: 16 },
    connection: { downlink: 30, rtt: 30, effectiveType: '4g' },
  },
];

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const results = [];

for (const profile of PROFILES) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: profile.deviceScaleFactor,
    reducedMotion: profile.reducedMotion,
  });

  await context.addInitScript(
    ({ device, connection }) => {
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => device.memory,
        configurable: true,
      });
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => device.cores,
        configurable: true,
      });
      Object.defineProperty(navigator, 'connection', {
        get: () => ({
          ...connection,
          addEventListener() {},
          removeEventListener() {},
        }),
        configurable: true,
      });

      window.__adaptivePaints = 0;
      window.__adaptiveLongTasks = [];

      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function patched(type, ...args) {
        const context = originalGetContext.call(this, type, ...args);
        if (context && type === '2d' && !context.__adaptiveWrapped) {
          const originalClear = context.clearRect.bind(context);
          context.clearRect = (...clearArgs) => {
            window.__adaptivePaints += 1;
            return originalClear(...clearArgs);
          };
          context.__adaptiveWrapped = true;
        }
        return context;
      };

      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__adaptiveLongTasks.push(Math.round(entry.duration));
          }
        }).observe({ entryTypes: ['longtask'] });
      } catch {
        // Long task observation is optional.
      }
    },
    { device: profile.device, connection: profile.connection },
  );

  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  // Off-origin analytics and challenge scripts are irrelevant to rendering and
  // can hang a sandboxed run, so the measurement serves everything locally.
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith(baseUrl) || url.startsWith('data:')) return route.continue();
    return route.abort();
  });
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 200));
  });
  page.on('pageerror', (error) => consoleErrors.push(String(error).slice(0, 200)));

  if (profile.cpuThrottle > 1) {
    const client = await context.newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuThrottle });
  }

  const started = Date.now();
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  const loadMs = Date.now() - started;

  // The ambient canvases mount after hydration; wait for the first one briefly.
  await page.waitForSelector('canvas', { timeout: 15_000 }).catch(() => {});

  // Let the ambient loop settle, then measure a fixed window.
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    window.__adaptivePaints = 0;
    window.__adaptiveLongTasks.length = 0;
  });

  const windowMs = 2500;
  await page.waitForTimeout(windowMs);

  const sample = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      paints: window.__adaptivePaints,
      longTasks: window.__adaptiveLongTasks.slice(),
      heapUsedMb: performance.memory
        ? Number((performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1))
        : null,
      domContentLoadedMs: navigation ? Math.round(navigation.domContentLoadedEventEnd) : null,
      loadEventMs: navigation ? Math.round(navigation.loadEventEnd) : null,
      visibility: document.visibilityState,
      canvasCount: document.querySelectorAll('canvas').length,
    };
  });

  results.push({
    profile: profile.name,
    viewport: `${profile.viewport.width}x${profile.viewport.height}@${profile.deviceScaleFactor}x`,
    cpuThrottle: `${profile.cpuThrottle}x`,
    reducedMotion: profile.reducedMotion,
    paintsPerSecond: Number((sample.paints / (windowMs / 1000)).toFixed(1)),
    longTaskCount: sample.longTasks.length,
    longTaskTotalMs: sample.longTasks.reduce((sum, value) => sum + value, 0),
    longestTaskMs: sample.longTasks.length ? Math.max(...sample.longTasks) : 0,
    heapUsedMb: sample.heapUsedMb,
    loadMs,
    domContentLoadedMs: sample.domContentLoadedMs,
    loadEventMs: sample.loadEventMs,
    canvasCount: sample.canvasCount,
    visibility: sample.visibility,
    consoleErrors,
  });

  await context.close();
}

await browser.close();

writeFileSync(
  new URL('./benchmark-results.json', import.meta.url),
  JSON.stringify({ baseUrl, measuredAt: new Date().toISOString(), results }, null, 2),
);

console.log(JSON.stringify(results, null, 2));
