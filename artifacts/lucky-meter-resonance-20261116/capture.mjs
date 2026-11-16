/**
 * Daily Resonance — before/after visual evidence capture.
 *
 * Drives the real /lucky-meter page in Chromium with a deterministic daily
 * result seeded into Local Storage, so each tier and event can be captured at
 * documented beats. Output is task evidence, not a committed visual baseline.
 *
 * Usage:
 *   node artifacts/lucky-meter-resonance-20261116/capture.mjs <outDir> <label>
 */

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:3000';
const STORAGE_KEY = 'lucky-pick-canada-lucky-meter-v1';

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, isMobile: false, hasTouch: false },
  'mobile-390': { width: 390, height: 844, isMobile: true, hasTouch: true },
  'mobile-412': { width: 412, height: 915, isMobile: true, hasTouch: true },
};

const EVENTS = {
  meteor: { duration: 9000, name: 'Meteor Shower' },
  lightning: { duration: 10000, name: 'Cosmic Lightning' },
  fireworks: { duration: 11500, name: 'Fireworks' },
};

const TIERS = {
  low: { percentage: 24, label: 'Low Resonance', message: "You're riding a little low today, but you're still okay!" },
  medium: { percentage: 57, label: 'Medium Resonance', message: 'Your luck is in the mid-range today.' },
  high: { percentage: 91, label: 'High Resonance', message: 'Your luck is running high today!' },
};

function localDateKey() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function buildState(tierId, eventId, { completed = true } = {}) {
  const tier = TIERS[tierId];
  const event = EVENTS[eventId];
  return {
    version: 1,
    dateKey: localDateKey(),
    result: {
      dateKey: localDateKey(),
      percentage: tier.percentage,
      tier: { id: tierId, label: tier.label, message: tier.message },
      event: { id: eventId, name: event.name },
      colour: { id: 'maple-red', name: 'Maple Red', hex: '#B52B32', light: false },
      spark: {
        id: 'spark-01',
        message: 'Even a small step forward can change the direction of your day.',
      },
      createdAt: Date.now(),
    },
    history: { percentages: [tier.percentage], events: [eventId], sparks: ['spark-01'] },
    eventCompleted: completed,
    stageDurationMs: event.duration,
  };
}

async function seed(page, tierId, eventId, options) {
  const state = buildState(tierId, eventId, options);
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(state)],
  );
  await page.goto(`${BASE_URL}/lucky-meter`, { waitUntil: 'domcontentloaded' });
}

async function main() {
  const outDir = process.argv[2] || 'artifacts/lucky-meter-resonance-20261116/after';
  const label = process.argv[3] || 'capture';
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const report = { label, capturedAt: new Date().toISOString(), baseUrl: BASE_URL, shots: [] };

  const shot = async (page, name) => {
    const file = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: file });
    report.shots.push(name);
  };

  // Welcome state, desktop and phone.
  for (const [name, viewport] of Object.entries({
    desktop: VIEWPORTS.desktop,
    'mobile-390': VIEWPORTS['mobile-390'],
  })) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: viewport.isMobile, hasTouch: viewport.hasTouch, colorScheme: 'dark', locale: 'en-CA' });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/lucky-meter`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Reveal My Resonance/i }).waitFor({ timeout: 30000 });
    await page.waitForTimeout(1400);
    await shot(page, `welcome-${name}`);
    await context.close();
  }

  // Landed result for every tier and event at desktop, to record the numbers.
  for (const tierId of Object.keys(TIERS)) {
    for (const eventId of Object.keys(EVENTS)) {
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop, deviceScaleFactor: 1, colorScheme: 'dark', locale: 'en-CA' });
      const page = await context.newPage();
      await seed(page, tierId, eventId, { completed: true });
      await page.getByText('Your Lucky Numbers').waitFor({ timeout: 30000 });
      await page.waitForTimeout(900);
      const panel = page.locator('[data-testid="lucky-numbers-values"]');
      const target = (await panel.count())
        ? panel
        : page.locator('section', { hasText: 'Your Lucky Numbers' }).first();
      const numbers = await target.locator('span').allTextContents();
      const eventNumbers = await target.innerText();
      report[`${tierId}-${eventId}`] = { numbers, text: eventNumbers };
      await shot(page, `result-${tierId}-${eventId}`);
      await context.close();
    }
  }

  // Mid-event frames: resume an unfinished event and capture its middle.
  for (const eventId of Object.keys(EVENTS)) {
    const context = await browser.newContext({ viewport: VIEWPORTS.desktop, deviceScaleFactor: 1, colorScheme: 'dark', locale: 'en-CA' });
    const page = await context.newPage();
    await seed(page, 'medium', eventId, { completed: false });
    await page.getByTestId('cosmic-event-stage').waitFor({ timeout: 30000 });
    await page.waitForTimeout(eventId === 'fireworks' ? 5200 : 3200);
    await shot(page, `event-${eventId}`);
    await context.close();
  }

  // Phone landed result.
  {
    const context = await browser.newContext({ viewport: VIEWPORTS['mobile-390'], deviceScaleFactor: 1, isMobile: true, hasTouch: true, colorScheme: 'dark', locale: 'en-CA' });
    const page = await context.newPage();
    await seed(page, 'high', 'fireworks', { completed: true });
    await page.getByText('Your Lucky Numbers').waitFor({ timeout: 30000 });
    await page.waitForTimeout(900);
    await shot(page, 'result-mobile-high-fireworks');
    report.mobileNumbers = await page
      .locator('[data-testid="lucky-numbers-values"]')
      .innerText()
      .catch(async () =>
        page.locator('section', { hasText: 'Your Lucky Numbers' }).first().innerText(),
      );
    await context.close();
  }

  // Reduced motion.
  {
    const context = await browser.newContext({ viewport: VIEWPORTS.desktop, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: 'dark', locale: 'en-CA' });
    const page = await context.newPage();
    await seed(page, 'low', 'meteor', { completed: true });
    await page.getByText('Your Lucky Numbers').waitFor({ timeout: 30000 });
    await page.waitForTimeout(700);
    await shot(page, 'reduced-motion-low-meteor');
    report.reducedMotionStage = await page.getByTestId('cosmic-event-stage').count();
    await context.close();
  }

  // WebGL fallback: every WebGL request returns null.
  {
    const context = await browser.newContext({ viewport: VIEWPORTS.desktop, deviceScaleFactor: 1, colorScheme: 'dark', locale: 'en-CA' });
    const page = await context.newPage();
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function getContext(type, ...rest) {
        if (typeof type === 'string' && type.includes('webgl')) return null;
        return original.call(this, type, ...rest);
      };
    });
    await seed(page, 'medium', 'lightning', { completed: false });
    await page.getByTestId('cosmic-event-stage').waitFor({ timeout: 30000 });
    await page.waitForTimeout(2600);
    await shot(page, 'webgl-fallback-lightning');
    report.fallbackGlow = await page.locator('[data-testid="cosmic-event-stage"] div').count();
    await context.close();
  }

  await writeFile(path.join(outDir, 'capture-report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
