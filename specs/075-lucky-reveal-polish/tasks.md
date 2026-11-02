# Tasks: Lucky Reveal Polish and Device-Native Sharing

**Feature**: `specs/075-lucky-reveal-polish`

## Phase 1 — Setup

- [x] T001 Confirm the current reveal presentation (`app/lucky-reveal-popup.js`), the sharing surface (`app/share-lucky-pick-button.js`), the shared generator (`app/lucky-reveal.js`), the gift route, and feature 074's Milky Way background before changing anything.

## Phase 2 — Foundational

- [x] T002 Create `app/lucky-reveal-presentation.js` with `splitLuckyNumberRows` (6 → 3 + 3, 7 → 4 + 3), the seven lucky-colour swatches, `getLuckyColorSwatch`, `getLuckyColorSwatchGradient`, and the share message helper.

## Phase 3 — User Story 1 (3 + 3 and 4 + 3 number rows)

- [x] T003 [US1] Render the reveal numbers as centred rows from `splitLuckyNumberRows` in `app/lucky-reveal-popup.js`, keeping the stored order and the sequential reveal delays.
- [x] T004 [US1] Draw the same 3 + 3 / 4 + 3 rows in the static share image in `app/lucky-reveal-share-image.js`.
- [x] T005 [US1] Size the number balls with a clamp so both arrangements stay centred without overflow on phones and computers.

## Phase 4 — User Story 2 (colour swatch)

- [x] T006 [US2] Add the swatch beside the Lucky Colour name in `app/lucky-reveal-popup.js` using the reveal's own colour vocabulary.
- [x] T007 [US2] Draw the matching swatch and the consistent Lucky Day card in `app/lucky-reveal-share-image.js`.

## Phase 5 — User Story 3 (single Share My Reveal control)

- [x] T008 [US3] Rewrite `app/share-lucky-pick-button.js` as one **Share My Reveal** control using `navigator.share` with the static PNG file, accompanying text, and the LuckyPickCanada link.
- [x] T009 [US3] Add the compact desktop sharing window with download, copy image where supported, and copy link, plus Escape, focus, and object-URL cleanup.
- [x] T010 [US3] Handle `AbortError` as a quiet cancellation and remove the Facebook, X, WhatsApp, email, text, link, and message buttons.

## Phase 6 — User Story 4 (premium finishing polish)

- [x] T011 [US4] Add the golden shimmer sweep and the small gold maple-leaf sparkle after the numbers settle in `app/lucky-reveal-popup.js`.
- [x] T012 [US4] Replace the auroras wording with Milky Way and starfield wording in `app/lucky-reveal-popup.js`.
- [x] T013 [US4] Add a `prefers-reduced-motion` block that disables the shimmer, sparkle, and entrance animations while showing the finished result.

## Phase 7 — Tests and verification

- [x] T014 Add `__tests__/lucky-reveal-polish.test.js` covering row splitting, swatches, popup presentation, the single share control, native sharing, cancellation, and the fallback actions.
- [x] T015 Run the focused reveal, gift, Stripe, and email regression suites; the full `pnpm exec vitest run`; `pnpm exec tsc --noEmit`; `./freebuff-verify.sh`; and measure the production build size.
- [x] T016 Audit the complete final diff and record the result, plus anything unverified, in the single PR summary.

## Dependencies

- T002 blocks T003–T012.
- T004 and T007 depend on T002 and share the image module with T003's layout rules.
- T014 depends on T002–T013 being final.
- T015 runs after T014; T016 runs last.

## Implementation Strategy

One sequential pass: shared presentation helpers, then the popup, then the static image and the
single share control, then the finishing polish, then the guard test, the verification gate, and the
diff audit.
