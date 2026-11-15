# Active Context — Lucky Meter Cinematic Redesign

- **Updated:** 2026-11-15
- **Repository:** `davidcollier77-code/Luckypickcanada`
- **Branch:** `freebuff/645448188e4eb950b3b04f32`
- **Base:** `main`
- **Spec Kit feature:** `specs/164-lucky-meter-cinematic-redesign`
- **Pull request:** [#1909](https://github.com/davidcollier77-code/Luckypickcanada/pull/1909)

## Current Task

Redesign the Lucky Meter into a cinematic, realistically rendered experience while
preserving its result logic, reveal timings, sharing, storage, artwork and the
existing Milky Way background.

The follow-up pass resolved the review and CI findings from the first run:
Lucky Meter micro-labels now have an explicit 12px floor, the per-frame
`gl.getError()` debug call is gone, the near surface is disposed on context
loss, `PointBatch` growth is bounded, and the two `setTimeout` sites carry the
repository's verified-safe DevSkim annotation. `main` was merged in so the
branch is mergeable and the `pull_request` checks can run again.

## Implemented State

- The Milky Way `<picture>`, responsive sources, `object-position: center 40%`,
  overlay and layer order are unchanged.
- The composition is bottom-anchored around an always-mounted circular meter:
  heading and Start above it, supporting details and Share below it, Home in the
  top-right corner. The ring has a viewport-aware minimum size so its centre text
  never clips on short viewports.
- Home follows the persisted lifecycle: visible before Start, removed on the
  Start press, hidden across the scramble, landing, details and the whole event,
  and restored only once the cinematic (including the final golden sparks) has
  finished. A refresh mid-event resumes the stored event with Home still hidden.
- `cosmic-event-engine.js` renders a far surface behind the interface and a
  pointer-transparent near surface above it. Meteors use continuous plasma
  streaks, lightning uses a bounded branching geometry with a white-hot core and
  additive bloom, red fireworks are dense peonies while silver is finer crackling
  sparkle, and the finale is a large golden chrysanthemum with willow streamers
  and foreground sparks that fall across the interface.
- Particle sizes scale with viewport area; per-surface point budgets are bounded;
  silver crackle children are terminal so the particle count cannot run away; the
  frame governor steps resolution and budgets down before it drops the near layer.
- Every Lucky Meter micro-label uses an explicit px size rather than a rem-based
  utility, because the site's 15px root makes `text-xs` compute to 11.25px.
- Two recorded cues were added (finale boom, thunder rumble) with a committed
  provenance record; existing cues are unchanged.

### Inherited from `main`

- AGENTS.md has one dedicated QA checker planning section; duplicate QA guidance
  and the generic QA summary have been removed, and an independent final review
  of the completed implementation and complete diff is required before
  submission.
- PR_SUBMISSION.md points to AGENTS.md Section A.8, repeats the final review
  requirement, clarifies that CI results do not replace self-review, and permits
  work on an already-submitted PR only when the repository owner directly
  instructs it.
- Visual QA classifier correction from merged PR #1910: CI-only paths under
  `.github/` and Next.js API routes under `app/api/` and `pages/api/` skip only
  the Playwright browser shards; frontend, visual assets, browser tests and
  unknown paths remain fail-closed, and mixed changes still require Playwright.
- The PR scope checker applies the same API/CI browser-evidence exclusions.
  Explicit `visual_impact.required: true` remains an override; unit, TypeScript,
  security, scope and build checks remain intact.
- PRs #1908 and #1910 are merged into `main`; this branch carries their changes.

## Verification and Handoff

- 80 Vitest files / 769 tests passed; `tsc --noEmit` exit 0.
- `pnpm run build` exit 0; `.next` measured at 424.22 MiB including the build
  cache (107.19 MiB excluding it), strictly below the 495 MiB cap.
- Chromium browser QA: 27/27 checks covering welcome, lifecycle, event, Share
  clickability, persistence, refresh resume, reduced motion, WebGL-disabled
  fallback and mobile 390 × 844.
- Mobile accessibility floor: `mobile-390` and `mobile-412` pass, 2/2.
- Audio files were verified sample-for-sample against their Mixkit masters
  (correlation 1.0), confirming they are recordings rather than generated audio.
- PR #1911 (the follow-up fixes) was squash-merged into this branch as
  `711c9c3d`; the merge of `main` here restores mergeability so GitHub can build
  the pull-request merge ref and run Visual QA again.

## Limitations

- Firefox and WebKit binaries are unavailable in this environment, so those
  engines were not executed.
- No hardware GPU is exposed; Chromium ran on SwiftShader. Frame-rate behaviour on
  real GPUs and the near-layer path at full quality are not measured here.
- Real-device Samsung Internet, Opera and Edge runs were not performed.
- GitHub skips `pull_request`-event workflows while a PR conflicts with its base,
  because it cannot create the merge ref. Only `pull_request_target` checks ran
  during that window.
