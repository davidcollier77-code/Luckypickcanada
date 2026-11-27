# Tasks: Major-Scoped Undici Security Overrides

**Input**: `specs/224-undici-major-scoped-security-fix/spec.md` and `plan.md`
**Prerequisites**: Current `package.json`, `pnpm-lock.yaml`, both affected Vitest guards, `AGENTS.md`, `PR_SUBMISSION.md`, applicable `.freebuff/` groups, and the Spec Kit templates.
**Tests**: The dedicated Undici guard, the dependency-management guard, the repository verification script, the OpenNext build, the Wrangler build and the updater-scheduler dry-run.

## Phase 1 — Investigation and Specification

- [X] T001 Audit the current `pnpm.overrides` and lockfile graph; record every Undici consumer and its declared range in `specs/224-undici-major-scoped-security-fix/research.md`.
- [X] T002 Confirm the patched per-major releases, the affected 8.12.2/8.12.3 versions, the advisory-feed limitation, and the pnpm 10 major-selector precedent.
- [X] T003 Inspect both affected test files and confirm `__tests__/visual-qa-chromium-cache.test.js` uses a synthetic fixture that does not need updating.
- [X] T004 Create the Spec 224 specification, research and plan, and update `.specify/feature.json` to `specs/224-undici-major-scoped-security-fix`.

## Phase 2 — Dependency and Guard Implementation

- [X] T005 [US1] Replace the bare `undici` override with `undici@6: 6.29.1`, `undici@7: 7.30.2` and `undici@8: 8.13.1` in `package.json`.
- [X] T006 [US1] Regenerate `pnpm-lock.yaml` with `pnpm install --lockfile-only`, then install with `pnpm install --frozen-lockfile`.
- [X] T007 [US1] Inspect the lockfile's top-level `overrides:` block and every Undici snapshot/edge; confirm 6.29.1, 7.30.2 and 8.13.1 only, with no 8.12.2.
- [X] T008 [P] [US2] Rewrite `__tests__/undici-security-override.test.js` for the three major-scoped overrides, the absent bare pin, the exact lockfile versions and the absence of below-floor releases.
- [X] T009 [P] [US2] Update `__tests__/dependency-management.test.js` for the new override keys and the absent bare pin.
- [X] T010 [US1] Run `pnpm why undici` and record each consumer's resolved major.

## Phase 3 — Verification

- [X] T011 [P] Run `pnpm vitest run __tests__/undici-security-override.test.js __tests__/dependency-management.test.js` and record the result.
- [X] T012 [P] Run `pnpm vitest run __tests__/visual-qa-chromium-cache.test.js` to confirm the unchanged synthetic fixture still passes.
- [X] T013 Run `SPEC_KIT_BASE_REF=8a18c44583192e2f32e801c81c44c6f1311e71d7 ./freebuff-verify.sh`; record the frozen install, Spec Kit, Python, TypeScript, Vitest, docs, build and size results.
- [X] T014 Run `pnpm exec opennextjs-cloudflare build` and record the Worker/asset build result.
- [X] T015 Run `pnpm exec wrangler build --config ./wrangler.jsonc` and record the exact 7.30.2 consumer result.
- [X] T016 Run the updater-scheduler `deploy --dry-run` and record the result without deploying.
- [X] T017 Measure the clean production build output and confirm it is strictly below 495 MiB.
- [X] T018 Review the complete diff for unrelated changes, preserved configuration and accurate verification claims.

## Phase 4 — Records and Delivery

- [X] T019 Update `memory-bank/activeContext.md`, `memory-bank/techContext.md` and `memory-bank/progress.md` with the verified dependency change.
- [X] T020 Commit the 12-path change set with the required repository commit footer.
- [X] T021 Push `freebuff/b7618803c1c98fa008653cb9-undici` and open one regular, non-draft PR against `main`.
- [X] T022 Inspect the PR receipt and report the final SHA, the verification results and any pending checks. Do not merge or deploy.

## Verification Results

- `pnpm why undici`: dotenvx 6.29.1; Wrangler/Miniflare/workers-utils 7.30.2; jsdom 8.13.1. No 8.12.2.
- Focused guards: 3 files / 50 tests passed.
- Full `./freebuff-verify.sh`: 520 Python tests passed, 113 Vitest files / 1,270 tests passed, TypeScript and Next.js build passed, size 485,572,608 bytes (463.08 MiB) below 495 MiB.
- OpenNext 1.20.18 build passed; Wrangler 4.166.0 build passed; updater-scheduler dry-run passed; updater Node tests 17/17 passed.
- Playwright/Visual QA: not run locally; PR-triggered checks pending.

## Owner-directed review repair (post-submission)

- **Graphite finding 1 — valid, applied.** The direct regression assertion matched only `8.12.0`–`8.12.3`, so a return of `8.12.4`/`8.12.5` would not be caught by that line. Broadened to `8\.12\.\d+`, which still permits every patched floor and now rejects any 8.12.x. A synthetic-string check confirmed all of `8.12.2`, `8.12.3`, `8.12.4`, `8.12.5` and `8.12.99` match while `6.29.1`, `7.30.2` and `8.13.1` do not.
- **Graphite finding 2 — valid, applied (smaller fix than proposed).** `uniqueSorted` used the default lexicographic sort. The reported spurious-failure mode cannot occur because both compared arrays use the same comparator, but the helper's ordering was still wrong for versions. It now reuses the existing `compareVersions`; no duplicate comparator was added. Verified order: `2.1.0`, `8.9.0`, `8.13.1`, `10.0.0`.
- **Re-verification:** focused guards `3 files / 50 tests` passed after the repair. The manifest, lockfile, override values and all 12 declared paths are unchanged by the repair.

## Dependencies & Execution Order

- T001–T004 are complete and block the implementation.
- T005 must precede T006 and T007.
- T006 must precede T008–T017, because the guards and builds consume the regenerated graph.
- T008 and T009 can run in parallel after T006; both must pass before T020.
- T010–T017 can run after T006; the build checks should use the same installed graph.
- T018 and T019 follow the verified results.
- T020–T022 follow the final diff review.

## Verification Boundary

- The requested patched floors are 6.29.1, 7.30.2 and 8.13.1. The 6.x and 7.x consumers must not be forced to 8.x.
- `pnpm audit` is not an acceptance signal; its advisory feed may not include the 2026-11-05 releases.
- PR-triggered checks are not local results. Report them as PENDING after PR creation.
- No merge, deployment, secret change or Cloudflare setting change is part of this task.
