# Tasks: Playwright Workspace Hardening

**Input**: `specs/149-playwright-workspace-hardening/` · **Prerequisites**: `plan.md`, `spec.md`

## Phase 1 — Setup

- [X] T001 Confirm the three defects against the current sources in `scripts/playwright-cli.sh` and `playwright.config.ts`, recording exact line numbers.

## Phase 2 — Foundational

- [X] T002 Record the current cold-start and warm-start timings in `artifacts/playwright-verification/` so the hardening can be compared afterwards.

## Phase 3 — User Story 1 (P1): wrapper works without pnpm on PATH

- [X] T003 [US1] Move `source scripts/bootstrap-pnpm.sh` above the `node_modules/.bin/playwright` guard in `scripts/playwright-cli.sh`, keeping the frozen install conditional.
- [X] T004 [US1] Add a guard test in `__tests__/playwright-cli-wrapper.test.js` asserting the bootstrap precedes the dependency guard.
- [X] T005 [US1] Prove the fix with `env -i HOME=$HOME PATH=/usr/local/bin:/usr/bin:/bin ./scripts/playwright-cli.sh --raw list`.

## Phase 4 — User Story 2 (P1): pinned-revision browser gate

- [X] T006 [US2] Replace the `compgen -G "$HOME/.cache/ms-playwright/chromium-*"` check in `scripts/playwright-cli.sh` with `setup-chromium-libs.sh --browser-root`.
- [X] T007 [US2] Add a guard test in `__tests__/playwright-cli-wrapper.test.js` asserting the browser step delegates to `--browser-root` and no longer uses the revision-agnostic glob.
- [X] T008 [US2] Prove the gate by running the wrapper against a browser root that holds only a foreign revision and confirming Chromium 1248 is installed before launch.

## Phase 5 — User Story 3 (P2): stale inherited fontconfig

- [X] T009 [US3] Require `fs.existsSync` before trusting an inherited `FONTCONFIG_FILE`/`FONTCONFIG_PATH` in `playwright.config.ts`.
- [X] T010 [US3] Add `__tests__/playwright-config-fontconfig.test.js` covering the stale-inherited and valid-inherited cases against a temporary prefix fixture.

## Phase 6 — Polish and verification

- [X] T011 Confirm the wrapper contract is unchanged: `--dry-run open`, `--dry-run test`, explicit `--browser=firefox`.
- [X] T012 Run the live documented workflow (`open https://luckypickcanada.ca`, full-page screenshot) and record the result.
- [X] T013 Run `./freebuff-verify.sh`, the focused vitest files and the type check.
- [X] T014 Measure the production build size and confirm it stays strictly below 495 MiB.
- [X] T015 Update `memory-bank/activeContext.md` and `memory-bank/progress.md` with the verified outcome.
