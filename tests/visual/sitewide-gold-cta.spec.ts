import { test, expect, type Page, type TestInfo } from '@playwright/test';

/**
 * Browser-level verification for `specs/064-sitewide-gold-cta`.
 *
 * Proves the shared metallic gold CTA is actually rendered site-wide: the
 * measured emblem-matched ramp, the raised edge, hover/focus lift,
 * press/release feedback, the assigned leading emoji, and that the excluded
 * and secondary controls are untouched.
 */

const GOLD = '.gold-3d-btn';
const EDGE = 'rgb(138, 85, 12)';
const MAIN_GOLD = 'rgb(220, 174, 78)';

// Assigned leading emoji per homepage CTA, in DOM order.
const HOMEPAGE_EMOJI = ['✨', '♠', '🔮', '🍀', '🎁', '🎁', '❤️', '💡', 'ℹ️'];

const HOMEPAGE_WORDING = [
  'Check Lucky Meter',
  "Reveal Today's Card",
  'CONSULT THE ORACLE',
  'EXPLORE LUCKY STORIES',
  'Choose a Lucky Pick',
  'Gift a Lucky Pick',
  'Open the tip jar',
  'Send suggestion',
  'Read Our Story',
];

function translateY(transform: string): number {
  if (!transform || transform === 'none') return 0;
  const values = transform.match(/matrix(3d)?\(([^)]+)\)/)?.[2].split(',').map(Number);
  if (!values) throw new Error(`Unrecognised transform: ${transform}`);
  return values.length === 16 ? values[13] : values[5];
}

async function capture(page: Page, name: string, testInfo: TestInfo) {
  const path = testInfo.outputPath(`${name}-${testInfo.project.name}.png`);
  await page.screenshot({ path, animations: 'disabled' });
  await testInfo.attach(name, { path, contentType: 'image/png' });
}

async function openHomepage(page: Page) {
  await page.route('**/api/visits', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ visits: 12345 }) });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await expect(page.locator(GOLD).first()).toBeVisible({ timeout: 30_000 });
}

test.describe('Site-wide gold CTA', () => {
  test('homepage CTAs share the measured gold, depth and assigned emoji', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await openHomepage(page);

    const ctas = await page.$$eval(GOLD, (nodes) => nodes.map((node) => {
      const style = getComputedStyle(node);
      const emoji = node.querySelector('.gold-cta-emoji');
      const label = Array.from(node.childNodes)
        .filter((child) => child.nodeType === Node.TEXT_NODE || (child as Element).tagName === 'SPAN')
        .map((child) => (child as Element).classList?.contains('gold-cta-emoji') ? '' : child.textContent ?? '')
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
      return {
        label,
        emoji: emoji?.textContent ?? '',
        emojiHidden: emoji?.getAttribute('aria-hidden') ?? null,
        emojiFontSize: emoji ? parseFloat(getComputedStyle(emoji).fontSize) : 0,
        buttonFontSize: parseFloat(style.fontSize),
        backgroundImage: style.backgroundImage,
        backgroundColor: style.backgroundColor,
        boxShadow: style.boxShadow,
        height: node.getBoundingClientRect().height,
        radius: style.borderTopLeftRadius,
      };
    }));

    expect(ctas).toHaveLength(9);

    ctas.forEach((cta, index) => {
      // FR-001: the measured metallic ramp, not the previous vivid yellow.
      expect(cta.backgroundImage, `"${cta.label}" lost the shared gold ramp`).toContain(MAIN_GOLD);
      expect(cta.backgroundImage).not.toContain('rgb(250, 204, 21)');
      // FR-002: raised resting edge.
      expect(cta.boxShadow, `"${cta.label}" lost the raised edge`).toContain(`${EDGE} 0px 3px 0px`);
      // FR-005: exactly one decorative, hidden leading emoji.
      expect(cta.emoji, `emoji mismatch on "${cta.label}"`).toBe(HOMEPAGE_EMOJI[index]);
      expect(cta.emojiHidden).toBe('true');
      expect(cta.emojiFontSize).toBeLessThan(cta.buttonFontSize);
      // Wording preserved verbatim.
      expect(cta.label).toContain(HOMEPAGE_WORDING[index]);
      // Pill geometry and touch target preserved.
      expect(parseFloat(cta.radius)).toBeGreaterThanOrEqual(999);
      expect(cta.height).toBeGreaterThanOrEqual(44);
    });

    // Explore Your Luck stays excluded: no shared gold class, no emoji.
    const explore = page.locator('button:has-text("Explore Your Luck")').first();
    if (await explore.count()) {
      await expect(explore).not.toHaveClass(/gold-3d-btn/);
      await expect(explore.locator('.gold-cta-emoji')).toHaveCount(0);
    }

    // Tip Jar / Suggestion keep exactly their two shimmer overlays and pulses.
    await expect(page.locator(`${GOLD} .gold-shimmer`)).toHaveCount(2);
    await expect(page.locator(`${GOLD}.gold-btn-glow`)).toHaveCount(2);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(250);
    await capture(page, 'sitewide-gold-home-top', testInfo);

    await page.locator(`${GOLD}:has-text("Open the tip jar")`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await capture(page, 'sitewide-gold-home-tipjar', testInfo);
  });

  test('hover, press and release states work on the shared treatment', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await openHomepage(page);

    const button = page.locator(`${GOLD}[href="/lucky-meter"]`).first();
    await button.scrollIntoViewIfNeeded();
    const box = (await button.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    await page.mouse.move(x, y);
    await expect
      .poll(async () => translateY(await button.evaluate((el) => getComputedStyle(el).transform)), { timeout: 5_000 })
      .toBeLessThanOrEqual(-1.5);
    await expect
      .poll(async () => button.evaluate((el) => getComputedStyle(el).boxShadow), { timeout: 5_000 })
      .toContain(`${EDGE} 0px 5px 0px`);
    await capture(page, 'sitewide-gold-hover', testInfo);

    await page.mouse.down();
    await expect
      .poll(async () => translateY(await button.evaluate((el) => getComputedStyle(el).transform)), { timeout: 5_000 })
      .toBeGreaterThanOrEqual(1.5);
    const pressed = await button.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(pressed).toContain(`${EDGE} 0px 1px 0px`);
    await capture(page, 'sitewide-gold-pressed', testInfo);

    await page.mouse.move(x, Math.max(y - 200, 1));
    await page.mouse.up();
    await expect
      .poll(async () => translateY(await button.evaluate((el) => getComputedStyle(el).transform)), { timeout: 5_000 })
      .toBeGreaterThanOrEqual(-0.5);
  });

  test('Lucky Map CTAs use the shared treatment and emoji', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await page.goto('/map', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(page.locator('main, .lucky-map-shell').first()).toBeVisible({ timeout: 30_000 });

    const viewStories = page.locator('a.gold-3d-btn:has-text("View Lucky Stories")').first();
    await expect(viewStories).toBeVisible();
    await expect(viewStories.locator('.gold-cta-emoji')).toHaveText('🍀');
    await expect(viewStories).toHaveCSS('background-image', /rgb\(220, 174, 78\)/);

    const shareStory = page.locator('button.gold-3d-btn:has-text("Share your lucky story")').first();
    await expect(shareStory).toBeVisible();
    await expect(shareStory.locator('.gold-cta-emoji')).toHaveText('✍️');

    const edge = await viewStories.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(edge).toContain(`${EDGE} 0px 3px 0px`);

    await capture(page, 'sitewide-gold-map', testInfo);
  });

  test('Lucky Meter and Lucky Card Reveal CTAs adopt the shared gold', async ({ page }, testInfo) => {
    test.setTimeout(180_000);

    await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    const resonance = page.locator('button.gold-3d-btn:has-text("Reveal My Resonance")').first();
    await expect(resonance).toBeVisible({ timeout: 30_000 });
    await expect(resonance.locator('.gold-cta-emoji')).toHaveText('✨');
    expect(await resonance.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain(MAIN_GOLD);
    await capture(page, 'sitewide-gold-lucky-meter', testInfo);

    await page.goto('/reveal', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    const reveal = page.locator('button.gold-3d-btn:has-text("Reveal Today")').first();
    if (await reveal.count()) {
      await expect(reveal.locator('.gold-cta-emoji')).toHaveText('♠');
      expect(await reveal.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain(MAIN_GOLD);
      await capture(page, 'sitewide-gold-card-reveal', testInfo);
    }
  });

  test('Crystal Ball primary CTAs adopt the shared gold', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await page.goto('/crystal-ball', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    const seek = page.locator('button.gold-3d-btn').first();
    await expect(seek).toBeVisible({ timeout: 30_000 });
    await expect(seek.locator('.gold-cta-emoji')).toHaveText('🔮');
    const seekStyle = await seek.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundImage, shadow: s.boxShadow };
    });
    expect(seekStyle.bg).toContain(MAIN_GOLD);
    expect(seekStyle.shadow).toContain(`${EDGE} 0px 3px 0px`);
    await capture(page, 'sitewide-gold-crystal-ball', testInfo);
  });

  test('secondary About CTA and non-primary controls are unchanged', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/about', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    const backHome = page.locator('a:has-text("Return to Home")').last();
    await expect(backHome).toBeVisible({ timeout: 30_000 });
    await expect(backHome).not.toHaveClass(/gold-3d-btn/);
    const bg = await backHome.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toBe('none');
  });
});
