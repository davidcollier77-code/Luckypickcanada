import { expect, test, type Page } from '@playwright/test';
import {
  getPaletteForSeasonKey,
  getSeasonKeyForDate,
} from '../../app/lib/lucky-meter/sparks-and-seasonal-colours';

/**
 * Daily Resonance browser coverage for the dimensional meter.
 *
 * Every stored-reading scenario is seeded into Local Storage before the page
 * loads, so the result is deterministic. One real run walks the complete
 * storyboard; the rest resume from a stored lifecycle point so the browser
 * suite stays fast without skipping the states it protects.
 *
 * The meter is one WebGL scene: a struck medallion, twelve seasonal chambers,
 * a fixed 7:30 pointer with its curved arm and spout, and a receiving vessel
 * that fills and stays full. There is no SVG artwork in the meter.
 */

const STORAGE_KEY = 'lucky-pick-canada-lucky-meter-v1';
const SEASONS = ['winter', 'spring', 'summer', 'autumn'] as const;
type Season = (typeof SEASONS)[number];

const TIERS = {
  low: {
    percentage: 24,
    label: 'Low Resonance',
    message: "You're riding a little low today, but you're still okay!",
    event: { id: 'meteor', name: 'Meteor Shower', duration: 9000 },
    luckyNumber: 12,
  },
  medium: {
    percentage: 57,
    label: 'Medium Resonance',
    message: 'Your luck is in the mid-range today.',
    event: { id: 'lightning', name: 'Cosmic Lightning', duration: 10000 },
    luckyNumber: 27,
  },
  high: {
    percentage: 91,
    label: 'High Resonance',
    message: "Your luck is running high today!",
    event: { id: 'fireworks', name: 'Fireworks', duration: 11500 },
    luckyNumber: 44,
  },
} as const;

type TierId = keyof typeof TIERS;

/** The four cues needed to begin the ritual; these may load before Start. */
const OPENING_AUDIO = [
  '/freesound_community-starship-rail-gun-charge-35904.mp3',
  '/sounds/crystal-ball-leaf.mp3',
  '/sounds/crystal-ball-leaf.wav',
  '/sounds/mixkit-magic-sparkles.mp3',
  '/sounds/chime-sound.mp3',
];

/** The eight celebration cues; none may be requested before activation. */
const CELEBRATION_AUDIO = [
  '/dragon-studio-whoosh-cinematic-376875.mp3',
  '/sounds/mixkit-cinematic-impact.mp3',
  '/freesound_community-fireworks-1-94483.mp3',
  '/sounds/mixkit-magical-impact.mp3',
  '/sounds/mixkit-firework-crackle.mp3',
  '/sounds/mixkit-firework-whistle.mp3',
  '/sounds/lucky-meter-finale-boom.wav',
  '/sounds/lucky-meter-thunder-rumble.wav',
];

function localDateKey() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

const TODAY = localDateKey();
const CURRENT_SEASON = (getSeasonKeyForDate(new Date()) ?? 'autumn') as Season;
const SEASON_DATES: Record<Season, string> = {
  winter: '2027-01-15T12:00:00',
  spring: '2027-04-15T12:00:00',
  summer: '2027-07-15T12:00:00',
  autumn: '2027-10-15T12:00:00',
};

function seasonColour(season: Season, index = 6) {
  const palette = getPaletteForSeasonKey(season);
  return palette[index % palette.length];
}

function buildState({
  tierId,
  season = CURRENT_SEASON,
  colour = seasonColour(season),
  percentage = TIERS[tierId].percentage,
  luckyNumber = TIERS[tierId].luckyNumber,
  started = true,
  messageCompleted = started,
  eventCompleted = started,
  sparkCompleted = started,
  stageDurationMs = TIERS[tierId].event.duration,
  dateKey = TODAY,
}: {
  tierId: TierId;
  season?: Season;
  colour?: ReturnType<typeof seasonColour>;
  percentage?: number;
  luckyNumber?: number;
  started?: boolean;
  messageCompleted?: boolean;
  eventCompleted?: boolean;
  sparkCompleted?: boolean;
  stageDurationMs?: number;
  dateKey?: string;
}) {
  const tier = TIERS[tierId];
  return {
    version: 1,
    dateKey,
    result: {
      dateKey,
      season,
      percentage,
      tier: { id: tierId, label: tier.label, message: tier.message },
      event: { id: tier.event.id, name: tier.event.name },
      luckyNumber,
      colour: {
        id: colour.id,
        name: colour.name,
        hex: colour.hex,
        light: colour.light,
        texture: colour.texture,
      },
      spark: {
        id: 'spark-01',
        message: 'Even a small step forward can change the direction of your day.',
      },
      createdAt: Date.now(),
    },
    history: {
      percentages: [percentage],
      numbers: [luckyNumber],
      colours: [colour.id],
      sparks: ['spark-01'],
    },
    revealCompleted: started,
    messageCompleted,
    eventCompleted,
    sparkCompleted,
    stageDurationMs,
  };
}

async function seed(page: Page, state: ReturnType<typeof buildState>) {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(state)],
  );
  await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
}

async function waitForStart(page: Page) {
  const start = page.getByTestId('lucky-meter-start');
  await expect(start).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
  return start.getByRole('button', { name: /Reveal My Resonance/i });
}

async function startReveal(page: Page) {
  const button = await waitForStart(page);
  await expect(async () => {
    await button.click();
    await expect(page.getByTestId('lucky-meter-ring')).not.toHaveAttribute(
      'data-phase',
      'idle',
      { timeout: 1500 },
    );
  }).toPass({ timeout: 15_000 });
}

/** Pin the wall clock at midday so a long cinematic can never cross midnight. */
async function pinNoon(page: Page) {
  await page.clock.setFixedTime(new Date(`${TODAY}T12:00:00`));
}

async function readStoredResult(page: Page) {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEY);
}

/** The wheel rotation that puts the stored colour under the 7:30 pointer. */
function settledAngle(colourId: string, season: Season) {
  const palette = getPaletteForSeasonKey(season);
  const index = Math.max(
    0,
    palette.findIndex((colour: { id: string }) => colour.id === colourId),
  );
  return (((225 - index * 30) % 360) + 360) % 360;
}

test.describe('Daily Resonance arrival and Start', () => {
  test('holds Start until the breeze has cleared, then starts the reading at 0', async ({
    page,
  }) => {
    // This test can spend 15 s waiting for Start and another 20 s waiting for
    // the first value; the default 30 s budget is shorter than both waits.
    test.slow();
    await page.addInitScript(() => {
      const reading: { value?: string; plaque?: string } = {};
      (window as Window & { __luckyMeterStartReading?: typeof reading }).__luckyMeterStartReading =
        reading;
      const setAttribute = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function recordStartReading(
        this: Element,
        name: string,
        value: string,
      ) {
        if (this.getAttribute('data-testid') === 'lucky-meter-value') {
          if (name === 'data-value' && reading.value === undefined) reading.value = String(value);
          if (name === 'data-plaque' && reading.plaque === undefined) {
            reading.plaque = String(value);
          }
        }
        return setAttribute.call(this, name, value);
      };
    });
    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });

    const start = page.getByTestId('lucky-meter-start');
    await expect(start).toHaveAttribute('data-ready', 'false');
    await expect(page.getByTestId('lucky-meter-home')).toBeVisible();
    await expect(page.getByTestId('lucky-meter-countdown')).toHaveCount(0);
    // The caption belongs to the reading, not the welcome state.
    await expect(page.getByTestId('lucky-colour-panel')).toHaveCount(0);

    const button = await waitForStart(page);
    await expect(button).toBeVisible();
    await button.click();

    await expect(page.getByTestId('lucky-meter-home')).toHaveCount(0);

    const ring = page.getByTestId('lucky-meter-ring');
    await expect(ring).toHaveAttribute('data-phase', 'spin');
    await expect(ring).toHaveAttribute('data-pointer', '7.5');
    await expect(ring).toHaveAttribute('data-chamber-count', '12');
    await expect
      .poll(
        async () =>
          page.evaluate(
            () =>
              (window as Window & { __luckyMeterStartReading?: { value?: string } })
                .__luckyMeterStartReading?.value ?? null,
          ),
        { timeout: 20_000 },
      )
      .toBe('0');
    const startReading = await page.evaluate(
      () =>
        (window as Window & { __luckyMeterStartReading?: { value?: string; plaque?: string } })
          .__luckyMeterStartReading ?? {},
    );
    expect(startReading.plaque).toBe('hidden');
    await expect(page.getByTestId('lucky-number-panel')).toHaveCount(0);

    const pointer = page.getByTestId('lucky-meter-pointer');
    await expect(pointer).toHaveAttribute('data-position', '7.5');
    // The meter contains no SVG artwork at all.
    await expect(ring.locator('svg')).toHaveCount(0);
  });
});

test.describe('Daily Resonance reveal hand-off', () => {
  test('uses one approved fade and keeps the CSS meter until the canvas is visible', async ({
    page,
  }) => {
    test.slow();
    await page.addInitScript(() => {
      type Handoff = {
        removedAtOpacity: number | null;
        transitions: number;
        sawFallback: boolean;
        heldWhileTransparent: boolean;
      };
      const state: Handoff = {
        removedAtOpacity: null,
        transitions: 0,
        sawFallback: false,
        heldWhileTransparent: false,
      };
      (window as Window & { __spec217Handoff?: Handoff }).__spec217Handoff = state;

      const hostSelector = '[data-testid="lucky-vessel-canvas-host"]';
      const fallbackSelector = '[data-testid="lucky-meter-fallback"]';
      const readOpacity = () => {
        const host = document.querySelector(hostSelector);
        if (!host) return null;
        const raw = getComputedStyle(host).opacity;
        return raw === '' ? null : Number(raw);
      };

      const observer = new MutationObserver(() => {
        if (document.querySelector(fallbackSelector)) {
          state.sawFallback = true;
          return;
        }
        if (state.sawFallback && state.removedAtOpacity === null) {
          // The removal is the behaviour under test: the old hand-off removed
          // the complete CSS meter while the canvas was still transparent.
          state.removedAtOpacity = readOpacity();
        }
      });
      // `documentElement` can still be null when an init script runs.
      observer.observe(document, { childList: true, subtree: true });

      const tick = () => {
        const host = document.querySelector(hostSelector) as HTMLElement | null;
        if (host) {
          const opacity = readOpacity();
          if (
            host.classList.contains('is-ready') &&
            document.querySelector(fallbackSelector) &&
            opacity === 0
          ) {
            state.heldWhileTransparent = true;
          }
        }
        if (performance.now() < 15_000) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);

      document.addEventListener(
        'transitionrun',
        (event) => {
          const target = event.target as Element | null;
          if (
            target?.getAttribute('data-testid') === 'lucky-vessel-canvas-host' &&
            (event as TransitionEvent).propertyName === 'opacity'
          ) {
            state.transitions += 1;
          }
        },
        true,
      );
    });

    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    const host = page.getByTestId('lucky-vessel-canvas-host');
    await expect(host).toHaveCSS('transition-duration', '0.3s');
    await expect(host).toHaveCSS('transition-property', 'opacity');

    const ring = page.getByTestId('lucky-meter-ring');
    await expect(ring).toHaveAttribute('data-meter-renderer', 'three', { timeout: 30_000 });
    await expect(page.getByTestId('lucky-meter-fallback')).toHaveCount(0, {
      timeout: 15_000,
    });

    const handoff = await page.evaluate(
      () =>
        (window as Window & {
          __spec217Handoff?: {
            removedAtOpacity: number | null;
            transitions: number;
            heldWhileTransparent: boolean;
          };
        }).__spec217Handoff,
    );
    expect(handoff?.transitions).toBe(1);
    expect(handoff?.heldWhileTransparent).toBe(true);
    expect(handoff?.removedAtOpacity).not.toBeNull();
    expect(handoff?.removedAtOpacity ?? 0).toBeGreaterThan(0);
    // One reveal only: the welcome stage stays idle and no second hand-off runs.
    await expect(ring).toHaveAttribute('data-phase', 'idle');
  });
});

test.describe('Daily Resonance activation-gated audio', () => {
  test('requests no celebration cue before Start and the full set after', async ({ page }) => {
    test.slow();
    const requests: string[] = [];
    page.on('request', (request) => {
      const pathname = new URL(request.url()).pathname;
      if (/\.(mp3|wav)$/i.test(pathname)) requests.push(pathname);
    });

    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    await waitForStart(page);
    await expect
      .poll(() => requests.filter((path) => OPENING_AUDIO.includes(path)).length, {
        timeout: 15_000,
      })
      .toBeGreaterThan(0);

    // Route-time preparation may finish after the Start button settles.
    await page.waitForTimeout(750);
    expect(requests.filter((path) => CELEBRATION_AUDIO.includes(path))).toEqual([]);
    expect(requests.every((path) => OPENING_AUDIO.includes(path))).toBe(true);

    await startReveal(page);
    await expect
      .poll(
        () => CELEBRATION_AUDIO.filter((path) => requests.includes(path)).length,
        { timeout: 15_000 },
      )
      .toBe(CELEBRATION_AUDIO.length);
  });
});

test.describe('Daily Resonance storyboard', () => {
  test('stops the wheel at 6.3 s, lands the percentage at 11.3 s and fills the vessel once', async ({
    page,
  }) => {
    test.slow();
    await pinNoon(page);
    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const ring = document.querySelector('[data-testid="lucky-meter-ring"]');
      const phases: string[] = [];
      const beats: Array<{ phase: string; reveal: number; fill: number }> = [];
      (window as Window & { __luckyMeterPhases?: string[] }).__luckyMeterPhases = phases;
      (window as Window & { __luckyMeterBeats?: typeof beats }).__luckyMeterBeats = beats;
      let last = '';
      let frame = 0;
      // "landed" is a short hand-off before the pour. A frame sampler can miss
      // it on a loaded machine, so observe the attribute instead: React commits
      // the DOM value even when the browser has no time to paint that frame.
      const observer = new MutationObserver(() => {
        const phase = ring?.getAttribute('data-phase') ?? '';
        if (phase && phase !== last) {
          phases.push(phase);
          last = phase;
        }
      });
      const stop = () => {
        window.removeEventListener('pagehide', stop);
        observer.disconnect();
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
      };
      const sample = () => {
        const phase = ring?.getAttribute('data-phase') ?? '';
        const vessel = document.querySelector('[data-testid="lucky-colour-panel"]');
        const vesselPhase = vessel?.getAttribute('data-vessel-phase') ?? '';
        if (vesselPhase && vesselPhase !== 'idle') {
          beats.push({
            phase: vesselPhase,
            reveal: Number(ring?.getAttribute('data-number-reveal') ?? 0),
            fill: Number(vessel?.getAttribute('data-vessel-fill') ?? 0),
          });
        }
        // "revealed" and the vessel's "settled" arrive in the same commit; keep
        // sampling until the settled beat has been seen so the final full
        // vessel is recorded, then stop.
        if (phase === 'revealed' && beats.some((beat) => beat.phase === 'settled')) {
          stop();
          return;
        }
        frame = window.requestAnimationFrame(sample);
      };
      window.addEventListener('pagehide', stop, { once: true });
      if (ring) {
        observer.observe(ring, { attributes: true, attributeFilter: ['data-phase'] });
      }
      frame = window.requestAnimationFrame(sample);
    });
    await startReveal(page);

    const ring = page.getByTestId('lucky-meter-ring');
    const stored = (await readStoredResult(page)).result;

    await expect(ring).toHaveAttribute('data-phase', 'revealed', { timeout: 35_000 });
    await expect
      .poll(
        async () =>
          page.evaluate(
            () =>
              (
                window as Window & {
                  __luckyMeterBeats?: Array<{ phase: string }>;
                }
              ).__luckyMeterBeats?.some((beat) => beat.phase === 'settled') ?? false,
          ),
        { timeout: 5_000 },
      )
      .toBe(true);
    const phases = await page.evaluate(
      () => (window as Window & { __luckyMeterPhases?: string[] }).__luckyMeterPhases ?? [],
    );
    expect(phases).toContain('landed');
    expect(phases).toContain('pouring');

    const beats = await page.evaluate(
      () =>
        (window as Window & {
          __luckyMeterBeats?: Array<{ phase: string; reveal: number; fill: number }>;
        }).__luckyMeterBeats ?? [],
    );
    // The vessel fills, holds full, transfers the number and stays full.
    expect(beats.some((beat) => beat.phase === 'filling' && beat.fill > 0)).toBe(true);
    expect(beats.some((beat) => beat.phase === 'holding' && beat.fill === 1)).toBe(true);
    expect(beats.some((beat) => beat.phase === 'transferring')).toBe(true);
    expect(beats.some((beat) => beat.phase === 'settled' && beat.fill === 1)).toBe(true);
    // It never drains to empty.
    expect(beats.some((beat) => beat.phase === 'empty')).toBe(false);

    await expect(page.getByTestId('lucky-meter-value')).toHaveAttribute(
      'data-value',
      String(stored.percentage),
    );
    const angle = Number(await ring.getAttribute('data-wheel-angle'));
    expect(Math.abs(angle - settledAngle(stored.colour.id, stored.season))).toBeLessThan(0.03);

    // The number and the full vessel are presented together.
    const panel = page.getByTestId('lucky-colour-panel');
    await expect(panel).toBeVisible({ timeout: 25_000 });
    await expect(panel).toHaveAttribute('data-vessel-fill', '1.000');
    await expect(panel).toHaveAttribute('data-vessel-phase', /holding|transferring|settled/);
    await expect(panel).toContainText(stored.colour.name);
    await expect(panel).toContainText(stored.colour.hex);
    await expect(ring).toHaveAttribute('data-number-reveal', '1.00');

    // Twelve seasonal chambers are described by the stage's data contract, and
    // the meter contains no SVG.
    const ids = (await ring.getAttribute('data-chamber-ids'))?.split(' ') ?? [];
    expect(ids).toHaveLength(12);
    for (const colour of getPaletteForSeasonKey(stored.season)) {
      expect(ids).toContain(colour.id);
    }
    await expect(ring.locator('svg')).toHaveCount(0);
  });

  test('clears the tier message before the celebration, then docks Home and the countdown', async ({
    page,
  }) => {
    test.slow();
    await pinNoon(page);
    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    await startReveal(page);

    const stored = (await readStoredResult(page)).result;
    await expect(page.getByTestId('lucky-tier-message')).toHaveAttribute(
      'data-state',
      /writing|holding/,
      { timeout: 45_000 },
    );
    await expect(page.getByTestId('lucky-tier-message')).toContainText(stored.tier.message);

    await expect(page.getByTestId('cosmic-event-stage')).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId('cosmic-event-stage')).toHaveAttribute(
      'data-event',
      stored.event.id,
    );
    // The temporary sentence settles and unmounts before the cinematic's
    // first frame, so the sky is clear for the celebration.
    const message = page.getByTestId('lucky-tier-message');
    await expect(message).toHaveCount(0);
    // The vessel is still full during the celebration.
    await expect(page.getByTestId('lucky-colour-panel')).toHaveAttribute(
      'data-vessel-fill',
      '1.000',
    );
    await expect(page.getByTestId('lucky-meter-home')).toHaveCount(0);
    await expect(page.getByTestId('lucky-meter-countdown')).toHaveCount(0);

    await expect(page.getByTestId('cosmic-event-stage')).toHaveCount(0, { timeout: 45_000 });
    await expect(page.getByTestId('lucky-spark-cursor')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('lucky-spark-message')).toContainText(
      stored.spark.message.slice(0, 24),
      { timeout: 20_000 },
    );
    await expect(page.getByTestId('lucky-meter-home')).toHaveCount(0);

    await expect(page.getByTestId('lucky-meter-home')).toBeVisible({ timeout: 45_000 });
    // The finished controls are a corner overlay: the countdown sits in the
    // left column and Home in the right column of the same dock.
    const dock = page.getByTestId('lucky-meter-dock');
    await expect(dock.getByTestId('lucky-meter-countdown')).toBeVisible();
    await expect(page.getByTestId('lucky-spark-cursor')).toHaveCount(0);
    // FINISHED keeps the Spark, not the temporary tier sentence.
    await expect(message).toHaveCount(0);
  });
});

test.describe('Daily Resonance approved fallbacks and refresh policy', () => {
  test('keeps the complete CSS meter when WebGL is unavailable', async ({ page }) => {
    test.slow();
    await pinNoon(page);
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function getContextWithoutWebGL(
        this: HTMLCanvasElement,
        type: string,
        ...args: unknown[]
      ) {
        if (typeof type === 'string' && /webgl/i.test(type)) return null;
        return (original as unknown as (...parameters: unknown[]) => unknown).call(
          this,
          type,
          ...args,
        );
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lucky-meter-fallback')).toBeVisible();
    await startReveal(page);

    const ring = page.getByTestId('lucky-meter-ring');
    await expect(ring).toHaveAttribute('data-meter-renderer', 'fallback', { timeout: 20_000 });
    await expect(ring).toHaveAttribute('data-pointer', '7.5');
    await expect(ring.locator('svg')).toHaveCount(0);
    // The fallback still draws the wheel, pointer, vessel and beam from CSS.
    await expect(page.locator('.lucky-meter-fallback__wheel')).toBeVisible();
    await expect(page.locator('.lucky-meter-fallback__pointer')).toBeVisible();
    await expect(page.locator('.lucky-meter-fallback__vessel')).toBeVisible();

    const panel = page.getByTestId('lucky-colour-panel');
    await expect(panel).toHaveAttribute('data-vessel-phase', 'filling', { timeout: 25_000 });
    await expect
      .poll(async () => Number(await panel.getAttribute('data-vessel-fill')))
      .toBeGreaterThan(0);

    await expect(panel).toHaveAttribute('data-vessel-phase', 'settled', { timeout: 30_000 });
    await expect(panel).toHaveAttribute('data-vessel-fill', '1.000');
    await expect(page.getByTestId('lucky-vessel-highlight')).toHaveClass(/is-active/);
    await expect(page.getByTestId('lucky-number-panel')).toBeVisible();
  });

  test('restarts a refresh celebration at the full 12,000 ms (D12)', async ({ page }) => {
    await pinNoon(page);
    await seed(
      page,
      buildState({
        tierId: 'medium',
        started: true,
        messageCompleted: true,
        eventCompleted: false,
        sparkCompleted: false,
        stageDurationMs: 9000,
      }),
    );

    const stage = page.getByTestId('cosmic-event-stage');
    await expect(stage).toBeVisible({ timeout: 15_000 });
    await expect(stage).toHaveAttribute('data-duration', '12000');
    const stored = (await readStoredResult(page)).result;
    await expect(page.getByTestId('lucky-meter-value')).toHaveAttribute(
      'data-value',
      String(stored.percentage),
    );
    await expect(page.getByTestId('lucky-number-value')).toHaveAttribute(
      'data-value',
      String(stored.luckyNumber),
    );
    // A restored reading keeps its full vessel.
    await expect(page.getByTestId('lucky-colour-panel')).toHaveAttribute(
      'data-vessel-fill',
      '1.000',
    );
    await expect(page.getByTestId('lucky-meter-home')).toHaveCount(0);
  });

  test('presents the reading, Spark and dock at once under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await pinNoon(page);
    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });

    const button = await waitForStart(page);
    await button.click();
    const stored = (await readStoredResult(page)).result;

    await expect(page.getByTestId('lucky-meter-value')).toHaveAttribute(
      'data-value',
      String(stored.percentage),
    );
    await expect(page.getByTestId('lucky-number-value')).toHaveAttribute(
      'data-value',
      String(stored.luckyNumber),
    );
    await expect(page.getByTestId('lucky-spark-finale')).toHaveAttribute(
      'data-state',
      'written',
    );
    await expect(page.getByTestId('cosmic-event-stage')).toHaveCount(0);
    // The exact sentence is shown whole, with no typing and no fade.
    await expect(page.getByTestId('lucky-tier-message')).toHaveAttribute(
      'data-state',
      'holding',
    );
    await expect(page.getByTestId('lucky-tier-message')).toHaveAttribute('data-settled', 'true');
    await expect(page.getByTestId('lucky-tier-message')).toContainText(stored.tier.message);
    const dock = page.getByTestId('lucky-meter-dock');
    await expect(dock.getByTestId('lucky-meter-home')).toBeVisible();
    await expect(dock.getByTestId('lucky-meter-countdown')).toBeVisible();
    await expect(page.getByTestId('lucky-colour-panel')).toHaveAttribute(
      'data-vessel-fill',
      '1.000',
    );
  });
});

test.describe('Daily Resonance seasonal palettes', () => {
  for (const season of SEASONS) {
    test(`${season} renders its own twelve exact colours and panel values`, async ({ page }) => {
      const colour = seasonColour(season, 3);
      const dateKey = SEASON_DATES[season].slice(0, 10);
      await page.clock.setFixedTime(new Date(SEASON_DATES[season]));
      await seed(
        page,
        buildState({ tierId: 'medium', season, colour, started: true, dateKey }),
      );

      const palette = getPaletteForSeasonKey(season);
      const ring = page.getByTestId('lucky-meter-ring');
      // The stored reading hydrates after first paint; wait for its palette.
      // The stage shows a single placeholder chamber until then, so allow the
      // same generous hydration budget the other stored-state waits use.
      await expect
        .poll(
          async () => ((await ring.getAttribute('data-chamber-ids'))?.split(' ') ?? []).length,
          { timeout: 25_000 },
        )
        .toBe(12);
      const ids = (await ring.getAttribute('data-chamber-ids'))?.split(' ') ?? [];
      for (const entry of palette) expect(ids).toContain(entry.id);

      await expect(page.getByTestId('lucky-colour-panel')).toContainText(colour.name);
      await expect(page.getByTestId('lucky-colour-panel')).toContainText(colour.hex);
      await expect(page.getByTestId('lucky-colour-panel')).toContainText(
        season.charAt(0).toUpperCase() + season.slice(1),
      );
    });
  }

  test('keeps a legacy stored HEX intact instead of rerolling it', async ({ page }) => {
    await pinNoon(page);
    const legacy = {
      id: 'maple-red',
      name: 'Maple Red',
      hex: '#B52B32',
      light: false,
      texture: { finish: 'satin', grain: 0.2, sheen: 0.3 },
    };
    await seed(page, buildState({ tierId: 'medium', colour: legacy, started: true }));

    await expect(page.getByTestId('lucky-colour-panel')).toContainText('#B52B32');
    await expect(page.getByTestId('lucky-colour-panel')).toContainText('Maple Red');
  });
});

test.describe('Daily Resonance resume points', () => {
  test('resumes the message and celebration after the reveal', async ({ page }) => {
    test.slow();
    await pinNoon(page);
    const state = buildState({
      tierId: 'medium',
      started: true,
      messageCompleted: false,
      eventCompleted: false,
      sparkCompleted: false,
    });
    await seed(page, state);

    await expect(page.getByTestId('lucky-tier-message')).toHaveAttribute(
      'data-state',
      /writing|holding/,
      { timeout: 25_000 },
    );
    await expect(page.getByTestId('cosmic-event-stage')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('lucky-meter-home')).toHaveCount(0);
    // The message is written now and cleared before the resumed cinematic.
    await expect(page.getByTestId('lucky-tier-message')).toHaveCount(0);
  });

  test('resumes the Spark writing after the celebration', async ({ page }) => {
    test.slow();
    await pinNoon(page);
    await seed(
      page,
      buildState({
        tierId: 'low',
        started: true,
        messageCompleted: true,
        eventCompleted: true,
        sparkCompleted: false,
      }),
    );

    await expect(page.getByTestId('cosmic-event-stage')).toHaveCount(0);
    await expect(page.getByTestId('lucky-spark-cursor')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('lucky-spark-finale')).toHaveAttribute(
      'data-state',
      'written',
      { timeout: 30_000 },
    );
    await expect(page.getByTestId('lucky-meter-home')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('lucky-meter-countdown')).toBeVisible();
  });

  test('shows a completed reading without replaying the cinematic', async ({ page }) => {
    await pinNoon(page);
    await seed(page, buildState({ tierId: 'high', started: true }));

    await expect(page.getByTestId('lucky-spark-finale')).toHaveAttribute(
      'data-state',
      'written',
    );
    await expect(page.getByTestId('lucky-meter-home')).toBeVisible();
    await expect(page.getByTestId('lucky-meter-countdown')).toBeVisible();
    await expect(page.getByTestId('cosmic-event-stage')).toHaveCount(0);
    await expect(page.getByTestId('lucky-colour-panel')).toHaveAttribute(
      'data-vessel-fill',
      '1.000',
    );
    await expect(page.getByTestId('lucky-tier-message')).toHaveCount(0);
  });
});

test.describe('Daily Resonance reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('presents the whole reading calmly and docks Home at once', async ({ page }) => {
    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    const button = await waitForStart(page);
    await button.click();

    await expect(page.getByTestId('lucky-number-panel')).toBeVisible();
    await expect(page.getByTestId('lucky-colour-panel')).toBeVisible();
    await expect(page.getByTestId('lucky-spark-finale')).toHaveAttribute(
      'data-state',
      'written',
    );
    await expect(page.getByTestId('lucky-spark-cursor')).toHaveCount(0);
    await expect(page.getByTestId('cosmic-event-stage')).toHaveCount(0);
    await expect(page.getByTestId('lucky-tier-message')).toHaveAttribute('data-state', 'holding');
    await expect(page.getByTestId('lucky-tier-message')).toHaveAttribute('data-settled', 'true');
    await expect(page.getByTestId('lucky-meter-home')).toBeVisible();
    await expect(page.getByTestId('lucky-meter-countdown')).toBeVisible();
    await expect(page.getByTestId('lucky-meter-value')).not.toHaveAttribute('data-value', '0');

    // The completed vessel is highlighted by its static rim glow, not by the
    // 1.6 s scale and opacity animation used when motion is allowed.
    const highlight = page.getByTestId('lucky-vessel-highlight');
    await expect(highlight).toHaveClass(/is-active/);
    await expect(highlight).toHaveCSS('animation-name', 'none');
  });
});

test.describe('Daily Resonance WebGL fallback', () => {
  test('settles on the CSS meter when WebGL is unavailable', async ({ page }) => {
    const failures: string[] = [];
    page.on('pageerror', (error) => failures.push(String(error)));

    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function getContext(
        this: HTMLCanvasElement,
        type: string,
        ...rest: unknown[]
      ) {
        if (typeof type === 'string' && type.includes('webgl')) return null;
        return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });

    await pinNoon(page);
    await seed(page, buildState({ tierId: 'medium', started: true }));
    const ring = page.getByTestId('lucky-meter-ring');
    await expect(ring).toHaveAttribute('data-meter-renderer', 'fallback');
    await expect(ring.locator('svg')).toHaveCount(0);
    await expect(page.getByTestId('lucky-meter-fallback')).toBeVisible();
    await expect(page.getByTestId('lucky-meter-home')).toBeVisible();
    await expect(page.getByTestId('lucky-number-panel')).toBeVisible();
    await expect(page.getByTestId('lucky-colour-panel')).toHaveAttribute(
      'data-vessel-fill',
      '1.000',
    );
    expect(failures).toEqual([]);
  });
});

test.describe('production responsive composition', () => {
  test('desktop finished state uses the width and keeps every reading visible', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await pinNoon(page);
    await seed(page, buildState({ tierId: 'high', started: true }));

    await expect(page.getByTestId('lucky-meter-home')).toBeVisible({ timeout: 15_000 });
    const content = page.locator('.lucky-meter-content');
    await expect(content).toHaveCSS('flex-direction', 'row');

    const stage = await page.getByTestId('lucky-meter-ring').boundingBox();
    const colour = await page.getByTestId('lucky-colour-panel').boundingBox();
    const number = await page.getByTestId('lucky-number-panel').boundingBox();
    expect(stage).not.toBeNull();
    expect(colour).not.toBeNull();
    expect(number).not.toBeNull();
    // The result column sits beside the instrument, not under it.
    expect(number!.x).toBeGreaterThan(stage!.x + stage!.width - 1);
    expect(colour!.y + colour!.height).toBeLessThanOrEqual(900);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  });

  test('tablet finished state keeps one readable column without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await pinNoon(page);
    await seed(page, buildState({ tierId: 'high', started: true }));

    await expect(page.getByTestId('lucky-meter-home')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.lucky-meter-content')).toHaveCSS('flex-direction', 'column');

    const stage = await page.getByTestId('lucky-meter-ring').boundingBox();
    const colour = await page.getByTestId('lucky-colour-panel').boundingBox();
    expect(stage).not.toBeNull();
    expect(stage!.width).toBeGreaterThanOrEqual(400);
    expect(colour!.y + colour!.height).toBeLessThanOrEqual(1180);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(820);
  });

  test('landscape phone shows the colour and number without scrolling across', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await pinNoon(page);
    await seed(page, buildState({ tierId: 'high', started: true }));

    await expect(page.getByTestId('lucky-meter-home')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.lucky-meter-content')).toHaveCSS('flex-direction', 'row');

    const colour = await page.getByTestId('lucky-colour-panel').boundingBox();
    const number = await page.getByTestId('lucky-number-panel').boundingBox();
    expect(colour).not.toBeNull();
    expect(number).not.toBeNull();
    // Both readings stay inside the 390 px viewport, side by side.
    expect(colour!.y + colour!.height).toBeLessThanOrEqual(390);
    expect(number!.y + number!.height).toBeLessThanOrEqual(390);
    expect(number!.x).toBeGreaterThan(colour!.x + colour!.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(844);
  });

  test('320 px phone stacks the readings without clipping or overlap', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await pinNoon(page);
    await seed(page, buildState({ tierId: 'high', started: true }));

    await expect(page.getByTestId('lucky-meter-home')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.lucky-meter-content')).toHaveCSS('flex-direction', 'column');

    const stage = await page.getByTestId('lucky-meter-ring').boundingBox();
    const colour = await page.getByTestId('lucky-colour-panel').boundingBox();
    const number = await page.getByTestId('lucky-number-panel').boundingBox();
    const dock = await page.getByTestId('lucky-meter-dock').boundingBox();
    const spark = await page.getByTestId('lucky-spark-finale').boundingBox();
    expect(stage).not.toBeNull();
    expect(number!.y).toBeGreaterThan(colour!.y);
    expect(stage!.x).toBeGreaterThanOrEqual(0);
    expect(stage!.x + stage!.width).toBeLessThanOrEqual(320);
    // The corner controls stop above the Spark, and the Spark above the meter.
    expect(spark!.y).toBeGreaterThanOrEqual(dock!.y + dock!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  });

  for (const viewport of [
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 412, height: 915 },
    { width: 430, height: 932 },
  ]) {
    test(`${viewport.width} px phone keeps the reading inside the viewport`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await pinNoon(page);
      await seed(page, buildState({ tierId: 'high', started: true }));

      await expect(page.getByTestId('lucky-meter-home')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('.lucky-meter-content')).toHaveCSS('flex-direction', 'column');

      const stage = await page.getByTestId('lucky-meter-ring').boundingBox();
      const colour = await page.getByTestId('lucky-colour-panel').boundingBox();
      const number = await page.getByTestId('lucky-number-panel').boundingBox();
      expect(stage).not.toBeNull();
      expect(number!.y).toBeGreaterThan(colour!.y);
      expect(stage!.x).toBeGreaterThanOrEqual(0);
      expect(stage!.x + stage!.width).toBeLessThanOrEqual(viewport.width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
        viewport.width,
      );
    });
  }
});

test.describe('Daily Resonance visual evidence', () => {
  // Opt-in only. Set LUCKY_METER_CAPTURE=1 to refresh the before/after pack.
  test.skip(
    process.env.LUCKY_METER_CAPTURE !== '1',
    'Set LUCKY_METER_CAPTURE=1 to write visual evidence screenshots.',
  );

  test('captures the arrival and each seasonal result', async ({ page }, testInfo) => {
    // Four complete seasonal rituals run in one capture; each is close to a
    // minute, so the default timeout cannot cover the set. This is a fixed
    // capture budget, not untrusted input.
    /* DevSkim: ignore DS172411 */ test.setTimeout(330_000);
    const directory = 'artifacts/lucky-meter-dimensional-20261123/after';
    const prefix = testInfo.project.name;

    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lucky-meter-start')).toHaveAttribute('data-ready', 'true', {
      timeout: 12_000,
    });
    await page.screenshot({ path: `${directory}/${prefix}-welcome.png` });

    for (const season of SEASONS) {
      const colour = seasonColour(season, 6);
      const dateKey = SEASON_DATES[season].slice(0, 10);
      await page.clock.setFixedTime(new Date(SEASON_DATES[season]));
      await page.addInitScript(
        ([key, value]) => window.localStorage.setItem(key, value),
        [
          STORAGE_KEY,
          JSON.stringify(
            buildState({ tierId: 'medium', season, colour, started: true, dateKey }),
          ),
        ],
      );
      await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(page.getByTestId('lucky-spark-finale')).toHaveAttribute(
        'data-state',
        'written',
      );
      await expect(page.getByTestId('lucky-colour-panel')).toContainText(colour.hex);
      await page.screenshot({ path: `${directory}/${prefix}-${season}.png` });
    }
  });

  test('captures the dimensional meter beats', async ({ page }, testInfo) => {
    test.slow();
    const directory = 'artifacts/lucky-meter-dimensional-20261123';
    const prefix = testInfo.project.name;

    await pinNoon(page);
    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lucky-meter-start')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    await page.screenshot({ path: `${directory}/${prefix}-arrival.png` });

    await startReveal(page);

    await page.waitForFunction(
      () => {
        const vessel = document.querySelector('[data-testid="lucky-colour-panel"]');
        return (
          vessel?.getAttribute('data-vessel-phase') === 'filling' &&
          Number(vessel.getAttribute('data-vessel-fill') ?? 0) >= 0.35
        );
      },
      null,
      { timeout: 30_000 },
    );
    await page.screenshot({ path: `${directory}/${prefix}-fill.png` });

    await page.waitForFunction(
      () => {
        const vessel = document.querySelector('[data-testid="lucky-colour-panel"]');
        const ring = document.querySelector('[data-testid="lucky-meter-ring"]');
        const reveal = Number(ring?.getAttribute('data-number-reveal') ?? 0);
        return (
          vessel?.getAttribute('data-vessel-phase') === 'transferring' &&
          reveal > 0.25 &&
          reveal < 0.95
        );
      },
      null,
      { timeout: 30_000 },
    );
    await page.screenshot({ path: `${directory}/${prefix}-transfer.png` });

    await expect(page.getByTestId('lucky-meter-dock')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('lucky-meter-countdown')).toBeVisible();
    await page.screenshot({ path: `${directory}/${prefix}-dock.png` });
  });
});
