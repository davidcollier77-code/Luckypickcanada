# Implementation Plan: Development-Only Crystal Ball Date Preview

**Branch:** `freebuff/3625a98e3b6b0eab9e6a60b2-date-preview` | **Date:** 2026-11-12
**Spec:** [spec.md](./spec.md) | **Depends on:** PR #1842

## Summary

Add a dedicated `/crystal-ball/preview` route that is rendered only outside production. A pure
preview helper validates a local date/time from the URL and builds one local `Date`; the preview
client renders the existing `CrystalBall` with preview props, keeps readings in page state and
offers a compact control panel with date/time inputs, occasion presets and time-of-day shortcuts.
The normal `/crystal-ball` route is untouched.

## Technical Context

**Language/Version:** JavaScript/TypeScript, Next.js 16.4.3 App Router, React 19.3.1

**Dependencies:** Existing React/Next.js only. No dependency changes.

**Storage:** No storage in preview mode; the existing daily-usage key is never read or written by
the preview.

**Testing:** Vitest for preview parsing, URL building, date shifting and presets; type check,
production build, `./freebuff-verify.sh` with `SPEC_KIT_BASE_REF` set to the parent feature branch
(stacked PR); a live check that `/crystal-ball` is unchanged.

**Constraints:** No production preview surface, no `/crystal-ball` markup change, no artwork/CSS/
animation/audio change, no server route change, build below 495 MiB.

## Constitution Check

- **Single source of truth:** `AGENTS.md` remains authoritative.
- **Verify before acting:** `/crystal-ball`, `CrystalBall`, the shared clock, calendar, storage
  helpers and existing tests were read before editing.
- **Sequence:** Specify → Plan → Tasks → Implement recorded here.
- **Protect core systems:** No payment, email, database, auth, hosting, secret, workflow or
  deployment change.
- **Resource conservation:** `.docs/` stays read-only; no new dependency.

**Result:** PASS.

## Project Structure

```text
app/crystal-ball/preview/page.js              # dev-only route; 404 in production
app/crystal-ball-client/CrystalBallPreviewClient.js  # preview state, readings, controls
app/crystal-ball-client/CrystalBallPreviewControls.js # date/time form, presets
app/lib/crystal-ball-preview.js               # validation, local moment, URL and presets
app/components/CrystalBall/CrystalBall.tsx     # optional preview props only
__tests__/crystal-ball-preview.test.js         # pure preview behaviour
specs/143-crystal-ball-date-preview/
```

## Phase 0: Research

- The oracle already accepts `localDate`, `localTime` and `timeZone`; the preview can reuse the
  existing API contract with no server change.
- `getLocalMoment` and `parseCalendarDate` already validate local dates and construct local dates,
  so the preview only needs to compose them.
- Daily usage is browser-local and keyed by date; a separate page-state allowance avoids touching
  it.
- `CrystalBall` already accepts injected generators and initial state; adding three optional
  preview props preserves all existing callers.

## Phase 1: Design

- `crystal-ball-preview.js` exports `isPreviewEnabled`, `getPreviewFromLocation`, `buildPreviewUrl`,
  `shiftPreviewDateKey`, `getPreviewPresets`, `createPreviewMoment`, `createPreviewUsage` and a
  no-op `PREVIEW_STORAGE`.
- `previewDate` is validated with the calendar's date parser; `previewTime` with the local-time
  parser. A missing time uses the current local clock.
- The preview route calls `notFound()` when `NODE_ENV === 'production'`.
- `CrystalBallPreviewClient` reads the URL on mount, redirects to today's date/time when absent,
  and holds `usage` in state. It sends preview context to `/api/oracle` and never uses localStorage.
- `CrystalBallPreviewControls` is a fixed, compact development panel with a native date input, a
  native time input, an occasion selector, time-of-day shortcuts and a reset control.
- `CrystalBall` gains optional `previewActive`, `previewDateKey` and `previewNow` props. Its greeting
  reads a no-op storage and the supplied moment in preview; the reset line says the allowance is
  bypassed. Defaults preserve the existing page exactly.

## Complexity Tracking

No constitution violations. No dependency, service, database, schema, secret or production route
change.
