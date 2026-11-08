# Feature Specification: Mobile usability and accessibility remediation (audit D3, D4, D5, D8)

**Feature**: `specs/114-mobile-usability-accessibility`
**Branch**: `a11y/mobile-usability-accessibility-20261108`
**Input**: Master Work Request #1 — implement the first two outstanding work areas (mobile usability, accessibility) from the Browserless visual and usability audit recorded by PR #1773.
**Source findings**: D3 (phone tap targets), D4 (small mobile type), D5 (duplicate `<main>`, `H2 → H1 → H2` order, no skip link, unnamed navigation landmarks), D8 (missing focus indicators) in PR #1773's audit (`https://github.com/davidcollier77-code/Luckypickcanada/pull/1773`). That PR is a read-only audit record: it is not modified, its branch is not touched, and it stays open and unmerged.

## Overview

The audit measured the production site in Browserless at 390 × 844 and 1440 × 900 and reported controls below the
24 × 24 CSS-pixel target floor, mobile body and caption type as small as 9.6–11.7 px, a duplicated main landmark,
a heading sequence that starts at `H2`, no skip link, and interactive controls that lose their focus outline.

This feature corrects those findings without redesigning anything: the artwork, logo, hero, backgrounds,
navigation structure, wording, colours, motion and product behaviour stay as they are. Colour contrast is
explicitly out of scope and was not measured.

### Baseline (recorded by the audit; re-measured in this workspace before changing code)

| Finding | Audit measurement (390 × 844) |
| --- | --- |
| D3 map province markers | ≈ 23 × 23 px, 12 markers |
| D3 footer navigation links | 15 px high (30–62 px wide) |
| D3 footer social links | 13 px high (29–100 px wide) |
| D3 homepage header links | 14 px high (63–121 px wide) |
| D4 `/reveal` | min 10 px, median 11.25 px |
| D4 `/crystal-ball` | min 10 px, median 11.7 px |
| D4 `/` | min 9.6 px, median 14.7 px |
| D4 `/map` | min 10 px, median 15 px |
| D4 `/about` | min 10 px, median 16.9 px |
| D5 `/crystal-ball` | 2 `<main>` landmarks |
| D5 `/lucky-meter` | heading order `2,1,2` |
| D5 sitewide | no skip link |
| D5 `/`, `/map` | 4 `<nav>` landmarks, names not captured |
| D8 `/map` | footer links, gold CTA and “Back to Home Page” report `outline-style: none` |

## User Scenarios & Testing

### User story 1 — A phone visitor can hit every control (P1)

At 390 × 844 the visitor taps a province marker, a footer link, a footer social link or a homepage header link
first time. Each target's effective hit area is at least 24 × 24 CSS px, and enlarging the hit areas does not
make neighbouring controls select the wrong thing or overlap another control's visible artwork.

**Independent test**: measure each control's border box and its effective clickable extent (walking outward from
the centre with hit-testing, which counts generated hit areas) at 390 × 844, and compare the result with 24 px.

### User story 2 — Small mobile text is readable (P1)

Reading text and captions on `/`, `/reveal`, `/crystal-ball`, `/map` and `/about` are at least 12 px at 390 × 844
for captions and 14 px for body copy, with the existing typographic hierarchy and identity intact. Decorative
eyebrows, kickers and artwork labels are reviewed by role and only changed when they carry reading information.

**Independent test**: enumerate rendered text elements with their computed `font-size` per route at 390 × 844 and
classify any remaining element below the floor by role.

### User story 3 — Screen-reader and keyboard users get correct structure (P1)

`/crystal-ball` exposes exactly one `<main>`; `/lucky-meter` starts with its `H1`; every page offers a skip link
that is invisible until focused and moves focus into `#main-content`; each navigation region has a distinct,
meaningful accessible name where several exist on one page.

**Independent test**: count `<main>` elements and read the heading sequence per route; tab to the skip link,
activate it with `Enter`, and assert the focused element is the main landmark; read every `<nav>` accessible name.

### User story 4 — Keyboard focus is always visible (P2)

Tabbing through `/map` (and the rest of the site) shows a clearly visible focus indication on footer links, gold
CTAs, “Back to Home Page” and the map's card controls, without changing their normal, unfocused appearance.

**Independent test**: tab through the page, and for each focused element read `outline-style`, `outline-width`
and the computed box shadow; assert a non-`none` outline wider than 0 on every interactive control reached.

## Requirements

- **FR-001**: Every interactive control identified in D3 reaches an effective hit area of at least 24 × 24 CSS px
  at 390 × 844, measured by hit-testing rather than by border box alone.
- **FR-002**: Hit-area expansion must not enlarge the visible artwork (markers, icons, emblem) and must not create
  overlapping hit areas that steal taps from a neighbouring control beyond the overlap that already exists.
- **FR-003**: Reading text and captions below the 12 px caption floor on the five audited routes are raised to at
  least 12 px on mobile; body copy is at least 14 px. Decorative labels, kickers and artwork text are judged by
  role and left unchanged when they are not reading content.
- **FR-004**: The homepage at 390 × 844 has no horizontal overflow, no clipped text/controls and no overlapping
  interactive controls.
- **FR-005**: Desktop presentation (1440 × 900) is not unintentionally changed by the mobile work.
- **FR-006**: `/crystal-ball` renders exactly one `<main>` landmark; every route renders exactly one `<main>`.
- **FR-007**: `/lucky-meter` starts its heading sequence at `H1` and does not decrease the heading level as the
  content advances; visual heading sizes are unchanged.
- **FR-008**: A skip link is present in the shared layout, is visually hidden until keyboard focus, targets a
  unique existing id on every page, and moves focus to that main content region.
- **FR-009**: Every `<nav>` on a page has a distinct, meaningful accessible name where multiple navigation regions
  co-exist; no useful navigation is removed to reduce the count.
- **FR-010**: Footer links, gold CTAs, “Back to Home Page”, map control cards and secondary map buttons show a
  visible focus indicator when reached with the keyboard, with no change to their unfocused appearance.
- **FR-011**: No colour-contrast change, no redesign, no branding/artwork/animation/copy change, no new dependency,
  no payment, database, authentication, API, deployment or configuration change.

## Success Criteria

- **SC-001**: Re-measured hit areas at 390 × 844 show ≥ 24 × 24 px for every D3 control, with the before/after
  numbers recorded.
- **SC-002**: Re-measured mobile font sizes show no reading text or caption below 12 px on the five audited routes
  (or the remaining sub-12 px elements are documented by role as decorative).
- **SC-003**: `/crystal-ball` main count is 1; `/lucky-meter` heading order starts with 1; the skip link moves
  focus to `#main-content` in a real browser; every nav has a non-empty distinct name.
- **SC-004**: Keyboard focus walk on `/map` reports a visible outline for every interactive control reached.
- **SC-005**: `./freebuff-verify.sh` exits 0 and the production build stays below the 495 MB hard maximum.
- **SC-006**: A regression test fails if the structural guarantees (single main, first heading, skip-link target,
  focus-outline rules) are removed.

## Assumptions and limits

- The audit is the baseline record; this workspace re-measures the same properties on a local build. Production
  cannot be modified, so the "after" evidence comes from the local server this branch runs.
- Real hardware is not available; measurements use an emulated 390 × 844 touch viewport in Chromium.
- Colour contrast is out of scope and is not measured or changed.
- The audit's disputed first-screen branding recommendation, the Lucky Map data/count issue (D7), navigation
  label consistency (D6) and Terms copy (D9) are separate future tasks and are not touched here.


## Follow-up review hardening (2026-11-08)

- The Crystal Ball pedestal plaque remains visually unchanged; its text overlay is decorative artwork and is now marked `aria-hidden="true"` so the 9.945 px engraving is not announced as reading text.
- The footer pseudo-element reset is restored as a real `footer nav a::before` selector with `inset: 0 !important`; the existing homepage reset is unchanged.
- The Vitest source assertions are fast implementation guards, not a substitute for browser verification. `tests/visual/mobile-accessibility.spec.ts` exercises rendered landmarks, heading order, skip-link focus, tap-target geometry, mobile text and keyboard focus.
- The old `before.json` footer hit-area values at y-coordinates below the viewport are invalid off-screen probes. Their raw 1×1 values are preserved in `reportedHitArea`, but the authoritative `hitArea` is null and the records are marked `INVALID_OFFSCREEN`; they are not valid before/after evidence.
- The prior fixed-length keyboard walk continued after Tab wrapped. Existing after-capture evidence has repeated records removed and now reports unique stops. The corrected harness stops at the first repeated focusable element. No screenshot baselines or the historical Visual QA scanner are changed.

- **SC-007**: Playwright verifies rendered landmarks, heading order, skip-link focus, target geometry, mobile text floor and keyboard focus behavior.
- **SC-008**: Measurement evidence excludes off-screen hit-test failures and reports unique keyboard stops without counting Tab-wrap repetitions.
