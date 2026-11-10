# Active Context — Crystal Ball Experience Improvements and Performance

- **Updated:** 2026-11-10
- **Repository:** davidcollier77-code/Luckypickcanada
- **Base branch:** main (base commit `f4128c15`)
- **Task branch:** freebuff/262545961f9e30358501fc70
- **Spec Kit feature:** specs/134-crystal-ball-experience-improvements

## Current Task

Improve the daily Crystal Ball experience — four daily greetings with no consecutive-day repeat, a polished follow-up panel/answer, preserved fortune and storage behaviour, no separate Canadian quote — and reduce its loading cost without reducing artwork, audio or animation quality.

## Verified Findings

- The Crystal Ball rendered no separate Canadian quote before this task; source and history were checked and the Luck Generator quote collections (`components/LuckyGenerator.tsx`, `components/DailyResonance.tsx`) are untouched.
- The three Crystal Ball WAVs (923,210 bytes total) were preloaded on mount, before the visitor showed any intent to generate.
- The fortune reveal re-rendered every character span on each typing tick.
- The artwork already ships AVIF first (716w/420w) with WebP and PNG fallbacks at 716×875; only fetch priority changed.

## Implementation

- New `app/crystal-ball-client/greetings.js`: four greetings, a separate greeting storage key, same-day reuse, and uniform selection among the three greetings that differ from the previous day's.
- `CrystalBall.tsx`/CSS: greeting moved above the title in a high-contrast panel and typed with the existing `GoldenLeaf` cursor; follow-up offered as a button after the reveal, opening a gold/glass panel with a roomy labelled textarea, character count, gold submit and dismiss; the answer types with the same leaf cursor; original fortune, question and answer remain visible.
- `app/lib/audio.js`: compressed MP3 first with the WAV as fallback; audio preparation now starts on interaction intent instead of page load.
- `next.config.mjs`: audio files join the existing immutable asset cache header.
- The fortune/answer reading now memoizes words so only the active word re-renders.
- Daily-usage storage and every allowance rule are unchanged.

## Verification Status

- **PASS:** `pnpm exec tsc --noEmit`.
- **PASS:** Focused Vitest — greetings, audio assets and daily usage (29 tests).
- **PASS:** Full Vitest — 57 files / 497 tests.
- **PASS:** Focused Playwright on desktop, mobile-390 and mobile-412 — Crystal Ball artwork, greeting, interactions and daily-limit specs (27 tests, after the assertion fix).
- **PASS:** `./freebuff-verify.sh` exit 0 (install, Spec Kit gate, verification-integrity tests, type check, build, docs tests: 36 passed).
- **PASS:** Production build 426,066,966 bytes (406.33 MiB) on the verify run; a clean build measured 335,899,824 bytes (320.34 MiB). Both are below the 495 MiB cap.
- **PASS:** Production page check — background art present, greeting above the title, AVIF artwork served, zero audio requests on load, no HTTP responses ≥ 400.
- **PASS:** Final diff audit (`git diff --check` clean; only the reported paths changed).
- **PENDING (post-submission):** the repository's external visual-regression and security workflows run after the PR is opened and are not claimed as local evidence.

## Next Action

Leave the task PR open and unmerged for owner review. Do not merge, deploy or enable auto-merge.
