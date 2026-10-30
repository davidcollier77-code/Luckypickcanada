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
- [ ] T012 Playwright browser interaction check — BLOCKED: the bundled Chromium cannot start in this container (`libnspr4.so` missing) and `playwright install-deps` fails because the sandbox user cannot gain root (`no-new-privileges`). No visual or interaction result is claimed.
- [x] T013 Final diff inspection — PASS: 4 modified files plus this feature directory; wording, gold palette, layout, handlers, and destinations unchanged.
