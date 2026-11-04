# Tasks: Freebuff Startup Command and pnpm Dependency Management

**Input**: Design documents from `/specs/091-freebuff-startup-command/`

## Phase 1: Investigation (baseline, verified)

- [x] T001 Confirm worktree state: `git status --porcelain --untracked-files=all` is empty at `037395d8`; no `bun.lock` and no `specs/091-*` exist here, so the request's "pre-existing" untracked files were absent rather than overwritten.
- [x] T002 Confirm the package manager: `pnpm --version` → `10.30.3`; `pnpm install --frozen-lockfile` → exit 0, "Lockfile is up to date, resolution step is skipped"; `npm install -g pnpm@<v>` needs `--prefix "$HOME/.local"` in this image (`memory-bank/activeContext.md`).
- [x] T003 Confirm the verification gate's commands: `freebuff-verify.sh` ran `pnpm tsc --noEmit` (resolved TypeScript 5.9.3 only through pnpm's binary fallback) and never provisioned pnpm or dependencies.
- [x] T004 Confirm the React baseline: `package.json` had `react`/`react-dom` at `latest`; `pnpm-lock.yaml` importer recorded `specifier: latest`, `version: 19.3.1` for both; `pnpm list react react-dom --depth 0` → 19.3.1.
- [x] T005 Confirm the duplicate overrides: top-level `overrides.postcss ^8.5.10` plus `pnpm.overrides` (13 entries); the lockfile `overrides:` block listed only `pnpm.overrides` and no `postcss`, proving pnpm ignored the top-level list.
- [x] T006 Confirm Dependabot state: `.github/dependabot.yml` had only the weekly `github-actions` entry.
- [x] T007 Confirm merge gates: `.github/workflows/protected-files.yml` and `.github/CODEOWNERS` list `package.json` and `pnpm-lock.yaml` as protected, so the PR needs the owner's authorization at merge.
- [x] T008 Measure the lockfile regeneration risk: a full `pnpm install` rewrote ~30 curated peer ranges (`postcss ^8.5.26`→`^8.5.10`, `next >=16.4.3`→`>=16.4.1`) introduced by `a3f42c86`; recorded so only intended lockfile entries may change.

## Phase 2: Foundational

- [x] T009 [P] Create `scripts/bootstrap-pnpm.sh`: resolve the `packageManager` pin, accept a matching pnpm on PATH or in `$HOME/.local/bin`, otherwise install that exact version with `npm install -g pnpm@<pin> --prefix "$HOME/.local"`, export PATH, and fail closed on a missing pin, a failed install or a version mismatch.

## Phase 3: User Story 1 — fresh-workspace verification (P1)

- [x] T010 [US1] `freebuff-verify.sh`: source the bootstrap, then run `pnpm install --frozen-lockfile` as an explicit gate step that stops verification when the tree or lockfile is out of date.
- [x] T011 [US1] `freebuff-verify.sh`: `cd` to the repository root derived from the script path so the gate no longer depends on the caller's working directory.
- [x] T012 [US1] `freebuff-verify.sh`: replace `pnpm tsc --noEmit` with `pnpm exec tsc --noEmit`, an explicit call to the local compiler.
- [x] T013 [US1] Verify the bootstrap on a fresh identity: `HOME=<tmp> PATH` without pnpm installs 10.30.3 into `<tmp>/.local/bin` and runs it.
- [x] T014 [US1] Verify the bootstrap fails closed with an explanatory message when no `package.json`/pin is present.

## Phase 4: User Story 2 — weekly dependency updates (P1)

- [x] T015 [P] [US2] `.github/dependabot.yml`: add `package-ecosystem: npm`, `directory: /`, `schedule.interval: weekly` for the pnpm-managed JavaScript dependencies.
- [x] T016 [US2] Keep the existing `github-actions` weekly entry byte-identical.

## Phase 5: User Story 3 — exact React pins (P1)

- [x] T017 [P] [US3] `package.json`: `react`/`react-dom` `latest` → `19.3.1` (the version already installed and tested; no upgrade).
- [x] T018 [US3] `pnpm-lock.yaml`: record the importer specifiers as `19.3.1` for both packages, leaving every resolved version unchanged.

## Phase 6: User Story 4 — one applied overrides list (P2)

- [x] T019 [US4] `package.json`: remove the top-level `overrides` object and add its `postcss: ^8.5.10` entry to `pnpm.overrides`, keeping all 13 existing entries.
- [x] T020 [US4] `pnpm-lock.yaml`: record `postcss: ^8.5.10` in the `overrides:` block; restore the curated peer metadata that regeneration loosened.
- [x] T021 [P] [US4] Add `__tests__/dependency-management.test.js` so a second top-level `overrides` list, a React pin drift, a lockfile/pin disagreement, a changed pnpm pin or a lost Dependabot ecosystem fails the suite.

## Phase 7: Verification

- [x] T022 Focused guard: `pnpm exec vitest run __tests__/dependency-management.test.js`.
- [x] T023 Guard actually fails: reintroduce a top-level `overrides` list and `react: latest`, confirm the guard fails, then restore.
- [x] T024 Full suite: `pnpm exec vitest run`.
- [x] T025 Type check: `pnpm exec tsc --noEmit`.
- [x] T026 Repository gate + production build: `./freebuff-verify.sh` (includes the new bootstrap and frozen install).
- [x] T027 Build size against the 495 MB ceiling: measure `.next` + `public` and record the result.
- [x] T028 Dependency state: `pnpm list react react-dom --depth 0` and `pnpm install --frozen-lockfile` with no lockfile change.
- [x] T029 Final diff audit: only `package.json`, `pnpm-lock.yaml` (5 intended lines), `.github/dependabot.yml`, `freebuff-verify.sh`, `scripts/bootstrap-pnpm.sh`, `__tests__/dependency-management.test.js` and `specs/091-freebuff-startup-command/*`.
- [ ] T030 PR-head CI: PENDING (reported as pending, never as passing).

## Dependencies

- T009 blocks T010–T014 and T026.
- T015–T021 are independent of each other but all feed T021's guard.
- T022–T029 depend on T009–T021.
- T030 depends on the pushed branch.

## Phase 8: PR-head QA and bootstrap repair (follow-up)

- [x] T031 [US1] Repair the lockfile importer and Dependabot block parsers in `__tests__/dependency-management.test.js`; verify exact `react` and `react-dom` matches.
- [x] T032 [US1] Refactor `scripts/bootstrap-pnpm.sh` so sourced failures return to the caller and direct execution exits non-zero; stop every failure path before npm install.
- [x] T033 [US1] Add `__tests__/bootstrap-pnpm.test.js` for sourced failure, direct failure, and exact-version bootstrap in an isolated temporary HOME with a fake installer.
- [x] T034 [US1] Commit `freebuff-verify.sh` and `scripts/bootstrap-pnpm.sh` as executable files so QA and updater workflows can invoke them directly.
- [x] T035 Run the focused dependency/bootstrap tests, the full Vitest suite, and standalone TypeScript check.
- [x] T036 Run `./freebuff-verify.sh`, measure `.next + public` against the 495 MB ceiling, and confirm frozen-lockfile stability.
- [ ] T037 Verify current-head Visual QA and updater-scheduler workflow results; audit the full diff and update the PR summary with actual outcomes.
 
## Phase 9: Visual QA baseline and native image warning (follow-up)

- [ ] T038 [US1] Refresh only the stale desktop homepage screenshot from the deterministic current-branch capture; leave mobile snapshots unchanged and keep `maxDiffPixelRatio: 0.007`.
- [ ] T039 [US1] Remove the unsupported bare `priority` attribute from the Lucky Map native `<img>`, preserving `loading="eager"`, `fetchPriority="high"`, and all AVIF/WebP/PNG sources.
- [ ] T040 [US1] Add `__tests__/lucky-map-image-loading.test.js` to guard the image source order, fallbacks, eager/high priority, and absence of the invalid native attribute.
- [ ] T041 Run focused Lucky Map image guard and the full Vitest suite; run `pnpm exec tsc --noEmit`.
- [ ] T042 Run `./freebuff-verify.sh`, full Playwright Visual QA, and updater verification; retain the 495 MB hard cap and inspect all final screenshots/diffs.
- [ ] T043 Audit the final diff, update the canonical PR summary with exact CI outcomes, and leave PR #1711 open and unmerged.
