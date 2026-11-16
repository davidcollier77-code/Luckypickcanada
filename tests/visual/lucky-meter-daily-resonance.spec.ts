import { expect, test, type Page } from '@playwright/test';

/**
 * Daily Resonance browser coverage.
 *
 * The daily result is seeded into Local Storage before the page loads, so each
 * stored-reading scenario is deterministic without touching production data or a
 * server. The dial scenario performs a real reveal, then compares the pointer's
 * resting angle with the displayed percentage and the reveal it produced.
 *
 * These tests protect the contract that one percentage decides the tier, the
 * event, the number set and the dial position, and that colour, Spark, sharing,
 * reduced motion, the WebGL fallback and the cinematic lifecycle still work.
 */

const STORAGE_KEY = 'lucky-pick-canada-lucky-meter-v1';

const TIERS = {
  low: {
    percentage: 24,
    label: 'Low Resonance',
    message: "You're riding a little low today, but you're still okay!",
    event: { id: 'meteor', name: 'Meteor Shower', duration: 9000 },
    numbers: ['3', '9', '21'],
  },
  medium: {
    percentage: 57,
    label: 'Medium Resonance',
    message: 'Your luck is in the mid-range today.',
    event: { id: 'lightning', name: 'Cosmic Lightning', duration: 10000 },
    numbers: ['11', '22', '33'],
  },
  high: {
    percentage: 91,
    label: 'High Resonance',
    message: "Your luck is running high today!",
    event: { id: 'fireworks', name: 'Fireworks', duration: 11500 },
    numbers: ['7', '8', '77'],
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
  hasNumbers: boolean;
  hasShare: boolean;
};

type RevealTimeline = {
  numbers: RevealMilestone | null;
  share: RevealMilestone | null;
  event: RevealMilestone | null;
  numbersBeforeLanding: boolean;
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
  staleEvent,
}: {
  tierId: TierId;
  percentage?: number;
  completed: boolean;
  staleEvent?: { id: string; name: string };
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
      colour: { id: 'maple-red', name: 'Maple Red', hex: '#B52B32', light: false },
      spark: {
        id: 'spark-01',
        message: 'Even a small step forward can change the direction of your day.',
      },
      createdAt: Date.now(),
    },
    history: { percentages: [percentage], events: [tier.event.id], sparks: ['spark-01'] },
    eventCompleted: completed,
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

async function readNumbers(page: Page) {
  return page.locator('[data-testid="lucky-numbers-values"] span').allTextContents();
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

test.describe('Daily Resonance percentage mapping', () => {
  for (const { percentage, tier } of BOUNDARIES) {
    test(`${percentage}% is ${tier} with its tier's event and numbers`, async ({ page }) => {
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
      await expect(page.getByTestId('lucky-numbers-values')).toBeVisible();
      expect(await readNumbers(page)).toEqual([...TIERS[tier].numbers]);
      await expect(page.getByText(TIERS[tier].event.name).first()).toBeVisible();
    });
  }

  for (const tierId of Object.keys(TIERS) as TierId[]) {
    test(`${tierId} keeps its numbers and its derived event`, async ({ page }) => {
      await seed(page, buildState({ tierId, completed: true }));

      await expect(page.getByTestId('lucky-numbers-panel')).toBeVisible({ timeout: 20_000 });
      expect(await readNumbers(page)).toEqual([...TIERS[tierId].numbers]);
      await expect(page.locator('.lucky-tier-plate__label')).toHaveText(TIERS[tierId].label);
      await expect(page.getByText(TIERS[tierId].event.name).first()).toBeVisible();
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
    expect(await readNumbers(page)).toEqual(['7', '8', '77']);
    // The rest of the saved reading is preserved rather than rerolled.
    await expect(page.getByText('Maple Red')).toBeVisible();
    await expect(page.getByText('Even a small step forward', { exact: false })).toBeVisible();
  });
});

test.describe('Daily Resonance dial landing', () => {
  test('stops on the displayed percentage and reveals that percentage’s tier', async ({
    page,
  }) => {
    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    await startReveal(page);

    // The dial is genuinely spinning: its angle is finite during the scramble.
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

    // The tier, event and numbers all come from that same number.
    const tierId = tierForPercentage(percentage);
    await expect(page.locator('.lucky-tier-plate__label')).toHaveText(TIERS[tierId].label);
    await expect(page.getByText(TIERS[tierId].event.name).first()).toBeVisible();
    await expect(page.getByTestId('lucky-numbers-panel')).toBeVisible({ timeout: 4000 });
    expect(await readNumbers(page)).toEqual([...TIERS[tierId].numbers]);
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

    // The index still bears exactly the displayed percentage's angle.
    const angle = await readDialAngle(page);
    expect(((angle % 360) + 360) % 360).toBeCloseTo((57 * 3.6) % 360, 1);
  });

  test('reveals percentage and tier, then numbers, then details, then the event', async ({
    page,
  }) => {
    // The beats are 800/600/600 ms apart. A loaded runner can miss the window
    // between two of them, so a zero-count snapshot after landing is a race, not
    // a fact about the experience. Record each panel the first time it appears
    // instead; the ordering assertions then hold however slowly the test polls.
    await page.addInitScript(() => {
      const timeline: RevealTimeline = {
        numbers: null,
        share: null,
        event: null,
        numbersBeforeLanding: false,
      };
      window.__revealTimeline = timeline;

      const ring = () =>
        document.querySelector('[data-testid="lucky-meter-ring"]')?.getAttribute('data-phase') ??
        null;
      const hasNumbers = () => Boolean(document.querySelector('[data-testid="lucky-numbers-panel"]'));
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
        hasNumbers: hasNumbers(),
        hasShare: hasShare(),
      });

      new MutationObserver(() => {
        const at = performance.now();
        if (hasNumbers() && ring() !== 'landed') timeline.numbersBeforeLanding = true;
        if (!timeline.numbers && hasNumbers()) timeline.numbers = milestone(at);
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

    await expect(page.getByTestId('lucky-numbers-panel')).toBeVisible({ timeout: 4000 });
    expect((await readNumbers(page)).length).toBe(3);

    await expect(page.getByText('Your Lucky Numbers')).toBeVisible();
    await expect(page.getByText('Little Spark')).toBeVisible({ timeout: 4000 });
    await expect(page.getByRole('button', { name: /Share My Resonance/i })).toBeVisible();

    await expect(page.getByTestId('cosmic-event-stage')).toBeVisible({ timeout: 4000 });

    const timeline = await page.evaluate(() => window.__revealTimeline);
    expect(timeline?.numbersBeforeLanding).toBe(false);
    expect(timeline?.numbers).not.toBeNull();
    expect(timeline?.share).not.toBeNull();
    expect(timeline?.event).not.toBeNull();

    // Numbers arrive only after the dial has landed, on a reading that already
    // shows its percentage and the tier derived from it.
    expect(timeline?.numbers?.phase).toBe('landed');
    const landedValue = Number(timeline?.numbers?.value);
    expect(landedValue).toBeGreaterThanOrEqual(5);
    expect(landedValue).toBeLessThanOrEqual(100);
    expect(timeline?.numbers?.tier).toBe(TIERS[tierForPercentage(landedValue)].label);

    // Details arrive after the numbers, and the event after the details.
    expect(timeline?.share?.hasNumbers).toBe(true);
    expect(timeline?.event?.hasNumbers).toBe(true);
    expect(timeline?.event?.hasShare).toBe(true);
    expect(timeline?.numbers?.at ?? -1).toBeGreaterThan(0);
    expect(timeline?.numbers?.at ?? -1).toBeLessThanOrEqual(timeline?.share?.at ?? -1);
    expect(timeline?.share?.at ?? -1).toBeLessThanOrEqual(timeline?.event?.at ?? -1);
  });
});

test.describe('Daily Resonance reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('presents the whole reading calmly with the dial already at its value', async ({
    page,
  }) => {
    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    await startReveal(page);

    await expect(page.getByText('Your Lucky Numbers')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Little Spark')).toBeVisible();
    await expect(page.getByRole('button', { name: /Share My Resonance/i })).toBeVisible();
    await expect(page.getByTestId('cosmic-event-stage')).toHaveCount(0);
    await expect(page.getByTestId('lucky-meter-home')).toBeVisible();

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

    await seed(page, buildState({ tierId: 'medium', completed: false }));
    await expect(page.getByTestId('cosmic-event-stage')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Your Lucky Numbers')).toBeVisible();
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

  test('captures the welcome reading and the fireworks finale', async ({ page }, testInfo) => {
    const directory = 'artifacts/lucky-meter-visual-realism-20261116/after';
    const prefix = `${testInfo.project.name}`;

    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Reveal My Resonance/i })).toBeVisible({
      timeout: 20_000,
    });
    await page.screenshot({ path: `${directory}/${prefix}-welcome.png` });

    // A real reveal: the dial mid-spin and then the landed reading.
    await startReveal(page);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${directory}/${prefix}-dial-spin.png` });
    await expect(page.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'landed', {
      timeout: 12_000,
    });
    await page.screenshot({ path: `${directory}/${prefix}-landed.png` });

    await expect(page.getByRole('button', { name: /Share My Resonance/i })).toBeVisible({
      timeout: 20_000,
    });
    await page.screenshot({ path: `${directory}/${prefix}-result.png` });
  });

  test('captures the golden fireworks finale', async ({ page }, testInfo) => {
    await page.addInitScript(() => {
      (window as unknown as { __LUCKY_METER_DEBUG__?: boolean }).__LUCKY_METER_DEBUG__ = true;
    });
    await seed(page, buildState({ tierId: 'high', percentage: 91, completed: false }));
    await expect(page.getByTestId('cosmic-event-stage')).toBeVisible({ timeout: 20_000 });
    // The engine exposes its own scene clock under the debug flag, so the shot
    // lands on the golden finale instead of guessing at wall-clock time.
    await page.waitForFunction(
      () => (window as unknown as { __luckyCosmic?: { finaleSpawned?: boolean } }).__luckyCosmic?.finaleSpawned === true,
      undefined,
      { timeout: 40_000 },
    );
    await page.waitForTimeout(2400);
    await page.screenshot({
      path: `artifacts/lucky-meter-visual-realism-20261116/after/${testInfo.project.name}-fireworks-finale.png`,
    });
  });
});

test.describe('Daily Resonance cleanup', () => {
  test('removes the stage and restores Home after the cinematic', async ({ page }) => {
    const failures: string[] = [];
    page.on('pageerror', (error) => failures.push(String(error)));

    await seed(page, buildState({ tierId: 'high', completed: false }));
    await expect(page.getByTestId('cosmic-event-stage')).toBeVisible({ timeout: 20_000 });

    await expect(page.getByTestId('lucky-meter-home')).toBeVisible({ timeout: 14_000 });
    await expect(page.getByTestId('cosmic-event-stage')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Share My Resonance/i })).toBeVisible();
    expect(failures).toEqual([]);
  });
});
