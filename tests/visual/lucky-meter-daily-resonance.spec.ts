import { expect, test, type Page } from '@playwright/test';

/**
 * Daily Resonance browser coverage.
 *
 * The daily result is seeded into Local Storage before the page loads, so each
 * stored-reading scenario is deterministic without touching production data or a
 * server. The dial scenario performs a real reveal, then compares the pointer's
 * resting angle with the displayed percentage.
 *
 * These tests protect the contract that the percentage alone decides the tier,
 * the event and the dial position, that the Lucky Number and Lucky Colour are
 * independent reveals that never feed the percentage, that the Spark is written
 * only after the cinematic, and that sharing, reduced motion, the WebGL fallback
 * and the cinematic lifecycle still work.
 */

const STORAGE_KEY = 'lucky-pick-canada-lucky-meter-v1';

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

/** The exact boundaries the mission defines, including both sides of each edge. */
const BOUNDARIES = [
  { percentage: 5, tier: 'low' },
  { percentage: 30, tier: 'low' },
  { percentage: 31, tier: 'medium' },
  { percentage: 65, tier: 'medium' },
  { percentage: 66, tier: 'high' },
  { percentage: 100, tier: 'high' },
] as const;

type TierId = keyof typeof TIERS;

type RevealMilestone = {
  at: number;
  phase: string | null;
  value: string | null;
  tier: string | null;
  hasNumber: boolean;
  hasColour: boolean;
  hasShare: boolean;
};

type RevealTimeline = {
  number: RevealMilestone | null;
  colour: RevealMilestone | null;
  share: RevealMilestone | null;
  event: RevealMilestone | null;
  numberBeforeLanding: boolean;
};

declare global {
  interface Window {
    __revealTimeline?: RevealTimeline;
  }
}

function tierForPercentage(percentage: number): TierId {
  if (percentage <= 30) return 'low';
  if (percentage <= 65) return 'medium';
  return 'high';
}

function localDateKey() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function buildState({
  tierId,
  percentage = TIERS[tierId].percentage,
  completed,
  sparkCompleted = completed,
  revealCompleted = completed,
  staleEvent,
  luckyNumber = TIERS[tierId].luckyNumber,
}: {
  tierId: TierId;
  percentage?: number;
  completed: boolean;
  sparkCompleted?: boolean;
  revealCompleted?: boolean;
  staleEvent?: { id: string; name: string };
  luckyNumber?: number;
}) {
  const tier = TIERS[tierId];
  const dateKey = localDateKey();
  return {
    version: 1,
    dateKey,
    result: {
      dateKey,
      percentage,
      tier: { id: tierId, label: tier.label, message: tier.message },
      event: staleEvent ?? { id: tier.event.id, name: tier.event.name },
      luckyNumber,
      colour: { id: 'maple-red', name: 'Maple Red', hex: '#B52B32', light: false },
      spark: {
        id: 'spark-01',
        message: 'Even a small step forward can change the direction of your day.',
      },
      createdAt: Date.now(),
    },
    history: {
      percentages: [percentage],
      numbers: [luckyNumber],
      colours: ['maple-red'],
      sparks: ['spark-01'],
    },
    eventCompleted: completed,
    revealCompleted,
    sparkCompleted,
    stageDurationMs: tier.event.duration,
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

/**
 * Presses Start and confirms the reveal actually began.
 *
 * A click that lands before React has hydrated is silently lost, which is a
 * property of the dev server on a slow mobile viewport rather than of the
 * experience. Retrying until the ring leaves its idle phase makes the browser
 * test deterministic without weakening what it asserts.
 */
async function startReveal(page: Page) {
  const button = page.getByRole('button', { name: /Reveal My Resonance/i });
  await expect(button).toBeVisible();
  await expect(async () => {
    await button.click();
    await expect(page.getByTestId('lucky-meter-ring')).not.toHaveAttribute(
      'data-phase',
      'idle',
      { timeout: 1500 },
    );
  }).toPass({ timeout: 15_000 });
}

async function readDialAngle(page: Page) {
  const value = await page.getByTestId('lucky-meter-ring').getAttribute('data-dial-angle');
  return Number(value);
}

/** The approved palette, in ring order, for the settled colour angle. */
const COLOUR_IDS = [
  'maple-red',
  'forest-green',
  'navy-blue',
  'burgundy',
  'royal-blue',
  'charcoal',
  'cream',
  'mustard-gold',
  'winter-white',
  'deep-teal',
  'pumpkin-orange',
  'warm-camel',
] as const;

const shortestAngle = (degrees: number) => ((degrees % 360) + 360) % 360;

async function readStoredResult(page: Page) {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEY);
}

test.describe('Daily Resonance percentage mapping', () => {
  for (const { percentage, tier } of BOUNDARIES) {
    test(`${percentage}% is ${tier} with its tier's event`, async ({ page }) => {
      await seed(page, buildState({ tierId: tier, percentage, completed: true }));

      // A cold dev server can take a while to compile and hydrate the route;
      // the assertion waits for the client-rendered reading rather than
      // shortening the check.
      await expect(page.getByTestId('lucky-meter-value')).toHaveAttribute(
        'data-value',
        String(percentage),
        { timeout: 20_000 },
      );
      await expect(page.locator('.lucky-tier-plate__label')).toHaveText(TIERS[tier].label);
      await expect(page.getByTestId('lucky-number-panel')).toBeVisible();
      await expect(page.getByText(TIERS[tier].event.name).first()).toBeVisible();
    });
  }

  for (const tierId of Object.keys(TIERS) as TierId[]) {
    test(`${tierId} shows the saved independent Lucky Number and colour`, async ({ page }) => {
      await seed(page, buildState({ tierId, completed: true }));

      const numberPanel = page.getByTestId('lucky-number-panel');
      await expect(numberPanel).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId('lucky-number-value')).toHaveAttribute(
        'data-value',
        String(TIERS[tierId].luckyNumber),
      );
      await expect(numberPanel.locator('h2')).toHaveText('Lucky Number');
      await expect(page.locator('.lucky-tier-plate__label')).toHaveText(TIERS[tierId].label);
      await expect(page.getByText(TIERS[tierId].event.name).first()).toBeVisible();
      const colourPanel = page.getByTestId('lucky-colour-panel');
      await expect(colourPanel).toBeVisible();
      await expect(colourPanel.locator('h2')).toHaveText('Lucky Colour');
      await expect(colourPanel.getByText('Maple Red')).toBeVisible();
      await expect(colourPanel.getByText('#B52B32')).toBeVisible();
    });
  }

  test('normalises a stale saved tier and event from its percentage', async ({ page }) => {
    // The percentage is High, but the stored payload claims Low/Meteor.
    await seed(
      page,
      buildState({
        tierId: 'low',
        percentage: 91,
        completed: true,
        staleEvent: { id: 'meteor', name: 'Meteor Shower' },
      }),
    );

    await expect(page.getByTestId('lucky-meter-value')).toHaveAttribute('data-value', '91', {
      timeout: 20_000,
    });
    await expect(page.locator('.lucky-tier-plate__label')).toHaveText('High Resonance');
    await expect(page.getByText('Fireworks').first()).toBeVisible();
    // The rest of the saved reading is preserved rather than rerolled.
    await expect(page.getByTestId('lucky-number-value')).toHaveAttribute('data-value', '12');
    await expect(page.getByTestId('lucky-colour-panel').getByText('Maple Red')).toBeVisible();
    await expect(page.getByTestId('lucky-spark-message')).toHaveText(
      /Even a small step forward/,
    );
  });

  test('migrates a saved result without a Lucky Number exactly once', async ({ page }) => {
    const state = buildState({ tierId: 'high', completed: true });
    const legacy = {
      ...state,
      result: { ...state.result } as Record<string, unknown>,
      history: { ...state.history } as Record<string, unknown>,
    };
    delete legacy.result.luckyNumber;
    delete legacy.history.numbers;
    // seed()'s init script re-runs on every navigation, which would restore the
    // pre-migration payload on reload. Write the legacy payload once instead, so
    // the reload proves the migrated number was actually persisted.
    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    await page.evaluate(
      ([key, value]) => window.localStorage.setItem(key, value),
      [STORAGE_KEY, JSON.stringify(legacy)],
    );
    await page.reload({ waitUntil: 'domcontentloaded' });

    // The migration runs in the client effect, so wait for the reading first.
    await expect(page.getByTestId('lucky-number-value')).toBeVisible({ timeout: 20_000 });
    const displayed = Number(
      await page.getByTestId('lucky-number-value').getAttribute('data-value'),
    );
    expect(displayed).toBeGreaterThanOrEqual(1);
    expect(displayed).toBeLessThanOrEqual(50);

    const stored = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, STORAGE_KEY);
    expect(stored.result.luckyNumber).toBe(displayed);
    const migrated = displayed;

    // A reload keeps the same number and every other saved value.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lucky-number-value')).toHaveAttribute(
      'data-value',
      String(migrated),
      { timeout: 20_000 },
    );
    await expect(page.getByTestId('lucky-meter-value')).toHaveAttribute('data-value', '91');
    await expect(
      page.getByTestId('lucky-colour-panel').getByText('Maple Red'),
    ).toBeVisible();
  });
});

test.describe('Daily Resonance dial landing', () => {
  test('stops on the displayed percentage and reveals that percentage’s tier', async ({
    page,
  }) => {
    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    await startReveal(page);

    const spinning = await readDialAngle(page);
    expect(Number.isFinite(spinning)).toBe(true);

    await expect(page.getByTestId('lucky-meter-ring')).toHaveAttribute(
      'data-phase',
      'landed',
      { timeout: 12_000 },
    );

    const percentage = Number(
      await page.getByTestId('lucky-meter-value').getAttribute('data-value'),
    );
    expect(percentage).toBeGreaterThanOrEqual(5);
    expect(percentage).toBeLessThanOrEqual(100);

    // The pointer's resting position is exactly the percentage.
    const angle = await readDialAngle(page);
    const expected = (percentage * 3.6) % 360;
    const actual = ((angle % 360) + 360) % 360;
    expect(Math.abs(actual - expected)).toBeLessThan(0.02);

    const tierId = tierForPercentage(percentage);
    await expect(page.locator('.lucky-tier-plate__label')).toHaveText(TIERS[tierId].label);
    await expect(page.getByText(TIERS[tierId].event.name).first()).toBeVisible();

    // The Lucky Number and colour are their own independent reveals.
    await expect(page.getByTestId('lucky-number-panel')).toBeVisible({ timeout: 4000 });
    const luckyNumber = Number(
      await page.getByTestId('lucky-number-value').getAttribute('data-value'),
    );
    expect(luckyNumber).toBeGreaterThanOrEqual(1);
    expect(luckyNumber).toBeLessThanOrEqual(50);
    await expect(page.getByTestId('lucky-colour-panel')).toBeVisible();

    // The number pointer is a separate dial with its own resting angle.
    const numberAngle = Number(
      await page.getByTestId('lucky-meter-ring').getAttribute('data-number-angle'),
    );
    const expectedNumberAngle = ((luckyNumber - 1) * 7.2 + 3.6) % 360;
    expect(Math.abs(((numberAngle % 360) + 360) % 360 - expectedNumberAngle)).toBeLessThan(0.02);
    await expect(page.getByTestId('lucky-meter-ring')).toHaveAttribute(
      'data-number-settled',
      'true',
    );
    await expect(page.getByTestId('lucky-meter-ring')).toHaveAttribute(
      'data-colour-settled',
      'true',
    );
    // The selected colour is settled under the colour ring's marker.
    await expect(page.getByTestId('lucky-meter-ring')).toHaveAttribute(
      'data-colour-id',
      /maple-red|forest-green|navy-blue|burgundy|royal-blue|charcoal|cream|mustard-gold|winter-white|deep-teal|pumpkin-orange|warm-camel/,
    );
  });

  test('paints the dial index from its own elements even with no dial CSS', async ({ page }) => {
    await seed(page, buildState({ tierId: 'medium', completed: true }));

    await expect(page.getByTestId('lucky-meter-value')).toHaveAttribute('data-value', '57', {
      timeout: 20_000,
    });

    // This reproduces the production defect: the deployed stylesheet carried no
    // `.resonance-dial*` rule, so the index has to paint from its own elements.
    const dialRules = await page.evaluate(() => {
      const countDialRules = (rules: CSSRuleList): number =>
        Array.from(rules).reduce((total, rule) => {
          const selectorText = (rule as CSSStyleRule).selectorText ?? '';
          const nested = (rule as CSSGroupingRule).cssRules;
          const nestedCount = nested ? countDialRules(nested) : 0;
          return total + (selectorText.includes('.resonance-dial') ? 1 : 0) + nestedCount;
        }, 0);
      return Array.from(document.styleSheets).reduce((total, sheet) => {
        try {
          return total + countDialRules(sheet.cssRules);
        } catch {
          return total;
        }
      }, 0);
    });
    expect(dialRules).toBe(0);

    const arm = page.getByTestId('lucky-meter-dial-arm');
    const head = page.getByTestId('lucky-meter-dial-head');
    await expect(arm).toBeVisible();
    await expect(head).toBeVisible();

    const armStyle = await arm.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        position: style.position,
        width: style.width,
        height: style.height,
        borderRadius: style.borderRadius,
        backgroundImage: style.backgroundImage,
      };
    });
    expect(armStyle.position).toBe('absolute');
    expect(armStyle.width).toBe('2px');
    expect(parseFloat(armStyle.height)).toBeGreaterThan(20);
    expect(parseFloat(armStyle.borderRadius)).toBeGreaterThan(0);
    expect(armStyle.backgroundImage).toContain('linear-gradient');

    const headStyle = await head.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        position: style.position,
        width: style.width,
        height: style.height,
        backgroundImage: style.backgroundImage,
      };
    });
    expect(headStyle.position).toBe('absolute');
    expect(headStyle.width).toBe('9px');
    expect(headStyle.height).toBe('9px');
    expect(headStyle.backgroundImage).toContain('radial-gradient');

    const angle = await readDialAngle(page);
    expect(((angle % 360) + 360) % 360).toBeCloseTo((57 * 3.6) % 360, 1);
  });

  test('settles percentage, then number, then colour, then starts the cinematic', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const timeline: RevealTimeline = {
        number: null,
        colour: null,
        share: null,
        event: null,
        numberBeforeLanding: false,
      };
      window.__revealTimeline = timeline;

      const ring = () =>
        document.querySelector('[data-testid="lucky-meter-ring"]')?.getAttribute('data-phase') ??
        null;
      const hasNumber = () => Boolean(document.querySelector('[data-testid="lucky-number-panel"]'));
      const hasColour = () => Boolean(document.querySelector('[data-testid="lucky-colour-panel"]'));
      const hasShare = () =>
        Array.from(document.querySelectorAll('button')).some((button) =>
          /Share My Resonance/i.test(button.textContent ?? ''),
        );
      const milestone = (at: number): RevealMilestone => ({
        at,
        phase: ring(),
        value:
          document
            .querySelector('[data-testid="lucky-meter-value"]')
            ?.getAttribute('data-value') ?? null,
        tier: document.querySelector('.lucky-tier-plate__label')?.textContent?.trim() ?? null,
        hasNumber: hasNumber(),
        hasColour: hasColour(),
        hasShare: hasShare(),
      });

      new MutationObserver(() => {
        const at = performance.now();
        if (hasNumber() && ring() !== 'landed') timeline.numberBeforeLanding = true;
        if (!timeline.number && hasNumber()) timeline.number = milestone(at);
        if (!timeline.colour && hasColour()) timeline.colour = milestone(at);
        if (!timeline.share && hasShare()) timeline.share = milestone(at);
        if (!timeline.event && document.querySelector('[data-testid="cosmic-event-stage"]')) {
          timeline.event = milestone(at);
        }
      }).observe(document, { childList: true, subtree: true });
    });

    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    await startReveal(page);

    await expect(page.getByTestId('lucky-meter-ring')).toHaveAttribute(
      'data-phase',
      'landed',
      { timeout: 12_000 },
    );

    await expect(page.getByTestId('lucky-number-panel')).toBeVisible({ timeout: 4000 });
    await expect(
      page.getByTestId('lucky-number-panel').locator('h2'),
    ).toHaveText('Lucky Number');
    await expect(
      page.getByTestId('lucky-colour-panel').locator('h2'),
    ).toHaveText('Lucky Colour', { timeout: 4000 });
    await expect(page.getByRole('button', { name: /Share My Resonance/i })).toBeVisible();
    await expect(page.getByTestId('cosmic-event-stage')).toBeVisible({ timeout: 4000 });

    const timeline = await page.evaluate(() => window.__revealTimeline);
    expect(timeline?.numberBeforeLanding).toBe(false);
    expect(timeline?.number).not.toBeNull();
    expect(timeline?.colour).not.toBeNull();
    expect(timeline?.share).not.toBeNull();
    expect(timeline?.event).not.toBeNull();

    expect(timeline?.number?.phase).toBe('landed');
    const landedValue = Number(timeline?.number?.value);
    expect(landedValue).toBeGreaterThanOrEqual(5);
    expect(landedValue).toBeLessThanOrEqual(100);
    expect(timeline?.number?.tier).toBe(TIERS[tierForPercentage(landedValue)].label);

    // Number, then colour and details, then the cinematic.
    expect(timeline?.colour?.hasNumber).toBe(true);
    expect(timeline?.share?.hasColour).toBe(true);
    expect(timeline?.event?.hasShare).toBe(true);
    expect(timeline?.number?.at ?? -1).toBeLessThanOrEqual(timeline?.colour?.at ?? -1);
    expect(timeline?.colour?.at ?? -1).toBeLessThanOrEqual(timeline?.event?.at ?? -1);

    // The Spark is not written and the countdown is not shown while the
    // cinematic is running.
    await expect(page.getByTestId('lucky-spark-message')).toHaveCount(0);
    await expect(page.getByTestId('lucky-meter-countdown')).toHaveCount(0);
  });
});

test.describe('Daily Resonance reveal invariants', () => {
  test('starts all three motions together and lands each on its own stored value', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const trace = {
        start: null as number | null,
        startValues: { dial: null, number: null, colour: null } as Record<string, number | null>,
        firstMove: { dial: null, number: null, colour: null } as Record<string, number | null>,
        percentageSettled: null as number | null,
        numberSettled: null as number | null,
        colourSettled: null as number | null,
        stage: null as number | null,
        landings: {
          numberAngle: null,
          number: null,
          colourAngle: null,
          colourId: null,
        } as Record<string, number | string | null>,
      };
      (window as unknown as { __revealTrace: typeof trace }).__revealTrace = trace;

      const read = (element: Element | null, name: string) => element?.getAttribute(name) ?? null;
      const num = (element: Element | null, name: string) => {
        const raw = read(element, name);
        return raw === null ? null : Number(raw);
      };
      const moved = (current: number | null, previous: number | null) =>
        current === null || previous === null
          ? false
          : Math.abs((((current - previous) % 360) + 540) % 360 - 180) > 0.5;
      const attributes = {
        dial: 'data-dial-angle',
        number: 'data-number-angle',
        colour: 'data-colour-angle',
      } as const;

      // A MutationObserver records the real DOM transition instead of sampling
      // once per animation frame, which on a throttled mobile viewport can be
      // more than 100 ms late.
      const inspect = (element: Element) => {
        const phase = read(element, 'data-phase');
        const now = performance.now();
        // The anticipation also reports `scrambling`, but the three angles are
        // deliberately absent until the motions begin. Start the trace on the
        // first frame where all three are present, so the hold is excluded.
        if (
          phase === 'scrambling' &&
          num(element, attributes.dial) !== null &&
          num(element, attributes.number) !== null &&
          num(element, attributes.colour) !== null
        ) {
          if (trace.start === null) {
            trace.start = now;
            trace.startValues = {
              dial: num(element, attributes.dial),
              number: num(element, attributes.number),
              colour: num(element, attributes.colour),
            };
          }
          (Object.keys(attributes) as Array<keyof typeof attributes>).forEach((key) => {
            if (
              trace.firstMove[key] === null &&
              moved(num(element, attributes[key]), trace.startValues[key])
            ) {
              trace.firstMove[key] = now;
            }
          });
        }
        if (trace.percentageSettled === null && phase === 'landed') trace.percentageSettled = now;
        if (trace.numberSettled === null && read(element, 'data-number-settled') === 'true') {
          trace.numberSettled = now;
        }
        if (trace.colourSettled === null && read(element, 'data-colour-settled') === 'true') {
          trace.colourSettled = now;
        }
        if (
          trace.stage === null &&
          document.querySelector('[data-testid="cosmic-event-stage"]')
        ) {
          trace.stage = now;
        }
      };

      const attach = () => {
        const element = document.querySelector('[data-testid="lucky-meter-ring"]');
        if (!element) return false;
        new MutationObserver(() => inspect(element)).observe(element, { attributes: true });
        new MutationObserver(() => inspect(element)).observe(document.documentElement, {
          childList: true,
          subtree: true,
        });
        inspect(element);
        return true;
      };

      if (!attach()) {
        const timer = window.setInterval(() => {
          if (attach()) window.clearInterval(timer);
        }, 25);
      }
    });

    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    await startReveal(page);
    await expect(page.getByTestId('cosmic-event-stage')).toBeVisible({ timeout: 20_000 });

    const trace = await page.evaluate(
      () => (window as unknown as { __revealTrace: Record<string, any> }).__revealTrace,
    );
    const stored = await readStoredResult(page);
    const result = stored.result;

    // All three motions were already running inside the first sampled window.
    const moves = [trace.firstMove.dial, trace.firstMove.number, trace.firstMove.colour];
    expect(moves.every((value) => typeof value === 'number')).toBe(true);
    expect(Math.max(...moves) - Math.min(...moves)).toBeLessThan(120);

    // Staggered settles in the documented order, each roughly a third of a turn
    // apart, and the cinematic only after the last one. The gaps are asserted
    // rather than the absolute offsets because the first reveal frame can be
    // delayed by the medallion's first paint.
    expect(trace.percentageSettled).toBeLessThan(trace.numberSettled);
    expect(trace.numberSettled).toBeLessThan(trace.colourSettled);
    expect(trace.colourSettled).toBeLessThan(trace.stage);
    // The percentage owns roughly the first 3.2 s of the motion window.
    expect(trace.percentageSettled - trace.start).toBeGreaterThan(2500);
    expect(trace.percentageSettled - trace.start).toBeLessThan(4200);
    // Each settle is visibly apart from the one before it, roughly two seconds
    // at a time, while the exact schedule lives in the unit suites.
    expect(trace.numberSettled - trace.percentageSettled).toBeGreaterThan(1400);
    expect(trace.numberSettled - trace.percentageSettled).toBeLessThan(3000);
    expect(trace.colourSettled - trace.numberSettled).toBeGreaterThan(1400);
    expect(trace.colourSettled - trace.numberSettled).toBeLessThan(3000);
    // The coordinated motions finish inside roughly 7–8 seconds.
    expect(trace.colourSettled - trace.start).toBeGreaterThan(6500);
    expect(trace.colourSettled - trace.start).toBeLessThan(8800);
    // The cinematic follows the last settle rather than overlapping it. The
    // observer can see the stage mutation before React paints the colour flag,
    // so this only proves a real separation; the exact 420 ms hand-off is
    // asserted in the unit suite.
    expect(trace.stage - trace.colourSettled).toBeGreaterThan(120);
    expect(trace.stage - trace.colourSettled).toBeLessThan(900);

    // At rest, each motion sits on the value that was already stored for it. The
    // pointers keep their whole-turn sweep, so angles are compared modulo 360.
    const rest = await page.evaluate(() => {
      const ring = document.querySelector('[data-testid="lucky-meter-ring"]');
      const attr = (name: string) => ring?.getAttribute(name) ?? null;
      return {
        number: attr('data-number'),
        numberAngle: attr('data-number-angle'),
        colourId: attr('data-colour-id'),
        colourAngle: attr('data-colour-angle'),
        dialAngle: attr('data-dial-angle'),
      };
    });
    expect(rest.number).toBe(String(result.luckyNumber));
    expect(shortestAngle(Number(rest.numberAngle))).toBeCloseTo(
      (result.luckyNumber - 1) * 7.2 + 3.6,
      1,
    );
    expect(rest.colourId).toBe(result.colour.id);
    expect(shortestAngle(Number(rest.colourAngle))).toBeCloseTo(
      shortestAngle(-COLOUR_IDS.indexOf(result.colour.id) * 30),
      1,
    );
    expect(shortestAngle(Number(rest.dialAngle))).toBeCloseTo(
      shortestAngle(result.percentage * 3.6),
      1,
    );

    // The reveal rewrote nothing: the same reading is still stored.
    const after = await readStoredResult(page);
    expect(after.result).toEqual(stored.result);
    expect(after.revealCompleted).toBe(true);
    expect(after.eventCompleted).toBe(false);
  });

  test('the number pointer and colour ring represent their own stored values', async ({
    page,
  }) => {
    await seed(page, buildState({ tierId: 'medium', completed: true, sparkCompleted: true }));
    const ring = page.getByTestId('lucky-meter-ring');

    await expect(ring).toHaveAttribute('data-number-settled', 'true');
    await expect(ring).toHaveAttribute('data-colour-settled', 'true');

    // 57% is 205.2°, Lucky Number 27 is 190.8°, Maple Red is the ring's 0°.
    expect(Number(await ring.getAttribute('data-dial-angle'))).toBeCloseTo(205.2, 1);
    expect(Number(await ring.getAttribute('data-number-angle'))).toBeCloseTo(190.8, 1);
    expect(await ring.getAttribute('data-number')).toBe('27');
    expect(await ring.getAttribute('data-colour-id')).toBe('maple-red');
    expect(shortestAngle(Number(await ring.getAttribute('data-colour-angle')))).toBeCloseTo(0, 1);

    // The pointer does not encode the percentage.
    expect(await ring.getAttribute('data-number')).not.toBe('57');
    expect(Number(await ring.getAttribute('data-number-angle'))).not.toBeCloseTo(205.2, 1);

    await expect(page.getByTestId('lucky-number-value')).toHaveAttribute('data-value', '27');
    await expect(page.getByTestId('lucky-colour-panel')).toContainText('Maple Red');
    await expect(page.getByTestId('lucky-colour-panel')).toContainText('#B52B32');

    // The colour ring sits at 77% of the coin's radius, so the percentage text
    // must stay well inside it and can never be covered.
    const coin = await page.getByTestId('lucky-meter-medallion').boundingBox();
    const value = await page.getByTestId('lucky-meter-value').boundingBox();
    expect(coin).not.toBeNull();
    expect(value).not.toBeNull();
    if (coin && value) {
      const centre = { x: coin.x + coin.width / 2, y: coin.y + coin.height / 2 };
      const radius = coin.width / 2;
      const corners = [
        { x: value.x, y: value.y },
        { x: value.x + value.width, y: value.y },
        { x: value.x, y: value.y + value.height },
        { x: value.x + value.width, y: value.y + value.height },
      ];
      const furthest = Math.max(
        ...corners.map((corner) => Math.hypot(corner.x - centre.x, corner.y - centre.y)),
      );
      expect(furthest).toBeLessThan(radius * 0.6);
    }
  });

  test('resumes a stored mid-reveal reading without redrawing or skipping it', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as unknown as { __loadAt: number }).__loadAt = performance.now();
    });
    // Exactly the payload a refresh during the reveal leaves behind.
    await seed(
      page,
      buildState({ tierId: 'medium', completed: false, revealCompleted: false, sparkCompleted: false }),
    );

    const stored = await readStoredResult(page);
    expect(stored.revealCompleted).toBe(false);
    expect(stored.eventCompleted).toBe(false);
    expect(stored.result).toMatchObject({
      percentage: 57,
      luckyNumber: 27,
      colour: { id: 'maple-red' },
    });

    await expect(page.getByTestId('cosmic-event-stage')).toBeVisible({ timeout: 20_000 });
    const stageDelay = await page.evaluate(() => {
      const stage = document.querySelector('[data-testid="cosmic-event-stage"]');
      const loadAt = (window as unknown as { __loadAt: number }).__loadAt;
      return stage ? performance.now() - loadAt : -1;
    });
    // The cinematic waited for the whole coordinated reveal instead of starting
    // at once: 500 ms of anticipation plus the 7.4 s three-motion sequence.
    expect(stageDelay).toBeGreaterThan(6800);
    expect(stageDelay).toBeLessThan(12_000);

    // Those motions settled on the stored values, then the cinematic began.
    await expect(page.getByTestId('lucky-number-value')).toHaveAttribute('data-value', '27');
    await expect(page.getByTestId('lucky-colour-panel')).toContainText('#B52B32');
    await expect(page.getByTestId('lucky-meter-ring')).toHaveAttribute(
      'data-number-settled',
      'true',
    );
    await expect(page.getByTestId('lucky-meter-ring')).toHaveAttribute(
      'data-colour-settled',
      'true',
    );

    const after = await readStoredResult(page);
    expect(after.result).toEqual(stored.result);
    expect(after.history).toEqual(stored.history);
    expect(after.revealCompleted).toBe(true);
  });
});

test.describe('Daily Resonance arrival leaves', () => {
  test('shows leaves on entry, lifts them on the breeze and clears before Start', async ({
    page,
  }) => {
    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });

    const leaves = page.getByTestId('lucky-meter-arrival-leaves');
    await expect(leaves).toBeVisible({ timeout: 20_000 });
    await expect(leaves).toHaveAttribute('data-phase', /resting|lifting/);
    // The introduction never blocks Start.
    await expect(page.getByRole('button', { name: /Reveal My Resonance/i })).toBeVisible();

    // The breeze arrives about a second in and the canvas leaves the DOM once
    // every leaf has crossed the sky.
    await expect(leaves).toHaveAttribute('data-phase', 'lifting', { timeout: 5_000 });
    await expect(leaves).toHaveCount(0, { timeout: 10_000 });
    await expect(page.getByRole('button', { name: /Reveal My Resonance/i })).toBeVisible();
  });
});

test.describe('Daily Resonance Little Spark finale', () => {
  test('writes the Spark after the cinematic, then shows the countdown beneath Home', async ({
    page,
  }) => {
    await seed(page, buildState({ tierId: 'medium', completed: false, sparkCompleted: false }));

    // The stored result resumes its cinematic immediately.
    await expect(page.getByTestId('cosmic-event-stage')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('lucky-meter-home')).toHaveCount(0);
    await expect(page.getByTestId('lucky-meter-countdown')).toHaveCount(0);
    await expect(page.getByTestId('lucky-spark-message')).toHaveCount(0);

    // Home returns with the finished cinematic; a one-second hold, then the
    // tiny golden cursor writes the Spark in the sky.
    await expect(page.getByTestId('lucky-meter-home')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('cosmic-event-stage')).toHaveCount(0);
    await expect(page.getByTestId('lucky-meter-countdown')).toHaveCount(0);

    const spark = page.getByTestId('lucky-spark-finale');
    await expect(page.getByTestId('lucky-spark-cursor')).toBeVisible({ timeout: 15_000 });

    // The Spark is written into the sky: no panel background, border or inset.
    const skyText = await spark.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        borderTopWidth: style.borderTopWidth,
        paddingTop: style.paddingTop,
      };
    });
    expect(skyText.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(skyText.borderTopWidth).toBe('0px');
    expect(skyText.paddingTop).toBe('0px');

    await expect(spark).toHaveAttribute('data-state', 'written', { timeout: 15_000 });
    await expect(page.getByTestId('lucky-spark-cursor')).toHaveCount(0);
    await expect(page.getByTestId('lucky-spark-message')).toHaveText(
      /Even a small step forward/,
    );
    // The countdown is rendered beneath Home, not inside the result panels.
    const dock = page.getByTestId('lucky-meter-home').locator('..');
    await expect(dock.getByTestId('lucky-meter-countdown')).toBeVisible();

    // The completed message stays visible.
    await page.waitForTimeout(1200);
    await expect(page.getByTestId('lucky-spark-message')).toHaveText(
      /Even a small step forward/,
    );
  });

  test('does not replay a finished cinematic when resuming the unfinished Spark', async ({
    page,
  }) => {
    await seed(page, buildState({ tierId: 'high', completed: true, sparkCompleted: false }));

    await expect(page.getByTestId('lucky-meter-home')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('cosmic-event-stage')).toHaveCount(0);
    await expect(page.getByTestId('lucky-spark-finale')).toHaveAttribute(
      'data-state',
      'writing',
    );
    await expect(page.getByTestId('lucky-meter-countdown')).toHaveCount(0);
    await expect(page.getByTestId('lucky-spark-finale')).toHaveAttribute(
      'data-state',
      'written',
      { timeout: 15_000 },
    );
    await expect(page.getByTestId('lucky-meter-countdown')).toBeVisible();
  });

  test('keeps a fully completed reading, Spark and countdown after a reload', async ({
    page,
  }) => {
    await seed(page, buildState({ tierId: 'high', completed: true, sparkCompleted: true }));

    await expect(page.getByTestId('lucky-spark-message')).toHaveText(
      /Even a small step forward/,
      { timeout: 20_000 },
    );
    await expect(page.getByTestId('lucky-meter-countdown')).toBeVisible();
    await expect(page.getByTestId('cosmic-event-stage')).toHaveCount(0);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lucky-spark-message')).toHaveText(
      /Even a small step forward/,
      { timeout: 20_000 },
    );
    await expect(page.getByTestId('lucky-meter-countdown')).toBeVisible();
  });
});

test.describe('Daily Resonance reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('keeps the arrival leaves at rest instead of animating them', async ({ page }) => {
    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });

    const leaves = page.getByTestId('lucky-meter-arrival-leaves');
    await expect(leaves).toBeVisible({ timeout: 20_000 });
    await expect(leaves).toHaveAttribute('data-phase', 'resting');
    // The canvas removes itself after a brief hold (~1500 ms) even under reduced
    // motion, so the DOM element should be gone before 3 seconds have elapsed.
    await expect(leaves).toHaveCount(0, { timeout: 3_000 });
    await expect(page.getByRole('button', { name: /Reveal My Resonance/i })).toBeVisible();
  });

  test('presents the whole reading calmly with the dial already at its value', async ({
    page,
  }) => {
    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    await startReveal(page);

    await expect(page.getByTestId('lucky-number-panel')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('lucky-colour-panel')).toBeVisible();
    await expect(page.getByTestId('lucky-spark-message')).not.toBeEmpty();
    await expect(page.getByRole('button', { name: /Share My Resonance/i })).toBeVisible();
    // The arrival is static under reduced motion; Start is never blocked.
    await expect(page.getByTestId('lucky-meter-arrival-leaves')).toHaveCount(0);
    await expect(page.getByTestId('cosmic-event-stage')).toHaveCount(0);
    await expect(page.getByTestId('lucky-meter-home')).toBeVisible();
    // No writing cursor under reduced motion; the countdown is available
    // immediately and the completed message is already in the sky.
    await expect(page.getByTestId('lucky-spark-cursor')).toHaveCount(0);
    await expect(page.getByTestId('lucky-meter-countdown')).toBeVisible();

    const percentage = Number(
      await page.getByTestId('lucky-meter-value').getAttribute('data-value'),
    );
    const angle = await readDialAngle(page);
    const actual = ((angle % 360) + 360) % 360;
    expect(Math.abs(actual - ((percentage * 3.6) % 360))).toBeLessThan(0.02);
  });
});

test.describe('Daily Resonance WebGL fallback', () => {
  test('completes and returns Home when WebGL is unavailable', async ({ page }) => {
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

    await seed(page, buildState({ tierId: 'medium', completed: false, sparkCompleted: true }));
    await expect(page.getByTestId('cosmic-event-stage')).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByTestId('lucky-number-panel').locator('h2'),
    ).toHaveText('Lucky Number');
    await expect(page.getByTestId('lucky-meter-home')).toHaveCount(0);

    // The safety timer completes the stage within its documented duration.
    await expect(page.getByTestId('lucky-meter-home')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('cosmic-event-stage')).toHaveCount(0);
    expect(failures).toEqual([]);
  });
});

test.describe('Daily Resonance visual evidence', () => {
  // Opt-in only: CI keeps the standard run free of artifact writes. Set
  // LUCKY_METER_CAPTURE=1 to refresh the task's before/after screenshots.
  test.skip(
    process.env.LUCKY_METER_CAPTURE !== '1',
    'Set LUCKY_METER_CAPTURE=1 to write visual evidence screenshots.',
  );

  test('captures the welcome reading and the landed result', async ({ page }, testInfo) => {
    const directory = 'artifacts/lucky-meter-cinematic-flow-20261118/after';
    const prefix = `${testInfo.project.name}`;

    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Reveal My Resonance/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('lucky-meter-arrival-leaves')).toBeVisible();
    await page.screenshot({ path: `${directory}/${prefix}-welcome-arrival.png` });

    await startReveal(page);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${directory}/${prefix}-dial-spin.png` });
    await expect(page.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'landed', {
      timeout: 15_000,
    });
    await page.screenshot({ path: `${directory}/${prefix}-landed.png` });

    await expect(page.getByRole('button', { name: /Share My Resonance/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('lucky-spark-cursor')).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: `${directory}/${prefix}-sky-writing.png` });
    await expect(page.getByTestId('lucky-meter-countdown')).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: `${directory}/${prefix}-result.png` });
  });
});

test.describe('Daily Resonance cleanup', () => {
  test('removes the stage and restores Home after the cinematic', async ({ page }) => {
    const failures: string[] = [];
    page.on('pageerror', (error) => failures.push(String(error)));

    await seed(page, buildState({ tierId: 'high', completed: false, sparkCompleted: true }));
    await expect(page.getByTestId('cosmic-event-stage')).toBeVisible({ timeout: 20_000 });

    await expect(page.getByTestId('lucky-meter-home')).toBeVisible({ timeout: 14_000 });
    await expect(page.getByTestId('cosmic-event-stage')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Share My Resonance/i })).toBeVisible();
    expect(failures).toEqual([]);
  });
});
