import { test, expect } from '@playwright/test';

test('Crystal Ball delivers a greeting-led daily fortune, the leaf reveal, and one context-aware follow-up', async ({ page }) => {
  // This end-to-end flow includes a cold Next.js dev-server compile plus two
  // complete, intentionally animated responses; keep the test budget realistic.
  test.setTimeout(90_000);

  const requests: Record<string, unknown>[] = [];
  const fortune = 'A promising opportunity is approaching. Trust your instincts.';
  const followUp = 'The follow-up mists see a warm answer.';

  await page.route('**/api/oracle', async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;
    requests.push(body);
    await new Promise((resolve) => setTimeout(resolve, 900));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        reading: body.mode === 'follow-up' ? followUp : fortune,
        source: 'ai',
      }),
    });
  });

  await page.goto('/crystal-ball');

  const greeting = page.getByText(
    /Well, look who's feeling lucky today\.|Let's see what the universe has up its sleeve, eh\?|I've been waiting for you\./,
  );
  await expect(greeting).toBeVisible();

  await expect(page.getByLabel('Time until daily reset')).toContainText(
    /Daily reset in \d{2}:\d{2}:\d{2}/,
  );

  const generateButton = page.getByRole('button', { name: /Generate My Fortune/i });
  await expect(generateButton).toBeEnabled();
  await expect(page.getByRole('textbox')).toHaveCount(0);

  await generateButton.click();

  // The loading state drives the existing energy-gathering glow.
  await expect(page.getByRole('button', { name: /Consulting the Mists/i })).toBeVisible({ timeout: 2000 });
  const glowElement = page.locator('[class*="ballInnerGlow"]');
  await expect(glowElement).toHaveClass(/ballInnerGlowLoading/);

  const fortuneResult = page.locator('div[class*="fortunePanel"]');
  await expect(fortuneResult).toBeVisible({ timeout: 3000 });

  // Full text is available to assistive technology while the visible reveal is staged.
  await expect(fortuneResult.locator('.sr-only')).toHaveText(fortune);

  // A gold pre-reveal flash is followed by the duplicate leaf, with no text typed yet.
  await expect(glowElement).toHaveClass(/ballInnerGlowPreRevealPulse/, { timeout: 3000 });
  await expect(page.locator('[class*="fortuneCharVisible"]')).toHaveCount(0);

  const fallingLeaf = page.locator('[class*="fallingLeafFlight"]');
  await expect(fallingLeaf).toBeVisible({ timeout: 2000 });
  const flightArtwork = fallingLeaf.locator('[class*="fallingLeafArtwork"]');
  await expect(flightArtwork).toBeVisible();

  // Wait until the browser has fully decoded the image before the synchronous evaluate check.
  await page.waitForFunction((el) => {
    const img = (el as HTMLElement).querySelector('img');
    return Boolean(img && img.complete && img.naturalWidth > 0);
  }, await flightArtwork.elementHandle());

  const flightAsset = await flightArtwork.evaluate((node) => {
    const picture = node as HTMLPictureElement;
    const image = picture.querySelector('img');
    return {
      tagName: picture.tagName,
      sources: Array.from(picture.querySelectorAll('source')).map((source) => ({
        type: source.type,
        srcSet: source.srcset,
      })),
      fallback: image?.getAttribute('src'),
      alt: image?.getAttribute('alt'),
      loaded: Boolean(image?.complete && image.naturalWidth > 0),
    };
  });
  expect(flightAsset.tagName).toBe('PICTURE');
  expect(flightAsset.sources).toEqual([
    { type: 'image/avif', srcSet: '/assets/golden-maple-leaf.avif' },
    { type: 'image/webp', srcSet: '/assets/golden-maple-leaf.webp' },
  ]);
  expect(flightAsset.fallback).toBe('/assets/golden-maple-leaf.svg');
  expect(flightAsset.alt).toBe('');
  expect(flightAsset.loaded).toBe(true);

  await expect(page.locator('[class*="fortuneCharVisible"]').first()).toBeVisible({ timeout: 4000 });
  const cursorLeaf = page.locator('[class*="goldenLeafCursor"]').first();
  await expect(cursorLeaf).toBeVisible();
  const cursorAsset = await cursorLeaf.evaluate((node) => {
    const picture = node as HTMLPictureElement;
    return {
      sources: Array.from(picture.querySelectorAll('source')).map((source) => ({
        type: source.type,
        srcSet: source.srcset,
      })),
      fallback: picture.querySelector('img')?.getAttribute('src'),
    };
  });
  expect(cursorAsset.sources).toEqual(flightAsset.sources);
  expect(cursorAsset.fallback).toBe(flightAsset.fallback);

  // The completion pulse follows the final typed character.
  await expect(glowElement).toHaveClass(/ballInnerGlowPulse/, { timeout: 15000 });

  const followUpPrompt = page.getByText(
    'Curious about your fortune? Ask the Crystal Ball one follow-up question.',
  );
  await expect(followUpPrompt).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('button', { name: /Generate My Fortune/i })).toHaveCount(0);

  const followUpInput = page.getByRole('textbox', {
    name: 'Your follow-up question for the crystal ball',
  });
  const followUpButton = page.getByRole('button', { name: /Ask the Crystal Ball/i });
  await expect(followUpButton).toBeDisabled();

  await followUpInput.fill('Should I take the scenic route?');
  await expect(followUpButton).toBeEnabled();
  await followUpButton.click();

  await expect(page.getByText(followUp)).toBeVisible({ timeout: 10000 });
  await expect(
    page.getByText('You asked: “Should I take the scenic route?”'),
  ).toBeVisible();

  expect(requests).toHaveLength(2);
  expect(requests[0]).toMatchObject({ mode: 'fortune' });
  expect(requests[1]).toMatchObject({
    mode: 'follow-up',
    question: 'Should I take the scenic route?',
    fortune,
  });

  // A refresh restores the reading and the follow-up without another request.
  await page.reload();
  await expect(page.locator('div[class*="fortunePanel"] .sr-only')).toHaveText(fortune);
  await expect(page.getByText(followUp)).toBeVisible();
  await expect(page.getByRole('button', { name: /Generate My Fortune/i })).toHaveCount(0);
  await expect(
    page.getByRole('textbox', { name: 'Your follow-up question for the crystal ball' }),
  ).toHaveCount(0);
  expect(requests).toHaveLength(2);
});
