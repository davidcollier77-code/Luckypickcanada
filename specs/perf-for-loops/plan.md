# Implementation Plan: Preserve Canvas Rendering During Loop Optimization

**Branch**: `⚡-bolt-optimize-draw-branch-1847433249078896432` | **Spec**: [spec.md](./spec.md)

## Summary

The PR replaces callback-based iteration with indexed loops in high-frequency canvas paths. Review identified a malformed meteor-trail block and a missing `ctx.stroke()`. The repair removes the orphaned callback opening, iterates meteor points once in order, preserves per-point alpha decay, and strokes the completed path. The spark path uses a single indexed pass inside a `length > 1` guard and calls `ctx.stroke()`. The recursive `drawBranch` helper is defined once at the canvas-effect scope rather than recreated on every animation frame. Redundant meteor context setup is removed.

## Technical Context

- **Language/Version**: TypeScript, repository Node.js 22 runtime
- **Primary Dependencies**: Existing React, Next.js, canvas 2D API; no dependency changes
- **Storage**: N/A
- **Testing**: Existing Vitest suite, standalone TypeScript check, repository Spec Kit verification, Playwright visual regression, Next.js/OpenNext build checks
- **Target Platform**: Browser canvas; desktop and mobile browsers
- **Project Type**: Next.js App Router web application
- **Performance Goals**: Preserve existing frame behavior while avoiding callback iteration in the targeted hot paths; no target real-world FPS gain is claimed without browser profiling
- **Constraints**: No change to canvas artwork, line styles, color, timing, particle physics, layout, audio, or other functionality; build output must remain below 495 MiB
- **Scale/Scope**: One application source file; targeted to meteor/spark/rocket/lightning trail loops in `components/LuckyGenerator.tsx`

## Constitution Check

- **Single source of truth**: PASS — repository `AGENTS.md` remains authoritative.
- **Protected systems**: PASS — no payments, authentication, database, deployment, environment, or secrets are changed.
- **Visual preservation**: PASS — path order and stroke calls are restored; styling and animation behavior are preserved.
- **Testing and verification**: PENDING — full CI/visual/build outcomes must be observed on the final commit.

## Phase 0 — Research

No additional external research was necessary. The regression was verified by comparing the PR head with the base version of `components/LuckyGenerator.tsx` and tracing the path construction and stroke order.

## Phase 1 — Design

- Keep rendering repairs in `components/LuckyGenerator.tsx`; update only the directly related micro-benchmark and task memory, and remove temporary empty patch/test artifacts.
- Meteor trail: use an indexed loop, apply the existing `0.88` alpha decay once per point, then call `ctx.stroke()` before rendering the meteor core.
- Spark trail: retain the `sp.trail.length > 1` guard, indexed iteration, and one stroke call.
- Rocket and lightning paths: preserve their existing indexed loops and stroke calls.
- Benchmark both production draw passes (glow then fill) with mock canvas calls; report it only as a JavaScript path-building micro-benchmark, not browser FPS or PageSpeed evidence.
- Use existing repository unit, TypeScript, governance, Playwright, and build workflows. No dependency changes are needed.
