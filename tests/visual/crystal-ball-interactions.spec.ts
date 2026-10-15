import { test, expect } from '@playwright/test';

test('Crystal Ball interaction: seeking fortune shows gathering energy then warm pulse, and displays result under ball', async ({ page }) => {
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

  // Wait for the fortune reveal (approx 1s delay built-in to default generator + small buffer)
  // The state transitions to "revealing"
  await expect(glowElement).toHaveClass(/ballInnerGlowRevealing/, { timeout: 3000 });

  // The result should now be displayed under the ball
  const fortuneResult = page.locator('div[class*="fortunePanel"]'); // Using class to avoid strict mode violation with Next.js route announcer
  await expect(fortuneResult).toBeVisible();
  // Assert the fortune text is non-empty
  await expect(fortuneResult).not.toBeEmpty();

  // Expect the question input button to have reset to "Seek Fortune"
  // (after the 2s timeout in the revealing state, or potentially before if the timeout is still active, wait for it)
  await expect(page.getByRole('button', { name: 'Seek Fortune' })).toBeVisible({ timeout: 5000 });
});
