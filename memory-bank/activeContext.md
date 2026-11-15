# Active Context — SwiftShader Configuration and Graphics Architecture

- **Updated:** 2026-11-15
- **Repository:** `davidcollier77-code/Luckypickcanada`
- **Branch:** `freebuff/aef8aeb8af2c199064dff1a1`
- **Base:** `main`
- **Spec Kit feature:** `specs/165-swiftshader-graphics-architecture`
- **Pull request:** opened from this branch as a regular, non-draft PR; left open and unmerged

## Current Task

Complete and verify the repository's SwiftShader Playwright configuration, document the site's intended
graphics-rendering architecture, and correct the 13-area Playwright skill guidance that had described
the SwiftShader flag set from upstream documentation rather than from this environment.

## Implemented State

- The SwiftShader configuration keeps exactly three arguments
  (`--use-gl=angle --use-angle=swiftshader --enable-gpu`), one worker and no retries. Its comment now
  records the measured WebGL/WebGPU results and why no unsafe or experimental flag is carried.
- `package.json` exposes the previously referenced but missing `test:visual` and
  `test:visual:swiftshader` scripts.
- `__tests__/playwright-config-modes.test.js` pins the exact arguments, rejects unjustified unsafe or
  experimental graphics flags, and verifies both scripts.
- `docs/graphics-rendering-architecture.md` documents the layer model (CSS/DOM, Canvas 2D, WebGL,
  optional WebGPU), capability selection, renderer inventory, fallback ladder, the independent
  AVIF/WebP delivery pipeline, testing modes and the requirements for future 3D work. No new effect,
  renderer or production WebGPU dependency was added.
- The Playwright skill `SKILL.md` and `references/lucky-pick-canada.md` now state WebGL/WebGPU
  capabilities from the measured feature status, list the rejected flags with reasons, and retain all
  thirteen capability areas and upstream references.
- Spec Kit feature 165 records the specification, plan, research (full flag matrix), tasks and evidence.

## Verification

- 9/9 focused guard and toolkit tests; `tsc --noEmit` exit 0.
- Standard Playwright: 6/6 on desktop + mobile-390, 3/3 on mobile-412.
- SwiftShader Playwright: 3/3 on desktop with the ANGLE/SwiftShader renderer.
- WebGL-disabled browser check: static radial-gradient fallback rendered, Share reached, zero console
  errors.
- Governance guard: 10/10 after aligning its expectations with the current `AGENTS.md`; full Vitest
  80/80 files, 774/774 tests; `tsc --noEmit` exit 0.
- `./freebuff-verify.sh` exit 0; production build 387.04 MiB (160.32 MiB without cache), below the
  495 MiB cap.

## Limitations

- No physical GPU is exposed; Chromium ran on SwiftShader. No hardware or WebGPU rendering claim is made.
- WebGPU reports `unavailable_software` and `navigator.gpu` is undefined in this build, including with
  every tested software/unsafe flag.
- Firefox and WebKit were not executed.
- The screenshot-based visual suite was not run; functional desktop and mobile specs were.

## Follow-ups

- Re-run the PR's CI after the governance-test correction.
- Re-run the graphics probe after a Chromium upgrade before changing any SwiftShader flag.
