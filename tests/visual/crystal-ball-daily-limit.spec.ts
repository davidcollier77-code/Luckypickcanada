import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 120_000 });

const STORAGE_KEY = 'luckyPickCanada:crystalBallDailyFortune:v1';

test('Crystal Ball keeps one fortune and one follow-up per local day and never charges a failed request', async ({ page }) => {
  const fortune = 'A steady day is unfolding in your favour.';
  const followUp = 'A follow-up answer is waiting.';
  let fortuneRequests = 0;
  let followUpRequests = 0;

  await page.route('**/api/oracle', async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;

    if (body.mode === 'follow-up') {
      followUpRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reading: followUp, source: 'ai' }),
      });
      return;
    }

    fortuneRequests += 1;
    if (fortuneRequests === 1) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'The mists are busy.' }),
      });
      return;
    }

    // A successfully delivered fallback counts as the day's experience.
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ reading: fortune, source: 'fallback' }),
    });
  });

  await page.goto('/crystal-ball');
  await expect(page.getByLabel('Time until daily reset')).toContainText(
    /Daily reset in \d{2}:\d{2}:\d{2}/,
  );

  // First attempt fails and must not consume the fortune.
  await page.getByRole('button', { name: /Generate My Fortune/i }).click();
  await expect(page.locator('#main-content').getByText('The mists are busy.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Generate My Fortune/i })).toBeEnabled();
  expect(fortuneRequests).toBe(1);

  // The second response is a usable fallback and becomes today's fortune.
  await page.getByRole('button', { name: /Generate My Fortune/i }).click();
  await expect(page.locator('div[class*="fortunePanel"] .sr-only')).toHaveText(fortune, {
    timeout: 15000,
  });
  await expect(
    page.getByText('Curious about your fortune? Ask the Crystal Ball one follow-up question.'),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('button', { name: /Generate My Fortune/i })).toHaveCount(0);
  expect(fortuneRequests).toBe(2);

  // Refresh reuses the saved fortune and sends no new request.
  await page.reload();
  await expect(page.locator('div[class*="fortunePanel"] .sr-only')).toHaveText(fortune);
  await expect(page.getByRole('button', { name: /Generate My Fortune/i })).toHaveCount(0);
  expect(fortuneRequests).toBe(2);

  // One follow-up is available, then persists.
  await page.getByRole('button', { name: /Ask a Follow-up Question/i }).click();
  const followUpInput = page.getByRole('textbox', { name: 'Your follow-up question' });
  await followUpInput.fill('What should I watch for?');
  await page.getByRole('button', { name: /Ask the Crystal Ball/i }).click();
  const answer = page.getByTestId('crystal-ball-followup-answer');
  await expect(answer.locator('.sr-only')).toHaveText(followUp, { timeout: 10000 });
  expect(followUpRequests).toBe(1);

  await page.reload();
  await expect(page.getByTestId('crystal-ball-followup-answer')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Your follow-up question' })).toHaveCount(0);
  await expect(page.getByText(/You’ve used today’s follow-up question/)).toBeVisible();
  expect(followUpRequests).toBe(1);

  const savedAfterFollowUp = await page.evaluate((key) => {
    return JSON.parse(window.localStorage.getItem(key) || '{}');
  }, STORAGE_KEY);
  expect(savedAfterFollowUp.followUpUsed).toBe(true);
  expect(savedAfterFollowUp).not.toHaveProperty('followUpQuestion');
  expect(savedAfterFollowUp).not.toHaveProperty('followUpAnswer');

  // A stored state from an earlier local date starts a fresh allowance.
  await page.evaluate((key) => {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '{}');
    parsed.date = '2020-01-01';
    window.localStorage.setItem(key, JSON.stringify(parsed));
  }, STORAGE_KEY);

  await page.reload();
  await expect(page.getByRole('button', { name: /Generate My Fortune/i })).toBeVisible();
  await expect(page.locator('div[class*="fortunePanel"]')).toHaveCount(0);
});


test('simultaneous fortune requests from two tabs consume only one daily allowance', async ({ context }) => {
  const firstReading = 'One shared reading is waiting in the glass.';
  const rejectedReading = 'A second reading must never replace the first.';
  let requests = 0;
  let releaseResponse: () => void = () => {};
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });

  await context.route('**/api/oracle', async (route) => {
    requests += 1;
    const reading = requests === 1 ? firstReading : rejectedReading;
    await responseGate;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ reading, source: 'ai' }),
    });
  });

  const firstTab = await context.newPage();
  const secondTab = await context.newPage();
  await Promise.all([firstTab.goto('/crystal-ball'), secondTab.goto('/crystal-ball')]);

  const firstButton = firstTab.getByRole('button', { name: /Generate My Fortune/i });
  const secondButton = secondTab.getByRole('button', { name: /Generate My Fortune/i });
  await Promise.all([expect(firstButton).toBeVisible(), expect(secondButton).toBeVisible()]);

  // Confirm the first request is actually in flight and holding the Web Lock
  // before the second tab competes for the same local-day allowance.
  await firstButton.click();
  await expect.poll(() => requests).toBe(1);
  await secondButton.click();
  releaseResponse();

  await expect(firstTab.locator('div[class*="fortunePanel"] .sr-only')).toHaveText(firstReading, {
    timeout: 15000,
  });
  await expect(secondTab.locator('div[class*="fortunePanel"] .sr-only')).toHaveText(firstReading, {
    timeout: 15000,
  });
  await expect(secondTab.getByRole('button', { name: /Generate My Fortune/i })).toHaveCount(0);

  // Give any unsynchronized late request time to surface before asserting that
  // the allowance was consumed exactly once.
  await secondTab.waitForTimeout(500);
  expect(requests).toBe(1);

  const saved = await firstTab.evaluate((key) => {
    return JSON.parse(window.localStorage.getItem(key) || '{}');
  }, STORAGE_KEY);
  expect(saved.fortuneUsed).toBe(true);
  expect(saved.fortune).toBe(firstReading);
  expect(saved.fortune).not.toBe(rejectedReading);

  await Promise.all([firstTab.close(), secondTab.close()]);
});

test('a tab that misses the storage event adopts a fortune delivered elsewhere', async ({ context }) => {
  const firstReading = 'The first tab already delivered this fortune.';
  const secondReading = 'This competing reading must be rejected.';
  let requests = 0;
  let releaseFirst: () => void = () => {};
  let releaseSecond: () => void = () => {};
  const firstGate = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  const secondGate = new Promise<void>((resolve) => {
    releaseSecond = resolve;
  });

  // Exercise the older-browser fallback queue, which serializes within a tab
  // but relies on the post-response re-read for cross-tab protection.
  await context.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'locks', {
      configurable: true,
      get: () => undefined,
    });
  });

  await context.route('**/api/oracle', async (route) => {
    requests += 1;
    const index = requests;
    const reading = index === 1 ? firstReading : secondReading;
    await (index === 1 ? firstGate : secondGate);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ reading, source: 'ai' }),
    });
  });

  const firstTab = await context.newPage();
  const secondTab = await context.newPage();
  await secondTab.addInitScript(() => {
    const nativeAddEventListener = window.addEventListener.bind(window);
    window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
      if (type === 'storage') return;
      nativeAddEventListener(type, listener, options);
    }) as typeof window.addEventListener;
  });

  await Promise.all([firstTab.goto('/crystal-ball'), secondTab.goto('/crystal-ball')]);

  const firstButton = firstTab.getByRole('button', { name: /Generate My Fortune/i });
  const secondButton = secondTab.getByRole('button', { name: /Generate My Fortune/i });
  await Promise.all([expect(firstButton).toBeVisible(), expect(secondButton).toBeVisible()]);

  await firstButton.click();
  await expect.poll(() => requests).toBe(1);
  await secondButton.click();
  await expect.poll(() => requests).toBe(2);

  releaseFirst();
  await expect(firstTab.locator('div[class*="fortunePanel"] .sr-only')).toHaveText(firstReading, {
    timeout: 15000,
  });

  // The second tab has deliberately missed the storage event, so it cannot
  // adopt the first reading until its duplicate response resolves.
  await expect(secondTab.locator('div[class*="fortunePanel"]')).toHaveCount(0);
  releaseSecond();

  await expect(secondTab.locator('div[class*="fortunePanel"] .sr-only')).toHaveText(firstReading, {
    timeout: 15000,
  });
  await expect(secondTab.getByText(secondReading)).toHaveCount(0);
  await expect(secondTab.getByRole('button', { name: /Generate My Fortune/i })).toHaveCount(0);

  const saved = await secondTab.evaluate((key) => {
    return JSON.parse(window.localStorage.getItem(key) || '{}');
  }, STORAGE_KEY);
  expect(saved.fortuneUsed).toBe(true);
  expect(saved.fortune).toBe(firstReading);

  await Promise.all([firstTab.close(), secondTab.close()]);
});

test('Card Reveal, Crystal Ball and Lucky Meter read the same local-midnight countdown', async ({ context }) => {
  const cardPage = await context.newPage();
  const crystalPage = await context.newPage();
  const meterPage = await context.newPage();

  await cardPage.addInitScript(() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    window.localStorage.setItem(
      'lucky-pick-canada-todays-lucky-moment',
      JSON.stringify({ cardId: 'number-seeker', quote: 'A steady quote.', revealDate: key }),
    );
  });

  await meterPage.addInitScript(() => {
    window.localStorage.setItem('lucky_lastDate', new Date().toLocaleDateString());
    window.localStorage.setItem('lucky_lastPct', '50');
    window.localStorage.setItem('lucky_lastQuote', '0');
  });

  await Promise.all([
    cardPage.goto('/reveal'),
    crystalPage.goto('/crystal-ball'),
    meterPage.goto('/lucky-meter'),
  ]);

  const cardCountdown = cardPage.getByText(/Resets in:/);
  const crystalCountdown = crystalPage.getByLabel('Time until daily reset');
  const meterCountdown = meterPage
    .getByText('Next Resonance In')
    .locator('..')
    .locator('div');

  await expect(cardCountdown).toContainText(/\d{2}:\d{2}:\d{2}/, { timeout: 30000 });
  await expect(crystalCountdown).toContainText(/\d{2}:\d{2}:\d{2}/);
  await expect(meterCountdown).toContainText(/\d{2}:\d{2}:\d{2}/, { timeout: 30000 });

  const toSeconds = async (locator: typeof cardCountdown) => {
    const text = await locator.textContent();
    const match = text?.match(/(\d{2}):(\d{2}):(\d{2})/);
    if (!match) throw new Error(`Countdown text was not in HH:MM:SS form: ${text}`);
    return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  };

  const [cardSeconds, crystalSeconds, meterSeconds] = await Promise.all([
    toSeconds(cardCountdown),
    toSeconds(crystalCountdown),
    toSeconds(meterCountdown),
  ]);

  expect(Math.max(cardSeconds, crystalSeconds, meterSeconds) - Math.min(cardSeconds, crystalSeconds, meterSeconds)).toBeLessThanOrEqual(2);

  const expectedSeconds = await crystalPage.evaluate(() => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return Math.round((midnight.getTime() - now.getTime()) / 1000);
  });

  for (const seconds of [cardSeconds, crystalSeconds, meterSeconds]) {
    expect(Math.abs(seconds - expectedSeconds)).toBeLessThanOrEqual(3);
  }

  await Promise.all([cardPage.close(), crystalPage.close(), meterPage.close()]);
});
