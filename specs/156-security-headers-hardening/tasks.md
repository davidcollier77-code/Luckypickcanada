# Tasks: Security Header Hardening

**Input**: Design documents from `specs/156-security-headers-hardening/`

**Prerequisites**: plan.md, spec.md, research.md

## Phase 1: Setup and Baseline Inspection

- [x] T001 Inspect `next.config.mjs`, the live production response headers, `app/layout.js`, `app/fonts.js`, the checkout form and route, and the rendered homepage HTML for inline handlers and external origins.
- [x] T002 Record the baseline: one CSP matching the repository, no CSP edge duplication, live HSTS rewritten by Cloudflare, `origin-when-cross-origin` referrer policy and `X-XSS-Protection: 1; mode=block`.

## Phase 2: User Story 1 - Tighter CSP without breaking experiences (Priority: P1)

**Goal**: The policy keeps every required integration working while removing unused origins and refusing inline handler attributes.

**Independent Test**: Parse the configured policy in a unit test and visit real pages in Playwright with no CSP violations.

- [x] T003 [P] [US1] Add `__tests__/security-headers.test.js` asserting the tightened CSP contract, the required third-party origins, the Next.js inline-script allowance, `script-src-attr 'none'`, and the absence of the removed origins.
- [x] T004 [P] [US1] Add `tests/visual/security-headers.spec.ts` to read the production response headers and assert no CSP violations while visiting the homepage, Crystal Ball and Luck Generator.
- [x] T005 [US1] Tighten `Content-Security-Policy` in `next.config.mjs`: keep `script-src 'unsafe-inline'`, add `script-src-attr 'none'`, remove the Google Fonts style/font origins and the Pexels image origin, and preserve Turnstile, Google Analytics, Cloudflare Web Analytics and the Stripe form destination.

### Verification

- [x] T006 [US1] Run the focused unit tests and confirm the header contract passes. PASS — 18 focused tests (8 header + 10 existing CSP guards) exit 0.
- [x] T007 [US1] Run the Playwright security-header check against a production build and confirm zero CSP violations and no page errors. PASS — 3/3 desktop checks against the production server; the same 3/3 against the dev server CI uses.
- [x] T008 [US1] Inspect the production response headers and confirm the tightened CSP is delivered exactly once. PASS — one `Content-Security-Policy` on `/` and `/crystal-ball`, matching the configured value.

## Phase 3: User Story 2 - Safer referrer policy and obsolete header removal (Priority: P2)

**Goal**: Cross-origin referrers are limited to the origin on HTTPS and the obsolete header is gone.

**Independent Test**: Read the configured and production headers.

- [x] T009 [US2] Change `Referrer-Policy` to `strict-origin-when-cross-origin` in `next.config.mjs`.
- [x] T010 [US2] Remove the `X-XSS-Protection` header from `next.config.mjs`.
- [x] T011 [P] [US2] Extend `__tests__/security-headers.test.js` to assert the referrer value and the absence of `X-XSS-Protection`.
- [x] T012 [US2] Confirm the production response carries the new referrer policy and no `X-XSS-Protection` header. PASS — local production response: `Referrer-Policy: strict-origin-when-cross-origin`; no `X-XSS-Protection`.

## Phase 4: User Story 3 - Preserve existing protections and understand the edge (Priority: P3)

**Goal**: The existing protections keep their intended strength and no repository change is duplicated or overridden at the edge.

**Independent Test**: Compare the configured headers, the production response and the live edge response.

- [x] T013 [US3] Assert in `__tests__/security-headers.test.js` that HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy` and `Cross-Origin-Opener-Policy` are unchanged.
- [x] T014 [US3] Compare local production headers with the live response, record the Cloudflare HSTS override and report the exact edge setting needed for owner action. PASS — live edge returns `max-age=31536000; includeSubDomains` instead of the repository's two-year preload value; no CSP duplication observed.
- [x] T015 [US3] Run the full unit suite, `tsc --noEmit`, `./freebuff-verify.sh`, the production build and record the measured build size against the 495 MiB cap. PASS — 679 tests in 70 files, type check, repository gate and production build all exit 0; 358,302,351 bytes (≈341.7 MiB).

## Phase 5: Polish and Handoff

- [x] T016 Review the complete diff to confirm only the requested header configuration and its focused tests/artifacts changed; no Stripe configuration, appearance, content, dependency or unrelated security change.
- [x] T017 Update the Memory Bank active context and progress with verified results.
- [x] T018 Prepare the complete PR description and submit one regular, open, unmerged PR.

## Additional Verification Evidence

- All eight public routes (`/`, `/crystal-ball`, `/lucky-meter`, `/reveal`, `/map`, `/about`, `/privacy`, `/terms`) returned 200 with zero CSP violation messages and zero page errors.
- A real browser loaded both `https://www.googletagmanager.com/gtag/js` and `https://challenges.cloudflare.com/turnstile/v0/api.js` under the tightened policy with zero CSP violations.
- The inline-handler check confirmed an injected `onclick` attribute did not execute, while the React-rendered exploration button remained interactive.
- No Stripe payment was completed: the checkout route, prices, session configuration and `form-action https://checkout.stripe.com` are unchanged.

## Dependencies & Execution Order

- T001 and T002 establish the baseline.
- T003 and T004 are test-first tasks and precede T005.
- T006-T008 verify User Story 1 after implementation.
- T009-T011 implement and unit-test User Story 2; T012 verifies the delivered headers.
- T013-T015 verify preserved protections and the repository gate.
- T016-T018 review, record and submit.

## Execution Notes

- The header change is confined to the existing `headers()` block in `next.config.mjs`.
- The Stripe payment configuration, checkout options and prices are not changed.
- Cloudflare edge inspection is limited to observed live responses because the available API token cannot list zones.
