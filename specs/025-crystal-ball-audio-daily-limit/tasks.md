# Tasks: Crystal Ball Audio and Daily Question Limit

## Phase 1 — Specify

- [x] T001 Define the user stories, audio moments, quota semantics, edge cases, and success criteria in specs/025-crystal-ball-audio-daily-limit/spec.md.
- [x] T002 Review the specification quality criteria in specs/025-crystal-ball-audio-daily-limit/checklists/requirements.md.

## Phase 2 — Plan and research

- [x] T003 Record verified findings and storage/audio decisions in specs/025-crystal-ball-audio-daily-limit/research.md.
- [x] T004 Document architecture, constraints, and verification plan in specs/025-crystal-ball-audio-daily-limit/plan.md.
- [x] T005 Define the quota entity in specs/025-crystal-ball-audio-daily-limit/data-model.md.
- [x] T006 Document API behavior and validation workflow in specs/025-crystal-ball-audio-daily-limit/contracts/oracle-quota.md and specs/025-crystal-ball-audio-daily-limit/quickstart.md.

## Phase 3 — User Story 1 (P1): Reveal audio

- [x] T007 Add Howler-backed preloading and phase-based sound helpers in app/lib/audio.js.
- [x] T008 Connect energy, reveal, and golden-leaf cues in app/components/CrystalBall/CrystalBall.tsx.
- [x] T009 Preserve styling and provide allowance messaging in app/components/CrystalBall/CrystalBall.module.css.

## Phase 4 — User Story 2 (P1): Daily quota

- [x] T010 Implement hashed daily keys, reservation, commit, release, and quota summary in app/lib/oracle-usage.js.
- [x] T011 Enforce the limit and expose uncached status in app/api/oracle/route.js.
- [x] T012 Refresh and display quota state in app/crystal-ball-client/CrystalBallClient.js.
- [x] T013 Add quota unit coverage in __tests__/oracle-usage.test.js.
- [x] T014 Extend tests/visual/crystal-ball-interactions.spec.ts with deterministic quota responses.
- [x] T015 Add three-answer UI coverage in tests/visual/crystal-ball-daily-limit.spec.ts.

## Phase 5 — Verify and report

- [x] T016 Add the pnpm run test step to .github/workflows/visual-qa.yml so unit tests are enforced on PRs.
- [x] T017 Run pnpm run test and record the actual result from Visual QA run 39015312979: 10 test files passed, 70 tests passed.
- [x] T018 Run pnpm exec playwright test through playwright.config.ts; Visual QA run 39015312979 completed with 21 passed, 3 skipped, and no failures.
- [x] T019 Verify pnpm run build, OpenNext Cloudflare build, and Wrangler build in .github/workflows/validate-open-next-repair.yml; all succeeded in run 39015313418, including the Next.js TypeScript stage.
- [ ] T020 Run pnpm tsc --noEmit and ./jules-verify.sh in a working repository shell; the standalone TypeScript command and governance verifier have not been executed in this session.
- [ ] T021 Measure .next plus public against the hard 495 MiB maximum and verify audio on a real mobile device. The protected validation workflow was not modified; size and physical playback remain unverified.
- [x] T022 Inspect current branch diff and reconcile its changed-file list with PR_SUMMARY.md; report all remaining verification gates honestly.

## Phase 6 — Production-build regression repair

- [x] T023 Restore the stopCrystalBallEnergy export and server-side guard in app/lib/audio.js, preserving the captured sound ID and closing the delayed fade-stop callback.
- [x] T024 Add __tests__/audio-exports.test.js to protect the separate audio helper export.
- [ ] T025 Run unit tests, standalone TypeScript, ./jules-verify.sh, the Next.js production build, OpenNext Cloudflare build, and no-deploy Wrangler validation on the repair candidate; record actual CI results.

## Dependencies and execution order

Specify → plan/research → implementation → automated tests/build → remaining governance/size/device gates. Keep the PR open until T020 and T021 have evidence.

## Parallel opportunities

Unit and Playwright testing can execute independently after dependency installation. Build, standalone TypeScript/governance verification, output-size measurement and real-device playback must be reported separately.
- [x] T026 Close the delayed `setTimeout` callback in `app/lib/audio.js` with the intended 160 ms fade-stop delay; preserve the captured-ID guard and immediate-stop fallback.


## Phase 7 — Replace borrowed Crystal Ball sounds with new sourced assets

- [x] T027 Verify the three Pixabay source listings, direct media URLs, durations, artist identities, and Content License; record provenance in public/sounds/crystal-ball-audio-sources.md.
- [x] T028 Download the licensed originals with free curl CLI commands without API keys; convert them with FFmpeg to same-origin WAVs and keep MP3 originals out of public/. Verified in preparation workflow run #1 on 2026-10-17.
- [x] T029 Switch CRYSTAL_BALL_SOUNDS to the three new WAV assets without changing reveal sequence or volume intent.
- [x] T030 Add automated checks for WAV headers, non-silent audio, size, and source/license provenance in __tests__/crystal-ball-audio-assets.test.js.
- [ ] T031 Run unit, Playwright, TypeScript, Spec Kit governance, production build, OpenNext/Wrangler validation, and the 495 MiB size check; report physical-device playback separately. Audio acquisition/integrity workflow succeeded; final PR validation remains pending.


## Follow-up — replace persistent IP quota with visitor-local daily limit (2026-10-17)

The server-side quota tasks above document the original implementation and its CI history. The active replacement is tracked in `specs/028-crystal-ball-browser-daily-limit/tasks.md`; do not interpret the completed historical tasks as instructions to restore server-side quota enforcement.
