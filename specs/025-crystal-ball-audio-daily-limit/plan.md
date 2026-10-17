# Implementation Plan: Crystal Ball Audio and Daily Question Limit

**Branch**: feat/crystal-ball-audio-daily-limit  
**Date**: 2026-10-17  
**Spec**: specs/025-crystal-ball-audio-daily-limit/spec.md

## Summary

Replace the three borrowed Crystal Ball audio cues with newly sourced, licensed same-origin WAVs while preserving the reveal behavior. The same active feature also enforces a daily allowance of three successful AI-backed answers per client IP. Reuse the current Howler helper and Oracle route, reserve quota before provider calls, show remaining usage, and release reservations on provider failures. A prior follow-up in this feature repaired the syntax regression that removed the separate stopCrystalBallEnergy export and blocked production compilation.

## Technical Context

- Language: JavaScript and TypeScript on Node.js 22.x.
- Dependencies already installed: Howler.js ^2.2.4; asset preparation uses the runner's curl and FFmpeg CLI only (no app dependency), @upstash/redis ^1.38.3, Next.js 16.3.8, React, Vitest ^5.0.0, Playwright ^1.63.0.
- Storage: Upstash Redis when configured; existing Cloudflare KV as durable fallback; process memory only for local development/tests.
- Tests: Vitest, Playwright, TypeScript check, repository governance verification, production build, and build-size measurement.
- Platform: Next.js App Router deployed on Cloudflare Workers/OpenNext.
- Constraints: Preserve original art, reveal order, repeat questions within quota, accessibility/reduced-motion, existing rate limiter, security filters, package set, and the hard 495 MB build cap.
- Scope: Crystal Ball audio helper/component, Oracle route/client, direct tests, Spec Kit artifacts, Memory Bank, and canonical PR summary.

## Constitution Check

- AGENTS.md remains the authority; one task group is selected: audio.
- Existing files, assets, dependencies, bindings, tests, and history were inspected before implementation.
- No payment, authentication, Neon schema, secret, or deployment-configuration change is planned.
- Context7 was not invoked because repository policy requires explicit permission for every call.
- Local shell verification is blocked because this runtime cannot resolve github.com. Remote PR checks are required before approval.
- Build size is not measured yet; do not merge unless the measured output remains strictly below 495 MB.

## Design

1. Preload newly sourced same-origin WAVs through Howler. Start the quiet energy sound from visitor activation; fade or stop it on success, failure, or unmount. Request reveal and leaf cues at their matching visual phases. Keep stopCrystalBallEnergy as a distinct exported function, and preserve the captured sound ID used by the delayed fade-stop callback.
2. Store a UTC-day key and one-way hash of client IP, with completed and pending counts. Redis Lua operations reserve slots atomically, commit completed AI answers, and release unsuccessful attempts.
3. Provide uncached GET status and include quota state with successful answers and limit responses. Client state is only informative; POST enforcement remains server-side.
4. Use the existing Cloudflare KV binding as persistent fallback. KV does not offer cross-isolate compare-and-swap, so globally atomic concurrency requires the configured Redis path.
5. Do not introduce a database table, dependency, external audio host, or unrelated refactor.

## Verification Plan

- Run quota unit tests for three-slot admission, fourth-slot denial, rollback, different IPs, and UTC reset.
- Run the audio export smoke test and both Crystal Ball Playwright specs on configured desktop/mobile projects.
- Run pnpm test, pnpm tsc --noEmit, pnpm build, and ./jules-verify.sh.
- Measure .next plus public against the 495 MB hard cap.
- Inspect the final diff and workflow checks. Do not report a command as passed unless its output is available. Run verification on the repair candidate, not only the earlier pre-regression revision.

## Follow-up regression repair — timeout callback closure (2026-10-17)

The post-merge build identified a missing `setTimeout` callback closure in `stopCrystalBallEnergy`. Restore `}, 160);` before the existing `else` branch and remove the duplicate stop call inside the ID-equality guard. Keep the captured-ID race protection and keep the repair confined to the existing audio helper. Verify on the PR candidate using the existing unit-test/import coverage and OpenNext/Cloudflare build checks. Local shell checks, the repository governance verifier, build-size measurement, and physical mobile playback remain unverified until evidence is available.


## Newly sourced sound assets — 2026-10-17

- Energy bed: “Holy Aura Resonance – Magical Energy Loop” by Coghezzi, listed as 16 seconds on Pixabay.
- Reveal cue: “Elemental Magic Spell Impact Outgoing” by RescopicSound, listed as 3 seconds on Pixabay.
- Leaf cue: “Sound Effect: Twinkle/Sparkle” by ShidenBeatsMusic, listed as 2 seconds on Pixabay.
- Source pages and direct file URLs are recorded in `public/sounds/crystal-ball-audio-sources.md`.
- Acquire by `curl -L --fail` in a one-run GitHub Actions workflow without API credentials. Convert downloaded MP3 source files to mono 22,050 Hz / 16-bit PCM WAV using FFmpeg; do not store source MP3 files in the repository.
- Validate WAV container headers, non-silent samples, expected durations, and file sizes before committing. Audio runtime uses only same-origin WAV URLs. The 495 MiB build cap remains hard.
