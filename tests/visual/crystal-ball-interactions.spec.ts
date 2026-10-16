import { test, expect } from '@playwright/test';

test('Crystal Ball sequence: flashes, drops a duplicate leaf before typing, completes the pulse, and supports a second question', async ({ page }) => {
  // Keep this UI test independent of production AI credentials and make the loading state deterministic.
  await page.route('**/api/oracle', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ reading: 'A promising opportunity is approaching. Trust your instincts.' }),
    });
  });

  await page.goto('/crystal-ball');

  // Verify initial state
  const questionInput = page.getByRole('textbox', { name: 'Your question for the crystal ball' });
  await expect(questionInput).toBeVisible();

  const seekButton = page.getByRole('button', { name: /Seek Fortune/i });
  await expect(seekButton).toBeVisible();
  await expect(seekButton).toBeDisabled(); // Disabled because input is empty

  // Type a question
  await questionInput.fill('Will I win the lottery?');

  // Submit
  await seekButton.click();

  // Assert the loading state is reached: button should show "Consulting the Mists…"
  await expect(page.getByRole('button', { name: /Consulting the Mists/i })).toBeVisible({ timeout: 2000 });

  // Glow element should have the loading class (gathering energy shimmer)
  const glowElement = page.locator('[class*="ballInnerGlow"]');
  await expect(glowElement).toHaveClass(/ballInnerGlowLoading/);

  // The fortune result container should eventually appear
  const fortuneResult = page.locator('div[class*="fortunePanel"]');
  await expect(fortuneResult).toBeVisible({ timeout: 3000 });

  // Full text is available to assistive technology while the visible reveal is staged.
  const srText = fortuneResult.locator('.sr-only');
  await expect(srText).not.toBeEmpty();

  // A gold pre-reveal flash should be followed by the duplicate leaf, with no text typed yet.
  await expect(glowElement).toHaveClass(/ballInnerGlowPreRevealPulse/, { timeout: 3000 });
  const fallingLeaf = page.locator('[class*="fallingLeafFlight"]');
  await expect(fallingLeaf).toBeVisible({ timeout: 2000 });
  await expect(page.locator('[class*="fortuneCharVisible"]')).toHaveCount(0);
  await expect(page.locator('[class*="fortuneCharVisible"]').first()).toBeVisible({ timeout: 4000 });

  // The pulse class should be applied again after the final typed character.
  await expect(glowElement).toHaveClass(/ballInnerGlowPulse/, { timeout: 10000 });

  // Expect the question input button to have reset to "Seek Fortune" after completion pulse
  await expect(page.getByRole('button', { name: 'Seek Fortune' })).toBeVisible({ timeout: 10000 });

  // The user can submit another question in the same session.
  await questionInput.fill('Can I ask a second question?');
  await seekButton.click();
  await expect(page.getByRole('button', { name: /Consulting the Mists/i })).toBeVisible({ timeout: 2000 });
  await expect(page.locator('[class*="readingItem"]')).toHaveCount(2, { timeout: 5000 });
});
