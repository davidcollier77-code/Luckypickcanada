# Active Context — Seven Checker Categories

## Current Task — Seven-category PR verification (spec 198, PR #1983)

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
- The toolkit has no production consumer yet; a future effect needs its own browser, mobile,
  accessibility, performance and baseline verification.
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
  the page settles. Their artwork, timing, sounds, responsive behaviour and fallbacks are unchanged.
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
