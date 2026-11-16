import { expect, test, type Page } from '@playwright/test';

/**
 * Daily Resonance browser coverage.
 *
 * The daily result is seeded into Local Storage before the page loads, so each
 * scenario is deterministic without touching production data or a server.
 * These tests protect the contract that the Lucky Numbers belong to the tier
 * (not the event), the reveal order, reduced motion, the WebGL fallback and the
 * clean end of the cinematic.
 */

const STORAGE_KEY = 'lucky-pick-canada-lucky-meter-v1';

const TIERS = {
  low: {
    percentage: 24,
    label: 'Low Resonance',
    message: "You're riding a little low today, but you're still okay!",
    numbers: ['3', '9', '21'],
  },
  medium: {
    percentage: 57,
    label: 'Medium Resonance',
    message: 'Your luck is in the mid-range today.',
    numbers: ['11', '22', '33'],
  },
  high: {
    percentage: 91,
    label: 'High Resonance',
    message: 'Your luck is running high today!',
    numbers: ['7', '8', '77'],
  },
} as const;

const EVENTS = {
  meteor: { name: 'Meteor Shower', duration: 9000 },
  lightning: { name: 'Cosmic Lightning', duration: 10000 },
  fireworks: { name: 'Fireworks', duration: 11500 },
} as const;

type TierId = keyof typeof TIERS;
type EventId = keyof typeof EVENTS;

function localDateKey() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function buildState(tierId: TierId, eventId: EventId, completed: boolean) {
  const tier = TIERS[tierId];
  const event = EVENTS[eventId];
  const dateKey = localDateKey();
  return {
    version: 1,
    dateKey,
    result: {
      dateKey,
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

async function seed(page: Page, tierId: TierId, eventId: EventId, completed: boolean) {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(buildState(tierId, eventId, completed))],
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

test.describe('Daily Resonance numbers belong to the tier', () => {
  for (const tierId of Object.keys(TIERS) as TierId[]) {
    for (const eventId of Object.keys(EVENTS) as EventId[]) {
      test(`${tierId} keeps its numbers during ${eventId}`, async ({ page }) => {
        await seed(page, tierId, eventId, true);

        await expect(page.getByTestId('lucky-numbers-panel')).toBeVisible();
        expect(await readNumbers(page)).toEqual(TIERS[tierId].numbers);
        // The tier plate is the visible label; the same words also appear in the
        // screen-reader live region, so the plate itself is the target.
        await expect(page.locator('.lucky-tier-plate__label')).toHaveText(
          TIERS[tierId].label,
        );
        await expect(page.getByText(EVENTS[eventId].name).first()).toBeVisible();
      });
    }
  }
});

test.describe('Daily Resonance reveal order', () => {
  test('reveals percentage and tier, then numbers, then details, then the event', async ({
    page,
  }) => {
    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    await startReveal(page);

    // Landing: percentage and tier only.
    await expect(page.getByTestId('lucky-meter-ring')).toHaveAttribute(
      'data-phase',
      'landed',
      { timeout: 8000 },
    );
    // Snapshot counts rather than retrying: the next beat is only 800 ms away,
    // and a retrying zero-count would race with it by design.
    expect(await page.getByTestId('lucky-numbers-panel').count()).toBe(0);
    expect(await page.getByRole('button', { name: /Share My Resonance/i }).count()).toBe(0);

    // Numbers arrive before any supporting panel.
    await expect(page.getByTestId('lucky-numbers-panel')).toBeVisible({ timeout: 4000 });
    expect((await readNumbers(page)).length).toBe(3);
    expect(await page.getByRole('button', { name: /Share My Resonance/i }).count()).toBe(0);

    // Then colour, Little Spark and the event card.
    await expect(page.getByText('Your Lucky Numbers')).toBeVisible();
    await expect(page.getByText('Little Spark')).toBeVisible({ timeout: 4000 });
    await expect(page.getByRole('button', { name: /Share My Resonance/i })).toBeVisible();

    // Finally the cinematic stage.
    await expect(page.getByTestId('cosmic-event-stage')).toBeVisible({ timeout: 4000 });
  });
});

test.describe('Daily Resonance reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('presents the whole reading calmly without the cinematic', async ({ page }) => {
    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
    await startReveal(page);

    await expect(page.getByText('Your Lucky Numbers')).toBeVisible();
    await expect(page.getByText('Little Spark')).toBeVisible();
    await expect(page.getByRole('button', { name: /Share My Resonance/i })).toBeVisible();
    await expect(page.getByTestId('cosmic-event-stage')).toHaveCount(0);
    await expect(page.getByTestId('lucky-meter-home')).toBeVisible();
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

    await seed(page, 'medium', 'lightning', false);
    await expect(page.getByTestId('cosmic-event-stage')).toBeVisible();
    await expect(page.getByText('Your Lucky Numbers')).toBeVisible();
    await expect(page.getByTestId('lucky-meter-home')).toHaveCount(0);

    // The safety timer completes the stage within its documented duration.
    await expect(page.getByTestId('lucky-meter-home')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('cosmic-event-stage')).toHaveCount(0);
    expect(failures).toEqual([]);
  });
});

test.describe('Daily Resonance cleanup', () => {
  test('removes the stage and restores Home after the cinematic', async ({ page }) => {
    const failures: string[] = [];
    page.on('pageerror', (error) => failures.push(String(error)));

    await seed(page, 'high', 'meteor', false);
    await expect(page.getByTestId('cosmic-event-stage')).toBeVisible();

    await expect(page.getByTestId('lucky-meter-home')).toBeVisible({ timeout: 14_000 });
    await expect(page.getByTestId('cosmic-event-stage')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Share My Resonance/i })).toBeVisible();
    expect(failures).toEqual([]);
  });
});
