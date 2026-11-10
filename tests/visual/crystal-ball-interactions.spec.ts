import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 90_000 });

test('Crystal Ball delivers a greeting-led daily fortune, the leaf reveal, and one context-aware follow-up', async ({ page }) => {
  // This end-to-end flow includes a cold Next.js dev-server compile plus two
  // complete, intentionally animated responses; keep the test budget realistic.
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

  const greeting = page.getByTestId('crystal-ball-greeting');
  await expect(greeting.locator('.sr-only')).toHaveText(
    /Well, look who's feeling lucky today\.|Let's see what the universe has up its sleeve, eh\?|I've been waiting for you\.|Pull up a chair, friend/,
    { timeout: 10_000 },
  );

  await expect(page.getByLabel('Time until daily reset')).toContainText(
    /Daily reset in \d{2}:\d{2}:\d{2}/,
  );

  const generateButton = page.getByRole('button', { name: /Generate My Fortune/i });
  await expect(generateButton).toBeEnabled();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Ask a Follow-up Question/i })).toHaveCount(0);

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

  // The follow-up is offered only after the reveal finishes, initially as a button.
  await expect(
    page.getByText('Curious about your fortune? Ask the Crystal Ball one follow-up question.'),
  ).toBeVisible({ timeout: 15000 });
  const openFollowUp = page.getByRole('button', { name: /Ask a Follow-up Question/i });
  await expect(openFollowUp).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Generate My Fortune/i })).toHaveCount(0);

  // The button is replaced by the designed input panel.
  await openFollowUp.click();
  await expect(openFollowUp).toHaveCount(0);
  const followUpPanel = page.locator('div[class*="followUpPanel"]');
  await expect(followUpPanel).toBeVisible();

  const followUpInput = page.getByRole('textbox', { name: 'Your follow-up question' });
  await expect(followUpInput).toBeVisible();
  await expect(followUpInput).toHaveAttribute('maxlength', '120');
  await expect(followUpInput).toHaveAttribute('rows', '5');

  const followUpButton = page.getByRole('button', { name: /Ask the Crystal Ball/i });
  await expect(followUpButton).toBeDisabled();

  await followUpInput.fill('Should I take the scenic route?');
  await expect(followUpPanel).toContainText('31/120');
  await expect(followUpButton).toBeEnabled();
  await followUpButton.click();

  // The panel is replaced by the question and the typed answer, and the
  // original fortune stays visible above them.
  const answer = page.getByTestId('crystal-ball-followup-answer');
  await expect(answer).toBeVisible({ timeout: 10000 });
  await expect(answer.locator('.sr-only')).toHaveText(followUp);
  await expect(answer).toContainText('You asked:');
  await expect(answer).toContainText('“Should I take the scenic route?”');
  await expect(answer.locator('[class*="goldenLeafCursor"]').first()).toBeVisible();
  await expect(followUpPanel).toHaveCount(0);
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(fortuneResult.locator('.sr-only')).toHaveText(fortune);
  await expect(answer).toContainText('That’s your follow-up for today.');

  expect(requests).toHaveLength(2);
  expect(requests[0]).toMatchObject({ mode: 'fortune' });
  expect(requests[1]).toMatchObject({
    mode: 'follow-up',
    question: 'Should I take the scenic route?',
    fortune,
  });

  // A refresh restores the reading, question and answer without another request.
  await page.reload();
  await expect(page.locator('div[class*="fortunePanel"] .sr-only')).toHaveText(fortune);
  const restoredAnswer = page.getByTestId('crystal-ball-followup-answer').locator('.sr-only');
  await expect(restoredAnswer).toHaveText(followUp);
  await expect(page.getByText('You asked:', { exact: false })).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Ask a Follow-up Question/i })).toHaveCount(0);
  await expect(page.getByText('That’s your follow-up for today.')).toBeVisible();
  expect(requests).toHaveLength(2);
});
