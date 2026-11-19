# Implementation Plan: HTML5 Audio Reactivity and Gemini Retirement QA

**Branch**: `freebuff/25c1d4ae61eefff2a7a4cddb` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/195-html5-audio-reactivity-gemini-retirement/spec.md`

## Summary

Extend the existing sound-reactivity bridge so Howler `html5: true` cues are captured through a `MediaElementAudioSourceNode` on Howler's existing `AudioContext`. The same source feeds the context destination at unity (unchanged audible playback) and the shared analyser (measurement). Capture is opportunistic and fail-safe. Correct the two retirement suites so the intentionally removed Gemini API documents are asserted absent rather than required, and remove the two orphaned canonical snapshots so the library matches the retirement already expressed in `.docs/manifest.json`.

## Technical Context

**Language/Version**: JavaScript/TypeScript on Node.js 26.x and Next.js 16.4.5

**Primary Dependencies**: Existing `howler` 2.2.4; browser Web Audio `AnalyserNode` and `MediaElementAudioSourceNode`; existing Three.js/Canvas 2D creative layer

**Storage**: N/A (no database, cache or file writes at runtime)

**Testing**: Vitest, `node scripts/test-refresh-docs.js`, `tsc --noEmit`, Playwright (repository wrapper) and the production build

**Target Platform**: Cloudflare Pages / Workers via OpenNext; modern browsers with and without media-element capture

**Project Type**: Web application

**Performance Goals**: One shared analyser; HTML5 element scanning at most every 500 ms; no per-frame allocation added by this change

**Constraints**: Build strictly below 495 MiB; no second audio system or context; no change to existing cue volumes, timing or fallbacks; `.docs` change limited to removing the two intentionally retired snapshots

**Scale/Scope**: Three existing HTML5 cues (reveal sparkle, applause, confetti pop); one shared analysis graph per page; two retirement suites

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Single source of truth: `AGENTS.md` remains authoritative; no governance file is edited.
- Verify before acting: the Visual QA failure was reproduced before the expectation was changed; the audio path was inspected before design.
- Implementation sequence: inspect → identify → understand → plan → implement → test → double-check → report → PR.
- Protect core systems: no payment, authentication, database, hosting, deployment, environment or secrets configuration is touched.
- Resource conservation: no dependency or service is added; the build is measured below the cap.
- Spec Kit: spec, plan and tasks are produced for this one feature directory.

## Project Structure

### Documentation (this feature)

```text
specs/195-html5-audio-reactivity-gemini-retirement/
├── spec.md
├── plan.md
├── tasks.md
└── evidence.md
```

### Source and tests

```text
app/lib/graphics/audio-reactivity.js      HTML5 media-element capture on the shared graph
app/lib/graphics/workbench.js             dev-only HTML5 cue source catalogue
app/lib/graphics/README.md                reactivity documentation
components/graphics/CreativeWorkbench.jsx dev-only playHtml5Cue + capture diagnostics
__tests__/graphics-sound-reactivity.test.js  capture/fallback/detection tests
__tests__/docs-library-retirement.test.ts   Gemini retirement assertions
__tests__/reviewer-retirement.test.ts       remove outdated document requirement
.docs/creation/_websites_ai_google_dev_gemini-api.md          removed (retired)
.docs/creation/_google-gemini_gemini-skills_gemini-api-dev.md removed (retired)
```

## Approach

1. Keep the single shared analyser and its silent zero-gain branch unchanged. Add a media-capture section beside it.
2. When a Howler HTML5 sound is playing, scan Howler's bounded sound pool (throttled) and capture its element once: connect the source to `context.destination` first (audible, unity), then to the shared analyser.
3. Never disconnect the audible edge on release; disconnect only the analyser edge. Reconnect captured sources if the analyser is rebuilt.
4. Refuse capture when the browser lacks the API, the context is not running, the element is cross-origin or already captured. Keep the envelope neutral.
5. Add a development-only workbench hook that plays a catalogue recording through Howler's HTML5 path, plus capture/playback diagnostics, so Playwright can verify the real path.
6. Replace the outdated Gemini preservation expectation with explicit absence assertions and remove the two leftover canonical snapshots. Do not touch manifest routing or historical specs.

## Rejected Alternatives

- **Creating a second `AudioContext` or analyser for HTML5 cues**: duplicates the shared system and breaks the "one analyser" contract.
- **Playing a muted clone in parallel for analysis**: is a second playback path, doubles media work and can drift from the audible cue.
- **Routing `html5` elements through Howler's `masterGain`**: applies global volume twice and changes the audible mix.
- **Deleting the retirement checks**: would weaken genuine protections; the retirement state is asserted more precisely instead.

## Verification

- Focused Vitest suites; full Vitest suite; `tsc --noEmit`.
- `node scripts/test-refresh-docs.js`.
- Chromium: Web Audio baseline, HTML5-only cue measurement, media-capture-disabled fallback.
- Production build measurement against the 495 MiB cap.
