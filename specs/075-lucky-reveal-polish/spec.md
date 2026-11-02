# Feature Specification: Lucky Reveal Polish and Device-Native Sharing

**Feature Branch**: `freebuff/734cbf62690b478727fca4a5`

**Created**: 2026-11-02

**Status**: Implemented — verification recorded in the single PR summary

**Input**: Polish the existing Lucky Reveal experience. Show six numbers as 3 + 3 and seven as 4 + 3
in the main reveal and in the static share image. Add a visible, accurate colour swatch beside the
Lucky Colour. Replace the collection of sharing buttons with one **Share My Reveal** control that
uses the device share panel on phones, shares the static reveal image with accompanying text and the
LuckyPickCanada link, and falls back to a small polished sharing window on computers. Add a subtle
golden finishing shimmer and a maple-leaf sparkle, replace the auroras wording with Milky Way
wording, and keep the existing artwork, animation, reduced-motion behaviour, Personal and Gift
delivery, payments, email infrastructure, database, environment, and Little Luck Map untouched.

## Context (verified before design)

- The single reveal experience is `app/lucky-reveal-popup.js` (`LuckyRevealPopup`). It renders after a
  paid reveal on the homepage, from the free preview switch, and on the gift landing route
  `app/reveal/[revealId]/page.tsx`. Personal and Gift both present through `buildLuckyReveal`.
- Numbers were rendered in one wrapping flex row, so a 6 Pick could wrap 5 + 1 or 4 + 2 depending on
  the available width and a 7 Pick had no intended arrangement.
- The lucky colour was text only. The seven lucky colours and their border glows already existed in
  the popup, so a swatch could reuse that vocabulary without introducing a new palette.
- Sharing lived in `app/share-lucky-pick-button.js` behind a **Share Your Luck** toggle that expanded
  a card with Share directly, Copy share link, Copy card message, Facebook, X, Friends and family,
  Email, and Text. No image was shared and no fallback window existed.
- A static image renderer and canvas sharing precedent already exist in `app/lucky-card-share.js`
  (Lucky Card artwork), including `navigator.share` with files and an `AbortError` check.
- Feature 074 already replaced the reveal background with the homepage Milky Way / starfield
  artwork; this feature must not repeat or undo that work.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Read the six and seven number sets at a glance (Priority: P1)

A customer opens their reveal and sees six numbers as three centred numbers on the first row and
three centred on the second, or seven numbers as four on the first row and three centred underneath.

**Why this priority**: The numbers are the result the customer paid for; a ragged wrap makes a
7 Pick look unbalanced and can hide one number on a narrow phone.

**Independent Test**: Open a 6 Pick and a 7 Pick reveal at phone and desktop widths and confirm the
row arrangement, centring, and that the numbers and their order are unchanged.

**Acceptance Scenarios**:

1. **Given** a 6 Pick reveal, **Then** the first row holds the first three stored numbers and the
   second row holds the remaining three, both centred.
2. **Given** a 7 Pick reveal, **Then** the first row holds the first four stored numbers and the
   second row holds the remaining three, centred underneath.
3. **Given** either arrangement, **Then** the static share image shows the same rows, numbers, and
   order as the reveal.

---

### User Story 2 — See the lucky colour, not just read it (Priority: P2)

A customer sees a glossy swatch beside the Lucky Colour name that actually represents the assigned
colour, and the same swatch appears in the shared image.

**Why this priority**: The colour is half of the paid result and was previously the least visual part
of the reveal.

**Independent Test**: Render each of the seven lucky colours and compare the swatch against the
colour name and its existing themed treatment.

**Acceptance Scenarios**:

1. **Given** a reveal with a lucky colour, **Then** a visible swatch sits beside the colour name and
   its gradient matches that colour (gold, green, silver, blue, red, or purple).
2. **Given** an unrecognised stored colour name, **Then** the name is still shown and the swatch uses
   the gold treatment instead of claiming a different colour.
3. **Given** the shared image, **Then** it contains the same swatch, colour name, and lucky day.

---

### User Story 3 — Share the reveal with one control (Priority: P3)

A customer taps **Share My Reveal** and either gets their device's own sharing panel with the static
reveal image and text, or a small sharing window with download, copy image, and copy link.

**Why this priority**: The nine share buttons were cluttered, inconsistent with the rest of the
experience, and never shared the result image.

**Independent Test**: Tap the control with a device share panel available, with a refused share, and
with no native sharing at all, and confirm the image shares, the fallback opens, and cancelling is
handled without an error state.

**Acceptance Scenarios**:

1. **Given** a device that can share files, **When** the customer taps **Share My Reveal**, **Then**
   the device sharing panel opens with the static PNG, accompanying text, and the LuckyPickCanada
   link.
2. **Given** the customer cancels the device panel, **Then** the reveal stays open with no error.
3. **Given** no file-capable sharing, **Then** a small window offers downloading the image, copying
   the image where supported, and copying the website link, and no individual social-network,
   email, or text buttons appear.
4. **Given** any sharing path, **Then** no new numbers are generated and no video is produced.

---

### User Story 4 — Feel the result as one finished piece (Priority: P4)

A customer sees a subtle golden shimmer and a small maple-leaf sparkle complete the result, and reads
copy that matches the Milky Way background.

**Independent Test**: Watch the reveal finish and confirm the shimmer and sparkle appear once the
numbers settle, and that reduced-motion users see the finished result without motion.

**Acceptance Scenarios**:

1. **Given** the reveal finishes, **Then** a single golden shimmer crosses the numbers panel.
2. **Given** reduced-motion preferences, **Then** the shimmer, sparkle, and entrance animations do
   not animate and the result is immediately visible.
3. **Given** the reveal copy, **Then** it refers to the Milky Way and starfield instead of auroras.

### Edge Cases

- A reveal whose numbers do not match a known game size must still show every number once, in order.
- A browser without `image-set()` support must still get a dark panel (the `#02050a` base colour).
- A device that exposes `navigator.share` but cannot share files must receive the fallback window
  rather than losing the image.
- Clipboard image writing is unsupported on some desktops; the option must be absent or explain the
  limitation instead of failing silently.
- Closing or unmounting the reveal must release the share image object URL.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A 6 Pick MUST display as three centred numbers on the first row and three centred on the
  second; a 7 Pick MUST display as four on the first row and three centred underneath.
- **FR-002**: Both arrangements MUST apply to the main reveal and the static share image, at phone and
  desktop widths, and MUST preserve the stored numbers and their order.
- **FR-003**: A visible colour swatch MUST sit beside the Lucky Colour name and MUST represent the
  assigned colour using the existing gold, green, silver, blue, red, and purple treatments.
- **FR-004**: The static share image MUST contain the exact numbers, the Lucky Colour name and swatch,
  the Lucky Day, and LuckyPickCanada branding.
- **FR-005**: Sharing MUST be one **Share My Reveal** control; the individual Facebook, X, WhatsApp,
  email, text, and link/message copy buttons MUST be removed.
- **FR-006**: Where supported, sharing MUST open the device sharing panel with the static PNG,
  accompanying text, and the LuckyPickCanada link, and MUST NOT share a video or the animation.
- **FR-007**: Where native file sharing is unavailable, a small sharing window MUST offer downloading
  the image, copying the image where supported, and copying the website link.
- **FR-008**: Cancelling the native share panel MUST be handled without an error state.
- **FR-009**: Creating or sharing the image MUST use the existing reveal data and MUST NOT generate,
  replace, or reorder lucky results.
- **FR-010**: The completed reveal MUST include a subtle golden shimmer and MAY include a small
  maple-leaf sparkle.
- **FR-011**: The auroras wording MUST be replaced with wording appropriate to the Milky Way and
  starfield background.
- **FR-012**: The existing reveal animation, artwork, gold styling, Milky Way background, close
  control, keyboard handling, and `prefers-reduced-motion` behaviour MUST be preserved.
- **FR-013**: Personal and Gift MUST keep using the same reveal component and presentation, and a
  Gift MUST display its original stored result.
- **FR-014**: The Little Luck Map button and its behaviour MUST remain unchanged.
- **FR-015**: Stripe checkout, prices, product identifiers, payment verification, webhooks, gift
  email generation and delivery, Resend, the database, environment variables, and deployment
  configuration MUST NOT change.

### Key Entities

- **Reveal**: The stored `{game, numbers, luckyColor, luckyDay}` result. Presentation may not alter it.
- **Swatch**: The gradient pair and ring colour representing one of the seven lucky colours.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of 6 Pick reveals render 3 + 3 rows and 100% of 7 Pick reveals render 4 + 3 rows
  in both the reveal and the shared image.
- **SC-002**: Every lucky colour in the vocabulary renders a distinct, recognisable swatch.
- **SC-003**: Sharing exposes exactly one primary control and zero individual social, email, or text
  buttons.
- **SC-004**: A customer can share the reveal image in one tap on a file-capable device, and in no
  more than three actions from the fallback window on a desktop.
- **SC-005**: `./freebuff-verify.sh`, the repository test suite, and the type check pass, and the
  production build stays below the 495 MB maximum.

## Assumptions

- "Native sharing" means the Web Share API with `files`, detected through `navigator.share` and
  `navigator.canShare` rather than by guessing the device type.
- The share image is a PNG drawn on a canvas from the on-screen reveal; no backend, dependency, or
  new asset is required.
- The reveal's existing lucky-colour vocabulary and gold styling define the swatch palette.
- The gift email keeps its existing content and delivery; only the on-site reveal and its shared
  image are polished in this feature.
