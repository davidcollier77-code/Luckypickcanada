# Implementation Plan: Explore Your Luck Effect Repair

**Branch**: `018-explore-luck-effect-repair` | **Date**: 2026-10-13 | **Spec**: `.specify/features/018-explore-luck-effect-repair/spec.md`

## Summary

Restore visible golden maple-leaf particles and prevent late chime playback while leaving the working scroll behavior untouched. Use the leaf path from the repository's existing golden maple-leaf SVG with `canvas-confetti.shapeFromPath` and a fixed transform matrix. Preload the current Howler sound during component initialization so loaded audio can play immediately on activation.

## Technical Context

- **Language/Version**: JavaScript/TypeScript, Node.js 22.x.
- **Primary Dependencies**: Existing `canvas-confetti@^1.9.4`, `howler@^2.2.4`, React and Playwright; no new dependency.
- **Storage**: None.
- **Testing**: Existing Playwright visual suite and repository-mandated `./jules-verify.sh`.
- **Target Platform**: Next.js homepage on desktop and mobile browsers.
- **Project Type**: Web application.
- **Performance Goals**: Render the first particle in under 750 ms after activation; audio asset request begins before activation.
- **Constraints**: Preserve scroll behavior, accessibility, responsive layout, reduced-motion behavior and the 495 MB build cap. No payment, database, authentication, environment, deployment or design changes.
- **Scale/Scope**: Directly related component, audio helper and visual test, plus task-scoped Spec Kit and Memory Bank artifacts.

## Constitution Check

- Smallest scoped repair: PASS.
- Preserve behavior outside scope: PASS by design; only particle shape/count, audio preload/playback timing, tests and task artifacts are changed.
- User authorization: Explicitly granted for this repair.
- Tests before approval: Required; CI and user-facing browser result must be checked before marking complete.
- Context7: Not invoked; no authorization was given and repository-local documentation was consulted.
- Build size: Actual build size must be measured in required verification; stop if 495 MB is reached or exceeded.

## Research Decisions

See `research.md`. The current code constructs a bitmap custom shape without the transform matrix expected by the confetti bitmap renderer and delays the first burst until an image onload callback. The audio path creates Howler and requests the sound only after activation. The selected implementation uses a normalized path shape and preloads the sound before activation.

## Implementation Phases

1. **Repair particle shape**: Use the existing SVG path through `confetti.shapeFromPath`, with an explicit matrix; remove click-time image loading; retain a gold fallback.
2. **Repair audio timing**: Cache one Howler preload promise and play synchronously if already loaded; never queue late playback after the current transition.
3. **Regression test**: Extend Playwright coverage to assert rendered alpha pixels and that the sound request starts before activation; retain existing scroll/cooldown/keyboard assertions.
4. **Verify and report**: Run the Spec Kit gate and repository verification, inspect the final diff, check CI statuses and verify the real mobile interaction before marking success.

## Project Structure

- `app/homepage/ExploreLuckButton.js`
- `app/lib/audio.js`
- `tests/visual/homepage.spec.ts`
- `.specify/features/018-explore-luck-effect-repair/*`
- `memory-bank/activeContext.md`
- `memory-bank/progress.md`

## Complexity Tracking

No architectural expansion, new dependencies, persistence, API contracts or cross-feature refactoring.
