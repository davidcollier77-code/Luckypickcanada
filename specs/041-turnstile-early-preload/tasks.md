# Tasks: Turnstile Early Script Preload

**Input**: Design documents from `specs/041-turnstile-early-preload/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`

## Phase 1: Setup and Baseline

- [X] T001 [US1] Inspect `TurnstileField`, the pinned `@marsidev/react-turnstile@1.6.1` loader, the
  homepage client tree, `app/layout.js`, and the protected server-side verification in
  `app/spam-protection.js`.
- [X] T002 [US1] Establish the cause rather than assume it: confirm the loader appends the script
  from a mount effect, confirm `TurnstileField` is statically imported by the `'use client'`
  homepage, and confirm the built homepage document contains zero matching preload hints.
- [X] T003 [US1] Confirm that PR #1568's URL matches the pinned loader byte-for-byte and that
  `7ab4b305` removed the hint for critical-path reasons, not because it was ineffective.
- [X] T004 [US1] Measure the API response chain (302 → 200, 86,732 bytes, one-year `max-age`) and the
  baseline initial-asset set for `/` (8 JS chunks / 616,889 bytes raw; 5 CSS files / 216,944 bytes).

## Phase 2: User Story 1 — Start the fetch from the initial document (Priority: P1)

**Goal**: Begin the API fetch at document parse, without taking the critical render path back.

**Independent Test**: Playwright asserts one matching hint with `fetchpriority="low"` on `/` and none
on `/about` or `/map`.

- [X] T005 [US1] Restore the exact URL constant and emit
  `preload(TURNSTILE_SCRIPT_URL, { as: 'script', fetchPriority: 'low' })` in `app/page.js`.
- [X] T006 [US1] Rewrite `tests/visual/turnstile-loading.spec.ts` to assert URL, single count,
  `fetchpriority="low"` and route scope.
- [X] T007 [US1] Leave `TurnstileField`, all callbacks, the hidden token field, server-side Siteverify,
  hostname/action validation, rate limiting and spam protection unchanged.

## Phase 3: Verification and Final Audit

- [X] T008 [US1] Type-check, run the unit suite and the repository gate (`./freebuff-verify.sh`);
  record the production build size against the 495 MB maximum.
- [X] T009 [US1] Verify the built homepage document actually contains the hint with
  `fetchpriority="low"`, and that `/about` and `/map` output does not.
- [ ] T010 [US1] BLOCKED — execute the Playwright spec in a browser. Chromium cannot start in this
  workspace (`libnspr4.so` missing; no root; package install refused). CI Visual QA is the
  confirmation path.
- [ ] T011 [US1] PENDING — measure the real-device script-request and challenge-completion timing on
  a deployed build, and record it separately from Cloudflare's challenge-processing time.
