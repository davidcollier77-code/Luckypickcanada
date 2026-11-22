# Tasks: Cold-workspace-safe Freebuff startup command

**Input**: Design documents from `/specs/209-cold-startup-browser-install-order/`

**Prerequisites**: plan.md, spec.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Diagnosis

- [X] T001 Read `scripts/setup-chromium-libs.sh`, `scripts/setup-playwright-agent.sh` and `scripts/bootstrap-pnpm.sh` to establish what `--check`, `--check-libs`, `--install-browser`, `--env`, `--persist` and `--probe-browser` each validate, and which of them need a browser to exist.
- [X] T002 Trace the documented order on a cold workspace and confirm the abort: `--check` fails with no browser, the no-argument provisioning path ends by repeating `check`, and `&&` stops the chain before the install.
- [X] T003 Reproduce it for real: run the documented command in this workspace with no `node_modules`, no `~/.cache/ms-playwright` and no `~/.local/chromium-libs`. Log: step 1 fails first (see T004), so the cold proof was re-run from step 2.

## Phase 2: Implementation (US1 — cold workspace startup)

- [X] T004 Record the pre-existing `verify-startup.sh` / `AGENTS.md` drift that blocks step 1 at HEAD `859bec46`, and leave both protected files unchanged; report it for owner authorization.
- [X] T005 Move `bash scripts/setup-playwright-agent.sh --install-browser` ahead of `(bash scripts/setup-chromium-libs.sh --check >/dev/null 2>&1 || bash scripts/setup-chromium-libs.sh)` in the documented command in `README.md`, keeping `eval "$(bash scripts/setup-chromium-libs.sh --env)"`, `bash scripts/setup-chromium-libs.sh --persist` and the trailing `--probe-browser` in place.
- [X] T006 Rewrite the README numbered steps 5–9 to match the new order and to explain why the install precedes the strict check.

## Phase 3: Implementation (US2 — documentation and test cannot drift)

- [X] T007 Update `EXPECTED_STARTUP_COMMAND` in `__tests__/freebuff-startup-command.test.js` to the reordered string.
- [X] T008 Replace the ordering assertion with install → check → provision → env → persist → probe in `__tests__/freebuff-startup-command.test.js`.
- [X] T009 Update the executed fixtures: the `setup-playwright-agent.sh` stand-in is called twice and must append, and the probe log must show `--install-browser` with the outer exports unset before `--probe-browser` with them applied.

## Phase 4: Verification

- [X] T010 Run `pnpm exec vitest run __tests__/freebuff-startup-command.test.js` and confirm every assertion passes.
- [X] T011 Run the reordered command on the cold workspace and confirm it reaches `PASS: Chromium launched and rendered a probe page`.
- [X] T012 Run the reordered command a second time on the provisioned workspace and confirm the browser download and the library provisioning are skipped.
- [X] T013 Run `./freebuff-verify.sh` and measure the production build against the 495 MiB limit.
- [X] T014 Review the complete diff for unrelated changes, secrets, protected files and scope.

---

## Dependencies & Execution Order

- Phase 1 must finish before Phase 2: the remedy depends on what each flag validates.
- T005 → T007, T008, T009: the test pins the documented string, so documentation changes first.
- T010 → T011 → T012: the suite runs before the expensive cold proof, so a logic error is caught cheaply.
- T013 → T014: the repository gate runs after the local checks, before the diff review.

## Notes

- No script changed. `setup-playwright-agent.sh` is simply called twice, which is safe because it applies `--env`
  to its own process and skips the download when `--browser-root` reports the pinned revision.
- `AGENTS.md`, `scripts/verify-startup.sh` and `freebuff-verify.sh` are protected and were not modified.
