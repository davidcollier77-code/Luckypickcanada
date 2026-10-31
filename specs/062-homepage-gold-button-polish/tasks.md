# Tasks — Homepage Gold Button Raised Depth and Shimmer

## Implementation
- [x] T001 [US1] Add the shared `.homepage-experience .gold-3d-btn` raised rest, hover/focus lift, and press-flatten rules in `themes/default/homepage.css`.
- [x] T002 [US2] Add the `gold-3d-btn` class to the nine gold buttons in `app/homepage/HomePage.js`.
- [x] T003 [US2] Add the moving shimmer overlay to the Suggestion button in `app/homepage/HomePage.js` and clip it with `overflow-hidden`, reusing the Tip Jar overlay markup.
- [x] T004 [US2] Tag the Tip Jar and Suggestion shimmer overlays with `gold-shimmer` in `app/homepage/HomePage.js`.
- [x] T005 [US3] Extend `@keyframes suggestionBtnGlow` in `app/globals.css` with the shared bottom edge and inset layers.
- [x] T006 [US4] Add the `prefers-reduced-motion: reduce` rules for the 3D transforms and the shimmer overlays in `themes/default/homepage.css`.

## Verification
- [x] T007 `pnpm exec tsc --noEmit` — PASS (exit 0).
- [x] T008 `pnpm test` — PASS (22 files / 152 tests).
- [x] T009 Clean production build with measured `.next` + `public` size — PASS, 330,031,986 bytes / 314.74 MiB (< 495 MiB cap).
- [x] T010 `./jules-verify.sh` — PASS (exit 0: Spec Kit gate, typecheck, build, refresh-docs 17/17) before the final documentation edits; re-run after them.
- [x] T011 Compiled CSS inspection — PASS: `.homepage-experience .gold-3d-btn` rest/hover/active rules, the `:active.suggestion-btn-glow` pause, the `gold-shimmer` rule, the reduced-motion block, and `@keyframes shimmer` all present in the built stylesheet. Served HTML contains 9 `gold-3d-btn` buttons and 2 `gold-shimmer` overlays.
- [x] T012 Playwright browser interaction check — PASS locally: `pnpm exec playwright test tests/visual/gold-cta.spec.ts` ran `12 passed (20.0s)` on the desktop (1440×900), mobile-390 (390×844) and mobile-412 (412×915) projects. Chromium was started in this container by extracting the missing `libnspr4`/`libnss3`/X11/font libraries into a local directory and supplying `LD_LIBRARY_PATH` plus a minimal `FONTCONFIG_FILE`; no application or dependency file was changed to make the browser run. Observed in-browser: 9 gold CTAs, 3px raised edge at rest, 2px hover lift, 2px press with a collapsed 1px edge, 12s shimmer on both glow buttons, 3s `goldBtnGlow` pulse on Tip Jar and Suggestion, no CTA overlap or horizontal overflow, all CTAs ≥44px tall, and the reduced-motion fallback (no transform, no shimmer, edge retained). Evidence screenshots are attached to the Playwright report by the spec.
- [x] T014 Automated browser coverage — PASS: `tests/visual/gold-cta.spec.ts` added under the existing `testDir` so the free `ubuntu-latest` Visual QA workflow runs it with no workflow change.
- [ ] T015 Visual QA workflow on the pushed branch — PENDING: the run is recorded in the pull request once GitHub reports it.
- [x] T013 Final diff inspection — PASS: 4 modified files plus this feature directory; wording, gold palette, layout, handlers, and destinations unchanged.
