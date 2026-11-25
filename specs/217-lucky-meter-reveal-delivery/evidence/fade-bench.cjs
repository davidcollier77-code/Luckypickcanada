#!/usr/bin/env node
/**
 * Spec 217 fade + hand-off benchmark.
 *
 * Measures the Lucky Meter's CSS-fallback -> 3D reveal on a cold mobile
 * context. It is derived from the Phase 0 probe's browser profile so local and
 * deployed runs are comparable, and it adds the hand-off timeline that the
 * missing-meter investigation needs:
 *
 *   - every animation frame's canvas-host opacity, fallback presence and
 *     data-meter-renderer value;
 *   - the host's transitionrun / transitionstart / transitionend timestamps;
 *   - long-animation-frame entries with their blocking duration;
 *   - the interval in which neither the fallback nor a painted canvas is on
 *     screen;
 *   - an optional runtime-only simulation that keeps a clone of the fallback
 *     mounted until the canvas is actually visible. The simulation never
 *     changes repository code; it exists to evaluate the proposed fix.
 *
 * The requested duration is applied with a runtime-only CSS override injected
 * at document start, exactly as the deployed benchmark did. 0 ms is a
 * diagnostic control only and is never a candidate duration.
 *
 * Usage:
 *   node fade-bench.cjs <url> [options]
 *
 * Options:
 *   --out=<path>            JSON output (default: fade-local-benchmark.json)
 *   --durations=600,450,... default: 600,450,300,225,150,0
 *   --runs=<n>              cold runs per duration (default 4)
 *   --label=<name>          label recorded in the output
 *   --capture               save midpoint screenshots per duration
 *   --simulate=retain-until-visible
 *                           reinsert a fallback clone until the canvas is
 *                           visible, to evaluate the proposed hand-off fix
 *   --shot-dir=<path>       screenshot directory (default: ./fade-visual)
 *   --merge                 merge this batch into an existing output file
 *   --slowmo=<factor>       slow the CSS transition only for midpoint captures
 *                           (runtime-only CDP playback rate; default 1)
 *
 * Requires playwright-chromium. Run with NODE_PATH="$PWD/node_modules" when
 * the script is executed outside the repository root's resolution path.
 */
const { chromium } = require('playwright-chromium');
const fs = require('node:fs');
const path = require('node:path');

const positional = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const url = positional[0];
if (!url) {
  console.error('Usage: node fade-bench.cjs <url> [--out=path] [--durations=...] [--runs=n]');
  process.exit(2);
}

const option = (name, fallback) => {
  const found = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
};
const flag = (name) => process.argv.includes(`--${name}`);

const outputFile = path.resolve(option('out', 'fade-local-benchmark.json'));
const durations = option('durations', '600,450,300,225,150,0')
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value >= 0);
const runs = Math.max(1, Number(option('runs', '4')));
const label = option('label', 'local-production-build');
const capture = flag('capture');
const merge = flag('merge');
const slowmo = Math.max(0.001, Math.min(1, Number(option('slowmo', '1')) || 1));
const simulate = option('simulate', '');
const shotDir = path.resolve(option('shot-dir', path.join(path.dirname(outputFile), 'fade-visual')));

const MOBILE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
};

const HOST = '[data-testid="lucky-vessel-canvas-host"]';
const RING = '[data-testid="lucky-meter-ring"]';
const FALLBACK = '[data-testid="lucky-meter-fallback"]';
const SCENE = '.lucky-meter-stage__scene';

function installProbe({ duration, simulateRetain }) {
  // This function is serialized into the page by Playwright, so it cannot use
  // the harness's module-level constants; declare the selectors locally.
  const HOST = '[data-testid="lucky-vessel-canvas-host"]';
  const RING = '[data-testid="lucky-meter-ring"]';
  const FALLBACK = '[data-testid="lucky-meter-fallback"]';
  const SCENE = '.lucky-meter-stage__scene';

  const style = document.createElement('style');
  style.setAttribute('data-spec217-override', '');
  style.textContent =
    duration === 0
      ? `${HOST}{transition:none !important;}`
      : `${HOST}{transition-duration:${duration}ms !important;}`;
  // addInitScript runs before the document root exists in this Chromium, so the
  // override is attached on the first animation frame — still well before the
  // React effect creates the scene and adds `is-ready`.
  let styleInstalled = false;
  const ensureStyle = () => {
    if (styleInstalled) return true;
    const root = document.head || document.documentElement;
    if (!root) return false;
    root.appendChild(style);
    styleInstalled = true;
    return true;
  };

  const state = {
    startedAt: performance.now(),
    samples: [],
    events: { transitionrun: null, transitionstart: null, transitionend: null },
    readyAt: null,
    fallbackSeenAt: null,
    fallbackRemovedAt: null,
    firstPartialAt: null,
    opaqueAt: null,
    retainedFallbackAt: null,
    retainedFallbackRemovedAt: null,
    endAt: null,
    styleInstalledAt: null,
    error: null,
    loaf: [],
    done: false,
  };
  window.__spec217Fade = state;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        state.loaf.push({
          start: entry.startTime,
          duration: entry.duration,
          blockingDuration: entry.blockingDuration,
        });
      }
    });
    observer.observe({ type: 'long-animation-frame', buffered: true });
  } catch {
    // Entry type unsupported.
  }

  let host = null;
  let ring = null;
  let observed = false;

  // The real app removes the fallback in the same React commit that makes the
  // canvas visible, and that commit is also where the 2 s first-composite stall
  // happens. A MutationObserver runs after the stall, so it cannot restore the
  // fallback in time; the removal itself has to be deferred. That is exactly the
  // proposed fix, so this runtime-only simulation defers React's removal and
  // removes the fallback at the first visible canvas frame instead.
  let removeFallbackNow = null;
  if (simulateRetain) {
    const isFallback = (node) =>
      node &&
      node.nodeType === 1 &&
      typeof node.getAttribute === 'function' &&
      node.getAttribute('data-testid') === 'lucky-meter-fallback';
    const originalRemoveChild = Node.prototype.removeChild;
    const originalRemove = Element.prototype.remove;
    removeFallbackNow = (node) => {
      if (node && node.parentNode) originalRemoveChild.call(node.parentNode, node);
    };
    Node.prototype.removeChild = function deferredRemoveChild(child) {
      if (isFallback(child)) {
        child.setAttribute('data-spec217-retained', 'true');
        state.retainedFallbackAt ??= performance.now();
        return child;
      }
      return originalRemoveChild.call(this, child);
    };
    Element.prototype.remove = function deferredRemove() {
      if (isFallback(this)) {
        this.setAttribute('data-spec217-retained', 'true');
        state.retainedFallbackAt ??= performance.now();
        return;
      }
      return originalRemove.call(this);
    };
  }

  const attach = () => {
    host = document.querySelector(HOST);
    ring = document.querySelector(RING);
    if (!host || !ring || observed) return Boolean(host && ring);
    observed = true;
    for (const type of ['transitionrun', 'transitionstart', 'transitionend']) {
      host.addEventListener(type, (event) => {
        if (event.propertyName === 'opacity' && state.events[type] === null) {
          state.events[type] = performance.now();
        }
      });
    }
    return true;
  };

  const tick = () => {
    const now = performance.now();
    try {
    if (!styleInstalled && ensureStyle()) state.styleInstalledAt = Math.round(now);
    attach();
    if (host && ring) {
      const fallback = document.querySelector(FALLBACK);
      if (fallback) state.fallbackSeenAt ??= now;
      const opacity = Number.parseFloat(getComputedStyle(host).opacity);
      const ready = ring.getAttribute('data-meter-renderer') === 'three';
      if (ready) state.readyAt ??= now;
      if (simulateRetain) {
        if (ready && opacity > 0.001 && state.firstPartialAt === null) {
          state.firstPartialAt = now;
        }
        if (state.firstPartialAt !== null && fallback && removeFallbackNow) {
          // The canvas is visibly fading in; retire the CSS meter now.
          removeFallbackNow(fallback);
          state.fallbackRemovedAt = performance.now();
          state.retainedFallbackRemovedAt = performance.now();
        }
      } else if (state.fallbackSeenAt !== null && !fallback && state.fallbackRemovedAt === null) {
        state.fallbackRemovedAt = now;
      }
      if (ready && opacity > 0.001 && state.firstPartialAt === null) {
        state.firstPartialAt = now;
      }
      if (ready && opacity >= 0.999 && state.opaqueAt === null) {
        state.opaqueAt = now;
      }
      state.samples.push({
        t: Math.round(now),
        opacity: Number(opacity.toFixed(3)),
        ready,
        fallback: Boolean(document.querySelector(FALLBACK)),
        retained: Boolean(document.querySelector(`${FALLBACK}[data-spec217-retained]`)),
      });
      if (state.opaqueAt !== null && now - state.opaqueAt > 250) {
        state.endAt = now;
        state.done = true;
        return;
      }
    }
    if (performance.now() - state.startedAt > 20000) {
      state.endAt = performance.now();
      state.done = true;
      return;
    }
    } catch (error) {
      state.error = String(error && error.message ? error.message : error);
      state.endAt = performance.now();
      state.done = true;
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function summarise(run) {
  const samples = run.samples || [];
  const readyAt = run.readyAt;
  const fallbackRemovedAt = run.fallbackRemovedAt;
  const firstPartialAt = run.firstPartialAt;
  const opaqueAt = run.opaqueAt;
  const transitionFrames = samples.filter(
    (sample) => sample.ready && sample.opacity > 0.001 && sample.opacity < 0.999
  ).length;
  const fadeWindowMs =
    firstPartialAt !== null && opaqueAt !== null ? Math.round(opaqueAt - firstPartialAt) : null;
  const readyWindowMs = readyAt !== null && opaqueAt !== null ? Math.round(opaqueAt - readyAt) : null;
  // When the retained-fallback simulation is active, the stage is not empty
  // while the clone is mounted; measure from the clone's removal instead.
  const fallbackGoneAt =
    run.simulatedRetain && run.retainedFallbackRemovedAt !== null && run.retainedFallbackRemovedAt !== undefined
      ? run.retainedFallbackRemovedAt
      : fallbackRemovedAt;
  const emptyStageMs =
    fallbackGoneAt !== null && firstPartialAt !== null
      ? Math.max(0, Math.round(firstPartialAt - fallbackGoneAt))
      : fallbackGoneAt !== null
        ? Math.max(0, Math.round((run.endAt ?? fallbackGoneAt) - fallbackGoneAt))
        : null;
  const retainedMs =
    run.retainedFallbackAt !== null && run.retainedFallbackAt !== undefined &&
    run.retainedFallbackRemovedAt !== null && run.retainedFallbackRemovedAt !== undefined
      ? Math.round(run.retainedFallbackRemovedAt - run.retainedFallbackAt)
      : null;

  const revealFrom = readyAt ?? 0;
  const revealTo = opaqueAt ?? run.endAt ?? revealFrom;
  const revealLoafs = (run.loaf || []).filter(
    (entry) => entry.start + entry.duration >= revealFrom && entry.start <= revealTo
  );
  const fadeLoafs =
    firstPartialAt !== null && opaqueAt !== null
      ? (run.loaf || []).filter(
          (entry) => entry.start + entry.duration >= firstPartialAt && entry.start <= opaqueAt
        )
      : [];
  const sum = (entries, key) => entries.reduce((total, entry) => total + (entry[key] || 0), 0);
  const biggest = (entries) =>
    entries.length ? Math.round(Math.max(...entries.map((entry) => entry.duration))) : 0;

  const timeline = samples
    .filter((sample) => sample.t >= (readyAt ?? 0) - 120)
    .map((sample) => `${sample.t}:${sample.opacity.toFixed(2)}`)
    .slice(0, 40);

  return {
    ok: Boolean(readyAt !== null && opaqueAt !== null),
    requested: run.requested,
    simulatedRetain: run.simulatedRetain || false,
    readyAt: readyAt !== null ? Math.round(readyAt) : null,
    fallbackRemovedAt: fallbackRemovedAt !== null ? Math.round(fallbackRemovedAt) : null,
    firstPartialAt: firstPartialAt !== null ? Math.round(firstPartialAt) : null,
    opaqueAt: opaqueAt !== null ? Math.round(opaqueAt) : null,
    transitionEvents: Object.fromEntries(
      Object.entries(run.events || {}).map(([key, value]) => [
        key,
        value === null || value === undefined ? null : Math.round(value),
      ])
    ),
    transitionFrames,
    fadeWindowMs,
    readyWindowMs,
    emptyStageMs,
    retainedFallbackAt:
      run.retainedFallbackAt === null || run.retainedFallbackAt === undefined
        ? null
        : Math.round(run.retainedFallbackAt),
    retainedFallbackRemovedAt:
      run.retainedFallbackRemovedAt === null || run.retainedFallbackRemovedAt === undefined
        ? null
        : Math.round(run.retainedFallbackRemovedAt),
    retainedMs,
    fadeLoafCount: fadeLoafs.length,
    fadeLoafMs: Math.round(sum(fadeLoafs, 'duration')),
    fadeBlockingMs: Math.round(sum(fadeLoafs, 'blockingDuration')),
    revealLoafs: revealLoafs.length,
    revealLoafMs: Math.round(sum(revealLoafs, 'duration')),
    revealBlockingMs: Math.round(sum(revealLoafs, 'blockingDuration')),
    biggestLoafMs: biggest(revealLoafs),
    opacity: timeline.join(' '),
    samples,
    loaf: run.loaf || [],
  };
}

function median(values) {
  const sorted = values.filter((value) => typeof value === 'number').sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

async function captureMidpoint(page, target, fileBase) {
  try {
    await page.waitForFunction(
      ({ hostSelector, value }) => {
        const element = document.querySelector(hostSelector);
        if (!element) return false;
        const opacity = Number.parseFloat(getComputedStyle(element).opacity);
        return opacity >= value && opacity < 0.999;
      },
      { hostSelector: HOST, value: target },
      { polling: 'raf', timeout: 15000 }
    );
    const before = await page.evaluate(
      (hostSelector) => Number.parseFloat(getComputedStyle(document.querySelector(hostSelector)).opacity),
      HOST
    );
    const file = `${fileBase}-${String(target).replace('.', '')}.png`;
    await page.screenshot({ path: file });
    const after = await page.evaluate(
      (hostSelector) => Number.parseFloat(getComputedStyle(document.querySelector(hostSelector)).opacity),
      HOST
    );
    return { target, captured: true, opacityBefore: before, opacityAfter: after, file };
  } catch {
    return { target, captured: false };
  }
}

(async () => {
  const report = {
    url,
    label,
    measuredAt: new Date().toISOString(),
    method: 'runtime-only CSS transition-duration override injected at document start',
    profile: MOBILE,
    simulate: simulate || null,
    runsPerDuration: runs,
    durations: {},
    captures: [],
  };

  for (const duration of durations) {
    report.durations[duration] = [];
    for (let index = 0; index < runs; index += 1) {
      const started = Date.now();
      const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
      const context = await browser.newContext(MOBILE);
      const page = await context.newPage();
      const consoleMessages = [];
      const pageErrors = [];
      page.on('console', (message) => {
        if (message.type() === 'warning' || message.type() === 'error') {
          consoleMessages.push({ type: message.type(), text: message.text().slice(0, 300) });
        }
      });
      page.on('pageerror', (error) => pageErrors.push(String(error).slice(0, 300)));
      await page.addInitScript(installProbe, {
        duration,
        simulateRetain: simulate === 'retain-until-visible',
      });

      try {
        await page.goto(url, { waitUntil: 'load', timeout: 120000 });
        await page.waitForFunction(() => window.__spec217Fade?.done === true, null, {
          timeout: 30000,
          polling: 100,
        });
        const state = await page.evaluate(() => JSON.parse(JSON.stringify(window.__spec217Fade)));
        const summary = summarise({ ...state, requested: duration, simulatedRetain: Boolean(simulate) });
        summary.wallClockMs = Date.now() - started;
        summary.console = consoleMessages;
        summary.pageErrors = pageErrors;

        if (capture && index === 0) {
          fs.mkdirSync(shotDir, { recursive: true });
          const base = path.join(shotDir, `${duration}ms`);
          const shots = [];
          // Re-run the fade observation once more for the midpoint captures:
          // a screenshot itself takes long enough to disturb frame sampling.
          const captureBrowser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
          const captureContext = await captureBrowser.newContext(MOBILE);
          const capturePage = await captureContext.newPage();
          if (slowmo < 1) {
            // Runtime-only: slows the document's animation clock so a screenshot
            // can land on a genuine partial-opacity frame. It changes nothing in
            // the application or the measured run above.
            const cdp = await captureContext.newCDPSession(capturePage);
            await cdp.send('Animation.enable');
            await cdp.send('Animation.setPlaybackRate', { playbackRate: slowmo });
          }
          const captureRetain = simulate === 'retain-until-visible';
          await capturePage.addInitScript(installProbe, { duration, simulateRetain: captureRetain });
          await capturePage.goto(url, { waitUntil: 'load', timeout: 120000 });
          if (captureRetain) {
            // Mid-stall: the default hand-off shows an empty stage here.
            await capturePage.waitForTimeout(1400);
            await capturePage.screenshot({ path: `${base}-retained-stall.png` });
          }
          for (const target of [0.25, 0.65]) {
            shots.push(await captureMidpoint(capturePage, target, base));
          }
          await capturePage.screenshot({ path: `${base}-settled.png` });
          await captureBrowser.close();
          summary.captures = shots;
          summary.captureSlowmo = slowmo;
          report.captures.push({ duration, slowmo, shots });
        }

        report.durations[duration].push(summary);
        console.log(
          JSON.stringify({
            duration,
            run: index + 1,
            ok: summary.ok,
            readyAt: summary.readyAt,
            fallbackRemovedAt: summary.fallbackRemovedAt,
            firstPartialAt: summary.firstPartialAt,
            transitionFrames: summary.transitionFrames,
            fadeWindowMs: summary.fadeWindowMs,
            emptyStageMs: summary.emptyStageMs,
            retainedFallbackAt: summary.retainedFallbackAt,
            retainedFallbackRemovedAt: summary.retainedFallbackRemovedAt,
            retainedMs: summary.retainedMs,
            events: summary.transitionEvents,
            revealBlockingMs: summary.revealBlockingMs,
          })
        );
      } catch (error) {
        report.durations[duration].push({
          ok: false,
          requested: duration,
          error: String(error && error.message ? error.message : error),
          console: consoleMessages,
          pageErrors,
        });
        console.log(JSON.stringify({ duration, run: index + 1, ok: false, error: String(error) }));
      } finally {
        await browser.close();
      }
    }
  }

  const summary = {};
  for (const [duration, entries] of Object.entries(report.durations)) {
    const ok = entries.filter((entry) => entry.ok);
    summary[duration] = {
      runs: entries.length,
      okRuns: ok.length,
      transitionFramesMedian: median(ok.map((entry) => entry.transitionFrames)),
      transitionFramesRange: ok.length
        ? [Math.min(...ok.map((entry) => entry.transitionFrames)), Math.max(...ok.map((entry) => entry.transitionFrames))]
        : null,
      fadeWindowMsMedian: median(ok.map((entry) => entry.fadeWindowMs)),
      readyWindowMsMedian: median(ok.map((entry) => entry.readyWindowMs)),
      emptyStageMsMedian: median(ok.map((entry) => entry.emptyStageMs)),
      revealBlockingMsMedian: median(ok.map((entry) => entry.revealBlockingMs)),
      biggestLoafMsMedian: median(ok.map((entry) => entry.biggestLoafMs)),
      fallbackRemovedAtMedian: median(ok.map((entry) => entry.fallbackRemovedAt)),
      firstPartialAtMedian: median(ok.map((entry) => entry.firstPartialAt)),
    };
  }
  report.summary = summary;

  if (merge && fs.existsSync(outputFile)) {
    const previous = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
    report.durations = { ...(previous.durations || {}), ...report.durations };
    report.captures = [...(previous.captures || []), ...report.captures];
    const mergedSummary = {};
    for (const [duration, entries] of Object.entries(report.durations)) {
      const ok = entries.filter((entry) => entry.ok);
      mergedSummary[duration] = {
        runs: entries.length,
        okRuns: ok.length,
        transitionFramesMedian: median(ok.map((entry) => entry.transitionFrames)),
        transitionFramesRange: ok.length
          ? [
              Math.min(...ok.map((entry) => entry.transitionFrames)),
              Math.max(...ok.map((entry) => entry.transitionFrames)),
            ]
          : null,
        fadeWindowMsMedian: median(ok.map((entry) => entry.fadeWindowMs)),
        readyWindowMsMedian: median(ok.map((entry) => entry.readyWindowMs)),
        emptyStageMsMedian: median(ok.map((entry) => entry.emptyStageMs)),
        revealBlockingMsMedian: median(ok.map((entry) => entry.revealBlockingMs)),
        biggestLoafMsMedian: median(ok.map((entry) => entry.biggestLoafMs)),
        fallbackRemovedAtMedian: median(ok.map((entry) => entry.fallbackRemovedAt)),
        firstPartialAtMedian: median(ok.map((entry) => entry.firstPartialAt)),
      };
    }
    report.summary = mergedSummary;
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ summary, outputFile }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
