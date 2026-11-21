import { expect, test, type Page } from '@playwright/test';
import {
  getPaletteForSeasonKey,
  getSeasonKeyForDate,
} from '../../app/lib/lucky-meter/sparks-and-seasonal-colours';

/**
 * Daily Resonance browser coverage.
 *
 * Every stored-reading scenario is seeded into Local Storage before the page
 * loads, so the result is deterministic. One real run walks the complete
 * twelve-stage storyboard; the rest resume from a stored lifecycle point so the
 * browser suite stays fast without skipping the states it protects.
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
  // The arrival runs for about 4.5 s before Start unlocks, and a cold dev
  // server compiles the route on the first hit. 30 s keeps a parallel run from
  // failing before the sequence has had a chance to begin.
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

/**
 * A run that crosses local midnight correctly clears today's reading for the
 * new day, which aborts a storyboard mid-sequence and leaves the page back at
 * its arrival screen. Pin the wall clock at midday so a long cinematic can
 * never straddle the rollover. `setFixedTime` freezes only `Date`; timers and
 * `performance.now` keep running, so the sequence still animates normally.
 */
async function pinNoon(page: Page) {
  await page.clock.setFixedTime(new Date(`${TODAY}T12:00:00`));
}

async function readStoredResult(page: Page) {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEY);
}

function settledAngle(colourId: string, season: Season) {
  const palette = getPaletteForSeasonKey(season);
  const index = Math.max(
    0,
    palette.findIndex((colour: { id: string }) => colour.id === colourId),
  );
  return ((180 - index * 30) % 360 + 360) % 360;
}

test.describe('Daily Resonance arrival and Start', () => {
  test('holds Start until the breeze has cleared, then starts the reading at 0', async ({
    page,
  }) => {
    // The readout starts at 0 and only holds it for the anticipation beat, so
    // polling the live attribute can miss it whenever the first frames after
    // Start are slow (software WebGL, a cold route compile). Record the values
    // React writes instead: the writes are ordered, so the first one is the
    // reading the reveal actually started from.
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
    // Home is in its usual top-right position from the first moment, but the
    // countdown belongs to the finished reading and is not shown yet.
    await expect(page.getByTestId('lucky-meter-home')).toBeVisible();
    await expect(page.getByTestId('lucky-meter-countdown')).toHaveCount(0);

    const button = await waitForStart(page);
    await expect(button).toBeVisible();
    await button.click();

    // Starting the reveal hides Home at once; it returns with the countdown
    // only after the Spark and the final hold.
    await expect(page.getByTestId('lucky-meter-home')).toHaveCount(0);

    const ring = page.getByTestId('lucky-meter-ring');
    await expect(ring).toHaveAttribute('data-phase', 'spin');
    // The five approved beats start at the bottom of the scale: 0 → 100 →
    // fall → rise → erratic → settle on the stored reading.
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
    // The vessel surface warms up off-screen; it must not be presented yet.
    await expect(page.getByTestId('lucky-colour-panel')).not.toBeVisible();
    const pointer = page.getByTestId('lucky-meter-pointer');
    await expect(pointer).toHaveAttribute('data-position', '6');
    // The fixed leaf must be gold before any reading exists, not only after
    // the wheel (and its gradient definitions) mounts.
    await expect(pointer.locator('#lucky-pointer-gold')).toHaveCount(1);
  });
});

test.describe('Daily Resonance storyboard', () => {
  test('stops the wheel and percentage together, then pours the colour', async ({
    page,
  }) => {
    // The storyboard alone holds this test for about 21 s before the twelve
    // segment assertions run, so the default 30 s budget is short on the mobile
    // projects under software WebGL. The assertions are unchanged; only the
    // budget grows, as it already does for the full storyboard test below.
    test.slow();
    await pinNoon(page);
    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    // `landed` is a deliberate 450 ms beat before the pour. Polling can miss it
    // on a slow runner, so record the phase transitions from the first frame.
    await page.evaluate(() => {
      const ring = document.querySelector('[data-testid="lucky-meter-ring"]');
      const phases: string[] = [];
      const vesselBeats: Array<{
        phase: string;
        reveal: number;
        fill: number;
        clip: string;
      }> = [];
      (window as Window & { __luckyMeterPhases?: string[] }).__luckyMeterPhases = phases;
      (
        window as Window & { __luckyMeterVesselBeats?: typeof vesselBeats }
      ).__luckyMeterVesselBeats = vesselBeats;
      let last = '';
      let frame = 0;
      const stop = () => {
        window.removeEventListener('pagehide', stop);
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
      };
      const sample = () => {
        const phase = ring?.getAttribute('data-phase') ?? '';
        if (phase && phase !== last) {
          phases.push(phase);
          last = phase;
        }
        // The vessel mounts only once a reading exists, so it must be looked up
        // on every frame rather than captured before Start.
        const vessel = document.querySelector('[data-testid="lucky-colour-panel"]');
        const vesselPhase = vessel?.getAttribute('data-vessel-phase') ?? '';
        if (vesselPhase) {
          const revealedNumber = document.querySelector(
            '[data-testid="lucky-meter-number-reveal"]',
          );
          vesselBeats.push({
            phase: vesselPhase,
            reveal: Number(ring?.getAttribute('data-number-reveal') ?? 0),
            fill: Number(vessel?.getAttribute('data-vessel-fill') ?? 0),
            clip: revealedNumber instanceof HTMLElement ? revealedNumber.style.clipPath : '',
          });
        }
        if (phase === 'revealed') {
          stop();
          return;
        }
        frame = window.requestAnimationFrame(sample);
      };
      window.addEventListener('pagehide', stop, { once: true });
      frame = window.requestAnimationFrame(sample);
    });
    await startReveal(page);

    const ring = page.getByTestId('lucky-meter-ring');
    const stored = (await readStoredResult(page)).result;
    const palette = getPaletteForSeasonKey(stored.season);

    await expect(ring).toHaveAttribute('data-phase', 'revealed', { timeout: 35_000 });
    const phases = await page.evaluate(
      () => (window as Window & { __luckyMeterPhases?: string[] }).__luckyMeterPhases ?? [],
    );
    expect(phases).toContain('landed');

    // The drain is the progressive reveal: at least one sampled frame had a
    // partly-drained vessel and a partly-revealed number, and the empty vessel
    // is reached only when the number is whole.
    const beats = await page.evaluate(
      () =>
        (window as Window & {
          __luckyMeterVesselBeats?: Array<{
            phase: string;
            reveal: number;
            fill: number;
            clip: string;
          }>;
        }).__luckyMeterVesselBeats ?? [],
    );
    expect(beats.some((beat) => beat.phase === 'draining')).toBe(true);
    // The approved reveal moves downward from the top edge: while the number is
    // partly shown, the clip's top inset stays zero and its bottom inset grows.
    expect(
      beats.some(
        (beat) =>
          beat.phase === 'draining' &&
          beat.reveal > 0 &&
          beat.reveal < 1 &&
          /^inset\(0(px|%)?\s/.test(beat.clip),
      ),
    ).toBe(true);
    expect(
      beats.some((beat) => beat.phase === 'draining' && beat.reveal > 0 && beat.reveal < 1),
    ).toBe(true);
    expect(
      beats.some((beat) => beat.phase === 'draining' && beat.fill > 0 && beat.fill < 1),
    ).toBe(true);
    expect(beats.some((beat) => beat.phase === 'empty' && beat.fill === 0)).toBe(true);
    await expect(page.getByTestId('lucky-meter-value')).toHaveAttribute(
      'data-value',
      String(stored.percentage),
    );
    const angle = Number(await ring.getAttribute('data-wheel-angle'));
    expect(Math.abs(angle - settledAngle(stored.colour.id, stored.season))).toBeLessThan(0.03);

    await expect(page.getByTestId('lucky-number-panel')).toBeVisible();
    await expect(page.getByTestId('lucky-number-value')).toHaveAttribute(
      'data-value',
      String(stored.luckyNumber),
    );
    await expect(page.getByTestId('lucky-colour-panel')).toBeVisible();
    // The approved sequence ends on the empty vessel, not a full one.
    await expect(page.getByTestId('lucky-colour-panel')).toHaveAttribute('data-vessel-fill', '0.000');
    await expect(page.getByTestId('lucky-colour-panel')).toContainText(stored.colour.name);
    await expect(page.getByTestId('lucky-colour-panel')).toContainText(stored.colour.hex);
    await expect(page.getByTestId('lucky-colour-panel')).toContainText(
      stored.season.charAt(0).toUpperCase() + stored.season.slice(1),
    );
    await expect(ring).toHaveAttribute('data-number-reveal', '1.00');
    await expect(page.getByTestId('lucky-number-panel')).toHaveCount(1);

    // The wheel is a real 12-segment seasonal wheel under the fixed pointer.
    const segments = page.locator('[data-testid^="lucky-meter-colour-segment-"]');
    await expect(segments).toHaveCount(12);
    for (const colour of palette) {
      await expect(
        page.getByTestId(`lucky-meter-colour-segment-${colour.id}`),
      ).toHaveCount(1);
    }
  });

  test('writes the exact tier message, celebrates, then docks Home and the countdown together', async ({
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
    await expect(page.getByTestId('lucky-meter-home')).toHaveCount(0);
    await expect(page.getByTestId('lucky-meter-countdown')).toHaveCount(0);

    await expect(page.getByTestId('cosmic-event-stage')).toHaveCount(0, {
      timeout: 45_000,
    });
    await expect(page.getByTestId('lucky-spark-cursor')).toBeVisible({ timeout: 30_000 });
    // The Spark is written glyph by glyph; under software WebGL the character
    // clock runs slower, so the content assertion allows the writing to finish.
    await expect(page.getByTestId('lucky-spark-message')).toContainText(
      stored.spark.message.slice(0, 24),
      { timeout: 20_000 },
    );
    // Home is still withheld while the maple-leaf cursor writes.
    await expect(page.getByTestId('lucky-meter-home')).toHaveCount(0);

    await expect(page.getByTestId('lucky-meter-home')).toBeVisible({ timeout: 45_000 });
    const dock = page.getByTestId('lucky-meter-home').locator('..');
    await expect(dock.getByTestId('lucky-meter-countdown')).toBeVisible();
    await expect(page.getByTestId('lucky-spark-cursor')).toHaveCount(0);
  });
});

test.describe('Daily Resonance approved fallbacks and refresh policy', () => {
  test('keeps the functional CSS vessel when WebGL is unavailable', async ({ page }) => {
    test.slow();
    await pinNoon(page);
    // Deny every WebGL context before any application script runs. The vessel
    // must still present its approved open, fill, drain and empty states.
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
    await startReveal(page);

    const panel = page.getByTestId('lucky-colour-panel');
    await expect(panel).toBeVisible({ timeout: 30_000 });
    await expect(panel).toHaveAttribute('data-vessel-renderer', 'fallback', {
      timeout: 30_000,
    });
    await expect(panel).toHaveAttribute('data-vessel-phase', /opening|filling|holding/);

    // The CSS liquid actually fills, not just the caption.
    await expect(panel).toHaveAttribute('data-vessel-phase', 'filling', {
      timeout: 20_000,
    });
    await expect
      .poll(async () => Number(await panel.getAttribute('data-vessel-fill')))
      .toBeGreaterThan(0);

    // And it drains to the highlighted empty vessel when the number is whole.
    await expect(panel).toHaveAttribute('data-vessel-phase', 'empty', {
      timeout: 30_000,
    });
    await expect(panel).toHaveAttribute('data-vessel-fill', '0.000');
    await expect(page.getByTestId('lucky-vessel-highlight')).toHaveClass(/is-active/);
    await expect(page.getByTestId('lucky-number-panel')).toBeVisible();
  });

  test('restarts a refresh celebration at the full 12,000 ms (D12)', async ({ page }) => {
    await pinNoon(page);
    // A stored legacy duration from the superseded per-tier clock must not
    // re-time the celebration, and the saved reading must not be redrawn.
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
    await expect(page.getByTestId('lucky-meter-home')).toHaveCount(0);
  });

  test('presents the reading, Spark and dock at once under reduced motion', async ({
    page,
  }) => {
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
    // Home and the countdown arrive together in the last row of the panel.
    const dock = page.getByTestId('lucky-meter-dock');
    await expect(dock.getByTestId('lucky-meter-home')).toBeVisible();
    await expect(dock.getByTestId('lucky-meter-countdown')).toBeVisible();
  });
});

test.describe('Daily Resonance seasonal palettes', () => {
  for (const season of SEASONS) {
    test(`${season} renders its own twelve exact colours and panel values`, async ({
      page,
    }) => {
      const colour = seasonColour(season, 3);
      const dateKey = SEASON_DATES[season].slice(0, 10);
      // The browser's local date decides the season, so move the clock to that
      // season before the first script runs and store the matching date key.
      await page.clock.setFixedTime(new Date(SEASON_DATES[season]));
      await seed(
        page,
        buildState({
          tierId: 'medium',
          season,
          colour,
          started: true,
          dateKey,
        }),
      );

      const palette = getPaletteForSeasonKey(season);
      await expect(page.locator('[data-testid^="lucky-meter-colour-segment-"]')).toHaveCount(12);
      await expect(page.getByTestId(`lucky-meter-colour-segment-${colour.id}`)).toHaveCount(1);
      await expect(page.getByTestId('lucky-colour-panel')).toContainText(colour.name);
      await expect(page.getByTestId('lucky-colour-panel')).toContainText(colour.hex);
      await expect(page.getByTestId('lucky-colour-panel')).toContainText(
        season.charAt(0).toUpperCase() + season.slice(1),
      );

      for (const entry of palette) {
        await expect(page.getByTestId(`lucky-meter-colour-segment-${entry.id}`)).toHaveCount(1);
      }
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
  test('resumes the message and celebration after the pour', async ({ page }) => {
    // The resumed message runs on the storyboard clock under software WebGL, so
    // a loaded runner needs the slow budget rather than the default 30 s.
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

    // `fading` still shows the written line, so accepting it keeps the resume
    // assertion honest without depending on catching the short hold window.
    await expect(page.getByTestId('lucky-tier-message')).toHaveAttribute(
      'data-state',
      /writing|holding|fading/,
      { timeout: 25_000 },
    );
    await expect(page.getByTestId('cosmic-event-stage')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('lucky-meter-home')).toHaveCount(0);
  });

  test('resumes the Spark writing after the celebration', async ({ page }) => {
    // The glyph clock is a chained per-character timer, so a busy runner
    // stretches the writing well past the ten seconds it needs unloaded.
    test.slow();
    await pinNoon(page);
    const state = buildState({
      tierId: 'low',
      started: true,
      messageCompleted: true,
      eventCompleted: true,
      sparkCompleted: false,
    });
    await seed(page, state);

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
    await expect(page.getByTestId('lucky-tier-message')).toHaveCount(0);
    await expect(page.getByTestId('lucky-meter-home')).toBeVisible();
    await expect(page.getByTestId('lucky-meter-countdown')).toBeVisible();
    await expect(page.getByTestId('lucky-meter-value')).not.toHaveAttribute('data-value', '0');
  });
});

test.describe('Daily Resonance WebGL fallback', () => {
  test('settles on the static medallion when WebGL is unavailable', async ({ page }) => {
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
    await expect(page.getByTestId('lucky-meter-ring')).toHaveAttribute(
      'data-medallion',
      'fallback',
    );
    await expect(page.getByTestId('lucky-meter-home')).toBeVisible();
    await expect(page.getByTestId('lucky-number-panel')).toBeVisible();
    expect(failures).toEqual([]);
  });
});

test.describe('Daily Resonance visual evidence', () => {
  // Opt-in only. Set LUCKY_METER_CAPTURE=1 to refresh the before/after pack.
  test.skip(
    process.env.LUCKY_METER_CAPTURE !== '1',
    'Set LUCKY_METER_CAPTURE=1 to write visual evidence screenshots.',
  );

  test('captures the arrival and each seasonal result', async ({ page }, testInfo) => {
    const directory = 'artifacts/lucky-meter-seasonal-cinematic-20261119/after';
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

  test('captures the approved vessel beats', async ({ page }, testInfo) => {
    test.slow();
    const directory = 'artifacts/lucky-meter-approved-build-20261121';
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
          vessel?.getAttribute('data-vessel-phase') === 'draining' &&
          reveal > 0.55 &&
          reveal < 0.9
        );
      },
      null,
      { timeout: 30_000 },
    );
    await page.screenshot({ path: `${directory}/${prefix}-drain.png` });

    await expect(page.getByTestId('lucky-meter-dock')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('lucky-meter-countdown')).toBeVisible();
    await page.screenshot({ path: `${directory}/${prefix}-dock.png` });
  });
});
