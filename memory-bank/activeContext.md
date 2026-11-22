# Active Context — PR verification streamlining

## Current Task — PR verification streamlining (Spec 211)

- **Goal:** make every PR check earn its runtime through trusted applicability, honest `NOT RUN` reasons, smarter Playwright execution and a local gate that predicts CI, without removing coverage.
- **Implemented:** fail-closed build classifier (`pr_applicability.py`) gating the protected OpenNext workflow; trusted-base recomputation in Verification Integrity and the consolidated report; the always-required job renamed `Application Verification`; a required-but-skipped check now blocks while a proven-inapplicable check is `NOT RUN — not applicable`; Playwright timing capture, whole-file duration-weighted shard planning with exact-coverage guards, shadow-mode affected-spec selection, and flake/imbalance warnings; `./freebuff-verify.sh` now runs all Python checker suites, the full Vitest suite, the type check, the Next.js build and the 495 MiB cap.
- **Preserved:** all 16 Playwright specs, three projects, `playwright.config.ts`, every committed baseline, Crystal Ball/Oracle and adaptive-performance/resource-readiness coverage, DevSkim, CodeQL default setup, Dependabot and the `performance` checker mode.
- **Excluded pending separate approval:** dead checker modes, obsolete root scripts, deployment-workflow narrowing, subset spec selection and a third shard.
- **PR status:** open and unmerged for owner review.

## Previous Task — Resource-readiness safety limits (Spec 210)

- **Goal:** bound the existing readiness hub before any two-container handover: capacity accounting, queue caps, counted leases and real disposal, with tests.
- **Scope:** `app/lib/resource-readiness.js` and `__tests__/resource-readiness.test.js`, plus Spec 210 artifacts and this Memory Bank header. No new preloader, payload accessor, visual, audio, timing or layout change.
- **Implemented:** per-tier entry/weight/queue/speculative budgets; declared-or-estimated weights; priority admission that defers speculative work, sheds queued speculative jobs for committed work and evicts settled unleased records; counted leases that retire rather than dispose on release, pressure, version change and eviction; best-effort disposal for hub-owned payloads only; `getResourcePoolStats()` diagnostics.
- **Deferred:** the alternating two-container handover, reserve gates, overflow classes, replenishment and demand scaling remain future work until a current experience consumes a prepared payload.
- **Verification:** readiness suite 45 tests; focused readiness/adaptive suites 116 tests; full suite 108 files / 1,172 tests; `tsc --noEmit` exit 0; `SPEC_KIT_BASE_REF=dda472cd620ed60e8841cb73582fdfdd00168013 ./freebuff-verify.sh` exit 0; production build 461,424,444 bytes (440.05 MiB), below the 495 MiB cap.
- **Review repairs (owner-directed, post-submission):** removed shed and refused stale records from retained capacity while keeping them in the bounded rejection ledger; refreshed ledger insertion order on re-rejection; stopped background eviction and refused impossible requests without emptying the pool; revived release-retired records for a new consumer instead of sweeping them underneath it; deferred a same-key version replacement until the old record is disposed; made readiness snapshots report the most recent decision; added four regression tests. The remaining advisory findings were checked: the `allowIntent` claim is not a defect (intent still sheds background work first), the `disposeEntry` retired-flag note is harmless on detached entries, and explicit release intentionally leaves in-flight work alone under the documented policy.
- **PR status:** regular, non-draft PR, open and unmerged for the owner; the consolidated seven-category report must refresh for the new review-repair head after push.

## Previous Task — Compact Agent Governance (Spec 207)

- **Goal:** Reduce `AGENTS.md` from 478 lines to a concise entry point while retaining every distinct requirement and all three agent-applicability classes.
- **Approach:** Keep direct rules in `AGENTS.md`; refer detailed PR, startup, manifest and specialist procedures to their authoritative documents. Keep Freebuff-only and ChatGPT-only instructions separate.
- **Scope:** `AGENTS.md`, its governance regression test, Spec 207 artifacts and this active-context header. No startup, manifest, PR procedure, QA workflow, protected script, application or dependency changes.
- **Verification boundary:** ChatGPT startup preflight reports Node.js 22.16.0 and missing pnpm 10.30.3; the repository requires Node.js 26.x and pnpm 10.30.3. ChatGPT does not run repository scripts, tests or builds. GitHub Actions must provide test and checker evidence.
- **PR status:** Prepare a dedicated, regular, non-draft PR; leave it open and unmerged. The owner must provide the governance digest comment and separate protected-file Environment authorization before merge.

## Previous Task — Agent governance and PR handoff (Spec 206)

- PR #2006 was merged into `main`. Its current-head report and protected-file authorizations belong to that completed PR.
- The current task only condenses the governance entry point; it does not revise the seven-category report, `PR_SUBMISSION.md`, startup documentation or browser tooling.

## Current Project State — Lucky Meter approved Build (Spec 205)

- The approved Lucky Meter Build was implemented on `freebuff/lucky-meter-build` and merged through PR #2005.
- Durable implementation and verification details remain in `memory-bank/progress.md` and `specs/205-lucky-meter-approved-build/`; old pre-Build gate notes below are historical, not current status.
- The approved presentation and preserved CSS fallback, five-beat generation, progressive drain reveal, uniform 12,000 ms celebration, Spark window and results-panel dock are recorded in Spec 205 and the milestone history.

## Previous Task — Pre-Build documentation reconciliation

The earlier documentation-only reconciliation for Specs 199/200 is complete and was followed by the authorized Build. Its original planning and intermediate verification notes are retained below as historical context, not as current task status.

## Recent Implementation — Three-dimensional vessel and pour (Spec 200)

- **Spec Kit feature:** `specs/200-lucky-meter-dimensional-vessel`
- **Scope:** replaced the CSS vessel with a lathed Three.js tumbler on the
  shared creative surface, added the curved stream and splash, raised the
  medallion face, added gold sky writing and corrected the Home/countdown
  contract.
- **Verification record:** T035–T037 record `tsc --noEmit`, 23 focused tests and
  105 files / 1,133 Vitest tests. T038–T041 (Playwright, production build,
  `./freebuff-verify.sh`, final evidence/diff review) and T052 (PR handoff)
  remain unchecked.
- **Superseded by the approved outline:** top-right Home dock, glyph-by-glyph
  Spark, fill-only vessel/full-vessel number timing and per-tier celebration
  durations. The current contract is in the approved outline and Spec 200's
  reconciliation note.

## Previous Task — Twelve-stage Lucky Meter presentation polish (Spec 199)

- **Spec Kit feature:** `specs/199-lucky-meter-twelve-stage-polish`
- **Status:** implemented on 20 November 2026; partly superseded on 21 November
  2026.
- **Historical scope:** presentation, animation, timing and audio polish only.
  Selection, storage, tiers, messages, palettes, celebrations, the Milky Way
  backdrop and the Medallion Gold identity were unchanged.
- **Historical result:** one clock with twelve ordered stages, a four-layer
  arrival pile (34 leaves), 5–100 generation, a DOM + CSS 3D vessel, a number
  held until the drain and flashed twice, per-tier celebration lengths, a
  maple-leaf Spark cursor, a 2.6 s hold and a paired Home/countdown dock.
- **Historical verification:** focused and full Vitest suites, `tsc --noEmit`,
  a 416,229,183-byte (396.95 MiB) production build and the Playwright
  `lucky-meter-daily-resonance` spec on desktop and both mobile projects.
  These are historical records, not re-run for this documentation task.
- **Superseded:** square/CSS vessel, 5–100 monotonic generation, number only
  after the drain, fixed two-flash requirement, per-tier celebration lengths,
  top-right Home/countdown and approximately 40 s total timing.

## Previous Task — Seven-category PR verification (spec 198, PR #1983)

- **Spec Kit feature:** `specs/198-seven-checker-categories`
- **Branch:** `freebuff/25590a89225c606a9ca3e3ec` (PR #1983, open and unmerged)
- **Scope:** One consolidated PR verification report with exactly seven categories: QA Checker, DevSkim, PR Scope Verification, Protected File Changes, Verification Integrity, Governance and Workflow Verification and Dependency Health & Vulnerability Review. Statuses are `PASSED`, `FAILED`, `WARNING` and `NOT RUN`.
- **Checker 7 — Dependency Health & Vulnerability Review:** runs on every pull request from changed `package.json`/lockfiles plus GitHub's open dependency advisories. Unchanged or unrelated outdated dependencies are context only and never fail a PR; a changed dependency with an open high/critical advisory fails; a manifest without its lockfile or a moderate advisory warns; an unreadable advisory source is `NOT RUN`. Dependabot remains the unchanged weekly updater and is not a prerequisite.
- **Review repairs on PR #1983:** owner `/approve-` comments refresh the report; empty or malformed verification audits are `NOT RUN` and an audit for another head fails; a check run without `head_sha` is not current-head evidence; a render failure replaces the previous comment with a marker-first `NOT RUN` placeholder; changed-code findings render `excerpt`/`recommendation`; bot-authored PRs report the human attestation as `NOT RUN` instead of failing; check runs and dependency advisories are paginated; the final size fallback slices UTF-8 bytes.
- **Preserved:** DevSkim scanning/suppression/SARIF/upload, the full unit suite, the TypeScript check, the OpenNext build and 495 MiB gate, both Playwright shards and all committed baselines. They are supporting evidence inside QA Checker, never extra top-level categories.
- **Declarations:** the exact pre-submission code quality review line is required for QA Checker; the exact human authorization line is required for protected-file changes in addition to the existing environment-protected gate. Scope expansion requires the exact words `Scope changed` plus an explanation and the existing owner digest approval.
- **Removed requirement:** submitters no longer supply personal browser runs, screenshots or manual browser evidence; automated Playwright owns browser verification against the current head.
- **Documentation:** `PR_SUBMISSION.md` and `.github/pull_request_template.md` agree on the complete PR description, declarations and all seven categories.

## Previous Task — Shared Graphics Toolkit Guidance (spec 197)

- **Spec Kit feature:** `specs/197-shared-graphics-toolkit-guidance`
- **Branch:** `chatgpt/197-shared-graphics-toolkit-guidance`
- **Scope:** Add a 🟢 [BOTH — CHATGPT AND FREEBUFF] rule to `AGENTS.md` for future visual creation and polishing.
- **Required integration:** Use `app/lib/use-creative-experience.js`, `app/lib/graphics/experiences.js` and `app/lib/graphics/runtime.js` with the existing `app/lib/resource-readiness.js` hub wherever applicable. Do not create a competing preloader.
- **Development sandbox:** Existing Workbench at `/workbench/creative`; this does not replace Playwright or repository QA.
- **Verification limitation:** ChatGPT's startup preflight reports Node.js 22.16.0 (repository requires 26.x) and missing pnpm 10.30.3. ChatGPT's repository instructions prohibit running repository scripts, so local tests, builds and verification scripts were not executed. GitHub workflow checks and protected-file approvals remain outstanding.

## HTML5 audio reactivity and Gemini retirement QA (spec 195, current)

- **Spec Kit feature:** `specs/195-html5-audio-reactivity-gemini-retirement`
- **Base:** main at `e8bbd0a9` (after PR #1972)

### Added

- `app/lib/graphics/audio-reactivity.js` now captures playing Howler `html5: true` cues with a
  `MediaElementAudioSourceNode` on Howler's existing `AudioContext`. The source reaches the context
  destination at unity first (audible playback unchanged) and the shared analyser second. Capture is
  refused for an unsupported API, a suspended/closed context, a cross-origin element or an element
  another owner already captured; the envelope stays neutral. Scans are throttled to 500 ms, forced by
  `refresh()`, and captured sources reconnect if the analyser is rebuilt. Releasing the analyser
  removes only the analysis edge, so a cue that is still playing is never silenced.
- The development workbench gained `playHtml5Cue`, a small same-origin HTML5 cue catalogue and
  `audio.html5Sources`/`audio.html5Playing` diagnostics. It remains development-only.
- `__tests__/graphics-sound-reactivity.test.js` covers capture, audible-path ordering, de-duplication,
  fallbacks and Howler HTML5 discovery.

### Corrected

- `__tests__/reviewer-retirement.test.ts` no longer requires the retired
  `.docs/deep-dive/_google-gemini_gemini-skills_gemini-api-dev.md`.
- `__tests__/docs-library-retirement.test.ts` asserts both retired Gemini API identifiers absent from
  every manifest index, routing file and snapshot path.
- The two orphaned `.docs/creation` Gemini API snapshots were removed. Nothing was restored,
  recreated, regenerated or replaced.

### Review repairs (owner-directed PR #1975)

- A failed analysis connect no longer marks the element as analysed: the captured source is tracked
  with a pending edge and retried on each scan or graph rebuild without re-capturing the element.
- Howler's `autoSuspend` is switched off once a cue is captured (its scheduled timeout re-checks the
  flag) and `ensureCapturedCuePlayback` resumes a suspended or interrupted context while a captured
  cue is playing, so inactivity can never silence a rerouted cue.
- `resetHtml5AnalyserCapture()` gives each HTML5 test a clean registry, removing order dependence.
- `.freebuff/sentinel.md` no longer mandates the retired Gemini API source, and the retirement test
  now checks every `.freebuff/*.md` file.

### Verified

- Focused 44 tests after the review repairs (42 before), refresh-docs 48/48, Chromium Web Audio
  baseline 0.064 and HTML5-only peak 0.065 (`html5Sources: 1`), fallback playback with
  `html5Sources: 0` and peak 0, no page errors.


## Creative Workbench and sound reactivity (spec 193 continuation, current)

- **Spec Kit feature:** `specs/193-graphics-development-toolkit` (continuation section)
- **Branch:** `freebuff/4710ddd25ee135d8c2e93310` (continues PR #1966's layer from `c5a3bd74`)

### Added

- `app/lib/graphics/audio-reactivity.js`: one shared `AnalyserNode` on the graph Howler already
  built (`masterGain → analyser → 0-gain → destination`, so the audible mix is untouched), a
  smoothed envelope (fast attack, slow release, band splits, peak, transient with a 140 ms cooldown)
  and bindings for a light rig, a particle field, any numeric property and beat callbacks. No
  `AudioContext` is created; `html5: true` Howler cues bypass Web Audio and are documented as
  unanalysable.
- `reactiveAudio` in `technologies.js` resolves to `audioReactive` only when the browser can analyse
  audio and motion is allowed, with `selectGraphicsTechnologies(requirements, quality, overrides)`
  gaining a deterministic `reducedMotion` override for harnesses.
- `runtime.js` creates the envelope when the plan enables it, updates it before the caller's frame,
  passes it as `frame.envelope`, exposes it as `surface.reactive` and disposes it with the surface.
- `app/lib/graphics/workbench.js` (pure catalogue, state, plan, capture names, production gate),
  `workbench-runtime.js` (deterministic Three.js/Canvas 2D scenes) and
  `components/graphics/CreativeWorkbench.jsx` with `window.__creativeWorkbench` (getState,
  selectScene, setTier, setSeed, setReducedMotion, setTime, play, pause, playCue, capture,
  readCapture). The route `/workbench/creative` is dynamic and 404s in production unless
  `CREATIVE_WORKBENCH=1`.
- `CreativeSurface.jsx` accepts an optional value-compared `quality` prop.

### Preserved

No visitor route, artwork, animation, timing, sound, layout, dependency or service changed. Existing
surfaces never request `reactiveAudio`, so they create no analyser. The documentation-library,
manifest, updater workflows and Cloudflare scheduler work remain untouched.

- **Updated:** 2026-11-19
- **Branch:** freebuff/5675fb1c2b649136e34a4b21
- **Base:** main at 722e17b7
- **Spec Kit feature:** specs/193-graphics-development-toolkit

## Current Task

Equip the repository with premium graphics-development capabilities for future cinematic, realistic
and gaming-quality visuals. Audit existing dependencies, install only what adds genuine value, and
integrate it so future work can use it — without changing any existing visual, artwork, animation,
layout or behaviour. Free/MIT only, mobile and performance preserved, build strictly below 495 MiB.

## Implemented State

- `three` 0.187.0 (runtime) and `@types/three` 0.187.0 (dev) are installed. No other package was
  added; `gsap`, `framer-motion`, `canvas-confetti` and `html2canvas` were already present and are
  reused.
- `app/lib/graphics/stage.js` creates a renderer, scene and perspective camera from
  `resolveRenderQuality` tiers, loads Three.js through a dynamic import, renders through
  `createAdaptiveFrameLoop`, paints one static frame under reduced motion, watches context loss and
  restoration, caps the pixel ratio without touching CSS size, and disposes the loop, observers,
  listeners, scene resources and WebGL context.
- `app/lib/graphics/effects.js` composes `EffectComposer` + `RenderPass` + `UnrealBloomPass` +
  `OutputPass` + `SMAAPass` from `three/addons`, with per-tier bloom strength, resolution scale and
  no bloom/SMAA on the constrained tier.
- `app/lib/graphics/assets.js` lazily loads uncompressed glTF/GLB and returns a disposable scene or
  `null`; `app/lib/graphics/resources.js` disposes geometries, materials and textures.
- `app/lib/graphics/README.md` documents usage, budgets, fallbacks, rejected alternatives and
  limitations; `docs/graphics-rendering-architecture.md` gained the toolkit section.
- Nothing in `app/`, `components/` or any page imports the toolkit. No Three.js chunk is emitted and
  no existing page, component, style or asset changed.

## Verification

- Focused toolkit tests 16/16 and dependency-policy tests 10/10 pass.
- `pnpm exec tsc --noEmit`: exit 0.
- `SPEC_KIT_BASE_REF=FETCH_HEAD ./freebuff-verify.sh`: exit 0 (includes install, Spec Kit gate, QA
  script suites, type check, production build and refresh-docs tests).
- Production build 370.55 MiB (386 MiB by `du -sm`), below the 495 MiB cap, with
  `grep -rl WebGLRenderer .next/static` returning zero files.
- Software-rendered harness (SwiftShader WebGL2): stage and bloom composer created, 34 frames, lit
  pixel readback, `glError 0`, no page error.
- Desktop 1440×900 and mobile 390×844 homepage captures show unchanged visuals and no application
  console error; only the wrapper session's dev HMR WebSocket handshake failures appeared.
- Evidence: `specs/193-graphics-development-toolkit/evidence.md`; captures in
  `artifacts/graphics-development-toolkit/`.

## Limitations

- No hardware GPU in this VM, so no GPU performance measurement exists.
- Draco/KTX2 compressed models are deferred until an effect needs them.
- The first production consumer is the Lucky Meter vessel (`lucky-meter-vessel`, Spec 200); the
  Three.js chunk remains lazy and is requested only by that experience. A future effect still needs
  its own browser, mobile, accessibility, performance and baseline verification.
- The CI visual regression suite runs after PR creation; it was not run locally.

## Continuation — completed automatic integration (PR #1966, 2026-11-19)

The owner directed that the toolkit become automatically available and usable, not merely installed.

- `app/lib/graphics/technologies.js` selects the render technology (Three.js, Canvas 2D, an existing
  WebGL engine, or DOM) plus motion and audio technology from the declared requirements, the shared
  capability probes and the adaptive tier. Existing `webgl` experiences are never moved to Three.js.
- `app/lib/graphics/experiences.js` is the single visual registry. `creativeResourcesFor` derives the
  hub resources (`module`, `texture`, `model`, `audio`) from one descriptor; the readiness manifest
  spreads them into its experience definitions, and `installCreativeExperiences()` installs the
  adapters and registers any future visual experience automatically. No second preloader exists.
- Building blocks: `canvas-surface.js` (managed Canvas 2D), `timeline.js` (lazy GSAP),
  `materials.js`, `lighting.js`, `particles.js`, `audio-sync.js`, `runtime.js` (one lifecycle for
  every renderer), `components/graphics/CreativeSurface.jsx`, `use-creative-experience.js` and the
  unmounted example `examples/golden-motes.js`.
- The Lucky Meter and the Lucky Card Reveal call `useCreativeExperience`; their derived resources
  (Lucky Meter sound set, reveal sparkle/applause/pop, confetti chunk) are prepared by the hub after
  the page settles. At the time of PR #1966 those visuals, timing, sounds, responsive behaviour and
  fallbacks were unchanged; Specs 199 and 200 later changed the Lucky Meter presentation, while the
  Card Reveal remained unchanged.
- PR review findings were repaired: `Clock.start()` reset, context loss before `renderer.dispose()`,
  SMAA before `OutputPass`, exposed bloom handle with `setBloom`, real shared-layer guard assertion,
  README double render. Graphite's context-restore claim was checked against Three.js's
  `WebGLRenderer.onContextRestore` and is not a defect.
- Verification: 103 files / 1083 Vitest tests, `tsc --noEmit` exit 0,
  `SPEC_KIT_BASE_REF=722e17b7 ./freebuff-verify.sh` exit 0, production build 378,582,202 bytes
  (361.1 MiB; 376 MiB by `du -sm`), zero page chunks containing Three.js (engine code is async-only).
  Playwright visual runs and the CI checkers remain pending after the push; no ESLint config exists.

### Round 2 (current head)

Five genuine review findings were repaired: `CreativeSurface` requirement identity, explicit
`aria-hidden`, the `audio-sync.attach` timeline contract, once-per-teardown disposal of shared
resources, and a stall timeout for `loadGLTF`. Clock reset, context-loss ordering, SMAA order and the
bloom handle remain fixed from round 1; the context-restore and camera-aspect claims were re-checked
and are not defects. Focused tests 41, full suite 103 files / 1087 tests, `tsc` exit 0,
`freebuff-verify.sh` exit 0, clean build 394.53 MiB by `du -sb .next public`.


## Documentation Library Addition — Three.js concise LLM reference (2026-11-19)

A separate `/websites/threejs_llms_txt` source now points to `https://threejs.org/docs/llms.txt` and is routed to Creation and Polishing. The existing `/websites/threejs` source remains the full `llms-full.txt` reference. The concise snapshot is canonical in Creation; Polishing uses the established relative symlink pattern. No application code or updater workflow was changed.

