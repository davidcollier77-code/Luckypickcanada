import { test, expect, type Locator, type Page, type TestInfo } from '@playwright/test';

/**
 * Browser-level verification for `specs/062-homepage-gold-button-polish`.
 *
 * These checks cover the behaviour a CSS-only inspection could not prove: the
 * shared raised 3D rest treatment, hover lift, press flattening, the shared
 * shimmer sweep, the preserved Tip Jar/Suggestion glow pulse, and CTA
 * alignment across the desktop and both mobile viewports.
 *
 * No new snapshot baselines are introduced; evidence screenshots are written
 * to the Playwright output directory and attached to the HTML report, which
 * the existing Visual QA workflow already uploads.
 */

const GOLD_CTA = '.homepage-experience .gold-3d-btn';
// Measured metallic edge (#8a550c) of the shared emblem-matched gold ramp.
const GOLD_EDGE_COLOR = 'rgb(138, 85, 12)';

/**
 * Representative CTAs. `glow` marks buttons whose running `goldBtnGlow`
 * keyframes own the `box-shadow` property, so only their lift and pressed
 * states (not the hover edge length) can be asserted.
 */
const REPRESENTATIVE_CTAS = [
  { name: 'lucky-meter', selector: `${GOLD_CTA}[href="/lucky-meter"]`, glow: false },
  { name: 'tip-jar', selector: '.homepage-experience button.gold-3d-btn:has-text("Open the tip jar")', glow: true },
];

/** Parses the translateY component of a computed transform. */
function translateY(transform: string): number {
  if (!transform || transform === 'none') return 0;
  const values = transform.match(/matrix(3d)?\(([^)]+)\)/)?.[2].split(',').map(Number);
  if (!values) throw new Error(`Unrecognised transform: ${transform}`);
  return values.length === 16 ? values[13] : values[5];
}

async function openHomepage(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await expect(page.locator('main')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(GOLD_CTA).first()).toBeVisible({ timeout: 30_000 });
}

/** Screenshots one element into the test output directory and the HTML report. */
async function capture(target: Locator, name: string, testInfo: TestInfo) {
  const path = testInfo.outputPath(`${name}.png`);
  await target.screenshot({ path, animations: 'disabled' });
  await testInfo.attach(name, { path, contentType: 'image/png' });
}

/** Screenshots the current viewport so tall pages stay within texture limits. */
async function captureViewport(page: Page, name: string, testInfo: TestInfo) {
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, animations: 'disabled' });
  await testInfo.attach(name, { path, contentType: 'image/png' });
}

test.describe('Homepage Gold CTA', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/visits', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ visits: 12345 }),
      });
    });
  });

  test('nine gold CTAs keep the raised rest treatment and stay aligned', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await openHomepage(page);

    await expect(page.locator(GOLD_CTA)).toHaveCount(9);

    // One pass keeps every measurement on the same scroll offset, so the
    // overlap and alignment comparisons are meaningful.
    const ctas = await page.$$eval(GOLD_CTA, (elements) => elements.map((element, index) => {
      const computed = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        index,
        text: (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 32),
        left: rect.left,
        top: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
        transform: computed.transform,
        boxShadow: computed.boxShadow,
        borderRadius: computed.borderTopLeftRadius,
        animationName: computed.animationName,
      };
    }));

    const viewport = page.viewportSize()!;
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth, 'homepage overflows horizontally').toBeLessThanOrEqual(viewport.width + 1);

    for (const cta of ctas) {
      // FR-001: the solid 3px gold bottom edge is present at rest on every CTA.
      expect(cta.boxShadow, `missing raised edge on "${cta.text}"`).toContain(`${GOLD_EDGE_COLOR} 0px 3px 0px`);
      // Rest position must not be lifted or pressed.
      expect(Math.abs(translateY(cta.transform)), `"${cta.text}" is not at rest`).toBeLessThanOrEqual(0.5);
      // Existing pill geometry is preserved.
      expect(parseFloat(cta.borderRadius), `"${cta.text}" lost its pill radius`).toBeGreaterThanOrEqual(999);

      // FR-006: no CTA overflows the viewport horizontally.
      expect(cta.left, `"${cta.text}" starts off-screen`).toBeGreaterThanOrEqual(-1);
      expect(cta.left + cta.width, `"${cta.text}" overflows the viewport`).toBeLessThanOrEqual(viewport.width + 1);
      expect(cta.width, `"${cta.text}" has no width`).toBeGreaterThan(0);
      // Touch-target height on desktop and mobile.
      expect(cta.height, `"${cta.text}" is shorter than 44px`).toBeGreaterThanOrEqual(44);
    }

    // No two CTAs may overlap on the page.
    for (let a = 0; a < ctas.length; a += 1) {
      for (let b = a + 1; b < ctas.length; b += 1) {
        const first = ctas[a];
        const second = ctas[b];
        const horizontalOverlap = Math.min(first.left + first.width, second.left + second.width) - Math.max(first.left, second.left);
        const verticalOverlap = Math.min(first.top + first.height, second.top + second.height) - Math.max(first.top, second.top);
        expect(
          horizontalOverlap > 1 && verticalOverlap > 1,
          `CTAs "${first.text}" and "${second.text}" overlap`,
        ).toBeFalsy();
      }
    }

    // Evidence: the top of the page and the two glowing CTAs at rest.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await captureViewport(page, `gold-cta-rest-top-${testInfo.project.name}`, testInfo);

    await page.locator('.homepage-experience button.gold-3d-btn:has-text("Open the tip jar")').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await captureViewport(page, `gold-cta-rest-glow-${testInfo.project.name}`, testInfo);
  });

  test('hover lifts and press flattens each representative CTA', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await openHomepage(page);

    for (const cta of REPRESENTATIVE_CTAS) {
      const button = page.locator(cta.selector).first();
      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeVisible();

      const box = (await button.boundingBox())!;
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      await page.mouse.move(centerX, centerY);

      // FR-002: hover raises the CTA by 2px.
      await expect
        .poll(async () => translateY(await button.evaluate((element) => getComputedStyle(element).transform)), {
          timeout: 5_000,
        })
        .toBeLessThanOrEqual(-1.5);

      if (!cta.glow) {
        // FR-002: the gold edge lengthens to 5px on hover. Glowing buttons are
        // excluded because their running keyframes own `box-shadow`.
        await expect
          .poll(async () => button.evaluate((element) => getComputedStyle(element).boxShadow), { timeout: 5_000 })
          .toContain(`${GOLD_EDGE_COLOR} 0px 5px 0px`);
      }

      await capture(button, `gold-cta-hover-${cta.name}-${testInfo.project.name}`, testInfo);

      // FR-002: pressing pushes the CTA down and collapses the edge to 1px.
      // The pressed rule stops the glow animation, so this holds for both CTAs.
      await page.mouse.down();
      await expect
        .poll(async () => translateY(await button.evaluate((element) => getComputedStyle(element).transform)), {
          timeout: 5_000,
        })
        .toBeGreaterThanOrEqual(1.5);

      const pressed = await button.evaluate((element) => {
        const computed = getComputedStyle(element);
        return { boxShadow: computed.boxShadow, animationName: computed.animationName };
      });
      expect(pressed.boxShadow, `pressed edge missing on "${cta.name}"`).toContain(`${GOLD_EDGE_COLOR} 0px 1px 0px`);
      expect(pressed.boxShadow).toContain('0px 2px 5px');
      expect(pressed.boxShadow).toContain('inset');
      if (cta.glow) {
        expect(pressed.animationName, 'glow must pause while pressed').toBe('none');
      }

      await capture(button, `gold-cta-pressed-${cta.name}-${testInfo.project.name}`, testInfo);

      // Release away from the CTA so no click handler or navigation fires.
      await page.mouse.move(centerX, Math.max(centerY - 200, 1));
      await page.mouse.up();

      // FR-002: releasing returns the CTA to its rest depth.
      await expect
        .poll(async () => translateY(await button.evaluate((element) => getComputedStyle(element).transform)), {
          timeout: 5_000,
        })
        .toBeGreaterThanOrEqual(-0.5);
    }
  });

  test('Tip Jar and Suggestion share the shimmer sweep and glow pulse', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await openHomepage(page);

    const shimmers = page.locator(`${GOLD_CTA} .gold-shimmer`);
    await expect(shimmers).toHaveCount(2);

    for (let index = 0; index < 2; index += 1) {
      const shimmer = shimmers.nth(index);
      await shimmer.scrollIntoViewIfNeeded();
      const style = await shimmer.evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          animationName: computed.animationName,
          animationDuration: computed.animationDuration,
          animationIterationCount: computed.animationIterationCount,
          opacity: computed.opacity,
        };
      });

      // FR-003: the same 12s moving shimmer is present on both buttons.
      expect(style.animationName).toContain('shimmer');
      expect(style.animationDuration).toBe('12s');
      expect(style.animationIterationCount).toBe('infinite');
      expect(Number(style.opacity)).toBeGreaterThan(0);
    }

    const glowButtons = page.locator(`${GOLD_CTA}.gold-btn-glow`);
    await expect(glowButtons).toHaveCount(2);

    for (let index = 0; index < 2; index += 1) {
      const button = glowButtons.nth(index);
      await button.scrollIntoViewIfNeeded();
      const style = await button.evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          animationName: computed.animationName,
          animationDuration: computed.animationDuration,
          animationIterationCount: computed.animationIterationCount,
          boxShadow: computed.boxShadow,
          text: (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 32),
        };
      });

      // FR-004: the existing 3s gold glow pulse still runs on both buttons.
      expect(style.animationName, `glow missing on "${style.text}"`).toContain('goldBtnGlow');
      expect(style.animationDuration).toBe('3s');
      expect(style.animationIterationCount).toBe('infinite');
      // The raised edge is retained while glowing.
      expect(style.boxShadow).toContain(`${GOLD_EDGE_COLOR} 0px 3px 0px`);
    }

    const tipJar = page.locator('.homepage-experience button.gold-3d-btn:has-text("Open the tip jar")');
    await capture(tipJar, `gold-cta-tip-jar-${testInfo.project.name}`, testInfo);
    await capture(
      page.locator('#suggestion-box-submit'),
      `gold-cta-suggestion-${testInfo.project.name}`,
      testInfo,
    );
  });

  test('reduced motion keeps the raised edge without movement or shimmer', async ({ page }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHomepage(page);

    const button = page.locator(`${GOLD_CTA}[href="/lucky-meter"]`).first();
    await button.scrollIntoViewIfNeeded();

    // FR-005: the shimmer sweep is disabled and hidden.
    for (let index = 0; index < 2; index += 1) {
      const shimmer = page.locator(`${GOLD_CTA} .gold-shimmer`).nth(index);
      await shimmer.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => {});
      const style = await shimmer.evaluate((element) => {
        const computed = getComputedStyle(element);
        return { animationName: computed.animationName, opacity: computed.opacity };
      });
      expect(style.animationName).toBe('none');
      expect(Number(style.opacity)).toBe(0);
    }

    // FR-005: hover and press no longer move the button or change its brightness.
    const box = (await button.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(350);
    const hoverStyle = await button.evaluate((element) => {
      const computed = getComputedStyle(element);
      return { transform: computed.transform, filter: computed.filter };
    });
    expect(Math.abs(translateY(hoverStyle.transform))).toBeLessThanOrEqual(0.5);
    expect(hoverStyle.filter === 'none' || hoverStyle.filter.includes('brightness(1)')).toBeTruthy();

    await page.mouse.down();
    await page.waitForTimeout(200);
    const pressedStyle = await button.evaluate((element) => {
      const computed = getComputedStyle(element);
      return { transform: computed.transform, boxShadow: computed.boxShadow };
    });
    await page.mouse.up();

    expect(Math.abs(translateY(pressedStyle.transform))).toBeLessThanOrEqual(0.5);
    // The static raised shadow must survive reduced motion.
    expect(pressedStyle.boxShadow).toContain(`${GOLD_EDGE_COLOR} 0px 3px 0px`);
  });
});
