import { test, expect, type Page, type TestInfo } from '@playwright/test';

/**
 * Browser-level coverage for `specs/106-homepage-content-presentation`.
 *
 * The unit guard proves the approved wording exists in source. This suite proves
 * it actually reaches the rendered page: the four Experience cards, the aligned
 * Lucky Stories card, the Tip Jar and Suggestion Box passages, the ten-question
 * FAQ (expanded by a real click, never clipped), the Community Map introduction,
 * and no horizontal overflow at every configured viewport.
 *
 * It deliberately does not submit the Suggestion Box form, open the Tip Jar
 * checkout or reveal a paid experience: those paths reach Stripe, Turnstile and
 * the database, so their contracts stay with the existing unit and source guards.
 */

const LUCKY_METER_COPY =
  "How's your luck looking today? Give the Lucky Meter a try and discover your daily reading. Sit back and enjoy the show as your result comes to life with a little sparkle and Canadian inspiration!";
const DAILY_CARD_COPY =
  "A little surprise is waiting for you! Discover today's Lucky Card, enjoy the reveal, and add another special card to your collection. Keep collecting, because you never know when new cards might be added!";
const CRYSTAL_BALL_COPY =
  'Have something on your mind? Take a moment, focus on your question, and let the Crystal Ball reveal a little mystery. You never know what kind of unexpected message might be waiting for you!';
const LUCKY_PICK_HEADING = 'Lucky Pick — Your Little Touch of Luck';

const STORIES_CARD_COPY =
  'Luck means something different to everyone. It might be a funny coincidence, an unexpected helping hand, a life-changing moment, a second chance, or simply being lucky to be here. Every story, big or small, has a place in our community.';

const TIP_JAR_PARAGRAPHS = [
  "Enjoying Lucky Pick Canada? If you've had a little fun exploring the site, consider leaving a little something in our Tip Jar. Your support helps keep Lucky Pick Canada going, improving, and growing.",
  "Whether you're simply enjoying the site and would like to show your appreciation, or you have an idea for something you'd love to see in the future, we'd be delighted to hear from you. Every contribution, big or small, helps us build on what we've started.",
  "Whether it's a tip, a donation, or a suggestion, it's sincerely appreciated. Thank you for being part of the journey!",
];

const SUGGESTION_PARAGRAPHS = [
  "Lucky Pick Canada is always growing, and we'd love you to be part of that journey!",
  "Have an idea for something new, a feature you'd enjoy, or an improvement you'd like to see? We'd love to hear from you.",
  'Big ideas, little ideas, and everything in between are welcome. Your suggestions help inspire what comes next and make Lucky Pick Canada an even better place for everyone to enjoy.',
  'Thanks for helping us shape the future!',
];

const SUGGESTION_PLACEHOLDER =
  "Tell us what's on your mind. What would you love to see on Lucky Pick Canada?";

const MAP_INTRO_PARAGRAPHS = [
  'Luck means something different to everyone. It might be a funny coincidence, an unexpected helping hand, a life-changing moment, a second chance, or simply being lucky to be here. Every story, big or small, has a place in our community.',
  "Explore stories shared across Canada, browse by province and territory, and see how our community is growing province by province. Read the experiences people have shared, celebrate the stories that resonate with you, and see each story's celebration count. Then share a lucky story of your own.",
];

/** Routes the visit counter so the homepage never waits on the database. */
async function openHomepage(page: Page) {
  await page.route('**/api/visits', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ visits: 12345 }),
    });
  });

  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await expect(page.locator('#play-explore')).toBeVisible({ timeout: 30_000 });
}

/**
 * Waits until React has attached to the element so a click exercises the real
 * handler instead of the static server markup.
 */
async function waitForHydration(page: Page, selector: string) {
  await page.waitForFunction(
    (target) => {
      const element = document.querySelector(target);
      if (!element) return false;
      return Object.keys(element).some((key) => key.startsWith('__react'));
    },
    selector,
    { timeout: 30_000 },
  );
}

/** Saves a reviewable screenshot of one section as a test artifact. */
async function attachSection(page: Page, selector: string, name: string, testInfo: TestInfo) {
  const section = page.locator(selector).first();
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);

  const path = testInfo.outputPath(`${name}-${testInfo.project.name}.png`);
  await section.screenshot({ path, animations: 'disabled' });
  await testInfo.attach(name, { path, contentType: 'image/png' });
}

test.describe('Homepage content refresh', () => {
  test('renders the approved copy in each Experience card', async ({ page }) => {
    test.setTimeout(120_000);
    await openHomepage(page);

    const cards = [
      { id: '#lucky-meter', copy: LUCKY_METER_COPY },
      { id: '#daily-card-reveal', copy: DAILY_CARD_COPY },
      { id: '#crystal-ball', copy: CRYSTAL_BALL_COPY },
    ];

    for (const card of cards) {
      const article = page.locator(card.id);
      await expect(article).toBeVisible();
      await expect(article).toContainText(card.copy);
    }

    await expect(page.getByRole('heading', { name: LUCKY_PICK_HEADING })).toBeVisible();

    // The destinations behind the four cards must survive the copy refresh.
    for (const href of ['/lucky-meter', '/reveal', '/crystal-ball', '/map']) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeAttached();
    }
  });

  test('the Lucky Stories card carries the approved wording and keeps its map path', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await openHomepage(page);

    const card = page.locator('#community-stories');
    await expect(card).toBeVisible();
    await expect(card).toContainText(STORIES_CARD_COPY);
    await expect(card).toContainText('not business reviews or testimonials');
    await expect(card).not.toContainText('A community space to share your own experiences of luck');

    const explore = card.locator('a.gold-3d-btn');
    await expect(explore).toHaveAttribute('href', '/map');
    await expect(explore).toContainText('EXPLORE LUCKY STORIES');

    await attachSection(page, '#community-stories', 'homepage-lucky-stories-card', testInfo);
  });

  test('presents the Tip Jar passages and keeps its checkout trigger', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await openHomepage(page);

    const section = page.locator('#tip-jar-section');
    await expect(section).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tip Jar — Help Keep the Luck Rolling' })).toBeVisible();

    const passages = section.locator('.homepage-copy-stack p');
    await expect(passages).toHaveCount(TIP_JAR_PARAGRAPHS.length);
    for (const [index, paragraph] of TIP_JAR_PARAGRAPHS.entries()) {
      await expect(passages.nth(index)).toHaveText(paragraph);
    }

    // The existing checkout trigger is present and still a single gold button.
    // It is not clicked: that opens the Stripe checkout flow.
    const tipButton = section.locator('button.gold-3d-btn');
    await expect(tipButton).toHaveCount(1);
    await expect(tipButton).toContainText('Open the tip jar');
    await expect(tipButton).toBeEnabled();

    await attachSection(page, '#tip-jar-section', 'homepage-tip-jar', testInfo);
  });

  test('presents the Suggestion Box copy and keeps the form contract intact', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await openHomepage(page);

    const section = page.locator('#suggestion-box');
    await expect(section).toBeVisible();
    await expect(
      page.getByRole('heading', { name: "Suggestion Box — Your Ideas Help Shape What's Next" }),
    ).toBeVisible();

    const passages = section.locator('.suggestion-box-intro p');
    await expect(passages).toHaveCount(SUGGESTION_PARAGRAPHS.length);
    for (const [index, paragraph] of SUGGESTION_PARAGRAPHS.entries()) {
      await expect(passages.nth(index)).toHaveText(paragraph);
    }

    const form = section.locator('form');
    await expect(form).toHaveAttribute('action', '/api/suggestions');
    await expect(form).toHaveAttribute('method', 'post');

    await expect(section.locator('label:has(input[name="name"])')).toContainText('Name (optional)');
    await expect(section.locator('label:has(input[name="email"])')).toContainText('Email (optional)');
    await expect(section.locator('label:has(textarea[name="message"])')).toContainText('Your suggestion (required)');

    const message = section.locator('textarea[name="message"]');
    await expect(message).toHaveAttribute('placeholder', SUGGESTION_PLACEHOLDER);
    await expect(message).toHaveAttribute('minlength', '10');
    await expect(message).toHaveAttribute('maxlength', '1000');
    await expect(message).toHaveAttribute('required', '');

    // The honeypot stays present and hidden from assistive technology.
    await expect(section.locator('.suggestion-box-honeypot input[name="website"]')).toBeAttached();

    const submit = section.locator('#suggestion-box-submit');
    await expect(submit).toContainText('Share Your Idea');

    // Typing works and an empty submission is blocked by native validation.
    await message.fill('A small idea from the visual QA run.');
    await expect(message).toHaveValue('A small idea from the visual QA run.');
    expect(
      await message.evaluate((element) => {
        const field = element as HTMLTextAreaElement;
        field.value = '';
        return field.validationMessage.length > 0 || !field.checkValidity();
      }),
    ).toBe(true);

    await attachSection(page, '#suggestion-box', 'homepage-suggestion-box', testInfo);
  });

  test('expands the ten-question FAQ by click without clipping the longest answer', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await openHomepage(page);

    const questions = page.locator('.faq-accordion .faq-item > button');
    await expect(questions).toHaveCount(10);

    const communityButton = page.locator('#faq-btn-3');
    await expect(communityButton).toContainText('What are Lucky Stories and the Community Map?');
    await waitForHydration(page, '#faq-btn-3');

    await communityButton.click();
    await expect(communityButton).toHaveAttribute('aria-expanded', 'true');

    const answer = page.locator('#faq-answer-3');
    await expect(answer).toBeVisible();
    await expect(answer.locator('p')).toHaveCount(2);
    await expect(answer).toContainText("see each story's celebration count");

    // The open container is bounded; its content must fit inside that bound.
    await page.waitForTimeout(450);
    const clipping = await answer.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        maxHeight: parseFloat(style.maxHeight),
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
      };
    });
    expect(clipping.maxHeight).toBeGreaterThanOrEqual(1600);
    expect(clipping.scrollHeight).toBeLessThanOrEqual(clipping.clientHeight + 1);

    await attachSection(page, '.faq-section', 'homepage-faq-open', testInfo);

    // Opening another question collapses the previous one.
    const firstButton = page.locator('#faq-btn-0');
    await firstButton.click();
    await expect(firstButton).toHaveAttribute('aria-expanded', 'true');
    await expect(communityButton).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#faq-answer-3')).toBeHidden();
  });

  test('introduces the Community Map with both approved passages', async ({ page }, testInfo) => {
    test.setTimeout(120_000);

    await page.route('**/api/lucky-stories**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ stories: [] }),
      });
    });

    await page.goto('/map', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const intro = page.locator('.map-community-intro');
    await expect(intro).toBeVisible({ timeout: 30_000 });

    const passages = intro.locator('p');
    await expect(passages).toHaveCount(MAP_INTRO_PARAGRAPHS.length);
    for (const [index, paragraph] of MAP_INTRO_PARAGRAPHS.entries()) {
      await expect(passages.nth(index)).toHaveText(paragraph);
    }

    await attachSection(page, '.map-community-intro', 'map-community-intro', testInfo);
  });

  test('keeps the refreshed pages free of horizontal overflow', async ({ page }) => {
    test.setTimeout(120_000);

    await page.route('**/api/lucky-stories**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ stories: [] }),
      });
    });

    for (const route of ['/', '/map']) {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await expect(page.locator('main, .lucky-map-shell').first()).toBeVisible({ timeout: 30_000 });

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${route} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });
});
