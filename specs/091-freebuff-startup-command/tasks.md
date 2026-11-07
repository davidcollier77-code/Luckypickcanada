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

- [x] T038 [US1] Refresh only the stale desktop homepage screenshot from the deterministic current-branch capture; leave mobile snapshots unchanged and keep `maxDiffPixelRatio: 0.007`.
- [x] T039 [US1] Remove the unsupported bare `priority` attribute from the Lucky Map native `<img>`, preserving `loading="eager"`, `fetchPriority="high"`, and all AVIF/WebP/PNG sources.
- [x] T040 [US1] Add `__tests__/lucky-map-image-loading.test.js` to guard the image source order, fallbacks, eager/high priority, and absence of the invalid native attribute.
- [ ] T041 Run focused Lucky Map image guard and the full Vitest suite; run `pnpm exec tsc --noEmit`.
- [ ] T042 Run `./freebuff-verify.sh`, full Playwright Visual QA, and updater verification; retain the 495 MB hard cap and inspect all final screenshots/diffs.
- [ ] T043 Audit the final diff, update the canonical PR summary with exact CI outcomes, and leave PR #1711 open and unmerged.

## Phase 10: Final review-driven verification gate repair

- [x] T044 [US1] Add isolated bootstrap regression coverage in `__tests__/bootstrap-pnpm.test.js` for manifest-derived version pins, same-shell PATH availability, idempotent repeated sourcing, sourced/direct failures, installer failures, and cleanup of temporary shell helpers.
- [x] T045 [US1] Repair `scripts/bootstrap-pnpm.sh` so all temporary state is function-local, no helper function or status variable leaks into a sourced caller, only a validated absolute pnpm directory is prepended, and repeated sourcing does not duplicate PATH entries.
- [x] T046 [US1] Repair `freebuff-verify.sh` so TypeScript, build, and refresh-docs checks each execute once and every failure stops the gate with a clear non-zero result.
- [x] T047 [US1] Add `__tests__/freebuff-verify.test.js` and strengthen `__tests__/dependency-management.test.js` with exact-key, quoted-scalar, malformed-block, descriptive-input-read, and explicit failure-branch exit regression coverage.
- [ ] T048 Run focused Vitest tests, full `pnpm exec vitest run`, `pnpm exec tsc --noEmit`, Bash syntax checks, and the repository's documented isolated bootstrap smoke tests on the final head.
- [ ] T049 Run `./freebuff-verify.sh`, inspect the production build-size measurement against the 495 MiB hard maximum, and confirm the frozen lockfile remains unchanged.
- [ ] T050 Verify current-head full Playwright Visual QA and updater-scheduler workflows, including the three homepage viewport baselines and all required updater checks.
- [ ] T051 Audit the complete final diff, confirm all reviewer findings are resolved or explicitly classified, update the canonical PR summary with observed outcomes, and leave PR #1711 open and unmerged.

## Phase 11: Startup-command execution audit (2026-11-07)

- [x] T052 [US1] Inspect `package.json` (`packageManager: pnpm@10.30.3`), `pnpm-lock.yaml` (`lockfileVersion 9.0`) and `scripts/bootstrap-pnpm.sh`; record that the bootstrap exports PATH and is written in Bash.
- [x] T053 [US1] Establish the Freebuff execution shell from the runtime: `SHELL=/bin/bash`, login shell `/bin/bash`, GNU Bash 5.2.21; `/bin/sh` is `dash` with no `source` builtin.
- [x] T054 [US1] Add `artifacts/freebuff-startup-audit/probe.sh`: portable, reproducible probe that runs each candidate command under a controlled `HOME`/`PATH` and installs the pin from the registry in fresh homes.
- [x] T055 [US1] Demonstrate the current command's PATH loss: fresh `$HOME`, no `$HOME/.local/bin` on PATH → bootstrap installs pnpm 10.30.3, then `pnpm: command not found`, exit 127.
- [x] T056 [US1] Demonstrate the proposed command works there (exit 0, frozen install, pnpm 10.30.3) and that it fails under `dash` (`source: not found`, exit 127); the POSIX `.` form also fails under `dash` because the script uses Bash syntax.
- [x] T057 [US1] Demonstrate the wrapped form `bash -c 'source … && …'` exits 0 in both a fresh home with no `.local/bin` on PATH and under an outer `dash`.
- [x] T058 [US1] Demonstrate that with a competing pnpm 10.30.0 first on PATH (self-management disabled) the current form installs with 10.30.0 while the sourced form uses the validated 10.30.3; record that a `.local/bin` entry already present later in PATH is not reordered (known limitation).
- [x] T059 [US1] Measure steady-state startup: current 4.38 s, proposed 4.40 s, wrapped 4.38 s; confirm `git diff -- package.json pnpm-lock.yaml` is empty after the probe.
- [x] T060 [US1] Ran `./freebuff-verify.sh` (exit 0), measured the production build at 350,557,463 B (334.32 MiB), audited the 8-file diff and published the canonical PR summary; PR #1758 stays open and unmerged.

## Phase 12: Startup-command documentation guard (2026-11-07)

- [x] T061 [US1] Document the single canonical startup command in `README.md` under *Freebuff Workspace Startup*, with the reason the wrapper is required and the two rejected forms.
- [x] T062 [P] [US1] Add `__tests__/freebuff-startup-command.test.js`: exactly one documented command, byte-equal to the tested form, and not either rejected form.
- [x] T063 [US1] Execute the documented command in an isolated fixture (stand-in bootstrap exporting a PATH directory, stand-in `pnpm` logging its arguments) under Bash and a POSIX `sh` with `pnpm` absent from `PATH`; require exit 0 and `install --frozen-lockfile`.
- [x] T064 [US1] Require the rejected `bash scripts/…` form to exit 127 with no pnpm invocation in that fixture, and the rejected `source …` form to fail under `sh` where `sh` lacks the builtin.
- [x] T065 [US1] Prove the guard fails on drift: temporarily replace the documented command with each rejected form and confirm the suite fails; restore the documented form.
- [x] T066 [US1] Ran the focused guard 6/6, the drift failure proof (4 tests fail on the rejected form), the related bootstrap/gate/dependency suites 17/17, and `./freebuff-verify.sh` exit 0 on the committed head; production build 334.32 MiB (< 495 MB); `package.json`/`pnpm-lock.yaml` unchanged. PR body updated; PR stays open and unmerged.
