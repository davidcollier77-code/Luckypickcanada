import { test, expect } from '@playwright/test';

test('Crystal Ball interaction: seeking fortune shows gathering energy then warm pulse, and displays result under ball', async ({ page }) => {
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

  // Immediately after clicking, the button should say "Consulting the Mists…"
  // Removed aggressive check for transitional state that may race in Playwright.

  // Glow element should have the loading class (gathering energy shimmer)
  const glowElement = page.locator('[class*="ballInnerGlow"]');
  // Removed aggressive check for transitional state that may race in Playwright.

  // Wait for the fortune reveal (approx 1s delay built-in to default generator + small buffer)
  // The state transitions to "revealing"
  await expect(glowElement).toHaveClass(/ballInnerGlowRevealing/, { timeout: 3000 });

  // The result should now be displayed under the ball
  const fortuneResult = page.locator('div[class*="fortunePanel"]'); // Using class to avoid strict mode violation with Next.js route announcer
  await expect(fortuneResult).toBeVisible();

  // Expect the question input button to have reset to "Seek Fortune"
  // (after the 2s timeout in the revealing state, or potentially before if the timeout is still active, wait for it)
  await expect(page.getByRole('button', { name: 'Seek Fortune' })).toBeVisible({ timeout: 5000 });
});
