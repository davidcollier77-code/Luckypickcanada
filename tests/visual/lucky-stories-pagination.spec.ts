import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Paged province feed guard.
 *
 * The database is not configured in CI, so the stories payload is answered from
 * this fixture. The real map component, its request URLs, scrolling behaviour
 * and rendering are under test.
 */
const PROVINCE_ORDER = ['BC', 'AB', 'SK', 'MB', 'ON', 'QC', 'NB', 'NS', 'PE', 'NL', 'YT', 'NT', 'NU'];

const onStories = Array.from({ length: 7 }, (_, index) => ({
  id: String(100 + index),
  firstName: `Ontario${index + 1}`,
  province: 'ON',
  provinceName: 'Ontario',
  preview: `Ontario preview ${index + 1}.`,
  story: `Ontario story ${index + 1}.`,
  createdAt: new Date(Date.now() - (index + 1) * 3_600_000).toISOString(),
  reactionCount: 0,
}));

const bcStories = Array.from({ length: 2 }, (_, index) => ({
  id: String(200 + index),
  firstName: `Coastal${index + 1}`,
  province: 'BC',
  provinceName: 'British Columbia',
  preview: `British Columbia preview ${index + 1}.`,
  story: `British Columbia story ${index + 1}.`,
  createdAt: new Date(Date.now() - (index + 12) * 3_600_000).toISOString(),
  reactionCount: 0,
}));

const allStories = [...onStories, ...bcStories];

function countByProvince(stories: typeof allStories) {
  return stories.reduce<Record<string, number>>((counts, story) => {
    counts[story.province] = (counts[story.province] || 0) + 1;
    return counts;
  }, {});
}

const provinceCounts = countByProvince(allStories);

function pickDefault(counts: Record<string, number>) {
  let code = 'ON';
  let best = 0;
  for (const candidate of PROVINCE_ORDER) {
    const count = counts[candidate] || 0;
    if (count > best) {
      best = count;
      code = candidate;
    }
  }
  return code;
}

function buildPayload(url: URL) {
  const summaryOnly = url.searchParams.get('summary') === '1';
  const provinceParam = url.searchParams.get('province');
  const selectedProvince = PROVINCE_ORDER.includes(provinceParam ?? '')
    ? (provinceParam as string)
    : pickDefault(provinceCounts);
  const provinceStories = allStories
    .filter((story) => story.province === selectedProvince)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const limit = Number(url.searchParams.get('limit') ?? 3);
  const offset = Number(url.searchParams.get('offset') ?? 0);
  const stories = summaryOnly ? [] : provinceStories.slice(offset, offset + limit);
  const storyParam = url.searchParams.get('story');

  return {
    stories,
    linkedStory: allStories.find((story) => story.id === storyParam) ?? null,
    provinceCounts,
    allTimeProvinceCounts: provinceCounts,
    totalStories: allStories.length,
    provincesWithStories: Object.keys(provinceCounts).length,
    recentStories: PROVINCE_ORDER.flatMap((province) => allStories
      .filter((story) => story.province === province)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 3)),
    defaultProvince: pickDefault(provinceCounts),
    selectedProvince,
    provinceTotal: provinceStories.length,
    hasMore: offset + stories.length < provinceStories.length,
    isConfigured: true,
  };
}

type StoryRequest = { province: string | null; offset: number; limit: number; summary: boolean };

async function openPagedMap(page: Page) {
  const requests: StoryRequest[] = [];

  await page.route('**/api/lucky-stories*', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();

    const url = new URL(route.request().url());
    requests.push({
      province: url.searchParams.get('province'),
      offset: Number(url.searchParams.get('offset') ?? 0),
      limit: Number(url.searchParams.get('limit') ?? 3),
      summary: url.searchParams.get('summary') === '1',
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildPayload(url)),
    });
  });

  await page.goto('/map', { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  await expect(page.locator('.province-marker[data-province="ON"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.map-story-card')).toHaveCount(3);

  return requests;
}

test('the first page is three province stories and scrolling loads the rest', async ({ page }) => {
  test.setTimeout(120_000);
  const requests = await openPagedMap(page);

  // The first feed request is one bounded province page, not the collection.
  const feedRequests = requests.filter((request) => !request.summary);
  expect(feedRequests[0]).toEqual({ province: 'ON', offset: 0, limit: 3, summary: false });

  // The heading reports the full province total while only three cards are loaded.
  await expect(page.locator('.map-story-panel')).toContainText('7 lucky stories');
  await expect(page.locator('.province-select-card').filter({ hasText: 'Ontario' })).toContainText('7 stories');

  const cards = page.locator('.map-story-card');
  await expect(cards).toHaveCount(3);
  await expect(cards.first()).toContainText('Ontario1');

  const sentinel = page.locator('.map-feed-sentinel');
  await sentinel.scrollIntoViewIfNeeded();
  await expect(cards).toHaveCount(6);
  await expect(cards.nth(4)).toContainText('Ontario5');

  await sentinel.scrollIntoViewIfNeeded();
  await expect(cards).toHaveCount(7);
  await expect(sentinel).not.toContainText('Scroll for more lucky stories');

  // No card belongs to another province.
  for (const id of await cards.evaluateAll((nodes) => nodes.map((node) => node.id))) {
    expect(id.startsWith('story-1'), `unexpected story from another province: ${id}`).toBe(true);
  }

  // Every page request asked for three rows, and the offsets only move forward.
  // React StrictMode replays the mount effect in development, so the first
  // offset can appear twice; the rendered pages themselves never duplicate.
  const pageRequests = requests.filter((request) => !request.summary);
  expect([...new Set(pageRequests.map((request) => request.offset))]).toEqual([0, 3, 6]);
  expect(pageRequests.every((request) => request.limit === 3)).toBe(true);

  const requestCount = requests.filter((request) => !request.summary).length;
  await page.waitForLoadState('networkidle');
  expect(requests.filter((request) => !request.summary)).toHaveLength(requestCount);
});

test('switching province replaces the feed with that province only', async ({ page }) => {
  test.setTimeout(120_000);
  const requests = await openPagedMap(page);

  await page.locator('.province-marker[data-province="BC"]').click();
  await expect(page.locator('.province-marker[data-province="BC"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.map-story-panel')).toContainText('2 lucky stories');
  await expect(page.locator('.map-story-card')).toHaveCount(2);
  await expect(page.locator('.map-story-card').first()).toContainText('Coastal1');

  const bcRequest = requests.filter((request) => !request.summary).at(-1);
  expect(bcRequest).toMatchObject({ province: 'BC', offset: 0, limit: 3 });
  await expect(page.locator('.map-story-card', { hasText: 'Ontario' })).toHaveCount(0);
});


test('the story form requires one of the thirteen canonical provinces or territories', async ({ page }) => {
  test.setTimeout(120_000);
  await openPagedMap(page);

  await page.getByRole('button', { name: /share your lucky story/i }).click();

  const dialog = page.getByRole('dialog', { name: 'Community Stories' });
  const provinceSelect = dialog.getByRole('combobox', { name: 'Province or territory', exact: true });
  await expect(provinceSelect).toBeVisible();
  await expect(provinceSelect).toHaveAttribute('id', 'lucky-story-province');
  await expect(provinceSelect).toHaveAttribute('required', '');
  await expect(provinceSelect).toHaveValue('');

  const options = provinceSelect.locator('option:not([disabled])');
  await expect(options).toHaveCount(13);
  expect(await options.allTextContents()).toEqual([
    'Alberta',
    'British Columbia',
    'Manitoba',
    'New Brunswick',
    'Newfoundland and Labrador',
    'Northwest Territories',
    'Nova Scotia',
    'Nunavut',
    'Ontario',
    'Prince Edward Island',
    'Quebec',
    'Saskatchewan',
    'Yukon',
  ]);

  await dialog.locator('input[name="name"]').fill('Jane Doe');
  await dialog.locator('textarea[name="story"]').fill('A memorable lucky moment shared with the Canadian community.');

  const storyForm = dialog.locator('form[action="/api/lucky-stories"]');
  // Check native required-field validation directly. CI intentionally has no
  // Turnstile site key, so its submit button is disabled and should not be clicked.
  await expect.poll(() => provinceSelect.evaluate((select) => (select as HTMLSelectElement).validity.valueMissing)).toBe(true);
  await expect.poll(() => storyForm.evaluate((form) => (form as HTMLFormElement).checkValidity())).toBe(false);

  await provinceSelect.selectOption({ label: 'Nova Scotia' });
  await expect(provinceSelect).toHaveValue('Nova Scotia');
  await expect.poll(() => provinceSelect.evaluate((select) => (select as HTMLSelectElement).validity.valid)).toBe(true);
  await expect.poll(() => storyForm.evaluate((form) => (form as HTMLFormElement).checkValidity())).toBe(true);
});
