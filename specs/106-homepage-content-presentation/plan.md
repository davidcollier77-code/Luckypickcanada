# Implementation Plan: Approved Homepage Content and Presentation Refresh

**Feature**: `specs/106-homepage-content-presentation`
**Branch**: `content/homepage-wording-presentation-20261107`
**Date**: 2026-11-07

## Approach

1. **Single FAQ source.** Add `app/homepage/faq-content.js` exporting the ten approved question/answer pairs. `app/page.js` (server component) and `app/homepage/FAQSection.js` (client accordion) both import it, so the visible FAQ and the FAQPage structured data cannot diverge. Answers use `\n\n` for paragraph breaks; the accordion splits on that and the structured data keeps the same text.
2. **Verbatim copy in existing markup.** `app/homepage/HomePage.js` keeps its current section structure, cards, gold 3D buttons, counters, modals, canvas and checkout wiring. Only the approved paragraphs, the Lucky Pick heading, the Tip Jar heading/passages and the Suggestion Box heading/passages/labels/placeholder/button text change.
3. **Tip Jar and Suggestion Box presentation.** Long passages are grouped in a `.homepage-copy-stack`: a gold hairline, a lead sentence at a slightly larger size, comfortable `1.75` line height, and a warm emphasised closing line. The Tip Jar card widens from 400 px to 760 px so three passages breathe; the Suggestion Box keeps its two-column name/email row and full-width message field at 620 px and below.
4. **Community Map introduction.** `app/lucky-map-of-canada/lucky-map-of-canada.js` replaces its single introductory sentence with `.map-community-intro`, two passages with a gold hairline, at `clamp(1.02rem, 3.2vw, 1.18rem)` and `1.72` line height. No story reading, share, celebration, filter, statistics or map artwork code is touched.
5. **FAQ accordion capacity.** The answer container's open `max-height` rises from 500 px to 1600 px so the longer Community Map answer cannot be clipped on a narrow viewport. `hidden`, `aria-expanded`, `aria-controls` and the single-open behaviour are unchanged.
6. **Regression coverage.** `__tests__/homepage-content-refresh.test.js` asserts every approved passage verbatim, the removed old copy, the form contract, the celebration endpoint/tally/localStorage behaviour, and the FAQ single-source contract. `tests/visual/sitewide-gold-cta.spec.ts` is updated only for the renamed submit button text.

## Files Changed

- `app/homepage/faq-content.js` (new) — shared FAQ content.
- `app/page.js` — FAQPage structured data from the shared module; local duplicate FAQ array removed.
- `app/homepage/FAQSection.js` — shared FAQ content, multi-paragraph answers, taller open container.
- `app/homepage/HomePage.js` — approved section, Tip Jar and Suggestion Box wording and presentation.
- `app/lucky-map-of-canada/lucky-map-of-canada.js` — approved Lucky Stories / Community Map introduction.
- `themes/default/homepage.css` — `.homepage-copy-stack` presentation.
- `themes/default/map.css` — `.map-community-intro` presentation.
- `__tests__/homepage-content-refresh.test.js` (new) — regression guard.
- `tests/visual/sitewide-gold-cta.spec.ts` — submit button label.
- `memory-bank/activeContext.md`, `memory-bank/progress.md` — task record.

## Reference Material Actually Consulted

- `AGENTS.md`, `.freebuff/creation.md`, `.freebuff/polishing.md`, `.freebuff/seo.md`, `.freebuff/testing.md`.
- `.docs/creation/_coreyhaines31_marketingskills_ai-tells.md` — checked the supplied copy for machine-sounding filler before placing it (no rewrite made; the wording is fixed by the request).
- `.docs/polishing/_google_eng-practices.md` and `.docs/testing/_google_eng-practices.md` — review and test-scope guidance.
- No image format or raster asset work was performed, so the MDN image-format reference was not consulted.

## Risks and Mitigations

- **FAQ/schema drift** — removed by one shared module plus a test that forbids a second hand-maintained question list.
- **Visual baseline drift** — the homepage content changes, so committed Playwright baselines need regeneration in Visual QA; the change is content-only and no layout system, colour tokens or artwork were altered.
- **Longer answers clipping** — open `max-height` raised; covered by inspection of the container rule.
- **Celebration/forms regression** — no endpoint, handler, validation or Turnstile code path changed; guarded by tests.

## Verification

`./freebuff-verify.sh` (pnpm frozen install, Spec Kit gate tests and task gate, `tsc --noEmit`, production build, refresh-docs tests), focused and full Vitest, measured build size against the 495 MB maximum, and a final diff audit.
