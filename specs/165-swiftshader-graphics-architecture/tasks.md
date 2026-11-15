# Tasks: SwiftShader Configuration and Graphics-Rendering Architecture

**Feature**: `165-swiftshader-graphics-architecture`
**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md)

## Phase 1: Investigation

- [x] T001 Read the existing Standard and SwiftShader configurations and the graphics capability layer.
- [x] T002 Run the Standard controls (`chromium-headless-shell` and the `chromium` channel) and record renderer, WebGL, Canvas 2D and WebGPU status.
- [x] T003 Run the SwiftShader flag matrix (current, unsafe WebGL, blocklist, WebGPU, Vulkan software, Vulkan surface, WebGPU feature, developer features).
- [x] T004 Read Chromium's `SystemInfo.getInfo` feature status for each variant.
- [x] T005 Record the decisions and rejected flags in `research.md`.

## Phase 2: Configuration and guards

- [x] T006 Keep the three proven SwiftShader arguments in `playwright.swiftshader.config.ts` and replace the stale package-script reference with the actual scripts.
- [x] T007 Document the measured WebGPU result and the reason no unsafe flag is carried in the configuration comment.
- [x] T008 Add `test:visual` and `test:visual:swiftshader` package scripts.
- [x] T009 Extend `__tests__/playwright-config-modes.test.js` to assert the exact arguments, reject unjustified unsafe/experimental flags, and verify the documented script exists.
- [x] T010 Confirm the Standard configuration is unchanged: no channel, no launch arguments, no SwiftShader mention.

## Phase 3: Architecture documentation

- [x] T011 Write `docs/graphics-rendering-architecture.md` covering the layer model, capability selection, renderer inventory, fallback ladder, image delivery, testing modes and future 3D requirements.
- [x] T012 State the non-goals: no new effects, no production WebGPU requirement, no forced renderer.

## Phase 4: Skill documentation correction

- [x] T013 Correct the SwiftShader flag list and add the rejected-flags table in the reference guide.
- [x] T014 Correct the WebGL/WebGPU capability claims and compatibility rows to the measured results.
- [x] T015 Update the skill summary table so WebGPU is described as probe-only.

## Phase 5: Verification

- [x] T016 Run the configuration guard and graphics-capability unit tests.
- [x] T017 Run the full Vitest suite and `tsc --noEmit`.
- [x] T018 Run the Standard Playwright configuration on desktop and mobile projects.
- [x] T019 Run the SwiftShader Playwright configuration and confirm the ANGLE/SwiftShader renderer.
- [x] T020 Run a browser check with WebGL forced unavailable and confirm the static fallback and completion.
- [x] T021 Run `./freebuff-verify.sh` and measure the production build size against the 495 MiB cap.
- [x] T022 Record exact commands, results and limitations in `evidence.md`.

## Phase 6: Submission

- [x] T023 Review the complete diff and confirm no production graphics, visual or image change.
- [x] T024 Update the PR body with scope, verification, limitations and deferred recommendations.
- [x] T025 Push the branch and keep the pull request open and unmerged.
