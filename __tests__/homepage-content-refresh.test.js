import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { faqItems } from '../app/homepage/faq-content';

/**
 * Source and content guard for `specs/106-homepage-content-presentation`.
 *
 * The approved wording must appear verbatim in the homepage sections, the Tip
 * Jar and the Suggestion Box, the visible FAQ must come from the same module as
 * the FAQPage structured data, and the existing storytelling, celebration and
 * form machinery must stay in place.
 */

const read = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8');

const homePageSource = read('app/homepage/HomePage.js');
const faqSectionSource = read('app/homepage/FAQSection.js');
const pageSource = read('app/page.js');
const mapSource = read('app/lucky-map-of-canada/lucky-map-of-canada.js');

const LUCKY_METER_COPY =
  "How's your luck looking today? Give the Luck Generator a try and discover your daily reading. Sit back and enjoy the show as your result comes to life with a little sparkle and Canadian inspiration!";
const DAILY_CARD_COPY =
  "A little surprise is waiting for you! Discover today's Lucky Card, enjoy the reveal, and add another special card to your collection. Keep collecting, because you never know when new cards might be added!";
const CRYSTAL_BALL_COPY =
  'Have something on your mind? Take a moment, focus on your question, and let the Crystal Ball reveal a little mystery. You never know what kind of unexpected message might be waiting for you!';
const LUCKY_PICK_COPY =
  'Get ready to discover your own little touch of luck! Enjoy a fun and exciting reveal featuring your special set of lucky numbers, a colour to wear for a little extra luck, and a lucky day to look forward to. Who knows what little surprises the day might bring? Enjoy it yourself or share a little luck with someone special!';

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

const STORIES_CARD_COPY =
  'Luck means something different to everyone. It might be a funny coincidence, an unexpected helping hand, a life-changing moment, a second chance, or simply being lucky to be here. Every story, big or small, has a place in our community.';

const MAP_INTRO_PARAGRAPHS = [
  'Luck means something different to everyone. It might be a funny coincidence, an unexpected helping hand, a life-changing moment, a second chance, or simply being lucky to be here. Every story, big or small, has a place in our community.',
  "Explore stories shared across Canada, browse by province and territory, and see how our community is growing province by province. Read the experiences people have shared, celebrate the stories that resonate with you, and see each story's celebration count. Then share a lucky story of your own.",
];

describe('Homepage section wording', () => {
  it.each([
    ['Luck Generator', LUCKY_METER_COPY],
    ['Daily Lucky Card Reveal', DAILY_CARD_COPY],
    ['Crystal Ball', CRYSTAL_BALL_COPY],
    ['Lucky Reveals', LUCKY_PICK_COPY],
  ])('renders the approved %s copy verbatim', (_label, copy) => {
    expect(homePageSource).toContain(copy);
  });

  it('keeps the four experience cards and their destinations', () => {
    for (const href of ['/lucky-meter', '/reveal', '/crystal-ball', '/map']) {
      expect(homePageSource).toContain(`href="${href}"`);
    }
  });

  it('replaces the previous section copy instead of appending to it', () => {
    expect(homePageSource).not.toContain('Take a moment, tune in to today’s energy');
    expect(homePageSource).not.toContain('A new Lucky Card awaits your collection');
    expect(homePageSource).not.toContain('Have a question in mind? Focus your intention');
    expect(homePageSource).not.toContain('Leave a tip for the journey.');
    expect(homePageSource).not.toContain('Help make Lucky Pick Canada better');
  });
});

describe('Tip Jar copy and behaviour', () => {
  it('presents the approved heading and all three paragraphs', () => {
    expect(homePageSource).toContain('Tip Jar — Help Keep the Luck Rolling');
    for (const paragraph of TIP_JAR_PARAGRAPHS) {
      expect(homePageSource).toContain(paragraph);
    }
  });

  it('keeps the existing Tip Jar checkout trigger', () => {
    expect(homePageSource).toContain('Open the tip jar');
    expect(homePageSource).toContain('openTipJar');
    expect(homePageSource).toContain("setCheckoutType('tip')");
  });
});

describe('Suggestion Box copy and form contract', () => {
  it('presents the approved heading and all four paragraphs', () => {
    expect(homePageSource).toContain("Suggestion Box — Your Ideas Help Shape What's Next");
    for (const paragraph of SUGGESTION_PARAGRAPHS) {
      expect(homePageSource).toContain(paragraph);
    }
  });

  it('uses the approved labels, placeholder and submit button', () => {
    expect(homePageSource).toMatch(/Name <span>\(optional\)<\/span>/);
    expect(homePageSource).toMatch(/Email <span>\(optional\)<\/span>/);
    expect(homePageSource).toMatch(/Your suggestion <span>\(required\)<\/span>/);
    expect(homePageSource).toContain(
      "placeholder=\"Tell us what's on your mind. What would you love to see on Lucky Pick Canada?\"",
    );
    expect(homePageSource).toContain("'Share Your Idea'");
  });

  it('preserves validation, honeypot, Turnstile and the existing endpoint', () => {
    expect(homePageSource).toContain('action="/api/suggestions"');
    expect(homePageSource).toContain('method="post"');
    expect(homePageSource).toContain('minLength="10"');
    expect(homePageSource).toContain('maxLength="1000"');
    expect(homePageSource).toContain('className="suggestion-box-honeypot"');
    expect(homePageSource).toContain('TurnstileField');
    expect(homePageSource).toContain('onSubmit={handleSuggestionSubmit}');
    expect(homePageSource).toContain("suggestion-box-notice-success");
    expect(homePageSource).toContain("suggestion-box-notice-error");
  });
});

describe('Lucky Community Stories and Community Map', () => {
  it('uses the approved introduction verbatim', () => {
    for (const paragraph of MAP_INTRO_PARAGRAPHS) {
      expect(mapSource).toContain(paragraph);
    }
  });

  it('aligns the homepage Lucky Community Stories card with the approved wording', () => {
    expect(homePageSource).toContain(STORIES_CARD_COPY);
    expect(homePageSource).not.toContain(
      'A community space to share your own experiences of luck and good fortune',
    );
    // The existing non-testimonial note is preserved, not replaced.
    expect(homePageSource).toContain('these are not business reviews or testimonials');
    expect(homePageSource).toMatch(/<Link href="\/map"[^>]*>[\s\S]{0,200}EXPLORE LUCKY COMMUNITY STORIES/);
  });

  it('preserves story reading, celebration and the running tally', () => {
    expect(mapSource).toContain("fetch('/api/lucky-stories/react'");
    expect(mapSource).toContain('celebratedStories');
    expect(mapSource).toContain("'Celebrated 🎉'");
    expect(mapSource).toContain('Celebrate');
    expect(mapSource).toMatch(/reactions\[story\.id\]/);
    expect(mapSource).toContain('shareStory');
  });

  it('does not introduce a second reaction system or social-media naming', () => {
    expect(mapSource).not.toContain('/api/lucky-stories/like');
    expect(mapSource).not.toContain('facebook.com');
    expect(mapSource).not.toMatch(/aria-label="Like/i);
  });
});

describe('FAQ content and structured data', () => {
  const expectedQuestions = [
    'How does the Daily Lucky Card generator work?',
    'What is the Luck Generator, and how does it work?',
    'Is Lucky Pick Canada free to use?',
    'What are Lucky Community Stories and the Community Map?',
    'Is Lucky Pick Canada intended for entertainment?',
    'How does the Gift Reveal work?',
    'How does the Crystal Ball work?',
    'How many fortunes can I get each day?',
    'Can I ask the Crystal Ball a question?',
    'When does my daily Crystal Ball allowance reset?',
    'Are the fortunes guaranteed to come true?',
    'When do the daily experiences reset?',
    'What are the activity counters?',
    'What do the purchase counters mean?',
  ];

  it('exposes exactly the fourteen approved questions in order', () => {
    expect(faqItems).toHaveLength(14);
    expect(faqItems.map((item) => item.question)).toEqual(expectedQuestions);
  });

  it('keeps every answer complete and on-message', () => {
    for (const item of faqItems) {
      expect(item.answer.length).toBeGreaterThan(80);
      expect(item.answer).not.toMatch(/lorem|TODO|coming soon/i);
    }

    expect(faqItems[0].answer).toContain('Some cards are rarer than others');
    expect(faqItems[1].answer).toContain('daily luck percentage');
    expect(faqItems[2].answer).toContain('are free to enjoy');
    expect(faqItems[3].answer).toContain('see each story\'s celebration count');
    expect(faqItems[4].answer).toContain('not a lottery operator or gambling service');
    expect(faqItems[5].answer).toContain('recipient receives an email with a special link');
    expect(faqItems[6].answer).toContain('No question is needed');
    expect(faqItems[7].answer).toContain('one daily fortune per day');
    expect(faqItems[8].answer).toContain('one optional follow-up question');
    expect(faqItems[9].answer).toContain('midnight based on your local time zone');
    expect(faqItems[10].answer).toContain('cannot predict lottery results');
    expect(faqItems[11].answer).toContain('midnight local time');
    expect(faqItems[12].answer).toContain('activity counters');
    expect(faqItems[13].answer).toContain('how many times that experience has been purchased');
  });

  it('feeds both the visible accordion and the FAQPage structured data from one module', () => {
    expect(faqSectionSource).toContain("import { faqItems } from './faq-content'");
    expect(pageSource).toContain("import { faqItems } from './homepage/faq-content'");
    expect(pageSource).toContain('"@type": "FAQPage"');
    expect(pageSource).toContain('"mainEntity": faqItems.map');

    // No second, hand-maintained copy of the questions may exist.
    expect(faqSectionSource).not.toMatch(/question:\s*['"]/);
    expect(pageSource).not.toMatch(/question:\s*["']/);
  });

  it('renders paragraph breaks in the longer answers', () => {
    expect(faqSectionSource).toContain("faq.answer.split('\\n\\n')");
  });
});
