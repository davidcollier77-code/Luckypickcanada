# Implementation Plan: Crystal Ball Experience Improvements and Performance Optimization

**Branch**: `freebuff/262545961f9e30358501fc70` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/134-crystal-ball-experience-improvements/spec.md`

## Summary

Improve the existing `/crystal-ball` experience without redesigning it: add a fourth greeting and a dedicated daily greeting selector that never repeats the previous day, type it above the title with the existing `GoldenLeaf` cursor, replace the always-visible follow-up form with a button that opens a crafted gold/glass panel, and render the follow-up answer with the same leaf-typing treatment. Then reduce loading cost: compress the three Crystal Ball WAVs to small MP3s with WAV fallback, defer their download until interaction intent, cache audio assets immutably, give the artwork high fetch priority, and memoize the reading words so a typing tick does not re-render every character.

## Technical Context

**Language/Version**: TypeScript/JavaScript, Next.js 16.4.3 App Router, React 19.3.1 (repository-declared stack)

**Primary Dependencies**: Existing Howler, React and CSS Modules only. No dependency changes.

**Storage**: Existing `localStorage` daily-usage key stays byte-for-byte compatible. A new greeting key stores `{ date, index }`; an in-memory fallback covers blocked storage.

**Testing**: Vitest for greeting selection rules, audio asset existence/compression and audio source order; Playwright for the daily fortune, follow-up panel/answer flow and artwork delivery; `./freebuff-verify.sh`; measured production build.

**Target Platform**: Cloudflare Pages/Workers through OpenNext; modern browsers with `localStorage`, `Intl` and native audio.

**Project Type**: Web application (Next.js App Router, single project).

**Performance Goals**: Remove the roughly 900 KB of eagerly preloaded WAV audio from the initial `/crystal-ball` payload (replaced by ~100–150 KB compressed audio fetched on intent), memoize per-word rendering, and keep the same artwork bytes/dimensions and animation frames.

**Constraints**: Preserve the Crystal Ball artwork, dimensions, colours, glow, motion, sound design and the AVIF→WebP→PNG picture order; keep the 495 MiB build cap; do not touch Stripe, gift email, database, auth, hosting or the Lucky Generator.

**Scale/Scope**: One route (`/crystal-ball`), one client component, one CSS module, one audio helper, one small new greeting module and its tests; one `next.config.mjs` cache-header addition.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Single source of truth**: `AGENTS.md` remains authoritative; these artifacts only record this task.
- **Verify before acting**: Existing component, usage module, audio helper, tests and assets were inspected; a production build and browser measurement were captured before edits.
- **Sequence**: Specify → Plan → Tasks → Implement recorded in this directory.
- **Protect core systems**: No payment, email, database, auth, hosting, secret or unrelated page change. The audio source, cache header and artwork priority changes are the task's explicit performance scope.
- **Resource conservation**: `.docs/` stays read-only; no new runtime dependency or service.

**Result**: PASS. No unjustified violation.

## Project Structure

### Documentation (this feature)

```text
specs/134-crystal-ball-experience-improvements/
├── spec.md
├── plan.md
├── tasks.md
├── perf-measure.mjs            # repeatable desktop + mobile measurement harness
├── perf-baseline.json          # before-change evidence
└── perf-after.json             # after-change evidence
```

### Source Code (repository root)

```text
app/
├── components/CrystalBall/CrystalBall.tsx       # greeting placement/typing, follow-up panel, memoized reading
├── components/CrystalBall/CrystalBall.module.css # greeting + panel styling
├── crystal-ball-client/CrystalBallClient.js     # unchanged daily-usage wiring (no storage schema change)
├── crystal-ball-client/greetings.js             # new: four greetings + daily no-consecutive-repeat selection
├── crystal-ball-client/daily-usage.js           # unchanged
└── lib/audio.js                                 # compressed-first Crystal Ball sources + intent preload

public/sounds/
├── crystal-ball-energy.mp3 / .wav               # compressed primary + original fallback
├── crystal-ball-reveal.mp3 / .wav
└── crystal-ball-leaf.mp3 / .wav

next.config.mjs                                  # immutable caching for audio assets
tests/visual/crystal-ball*.spec.ts               # follow-up panel + artwork + greeting coverage
__tests__/crystal-ball-greetings.test.js         # greeting selection rules
__tests__/crystal-ball-audio-assets.test.js      # compressed variants and source order
```

**Structure Decision**: Keep the existing component and route. Add one small pure greeting module so the daily rule is testable without a browser, and reuse the existing `GoldenLeaf` component for both greeting and answer cursors.

## Phase 0: Research

- Confirmed from source and git history that the Crystal Ball has no separate Canadian quote; the quote collections live in `components/LuckyGenerator.tsx` and `components/DailyResonance.tsx` and must not be touched.
- Audio: the three WAVs are linear PCM (692 KB / 141 KB / 90 KB) and are eagerly decoded on mount. MP3 with the existing Howler dependency keeps the same playback API and supports a WAV fallback.
- Rendering: the fortune reveal re-renders every character span on each tick; memoizing words limits each tick to the affected word.
- Images: the pedestal already ships AVIF first at 716w/420w with WebP and PNG fallbacks; only loading priority changes (no re-encode, no dimension change).
- Measurement: Playwright with a cold cache and throttled network provides comparable desktop and mobile snapshots for transfer bytes, LCP, CLS, DOM nodes and timing.

## Phase 1: Design

- `greetings.js` exposes `GREETINGS`, `GREETING_STORAGE_KEY` and `readDailyGreeting(storage, dateKey, random)`; a new day chooses uniformly from the three greetings whose index differs from the previous record's index.
- `CrystalBall.tsx` keeps the daily-usage props untouched. It adds greeting typing state, a `followUpStage` state (`hidden | button | panel`), answer typing state and a memoized `ReadingText` used by the fortune and the answer.
- The follow-up panel is a labelled `textarea` (6 rows, 120-character limit) with a live character count, gold submit and a subtle dismiss control; the native keyboard is used and blurred on submit.
- `audio.js` keeps the same public functions; it starts the Crystal Ball preload only on interaction intent, and the WAV remains the fallback source.
- No data-model document is needed beyond the greeting record above; the daily-usage model is unchanged.

## Complexity Tracking

No constitution violations. No new dependency, service, database or server-side storage.
