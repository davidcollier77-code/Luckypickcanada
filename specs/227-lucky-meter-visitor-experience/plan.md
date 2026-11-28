# Implementation Plan: Lucky Meter Visitor Experience — Cinematic Instrument

**Branch**: `227-lucky-meter-visitor-experience` | **Date**: 2026-11-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/227-lucky-meter-visitor-experience/spec.md`

## Summary

Rebuild the Lucky Meter's foreground as one deliberate three-dimensional instrument that matches the supplied READY and FINISHED references, then choreograph the existing reveal so the colour drains through a real spout into a crystal bowl and the Lucky Number later detaches as its own dimensional object and seats itself in an ornate plaque. Every timing anchor, selection rule, palette, daily limit, persistence path and the production background stay untouched.

## Technical Context

**Language/Version**: JavaScript / TypeScript on Next.js (Node 26 per `package.json` engines)

**Primary Dependencies**: Three.js via the shared creative runtime (`app/lib/graphics/runtime.js`), Howler through `app/lib/lucky-meter/audio.js`, existing CSS fallback. No new dependency.

**Storage**: Existing `lucky-pick-canada-lucky-meter-v1` localStorage payload, unchanged.

**Testing**: Vitest/`__tests__/*.test.js(x)` unit suites and Playwright `tests/visual/lucky-meter-daily-resonance.spec.ts`.

**Target Platform**: Mobile-first web (Cloudflare Pages), WebGL with CSS fallback.

**Project Type**: Web application (single Next.js app).

**Performance Goals**: One bounded render loop, per-frame work proportional to visible particles, idle stop after the finished beat, quality tiers unchanged.

**Constraints**: Build strictly below 495 MiB; no background-artwork change; no new audio files; no timing change to `storyboard.js`.

**Scale/Scope**: One route, one scene module, three components, one new pure module, test updates.

## Constitution Check

- Spec Kit order followed: specify → plan → tasks → implement.
- Protected files: `app/globals.css` is edited only for the approved composition; recorded in the PR declaration.
- No security, persistence, rate-limit or data-boundary change.
- Build budget unchanged; measured after implementation.

## Project Structure

### Documentation (this feature)

```text
specs/227-lucky-meter-visitor-experience/
├── spec.md
├── plan.md
├── research.md
├── quickstart.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code

```text
app/lib/lucky-meter/
├── meter-layout.js        # composition constants, plaque/bar/banner, number path + clearance
├── choreography.js        # NEW: pure light/particle/cue envelopes
├── meter-scene.js         # instrument geometry, cups, spout, bowl, plaque, number token
├── storyboard.js          # unchanged timing authority
└── event-audio.js         # two additive cues reusing shipped recordings

components/
├── DailyResonance.tsx     # composition, copy, dock chip, cue wiring
├── LuckyMeterStage.jsx    # portrait stage + DOM inlays (colour bar, plaque value)
└── LuckyMeterSkyWriting.tsx # gold script Spark with drawn ribbon

app/globals.css            # stage aspect, inlay styling, dock chip, Spark restyle
tests/visual/lucky-meter-daily-resonance.spec.ts
__tests__/lucky-meter-number-transfer.test.js
```

**Structure Decision**: Single Next.js app; all meter physics continues to live in `app/lib/lucky-meter`, and all DOM overlays continue to live in the existing two components so the fallback and test hooks are preserved.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Rewritten responsive layout assertions | The target composition places the plaque beside the bowl instead of below it | Keeping the old ordering would assert a layout the owner explicitly rejected |
| `app/globals.css` edit | Portrait stage aspect and the two inlays need CSS | Inline styles would bypass the existing design tokens and responsive rules |
