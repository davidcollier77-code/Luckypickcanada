import { test, expect } from '@playwright/test';

const EXPLORE_COOLDOWN_MS = 15_000;

/**
 * Builds a short, valid silent PCM WAV so interaction coverage can verify
 * local audio loading deterministically without playing the real sound in CI.
 */
function createSilentWavFixture() {
  const sampleRate = 8_000;
  const durationMs = 120;
  const channels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = Math.round(sampleRate * durationMs / 1_000) * channels * bytesPerSample;
  const wav = Buffer.alloc(44 + dataSize);

  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  wav.writeUInt16LE(channels * bytesPerSample, 32);
  wav.writeUInt16LE(bitsPerSample, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(dataSize, 40);

  return wav;
}

test.describe("Homepage Visual", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      let seed = 0x6c75636b;

      Math.random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 0x100000000;
      };

      const frozenNow = Date.UTC(2026, 8, 28, 0, 0, 0);
      let timeOffset = 0;

      // Allow tests to predictably advance time for visual verification
      (window as any).__advanceTime = (ms: number) => {
        timeOffset += ms;
      };

      Date.now = () => frozenNow + timeOffset;
    });

    await page.route('**/api/visits', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ visits: 12345 }),
      });
    });
  });

  test('shared sky backdrop remains styled on homepage, Crystal Ball, and Lucky Map', async ({ page }) => {
    for (const route of ['/', '/crystal-ball', '/map']) {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      const backdrop = page.locator('.homepage-sky-backdrop').first();
      await expect(backdrop).toBeAttached({ timeout: 10_000 });
      await expect(backdrop).toHaveCSS('position', 'fixed');
      await expect(backdrop).toHaveCSS('z-index', '-30');

      const backgroundImage = await backdrop.evaluate((element) => (
        window.getComputedStyle(element).backgroundImage
      ));
      const viewport = page.viewportSize();
      const expectedAsset = viewport && viewport.width <= 820
        ? 'crystal-ball-bg-mobile'
        : 'crystal-ball-bg-desktop';
      expect(backgroundImage).toContain(expectedAsset);

      await expect(page.locator('body')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      await expect(page.locator('.homepage-background-foundation')).toHaveCSS('display', 'none');
    }
  });

  test('homepage viewport matches the approved visual baseline', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });

    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('canvas.homepage-star-canvas')).toBeVisible({ timeout: 10_000 });

    await page.waitForLoadState('load', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1_000);

    await expect(page).toHaveScreenshot('homepage-viewport.png', {
      fullPage: false,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.003,
    });
  });

  test('ambient stars twinkle over time', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });

    await expect(page.locator('canvas.homepage-star-canvas')).toBeVisible({ timeout: 10_000 });

    await page.waitForTimeout(1_000);

    const canvas = page.locator('canvas.homepage-star-canvas');
    const snapshot1 = await canvas.screenshot();

    await page.evaluate(() => {
      (window as any).__advanceTime(500);
    });

    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    const snapshot2 = await canvas.screenshot();

    expect(snapshot1).not.toEqual(snapshot2);
  });

  test('explore luck renders visible confetti and preloads its confetti pop sound before scrolling', async ({ page }) => {
    test.setTimeout(60_000);

    // Use Playwright's real media emulation so JavaScript and CSS agree that
    // motion is enabled. Stubbing matchMedia alone can diverge from CSS media queries.
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    // Fulfill the local production confetti audio path with a valid WAV fixture. This keeps
    // confetti and scroll regression checks deterministic in CI.
    await page.route('**/sounds/confetti-pop.wav', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'audio/wav',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: createSilentWavFixture(),
      });
    });

    let confettiPopPreloadRequested = false;
    page.on('request', (request) => {
      if (request.url().includes('/sounds/confetti-pop.wav')) {
        confettiPopPreloadRequested = true;
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });

    const label = 'Explore your luck. Scroll down to the Play and Explore section.';
    const exploreButton = page.locator(`button[aria-label="${label}"]`);

    // The Playwright web server runs Next in dev mode, so the first client bundle
    // can take longer than five seconds to compile and hydrate on a cold runner.
    // Wait for hydration explicitly before requiring its useEffect audio preload.
    await expect(exploreButton).toBeVisible();
    await expect(exploreButton).toHaveAttribute('data-hydrated', 'true', { timeout: 30_000 });
    await expect.poll(() => confettiPopPreloadRequested, {
      timeout: 30_000,
      intervals: [50, 100, 200],
    }).toBe(true);
    await expect(exploreButton).toHaveAttribute('data-confetti-pop-ready', 'true', { timeout: 30_000 });

    const heroStage = page.locator('.hero-image-container');
    const particles = page.locator('canvas[style*="z-index: 100"]');
    await expect(heroStage).toBeVisible();

    const buttonBox = await exploreButton.boundingBox();
    const stageBox = await heroStage.boundingBox();
    expect(buttonBox).not.toBeNull();
    expect(stageBox).not.toBeNull();

    expect(Math.abs((buttonBox!.x + buttonBox!.width / 2) - (stageBox!.x + stageBox!.width / 2))).toBeLessThanOrEqual(1);
    expect(buttonBox!.y + buttonBox!.height).toBeGreaterThanOrEqual(stageBox!.y + stageBox!.height - 1);
    expect(buttonBox!.width).toBeGreaterThan(stageBox!.width * 0.25);

    const computedStagePointerEvents = await heroStage.evaluate((element) => getComputedStyle(element).pointerEvents);
    const computedButtonPointerEvents = await exploreButton.evaluate((element) => getComputedStyle(element).pointerEvents);
    expect(computedStagePointerEvents).toBe('none');
    expect(computedButtonPointerEvents).toBe('auto');

    const tapX = stageBox!.x + stageBox!.width / 2;
    const tapY = stageBox!.y + stageBox!.height * 0.9;
    const hitTargetLabel = await page.evaluate(({ x, y }) => {
      const element = document.elementFromPoint(x, y);
      return element?.closest('button')?.getAttribute('aria-label') ?? null;
    }, { x: tapX, y: tapY });
    expect(hitTargetLabel).toBe(label);

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);

    const targetScrollY = await page.evaluate(() => {
      const luckyMeter = document.getElementById('play-explore');
      return luckyMeter ? window.scrollY + luckyMeter.getBoundingClientRect().top : null;
    });
    expect(targetScrollY).not.toBeNull();

    await exploreButton.click();

    // A canvas element can exist even when the effect failed to draw. Sample
    // its rendered alpha pixels to prove particles actually appeared on screen.
    /** Counts alpha-visible pixels so the test checks rendered particles, not canvas presence. */
    const visibleParticlePixels = () => particles.evaluateAll((elements) => elements.reduce((total, element) => {
      const source = element as HTMLCanvasElement;
      if (!source.width || !source.height) return total;

      const probe = document.createElement('canvas');
      probe.width = 240;
      probe.height = 240;
      const context = probe.getContext('2d');
      if (!context) return total;

      context.drawImage(source, 0, 0, probe.width, probe.height);
      const pixels = context.getImageData(0, 0, probe.width, probe.height).data;
      let visiblePixels = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] > 32) visiblePixels += 1;
      }
      return total + visiblePixels;
    }, 0));

    // Observe rendered pixels immediately so mobile rendering does not consume
    // most of the animation's 200-tick lifetime before the assertion.
    await expect.poll(visibleParticlePixels, {
      timeout: 750,
      intervals: [25, 50, 100],
    }).toBeGreaterThan(5);

    await page.waitForTimeout(300);
    const earlyScrollY = await page.evaluate(() => window.scrollY);
    expect(earlyScrollY).toBeGreaterThanOrEqual(0);
    expect(earlyScrollY).toBeLessThan(targetScrollY!);

    await page.waitForTimeout(1_500);

    const finalScrollY = await page.evaluate(() => window.scrollY);
    expect(finalScrollY).toBeGreaterThan(0);
    expect(Math.abs(finalScrollY - targetScrollY!)).toBeLessThanOrEqual(2);
    // canvas-confetti handles its own canvas, no strict local state cleanup needed.

    // Test: Rapid activations during cooldown are blocked
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(() => window.scrollY === 0);

    // Try clicking multiple times rapidly - should only trigger once
    await exploreButton.click();
    await page.waitForTimeout(50);
    const scrollAfterFirst = await page.evaluate(() => window.scrollY);
    
    // Second immediate click should be blocked (no additional scroll)
    await exploreButton.click();
    await page.waitForTimeout(50);
    const scrollAfterSecond = await page.evaluate(() => window.scrollY);
    
    // Third immediate click should also be blocked
    await exploreButton.click();
    await page.waitForTimeout(50);
    const scrollAfterThird = await page.evaluate(() => window.scrollY);
    
    // All three should show progression from the first click only
    expect(scrollAfterFirst).toBeGreaterThanOrEqual(0);
    expect(scrollAfterSecond).toBe(scrollAfterFirst);
    expect(scrollAfterThird).toBe(scrollAfterFirst);
    
    // Wait for animation to complete
    await page.waitForTimeout(1_500);
    
    // Reset scroll position for remaining tests
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(() => window.scrollY === 0);
    
    // Wait for cooldown to expire before remaining mobile-specific tests
    if (test.info().project.name.startsWith('mobile-')) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForFunction(() => window.scrollY === 0);

      await expect.poll(async () => {
        await exploreButton.click();
        const y = await page.evaluate(() => window.scrollY);
        return y;
      }, {
        timeout: EXPLORE_COOLDOWN_MS + 2_000,
        intervals: [250],
      }).toBeGreaterThan(0);

      await page.waitForTimeout(1_500);
      const clickAfterTouchScrollY = await page.evaluate(() => window.scrollY);
      expect(clickAfterTouchScrollY).toBeGreaterThan(0);

      await page.evaluate(() => {
        document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important');
        window.scrollTo(0, 0);
      });
      await page.waitForFunction(() => window.scrollY === 0);
      await page.evaluate(() => {
        document.documentElement.style.removeProperty('scroll-behavior');
      });

      await expect.poll(async () => {
        await page.touchscreen.tap(tapX, tapY);
        const y = await page.evaluate(() => window.scrollY);
        return y;
      }, {
        timeout: EXPLORE_COOLDOWN_MS + 2_000,
        intervals: [250],
      }).toBeGreaterThan(0);

      await page.waitForTimeout(1_500);
      const secondTouchScrollY = await page.evaluate(() => window.scrollY);
      expect(secondTouchScrollY).toBeGreaterThan(0);
    }
  });

  test('explore luck scroll yields to user keyboard input', async ({ page }) => {
    test.setTimeout(60_000);
    test.skip(test.info().project.name.startsWith('mobile-'), 'Keyboard interruption check is covered on desktop');

    // Use Playwright's real media emulation so JavaScript and CSS agree that
    // motion is enabled. Stubbing matchMedia alone can diverge from CSS media queries.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.route('**/sounds/confetti-pop.wav', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'audio/wav',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: createSilentWavFixture(),
      });
    });


    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });

    const label = 'Explore your luck. Scroll down to the Play and Explore section.';
    const exploreButton = page.locator(`button[aria-label="${label}"]`);
    await expect(exploreButton).toBeVisible();
    await expect(exploreButton).toHaveAttribute('data-hydrated', 'true', { timeout: 30_000 });
    await expect(exploreButton).toHaveAttribute('data-confetti-pop-ready', 'true', { timeout: 30_000 });

    await exploreButton.click();
    await page.waitForTimeout(150);
    await page.keyboard.press('Home');
    await page.waitForTimeout(1_500);

    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('footer and social touch targets stay enlarged without overlapping on mobile', async ({ page }) => {
    test.skip(!test.info().project.name.startsWith('mobile-'), 'Mobile-only touch-target geometry check');

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });

    for (const selector of ['nav[aria-label="Footer navigation"] a', 'nav[aria-label="Social links"] a']) {
      const links = page.locator(selector);
      const count = await links.count();
      expect(count).toBeGreaterThan(1);

      const boxes = [];
      for (let i = 0; i < count; i += 1) {
        const box = await links.nth(i).boundingBox();
        expect(box).not.toBeNull();
        boxes.push(box!);
      }

      const expanded = await Promise.all(
        boxes.map(async (box, i) => {
          const style = await links.nth(i).evaluate((el) => {
            const pseudo = getComputedStyle(el, '::before');
            return {
              left: parseFloat(pseudo.left) || 0,
              right: parseFloat(pseudo.right) || 0,
              top: parseFloat(pseudo.top) || 0,
              bottom: parseFloat(pseudo.bottom) || 0,
            };
          });

          return {
            left: box.x + style.left,
            right: box.x + box.width - style.right,
            top: box.y + style.top,
            bottom: box.y + box.height - style.bottom,
          };
        })
      );

      for (let i = 0; i < expanded.length; i += 1) {
        for (let j = i + 1; j < expanded.length; j += 1) {
          const a = expanded[i];
          const b = expanded[j];
          const horizontalOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const verticalOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          expect(horizontalOverlap > 0 && verticalOverlap > 0).toBeFalsy();

          const sameRow = Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
          if (sameRow) {
            const midpointX = (Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2;
            const midpointY = (Math.max(a.top, b.top) + Math.min(a.bottom, b.bottom)) / 2;
            const owner = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('a')?.getAttribute('href') ?? null, {
              x: midpointX,
              y: midpointY,
            });
            expect(owner).not.toBe(await links.nth(i).getAttribute('href'));
            expect(owner).not.toBe(await links.nth(j).getAttribute('href'));
          }
        }
      }
    }
  });
});
