# Feature Specification: Playwright Workspace Hardening

**Feature Branch**: `freebuff/78543caa3c21f40958fc74d4`

**Created**: 2026-11-12

**Status**: Implemented

**Input**: Owner request to implement the three hardening fixes identified while verifying that the repository's Playwright setup works from a cold Freebuff Cloud workspace.

## Context

A verification assessment confirmed the documented workflow works from a cold workspace (41 s to a probed browser,
live site loaded, full-page screenshot captured). It also found three failure points that do not block today's
workflow but would break or mislead a later task:

1. `scripts/playwright-cli.sh` sources `scripts/bootstrap-pnpm.sh` only when `node_modules/.bin/playwright` is missing,
   yet it always executes a `pnpm` command. With dependencies installed and `pnpm` absent from `PATH` (a scrubbed or
   `env -i` shell, where pnpm lives only in `$HOME/.local/bin`) the wrapper exits 127 with `pnpm: not found`.
2. The wrapper decides whether to install Chromium with `compgen -G "$HOME/.cache/ms-playwright/chromium-*"`, which
   matches any revision. After a Playwright version bump the stale cache satisfies the glob, the install is skipped,
   and the next launch fails with `Executable doesn't exist at …/chromium-<new pin>`. The strict revision check already
   exists in `setup-chromium-libs.sh --browser-root`; the wrapper does not use it.
3. `playwright.config.ts` only overrides `FONTCONFIG_FILE`/`FONTCONFIG_PATH` when they are unset. A workspace shell can
   inherit values pointing at another chat's home; because the path does not exist, fontconfig falls back to a
   Geist-only configuration and local visual runs lose the provisioned DejaVu/Liberation fonts.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The wrapper works in any shell that has the workspace (Priority: P1)

An agent runs `./scripts/playwright-cli.sh <command>` from a non-interactive shell whose `PATH` does not include
`$HOME/.local/bin`, with dependencies already installed. The command runs instead of failing on `pnpm: not found`.

**Why this priority**: this is the only one of the three defects that fails hard, and it fails in exactly the shells
agents use.

**Independent Test**: `env -i HOME="$HOME" PATH=/usr/local/bin:/usr/bin:/bin ./scripts/playwright-cli.sh --raw list`
exits 0 and reports sessions instead of `exec: pnpm: not found`.

**Acceptance Scenarios**:

1. **Given** installed dependencies and a `PATH` without `$HOME/.local/bin`, **When** the wrapper runs any CLI command,
   **Then** it resolves the pinned pnpm and executes the command.
2. **Given** a workspace with no dependencies, **When** the wrapper runs, **Then** it still bootstrap-installs the frozen
   dependency tree before the browser steps.

---

### User Story 2 - A Playwright version bump repairs the browser automatically (Priority: P1)

After `playwright`/`@playwright/test` is upgraded, the first wrapper call downloads the newly pinned Chromium instead of
launching from a stale cache and failing.

**Why this priority**: it is silent today and would surface as an unrelated-looking launch crash in a future task.

**Independent Test**: with only a foreign-revision directory under the browser root, the wrapper's browser step runs
`pnpm exec playwright install chromium` rather than skipping it.

**Acceptance Scenarios**:

1. **Given** a browser root holding only a different Chromium revision, **When** the wrapper runs, **Then** it installs
   the pinned revision before launching.
2. **Given** the pinned revision is already launchable, **When** the wrapper runs, **Then** no download occurs and the
   command is as fast as before.

---

### User Story 3 - Inherited stale font configuration is repaired for test runs (Priority: P2)

A `playwright test` run from a shell that carries `FONTCONFIG_FILE`/`FONTCONFIG_PATH` from another workspace uses the
provisioned font set, and a genuinely valid inherited configuration is still honoured.

**Why this priority**: launches already succeed; only font fidelity and visual baselines are affected.

**Independent Test**: importing `playwright.config.ts` with a nonexistent inherited `FONTCONFIG_FILE` yields the prefix
config; with an existing one it is preserved unchanged.

**Acceptance Scenarios**:

1. **Given** `FONTCONFIG_FILE` names a path that does not exist, **When** the config loads, **Then** both variables point
   at the provisioned prefix.
2. **Given** `FONTCONFIG_FILE` names an existing file, **When** the config loads, **Then** it is left untouched.

### Edge Cases

- A system-wide runtime (no private prefix) keeps the existing behaviour: the runtime block returns early and non-Linux
  platforms are unaffected.
- An environment-provided read-only browser root that matches the pin is still reuse-only; `--browser-root` owns that
  decision, so the wrapper inherits it instead of duplicating it.
- The wrapper must not double-install when both the pin and the cache agree; `--browser-root` returning 0 is the only
  signal that skips the download.

## Requirements

- **FR-001**: `scripts/playwright-cli.sh` MUST resolve the pinned pnpm unconditionally, before it decides whether to
  install dependencies.
- **FR-002**: `scripts/playwright-cli.sh` MUST skip the Chromium download only when
  `scripts/setup-chromium-libs.sh --browser-root` confirms the pinned revision is installed.
- **FR-003**: `playwright.config.ts` MUST treat an inherited `FONTCONFIG_FILE`/`FONTCONFIG_PATH` as usable only when it
  exists, and MUST fall back to the provisioned prefix otherwise.
- **FR-004**: The dry-run output, explicit `--browser` handling and `test` passthrough of the wrapper MUST be unchanged.
- **FR-005**: No dependency, lockfile, workflow, hosting, secret or `AGENTS.md` change.
- **FR-006**: The wrapper's new decisions MUST be guarded by tests, and the fontconfig behaviour MUST be covered by a
  test that loads the real config module.

## Success Criteria

- **SC-001**: A scrubbed-`PATH` invocation of the wrapper executes a CLI command with exit 0.
- **SC-002**: With the pinned browser present the wrapper performs no download and returns the live site title in a few
  seconds; with only a foreign revision it installs the pin first.
- **SC-003**: The focused tests covering the wrapper and the config pass, and `./freebuff-verify.sh` passes.
- **SC-004**: The production build stays strictly below 495 MiB.

## Assumptions

- `scripts/setup-chromium-libs.sh --browser-root` remains the single source of truth for "is the pinned browser here".
- The wrapper may run `bootstrap-pnpm.sh` on every call; the script is idempotent and only installs pnpm when the pinned
  version is absent.
- A `FONTCONFIG_FILE`/`FONTCONFIG_PATH` whose path does not exist cannot be a usable configuration, so replacing it is
  safe.
