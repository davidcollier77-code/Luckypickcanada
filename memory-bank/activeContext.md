# Active Context — Development-Only Crystal Ball Date Preview

- **Updated:** 2026-11-12
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** `freebuff/3625a98e3b6b0eab9e6a60b2-date-preview`
- **Base:** `freebuff/3625a98e3b6b0eab9e6a60b2` (PR #1842, stacked)
- **Spec Kit feature:** `specs/143-crystal-ball-date-preview`
- **Pull request:** pending submission

## Current Task

Add a development-only way to preview the Crystal Ball on any local date so every seasonal window
can be reviewed without changing the system clock, while leaving `/crystal-ball` unchanged.

## Implementation

- Added `app/lib/crystal-ball-preview.js` for production gating, date/time validation, one local
  preview moment, URL building, date shifting, page-state usage and 29 occasion presets.
- Added `/crystal-ball/preview`, which calls `notFound()` when `NODE_ENV === 'production'`.
- Added the preview client and controls: native date and time inputs, occasion presets (Canada Day
  build-up and day, Remembrance Day, Truth and Reconciliation, Christmas stages, Boxing Day, New
  Year stages), time-of-day shortcuts and reset.
- Preview fortunes and follow-ups live only in page state; the real daily-usage key is never read or
  written by the preview.
- `CrystalBall` gained optional `previewActive`, `previewDateKey` and `previewNow` props. Existing
  callers pass none, so `/crystal-ball` behaviour, artwork, CSS and animations are unchanged.

## Verification

- **PASS:** preview model — 11 tests; preview client render — 1 test; full suite — 62 files,
  591 tests.
- **PASS:** `./freebuff-verify.sh` with `SPEC_KIT_BASE_REF=freebuff/3625a98e3b6b0eab9e6a60b2` —
  exit 0, including the Spec Kit gate, governance tests, type check, build and 36/36 docs tests.
- **PASS:** production build 454,105,614 B = 433.07 MiB, below 495 MiB; OpenNext produced
  `.open-next/worker.js`.
- **PASS:** production `/crystal-ball` is 200 with no preview markup; production preview route is
  404; development preview route is 200.
- **BLOCKED:** local Playwright launch (`libnspr4.so`), so no browser visual run for the development
  route. The preview client was mounted and exercised in Vitest instead.

## Handoff

PR submission follows `PR_SUBMISSION.md` and targets the parent feature branch because the preview
depends on the calendar module introduced by PR #1842. Evidence is in
`specs/143-crystal-ball-date-preview/evidence.md`.
