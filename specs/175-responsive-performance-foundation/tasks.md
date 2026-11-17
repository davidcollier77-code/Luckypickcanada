---

description: "Task list for the responsive performance foundation"
---

# Tasks: Responsive Performance Foundation

**Input**: Design documents from `/specs/175-responsive-performance-foundation/`

**Prerequisites**: plan.md, spec.md

**Tests**: The repository requires the existing Vitest and Playwright suites; one Playwright spec is updated to assert the new deferred-loading contract.

## Phase 1: Measurement (Shared Infrastructure)

- [x] T001 Capture the live-site mobile baseline with Lighthouse mobile emulation (`https://luckypickcanada.ca/`, score 58, LCP 5.8 s, TBT 754 ms, 2,912 KiB)
- [x] T002 Capture the live-site desktop baseline (score 95, LCP 1.4 s, TBT 28 ms, 3,231 KiB)
- [x] T003 [P] Capture a same-environment production-build baseline on `127.0.0.1:3011` (mobile 67–68, desktop 97)
- [x] T004 Attribute the bottlenecks from the Lighthouse request waterfall, long tasks and bootup data (1,975 KiB Turnstile payload; ~300–400 ms router-chunk prefetch tasks; two font preloads on an unused critical path)

**Checkpoint**: Every change below is justified by measured evidence, not by assumption.

---

## Phase 2: Foundational

- [x] T005 Confirm the existing Next.js production minification and code splitting (no extra minifier added; `2292`/`5c5d0c68` identified as the Next router and React DOM chunks, not removable application code)
- [x] T006 Confirm no Cloudflare, DNS, cache, hosting or dependency change is required

---

## Phase 3: User Story 1 - Mobile first paint (Priority: P1) 🎯 MVP

**Goal**: Stop the first load paying for third-party and below-the-fold work.

**Independent Test**: Load the homepage on mobile emulation, confirm zero `challenges.cloudflare.com` challenge requests and zero route-prefetch requests before interaction, then confirm both resume on viewport proximity and user intent.

- [x] T007 [US1] `app/turnstile-field.jsx`: mount the widget on viewport proximity (`rootMargin: 600px`) with a focus/pointer-down fallback and an `IntersectionObserver`-absent fallback
- [x] T008 [US1] `app/page.js`: remove the eager Turnstile script preload hint and document why
- [x] T009 [US1] `components/IntentPrefetchLink.jsx`: new link that prefetches on hover, focus, pointer-down or touch
- [x] T010 [US1] `app/homepage/Hero.js`: use the intent link for the four first-viewport navigation destinations
- [x] T011 [US1] `tests/visual/turnstile-loading.spec.ts`: replace the obsolete eager-preload assertion with the deferred-loading contract
- [x] T012 [US1] Verify in a real browser that the Suggestion Box still verifies and enables submission (Cloudflare's public test site key, local server only)

**Checkpoint**: Mobile transfer 961 → 777 KiB; TBT 469 → 337 ms median.

---

## Phase 4: User Story 2 - Desktop parity (Priority: P2)

- [x] T013 [US2] Confirm desktop score does not regress (97 → 98) and the hero composition is unchanged at 1440x900

---

## Phase 5: User Story 3 - Device-driven asset selection (Priority: P3)

- [x] T014 [P] [US3] `app/fonts.js`: stop preloading Inter (fallback-only face) and Playfair Display (About/Reveal-only face)
- [x] T015 [P] [US3] `app/homepage/HomePage.js`: lazy-load the below-the-fold community backdrop
- [x] T016 [US3] Confirm AVIF/WebP `srcset`/`<picture>`/`image-set()` selection is unchanged and no user-agent detection was added

---

## Phase 6: Verification & Polish

- [x] T017 Run the full Vitest suite and the focused Turnstile unit suite
- [x] T018 Run the updated Playwright spec
- [x] T019 Run `./freebuff-verify.sh` (Spec Kit gate, governance suites, type check, production build, docs tests)
- [x] T020 Measure the clean production build and confirm it is strictly below 495 MiB
- [x] T021 Capture the after-measurements and record the remaining bottleneck in `evidence.md`
- [x] T022 Open the PR per `PR_SUBMISSION.md`

## Dependencies & Execution Order

- Phase 1 (measurement) blocks every change; each task above cites the evidence that justifies it.
- Phases 3, 4 and 5 are independent of one another and touch different files.
- Phase 6 depends on phases 3–5.

## Notes

- T009/T010 and T007/T008 are the two changes with the largest measured effect.
- No task in this feature changes artwork, animation timing, copy, security validation or infrastructure.
