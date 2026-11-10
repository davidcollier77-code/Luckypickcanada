# Feature Specification: Crystal Ball Experience Improvements and Performance Optimization

**Feature Branch**: `freebuff/262545961f9e30358501fc70`

**Created**: 2026-11-10

**Status**: Implemented

**Input**: Improve the existing Crystal Ball experience (greetings, follow-up flow, readability) and optimize its loading performance without reducing artwork size, image quality, audio quality, animations or effects. Preserve the Lucky Generator quote experience.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A daily, animated personal greeting (Priority: P1)

A visitor opens `/crystal-ball` and sees a friendly Canadian greeting near the top of the page, typed out with the existing golden maple-leaf cursor. The same greeting is kept for the rest of the local day, and the next day's greeting is never the same as the previous day's.

**Why this priority**: The greeting is the first thing a visitor reads and it must feel personal and consistent.

**Independent Test**: Load `/crystal-ball`, confirm a greeting appears above the title and types out with the leaf cursor; reload and confirm it is unchanged; simulate consecutive local days and confirm the same greeting is never selected twice in a row.

**Acceptance Scenarios**:

1. **Given** a fresh browser, **When** the page loads, **Then** exactly one of the four approved greetings is selected at random and displayed above the title.
2. **Given** a greeting was shown today, **When** the visitor refreshes, opens another tab, or returns later the same local day, **Then** the same greeting is displayed and no re-selection occurs.
3. **Given** the previous local day's greeting, **When** a new local day begins, **Then** the selection is uniform random among the other three greetings, never the previous one.
4. **Given** a different greeting appeared after a repeat was blocked, **When** a later day selects that earlier greeting again, **Then** it is allowed.
5. **Given** enough days, **When** greetings are recorded, **Then** all four greetings are reachable; there is no fixed rotation.
6. **Given** reduced motion, **When** the page loads, **Then** the full greeting is shown immediately without the typing animation.

### User Story 2 - Preserved daily fortune (Priority: P1)

The existing daily AI fortune flow, reveal animation, audio, artwork and browser-local daily allowance continue to work exactly as before.

**Independent Test**: Generate a fortune, confirm the pulse/leaf/progressive reveal, refresh, and confirm the saved fortune returns without a new request.

### User Story 3 - No separate Canadian quote in the Crystal Ball (Priority: P2)

The Crystal Ball does not show a separate Canadian quote. The Lucky Generator quote collection and its daily behaviour remain intact.

**Why this priority**: The fortune is the Crystal Ball's only daily reading; a second quote competes with it.

**Independent Test**: Inspect the rendered Crystal Ball page and its source for an additional quote; open the Lucky Generator and its daily-meter widget and confirm their quotes still appear and rotate daily.

**Acceptance Scenarios**:

1. **Given** the Crystal Ball page, **When** it renders, **Then** no separate Canadian quote section is shown.
2. **Given** the Lucky Generator daily-meter and desktop widgets, **When** they render, **Then** their existing quote collection and daily quote selection are unchanged.
3. **Given** shared quote data or storage, **When** the Crystal Ball is changed, **Then** no shared quote data or storage helper is deleted or renamed.

### User Story 4 - A polished follow-up panel and answer (Priority: P1)

After the fortune finishes revealing, the visitor sees an **Ask a Follow-up Question** button. Pressing it replaces the button with a designed gold-and-glass input panel. Submitting once per day shows the question and the Crystal Ball's answer, typed with the same golden-leaf treatment.

**Independent Test**: Generate a fortune, wait for the reveal to finish, open the panel, submit a question, and verify the panel disappears, the native keyboard closes, the question and answer appear, the original fortune stays visible, a refresh restores all three, and a second follow-up is blocked.

**Acceptance Scenarios**:

1. **Given** the fortune is still revealing, **When** the visitor watches, **Then** no follow-up control is shown until the reveal completes.
2. **Given** the fortune has finished revealing, **When** the follow-up area appears, **Then** only an **Ask a Follow-up Question** button is shown underneath the fortune.
3. **Given** the button is pressed, **When** the panel opens, **Then** the button is replaced by a styled panel with an adequately tall, readable textarea, visible label, character count and a gold submit button matching the Crystal Ball buttons.
4. **Given** a mobile visitor focuses the textarea, **When** the native keyboard opens, **Then** the panel remains usable and the page can scroll naturally to the original fortune; no custom keyboard is used.
5. **Given** the question is submitted, **When** the request starts, **Then** the textarea blurs so the native keyboard closes, and the panel is removed.
6. **Given** a successful answer, **When** it is shown, **Then** the visitor's question appears separately above the answer, the answer types with the golden-leaf cursor, and the original fortune remains visible above both.
7. **Given** a refresh after a successful follow-up, **When** the page restores, **Then** the fortune, question and answer are all visible and no panel or second follow-up is offered.
8. **Given** the daily follow-up is used, **When** the follow-up area renders, **Then** an explanation states that today's limit has been reached and no input reopens automatically.
9. **Given** reduced motion, **When** an answer arrives, **Then** the full answer is shown immediately.

### User Story 5 - Faster loading with identical quality (Priority: P2)

The Crystal Ball loads less data and does less rendering work while keeping the same artwork dimensions, visual effects, animations and audio quality.

**Independent Test**: Measure the production build's `/crystal-ball` payload, LCP and DOM work before and after on desktop and a mobile viewport; confirm a measurable improvement and unchanged artwork/srcset.

**Acceptance Scenarios**:

1. **Given** the Crystal Ball audio, **When** it is delivered, **Then** compressed variants are preferred and the original WAVs remain as fallback.
2. **Given** the visitor has not asked for anything yet, **When** the page loads, **Then** the Crystal Ball audio is not downloaded until a clear interaction intent (or the fortune request itself).
3. **Given** the Crystal Ball artwork, **When** it loads, **Then** the AVIF-first/WebP-fallback `<picture>` and intrinsic 716×875 dimensions are unchanged, with `fetchPriority="high"` for the early artwork request.
4. **Given** the fortune/answer text reveal, **When** it types, **Then** only the word containing the newest character re-renders instead of the whole reading.
5. **Given** a repeat visit, **When** audio and images are requested, **Then** they are served with long-lived immutable caching.

### Edge Cases

- Browser storage is blocked or full: the greeting still renders for this page lifetime using an in-memory fallback.
- Stored greeting data is malformed or from another schema: a fresh random greeting is selected.
- A visitor changes time zone across midnight: the greeting behaves like a new local day.
- The follow-up request fails: the allowance is not consumed, the panel returns with an error and the question is preserved.
- The visitor reloads while an answer is typing: the saved answer renders in full without replaying the animation.
- Reduced motion: no typing cursor, full text available immediately.
- Audio analysis/compression unavailable at build time is not a runtime dependency; compressed files are committed assets.

## Requirements *(mandatory)*

- **FR-001**: Keep the existing three greetings and add a fourth; all copy must stay friendly, playful and Canadian.
- **FR-002**: Display the greeting near the top of the page, above the title, with sufficient room, contrast and readable type; no other element is shrunk to make space.
- **FR-003**: Type the greeting with the existing `GoldenLeaf` cursor and respect `prefers-reduced-motion`.
- **FR-004**: Select the greeting at random once per local day; never select the previous local day's greeting; allow repeats only after a different greeting; no fixed rotation; all four reachable.
- **FR-005**: Persist the daily greeting in browser-local storage under a new, greeting-specific key; leave the fortune/follow-up storage arrangement unchanged.
- **FR-006**: Keep the daily AI fortune, its reveal animation, audio and local-day allowance exactly as they are.
- **FR-007**: Do not render a separate Canadian quote in the Crystal Ball; do not delete or alter shared quote data or the Lucky Generator's quote experience.
- **FR-008**: Show the follow-up control only after the fortune reveal completes, initially as a button; pressing it replaces the button with a purpose-built input panel.
- **FR-009**: The panel must use the Crystal Ball's gold/glass design language (refined accents, glow, depth, elegant typography, detailed borders, balanced spacing), not a generic form.
- **FR-010**: Use a native mobile keyboard; keep the panel usable with the keyboard open and close it on submission.
- **FR-011**: After submission show the question separately, then the answer typed with the `GoldenLeaf` effect; keep the original fortune visible; one follow-up per local day.
- **FR-012**: Once used, explain the daily limit and never reopen the input automatically.
- **FR-013**: Keep browser-local storage and same-day restore for fortune, follow-up and greeting; no server-side conversation history.
- **FR-014**: Compress Crystal Ball audio with a suitable format/settings that reduce size without audible quality loss; prefer compressed sources with the WAVs as fallback.
- **FR-015**: Defer audio download until interaction intent, add immutable caching for audio, and set high fetch priority on the artwork without changing its dimensions or format order.
- **FR-016**: Reduce reveal-related render work without changing the visible animation.
- **FR-017**: Record before/after performance evidence on desktop and mobile and keep the production build strictly below 495 MiB.
- **FR-018**: Preserve existing artwork, colours, lighting, glow, animations, sound design, keyboard access, focus visibility and reduced-motion behaviour.

## Key Entities

- **Daily Greeting Record**: local date key and selected greeting index, stored separately from the daily fortune state.
- **Daily Crystal Ball State**: unchanged local date, fortune, follow-up question/answer and usage flags.
- **Performance Snapshot**: profile, LCP, CLS, transfer bytes by type, resource count, DOM node count and load timing.

## Success Criteria *(mandatory)*

- **SC-001**: Four greetings exist and the daily-selection rules hold across simulated consecutive days.
- **SC-002**: The greeting is visible above the title, readable, and typed with the leaf cursor.
- **SC-003**: Fortune, follow-up, storage and refresh behaviour remain intact.
- **SC-004**: The Crystal Ball shows no separate Canadian quote and the Lucky Generator quotes are untouched.
- **SC-005**: The follow-up panel and answer meet the flow and visual requirements on desktop and mobile.
- **SC-006**: `/crystal-ball` transfers measurably less data and renders with equal or better timing, with artwork dimensions and quality unchanged.
- **SC-007**: Required checks pass and the production build is below 495 MiB.

## Assumptions

- The visitor's browser clock and time zone remain the source of truth for the local day.
- The existing Oracle API, AI provider and audio helper stay in place; no new runtime dependency is added.
- Committing compressed audio variants is acceptable; the WAV originals remain for fallback and provenance.
