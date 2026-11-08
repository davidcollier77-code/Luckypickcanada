import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Province-marker interaction guard.
 *
 * The map's server render needs a database, and CI has none, so the stories
 * payload is answered from this local fixture instead. The client component,
 * the CSS and the click handlers under test are the real ones.
 */
const PROVINCES = [
  { code: 'YT', name: 'Yukon' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'AB', name: 'Alberta' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'ON', name: 'Ontario' },
  { code: 'QC', name: 'Quebec' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
];

const mapStories = Array.from({ length: 21 }, (_, index) => {
  const province = PROVINCES[index % PROVINCES.length];
  return {
    id: String(index + 1),
    firstName: index < 2 ? `Recent${index + 1}` : `Tester${province.code}`,
    province: province.code,
    provinceName: province.name,
    preview: `Preview for ${province.name}.`,
    story: `Full story for ${province.name}.`,
    createdAt: new Date(Date.now() - (index < 2 ? (index + 1) * 3_600_000 : (48 + index) * 3_600_000)).toISOString(),
    reactionCount: 0,
  };
});

const provinceCounts = mapStories.reduce<Record<string, number>>((counts, story) => {
  counts[story.province] = (counts[story.province] || 0) + 1;
  return counts;
}, {});

const mapData = {
  stories: mapStories,
  provinceCounts,
  totalStories: mapStories.length,
  provincesWithStories: Object.keys(provinceCounts).length,
  isConfigured: true,
};

/** The Maritime fan-out that the stylesheet applies at each width band. */
const MARITIME_FAN = {
  narrow: { NB: [72.5, 70.5], PE: [80, 69], NS: [84, 80] },
  wide: { NB: [74.5, 77.5], PE: [80, 71], NS: [85.5, 80.5] },
} as const;

async function openPopulatedMap(page: Page) {
  await page.route('**/api/lucky-stories*', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mapData) });
  });
  await page.goto('/map', { waitUntil: 'domcontentloaded' });
  // Interaction is what is under test, not the smooth-scroll animation: with it
  // enabled the artwork keeps moving while Playwright clicks and the click can
  // land beside the marker.
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  await expect(page.locator('.province-marker')).toHaveCount(PROVINCES.length);
  await expect(page.locator('.map-statistics .map-statistic')).toHaveCount(1);
  await expect(page.locator('.map-statistics')).toContainText('Total lucky stories shared (All-time)');
  await expect(page.locator('.map-statistics')).toContainText('21');
  await expect(page.locator('.map-statistics')).not.toContainText('Provinces with lucky moments');
  await expect(page.locator('.map-statistics')).not.toContainText('Mapped story markers');
  // The client refresh replaces the empty server payload, which changes the
  // panel and statistic heights; let that layout settle before clicking.
  await page.waitForTimeout(500);
}

test('every province marker selects only its own province when clicked', async ({ page }) => {
  test.setTimeout(120_000);
  await openPopulatedMap(page);
  const pressed = page.locator('.province-marker[aria-pressed="true"]');
  const panelHeading = page.locator('.map-story-panel p').first();

  for (const province of PROVINCES) {
    const marker = page.locator(`.province-marker[data-province="${province.code}"]`);
    // A plain click, not a forced one: this fails if another marker covers the target.
    await marker.click();
    await expect(marker).toHaveAttribute('aria-pressed', 'true');
    await expect(pressed).toHaveCount(1);
    await expect(panelHeading).toHaveText(province.name);
  }

  // Keyboard activation on a native button must reach the same state.
  await page.locator('.province-marker[data-province="BC"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.province-marker[data-province="BC"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(panelHeading).toHaveText('British Columbia');
});

test('the rolling 24-hour filter shows only the two recent stories', async ({ page }) => {
  await openPopulatedMap(page);
  await page.getByRole('button', { name: 'Last 24 Hours' }).click();
  const recentStoryCards = page.locator('.map-community-section section[aria-label$="recent stories"] button');
  await expect(recentStoryCards).toHaveCount(2);
  await expect(page.getByText('Recent1', { exact: true })).toBeVisible();
  await expect(page.getByText('Recent2', { exact: true })).toBeVisible();
});

test('province marker centres are their own hit targets and the Maritime fan is intact', async ({ page }) => {
  await openPopulatedMap(page);
  // The map sits below the fold; elementFromPoint only answers for points
  // inside the viewport, so the artwork must be scrolled into view first.
  await page.locator('.official-map-artwork').scrollIntoViewIfNeeded();
  const geometry = await page.evaluate(() => {
    const artwork = document.querySelector('.official-map-artwork')!.getBoundingClientRect();
    return [...document.querySelectorAll<HTMLElement>('.province-marker')].map((marker) => {
      const rect = marker.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(cx, cy);
      // The transparent ::before ring is part of the effective target (PR #1774).
      const ring = Number.parseFloat(getComputedStyle(marker, '::before').top);
      const ringPx = Number.isFinite(ring) ? Math.abs(ring) : 0;
      return {
        code: marker.dataset.province!,
        size: Math.round(rect.width * 10) / 10,
        effectiveSize: Math.round((rect.width + ringPx * 2) * 10) / 10,
        cx: Math.round(cx * 10) / 10,
        cy: Math.round(cy * 10) / 10,
        x: Math.round(((cx - artwork.left) / artwork.width) * 1000) / 10,
        y: Math.round(((cy - artwork.top) / artwork.height) * 1000) / 10,
        hitsSelf: hit ? hit.closest('.province-marker') === marker : false,
      };
    });
  });

  for (const marker of geometry) {
    expect(marker.hitsSelf, `${marker.code} centre is covered`).toBe(true);
    expect(marker.effectiveSize, `${marker.code} is below the 24 px target floor`).toBeGreaterThanOrEqual(24);
  }

  for (let i = 0; i < geometry.length; i += 1) {
    for (let j = i + 1; j < geometry.length; j += 1) {
      const a = geometry[i];
      const b = geometry[j];
      const distance = Math.hypot(a.cx - b.cx, a.cy - b.cy);
      expect(distance, `${a.code}/${b.code} markers overlap`).toBeGreaterThan(Math.min(a.size, b.size));
    }
  }

  const width = page.viewportSize()?.width ?? 0;
  const fan = width <= 620 ? MARITIME_FAN.narrow : MARITIME_FAN.wide;
  for (const [code, [x, y]] of Object.entries(fan)) {
    const marker = geometry.find((entry) => entry.code === code)!;
    expect(Math.abs(marker.x - x), `${code} left position`).toBeLessThanOrEqual(0.6);
    expect(Math.abs(marker.y - y), `${code} top position`).toBeLessThanOrEqual(0.6);
  }
});
