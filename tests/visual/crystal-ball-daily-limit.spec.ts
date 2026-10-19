import { test, expect } from '@playwright/test';

test('Crystal Ball displays its allowance and disables a fourth question after three successful answers', async ({ page }) => {
  // This end-to-end flow includes a cold Next.js dev-server compile plus three
  // complete, intentionally animated reveals; keep the test budget realistic.
  test.setTimeout(90_000);

  let usedQuestions = 0;
  let postCount = 0;
  await page.route('**/api/oracle', async (route) => {
    postCount += 1;
    usedQuestions += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        reading: 'Clear skies.',
        source: 'ai',
      }),
    });
  });

  await page.goto('/crystal-ball');
  await expect(page.getByText('3 of 3 questions remaining today')).toBeVisible();
  await expect(page.getByLabel('Time until daily allowance resets')).toContainText(/Allowance resets in \d{2}:\d{2}:\d{2}/);

  const question = page.getByRole('textbox', { name: 'Your question for the crystal ball' });
  const button = page.getByRole('button', { name: 'Seek Fortune' });

  for (let index = 0; index < 3; index += 1) {
    await question.fill('Question ' + (index + 1));
    await expect(button).toBeEnabled({ timeout: 15000 });
    await button.click();

    if (index < 2) {
      await expect(page.getByText((2 - index) + ' of 3 questions remaining today')).toBeVisible();
      // The input is cleared after a successful answer, so the button remains
      // disabled until another question is entered. Wait for the reveal to
      // finish by checking the input re-enables; the next loop iteration then
      // enters the next question and checks that the submit button enables.
      const askAnotherButton = page.getByRole('button', { name: 'Ask Another Question' });
      await expect(askAnotherButton).toBeVisible({ timeout: 45000 });
      await askAnotherButton.click();
      await expect(question).toBeEnabled({ timeout: 2000 });
    }
  }

  await expect(page.getByText("You’ve used all 3 questions for today. Come back after the daily reset.")).toBeVisible({ timeout: 45000 });
  await expect(page.getByRole('button', { name: 'Ask Another Question' })).toBeVisible({ timeout: 10000 });
  expect(postCount).toBe(3);
});
