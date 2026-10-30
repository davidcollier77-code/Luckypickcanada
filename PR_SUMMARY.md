# Homepage gold buttons: raised 3D depth, press feedback, and Suggestion shimmer

## Task and task group
Enhance the homepage buttons with a consistent raised 3D appearance, tactile press-and-release feedback, and a subtle moving golden shimmer on the Suggestion and Tip Jar buttons.

Task group: **`polishing`** — this is a visual/tactile polish pass on existing homepage buttons. No new functionality, route, asset, or dependency is introduced, which is why `creation` (implementation of new behaviour) and `troubleshooting` (failure diagnosis) do not apply.

## Implementation result
- `themes/default/homepage.css` — added one shared `.homepage-experience .gold-3d-btn` treatment: `0 3px 0 #a16207` bottom edge plus layered drop shadow and inset highlight at rest, a 2px lift on hover/`:focus-visible`, and a 2px press-down with the edge collapsed to `0 1px 0` and a 60ms `:active` transition so release animates back over 120ms. Added the `.gold-shimmer` overlay rule and a `prefers-reduced-motion: reduce` block that removes the transforms, transitions, and shimmer animation while keeping the static raised shadow.
- `app/homepage/HomePage.js` — added the `gold-3d-btn` class to the nine gold homepage buttons (Check Lucky Meter, Reveal Today's Card, Consult the Oracle, Explore Lucky Stories, Choose a Lucky Pick, Gift a Lucky Pick, Open the tip jar, Send suggestion, Read Our Story). Gave the Suggestion button the Tip Jar's existing shimmer overlay (`animate-shimmer`, `via-white/30`, `overflow-hidden` clipping, only while not submitting) and tagged both overlays `gold-shimmer`.
- `app/globals.css` — extended `@keyframes suggestionBtnGlow` with the shared bottom-edge/inset layers so the Suggestion glow pulse carries the same depth, and paused that animation while pressed so the flattened press shadow is visible.
- `.specify/feature.json` and `specs/062-homepage-gold-button-polish/{spec,plan,tasks}.md` — Spec Kit task records.

No image asset was created or modified: the effect is pure CSS, so the existing AVIF-first with WebP fallback strategy is untouched.

## Spec Kit stages
| Stage | Artifact |
| --- | --- |
| specify | `specs/062-homepage-gold-button-polish/spec.md` |
| plan | `specs/062-homepage-gold-button-polish/plan.md` |
| tasks | `specs/062-homepage-gold-button-polish/tasks.md` |
| implement | Source changes listed above |

Routed documents consulted: `AGENTS.md`, `.jules/jules.md`, `.jules/polishing.md`, `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`. `.docs/polishing/*` symlinks could not be read in this worktree (`Too many levels of symbolic links`), and `.docs/polishing/_websites_mdn_image_types.md` was therefore not consulted; it is not material here because no raster asset is selected, converted, or served by this change.

## Verification actually run
| Check | Status | Evidence |
| --- | --- | --- |
| `pnpm exec tsc --noEmit` | PASS | exit 0 |
| `pnpm test` | PASS | 22 files / 152 tests |
| `./jules-verify.sh` | PASS | exit 0 — Spec Kit governance gate, typecheck, build, refresh-docs 17/17 |
| Production build size gate | PASS | `.next` + `public` = 330,031,986 bytes / 314.74 MiB, below the 495 MiB hard maximum |
| Compiled CSS inspection | PASS | Built stylesheet contains the rest/hover/active 3D rules, the `:active.suggestion-btn-glow` pause, `.gold-3d-btn .gold-shimmer`, the reduced-motion block, and `@keyframes shimmer` |
| Served markup inspection | PASS | Rendered `/` HTML contains 9 `gold-3d-btn` buttons, 2 `gold-shimmer` overlays, and unchanged labels ("Send suggestion", "Open the tip jar") |
| Cascade-order inspection | PASS | Emitted byte offsets put `.homepage-experience .gold-3d-btn:hover` (41237) and `:active` (41510) after `.suggestion-box-submit:hover` (23084) and `:active` (40795), so the new rules win |
| Playwright browser interaction / screenshots | BLOCKED | Bundled Chromium cannot start (`libnspr4.so` missing); `playwright install-deps chromium` cannot gain root (`no-new-privileges`). No browser-level result is claimed. |

## Behaviour preserved
Button wording, gold gradient and colour values, padding/`rounded-full` geometry, focus-visible outlines, click handlers (`playButtonClick`, `openTipJar`, `openLuckyPickCheckout`, `openGiftCheckout`), destinations (`/lucky-meter`, `/reveal`, `/crystal-ball`, `/map`, `/about`), and the disabled submitting state are unchanged. Non-homepage buttons, image delivery, dependencies, Tailwind configuration, and deployment configuration are untouched.

## Remaining issues / risks
- Browser-level hover/press/shimmer rendering is unverified locally (blocked above); CI Playwright is the confirmation path.
- `prefers-reduced-motion` behaviour is verified from the built CSS rules only, not from an emulated browser run.
- `public/themes/default/homepage.css` is an older, unused copy of the homepage theme that had already diverged from `themes/default/homepage.css`; it was left unchanged intentionally to avoid an unrelated 2 KB-wide divergence diff.
- The existing Tailwind shadow/scale hover utilities remain in the markup and are overridden by the new, more specific rules rather than deleted, keeping the diff minimal.

## Final diff / error check
Four modified files (`.specify/feature.json`, `app/globals.css`, `app/homepage/HomePage.js`, `themes/default/homepage.css`) plus the new `specs/062-homepage-gold-button-polish/` directory and this summary. No unrelated files changed; no merge performed; no deployment performed.

## Pull request
- PR: [#1650](https://github.com/davidcollier77-code/Luckypickcanada/pull/1650)
- Source branch: `polish/homepage-gold-buttons` → target branch: `main`
- Implementation commit: `990c0a24`
- State: open and unmerged; merging is left to the repository owner.

USEFUL RESULT: YES — the requested styling, press feedback, and Suggestion shimmer are implemented and verified at the typecheck, unit-test, build, compiled-CSS, and served-markup levels. Browser interaction rendering remains BLOCKED in this container and is not claimed as verified.
