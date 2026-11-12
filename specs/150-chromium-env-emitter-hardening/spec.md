# Feature Specification: Chromium Environment Emitter Hardening

**Feature Branch**: `freebuff/419f8aeeb3f6faf5ad52daa2`
**Created**: 2026-11-12
**Status**: Implemented

**Input**: Owner request, following a read-only investigation, to harden the environment text printed by
`scripts/setup-chromium-libs.sh --env` and every consumer of it, so no value can execute a command.

## Verified baseline (before this change)

- `print_env` interpolated `$LIB_PATH`, `$FONTS_CONF`, `$FONTS_DIR` and `browser_root()` straight into shell text that
  `scripts/playwright-cli.sh:91` evaluates, that `scripts/setup-playwright-agent.sh:52` evaluates, and that `--persist`
  writes to `$PREFIX/env.sh` and sources from `~/.profile`/`~/.bashrc`.
- With a prefix, `HOME`, `PLAYWRIGHT_BROWSERS_PATH` or `CHROMIUM_BROWSER_DIRS` containing `$(…)` or backticks, the
  substitution ran when that text was evaluated: a canary file was created in each case (prefix, browser root, `HOME`).
  A value containing `"` produced a shell syntax error instead, because the same value also lands in a `case` pattern.
- `--persist` wrote `if [ -f "<path>" ]; then . "<path>"; fi` with the path inside double quotes, so a hostile prefix
  became executable in every later login shell — a transient environment override became durable.
- Reachability requires control of the process environment (or `HOME`) of the command that runs the script, or a
  checked-in change to the startup command or a profile. No network, repository file, PR content or CLI argument
  reaches these values, and this workspace sets none of the `CHROMIUM_*`/`PLAYWRIGHT_BROWSERS_PATH` variables.

## User Scenarios & Testing

### User Story 1 — A path can never become code (Priority: P1)

An agent runs the wrapper, the startup command or a login shell in a workspace whose `HOME`, prefix or browser root
contains shell metacharacters. The environment is applied correctly and nothing in it executes.

**Why this priority**: the generated text is evaluated by three entry points and sourced by every login shell.

**Independent Test**: `--env` generated from a prefix containing `$(touch <canary>)`, backticks, `"` or `; touch …`
applies cleanly under `bash` and `sh`, exports the literal value, and creates no canary.

**Acceptance Scenarios**:

1. **Given** any of those values in `CHROMIUM_LIBS_PREFIX`, `HOME`, `PLAYWRIGHT_BROWSERS_PATH` or
   `CHROMIUM_BROWSER_DIRS`, **When** the output is evaluated, **Then** no command runs and the exported value equals the
   literal input.
2. **Given** a value with a `"` or a `;`, **When** the output is evaluated, **Then** it still parses without a syntax
   error, because the value is a quoted word rather than shell text.

### User Story 2 — Legitimate paths keep working (Priority: P1)

Ordinary paths, paths with spaces, apostrophes and glob characters are applied unchanged, and sourcing the block twice
does not duplicate `LD_LIBRARY_PATH`.

**Independent Test**: the existing detection suite passes, and `--env` for `…/a legit prefix (v2) #1 + more` and
`…/o'brien/chromium-libs` exports those exact strings under `sh` and `bash`.

### User Story 3 — Persistence stays inert (Priority: P1)

`--persist` still writes `env.sh` and the guarded profile block, and sourcing either executes nothing but the
assignments.

**Independent Test**: `--persist` with a hostile prefix passes `check_libs`, writes both profile blocks and `env.sh`,
and a login shell sourcing either creates no canary while exporting the literal paths.

### Edge Cases

- A system runtime exports nothing; `--env` stays empty and `eval` of an empty string is still a no-op.
- The `--check-libs`/`--check`/`--browser-root` outputs are printed, never evaluated, so their format is unchanged.

## Requirements

- **FR-001**: Every value in the `--env` output MUST be emitted as a single-quoted POSIX shell word.
- **FR-002**: The `LD_LIBRARY_PATH` dedupe MUST keep working and MUST NOT turn a value into a pattern; the output MUST
  stay POSIX-compatible because `~/.profile` may be read by `sh`.
- **FR-003**: `--persist` MUST write the `~/.profile`/`~/.bashrc` source line with the path quoted as a word.
- **FR-004**: Spaces, apostrophes, `#`, `(`, `)` and other ordinary path characters MUST round-trip unchanged.
- **FR-005**: The documented startup command, the wrapper's contract, the exported format users rely on (`eval` and
  sourcing) and the `--persist` artifacts MUST be preserved.
- **FR-006**: Regression tests MUST cover hostile values in all four inputs, spaces, an apostrophe, idempotency,
  POSIX parsing and both `--persist` paths.

## Success Criteria

- **SC-001**: No canary is created for any hostile payload in any of the four inputs, under `bash` or `sh`.
- **SC-002**: The literal value is exported for every hostile payload, so hardening does not silently drop a path.
- **SC-003**: The detection, wrapper and shell-safety suites pass and `bash -n` accepts both scripts.

## Assumptions

- Single quoting is the whole fix: it accepts every character a path can contain, so no allowlist is needed and no
  legitimate workspace is rejected.
- The only consumers are the two `eval`s and the sourced `env.sh`; the Playwright CLI config is JSON, not shell.
