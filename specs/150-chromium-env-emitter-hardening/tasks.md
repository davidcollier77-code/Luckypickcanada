# Tasks: Chromium Environment Emitter Hardening

**Input**: `specs/150-chromium-env-emitter-hardening/` · **Prerequisites**: `plan.md`, `spec.md`

## Phase 1 — Setup

- [X] T001 Trace `--env` from `print_env` to both `eval` consumers and the `--persist` files; record which inputs reach
      the output (`HOME`, `CHROMIUM_LIBS_PREFIX`, `PLAYWRIGHT_BROWSERS_PATH`, `CHROMIUM_BROWSER_DIRS`) and that an
      inherited `LD_LIBRARY_PATH`/`FONTCONFIG_*` is never copied into it.
- [X] T002 Reproduce the injection with `$(…)`, backticks, `"` and `;` in a scratch directory, including a wrapper run
      and a login shell that sources the persisted profile.

## Phase 2 — Implementation

- [X] T003 [US1] Add `sh_squote` and emit every `--env` value as a single-quoted POSIX word.
- [X] T004 [US2] Keep the `LD_LIBRARY_PATH` dedupe by matching a quoted variable instead of an interpolated literal.
- [X] T005 [US3] Quote the path in the `~/.profile`/`~/.bashrc` source line that `--persist` writes.
- [X] T006 Record the invariant in `scripts/playwright-cli.sh` and `scripts/setup-playwright-agent.sh`.
- [X] T007 Update the one detection assertion that pinned the double-quoted `PLAYWRIGHT_BROWSERS_PATH` form.

## Phase 3 — Tests

- [X] T008 Add `__tests__/setup-chromium-env-shell-safety.test.js`: four hostile payloads across all four inputs,
      spaces, apostrophes, `sh`/`bash` parsing, idempotency, literal glob handling, and both `--persist` paths.

## Phase 4 — Verify

- [X] T009 `bash -n` on every script; `sh -n` on generated output and on the persisted `env.sh`.
- [X] T010 Focused vitest files: shell safety, runtime detection, wrapper contract.
- [X] T011 The repository gate steps (Spec Kit, type check, docs tests), the full unit suite and the production build
      size against the 495 MiB cap.
