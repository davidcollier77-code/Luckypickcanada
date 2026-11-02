import { test, expect, type Page } from '@playwright/test';

/**
 * Browser-level verification for the customer-facing Lucky Reveal consolidation
 * (`specs/073-unified-lucky-reveal`, Phase 9).
 *
 * These checks prove what a source inspection cannot: the homepage now shows a
 * single purchase card, the one popup captures both choices, the paid form posts
 * the correct type and game for all four combinations, personal purchases send
 * no recipient data, and the reserved future-map slot stays empty directly
 * below the reveal section.
 *
 * The `/api/checkout` request is intercepted so no Stripe session is created and
 * no real charge can occur; the submitted form payload is inspected directly.
 */

const OPEN_LABEL = 'Choose a Lucky Pick';

const COMBINATIONS = [
  { game: '6', delivery: 'Personal Reveal', checkoutType: 'lucky_pick', amount: 'CAD $1.00' },
  { game: '7', delivery: 'Personal Reveal', checkoutType: 'lucky_pick', amount: 'CAD $1.00' },
  { game: '6', delivery: 'Gift Reveal', checkoutType: 'gift_package', amount: 'CAD $1.99' },
  { game: '7', delivery: 'Gift Reveal', checkoutType: 'gift_package', amount: 'CAD $1.99' },
];

async function openHomepage(page: Page) {
  await page.route('**/api/visits', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ visits: 12345 }) }),
  );
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await expect(page.locator('main')).toBeVisible({ timeout: 30_000 });
}

async function openSelectionPopup(page: Page) {
  const button = page.locator('#personalized button.gold-3d-btn', { hasText: OPEN_LABEL });
  await button.scrollIntoViewIfNeeded();
  await expect(button).toBeVisible();

  const dialog = page.getByRole('dialog', { name: 'Lucky Reveal' });

  // The modal is a lazily loaded client component, so on a slower mobile run the
  // first tap can land before React has hydrated and no handler runs yet. Retry
  // until the dialog actually appears rather than assuming the first tap worked.
  await expect(async () => {
    if (!(await dialog.isVisible())) {
      await button.click();
    }
    await expect(dialog).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000, intervals: [250, 500, 1_000] });

  return dialog;
}

test.describe('Unified Lucky Reveal selection', () => {
  test('homepage shows one reveal card with the map slot directly below it', async ({ page }) => {
    await openHomepage(page);

    const section = page.locator('#personalized');
    await expect(section.locator('article.homepage-offer')).toHaveCount(1);
    await expect(section.getByRole('button', { name: OPEN_LABEL })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Gift the Gift Edition' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Choose Lucky Reveal' })).toHaveCount(0);

    // The reserved map slot renders nothing and sits between the reveal section
    // and the Tip Jar, so the future map keeps its intended homepage position.
    const mapSlot = page.locator('#lucky-map');
    await expect(mapSlot).toHaveCount(1);
    const slotContent = await mapSlot.evaluate((element) => ({
      elements: element.childElementCount,
      text: (element.textContent ?? '').trim().length,
      height: element.getBoundingClientRect().height,
    }));
    expect(slotContent.elements).toBe(0);
    expect(slotContent.text).toBe(0);
    expect(slotContent.height).toBeLessThanOrEqual(1);

    // A zero-height slot shares its top edge with the next section, so the
    // position is proven from document order plus the reveal section's bottom
    // edge rather than from a strict less-than between two identical offsets.
    const layout = await page.evaluate(() => {
      const reveal = document.getElementById('personalized')!;
      const slot = document.getElementById('lucky-map')!;
      const tipJar = document.getElementById('tip-jar-section')!;
      const follows = (first: Element, second: Element) =>
        Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

      return {
        afterRevealInDom: follows(reveal, slot),
        beforeTipJarInDom: follows(slot, tipJar),
        revealBottom: reveal.getBoundingClientRect().bottom + window.scrollY,
        slotTop: slot.getBoundingClientRect().top + window.scrollY,
        tipJarTop: tipJar.getBoundingClientRect().top + window.scrollY,
      };
    });

    expect(layout.afterRevealInDom).toBe(true);
    expect(layout.beforeTipJarInDom).toBe(true);
    expect(layout.slotTop).toBeGreaterThanOrEqual(layout.revealBottom - 1);
    expect(layout.slotTop).toBeLessThanOrEqual(layout.tipJarTop + 0.5);
  });

  for (const combination of COMBINATIONS) {
    test(`${combination.game} Pick + ${combination.delivery} posts the correct checkout payload`, async ({ page }) => {
      await openHomepage(page);
      const dialog = await openSelectionPopup(page);

      await dialog.getByRole('radio', { name: `${combination.game} Pick` }).check();
      await dialog.getByRole('radio', { name: new RegExp(combination.delivery) }).check();

      // The popup itself states the amount that will be charged.
      await expect(dialog.locator('.checkout-modal-summary')).toContainText(combination.amount);

      if (combination.delivery === 'Gift Reveal') {
        await dialog.getByLabel(/Recipient name/i).fill('Test Recipient');
        await dialog.getByLabel(/Recipient email/i).fill('recipient@example.com');
      } else {
        await expect(dialog.getByLabel(/Recipient email/i)).toHaveCount(0);
      }

      let payload: URLSearchParams | null = null;
      await page.route('**/api/checkout', async (route) => {
        payload = new URLSearchParams(route.request().postData() ?? '');
        // Stop here: no Stripe session, no charge, no email.
        await route.fulfill({ status: 303, headers: { location: '/?payment=cancelled' }, body: '' });
      });

      await dialog.getByRole('button', { name: /Continue to secure checkout/i }).click();

      await expect.poll(() => payload, { timeout: 15_000 }).not.toBeNull();
      const submitted = payload as unknown as URLSearchParams;
      expect(submitted.get('checkoutType')).toBe(combination.checkoutType);
      expect(submitted.get('luckyPickGame')).toBe(combination.game);

      if (combination.delivery === 'Gift Reveal') {
        expect(submitted.get('recipientEmail')).toBe('recipient@example.com');
        expect(submitted.get('recipientName')).toBe('Test Recipient');
      } else {
        // A personal purchase carries no gift recipient data, so nothing can
        // hand it to the email delivery path.
        expect(submitted.get('recipientEmail')).toBeNull();
        expect(submitted.get('recipientName')).toBeNull();
      }
    });
  }

  test('keyboard controls choose both options and Escape closes the popup', async ({ page }) => {
    await openHomepage(page);

    const firstDialog = await openSelectionPopup(page);
    await page.keyboard.press('Escape');
    await expect(firstDialog).toHaveCount(0);

    const dialog = await openSelectionPopup(page);

    // Arrow keys move through the game group and select 7 Pick.
    const sixPick = dialog.getByRole('radio', { name: '6 Pick' });
    await sixPick.focus();
    await expect(sixPick).toBeChecked();
    await page.keyboard.press('ArrowDown');
    await expect(dialog.getByRole('radio', { name: '7 Pick' })).toBeChecked();

    // Arrow keys move through the delivery group and select the Gift Reveal.
    const personal = dialog.getByRole('radio', { name: /Personal Reveal/ });
    await personal.focus();
    await expect(personal).toBeChecked();
    await page.keyboard.press('ArrowDown');
    const gift = dialog.getByRole('radio', { name: /Gift Reveal/ });
    await expect(gift).toBeChecked();
    await expect(dialog.getByLabel(/Recipient email/i)).toBeVisible();
    await expect(dialog.locator('.checkout-modal-summary')).toContainText('CAD $1.99');

    // The paid submit control is reachable and activatable by keyboard alone.
    let payload: URLSearchParams | null = null;
    await page.route('**/api/checkout', async (route) => {
      payload = new URLSearchParams(route.request().postData() ?? '');
      await route.fulfill({ status: 303, headers: { location: '/?payment=cancelled' }, body: '' });
    });

    await dialog.getByLabel(/Recipient name/i).fill('Keyboard Recipient');
    await dialog.getByLabel(/Recipient email/i).fill('keyboard@example.com');

    const submit = dialog.getByRole('button', { name: /Continue to secure checkout/i });
    await submit.focus();
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BUTTON');
    await page.keyboard.press('Enter');

    await expect.poll(() => payload, { timeout: 15_000 }).not.toBeNull();
    const submitted = payload as unknown as URLSearchParams;
    expect(submitted.get('checkoutType')).toBe('gift_package');
    expect(submitted.get('luckyPickGame')).toBe('7');
  });

  test('reduced motion keeps the selection popup fully usable', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHomepage(page);

    const dialog = await openSelectionPopup(page);
    await dialog.getByRole('radio', { name: /Gift Reveal/ }).check();
    await expect(dialog.getByLabel(/Recipient email/i)).toBeVisible();
    await expect(dialog.locator('.checkout-modal-summary')).toContainText('CAD $1.99');

    // Chromium reports a sub-microsecond value for a removed transition, so the
    // durations are compared numerically instead of as formatted strings.
    const durations = await page
      .locator('.checkout-delivery-option')
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    const seconds = durations.split(',').map((value) => Number.parseFloat(value));
    expect(seconds.length).toBeGreaterThan(0);
    expect(seconds.every((value) => Number.isFinite(value) && value <= 0.001)).toBe(true);
  });
});
