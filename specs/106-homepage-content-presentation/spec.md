# Feature Specification: Approved Homepage Content and Presentation Refresh

**Feature Branch**: `content/homepage-wording-presentation-20261107`
**Created**: 2026-11-07
**Status**: Implemented
**Input**: Master Work Request #1 — implement the approved Lucky Pick Canada homepage, Lucky Stories/Community Map, Tip Jar, Suggestion Box and FAQ wording verbatim, presented within the existing night-sky, medallion-gold visual identity, while preserving every existing interaction.

**Task groups**: `creation` (new visitor-facing copy), `polishing` (presenting long-form copy inside the existing design system), `seo` (visible FAQ and FAQPage structured data kept identical), `testing` (regression coverage for wording, form contract and celebration behaviour).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — The four Experience sections speak in the approved voice (Priority: P1)

A visitor scrolling the homepage reads the Lucky Meter, Daily Lucky Card Reveal, Crystal Ball and Lucky Pick sections. Each one carries the approved wording exactly as supplied, at a comfortable reading size, without any rewording, shortening or added claims.

**Independent Test**: Read the rendered homepage. Each of the four paragraphs matches the supplied text character for character, and the previous copy is gone.

**Acceptance Scenarios**:

1. **Given** the homepage, **When** it renders, **Then** the Lucky Meter card shows the approved paragraph verbatim.
2. **Given** the homepage, **Then** the Daily Lucky Card Reveal card shows the approved paragraph verbatim.
3. **Given** the homepage, **Then** the Crystal Ball card shows the approved paragraph verbatim.
4. **Given** the homepage, **Then** the Lucky Pick section is titled "Lucky Pick — Your Little Touch of Luck" and shows the approved paragraph verbatim.
5. **Given** the same cards, **Then** the existing destinations (`/lucky-meter`, `/reveal`, `/crystal-ball`, `/map`) and gold 3D buttons are unchanged.

### User Story 2 — Lucky Stories and the Community Map introduce themselves honestly (Priority: P1)

A visitor arriving at the map page reads the supplied introduction in two passages, understands that every story has a place, and can still open a story, celebrate it and see its celebration count.

**Independent Test**: Load `/map`, read the introduction, open a story, press "Celebrate" and confirm the tally increases; confirm no "like" wording or social-media reference is used for the feature.

**Acceptance Scenarios**:

1. **Given** the map page, **Then** both approved introductory passages appear verbatim.
2. **Given** a mapped story, **When** a visitor opens it, **Then** the story text is readable as before.
3. **Given** a story, **When** the visitor presses "Celebrate", **Then** the existing `/api/lucky-stories/react` endpoint is used and the running count updates.
4. **Given** the feature, **Then** no duplicate reaction endpoint, counter or "like" naming is introduced.

### User Story 3 — Tip Jar and Suggestion Box read as an invitation, not a wall of text (Priority: P1)

A visitor considering support reads the approved Tip Jar passages and the approved Suggestion Box passages, both laid out as short, readable paragraphs inside the existing gold-trimmed surfaces, and submits an idea with the renamed fields and button.

**Independent Test**: Read both sections; confirm every supplied paragraph is present; submit nothing but confirm the form still posts to `/api/suggestions` with Turnstile and validation intact.

**Acceptance Scenarios**:

1. **Given** the Tip Jar section, **Then** the heading and all three paragraphs are the supplied text, and the existing tip checkout still opens.
2. **Given** the Suggestion Box, **Then** the heading and all four paragraphs are the supplied text.
3. **Given** the Suggestion Box form, **Then** the labels read "Name (optional)", "Email (optional)" and "Your suggestion (required)", the placeholder is the supplied sentence, and the submit button reads "Share Your Idea".
4. **Given** a submission, **Then** validation, honeypot, Turnstile protection, the existing endpoint and success/error handling are unchanged.

### User Story 4 — The FAQ and its structured data stay in lockstep (Priority: P1)

A visitor reads ten approved questions and answers; search engines receive the same ten answers from the FAQPage structured data.

**Independent Test**: Compare the visible accordion copy with the JSON-LD; both come from one shared module and contain the same ten questions and answers.

**Acceptance Scenarios**:

1. **Given** the FAQ section, **Then** ten questions and answers appear exactly as supplied, including paragraph breaks in the Community Map answer.
2. **Given** the page source, **Then** the FAQPage structured data is generated from the same module.
3. **Given** the longest answer, **When** expanded on a narrow screen, **Then** no answer is clipped.

### User Story 5 — The homepage Lucky Stories card speaks with the same voice (Priority: P2)

A visitor scanning the homepage reads the Lucky Stories card and recognises the same introduction the Community Map page opens with, so the two surfaces describe one experience rather than two different ones.

**Independent Test**: Load `/`, read the Lucky Stories card, and compare it with the first of the two approved introduction passages on `/map`; they match exactly.

**Acceptance Scenarios**:

1. **Given** the homepage, **Then** the Lucky Stories card body is the approved first introduction passage, verbatim.
2. **Given** the same card, **Then** the existing `EXPLORE LUCKY STORIES` gold button still leads to `/map` and the non-testimonial note is still shown.
3. **Given** the card, **Then** no new claim, testimonial or statistic is introduced.

## Requirements

- **FR-001**: Use the supplied wording verbatim; do not rewrite, shorten, or add marketing claims.
- **FR-002**: Update only the named sections and the presentation needed to integrate them.
- **FR-003**: Preserve artwork, images, animations, sounds, backgrounds, navigation and section behaviour.
- **FR-004**: Preserve Lucky Stories reading, sharing, celebration and tally behaviour; no duplicate reaction system; no "like"/social-media naming for the feature.
- **FR-005**: Preserve Suggestion Box submission, validation, Turnstile, backend and success/error handling.
- **FR-006**: Keep the visible FAQ and FAQPage structured data consistent from a single source.
- **FR-007**: Present the copy attractively and readably on mobile and desktop within the existing night-sky, gold-accent identity.
- **FR-008**: Do not change Stripe products, prices, payment handling, email delivery, the About page, or unrelated homepage wording.
- **FR-009**: Do not implement other technical SEO audit recommendations (image/performance, redirects); PR #1760 stays untouched.
- **FR-010**: The homepage Lucky Stories card must use the approved introduction wording (first approved passage) verbatim, keep its `/map` destination and keep the existing non-testimonial note.
- **FR-011**: The refreshed copy must be covered by executable browser-level checks for rendered text, the FAQ open/close interaction, long-answer clipping and horizontal overflow, in addition to the source guard.

## Out of Scope

- SEO audit recommendations, image/performance work and redirects.
- Any change to payments, email delivery, database schema, authentication or deployment.
- New pages, new routes, new dependencies or a new reaction system.

## Branch Integration

- **FR-012:** Integrate the approved homepage-content branch with newer `main` history without losing either side's independent changes. Preserve the main-line map redirects, all homepage-content changes, and both task-history records; keep the pull request open and unmerged.
