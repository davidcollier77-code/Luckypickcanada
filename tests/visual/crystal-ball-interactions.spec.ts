import { test, expect } from '@playwright/test';

test('Crystal Ball interaction: seeking fortune shows gathering energy, progressive reveal, warm pulse, and displays result under ball', async ({ page }) => {
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

  // The fortune result container should eventually appear
  const fortuneResult = page.locator('div[class*="fortunePanel"]');
  await expect(fortuneResult).toBeVisible({ timeout: 3000 });

  // The sr-only full text should be present
  const srText = fortuneResult.locator('.sr-only');
  await expect(srText).toHaveText('A promising opportunity is approaching. Trust your instincts.');

  // The pulse class should eventually be applied after words finish revealing
  await expect(glowElement).toHaveClass(/ballInnerGlowPulse/, { timeout: 6000 });

  // Expect the question input button to have reset to "Seek Fortune" after completion pulse
  await expect(page.getByRole('button', { name: 'Seek Fortune' })).toBeVisible({ timeout: 5000 });
});
